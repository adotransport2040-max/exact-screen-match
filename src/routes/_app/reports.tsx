import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card } from "@/components/ui-kit";
import { format, subDays, subMonths, startOfMonth } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({ component: ReportsPage });

type Range = "weekly" | "monthly" | "yearly";

function ReportsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [range, setRange] = useState<Range>("weekly");

  const days = range === "weekly" ? 7 : range === "monthly" ? 30 : 365;

  useEffect(() => {
    if (!user) return;
    const since = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
    Promise.all([
      supabase.from("daily_logs").select("*").eq("user_id", user.id).gte("log_date", since).order("log_date"),
      supabase.from("tasks").select("*").eq("user_id", user.id).gte("task_date", since),
    ]).then(([l, t]) => { setLogs(l.data ?? []); setTasks(t.data ?? []); });
  }, [user, days]);

  const totals = useMemo(() => ({
    study: logs.reduce((s, l) => s + Number(l.study_hours || 0), 0),
    work: logs.reduce((s, l) => s + Number(l.work_hours || 0), 0),
    happy: logs.filter(l => l.mood === "happy").length,
    tasksDone: tasks.filter(t => t.completed).length,
    tasksTotal: tasks.length,
  }), [logs, tasks]);

  const focusMin = (totals.study + totals.work) * 60;
  const focusH = Math.floor(focusMin / 60);
  const focusM = Math.round(focusMin % 60);
  const productivity = Math.min(100, Math.round(((totals.study + totals.work) / (days * 6)) * 100));

  // Sparkline series — life score per day
  const sparkSeries = useMemo(() => Array.from({ length: Math.min(days, 30) }).map((_, i) => {
    const idx = Math.min(days, 30) - 1 - i;
    const d = format(subDays(new Date(), idx), "yyyy-MM-dd");
    const l = logs.find(x => x.log_date === d);
    const moodBoost = l?.mood === "happy" ? 10 : l?.mood === "stressed" ? -10 : 0;
    return { v: 50 + (Number(l?.study_hours ?? 0) + Number(l?.work_hours ?? 0)) * 5 + moodBoost };
  }), [logs, days]);

  const focusSeries = useMemo(() => sparkSeries.map(x => ({ v: x.v / 1.5 + 20 })), [sparkSeries]);
  const tasksSeries = useMemo(() => sparkSeries.map(x => ({ v: x.v * 0.3 + 5 })), [sparkSeries]);
  const prodSeries = useMemo(() => sparkSeries.map(x => ({ v: x.v - 10 })), [sparkSeries]);

  const lifeScore = Math.max(0, Math.min(100, Math.round(50 + (totals.study + totals.work) / Math.max(1, logs.length) * 8 + totals.happy * 2)));

  const exportCSV = () => {
    const rows = [["date", "study", "work", "screen", "mood"]];
    logs.forEach(l => rows.push([l.log_date, l.study_hours, l.work_hours, l.screen_time, l.mood ?? ""]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `report-${range}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const dateRangeLabel = range === "weekly"
    ? `${format(subDays(new Date(), 6), "MMM d")} - ${format(new Date(), "MMM d, yyyy")}`
    : range === "monthly" ? format(startOfMonth(new Date()), "MMMM yyyy")
    : `${format(subMonths(new Date(), 11), "MMM yyyy")} - ${format(new Date(), "MMM yyyy")}`;

  return (
    <div>
      <PageHeader title="Reports"
        action={<button onClick={exportCSV} className="flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-xs font-semibold hover:bg-accent">
          <Download className="h-3.5 w-3.5" /> CSV
        </button>} />

      {/* Range tabs */}
      <div className="flex border-b text-sm font-medium">
        {(["weekly", "monthly", "yearly"] as Range[]).map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`flex-1 py-2.5 capitalize transition ${range === r ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="mt-3 text-center text-xs text-muted-foreground">{dateRangeLabel}</div>

      {/* 4 sparkline cards */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <SparkCard label="Life Score" value={lifeScore} suffix="/100" data={sparkSeries} color="var(--color-success)" />
        <SparkCard label="Total Focus Time" value={`${focusH}h ${focusM}m`} data={focusSeries} color="var(--color-primary)" />
        <SparkCard label="Tasks Completed" value={totals.tasksDone} suffix={`/${totals.tasksTotal || 0}`} data={tasksSeries} color="var(--color-chart-2)" />
        <SparkCard label="Productivity" value={`${productivity}%`} data={prodSeries} color="var(--color-warning)" />
      </div>
    </div>
  );
}

function SparkCard({ label, value, suffix, data, color }: { label: string; value: string | number; suffix?: string; data: { v: number }[]; color: string }) {
  const id = `sg-${label.replace(/\s/g, "")}`;
  return (
    <Card className="!p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-0.5">
        <span className="text-xl font-bold">{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
      <div className="mt-2 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip contentStyle={{ display: "none" }} />
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${id})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

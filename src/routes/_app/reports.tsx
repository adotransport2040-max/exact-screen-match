import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card } from "@/components/ui-kit";
import { format, subDays, subMonths, startOfMonth } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Download, Sparkles, Clock, CheckCircle2, TrendingUp, Smile, Flame, Target } from "lucide-react";

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

  const MOOD_SCORE: Record<string, number> = {
    ecstatic: 5, happy: 4, calm: 4, loved: 4, neutral: 3, tired: 2, sad: 2, stressed: 1, angry: 1, sick: 1,
  };

  const totals = useMemo(() => ({
    study: logs.reduce((s, l) => s + Number(l.study_hours || 0), 0),
    work: logs.reduce((s, l) => s + Number(l.work_hours || 0), 0),
    happy: logs.filter(l => (MOOD_SCORE[l.mood ?? ""] ?? 0) >= 4).length,
    tasksDone: tasks.filter(t => t.completed).length,
    tasksTotal: tasks.length,
    avgMood: logs.length ? logs.reduce((s, l) => s + (MOOD_SCORE[l.mood ?? ""] ?? 0), 0) / Math.max(1, logs.filter(l => l.mood).length) : 0,
  }), [logs, tasks]);

  const focusMin = (totals.study + totals.work) * 60;
  const focusH = Math.floor(focusMin / 60);
  const focusM = Math.round(focusMin % 60);
  const productivity = Math.min(100, Math.round(((totals.study + totals.work) / (days * 6)) * 100));
  const completion = totals.tasksTotal ? Math.round((totals.tasksDone / totals.tasksTotal) * 100) : 0;

  // Streak (consecutive days with study or work)
  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < days; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const l = logs.find(x => x.log_date === d);
      if (l && (Number(l.study_hours) + Number(l.work_hours)) > 0) s++;
      else break;
    }
    return s;
  }, [logs, days]);

  const sparkSeries = useMemo(() => Array.from({ length: Math.min(days, 30) }).map((_, i) => {
    const idx = Math.min(days, 30) - 1 - i;
    const d = format(subDays(new Date(), idx), "yyyy-MM-dd");
    const l = logs.find(x => x.log_date === d);
    const moodScore = MOOD_SCORE[l?.mood ?? ""] ?? 0;
    return { v: 50 + (Number(l?.study_hours ?? 0) + Number(l?.work_hours ?? 0)) * 5 + (moodScore - 3) * 5 };
  }), [logs, days]);

  const focusSeries = useMemo(() => sparkSeries.map(x => ({ v: x.v / 1.5 + 20 })), [sparkSeries]);
  const tasksSeries = useMemo(() => sparkSeries.map(x => ({ v: Math.max(0, x.v * 0.3 + 5) })), [sparkSeries]);
  const prodSeries = useMemo(() => sparkSeries.map(x => ({ v: Math.max(0, x.v - 10) })), [sparkSeries]);

  // Daily focus bars (last N days)
  const barData = useMemo(() => Array.from({ length: Math.min(days, 14) }).map((_, i) => {
    const idx = Math.min(days, 14) - 1 - i;
    const d = subDays(new Date(), idx);
    const key = format(d, "yyyy-MM-dd");
    const l = logs.find(x => x.log_date === key);
    return {
      day: format(d, "EEE"),
      study: Number(l?.study_hours ?? 0),
      work: Number(l?.work_hours ?? 0),
    };
  }), [logs, days]);

  const lifeScore = Math.max(0, Math.min(100, Math.round(
    50
    + ((totals.study + totals.work) / Math.max(1, logs.length)) * 6
    + (totals.avgMood - 3) * 8
    + (completion / 5)
  )));

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
    ? `${format(subDays(new Date(), 6), "MMM d")} – ${format(new Date(), "MMM d, yyyy")}`
    : range === "monthly" ? format(startOfMonth(new Date()), "MMMM yyyy")
    : `${format(subMonths(new Date(), 11), "MMM yyyy")} – ${format(new Date(), "MMM yyyy")}`;

  const grade = lifeScore >= 85 ? "A+" : lifeScore >= 75 ? "A" : lifeScore >= 65 ? "B" : lifeScore >= 50 ? "C" : "D";
  const gradeMsg = lifeScore >= 75 ? "Excellent rhythm — keep it going!" : lifeScore >= 60 ? "Solid week. Small tweaks = big gains." : "Reset and rebuild — one habit at a time.";

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

      {/* Hero — Life Score */}
      <div className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-90">
              <Sparkles className="h-3 w-3" /> Life Score
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight">{lifeScore}</span>
              <span className="text-sm opacity-90">/ 100</span>
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{grade}</span>
            </div>
            <p className="mt-1 text-xs opacity-90">{gradeMsg}</p>
            <p className="mt-0.5 text-[11px] opacity-75">{dateRangeLabel}</p>
          </div>
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Flame className="h-9 w-9" />
            <div className="absolute mt-12 text-[10px] font-bold">{streak}d streak</div>
          </div>
        </div>
        {/* Mini sparkline */}
        <div className="relative mt-4 h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkSeries}>
              <defs>
                <linearGradient id="hero-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="white" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="white" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="white" strokeWidth={2} fill="url(#hero-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI grid */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <SparkCard label="Focus Time" value={`${focusH}h ${focusM}m`} icon={Clock} data={focusSeries} color="var(--color-primary)" />
        <SparkCard label="Tasks Done" value={totals.tasksDone} suffix={`/${totals.tasksTotal || 0}`} icon={CheckCircle2} data={tasksSeries} color="var(--color-success)" />
        <SparkCard label="Productivity" value={`${productivity}%`} icon={TrendingUp} data={prodSeries} color="var(--color-warning)" />
        <SparkCard label="Avg Mood" value={totals.avgMood ? totals.avgMood.toFixed(1) : "—"} suffix="/5" icon={Smile} data={sparkSeries} color="var(--color-chart-2)" />
      </div>

      {/* Daily focus bars */}
      <Card className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Daily Focus Mix</h3>
          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary" /> Study</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-success" /> Work</span>
          </div>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ left: -20, right: 4, top: 6 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={20} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="study" stackId="a" fill="var(--color-primary)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="work" stackId="a" fill="var(--color-success)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Insight cards */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InsightTile icon={Target} title="Task Completion" value={`${completion}%`} hint={`${totals.tasksDone} of ${totals.tasksTotal || 0} tasks finished`} color="var(--color-success)" />
        <InsightTile icon={Flame} title="Active Streak" value={`${streak} days`} hint="Consecutive days with study or work" color="var(--color-destructive)" />
        <InsightTile icon={Clock} title="Daily Avg Focus" value={`${(((totals.study + totals.work) / Math.max(1, days))).toFixed(1)}h`} hint="Average across the period" color="var(--color-primary)" />
        <InsightTile icon={Smile} title="Good Mood Days" value={totals.happy} hint="Days you felt happy or better" color="var(--color-warning)" />
      </div>
    </div>
  );
}

function SparkCard({ label, value, suffix, icon: Icon, data, color }: { label: string; value: string | number; suffix?: string; icon: any; data: { v: number }[]; color: string }) {
  const id = `sg-${label.replace(/\s/g, "")}`;
  return (
    <Card className="!p-4 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-1 flex items-baseline gap-0.5">
        <span className="text-xl font-bold">{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
      <div className="mt-2 h-12 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.55} />
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

function InsightTile({ icon: Icon, title, value, hint, color }: { icon: any; title: string; value: string | number; hint: string; color: string }) {
  return (
    <Card className="!p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-muted-foreground">{title}</div>
          <div className="text-lg font-bold">{value}</div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </div>
    </Card>
  );
}

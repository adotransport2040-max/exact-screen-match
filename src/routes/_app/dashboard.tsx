import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card } from "@/components/ui-kit";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { BookOpen, Briefcase, Smartphone, Smile } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

type Log = { log_date: string; study_hours: number; work_hours: number; screen_time: number; mood: string | null };
type Task = { completed: boolean; duration_minutes: number; task_date: string };

const MOOD_EMOJI: Record<string, string> = { happy: "😊", neutral: "😐", stressed: "😣" };

function Dashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user) return;
    const since = format(subDays(startOfDay(new Date()), 6), "yyyy-MM-dd");
    supabase.from("daily_logs").select("log_date,study_hours,work_hours,screen_time,mood")
      .eq("user_id", user.id).gte("log_date", since).order("log_date").then(({ data }) => setLogs(data ?? []));
    supabase.from("tasks").select("completed,duration_minutes,task_date")
      .eq("user_id", user.id).gte("task_date", since).then(({ data }) => setTasks(data ?? []));
  }, [user]);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayLog = logs.find(l => l.log_date === today);

  const series = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const l = logs.find(x => x.log_date === d);
    return { day: format(subDays(new Date(), 6 - i), "EEE"), value: Number(l?.study_hours ?? 0) + Number(l?.work_hours ?? 0) };
  }), [logs]);

  const lifeScore = useMemo(() => {
    const avgProd = series.reduce((s, x) => s + x.value, 0) / 7;
    const moodCount = logs.filter(l => l.mood === "happy").length;
    const avgScreen = logs.reduce((s, l) => s + Number(l.screen_time || 0), 0) / Math.max(1, logs.length);
    return Math.max(0, Math.min(100, Math.round(avgProd * 8 + moodCount * 4 - Math.max(0, avgScreen - 4) * 5 + 30)));
  }, [series, logs]);

  const peakDay = series.reduce((m, x) => x.value > m.value ? x : m, series[0] ?? { value: 0 });
  const ringDeg = (lifeScore / 100) * 360;
  const name = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div>
      <PageHeader title={`Good morning, ${name} 👋`} subtitle="Here's your summary for today." />

      {/* Life Score ring */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Life Score</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gradient">{lifeScore}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Great job! Keep it up.</div>
          </div>
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(var(--color-primary) ${ringDeg}deg, var(--color-accent) 0)` }} />
            <div className="absolute inset-2 grid place-items-center rounded-full bg-card text-sm font-bold">{lifeScore}%</div>
          </div>
        </div>
      </Card>

      {/* Today's Summary */}
      <Card className="mt-4">
        <h3 className="mb-3 text-sm font-semibold">Today's Summary</h3>
        <div className="space-y-2">
          <SummaryRow icon={BookOpen} tone="text-success bg-success/10" label="Study Hours" value={`${Number(todayLog?.study_hours ?? 0)} hrs`} />
          <SummaryRow icon={Briefcase} tone="text-primary bg-primary/10" label="Work Hours" value={`${Number(todayLog?.work_hours ?? 0)} hrs`} />
          <SummaryRow icon={Smartphone} tone="text-warning bg-warning/10" label="Screen Time" value={`${Number(todayLog?.screen_time ?? 0)} hrs`} />
          <SummaryRow icon={Smile} tone="text-chart-4 bg-chart-4/10" label="Mood" value={todayLog?.mood ? `${MOOD_EMOJI[todayLog.mood]} ${todayLog.mood}` : "—"} />
        </div>
      </Card>

      {/* Weekly bar chart */}
      <Card className="mt-4">
        <h3 className="mb-3 text-sm font-semibold">Weekly Overview</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function SummaryRow({ icon: Icon, tone, label, value }: { icon: any; tone: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-2.5">
      <div className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
      <div className="flex-1 text-sm font-medium">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card } from "@/components/ui-kit";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import {
  BookOpen, Briefcase, Smartphone, Smile, ListChecks, Wallet, NotebookPen, Sparkles,
  TrendingUp, Flame, Trophy, LifeBuoy, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

type Log = { log_date: string; study_hours: number; work_hours: number; screen_time: number; mood: string | null };
type Task = { completed: boolean; duration_minutes: number; task_date: string };

const MOOD_EMOJI: Record<string, string> = { happy: "😊", neutral: "😐", stressed: "😣" };

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

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
  const todayTasks = tasks.filter(t => t.task_date === today);
  const doneToday = todayTasks.filter(t => t.completed).length;

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

  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      if (logs.find(l => l.log_date === d)) s++; else break;
    }
    return s;
  }, [logs]);

  const peakDay = series.reduce((m, x) => x.value > m.value ? x : m, series[0] ?? { day: "—", value: 0 });
  const ringDeg = (lifeScore / 100) * 360;
  const name = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div>
      <PageHeader title={`${greet()}, ${name} 👋`} subtitle="Here's your snapshot for today." />

      {/* HERO — Life Score */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur">
              <Sparkles className="h-3 w-3" /> Life Score
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight">{lifeScore}</span>
              <span className="text-sm opacity-80">/ 100</span>
            </div>
            <div className="mt-1 text-sm opacity-90">
              {lifeScore >= 75 ? "Outstanding rhythm — keep it up!" : lifeScore >= 50 ? "Solid week. Small wins compound." : "Tiny steps today, big shifts tomorrow."}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur"><Flame className="h-3 w-3" /> {streak}-day streak</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur"><Trophy className="h-3 w-3" /> Peak: {peakDay.day} ({peakDay.value}h)</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur"><ListChecks className="h-3 w-3" /> {doneToday}/{todayTasks.length} tasks today</span>
            </div>
          </div>
          <div className="relative h-28 w-28 shrink-0">
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(rgba(255,255,255,0.95) ${ringDeg}deg, rgba(255,255,255,0.18) 0)` }} />
            <div className="absolute inset-2 grid place-items-center rounded-full bg-card text-foreground">
              <div className="text-center">
                <div className="text-xl font-extrabold">{lifeScore}%</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">today</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: "/assistant", label: "Helper", icon: LifeBuoy, tone: "from-chart-2 to-chart-3" },
          { to: "/tasks", label: "Tasks", icon: ListChecks, tone: "from-primary to-chart-4" },
          { to: "/expenses", label: "Expenses", icon: Wallet, tone: "from-chart-5 to-warning" },
          { to: "/notes", label: "Notes", icon: NotebookPen, tone: "from-success to-chart-2" },
        ].map(({ to, label, icon: Icon, tone }) => (
          <Link key={to} to={to} className="group rounded-2xl border bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-elegant">
            <div className={`mb-2 grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${tone} text-primary-foreground`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
          </Link>
        ))}
      </div>

      {/* Today's Summary */}
      <Card className="mt-4">
        <h3 className="mb-3 text-sm font-semibold">Today's Summary</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <SummaryRow icon={BookOpen} tone="text-success bg-success/10" label="Study Hours" value={`${Number(todayLog?.study_hours ?? 0)} hrs`} />
          <SummaryRow icon={Briefcase} tone="text-primary bg-primary/10" label="Work Hours" value={`${Number(todayLog?.work_hours ?? 0)} hrs`} />
          <SummaryRow icon={Smartphone} tone="text-warning bg-warning/10" label="Screen Time" value={`${Number(todayLog?.screen_time ?? 0)} hrs`} />
          <SummaryRow icon={Smile} tone="text-chart-4 bg-chart-4/10" label="Mood" value={todayLog?.mood ? `${MOOD_EMOJI[todayLog.mood]} ${todayLog.mood}` : "—"} />
        </div>
      </Card>

      {/* Weekly chart */}
      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Weekly Productivity</h3>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><TrendingUp className="h-3 w-3" /> last 7 days</span>
        </div>
        <div className="h-48">
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
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
      <div className="flex-1 text-sm font-medium">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

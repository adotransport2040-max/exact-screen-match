import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card } from "@/components/ui-kit";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid, YAxis } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/mood")({ component: MoodPage });

const MOODS = [
  { key: "ecstatic", emoji: "🤩", label: "Ecstatic", score: 5 },
  { key: "happy", emoji: "😊", label: "Happy", score: 4 },
  { key: "calm", emoji: "😌", label: "Calm", score: 4 },
  { key: "loved", emoji: "🥰", label: "Loved", score: 4 },
  { key: "neutral", emoji: "😐", label: "Neutral", score: 3 },
  { key: "tired", emoji: "😴", label: "Tired", score: 2 },
  { key: "sad", emoji: "😢", label: "Sad", score: 2 },
  { key: "stressed", emoji: "😣", label: "Stressed", score: 1 },
  { key: "angry", emoji: "😡", label: "Angry", score: 1 },
  { key: "sick", emoji: "🤒", label: "Sick", score: 1 },
] as const;

const MOOD_EMOJI: Record<string, string> = Object.fromEntries(MOODS.map(m => [m.key, m.emoji]));
const MOOD_SCORE: Record<string, number> = Object.fromEntries(MOODS.map(m => [m.key, m.score]));

function MoodPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<{ log_date: string; mood: string | null; study_hours: number; work_hours: number }[]>([]);
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    const since = format(subDays(new Date(), 60), "yyyy-MM-dd");
    supabase.from("daily_logs").select("log_date,mood,study_hours,work_hours")
      .eq("user_id", user.id).gte("log_date", since).order("log_date")
      .then(({ data }) => setLogs(data ?? []));
  }, [user]);

  const setMood = async (mood: string) => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    setLogs(prev => {
      const ex = prev.find(l => l.log_date === today);
      if (ex) return prev.map(l => l.log_date === today ? { ...l, mood } : l);
      return [...prev, { log_date: today, mood, study_hours: 0, work_hours: 0 }];
    });
    const { error } = await supabase.from("daily_logs").upsert({ user_id: user.id, log_date: today, mood }, { onConflict: "user_id,log_date" });
    if (error) toast.error(error.message); else toast.success("Mood saved");
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const todayMood = logs.find(l => l.log_date === today)?.mood;

  // Calendar grid
  const days = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  }), [month]);

  const moodByDate = useMemo(() => {
    const m: Record<string, string | null> = {};
    logs.forEach(l => { m[l.log_date] = l.mood; });
    return m;
  }, [logs]);

  // Mood vs Productivity (last 7 days)
  const chart = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const l = logs.find(x => x.log_date === d);
    const moodScore = l?.mood ? (MOOD_SCORE[l.mood] ?? 0) : 0;
    return {
      day: format(subDays(new Date(), 6 - i), "MMM d"),
      mood: moodScore,
      productivity: Number(l?.study_hours ?? 0) + Number(l?.work_hours ?? 0),
    };
  }), [logs]);

  return (
    <div>
      <PageHeader title="Mood Tracker" subtitle="How are you feeling today?" />

      <Card>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
          {MOODS.map(m => (
            <button key={m.key} onClick={() => setMood(m.key)}
              title={m.label}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-3 transition active:scale-95 ${
                todayMood === m.key ? "border-primary bg-accent shadow-elegant" : "hover:bg-accent"
              }`}>
              <span className="text-2xl sm:text-3xl">{m.emoji}</span>
              <span className="text-[10px] font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Calendar with mood emoji per day */}
      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setMonth(subMonths(month, 1))} className="rounded-lg p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
          <div className="text-sm font-semibold">{format(month, "MMMM yyyy")}</div>
          <button onClick={() => setMonth(addMonths(month, 1))} className="rounded-lg p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(d => {
            const inMonth = isSameMonth(d, month);
            const isToday = isSameDay(d, new Date());
            const m = moodByDate[format(d, "yyyy-MM-dd")];
            return (
              <div key={d.toISOString()}
                className={`relative grid aspect-square place-items-center rounded-xl text-xs ${
                  isToday ? "bg-gradient-primary text-primary-foreground font-bold" : inMonth ? "bg-secondary/40" : "opacity-40"
                }`}>
                <span>{format(d, "d")}</span>
                {m && <span className="absolute bottom-0.5 text-base leading-none">{MOOD_EMOJI[m]}</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-center gap-4 text-[11px] text-muted-foreground">
          {MOODS.map(m => <span key={m.key} className="flex items-center gap-1"><span>{m.emoji}</span>{m.label}</span>)}
        </div>
      </Card>

      {/* Mood vs Productivity dual line */}
      <Card className="mt-4">
        <h3 className="mb-3 text-sm font-semibold">Mood vs Productivity</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={20} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="mood" stroke="var(--color-success)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="productivity" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Mood</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Productivity</span>
        </div>
      </Card>
    </div>
  );
}

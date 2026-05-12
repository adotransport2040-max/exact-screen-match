import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, ListChecks, Wallet, NotebookPen, CalendarDays, Smile,
  Clock, Smartphone, Check, Pencil, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { format, parseISO, addDays, subDays, isValid } from "date-fns";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/_app/insights/$date")({ component: DayDetailPage });

const MOODS = [
  { v: "happy", e: "😊" }, { v: "neutral", e: "😐" }, { v: "tired", e: "😴" },
  { v: "stressed", e: "😣" }, { v: "sad", e: "😢" },
];
const moodEmoji = (m?: string | null) => MOODS.find(x => x.v === m)?.e ?? "·";

function DayDetailPage() {
  const { date: dateParam } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { format: money } = useCurrency();

  const date = useMemo(() => {
    const d = parseISO(dateParam);
    return isValid(d) ? d : new Date();
  }, [dateParam]);
  const dateKey = format(date, "yyyy-MM-dd");

  const [log, setLog] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);

  const refresh = async () => {
    if (!user) return;
    const [l, t, e, ev, n] = await Promise.all([
      supabase.from("daily_logs").select("*").eq("user_id", user.id).eq("log_date", dateKey).maybeSingle(),
      supabase.from("tasks").select("*").eq("user_id", user.id).eq("task_date", dateKey),
      supabase.from("expenses").select("*").eq("user_id", user.id).eq("expense_date", dateKey),
      supabase.from("planner_events").select("*").eq("user_id", user.id).eq("event_date", dateKey).order("event_time", { ascending: true }),
      supabase.from("notes").select("*").eq("user_id", user.id).gte("created_at", `${dateKey}T00:00:00`).lte("created_at", `${dateKey}T23:59:59`),
    ]);
    setLog(l.data ?? null);
    setTasks(t.data ?? []); setExpenses(e.data ?? []);
    setEvents(ev.data ?? []); setNotes(n.data ?? []);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user, dateKey]);

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const completedTasks = tasks.filter(t => t.completed).length;
  const isEmpty = !log && tasks.length + expenses.length + events.length + notes.length === 0;

  const goTo = (d: Date) => navigate({ to: "/insights/$date", params: { date: format(d, "yyyy-MM-dd") } });

  const moveDay = async (newDate: Date) => {
    if (!user) return;
    const newKey = format(newDate, "yyyy-MM-dd");
    if (newKey === dateKey) { setEditing(false); return; }
    await Promise.all([
      supabase.from("tasks").update({ task_date: newKey }).eq("user_id", user.id).eq("task_date", dateKey),
      supabase.from("expenses").update({ expense_date: newKey }).eq("user_id", user.id).eq("expense_date", dateKey),
      supabase.from("planner_events").update({ event_date: newKey }).eq("user_id", user.id).eq("event_date", dateKey),
      supabase.from("daily_logs").update({ log_date: newKey }).eq("user_id", user.id).eq("log_date", dateKey),
    ]);
    setEditing(false);
    goTo(newDate);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link to="/insights" className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-medium hover:bg-accent">
          <ArrowLeft className="h-4 w-4" /> Calendar
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={() => goTo(subDays(date, 1))} className="rounded-xl border bg-card p-2 hover:bg-accent" aria-label="Previous day"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => goTo(addDays(date, 1))} className="rounded-xl border bg-card p-2 hover:bg-accent" aria-label="Next day"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Hero */}
      <div className="rounded-3xl border bg-gradient-primary p-5 text-primary-foreground shadow-elegant sm:p-6">
        <div className="text-xs font-medium uppercase tracking-widest opacity-80">{format(date, "EEEE")}</div>
        <div className="mt-1 flex items-end justify-between gap-4">
          <div>
            <div className="text-4xl font-bold leading-none sm:text-5xl">{format(date, "d")}</div>
            <div className="mt-1 text-sm opacity-90 sm:text-base">{format(date, "MMMM yyyy")}</div>
          </div>
          <button onClick={() => setEditing(true)} className="rounded-xl bg-white/15 p-2 backdrop-blur hover:bg-white/25 transition" title="Move date">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Mini icon={ListChecks} value={`${completedTasks}/${tasks.length}`} label="Tasks" />
          <Mini icon={Wallet} value={money(totalExpenses)} label="Spent" />
          <Mini icon={CalendarDays} value={String(events.length)} label="Events" />
          <Mini icon={NotebookPen} value={String(notes.length)} label="Notes" />
        </div>
      </div>

      {isEmpty && (
        <div className="rounded-2xl border border-dashed bg-card/40 p-10 text-center text-sm text-muted-foreground">
          Nothing was logged on this day.
        </div>
      )}

      {log && (
        <Section title="Daily Log" icon={Smile}>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Stat icon={Clock} value={`${log.study_hours}h`} label="Study" />
            <Stat icon={Clock} value={`${log.work_hours}h`} label="Work" />
            <Stat icon={Smartphone} value={`${log.screen_time}h`} label="Screen" />
          </div>
          {log.mood && <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent/40 px-3 py-2 text-sm"><span className="text-lg">{moodEmoji(log.mood)}</span><span className="capitalize">{log.mood}</span></div>}
          {log.note && <p className="mt-2 rounded-xl bg-accent/40 px-3 py-2 text-xs italic text-muted-foreground">"{log.note}"</p>}
        </Section>
      )}

      {tasks.length > 0 && (
        <Section title="Tasks" icon={ListChecks} count={tasks.length}>
          <ul className="space-y-1.5">
            {tasks.map(t => (
              <li key={t.id} className="flex items-center gap-2 rounded-lg bg-accent/30 px-3 py-2 text-sm">
                <span className={`grid h-4 w-4 shrink-0 place-items-center rounded ${t.completed ? "bg-success text-success-foreground" : "border"}`}>
                  {t.completed && <Check className="h-3 w-3" />}
                </span>
                <span className={`flex-1 ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                {t.duration_minutes > 0 && <span className="text-xs text-muted-foreground">{t.duration_minutes}m</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {events.length > 0 && (
        <Section title="Events" icon={CalendarDays} count={events.length}>
          <ul className="space-y-1.5">
            {events.map(e => (
              <li key={e.id} className="flex items-center gap-2 rounded-lg bg-accent/30 px-3 py-2 text-sm">
                {e.event_time && <span className="font-mono text-xs text-muted-foreground">{e.event_time.slice(0,5)}</span>}
                <span className="flex-1">{e.title}</span>
                {e.completed && <Check className="h-3.5 w-3.5 text-success" />}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {expenses.length > 0 && (
        <Section title="Expenses" icon={Wallet} count={expenses.length}>
          <ul className="space-y-1.5">
            {expenses.map(e => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-accent/30 px-3 py-2 text-sm">
                <span className="min-w-0 truncate"><span className="text-muted-foreground">[{e.category}]</span> {e.description || "—"}</span>
                <span className="shrink-0 font-semibold">{money(Number(e.amount))}</span>
              </li>
            ))}
            <li className="flex items-center justify-between rounded-lg border-t pt-2 text-sm font-semibold">
              <span>Total</span><span>{money(totalExpenses)}</span>
            </li>
          </ul>
        </Section>
      )}

      {notes.length > 0 && (
        <Section title="Notes" icon={NotebookPen} count={notes.length}>
          <ul className="space-y-1.5">
            {notes.map(n => (
              <li key={n.id} className="rounded-lg bg-accent/30 px-3 py-2 text-sm">
                <div className="font-medium">{n.title}</div>
                {n.content && <div className="line-clamp-3 text-xs text-muted-foreground">{n.content}</div>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {editing && <DateEditor date={date} onClose={() => setEditing(false)} onSave={moveDay} />}
    </div>
  );
}

function Mini({ icon: Icon, value, label }: any) {
  return (
    <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
      <Icon className="mx-auto h-4 w-4 opacity-80" />
      <div className="mt-1 text-base font-bold leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: any) {
  return (
    <div className="rounded-xl bg-accent/40 p-3">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <div className="mt-1 text-base font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function Section({ title, icon: Icon, count, children }: any) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-3.5 w-3.5" /></div>
        <span className="text-sm font-semibold">{title}</span>
        {count !== undefined && <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs">{count}</span>}
      </div>
      {children}
    </div>
  );
}

function DateEditor({ date, onClose, onSave }: { date: Date; onClose: () => void; onSave: (d: Date) => void }) {
  const [val, setVal] = useState(format(date, "yyyy-MM-dd"));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-elegant" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Move day to…</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">All entries from {format(date, "MMM d, yyyy")} will move to the new date.</p>
        <input type="date" value={val} onChange={(e) => setVal(e.target.value)} className="mt-4 w-full rounded-xl border bg-background px-3 py-2 text-sm" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
          <button onClick={() => onSave(parseISO(val))} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Save</button>
        </div>
      </div>
    </div>
  );
}

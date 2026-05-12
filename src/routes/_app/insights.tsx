import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui-kit";
import {
  ChevronLeft, ChevronRight, ListChecks, Wallet, NotebookPen,
  CalendarDays, Smile, Clock, Smartphone, Plus, Check, Trash2, Pencil, X,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO,
} from "date-fns";

export const Route = createFileRoute("/_app/insights")({ component: InsightsPage });

const MOODS = [
  { v: "happy", e: "😊", label: "Happy" },
  { v: "neutral", e: "😐", label: "Neutral" },
  { v: "tired", e: "😴", label: "Tired" },
  { v: "stressed", e: "😣", label: "Stressed" },
  { v: "sad", e: "😢", label: "Sad" },
];
const moodEmoji = (m?: string | null) => MOODS.find(x => x.v === m)?.e ?? "·";

function InsightsPage() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [editingDate, setEditingDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const refresh = async () => {
    if (!user) return;
    const since = format(gridStart, "yyyy-MM-dd");
    const until = format(gridEnd, "yyyy-MM-dd");
    const [l, t, e, ev, n] = await Promise.all([
      supabase.from("daily_logs").select("*").eq("user_id", user.id).gte("log_date", since).lte("log_date", until),
      supabase.from("tasks").select("*").eq("user_id", user.id).gte("task_date", since).lte("task_date", until),
      supabase.from("expenses").select("*").eq("user_id", user.id).gte("expense_date", since).lte("expense_date", until),
      supabase.from("planner_events").select("*").eq("user_id", user.id).gte("event_date", since).lte("event_date", until),
      supabase.from("notes").select("*").eq("user_id", user.id).gte("created_at", `${since}T00:00:00`).lte("created_at", `${until}T23:59:59`),
    ]);
    setLogs(l.data ?? []); setTasks(t.data ?? []); setExpenses(e.data ?? []);
    setEvents(ev.data ?? []); setNotes(n.data ?? []);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user, cursor.getMonth(), cursor.getFullYear()]);

  const days = useMemo(() => {
    const arr: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) { arr.push(d); d = addDays(d, 1); }
    return arr;
  }, [gridStart.toISOString(), gridEnd.toISOString()]);

  const byDate = useMemo(() => {
    const map = new Map<string, { tasks: any[]; expenses: any[]; events: any[]; notes: any[]; log?: any }>();
    const ensure = (k: string) => { if (!map.has(k)) map.set(k, { tasks: [], expenses: [], events: [], notes: [] }); return map.get(k)!; };
    tasks.forEach(t => ensure(t.task_date).tasks.push(t));
    expenses.forEach(e => ensure(e.expense_date).expenses.push(e));
    events.forEach(ev => ensure(ev.event_date).events.push(ev));
    notes.forEach(n => ensure(format(parseISO(n.created_at), "yyyy-MM-dd")).notes.push(n));
    logs.forEach(l => { ensure(l.log_date).log = l; });
    return map;
  }, [tasks, expenses, events, notes, logs]);

  const sel = byDate.get(format(selected, "yyyy-MM-dd")) ?? { tasks: [], expenses: [], events: [], notes: [] };
  const totalExpenses = sel.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const completedTasks = sel.tasks.filter((t: any) => t.completed).length;

  const moveDay = async (oldDate: Date, newDate: Date) => {
    if (!user) return;
    const oldKey = format(oldDate, "yyyy-MM-dd");
    const newKey = format(newDate, "yyyy-MM-dd");
    if (oldKey === newKey) { setEditingDate(null); return; }
    await Promise.all([
      supabase.from("tasks").update({ task_date: newKey }).eq("user_id", user.id).eq("task_date", oldKey),
      supabase.from("expenses").update({ expense_date: newKey }).eq("user_id", user.id).eq("expense_date", oldKey),
      supabase.from("planner_events").update({ event_date: newKey }).eq("user_id", user.id).eq("event_date", oldKey),
      supabase.from("daily_logs").update({ log_date: newKey }).eq("user_id", user.id).eq("log_date", oldKey),
    ]);
    setSelected(newDate);
    setEditingDate(null);
    setCursor(newDate);
    refresh();
  };

  return (
    <div>
      <PageHeader title="Insights Calendar" subtitle="A live month-view of everything you do" />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Calendar */}
        <div className="rounded-3xl border bg-gradient-to-br from-card via-card to-accent/20 p-5 shadow-elegant">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{format(cursor, "yyyy")}</div>
              <h2 className="text-2xl font-bold tracking-tight">{format(cursor, "MMMM")}</h2>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCursor(subMonths(cursor, 1))} className="rounded-xl border bg-background/60 p-2 hover:bg-accent transition"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => { setCursor(new Date()); setSelected(new Date()); }} className="rounded-xl border bg-background/60 px-3 py-2 text-xs font-medium hover:bg-accent transition">Today</button>
              <button onClick={() => setCursor(addMonths(cursor, 1))} className="rounded-xl border bg-background/60 p-2 hover:bg-accent transition"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const data = byDate.get(key);
              const inMonth = isSameMonth(d, cursor);
              const isSel = isSameDay(d, selected);
              const today = isToday(d);
              const activity = (data?.tasks.length ?? 0) + (data?.expenses.length ?? 0) + (data?.events.length ?? 0) + (data?.notes.length ?? 0) + (data?.log ? 1 : 0);
              const intensity = Math.min(activity, 6);
              return (
                <button
                  key={key}
                  onClick={() => setSelected(d)}
                  onDoubleClick={() => setEditingDate(d)}
                  className={[
                    "group relative aspect-square rounded-xl border p-1.5 text-left transition-all",
                    inMonth ? "bg-background/60" : "bg-muted/20 text-muted-foreground/50",
                    isSel ? "border-primary ring-2 ring-primary/40 scale-[1.03] shadow-glow" : "border-border/60 hover:border-primary/40 hover:scale-[1.02]",
                  ].join(" ")}
                  style={intensity ? { background: `color-mix(in oklab, var(--primary) ${intensity * 8}%, var(--background))` } : undefined}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-xs font-bold ${today ? "grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground" : ""}`}>
                      {format(d, "d")}
                    </span>
                    {data?.log?.mood && <span className="text-xs leading-none">{moodEmoji(data.log.mood)}</span>}
                  </div>
                  {activity > 0 && (
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-0.5">
                      {Array.from({ length: Math.min(activity, 5) }).map((_, i) => (
                        <span key={i} className="h-1 flex-1 rounded-full bg-primary/70" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Less</span>
              {[1,2,3,4,5].map(i => <span key={i} className="h-3 w-3 rounded" style={{ background: `color-mix(in oklab, var(--primary) ${i * 14}%, var(--background))` }} />)}
              <span>More</span>
            </div>
            <span>Double-click a day to edit its date</span>
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          <div className="rounded-3xl border bg-gradient-primary p-5 text-primary-foreground shadow-elegant">
            <div className="text-xs font-medium uppercase tracking-widest opacity-80">{format(selected, "EEEE")}</div>
            <div className="mt-1 flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold leading-none">{format(selected, "d")}</div>
                <div className="mt-1 text-sm opacity-90">{format(selected, "MMMM yyyy")}</div>
              </div>
              <button onClick={() => setEditingDate(selected)} className="rounded-xl bg-white/15 p-2 backdrop-blur hover:bg-white/25 transition" title="Change date">
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Mini icon={ListChecks} value={`${completedTasks}/${sel.tasks.length}`} label="Tasks" />
              <Mini icon={Wallet} value={`$${totalExpenses.toFixed(0)}`} label="Spent" />
              <Mini icon={CalendarDays} value={String(sel.events.length)} label="Events" />
            </div>
          </div>

          {sel.log && (
            <Section title="Daily Log" icon={Smile}>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <Stat icon={Clock} value={`${sel.log.study_hours}h`} label="Study" />
                <Stat icon={Clock} value={`${sel.log.work_hours}h`} label="Work" />
                <Stat icon={Smartphone} value={`${sel.log.screen_time}h`} label="Screen" />
              </div>
              {sel.log.mood && <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent/40 px-3 py-2 text-sm"><span className="text-lg">{moodEmoji(sel.log.mood)}</span><span className="capitalize">{sel.log.mood}</span></div>}
              {sel.log.note && <p className="mt-2 rounded-xl bg-accent/40 px-3 py-2 text-xs text-muted-foreground italic">"{sel.log.note}"</p>}
            </Section>
          )}

          {sel.tasks.length > 0 && (
            <Section title="Tasks" icon={ListChecks} count={sel.tasks.length}>
              <ul className="space-y-1.5">
                {sel.tasks.map((t: any) => (
                  <li key={t.id} className="flex items-center gap-2 rounded-lg bg-accent/30 px-2.5 py-1.5 text-sm">
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded ${t.completed ? "bg-success text-success-foreground" : "border"}`}>
                      {t.completed && <Check className="h-3 w-3" />}
                    </span>
                    <span className={t.completed ? "line-through text-muted-foreground" : ""}>{t.title}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {sel.events.length > 0 && (
            <Section title="Events" icon={CalendarDays} count={sel.events.length}>
              <ul className="space-y-1.5">
                {sel.events.map((e: any) => (
                  <li key={e.id} className="flex items-center gap-2 rounded-lg bg-accent/30 px-2.5 py-1.5 text-sm">
                    {e.event_time && <span className="text-xs font-mono text-muted-foreground">{e.event_time.slice(0,5)}</span>}
                    <span>{e.title}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {sel.expenses.length > 0 && (
            <Section title="Expenses" icon={Wallet} count={sel.expenses.length}>
              <ul className="space-y-1.5">
                {sel.expenses.map((e: any) => (
                  <li key={e.id} className="flex items-center justify-between rounded-lg bg-accent/30 px-2.5 py-1.5 text-sm">
                    <span className="truncate"><span className="text-muted-foreground">[{e.category}]</span> {e.description || "—"}</span>
                    <span className="font-semibold">${Number(e.amount).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {sel.notes.length > 0 && (
            <Section title="Notes" icon={NotebookPen} count={sel.notes.length}>
              <ul className="space-y-1.5">
                {sel.notes.map((n: any) => (
                  <li key={n.id} className="rounded-lg bg-accent/30 px-2.5 py-1.5 text-sm">
                    <div className="font-medium">{n.title}</div>
                    {n.content && <div className="line-clamp-2 text-xs text-muted-foreground">{n.content}</div>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {sel.tasks.length + sel.expenses.length + sel.events.length + sel.notes.length === 0 && !sel.log && (
            <div className="rounded-2xl border border-dashed bg-card/40 p-8 text-center text-sm text-muted-foreground">
              Nothing logged on this day yet.
            </div>
          )}
        </div>
      </div>

      {editingDate && (
        <DateEditor date={editingDate} onClose={() => setEditingDate(null)} onSave={(nd) => moveDay(editingDate, nd)} />
      )}
    </div>
  );
}

function Mini({ icon: Icon, value, label }: any) {
  return (
    <div className="rounded-xl bg-white/15 p-2 backdrop-blur">
      <Icon className="mx-auto h-3.5 w-3.5 opacity-80" />
      <div className="mt-1 text-sm font-bold leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: any) {
  return (
    <div className="rounded-xl bg-accent/40 p-2">
      <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
      <div className="mt-1 text-sm font-bold">{value}</div>
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4" onClick={onClose}>
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

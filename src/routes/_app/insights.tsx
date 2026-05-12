import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui-kit";
import { ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO,
} from "date-fns";

export const Route = createFileRoute("/_app/insights")({ component: InsightsPage });

const MOODS = [
  { v: "happy", e: "😊" }, { v: "neutral", e: "😐" }, { v: "tired", e: "😴" },
  { v: "stressed", e: "😣" }, { v: "sad", e: "😢" },
];
const moodEmoji = (m?: string | null) => MOODS.find(x => x.v === m)?.e ?? "";

function InsightsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(new Date());
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
    setEditingDate(null);
    setCursor(newDate);
    refresh();
  };

  return (
    <div>
      <PageHeader title="Insights Calendar" subtitle="A live month-view of everything you do" />

      <div className="rounded-3xl border bg-gradient-to-br from-card via-card to-accent/20 p-3 shadow-elegant sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-xs">{format(cursor, "yyyy")}</div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{format(cursor, "MMMM")}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCursor(subMonths(cursor, 1))} className="rounded-xl border bg-background/60 p-2 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setCursor(new Date())} className="rounded-xl border bg-background/60 px-3 py-2 text-xs font-medium hover:bg-accent">Today</button>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="rounded-xl border bg-background/60 p-2 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[10px]">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="py-1">{d.slice(0,3)}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const data = byDate.get(key);
            const inMonth = isSameMonth(d, cursor);
            const today = isToday(d);
            const activity = (data?.tasks.length ?? 0) + (data?.expenses.length ?? 0) + (data?.events.length ?? 0) + (data?.notes.length ?? 0) + (data?.log ? 1 : 0);
            const intensity = Math.min(activity, 6);
            return (
              <button
                key={key}
                onClick={() => navigate({ to: "/insights/$date", params: { date: key } })}
                onDoubleClick={(ev) => { ev.preventDefault(); setEditingDate(d); }}
                className={[
                  "group relative aspect-square rounded-xl border p-1 text-left transition-all sm:p-1.5",
                  inMonth ? "bg-background/60" : "bg-muted/20 text-muted-foreground/50",
                  "border-border/60 hover:border-primary/60 hover:scale-[1.02] active:scale-95",
                ].join(" ")}
                style={intensity ? { background: `color-mix(in oklab, var(--primary) ${intensity * 8}%, var(--background))` } : undefined}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-[11px] font-bold sm:text-xs ${today ? "grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground" : ""}`}>
                    {format(d, "d")}
                  </span>
                  {data?.log?.mood && <span className="text-[10px] leading-none sm:text-xs">{moodEmoji(data.log.mood)}</span>}
                </div>
                {activity > 0 && (
                  <div className="absolute bottom-1 left-1 right-1 flex items-center gap-0.5 sm:bottom-1.5 sm:left-1.5 sm:right-1.5">
                    {Array.from({ length: Math.min(activity, 5) }).map((_, i) => (
                      <span key={i} className="h-1 flex-1 rounded-full bg-primary/70" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground sm:text-xs">
          <div className="flex items-center gap-2">
            <span>Less</span>
            {[1,2,3,4,5].map(i => <span key={i} className="h-3 w-3 rounded" style={{ background: `color-mix(in oklab, var(--primary) ${i * 14}%, var(--background))` }} />)}
            <span>More</span>
          </div>
          <span>Tap a day to view · Double-tap to move</span>
        </div>
      </div>

      {editingDate && (
        <DateEditor date={editingDate} onClose={() => setEditingDate(null)} onSave={(nd) => moveDay(editingDate, nd)} />
      )}
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

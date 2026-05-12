import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card, EmptyState } from "@/components/ui-kit";
import { format, addDays, subDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/planner")({ component: PlannerPage });

type Event = { id: string; title: string; description: string | null; event_date: string; event_time: string | null; completed: boolean };

const SLOT_COLORS = ["text-success", "text-warning", "text-primary", "text-destructive", "text-chart-4", "text-chart-2"];

function PlannerPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [events, setEvents] = useState<Event[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("planner_events").select("*").eq("user_id", user.id)
      .gte("event_date", format(subDays(new Date(), 30), "yyyy-MM-dd"))
      .lte("event_date", format(addDays(new Date(), 60), "yyyy-MM-dd"))
      .order("event_time")
      .then(({ data }) => setEvents((data ?? []) as Event[]));
  }, [user]);

  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);
  const dayEvents = events
    .filter(e => isSameDay(parseISO(e.event_date + "T00:00:00"), selected))
    .sort((a, b) => (a.event_time ?? "99").localeCompare(b.event_time ?? "99"));

  const remove = async (id: string) => {
    setEvents(arr => arr.filter(x => x.id !== id));
    await supabase.from("planner_events").delete().eq("id", id);
  };
  const toggle = async (e: Event) => {
    setEvents(arr => arr.map(x => x.id === e.id ? { ...x, completed: !x.completed } : x));
    await supabase.from("planner_events").update({ completed: !e.completed }).eq("id", e.id);
  };

  const fmtSlot = (t: string | null) => t ? format(new Date(`2000-01-01T${t}`), "hh:mm a") : "—";

  return (
    <div>
      <PageHeader title="Planner" subtitle={format(selected, "EEEE, MMM d")} />

      {/* Week strip */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setWeekStart(subDays(weekStart, 7))} className="rounded-lg p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
          <div className="text-sm font-semibold">{format(weekStart, "MMMM yyyy")}</div>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="rounded-lg p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(d => {
            const isSel = isSameDay(d, selected);
            const has = events.some(e => isSameDay(parseISO(e.event_date + "T00:00:00"), d));
            return (
              <button key={d.toISOString()} onClick={() => setSelected(d)}
                className={`flex flex-col items-center rounded-xl py-2 text-xs transition ${
                  isSel ? "bg-gradient-primary text-primary-foreground shadow-elegant" : "hover:bg-accent"
                }`}>
                <span className="text-[10px] uppercase opacity-70">{format(d, "EEE")}</span>
                <span className="mt-0.5 text-base font-bold">{format(d, "d")}</span>
                {has && !isSel && <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Time slots list */}
      <Card className="mt-4">
        <div className="space-y-1">
          {dayEvents.length === 0 && <EmptyState title="Nothing scheduled" hint="Tap Add Schedule below" />}
          {dayEvents.map((e, i) => (
            <div key={e.id} className="flex items-center gap-3 border-b py-3 last:border-0">
              <div className="w-16 text-xs font-medium text-muted-foreground">{fmtSlot(e.event_time)}</div>
              <button onClick={() => toggle(e)} className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${e.completed ? "border-primary bg-gradient-primary text-primary-foreground" : ""}`}>
                {e.completed && <Check className="h-3 w-3" />}
              </button>
              <div className={`flex-1 truncate text-sm font-medium ${SLOT_COLORS[i % SLOT_COLORS.length]} ${e.completed ? "line-through opacity-60" : ""}`}>{e.title}</div>
              {e.event_time && <span className="text-xs text-muted-foreground">{e.event_time.slice(0, 5)}</span>}
              <button onClick={() => remove(e.id)} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-2.5 text-sm font-semibold text-primary hover:bg-accent">
          <Plus className="h-4 w-4" /> Add Schedule
        </button>
      </Card>

      {showAdd && <AddModal date={selected} onClose={() => setShowAdd(false)} onAdd={async (payload) => {
        if (!user) return;
        const tempId = "tmp-" + Date.now();
        const optimistic: Event = { id: tempId, completed: false, ...payload };
        setEvents(arr => [...arr, optimistic]);
        const { data, error } = await supabase.from("planner_events").insert({ user_id: user.id, ...payload }).select().single();
        if (error) { toast.error(error.message); setEvents(arr => arr.filter(x => x.id !== tempId)); }
        else setEvents(arr => arr.map(x => x.id === tempId ? data as Event : x));
        setShowAdd(false);
      }} />}
    </div>
  );
}

function AddModal({ date, onClose, onAdd }: { date: Date; onClose: () => void; onAdd: (p: { title: string; description: string | null; event_date: string; event_time: string | null }) => void }) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl border bg-card p-5 shadow-glow sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">New event · {format(date, "MMM d")}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <input autoFocus placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
          className="mt-2 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
        <textarea placeholder="Description (optional)" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)}
          className="mt-2 w-full resize-none rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
        <button disabled={!title.trim()} onClick={() => onAdd({ title: title.trim(), description: desc || null, event_date: format(date, "yyyy-MM-dd"), event_time: time || null })}
          className="mt-4 w-full rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-50">Add event</button>
      </div>
    </div>
  );
}

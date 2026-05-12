import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card, EmptyState } from "@/components/ui-kit";
import { Plus, Check, Trash2, Play, Pause, X } from "lucide-react";
import { toast } from "sonner";
import { format, isAfter, parseISO } from "date-fns";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

export const Route = createFileRoute("/_app/tasks")({ component: TasksPage });

type Task = { id: string; title: string; duration_minutes: number; completed: boolean; task_date: string; created_at: string };
type Tab = "today" | "upcoming" | "completed";

function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [taskDate, setTaskDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Timer state — running task id + elapsed seconds
  const [running, setRunning] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<Record<string, number>>({});
  const tick = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("tasks").select("*").eq("user_id", user.id)
      .order("task_date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => setTasks((data ?? []) as Task[]));
  }, [user]);

  useEffect(() => {
    if (running) {
      tick.current = window.setInterval(() => {
        setElapsed(e => ({ ...e, [running]: (e[running] ?? 0) + 1 }));
      }, 1000);
    }
    return () => { if (tick.current) window.clearInterval(tick.current); };
  }, [running]);

  const today = format(new Date(), "yyyy-MM-dd");
  const filtered = useMemo(() => {
    if (tab === "today") return tasks.filter(t => t.task_date === today && !t.completed);
    if (tab === "upcoming") return tasks.filter(t => isAfter(parseISO(t.task_date), parseISO(today)) && !t.completed);
    return tasks.filter(t => t.completed);
  }, [tasks, tab, today]);

  const todayTasks = tasks.filter(t => t.task_date === today);
  const completionPct = todayTasks.length ? Math.round(todayTasks.filter(t => t.completed).length / todayTasks.length * 100) : 0;
  const focusSec = Object.values(elapsed).reduce((s, v) => s + v, 0);

  const add = async () => {
    if (!title.trim() || !user) return;
    const total = hours * 60 + minutes;
    if (total <= 0) { toast.error("Set a duration"); return; }
    const tempId = "tmp-" + Date.now();
    const optimistic: Task = { id: tempId, title: title.trim(), duration_minutes: total, completed: false, task_date: taskDate, created_at: new Date().toISOString() };
    setTasks(t => [optimistic, ...t]);
    setTitle(""); setHours(0); setMinutes(30); setShowAdd(false);
    const { data, error } = await supabase.from("tasks").insert({
      user_id: user.id, title: optimistic.title, duration_minutes: total, task_date: taskDate,
    }).select().single();
    if (error) { toast.error(error.message); setTasks(t => t.filter(x => x.id !== tempId)); return; }
    setTasks(t => t.map(x => x.id === tempId ? (data as Task) : x));
    await supabase.from("notifications").insert({
      user_id: user.id, title: "Task added", body: `${optimistic.title} • ${hours}h ${minutes}m`, kind: "info",
    });
  };

  const toggle = async (t: Task) => {
    const next = !t.completed;
    setTasks(arr => arr.map(x => x.id === t.id ? { ...x, completed: next } : x));
    if (running === t.id) setRunning(null);
    await supabase.from("tasks").update({ completed: next }).eq("id", t.id);
    if (next && user) {
      await supabase.from("notifications").insert({
        user_id: user.id, title: "Task completed ✅", body: t.title, kind: "success",
      });
    }
  };

  const remove = async (id: string) => {
    setTasks(arr => arr.filter(x => x.id !== id));
    if (running === id) setRunning(null);
    await supabase.from("tasks").delete().eq("id", id);
  };

  const togglePlay = (id: string) => {
    if (running === id) setRunning(null);
    else setRunning(id);
  };

  return (
    <div>
      <PageHeader title="Tasks" subtitle={`${todayTasks.filter(t => t.completed).length}/${todayTasks.length} completed today`}
        action={<button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-elegant">
          <Plus className="h-4 w-4" /> Add Task
        </button>} />

      {/* Tabs */}
      <div className="flex border-b text-sm font-medium">
        {(["today", "upcoming", "completed"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 capitalize transition ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="mt-3 space-y-2">
        {filtered.length === 0 && <EmptyState title={`No ${tab} tasks`} hint={tab === "today" ? "Tap Add Task to start" : undefined} />}
        {filtered.map(t => {
          const sec = elapsed[t.id] ?? 0;
          const planned = t.duration_minutes * 60;
          const display = sec > 0 ? sec : planned;
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm">
              <button onClick={() => toggle(t)}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${
                  t.completed ? "border-primary bg-gradient-primary text-primary-foreground" : "hover:border-primary"
                }`}>
                {t.completed && <Check className="h-3.5 w-3.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm font-medium ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                <div className="text-xs text-muted-foreground">{format(parseISO(t.task_date), "MMM d")}</div>
              </div>
              <div className={`tabular-nums text-xs font-mono ${running === t.id ? "text-primary" : "text-muted-foreground"}`}>{fmtTime(display)}</div>
              {!t.completed && (
                <button onClick={() => togglePlay(t.id)}
                  className={`grid h-8 w-8 place-items-center rounded-full transition ${running === t.id ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                  {running === t.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              )}
              <button onClick={() => remove(t.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Productivity card */}
      <Card className="mt-4">
        <div className="text-xs font-medium text-muted-foreground">Today's Productivity</div>
        <div className="mt-1 flex items-end justify-between">
          <div className="text-2xl font-bold">{fmtTime(focusSec)}</div>
          <div className="h-12 w-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.from({ length: 12 }).map((_, i) => ({ v: Math.sin(i / 2) + 2 + (i / 6) }))}>
                <defs><linearGradient id="ts" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5}/><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0}/></linearGradient></defs>
                <Area dataKey="v" stroke="var(--color-primary)" fill="url(#ts)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Total Focus Time</div>
      </Card>

      <Card className="mt-3">
        <div className="text-xs font-medium text-muted-foreground">Task Completion</div>
        <div className="mt-1 text-2xl font-bold">{completionPct}%</div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent">
          <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${completionPct}%` }} />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{todayTasks.filter(t => t.completed).length} of {todayTasks.length} tasks completed</div>
      </Card>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl border bg-card p-5 shadow-glow sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">New task</h3>
              <button onClick={() => setShowAdd(false)} className="rounded-lg p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title"
              className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
            <div className="mt-2 grid grid-cols-3 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Hours</span>
                <input type="number" min={0} max={23} value={hours} onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Minutes</span>
                <input type="number" min={0} max={59} step={5} value={minutes} onChange={(e) => setMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Date</span>
                <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>
            </div>
            <button onClick={add} className="mt-4 w-full rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant">Add task</button>
          </div>
        </div>
      )}
    </div>
  );
}

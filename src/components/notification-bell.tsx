import { useEffect, useRef, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

type Notification = { id: string; title: string; body: string | null; kind: string; link: string | null; read: boolean; created_at: string };

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
    setItems((data ?? []) as Notification[]);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("notif:" + user.id + ":" + Math.random().toString(36).slice(2));
    ch.on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter(i => !i.read).length;

  const markAll = async () => {
    if (!user) return;
    setItems(items.map(i => ({ ...i, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  const remove = async (id: string) => {
    setItems(items.filter(i => i.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative rounded-lg p-2 hover:bg-accent" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border bg-popover shadow-glow">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">You're all caught up 🎉</div>
            )}
            {items.map(n => (
              <div key={n.id} className={`group flex items-start gap-2 border-b px-4 py-3 last:border-0 ${!n.read ? "bg-accent/40" : ""}`}>
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  n.kind === "warning" ? "bg-warning" : n.kind === "success" ? "bg-success" : n.kind === "alert" ? "bg-destructive" : "bg-primary"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>}
                  <div className="mt-1 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
                </div>
                <button onClick={() => remove(n.id)} className="opacity-0 transition group-hover:opacity-100">
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// helper to push a notification (used across modules)
export async function pushNotification(userId: string, title: string, body?: string, kind: "info" | "success" | "warning" | "alert" = "info") {
  await supabase.from("notifications").insert({ user_id: userId, title, body, kind });
}

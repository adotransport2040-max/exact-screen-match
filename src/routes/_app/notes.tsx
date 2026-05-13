import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card, EmptyState } from "@/components/ui-kit";
import { Plus, Search, Trash2, X, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/notes")({ component: NotesPage });

type Note = { id: string; title: string; content: string; tags: string[]; updated_at: string };

const BUILTIN = ["study", "ideas", "personal"] as const;
const TAG_PALETTE = [
  "bg-primary/10 text-primary",
  "bg-warning/10 text-warning",
  "bg-destructive/10 text-destructive",
  "bg-success/10 text-success",
  "bg-chart-2/10 text-chart-2",
  "bg-chart-4/10 text-chart-4",
  "bg-chart-5/10 text-chart-5",
];
const toneFor = (tag: string) => TAG_PALETTE[Math.abs(tag.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % TAG_PALETTE.length];

function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string>("All");
  const [active, setActive] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("notes").select("*").eq("user_id", user.id).order("updated_at", { ascending: false })
      .then(({ data }) => setNotes((data ?? []) as Note[]));
  }, [user]);

  const allTags = useMemo(() => {
    const set = new Set<string>(BUILTIN);
    notes.forEach(n => n.tags.forEach(t => set.add(t.toLowerCase())));
    return ["All", ...Array.from(set)];
  }, [notes]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return notes.filter(n => {
      if (activeTag !== "All" && !n.tags.map(t => t.toLowerCase()).includes(activeTag.toLowerCase())) return false;
      if (s && !(n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s) || n.tags.some(t => t.toLowerCase().includes(s)))) return false;
      return true;
    });
  }, [notes, q, activeTag]);

  const newNote = async () => {
    if (!user) return;
    const tempId = "tmp-" + Date.now();
    const tag = activeTag === "All" ? [] : [activeTag.toLowerCase()];
    const optimistic: Note = { id: tempId, title: "Untitled note", content: "", tags: tag, updated_at: new Date().toISOString() };
    setNotes(arr => [optimistic, ...arr]);
    setActive(optimistic); setCreating(true);
    const { data, error } = await supabase.from("notes").insert({
      user_id: user.id, title: "Untitled note", content: "", tags: tag,
    }).select().single();
    if (error) { toast.error(error.message); setNotes(arr => arr.filter(x => x.id !== tempId)); return; }
    setNotes(arr => arr.map(x => x.id === tempId ? data as Note : x));
    setActive(data as Note);
  };

  const save = async (n: Note) => {
    setNotes(arr => arr.map(x => x.id === n.id ? { ...n, updated_at: new Date().toISOString() } : x).sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
    setActive(null); setCreating(false);
    const { error } = await supabase.from("notes").update({ title: n.title, content: n.content, tags: n.tags }).eq("id", n.id);
    if (error) toast.error(error.message);
    else toast.success("Note saved");
  };

  const remove = async (id: string) => {
    setNotes(arr => arr.filter(x => x.id !== id));
    setActive(null); setCreating(false);
    await supabase.from("notes").delete().eq("id", id);
  };

  return (
    <div>
      <PageHeader title="Notes"
        action={<button onClick={newNote} className="flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-elegant">
          <Plus className="h-4 w-4" /> New Note
        </button>} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes or tags…"
          className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary" />
      </div>

      {/* Tag chips (scrollable, includes any custom tag) */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 text-xs font-medium scrollbar-hide">
        {allTags.map(t => (
          <button key={t} onClick={() => setActiveTag(t)}
            className={`shrink-0 rounded-full border px-3 py-1.5 capitalize transition ${
              activeTag === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {filtered.length === 0 && <EmptyState title="No notes" hint="Tap New Note to start" />}
        {filtered.map(n => (
          <button key={n.id} onClick={() => setActive(n)} className="flex w-full flex-col gap-1.5 rounded-2xl border bg-card p-3.5 text-left shadow-sm transition hover:border-primary">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{n.title}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(n.updated_at), "MMM d, yyyy")}</div>
              </div>
            </div>
            {n.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {n.tags.map(t => (
                  <span key={t} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${toneFor(t)}`}>{t}</span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {active && <NoteEditor note={active} onSave={save} onClose={() => { if (creating) remove(active.id); else setActive(null); }} onDelete={() => remove(active.id)} />}
    </div>
  );
}

function NoteEditor({ note, onSave, onClose, onDelete }: { note: Note; onSave: (n: Note) => void; onClose: () => void; onDelete: () => void }) {
  const [draft, setDraft] = useState(note);
  const [tagInput, setTagInput] = useState("");

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (!t) return;
    setDraft(d => d.tags.includes(t) ? d : { ...d, tags: [...d.tags, t] });
    setTagInput("");
  };

  const handleSave = () => {
    const t = tagInput.trim().toLowerCase();
    const finalTags = t && !draft.tags.includes(t) ? [...draft.tags, t] : draft.tags;
    onSave({ ...draft, tags: finalTags });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-2xl rounded-t-3xl border bg-card p-5 shadow-glow sm:rounded-3xl">
        <div className="mb-2 flex items-center justify-between">
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="flex-1 bg-transparent text-lg font-bold outline-none" />
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })}
          rows={10} placeholder="Write your thoughts..."
          className="w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary" />

        {/* Quick tag chips */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <TagIcon className="h-3 w-3" /> Tags
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {BUILTIN.map(b => {
              const has = draft.tags.includes(b);
              return (
                <button key={b} type="button" onClick={() => setDraft(d => has ? { ...d, tags: d.tags.filter(x => x !== b) } : { ...d, tags: [...d.tags, b] })}
                  className={`rounded-full px-2.5 py-1 text-xs capitalize transition ${has ? `${toneFor(b)} ring-2 ring-primary/30` : "bg-secondary text-muted-foreground hover:bg-accent"}`}>
                  {b}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {draft.tags.filter(t => !BUILTIN.includes(t as any)).map(t => (
              <span key={t} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs capitalize ${toneFor(t)}`}>
                {t}
                <button type="button" onClick={() => setDraft({ ...draft, tags: draft.tags.filter(x => x !== t) })} className="opacity-60 hover:opacity-100">×</button>
              </span>
            ))}
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
              placeholder="+ custom tag"
              className="rounded-full border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary" />
            {tagInput.trim() && (
              <button type="button" onClick={() => addTag(tagInput)} className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">Add</button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button onClick={onDelete} className="rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          <div className="flex-1" />
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={handleSave} className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant">Save</button>
        </div>
      </div>
    </div>
  );
}

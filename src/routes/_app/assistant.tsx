import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Card } from "@/components/ui-kit";
import {
  Bed, Dumbbell, Smartphone, BookOpen, Briefcase, Utensils, Users, Sparkles,
  Brain, Sun, Moon, HeartPulse, Coffee, GraduationCap, Code2, Plus, Trash2, RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/_app/assistant")({ component: Assistant });

type Block = { label: string; hours: number; icon: any; tone: string; tip: string };
type Preset = { id: string; name: string; emoji: string; tagline: string; blocks: Block[] };

const PRESETS: Preset[] = [
  {
    id: "balanced",
    name: "Balanced Adult",
    emoji: "⚖️",
    tagline: "Healthy default for working professionals.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Aim for 7–9 hrs. Same wake-time daily." },
      { label: "Work / Career", hours: 8, icon: Briefcase, tone: "text-primary bg-primary/10", tip: "Use 90-min focus blocks + 10-min breaks." },
      { label: "Exercise", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "30 min cardio + 30 min strength." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Eat slowly, no screens at the table." },
      { label: "Family / Social", hours: 1.5, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Real conversations recharge you." },
      { label: "Screen / Leisure", hours: 2, icon: Smartphone, tone: "text-destructive bg-destructive/10", tip: "Cap recreational screens at ≤2 hrs." },
      { label: "Self-care / Hobby", hours: 1, icon: HeartPulse, tone: "text-chart-5 bg-chart-5/10", tip: "Read, journal, meditate, walk." },
      { label: "Buffer", hours: 1, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Commute, chores, transitions." },
    ],
  },
  {
    id: "student",
    name: "Student Focus",
    emoji: "🎓",
    tagline: "Deep study with sustainable rest.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Sleep is when memory consolidates." },
      { label: "Study (deep work)", hours: 5, icon: BookOpen, tone: "text-success bg-success/10", tip: "Pomodoro: 50/10. No phone in reach." },
      { label: "Classes / Lectures", hours: 3, icon: GraduationCap, tone: "text-primary bg-primary/10", tip: "Take active notes, review same day." },
      { label: "Exercise", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Boosts focus & memory." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Protein + complex carbs = stable focus." },
      { label: "Screen / Fun", hours: 2, icon: Smartphone, tone: "text-destructive bg-destructive/10", tip: "Schedule it — don't drift into it." },
      { label: "Social / Family", hours: 1.5, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "You need humans, not just notes." },
      { label: "Buffer", hours: 2, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Travel, chores, prep." },
    ],
  },
  {
    id: "developer",
    name: "Developer / Builder",
    emoji: "💻",
    tagline: "Long focus, eyes-friendly schedule.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "No screens 60 min before bed." },
      { label: "Deep Coding", hours: 5, icon: Code2, tone: "text-primary bg-primary/10", tip: "Two 2.5-hr deep blocks > one 5-hr." },
      { label: "Meetings / Async", hours: 2, icon: Briefcase, tone: "text-chart-3 bg-chart-3/10", tip: "Cluster meetings into one window." },
      { label: "Learning / Reading", hours: 1, icon: BookOpen, tone: "text-success bg-success/10", tip: "Books, papers, docs — not Twitter." },
      { label: "Exercise", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Walk after lunch, lift 3x/week." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Step away from the desk." },
      { label: "Screen (leisure)", hours: 1.5, icon: Smartphone, tone: "text-destructive bg-destructive/10", tip: "Your eyes already worked all day." },
      { label: "Social / Hobby", hours: 2, icon: HeartPulse, tone: "text-chart-5 bg-chart-5/10", tip: "Touch grass. Seriously." },
      { label: "Buffer", hours: 2, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Commute / setup / context-switch." },
    ],
  },
  {
    id: "athlete",
    name: "Athlete / Fitness",
    emoji: "🏋️",
    tagline: "Performance, recovery, fuel.",
    blocks: [
      { label: "Sleep", hours: 9, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Athletes need 8–10 hrs for recovery." },
      { label: "Training", hours: 2.5, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Warm-up + main lift + conditioning." },
      { label: "Mobility / Recovery", hours: 0.5, icon: HeartPulse, tone: "text-chart-5 bg-chart-5/10", tip: "Stretch, foam roll, breathe." },
      { label: "Work / Study", hours: 6, icon: Briefcase, tone: "text-primary bg-primary/10", tip: "Mental load matters too." },
      { label: "Meals", hours: 2, icon: Utensils, tone: "text-warning bg-warning/10", tip: "4–5 meals, hit your protein goal." },
      { label: "Screen / Leisure", hours: 1.5, icon: Smartphone, tone: "text-destructive bg-destructive/10", tip: "Less stimulation = better sleep." },
      { label: "Social", hours: 1.5, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Train with friends when possible." },
      { label: "Buffer", hours: 1, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Travel to gym + prep." },
    ],
  },
  {
    id: "creator",
    name: "Creative / Mindful",
    emoji: "🎨",
    tagline: "Make things, protect attention.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Dreams are the studio." },
      { label: "Creative work", hours: 4, icon: Sparkles, tone: "text-primary bg-primary/10", tip: "Mornings are sacred — no inbox." },
      { label: "Admin / Comms", hours: 2, icon: Briefcase, tone: "text-chart-3 bg-chart-3/10", tip: "Batch into a single window." },
      { label: "Reading / Inputs", hours: 1.5, icon: BookOpen, tone: "text-success bg-success/10", tip: "Curate; don't doomscroll." },
      { label: "Walk / Movement", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Ideas come while walking." },
      { label: "Meditate / Reflect", hours: 0.5, icon: Brain, tone: "text-chart-5 bg-chart-5/10", tip: "10 min, twice a day." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Slow, screen-free." },
      { label: "Social", hours: 2, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Inspiration is collaborative." },
      { label: "Screen / Fun", hours: 1.5, icon: Smartphone, tone: "text-destructive bg-destructive/10", tip: "Choose, don't default." },
      { label: "Buffer", hours: 2, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Life happens." },
    ],
  },
];

const TIPS = [
  { icon: Sun, title: "Wake at the same time", body: "Anchoring your wake time stabilises mood, energy and sleep quality more than any other habit." },
  { icon: Smartphone, title: "Cap screens at 2 hrs (leisure)", body: "WHO suggests ≤2 hrs of recreational screens for adults; under 1 hr is best for kids 2–5." },
  { icon: Dumbbell, title: "150 min/week of movement", body: "WHO recommends 150–300 min of moderate activity per week + 2 strength sessions." },
  { icon: Bed, title: "Adults: 7–9 hrs sleep", body: "Teens 8–10 hrs, kids 9–12 hrs. Consistency matters as much as duration." },
  { icon: Brain, title: "Deep work in 90-min blocks", body: "Your brain has natural ~90-min focus cycles. Honour them with breaks." },
  { icon: Moon, title: "Wind-down 60 min before bed", body: "Dim lights, no screens, light reading. Sleep onset improves dramatically." },
];

function Assistant() {
  const [activeId, setActiveId] = useState<string>(PRESETS[0].id);
  const [extras, setExtras] = useState<{ label: string; hours: number }[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newHours, setNewHours] = useState<number>(0.5);

  const preset = PRESETS.find(p => p.id === activeId)!;
  const allBlocks = useMemo(
    () => [...preset.blocks, ...extras.map(e => ({ ...e, icon: Plus, tone: "text-primary bg-primary/10", tip: "Your custom block." }))],
    [preset, extras]
  );
  const total = allBlocks.reduce((s, b) => s + b.hours, 0);
  const remaining = +(24 - total).toFixed(2);

  const addExtra = () => {
    const label = newLabel.trim();
    if (!label || newHours <= 0) return;
    setExtras(x => [...x, { label, hours: Number(newHours) }]);
    setNewLabel(""); setNewHours(0.5);
  };

  return (
    <div>
      <PageHeader title="Helper / Assistant" subtitle="Reference time-tables for a healthier, more focused day." />

      {/* Preset picker */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Pick a reference schedule</h3>
          <button
            onClick={() => setExtras([])}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          ><RefreshCw className="h-3 w-3" /> Reset extras</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map(p => {
            const active = p.id === activeId;
            return (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`rounded-xl border p-3 text-left transition ${active ? "border-primary bg-gradient-primary/10 shadow-elegant" : "hover:bg-accent"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.emoji}</span>
                  <span className="font-semibold">{p.name}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Time allocation */}
      <Card className="mt-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{preset.emoji} {preset.name} — 24-hour breakdown</h3>
            <p className="text-xs text-muted-foreground">{preset.tagline}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Allocated</div>
            <div className={`text-lg font-bold ${total > 24 ? "text-destructive" : "text-gradient"}`}>{total} / 24 h</div>
            <div className="text-[11px] text-muted-foreground">{remaining >= 0 ? `${remaining} h free` : `${Math.abs(remaining)} h over`}</div>
          </div>
        </div>

        {/* Stacked bar */}
        <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {allBlocks.map((b, i) => (
            <div key={i} title={`${b.label} • ${b.hours}h`}
              className={b.tone.split(" ").find(c => c.startsWith("bg-")) ?? "bg-primary"}
              style={{ width: `${Math.min(100, (b.hours / 24) * 100)}%` }} />
          ))}
        </div>

        <div className="space-y-2">
          {allBlocks.map((b, i) => {
            const Icon = b.icon;
            const isExtra = i >= preset.blocks.length;
            return (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-secondary/40 px-3 py-2.5">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${b.tone}`}><Icon className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{b.label}</div>
                    <div className="text-sm font-bold tabular-nums">{b.hours} h</div>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{b.tip}</p>
                </div>
                {isExtra && (
                  <button onClick={() => setExtras(x => x.filter((_, idx) => idx !== i - preset.blocks.length))}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add custom block */}
        <div className="mt-4 rounded-xl border border-dashed p-3">
          <div className="mb-2 text-xs font-semibold text-muted-foreground">Add your own block</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. Language practice"
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="number" min={0.25} step={0.25} value={newHours}
              onChange={e => setNewHours(Number(e.target.value))}
              className="w-28 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button onClick={addExtra}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>
      </Card>

      {/* Wellness tips */}
      <Card className="mt-4">
        <h3 className="mb-3 text-sm font-semibold">Important things to remember</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {TIPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3 rounded-xl border bg-card/50 p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

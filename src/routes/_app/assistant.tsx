import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Card } from "@/components/ui-kit";
import {
  Bed, Dumbbell, Smartphone, BookOpen, Briefcase, Utensils, Users, Sparkles,
  Brain, Sun, Moon, HeartPulse, Coffee, GraduationCap, Code2, Plus, Trash2, RefreshCw,
  Baby, Music, Plane, PenTool, Stethoscope, ShieldCheck, Building2, Leaf, Mountain, Globe,
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
  {
    id: "highschool",
    name: "High-School Student",
    emoji: "📚",
    tagline: "School + homework + growing brain.",
    blocks: [
      { label: "Sleep", hours: 9, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Teens need 8–10 hrs. Phone out of the room." },
      { label: "School / Classes", hours: 7, icon: GraduationCap, tone: "text-primary bg-primary/10", tip: "Front-row > back-row. Ask one question per class." },
      { label: "Homework / Revision", hours: 2, icon: BookOpen, tone: "text-success bg-success/10", tip: "Same time, same desk, no phone." },
      { label: "Sport / Play", hours: 1.5, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Outdoor play boosts mood and grades." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Eat with family when you can." },
      { label: "Screen / Games", hours: 1.5, icon: Smartphone, tone: "text-destructive bg-destructive/10", tip: "Cap to 1.5 hrs on school nights." },
      { label: "Family / Friends", hours: 1, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Real talk > group chat." },
      { label: "Buffer", hours: 0.5, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Travel, prep, chores." },
    ],
  },
  {
    id: "college",
    name: "College / University",
    emoji: "🏛️",
    tagline: "Lectures, labs, life skills.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Late nights kill morning lectures." },
      { label: "Lectures / Labs", hours: 4, icon: GraduationCap, tone: "text-primary bg-primary/10", tip: "Sit, listen, take active notes." },
      { label: "Self-study", hours: 3, icon: BookOpen, tone: "text-success bg-success/10", tip: "Two 90-min blocks beat one 3-hr cram." },
      { label: "Part-time / Project", hours: 2, icon: Briefcase, tone: "text-chart-3 bg-chart-3/10", tip: "Income or portfolio — pick one." },
      { label: "Exercise", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Campus gym, walk, or sport." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Cook 3x/week — saves money + skills." },
      { label: "Screen / Fun", hours: 1.5, icon: Smartphone, tone: "text-destructive bg-destructive/10", tip: "Schedule it instead of drifting." },
      { label: "Friends / Clubs", hours: 2, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Network = future career." },
      { label: "Buffer", hours: 1, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Commute, errands, transitions." },
    ],
  },
  {
    id: "examcrunch",
    name: "Exam Crunch",
    emoji: "🎯",
    tagline: "2 weeks before the big exam.",
    blocks: [
      { label: "Sleep", hours: 7.5, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Don't sacrifice sleep — memory needs it." },
      { label: "Deep Study", hours: 7, icon: BookOpen, tone: "text-success bg-success/10", tip: "4 cycles of 90/15. Active recall, not re-reading." },
      { label: "Practice Tests", hours: 2, icon: PenTool, tone: "text-primary bg-primary/10", tip: "Simulate exam conditions weekly." },
      { label: "Light Review", hours: 1, icon: Brain, tone: "text-chart-5 bg-chart-5/10", tip: "Flashcards before bed for retention." },
      { label: "Exercise", hours: 0.75, icon: Dumbbell, tone: "text-success bg-success/10", tip: "30-min walk clears the head." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Hydrate. Caffeine before 2 pm only." },
      { label: "Decompress", hours: 1.5, icon: HeartPulse, tone: "text-chart-5 bg-chart-5/10", tip: "Music, shower, breathing — not phone." },
      { label: "Buffer", hours: 2.75, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Family, chores, commute." },
    ],
  },
  {
    id: "remote",
    name: "Remote Worker",
    emoji: "🏠",
    tagline: "Structure when no one's watching.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Same wake time as if you commuted." },
      { label: "Deep Work", hours: 4, icon: Briefcase, tone: "text-primary bg-primary/10", tip: "Mornings, no notifications." },
      { label: "Meetings / Async", hours: 3, icon: Users, tone: "text-chart-3 bg-chart-3/10", tip: "Cluster after lunch." },
      { label: "Walk / Outside", hours: 1, icon: Leaf, tone: "text-success bg-success/10", tip: "Sunlight in the first hour of the day." },
      { label: "Exercise", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Lift 3x/week or 30-min cardio." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Leave the desk — every time." },
      { label: "Family / Social", hours: 2, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Remote work = lonely if unmanaged." },
      { label: "Hobby / Reading", hours: 1.5, icon: BookOpen, tone: "text-success bg-success/10", tip: "Read paper books, not feeds." },
      { label: "Buffer", hours: 2, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Chores, errands, transitions." },
    ],
  },
  {
    id: "founder",
    name: "Startup Founder",
    emoji: "🚀",
    tagline: "High output without burning out.",
    blocks: [
      { label: "Sleep", hours: 7.5, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Sleep IS the moat. Protect it." },
      { label: "Build / Ship", hours: 5, icon: Code2, tone: "text-primary bg-primary/10", tip: "Mornings = building. No meetings." },
      { label: "Customer Calls", hours: 2, icon: Users, tone: "text-success bg-success/10", tip: "Talk to 3 users per week, minimum." },
      { label: "Strategy / Think", hours: 1, icon: Brain, tone: "text-chart-5 bg-chart-5/10", tip: "Walk + voice notes. No screen." },
      { label: "Exercise", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Non-negotiable. Energy = output." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Don't eat at the laptop." },
      { label: "Family / Partner", hours: 2, icon: HeartPulse, tone: "text-chart-4 bg-chart-4/10", tip: "Calendar it like a meeting." },
      { label: "Reading / Learning", hours: 1, icon: BookOpen, tone: "text-success bg-success/10", tip: "Books > Twitter." },
      { label: "Buffer", hours: 3, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Admin, comms, transitions." },
    ],
  },
  {
    id: "parent",
    name: "Working Parent",
    emoji: "👨‍👩‍👧",
    tagline: "Family first, work focused, you matter too.",
    blocks: [
      { label: "Sleep", hours: 7.5, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "First in bed wins the morning." },
      { label: "Kids — Morning", hours: 1.5, icon: Baby, tone: "text-chart-4 bg-chart-4/10", tip: "Phones away. Be present." },
      { label: "Work", hours: 7, icon: Briefcase, tone: "text-primary bg-primary/10", tip: "Hard start, hard stop." },
      { label: "Kids — Evening", hours: 2.5, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Dinner, play, bedtime ritual." },
      { label: "Exercise", hours: 0.5, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Even 30 min counts. Often." },
      { label: "Meals (your own)", hours: 1, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Eat what you'd serve a friend." },
      { label: "Partner Time", hours: 1, icon: HeartPulse, tone: "text-chart-5 bg-chart-5/10", tip: "Just 20 connected min/day." },
      { label: "You-Time / Hobby", hours: 1, icon: Sparkles, tone: "text-chart-5 bg-chart-5/10", tip: "You can't pour from empty." },
      { label: "Buffer", hours: 2, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Commute, chores, school runs." },
    ],
  },
  {
    id: "newparent",
    name: "New Parent (0–1 yr)",
    emoji: "🍼",
    tagline: "Survive, sleep when baby sleeps.",
    blocks: [
      { label: "Sleep (broken)", hours: 7, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Nap when baby naps. Seriously." },
      { label: "Baby Care", hours: 8, icon: Baby, tone: "text-chart-4 bg-chart-4/10", tip: "Feed, change, soothe, repeat." },
      { label: "Feed / Pump", hours: 2, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Hydrate, snack, sit down." },
      { label: "Light Movement", hours: 0.5, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Stroller walks count." },
      { label: "Your Meals", hours: 1, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Easy, batch-cooked." },
      { label: "Partner / Help", hours: 1.5, icon: HeartPulse, tone: "text-chart-5 bg-chart-5/10", tip: "Tag-team. Ask for help." },
      { label: "Self-care", hours: 1, icon: Sparkles, tone: "text-chart-5 bg-chart-5/10", tip: "Shower, fresh air, 5 deep breaths." },
      { label: "Quiet / Rest", hours: 1, icon: Moon, tone: "text-muted-foreground bg-muted", tip: "Phone down, eyes closed." },
      { label: "Buffer", hours: 2, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Laundry, dishes, doctor visits." },
    ],
  },
  {
    id: "retired",
    name: "Retired / 60+",
    emoji: "🌿",
    tagline: "Vitality, connection, purpose.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Consistent schedule. Sunlight on waking." },
      { label: "Walk / Mobility", hours: 1.5, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Walk daily. Strength 2–3x/week." },
      { label: "Hobby / Project", hours: 3, icon: Sparkles, tone: "text-primary bg-primary/10", tip: "Garden, paint, build, mentor." },
      { label: "Reading / Puzzles", hours: 2, icon: BookOpen, tone: "text-success bg-success/10", tip: "Brain stays sharp with novelty." },
      { label: "Family / Friends", hours: 3, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Loneliness ages faster than smoking." },
      { label: "Meals", hours: 2, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Protein every meal. Hydrate." },
      { label: "Volunteer / Purpose", hours: 1, icon: HeartPulse, tone: "text-chart-5 bg-chart-5/10", tip: "Helping others extends life." },
      { label: "Rest / Quiet", hours: 1.5, icon: Moon, tone: "text-muted-foreground bg-muted", tip: "Naps OK — keep them <30 min." },
      { label: "Buffer", hours: 2, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Errands, appointments." },
    ],
  },
  {
    id: "shiftworker",
    name: "Night-Shift Worker",
    emoji: "🌙",
    tagline: "Protect sleep when the world is loud.",
    blocks: [
      { label: "Sleep (daytime)", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Blackout curtains + earplugs." },
      { label: "Night Shift Work", hours: 8, icon: Briefcase, tone: "text-primary bg-primary/10", tip: "Bright light at start, dim at end." },
      { label: "Wind-down", hours: 1, icon: Moon, tone: "text-chart-5 bg-chart-5/10", tip: "Sunglasses on the way home." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Light at 3 am, big meal after sleep." },
      { label: "Exercise", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Before shift, not after." },
      { label: "Family / Social", hours: 1.5, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Schedule overlap windows." },
      { label: "Hobby / Sun time", hours: 1, icon: Sun, tone: "text-warning bg-warning/10", tip: "Get sunlight on days off." },
      { label: "Buffer", hours: 2, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Errands, commute." },
    ],
  },
  {
    id: "weightloss",
    name: "Weight-Loss Plan",
    emoji: "⚖️",
    tagline: "Sustainable habits, not crash diet.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Poor sleep = more cravings." },
      { label: "Work", hours: 8, icon: Briefcase, tone: "text-primary bg-primary/10", tip: "Walk during calls when you can." },
      { label: "Cardio", hours: 0.75, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Zone 2: nose-breathing pace." },
      { label: "Strength", hours: 0.5, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Keeps muscle as fat drops." },
      { label: "Meals (planned)", hours: 2, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Protein + veg first. Slowly." },
      { label: "Walk after meals", hours: 0.75, icon: Leaf, tone: "text-success bg-success/10", tip: "Even 10 min cuts blood sugar spikes." },
      { label: "Family / Social", hours: 1.5, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Eat with people, not screens." },
      { label: "Hobby (no snacks)", hours: 1.5, icon: BookOpen, tone: "text-success bg-success/10", tip: "Boredom = false hunger." },
      { label: "Buffer", hours: 1, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Meal prep, groceries." },
    ],
  },
  {
    id: "musician",
    name: "Musician / Artist",
    emoji: "🎵",
    tagline: "Practice, perform, preserve hands.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Sleep cements muscle memory." },
      { label: "Deliberate Practice", hours: 3, icon: Music, tone: "text-primary bg-primary/10", tip: "Slow + record + listen back." },
      { label: "Free Play / Compose", hours: 1.5, icon: Sparkles, tone: "text-chart-5 bg-chart-5/10", tip: "No metronome. Follow curiosity." },
      { label: "Theory / Study", hours: 1, icon: BookOpen, tone: "text-success bg-success/10", tip: "10 min/day compounds." },
      { label: "Exercise", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Posture matters for endurance." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Hydrate before practice." },
      { label: "Admin / Gigs", hours: 2, icon: Briefcase, tone: "text-chart-3 bg-chart-3/10", tip: "Batch booking + emails." },
      { label: "Friends / Jam", hours: 2, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Play with others weekly." },
      { label: "Rest hands", hours: 1, icon: HeartPulse, tone: "text-chart-5 bg-chart-5/10", tip: "Stretch wrists, no scrolling." },
      { label: "Buffer", hours: 3, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Commute, setup, gear care." },
    ],
  },
  {
    id: "writer",
    name: "Writer / Researcher",
    emoji: "✍️",
    tagline: "Words first, distractions never.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Dreams = first drafts." },
      { label: "Writing (deep)", hours: 3, icon: PenTool, tone: "text-primary bg-primary/10", tip: "Same desk, same time, no internet." },
      { label: "Reading / Research", hours: 2, icon: BookOpen, tone: "text-success bg-success/10", tip: "Read 3x what you write." },
      { label: "Editing", hours: 1.5, icon: Brain, tone: "text-chart-5 bg-chart-5/10", tip: "Edit afternoon, write morning." },
      { label: "Walk / Think", hours: 1, icon: Leaf, tone: "text-success bg-success/10", tip: "Best ideas arrive walking." },
      { label: "Exercise", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "A sedentary writer is a sad writer." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Tea > endless coffee." },
      { label: "Admin / Pitches", hours: 1, icon: Briefcase, tone: "text-chart-3 bg-chart-3/10", tip: "Submit something weekly." },
      { label: "Social / Family", hours: 2, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Stories live with people." },
      { label: "Buffer", hours: 3, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Errands, transitions." },
    ],
  },
  {
    id: "doctor",
    name: "Doctor / Nurse",
    emoji: "🩺",
    tagline: "High-stakes work needs hard recovery.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Non-negotiable. Patients depend on it." },
      { label: "Clinical Hours", hours: 9, icon: Stethoscope, tone: "text-primary bg-primary/10", tip: "Hydrate. Sit when you can." },
      { label: "Notes / Charting", hours: 1.5, icon: PenTool, tone: "text-chart-3 bg-chart-3/10", tip: "Finish before you leave." },
      { label: "Exercise", hours: 0.75, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Recovery for body + brain." },
      { label: "Meals", hours: 1.25, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Pack one. Eat sitting." },
      { label: "Decompression", hours: 1, icon: HeartPulse, tone: "text-chart-5 bg-chart-5/10", tip: "Shower, change, leave work at door." },
      { label: "Family / Quiet", hours: 1.5, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Touch grass with loved ones." },
      { label: "Buffer", hours: 1, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Commute, prep." },
    ],
  },
  {
    id: "military",
    name: "Military / First-Responder",
    emoji: "🛡️",
    tagline: "Discipline, recovery, brotherhood.",
    blocks: [
      { label: "Sleep", hours: 7, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Catch naps when ops allow." },
      { label: "PT / Training", hours: 1.5, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Strength + conditioning daily." },
      { label: "Mission / Duty", hours: 9, icon: ShieldCheck, tone: "text-primary bg-primary/10", tip: "Stay locked in. Hydrate." },
      { label: "Skills / Drills", hours: 1, icon: Brain, tone: "text-chart-5 bg-chart-5/10", tip: "Sharpness = survival." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Fuel like an athlete." },
      { label: "Recovery / Stretch", hours: 0.5, icon: HeartPulse, tone: "text-chart-5 bg-chart-5/10", tip: "Mobility prevents injury." },
      { label: "Brothers / Family", hours: 2, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Tight bonds save lives." },
      { label: "Quiet / Reflect", hours: 0.5, icon: Moon, tone: "text-muted-foreground bg-muted", tip: "Process the day." },
      { label: "Buffer", hours: 1, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Gear, prep, transit." },
    ],
  },
  {
    id: "executive",
    name: "Executive / Manager",
    emoji: "🏢",
    tagline: "High leverage, high attention to recovery.",
    blocks: [
      { label: "Sleep", hours: 7.5, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Decisions degrade fast without sleep." },
      { label: "Strategy / Deep work", hours: 2, icon: Brain, tone: "text-chart-5 bg-chart-5/10", tip: "Block calendar 8–10 am." },
      { label: "Meetings / 1-on-1s", hours: 4, icon: Users, tone: "text-chart-3 bg-chart-3/10", tip: "End 5 min early. Always." },
      { label: "Email / Comms", hours: 1.5, icon: Briefcase, tone: "text-primary bg-primary/10", tip: "Two windows: 11 am + 4 pm." },
      { label: "Exercise", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Treadmill walks during calls." },
      { label: "Meals", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Lunch away from desk." },
      { label: "Family / Partner", hours: 2, icon: HeartPulse, tone: "text-chart-4 bg-chart-4/10", tip: "Phone in another room." },
      { label: "Reading / Learning", hours: 1, icon: BookOpen, tone: "text-success bg-success/10", tip: "Read what your team isn't." },
      { label: "Buffer", hours: 3.5, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Commute, transitions." },
    ],
  },
  {
    id: "nomad",
    name: "Digital Nomad",
    emoji: "🌍",
    tagline: "Travel + remote work = needs structure.",
    blocks: [
      { label: "Sleep", hours: 8, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Earplugs + eye mask in your bag." },
      { label: "Focused Work", hours: 5, icon: Briefcase, tone: "text-primary bg-primary/10", tip: "Same hours daily, even across timezones." },
      { label: "Explore / Walk", hours: 2, icon: Globe, tone: "text-chart-2 bg-chart-2/10", tip: "Walk one new neighborhood." },
      { label: "Exercise", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Bodyweight routine works anywhere." },
      { label: "Meals (local)", hours: 1.5, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Eat where locals eat." },
      { label: "Logistics / Travel", hours: 1.5, icon: Plane, tone: "text-chart-3 bg-chart-3/10", tip: "Bookings, laundry, sim cards." },
      { label: "Friends / Calls home", hours: 2, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Schedule calls — don't drift apart." },
      { label: "Hobby / Reading", hours: 1, icon: BookOpen, tone: "text-success bg-success/10", tip: "A book = a portable home." },
      { label: "Buffer", hours: 2, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Visa runs, downtime." },
    ],
  },
  {
    id: "minimal",
    name: "Mindful / Minimalist",
    emoji: "🍃",
    tagline: "Less doing, more being.",
    blocks: [
      { label: "Sleep", hours: 9, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Early to bed, early to rise." },
      { label: "Meditation", hours: 1, icon: Brain, tone: "text-chart-5 bg-chart-5/10", tip: "Two 30-min sits, morning + evening." },
      { label: "Slow Work", hours: 5, icon: Briefcase, tone: "text-primary bg-primary/10", tip: "One thing at a time." },
      { label: "Walk in nature", hours: 1.5, icon: Mountain, tone: "text-success bg-success/10", tip: "Trees > screens." },
      { label: "Yoga / Movement", hours: 0.75, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Mobility daily." },
      { label: "Meals (mindful)", hours: 2, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Cook slow. Eat slower." },
      { label: "Reading", hours: 1.5, icon: BookOpen, tone: "text-success bg-success/10", tip: "Paper, no notifications." },
      { label: "Conversation", hours: 1.5, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "Phones face-down at the table." },
      { label: "Quiet / Reflect", hours: 0.75, icon: Moon, tone: "text-muted-foreground bg-muted", tip: "Journal three lines." },
      { label: "Buffer", hours: 1, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Chores done with attention." },
    ],
  },
  {
    id: "weekend",
    name: "Restorative Weekend",
    emoji: "☀️",
    tagline: "Recharge so Monday doesn't crush you.",
    blocks: [
      { label: "Sleep (lie-in OK)", hours: 9, icon: Bed, tone: "text-chart-2 bg-chart-2/10", tip: "Max 1 hr later than weekday wake." },
      { label: "Outdoors / Nature", hours: 2.5, icon: Mountain, tone: "text-success bg-success/10", tip: "Hike, park, beach, garden." },
      { label: "Family / Friends", hours: 4, icon: Users, tone: "text-chart-4 bg-chart-4/10", tip: "The whole point of weekends." },
      { label: "Hobby / Project", hours: 2, icon: Sparkles, tone: "text-chart-5 bg-chart-5/10", tip: "Make something with hands." },
      { label: "Meals (slow)", hours: 2, icon: Utensils, tone: "text-warning bg-warning/10", tip: "Cook together. Eat together." },
      { label: "Exercise / Sport", hours: 1, icon: Dumbbell, tone: "text-success bg-success/10", tip: "Play, don't just train." },
      { label: "Reading / Music", hours: 1.5, icon: BookOpen, tone: "text-success bg-success/10", tip: "Long-form, not feeds." },
      { label: "Plan the week", hours: 0.5, icon: Brain, tone: "text-primary bg-primary/10", tip: "30 min Sunday eve = calm Monday." },
      { label: "Buffer", hours: 1.5, icon: Coffee, tone: "text-muted-foreground bg-muted", tip: "Chores, errands." },
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

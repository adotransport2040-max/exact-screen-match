import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Activity, BarChart3, ListChecks, Smile, Wallet, Sparkles, CalendarDays, NotebookPen } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background bg-gradient-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><Activity className="h-4 w-4" /></div>
          <span className="font-semibold tracking-tight">Life Analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">Log in</Link>
          <Link to="/signup" className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Get started</Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 pt-12 pb-20 text-center sm:pt-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="h-3 w-3" /> Your life, beautifully measured
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
          Build a <span className="text-gradient">better you</span>, one day at a time.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Track tasks, mood, expenses and screen time. Get smart insights into how you really live.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/signup" className="rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95">Start free</Link>
          <Link to="/login" className="rounded-xl border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent">I have an account</Link>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: BarChart3, label: "Dashboard" },
            { icon: ListChecks, label: "Tasks" },
            { icon: Smile, label: "Mood" },
            { icon: Wallet, label: "Expenses" },
            { icon: Sparkles, label: "Insights" },
            { icon: CalendarDays, label: "Planner" },
            { icon: NotebookPen, label: "Notes" },
            { icon: Activity, label: "Reports" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-2xl border bg-card/60 p-4 text-left shadow-sm backdrop-blur">
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-2 text-sm font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

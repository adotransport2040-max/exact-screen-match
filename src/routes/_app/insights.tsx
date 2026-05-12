import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card } from "@/components/ui-kit";
import { BarChart3, Smartphone, Smile, Target, Lightbulb } from "lucide-react";
import { format, subDays, parseISO, differenceInDays } from "date-fns";

export const Route = createFileRoute("/_app/insights")({ component: InsightsPage });

type Insight = { icon: any; tone: string; title: string; body: string };

function InsightsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const since = format(subDays(new Date(), 29), "yyyy-MM-dd");
    Promise.all([
      supabase.from("daily_logs").select("*").eq("user_id", user.id).gte("log_date", since).order("log_date"),
      supabase.from("tasks").select("*").eq("user_id", user.id).gte("task_date", since),
      supabase.from("expenses").select("*").eq("user_id", user.id).gte("expense_date", since),
    ]).then(([l, t, e]) => { setLogs(l.data ?? []); setTasks(t.data ?? []); setExpenses(e.data ?? []); });
  }, [user]);

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    const days = Math.max(1, logs.length);
    const avgStudy = logs.reduce((s, l) => s + Number(l.study_hours || 0), 0) / days;
    const avgWork = logs.reduce((s, l) => s + Number(l.work_hours || 0), 0) / days;
    const avgScreen = logs.reduce((s, l) => s + Number(l.screen_time || 0), 0) / days;
    const happyLogs = logs.filter(l => l.mood === "happy");
    const happyProd = happyLogs.length ? happyLogs.reduce((s, l) => s + Number(l.study_hours || 0) + Number(l.work_hours || 0), 0) / happyLogs.length : 0;
    const otherLogs = logs.filter(l => l.mood !== "happy" && l.mood);
    const otherProd = otherLogs.length ? otherLogs.reduce((s, l) => s + Number(l.study_hours || 0) + Number(l.work_hours || 0), 0) / otherLogs.length : 0;
    const moodDiff = otherProd > 0 ? Math.round(((happyProd - otherProd) / otherProd) * 100) : 0;

    // Streak — consecutive days with any log
    const sorted = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));
    let streak = 0; let cursor = new Date();
    for (const l of sorted) {
      if (differenceInDays(cursor, parseISO(l.log_date)) <= streak) { streak++; cursor = parseISO(l.log_date); }
      else break;
    }

    out.push({
      icon: BarChart3, tone: "text-primary bg-primary/10",
      title: "Productivity Pattern",
      body: avgStudy + avgWork >= 4 ? `You average ${(avgStudy + avgWork).toFixed(1)}h focus daily — most productive between 9AM-12PM.` : "Log a few more days to detect your peak hours.",
    });
    out.push({
      icon: Smartphone, tone: "text-warning bg-warning/10",
      title: "Screen Time Alert",
      body: avgScreen > 5 ? `Your screen time is above average (${avgScreen.toFixed(1)}h). Consider reducing it.` : `Screen time is healthy at ${avgScreen.toFixed(1)}h/day.`,
    });
    out.push({
      icon: Smile, tone: "text-chart-4 bg-chart-4/10",
      title: "Mood Correlation",
      body: moodDiff > 0 ? `Your productivity is ${moodDiff}% higher on happy days.` : "Track more moods to unlock correlation.",
    });
    out.push({
      icon: Target, tone: "text-success bg-success/10",
      title: "Consistency Streak",
      body: streak >= 2 ? `Great! You have been consistent for ${streak} days.` : "Log today to start a streak.",
    });
    out.push({
      icon: Lightbulb, tone: "text-destructive bg-destructive/10",
      title: "Suggestion",
      body: avgScreen > 5 ? "Try planning your next day before 10PM for better results." : "Schedule a deep-work block tomorrow morning.",
    });

    if (expenses.length) {
      const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
      out.push({
        icon: BarChart3, tone: "text-primary bg-primary/10",
        title: "Spending Pulse", body: `$${total.toFixed(2)} spent over the last 30 days.`,
      });
    }
    return out;
  }, [logs, expenses]);

  return (
    <div>
      <PageHeader title="Smart Insights" subtitle="Patterns from your last 30 days" />
      <div className="space-y-2">
        {insights.map((ins, i) => (
          <Card key={i} className="!p-3.5">
            <div className="flex items-start gap-3">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${ins.tone}`}>
                <ins.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{ins.title}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">{ins.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

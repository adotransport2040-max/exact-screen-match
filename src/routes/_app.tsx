import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { NotificationBell } from "@/components/notification-bell";
import {
  LayoutDashboard, ListChecks, Smile, Wallet, Sparkles,
  CalendarDays, NotebookPen, FileBarChart, Sun, Moon, LogOut, Activity, Menu, X, LifeBuoy,
} from "lucide-react";

export const Route = createFileRoute("/_app")({ component: AppLayout });

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "Helper / Assistant", icon: LifeBuoy },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/mood", label: "Mood", icon: Smile },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/planner", label: "Planner", icon: CalendarDays },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/reports", label: "Reports", icon: FileBarChart },
] as const;

function AppLayout() {
  const nav = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);
  useEffect(() => { setOpen(false); }, [path]);

  if (loading || !user) return <div className="min-h-screen bg-background" />;

  const NavList = () => (
    <nav className="space-y-1">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = path === to;
        return (
          <Link
            key={to} to={to}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-gradient-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r bg-card/40 p-4 lg:block">
        <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-1">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant"><Activity className="h-4 w-4" /></div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold">Life Analytics</span>
            <span className="text-[10px] font-medium tracking-wide text-muted-foreground">Built by Bishal</span>
          </div>
        </Link>

        <NavList />
        <div className="mt-6 space-y-1 border-t pt-4">
          <button onClick={toggle} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button onClick={() => signOut().then(() => nav({ to: "/" }))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r bg-card p-4 shadow-glow">
            <div className="mb-6 flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><Activity className="h-4 w-4" /></div>
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold">Life Analytics</span>
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground">Built by Bishal</span>
                </div>
              </Link>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <NavList />
            <div className="mt-6 space-y-1 border-t pt-4">
              <button onClick={toggle} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button onClick={() => signOut().then(() => nav({ to: "/" }))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-accent"><Menu className="h-5 w-5" /></button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><Activity className="h-3.5 w-3.5" /></div>
            <span className="text-sm font-semibold">Life Analytics</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={toggle} className="rounded-lg p-2 hover:bg-accent">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Top bar (desktop) */}
        <header className="sticky top-0 z-30 hidden items-center justify-end gap-2 border-b bg-background/60 px-6 py-3 backdrop-blur lg:flex">
          <NotificationBell />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

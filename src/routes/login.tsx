import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    nav({ to: "/dashboard" });
  };

  return <AuthShell title="Welcome back" subtitle="Log in to continue tracking your life">
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" type="email" value={email} onChange={setEmail} required />
      <Field label="Password" type="password" value={password} onChange={setPassword} required />
      <button disabled={busy} className="w-full rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
    <div className="mt-4 flex items-center justify-between text-sm">
      <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">Forgot password?</Link>
      <Link to="/signup" className="font-medium text-primary">Create account</Link>
    </div>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background bg-gradient-hero px-5 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><Activity className="h-4 w-4" /></div>
          <span className="font-semibold">Life Analytics</span>
        </Link>
        <div className="rounded-3xl border bg-card p-6 shadow-elegant sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, type = "text", value, onChange, required, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type} value={value} required={required} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none ring-ring/30 transition focus:border-primary focus:ring-2"
      />
    </label>
  );
}

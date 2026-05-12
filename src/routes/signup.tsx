import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { display_name: name },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created!");
    nav({ to: "/dashboard" });
  };

  return <AuthShell title="Create account" subtitle="Start your life analytics journey">
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" value={name} onChange={setName} required />
      <Field label="Email" type="email" value={email} onChange={setEmail} required />
      <Field label="Password" type="password" value={password} onChange={setPassword} required />
      <button disabled={busy} className="w-full rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
        {busy ? "Creating account..." : "Create account"}
      </button>
    </form>
    <p className="mt-4 text-center text-sm text-muted-foreground">
      Already have an account? <Link to="/login" className="font-medium text-primary">Sign in</Link>
    </p>
  </AuthShell>;
}

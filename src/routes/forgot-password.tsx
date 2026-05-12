import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Check your email for the reset link");
  };

  return <AuthShell title="Reset password" subtitle="We'll email you a reset link">
    {sent ? (
      <div className="rounded-xl border bg-accent/40 p-4 text-sm">
        We sent a password reset link to <strong>{email}</strong>. Check your inbox.
      </div>
    ) : (
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <button disabled={busy} className="w-full rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
          {busy ? "Sending..." : "Send reset link"}
        </button>
      </form>
    )}
    <p className="mt-4 text-center text-sm">
      <Link to="/login" className="text-muted-foreground hover:text-foreground">← Back to login</Link>
    </p>
  </AuthShell>;
}

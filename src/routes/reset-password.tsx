import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    nav({ to: "/dashboard" });
  };

  return <AuthShell title="Set a new password">
    <form onSubmit={submit} className="space-y-4">
      <Field label="New password" type="password" value={password} onChange={setPassword} required />
      <button disabled={busy} className="w-full rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
        {busy ? "Updating..." : "Update password"}
      </button>
    </form>
  </AuthShell>;
}

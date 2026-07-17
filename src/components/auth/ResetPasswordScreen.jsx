"use client";

import { useEffect, useState } from "react";

import { updatePassword } from "@/app/actions/auth";
import { AuthAlert, AuthLayout, AuthLink } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { validatePasswordForm } from "@/lib/password";

export function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [hasSession, setHasSession] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setHasSession(Boolean(user));
    }

    checkSession();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const validation = validatePasswordForm(password, confirmPassword);

    if (!validation.valid) {
      setMessage(validation.error);
      setIsSubmitting(false);
      return;
    }

    const result = await updatePassword(password, confirmPassword);

    if (result?.error) {
      setMessage(result.error);
    }

    setIsSubmitting(false);
  }

  if (hasSession === null) {
    return (
      <AuthLayout title="Nieuw wachtwoord">
        <p className="text-sm text-muted-foreground">Sessie controleren...</p>
      </AuthLayout>
    );
  }

  if (!hasSession) {
    return (
      <AuthLayout
        title="Nieuw wachtwoord"
        description="Je resetlink is verlopen of ongeldig."
      >
        <AuthAlert message="Vraag een nieuwe resetlink aan om verder te gaan." />
        <div className="text-center">
          <AuthLink href="/forgot-password">Nieuwe resetlink aanvragen</AuthLink>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nieuw wachtwoord"
      description="Kies een nieuw wachtwoord voor je account."
    >
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <label htmlFor="reset-password" className="text-sm font-medium">
            Nieuw wachtwoord
          </label>
          <Input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Min. 8 tekens, 1 hoofdletter en 1 cijfer
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="reset-confirm-password" className="text-sm font-medium">
            Bevestig wachtwoord
          </label>
          <Input
            id="reset-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Opslaan..." : "Wachtwoord opslaan"}
        </Button>
      </form>

      <AuthAlert message={message} />
    </AuthLayout>
  );
}

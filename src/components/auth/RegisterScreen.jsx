"use client";

import { useState } from "react";

import { registerWithEmailPassword } from "@/app/actions/auth";
import { AuthAlert, AuthLayout, AuthLink } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validatePasswordForm } from "@/lib/password";

export function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsSuccess(false);

    const validation = validatePasswordForm(password, confirmPassword);

    if (!validation.valid) {
      setMessage(validation.error);
      setIsSubmitting(false);
      return;
    }

    const result = await registerWithEmailPassword(email, password, confirmPassword);

    if (result?.success) {
      setIsSuccess(true);
      setMessage(result.message ?? "Account aangemaakt. Je kunt nu inloggen.");
    } else if (result?.error) {
      setMessage(result.error);
    }

    setIsSubmitting(false);
  }

  return (
    <AuthLayout
      title="Registreren"
      description="Stel een wachtwoord in voor je account. Alleen mogelijk als je admin je e-mail al heeft toegevoegd."
    >
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <label htmlFor="register-email" className="text-sm font-medium">
            E-mail
          </label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="jouw@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="register-password" className="text-sm font-medium">
            Wachtwoord
          </label>
          <Input
            id="register-password"
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
          <label htmlFor="register-confirm-password" className="text-sm font-medium">
            Bevestig wachtwoord
          </label>
          <Input
            id="register-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Registreren..." : "Account aanmaken"}
        </Button>
      </form>

      <AuthAlert message={message} variant={isSuccess ? "success" : "error"} />

      <div className="text-center">
        <AuthLink href="/">Al een account? Inloggen</AuthLink>
      </div>
    </AuthLayout>
  );
}

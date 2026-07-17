"use client";

import { useState } from "react";

import { signInWithEmailPassword } from "@/app/actions/auth";
import { AuthAlert, AuthLayout, AuthLink } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginScreen({ authError = null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(authError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await signInWithEmailPassword(email, password);

    if (result?.error) {
      setMessage(result.error);
    }

    setIsSubmitting(false);
  }

  return (
    <AuthLayout
      title="Inloggen"
      description="Log in met het e-mailadres dat je admin voor je heeft geregistreerd."
    >
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium">
            E-mail
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="jouw@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="text-sm font-medium">
            Wachtwoord
          </label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Inloggen..." : "Inloggen"}
        </Button>
      </form>

      <AuthAlert message={message} />

      <div className="flex flex-col gap-2 text-center">
        <AuthLink href="/register">Eerste keer? Registreer je account</AuthLink>
        <AuthLink href="/forgot-password">Wachtwoord vergeten?</AuthLink>
      </div>
    </AuthLayout>
  );
}

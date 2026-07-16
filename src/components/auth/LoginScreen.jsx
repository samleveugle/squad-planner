"use client";

import { useState } from "react";

import { sendMagicLink } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function LoginScreen({ authError = null }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(authError);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsSuccess(false);

    const result = await sendMagicLink(email);

    if (result.success) {
      setIsSuccess(true);
      setMessage(result.message);
    } else {
      setMessage(result.error);
    }

    setIsSubmitting(false);
  }

  return (
    <div className="min-h-full bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-6">
          <div>
            <p className="text-sm font-medium text-emerald-600">Squad Planner</p>
            <h1 className="text-2xl font-bold tracking-tight">Inloggen</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-10">
        <p className="text-sm text-muted-foreground">
          Vul het e-mailadres in dat je admin voor je heeft geregistreerd. Je
          krijgt een magic link om in te loggen.
        </p>

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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Versturen..." : "Stuur loginlink"}
          </Button>
        </form>

        {message && (
          <div
            role="alert"
            className={`rounded-lg border px-4 py-3 text-sm ${
              isSuccess
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
            }`}
          >
            {message}
          </div>
        )}
      </main>
    </div>
  );
}

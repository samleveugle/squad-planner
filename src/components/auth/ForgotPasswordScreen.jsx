"use client";

import { useState } from "react";

import { requestPasswordReset } from "@/app/actions/auth";
import { AuthAlert, AuthLayout, AuthLink } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsSuccess(false);

    const result = await requestPasswordReset(email);

    if (result.success) {
      setIsSuccess(true);
      setMessage(result.message);
    } else {
      setMessage(result.error);
    }

    setIsSubmitting(false);
  }

  return (
    <AuthLayout
      title="Wachtwoord vergeten"
      description="Vul je e-mail in. Je ontvangt een link om een nieuw wachtwoord in te stellen."
    >
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <label htmlFor="forgot-email" className="text-sm font-medium">
            E-mail
          </label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="jouw@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Versturen..." : "Stuur resetlink"}
        </Button>
      </form>

      <AuthAlert message={message} variant={isSuccess ? "success" : "error"} />

      <div className="text-center">
        <AuthLink href="/">Terug naar inloggen</AuthLink>
      </div>
    </AuthLayout>
  );
}

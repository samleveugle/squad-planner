"use client";

import { useState } from "react";

import { requestPasswordReset } from "@/app/actions/auth";
import { AuthAlert, AuthLayout, AuthLink } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAlertMessage } from "@/lib/auth-errors";

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

    // #region agent log
    fetch("http://127.0.0.1:7891/ingest/2b6b089d-7eb8-434a-b07c-a2e87411d81f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d077e5",
      },
      body: JSON.stringify({
        sessionId: "d077e5",
        runId: "post-fix",
        hypothesisId: "H1-H3",
        location: "ForgotPasswordScreen.jsx:handleSubmit",
        message: "server action result received",
        data: {
          resultType: typeof result,
          resultIsArray: Array.isArray(result),
          resultIsNull: result == null,
          success: result?.success ?? null,
          errorType: result?.error != null ? typeof result.error : null,
          errorIsArray: Array.isArray(result?.error),
          messageType: result?.message != null ? typeof result.message : null,
          messageIsArray: Array.isArray(result?.message),
          errorPreview:
            result?.error != null
              ? String(result.error).slice(0, 80)
              : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (result?.success) {
      setIsSuccess(true);
      setMessage(
        formatAlertMessage(
          result.message,
          "Resetlink verstuurd. Check ook je spam."
        )
      );
    } else {
      setIsSuccess(false);
      setMessage(
        formatAlertMessage(result?.error, "Kon resetlink niet versturen.")
      );
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

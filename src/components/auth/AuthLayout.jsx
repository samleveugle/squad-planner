import Link from "next/link";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function AuthLayout({ title, description, children }) {
  return (
    <div className="min-h-full bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-6">
          <div>
            <p className="text-sm font-medium text-emerald-600">Squad Planner</p>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-10">
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {children}
      </main>
    </div>
  );
}

export function AuthAlert({ message, variant = "error" }) {
  if (!message) {
    return null;
  }

  const isSuccess = variant === "success";

  return (
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
  );
}

export function AuthLink({ href, children }) {
  return (
    <Link href={href} className="text-sm font-medium text-emerald-600 hover:underline">
      {children}
    </Link>
  );
}

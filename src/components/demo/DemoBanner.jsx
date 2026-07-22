import Link from "next/link";

export function DemoBanner() {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
      <p className="font-medium">Demo — alleen bekijken</p>
      <p className="mt-1 text-emerald-900/80 dark:text-emerald-100/80">
        Fictieve ploeg met voorbeelddata. Gebruik de rolswitch (Speler / Admin) om alles te
        verkennen. Wijzigingen worden niet opgeslagen.{" "}
        <Link href="/" className="font-medium underline underline-offset-2">
          Terug naar inloggen
        </Link>
      </p>
    </div>
  );
}

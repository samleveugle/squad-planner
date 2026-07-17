import { LoginScreen } from "@/components/auth/LoginScreen";
import { SquadPlanner } from "@/components/SquadPlanner";
import { getCurrentPlayer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const player = await getCurrentPlayer();

  if (!player) {
    const authError =
      params?.error === "auth"
        ? "Inloggen mislukt. Probeer opnieuw of vraag een nieuwe resetlink aan."
        : null;

    return <LoginScreen authError={authError} />;
  }

  return <SquadPlanner currentPlayer={player} />;
}

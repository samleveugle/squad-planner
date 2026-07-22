import { SquadPlanner } from "@/components/SquadPlanner";
import { getDemoCurrentPlayer } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Demo | Squad Planner",
  description: "Bekijk Squad Planner zonder inloggen — fictieve ploeg, read-only.",
};

export default function DemoPage() {
  return <SquadPlanner currentPlayer={getDemoCurrentPlayer()} isDemo />;
}

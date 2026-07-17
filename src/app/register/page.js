import { redirect } from "next/navigation";

import { RegisterScreen } from "@/components/auth/RegisterScreen";
import { getCurrentPlayer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const player = await getCurrentPlayer();

  if (player) {
    redirect("/");
  }

  return <RegisterScreen />;
}

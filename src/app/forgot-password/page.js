import { redirect } from "next/navigation";

import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";
import { getCurrentPlayer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const player = await getCurrentPlayer();

  if (player) {
    redirect("/");
  }

  return <ForgotPasswordScreen />;
}

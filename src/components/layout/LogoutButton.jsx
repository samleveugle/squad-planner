"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="sm">
        Uitloggen
      </Button>
    </form>
  );
}

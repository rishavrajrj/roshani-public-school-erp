"use client";

import { useState } from "react";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);
    try {
      await logoutAction();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      isLoading={isPending}
      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      Log out
    </Button>
  );
}

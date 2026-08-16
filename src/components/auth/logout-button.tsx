'use client'

import { useState } from "react";
import { logoutAction } from "@/lib/auth/actions";
import { broadcastAuthLogout } from "./multi-tab-auth-sync";
import { Button } from "@/components/ui/button";

export interface LogoutButtonProps {
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link' | 'success'
  children?: React.ReactNode
}

export function LogoutButton({
  className = 'w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50',
  variant = 'ghost',
  children = 'Log out',
}: LogoutButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);
    try {
      broadcastAuthLogout();
      await logoutAction();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleLogout}
      isLoading={isPending}
      className={className}
    >
      {children}
    </Button>
  );
}

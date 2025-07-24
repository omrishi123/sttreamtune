"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { PlayerLayout } from "@/components/player-layout";
import { onAuthChange } from "@/lib/auth";
import type { User } from "@/lib/types";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  // Pass user to PlayerLayout
  return <PlayerLayout user={user}>{children}</PlayerLayout>;
}

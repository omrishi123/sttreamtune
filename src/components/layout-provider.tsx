"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { PlayerLayout } from "@/components/player-layout";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  return <PlayerLayout>{children}</PlayerLayout>;
}

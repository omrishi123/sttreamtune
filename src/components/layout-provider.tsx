"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { PlayerLayout } from "@/components/player-layout";
import { getSession } from "@/lib/auth";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // This is a simple protection mechanism.
  // In a real app, this would be handled by middleware.
  React.useEffect(() => {
    const session = getSession();
    if (!session.isLoggedIn && !isAuthPage && !session.user) {
       // Allow guest access, but if there's no user at all, redirect to login.
       const guestAllowed = localStorage.getItem('guest-access') === 'true';
       if (!guestAllowed) {
         // router.push("/login");
       }
    }
  }, [pathname, router, isAuthPage]);


  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  return <PlayerLayout>{children}</PlayerLayout>;
}

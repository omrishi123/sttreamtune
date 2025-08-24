
"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { PlayerLayout } from "@/components/player-layout";
import { onAuthChange } from "@/lib/auth";
import type { User } from "@/lib/types";
import { UserDataProvider } from "@/context/user-data-context";
import { PlayerProvider } from "@/context/player-context";
import { Icons } from "./icons";
import { useAppUpdate } from "@/hooks/use-app-update";
import { UpdateDialog } from "./update-dialog";

const loadingMessages = [
  "Tuning the instruments...",
  "Cueing up the first track...",
  "Polishing the vinyl...",
  "Building your library...",
  "Checking the sound levels...",
];

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showUpdateDialog, updateUrl, latestVersion, updateNotes } = useAppUpdate();
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  if (loading) {
     return (
       <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Icons.logo className="h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground transition-opacity duration-500">
            {loadingMessages[loadingMessageIndex]}
          </p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    // This can happen briefly between loading and user being set.
    // Or if auth state fails to resolve to a user or guest.
     return (
       <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Icons.logo className="h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <UserDataProvider>
      <PlayerProvider>
        <PlayerLayout user={user}>
          {children}
          <UpdateDialog 
            isOpen={showUpdateDialog} 
            updateUrl={updateUrl} 
            latestVersion={latestVersion}
            updateNotes={updateNotes}
          />
        </PlayerLayout>
      </PlayerProvider>
    </UserDataProvider>
  );
}

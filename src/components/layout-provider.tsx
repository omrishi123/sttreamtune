
"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { PlayerLayout } from "@/components/player-layout";
import { onAuthChange } from "@/lib/auth";
import type { User, Track } from "@/lib/types";
import { UserDataProvider, useUserData } from "@/context/user-data-context";
import { PlayerProvider, usePlayer } from "@/context/player-context";
import { Icons } from "./icons";


function AppInitializer({ children }: { children: React.ReactNode }) {
  const { addRecentlyPlayed, addTrackToCache } = useUserData();
  const { currentTrack } = usePlayer();
  const [lastPlayedTrackId, setLastPlayedTrackId] = useState<string | null>(null);

  useEffect(() => {
    if (currentTrack && currentTrack.id !== lastPlayedTrackId) {
      addTrackToCache(currentTrack);
      addRecentlyPlayed(currentTrack.id);
      setLastPlayedTrackId(currentTrack.id);
    }
  }, [currentTrack, addRecentlyPlayed, addTrackToCache, lastPlayedTrackId]);

  return <>{children}</>;
}


export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  if (loading) {
     return (
       <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Icons.logo className="h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <UserDataProvider user={user!}>
      <PlayerProvider>
        <AppInitializer>
          <PlayerLayout user={user!}>{children}</PlayerLayout>
        </AppInitializer>
      </PlayerProvider>
    </UserDataProvider>
  );
}

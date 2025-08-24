
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

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showUpdateDialog, updateUrl, latestVersion, updateNotes } = useAppUpdate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      // Simulate loading progress even after auth is resolved to make it look smooth
      const progressInterval = setInterval(() => {
          setProgress(oldProgress => {
              if (oldProgress >= 100) {
                  clearInterval(progressInterval);
                  setLoading(false);
                  return 100;
              }
              return oldProgress + 10;
          });
      }, 120);
    });

    return () => unsubscribe();
  }, []);

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  if (loading || !user) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-background to-blue-900 text-white">
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
                    <Icons.logo className="h-8 w-8" />
                    <span className="font-headline">StreamTune</span>
                </h1>
                <div className="flex gap-1.5 items-end h-8">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1.5 h-full bg-white/80 rounded animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                        ></div>
                    ))}
                </div>
                <p className="mt-6 text-sm text-white/80">Tuning your experience... {progress}%</p>
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

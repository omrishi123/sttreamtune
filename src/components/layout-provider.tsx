
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PlayerLayout } from "@/components/player-layout";
import { onAuthChange } from "@/lib/auth";
import type { User } from "@/lib/types";
import { UserDataProvider } from "@/context/user-data-context";
import { PlayerProvider } from "@/context/player-context";
import { Icons } from "@/components/icons";
import { useAppUpdate } from "@/hooks/use-app-update";
import { UpdateDialog } from "@/components/update-dialog";
import { cn } from "@/lib/utils";
import { hasSelectedPreferences, clearUserPreferences } from "@/lib/preferences";
import { useRecommendationRefresh } from "@/hooks/use-recommendation-refresh";
import { RefreshRecommendationsDialog } from "@/components/refresh-recommendations-dialog";
import { Music } from "lucide-react";

const loadingSubtitles = [
    "Tuning your vibe...",
    "Finding your rhythm...",
    "Warming up the equalizer...",
    "Curating the perfect flow..."
];

interface Particle {
  id: number;
  char: string;
  style: React.CSSProperties;
}

function AnimatedLoadingScreen({ isVisible }: { isVisible: boolean }) {
    const [subtitle, setSubtitle] = useState(loadingSubtitles[0]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const notes = ["♪", "♫", "♬", "♭", "𝄞", "♩"];
        const spawnParticle = () => {
            const newParticle: Particle = {
                id: Date.now() + Math.random(),
                char: notes[Math.floor(Math.random() * notes.length)],
                style: {
                    left: `${Math.random() * 100}vw`,
                    animationDelay: `${Math.random() * 1}s`, // Reduced delay for faster start
                    fontSize: `${14 + Math.random() * 20}px`,
                },
            };
            setParticles(prev => [...prev, newParticle].slice(-25)); // Increased particle limit

            setTimeout(() => {
                setParticles(prev => prev.filter(p => p.id !== newParticle.id));
            }, 6000);
        };
        
        // Spawn particles more frequently
        const particleInterval = setInterval(spawnParticle, 200);
        return () => clearInterval(particleInterval);
    }, []);

    useEffect(() => {
        const progressTimer = setInterval(() => {
            setProgress(oldProgress => {
                if (oldProgress >= 100) {
                    clearInterval(progressTimer);
                    return 100;
                }
                return oldProgress + 2;
            });
        }, 100); 

        const subtitleInterval = setInterval(() => {
            setSubtitle(prev => {
                const currentIndex = loadingSubtitles.indexOf(prev);
                return loadingSubtitles[(currentIndex + 1) % loadingSubtitles.length];
            });
        }, 2000);

        return () => {
            clearInterval(progressTimer);
            clearInterval(subtitleInterval);
        };
    }, []);

    return (
         <div className={cn(
            "fixed inset-0 z-[200] overflow-hidden bg-[#0d001a] transition-opacity duration-1000 ease-in-out",
            isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
         )}>
            {/* Deep Purple Gradient Background */}
            <div className="fixed inset-0 bg-gradient-to-b from-[#2a004f] via-[#0d001a] to-[#0d001a]"></div>
            
            {/* Floating Particles - Pure white and visible */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden text-white/40">
                {particles.map(p => (
                    <div key={p.id} className="note absolute bottom-[-40px] animate-float font-bold" style={p.style}>
                        {p.char}
                    </div>
                ))}
            </div>

            <div className="fixed inset-0 grid place-items-center p-6">
                <div className="w-full max-w-[420px] aspect-[16/11] rounded-[40px] p-8 text-center bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center">
                    
                    {/* Header: Glowy Icon + Name */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-400/40 blur-xl rounded-2xl animate-pulse"></div>
                            <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 flex items-center justify-center shadow-lg">
                                <Music className="h-7 w-7 text-white" />
                            </div>
                        </div>
                        <span className="text-4xl font-bold tracking-tight text-white font-headline">StreamTune</span>
                    </div>

                    {/* Orange Bouncing Equalizer Bars */}
                    <div className="flex justify-center gap-2 mb-6 h-6 items-end">
                        <span className="w-2 rounded-full bg-[#f97316] animate-bounce-loader [animation-delay:-0.4s]"></span>
                        <span className="w-2 rounded-full bg-[#f97316] animate-bounce-loader [animation-delay:-0.2s]"></span>
                        <span className="w-2 rounded-full bg-[#f97316] animate-bounce-loader"></span>
                        <span className="w-2 rounded-full bg-[#f97316] animate-bounce-loader [animation-delay:0.2s]"></span>
                        <span className="w-2 rounded-full bg-[#f97316] animate-bounce-loader [animation-delay:0.4s]"></span>
                    </div>

                    {/* Subtitle & Progress */}
                    <div className="space-y-2">
                        <div className="text-xl font-medium text-white/80">{subtitle}</div>
                        <div className="text-2xl font-bold tracking-wider text-white">{progress}%</div>
                    </div>
                    
                    {/* Credit Footer */}
                    <div className="mt-10 text-xs opacity-50 font-medium text-white tracking-wide">
                        App Made By Om Rishi i.g omrishi07
                    </div>
                </div>
            </div>
        </div>
    );
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isWelcomePage = pathname === "/welcome";

  const [user, setUser] = useState<User | null>(null);
  const [isReadyForApp, setIsReadyForApp] = useState(false);
  
  const { showUpdateDialog, updateUrl, latestVersion, updateNotes } = useAppUpdate();
  const { showRefreshDialog, setShowRefreshDialog } = useRecommendationRefresh();

  useEffect(() => {
    const unsubscribe = onAuthChange((fbUser) => {
        if(fbUser) {
            if(user && user.id !== fbUser.id) {
                clearUserPreferences();
            }
            setUser(fbUser);
            if (hasSelectedPreferences()) {
                setIsReadyForApp(true);
            } else if (!isWelcomePage && !isAuthPage) {
                router.replace('/welcome');
            }
        } else {
            setUser(null);
        }
    });

    return () => unsubscribe();
  }, [user, router, isWelcomePage, isAuthPage]);
  
  useEffect(() => {
      if (isWelcomePage) {
          setIsReadyForApp(true);
      }
  }, [isWelcomePage]);

  if (isAuthPage || (isWelcomePage && user)) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="atmospheric-bg">
        <div className="light-leak leak-1" />
        <div className="light-leak leak-2" />
        <div className="light-leak leak-3" />
      </div>
      
      <AnimatedLoadingScreen isVisible={!isReadyForApp} />
      
      {isReadyForApp && user ? (
         <div className="transition-opacity duration-1000 ease-in-out opacity-100">
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
                  <RefreshRecommendationsDialog
                    isOpen={showRefreshDialog}
                    onOpenChange={setShowRefreshDialog}
                  />
                </PlayerLayout>
              </PlayerProvider>
            </UserDataProvider>
          </div>
      ) : (
        null
      )}
    </>
  );
}

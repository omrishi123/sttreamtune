
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

const loadingSubtitles = [
    "Tuning your vibe…",
    "Finding your rhythm…",
    "Warming up the equalizer…",
    "Curating the perfect flow…"
];

interface Particle {
  id: number;
  char: string;
  style: React.CSSProperties;
}

function AnimatedLoadingScreen({ isVisible }: { isVisible: boolean; isFirstLoad: boolean }) {
    const [subtitle, setSubtitle] = useState(loadingSubtitles[0]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const notes = ["♪", "♫", "♬", "𝄞"];
        const spawnParticle = () => {
            const newParticle: Particle = {
                id: Date.now() + Math.random(),
                char: notes[Math.floor(Math.random() * notes.length)],
                style: {
                    left: `${Math.random() * 100}vw`,
                    animationDelay: `${Math.random() * 3}s`,
                    fontSize: `${14 + Math.random() * 20}px`,
                },
            };
            setParticles(prev => [...prev, newParticle]);

            setTimeout(() => {
                setParticles(prev => prev.filter(p => p.id !== newParticle.id));
            }, 7000);
        };
        
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
                return oldProgress + 5;
            });
        }, 150); 

        const subtitleInterval = setInterval(() => {
            setSubtitle(prev => {
                const currentIndex = loadingSubtitles.indexOf(prev);
                return loadingSubtitles[(currentIndex + 1) % loadingSubtitles.length];
            });
        }, 1200);

        return () => {
            clearInterval(progressTimer);
            clearInterval(subtitleInterval);
        };
    }, []);

    return (
         <div className={cn(
            "fixed inset-0 z-[200] overflow-hidden bg-[#0096ff] transition-opacity duration-700 ease-in-out",
            isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
         )}>
            <div className="fixed inset-0 bg-gradient-to-br from-[#0096ff] via-[#007acc] to-[#005c99]"></div>
            
            <div className="fixed inset-0 pointer-events-none overflow-hidden text-white/40">
                {particles.map(p => (
                    <div key={p.id} className="note absolute bottom-[-24px] opacity-0 animate-float" style={p.style}>
                        {p.char}
                    </div>
                ))}
            </div>

            <div className="fixed inset-0 grid place-items-center p-6">
                <div className="w-full max-w-[480px] rounded-3xl p-8 text-center bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                    <div className="inline-grid grid-flow-col items-center gap-4 text-3xl font-extrabold tracking-tight text-white animate-pulse">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-lg">
                            <Icons.logo className="h-6 w-6 text-[#0096ff]"/>
                        </div>
                        <span>StreamTune</span>
                    </div>

                    <div className="flex justify-center gap-1.5 my-6 h-10 items-end">
                        <span className="w-2 rounded bg-white animate-bounce-loader [animation-delay:-0.4s]"></span>
                        <span className="w-2 rounded bg-white animate-bounce-loader [animation-delay:-0.3s]"></span>
                        <span className="w-2 rounded bg-white animate-bounce-loader [animation-delay:-0.2s]"></span>
                        <span className="w-2 rounded bg-white animate-bounce-loader [animation-delay:-0.1s]"></span>
                        <span className="w-2 rounded bg-white animate-bounce-loader"></span>
                    </div>

                    <div className="text-lg font-medium text-white/90">{subtitle}</div>
                    <div className="mt-2 font-bold tracking-wider text-white">{progress}%</div>
                    
                    <div className="mt-8 text-xs opacity-60 font-medium text-white">Made by Om Rishi</div>
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
  const [isFirstLoad, setIsFirstLoad] = useState(false);
  
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
                setIsFirstLoad(false);
            } else if (!isWelcomePage && !isAuthPage) {
                setIsFirstLoad(true);
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
      
      <AnimatedLoadingScreen isVisible={!isReadyForApp} isFirstLoad={isFirstLoad} />
      
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


"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { PlayerLayout } from "@/components/player-layout";
import { onAuthChange } from "@/lib/auth";
import type { User } from "@/lib/types";
import { UserDataProvider } from "@/context/user-data-context";
import { PlayerProvider } from "@/context/player-context";
import { Icons } from "./icons";
import { useAppUpdate } from "@/hooks/use-app-update";
import { UpdateDialog } from "./update-dialog";
import { cn } from "@/lib/utils";
import { hasSelectedPreferences, clearUserPreferences } from "@/lib/preferences";
import { pingUserActivity } from "@/lib/user-activity";

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

function AnimatedLoadingScreen({ isVisible }: { isVisible: boolean }) {
    const [subtitle, setSubtitle] = useState(loadingSubtitles[0]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [progress, setProgress] = useState(0);

    const spawnParticle = useCallback(() => {
        const notes = ["♪", "♫", "♬", "𝄞"];
        const newParticle: Particle = {
            id: Date.now() + Math.random(),
            char: notes[Math.floor(Math.random() * notes.length)],
            style: {
                left: `${Math.random() * 100}vw`,
                animationDelay: `${Math.random() * 3}s`,
                fontSize: `${14 + Math.random() * 20}px`,
            },
        };

        setParticles(prev => {
            const newParticles = [...prev, newParticle];
            // Limit the number of particles to avoid performance issues
            if (newParticles.length > 50) {
                return newParticles.slice(newParticles.length - 50);
            }
            return newParticles;
        });

    }, []);

    useEffect(() => {
        if (!isVisible) return;
    
        const particleInterval = setInterval(spawnParticle, 150);
        
        return () => clearInterval(particleInterval);
    }, [spawnParticle, isVisible]);
    

    useEffect(() => {
        if (!isVisible) return;
        const progressTimer = setInterval(() => {
            setProgress(oldProgress => {
                if (oldProgress >= 100) {
                    clearInterval(progressTimer);
                    return 100;
                }
                return oldProgress + 5;
            });
        }, 175); 

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
    }, [isVisible]);

    return (
         <div className={cn(
            "fixed inset-0 z-[200] overflow-hidden bg-[#0b1020] transition-opacity duration-700 ease-in-out",
            isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
         )}>
            <div className="fixed inset-0 bg-gradient-to-br from-[#1e1e2f] via-[#3b0066] to-[#001f54] bg-[size:300%_300%] animate-gradient-move filter saturate-110"></div>
            <div 
                className="fixed inset-[-100px] animate-drift mix-blend-soft-light opacity-45 pointer-events-none" 
                style={{backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.05'/></svg>")`}}
            ></div>
            
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {particles.map(p => (
                    <div key={p.id} className="note absolute bottom-[-24px] opacity-0 animate-float text-white" style={p.style}>
                        {p.char}
                    </div>
                ))}
            </div>

            <div className="fixed inset-0 grid place-items-center p-6">
                <div className="w-full max-w-[520px] rounded-3xl p-7 text-center shadow-[0_30px_80px_rgba(0,0,0,.35),inset_0_0_0_1px_rgba(255,255,255,.08)] bg-white/5 backdrop-blur-lg">
                    <div className="inline-grid grid-flow-col items-center gap-3.5 text-3xl sm:text-4xl font-extrabold tracking-wide animate-pulse text-shadow-[0_4px_30px_rgba(167,139,250,.45)] text-white">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[radial-gradient(circle_at_30%_30%,_#7cf6ff,_transparent_55%),linear-gradient(135deg,_rgba(124,246,255,.55),_rgba(167,139,250,.5))] shadow-[0_10px_30px_rgba(124,246,255,.35),inset_0_0_18px_rgba(255,255,255,.25)]">
                            <Icons.logo className="h-6 w-6 text-white"/>
                        </div>
                        <span className="text-white">StreamTune</span>
                    </div>

                     <div className="flex justify-center gap-2 my-5 h-8 items-end">
                        <span className="w-1.5 rounded bg-primary animate-bounce-loader [animation-delay:-0.4s]"></span>
                        <span className="w-1.5 rounded bg-primary animate-bounce-loader [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 rounded bg-primary animate-bounce-loader [animation-delay:-0.2s]"></span>
                        <span className="w-1.5 rounded bg-primary animate-bounce-loader [animation-delay:-0.1s]"></span>
                        <span className="w-1.5 rounded bg-primary animate-bounce-loader"></span>
                    </div>

                    <div className="text-base opacity-85 text-white">{subtitle}</div>
                    <div className="mt-1.5 font-bold tracking-wider text-white">{progress}%</div>

                    <div className="mt-4 p-2 rounded-lg bg-primary/20 border border-primary/30">
                        <p className="text-xs text-primary font-semibold">Pro tip: long-press to add songs to Quick Queue</p>
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

  useEffect(() => {
    const unsubscribe = onAuthChange((fbUser) => {
        if(fbUser) {
            pingUserActivity(fbUser);
            // If the user changes, reset their preferences to force re-selection
            if(user && user.id !== fbUser.id) {
                clearUserPreferences();
            }
            setUser(fbUser);
            if (hasSelectedPreferences()) {
                setIsReadyForApp(true);
            } else {
                router.replace('/welcome');
            }
        } else {
            setUser(null);
        }
    });

    return () => unsubscribe();
  }, [user, router]);
  
  if (isAuthPage || isWelcomePage) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatedLoadingScreen isVisible={!isReadyForApp} />
      
      {isReadyForApp && user ? (
         <div className="transition-opacity duration-500 ease-in-out opacity-100">
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
          </div>
      ) : (
        null
      )}
    </>
  );
}

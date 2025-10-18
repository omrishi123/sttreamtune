
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

interface Particle {
  id: number;
  style: React.CSSProperties;
}

const DiyaIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" {...props}>
        <defs>
            <radialGradient id="flameGradient">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="60%" stopColor="#FFA500" />
                <stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
            </radialGradient>
        </defs>
        <path d="M10 80 Q 50 100 90 80 Q 50 90 10 80" fill="#FFC0CB" stroke="#A52A2A" strokeWidth="2" />
        <path d="M40 70 Q 50 80 60 70" fill="none" stroke="#FF4500" strokeWidth="2" />
        <ellipse cx="50" cy="55" rx="10" ry="20" fill="url(#flameGradient)" className="animate-flicker" />
    </svg>
);

function DiwaliLoadingScreen({ isVisible }: { isVisible: boolean }) {
    const [particles, setParticles] = useState<Particle[]>([]);

    const spawnParticle = useCallback(() => {
        const newParticle: Particle = {
            id: Date.now() + Math.random(),
            style: {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
            },
        };
        setParticles(prev => [...prev, newParticle].slice(-50));
    }, []);

    useEffect(() => {
        if (!isVisible) return;
        const particleInterval = setInterval(spawnParticle, 200);
        return () => clearInterval(particleInterval);
    }, [isVisible, spawnParticle]);

    return (
         <div className={cn(
            "fixed inset-0 z-[200] overflow-hidden bg-[#2C143D] transition-opacity duration-700 ease-in-out",
            isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
         )}>
            <div className="fixed inset-0 bg-gradient-to-br from-[#2C143D] via-[#5A2C6D] to-[#FF8C00] bg-[size:200%_200%] animate-gradient-move filter saturate-125"></div>
            
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {particles.map(p => (
                    <div key={p.id} className="absolute rounded-full bg-yellow-300/80 animate-sparkle" style={p.style}></div>
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white p-6">
                <DiyaIcon className="w-24 h-24 mb-4" />

                <h1 className="text-4xl md:text-5xl font-bold text-shadow-[0_2px_15px_rgba(255,223,0,0.5)] font-headline" style={{ fontFamily: 'cursive' }}>
                    Happy Diwali
                </h1>
                <p className="mt-2 text-lg opacity-80">from the StreamTune Team</p>
                
                <div className="mt-8 flex justify-center gap-3 h-8 items-end">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse [animation-delay:-0.4s]"></span>
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse [animation-delay:-0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                </div>
                 <p className="mt-2 text-sm text-yellow-200/70">Lighting up your world with music...</p>
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
      <DiwaliLoadingScreen isVisible={!isReadyForApp} />
      
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

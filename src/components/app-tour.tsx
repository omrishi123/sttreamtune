'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronRight, X, Sparkles, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/context/player-context';

interface TourStep {
  target: string;
  title: string;
  description: string;
  path: string;
  position: 'bottom' | 'top' | 'left' | 'right' | 'center';
}

const APP_TOUR_STEPS: TourStep[] = [
  {
    target: 'home-header',
    title: 'Welcome to StreamTune!',
    description: "Let's take a quick look at how to get the most out of your new music experience.",
    path: '/',
    position: 'bottom'
  },
  {
    target: 'profile-trigger',
    title: 'Account & Themes',
    description: 'Click your profile to sign in, manage your account, or change the app theme to match your style.',
    path: '/',
    position: 'bottom'
  },
  {
    target: 'search-nav',
    title: 'Explore Music',
    description: 'Find any song, artist, or playlist in seconds.',
    path: '/search',
    position: 'right'
  },
  {
    target: 'search-input',
    title: 'Smart Search',
    description: 'Type what you want to hear, and our engine will find the best match on YouTube.',
    path: '/search',
    position: 'bottom'
  },
  {
    target: 'voice-search',
    title: 'Go Hands-Free',
    description: 'Use Voice Search to quickly find music using your microphone.',
    path: '/search',
    position: 'bottom'
  },
  {
    target: 'recommended-nav',
    title: 'Your Vibe, Perfected',
    description: 'Access "Your Supermix" here—an endless feed of music tailored specifically to your taste.',
    path: '/recommended',
    position: 'right'
  },
  {
    target: 'library-nav',
    title: 'Your Library',
    description: 'Everything you love lives here—liked songs, playlists, and your imported channels.',
    path: '/library',
    position: 'right'
  },
  {
    target: 'library-actions',
    title: 'Create & Import',
    description: 'Generate unique playlists with AI, import from YouTube, or create your own collections.',
    path: '/library',
    position: 'bottom'
  }
];

const PLAYER_TOUR_STEPS: TourStep[] = [
  {
    target: 'player-play',
    title: 'The Heart of Playback',
    description: 'Start or stop the music instantly. Tap to feel the rhythm.',
    path: '',
    position: 'top'
  },
  {
    target: 'player-next',
    title: 'Jump Through Time',
    description: 'Go to the next track. You control the queue.',
    path: '',
    position: 'top'
  },
  {
    target: 'player-timer',
    title: 'Sweet Dreams',
    description: 'Set a sleep timer to stop playback automatically—perfect for drifting off.',
    path: '',
    position: 'top'
  },
  {
    target: 'player-like',
    title: 'Save the Vibe',
    description: 'Heart a song to add it to your Liked Songs. It also helps us tune your Supermix!',
    path: '',
    position: 'top'
  },
  {
    target: 'player-add',
    title: 'Curate Collections',
    description: 'Quickly drop the current track into any of your own playlists.',
    path: '',
    position: 'top'
  },
  {
    target: 'player-video',
    title: 'Cinema Mode',
    description: 'Switch to the official high-def YouTube video experience for an immersive session.',
    path: '',
    position: 'top'
  },
  {
    target: 'player-queue',
    title: 'What\'s Next?',
    description: 'See your upcoming tracks, reorder them, or clear the deck for something new.',
    path: '',
    position: 'top'
  }
];

export function AppTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tourType, setTourType] = useState<'app' | 'player'>('app');
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const router = useRouter();
  const pathname = usePathname();
  const { currentTrack } = usePlayer();
  const isNavigating = useRef(false);

  const steps = tourType === 'app' ? APP_TOUR_STEPS : PLAYER_TOUR_STEPS;

  const updateSpotlight = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const elements = document.querySelectorAll(`[data-tour="${step.target}"]`);
    let element: HTMLElement | null = null;
    
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            element = el;
            break;
        }
    }

    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 12;
      const x = rect.left - padding;
      const y = rect.top - padding;
      const w = rect.width + (padding * 2);
      const h = rect.height + (padding * 2);

      setSpotlight({ x, y, w, h });

      const isMobile = window.innerWidth < 768;
      const tooltipWidth = isMobile ? Math.min(300, window.innerWidth - 64) : 340;
      let tTop = 0;
      let tLeft = 0;

      if (isMobile) {
        if (y > window.innerHeight / 2) {
          const playerClearance = tourType === 'player' ? 160 : 80;
          tTop = y - 240 - playerClearance;
        } else {
          tTop = y + h + 20;
        }
        tLeft = (window.innerWidth - tooltipWidth) / 2;
      } else {
        const isPlayerTarget = tourType === 'player' || step.target.startsWith('player-');
        
        switch (step.position) {
          case 'right':
            tLeft = x + w + 20;
            tTop = y + (h / 2) - 100;
            break;
          case 'left':
            tLeft = x - (tooltipWidth + 20);
            tTop = y + (h / 2) - 100;
            break;
          case 'top':
            const offset = isPlayerTarget ? 280 : 240;
            tTop = y - offset;
            tLeft = x + (w / 2) - (tooltipWidth / 2);
            break;
          default: // bottom
            tTop = y + h + 20;
            tLeft = x + (w / 2) - (tooltipWidth / 2);
        }
      }

      const horizontalPadding = 16;
      const verticalPadding = 20;
      
      tLeft = Math.max(horizontalPadding, Math.min(tLeft, window.innerWidth - tooltipWidth - horizontalPadding));
      tTop = Math.max(verticalPadding, Math.min(tTop, window.innerHeight - 280));

      setTooltipPos({ top: tTop, left: tLeft });
    }
  }, [currentStep, steps, tourType]);

  useEffect(() => {
    const appTourCompleted = localStorage.getItem('streamtune_tour_completed');
    if (!appTourCompleted) {
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const playerTourCompleted = localStorage.getItem('streamtune_player_tour_completed');
    if (currentTrack && !playerTourCompleted && !isVisible) {
      const timer = setTimeout(() => {
        setTourType('player');
        setCurrentStep(0);
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentTrack, isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const step = steps[currentStep];
    if (!step) return;

    if (step.path && pathname !== step.path) {
      isNavigating.current = true;
      router.push(step.path);
    } else {
      isNavigating.current = false;
      const timer = setTimeout(updateSpotlight, 400);
      return () => clearTimeout(timer);
    }

    const handleResize = () => updateSpotlight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep, isVisible, pathname, router, updateSpotlight, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setIsVisible(false);
    if (tourType === 'app') {
      localStorage.setItem('streamtune_tour_completed', 'true');
    } else {
      localStorage.setItem('streamtune_player_tour_completed', 'true');
    }
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  if (!step) return null;
  const isCenter = step.position === 'center';

  return (
    <div className="fixed inset-0 z-[100000] pointer-events-none">
      {/* Background Mask */}
      <div 
        className="tour-spotlight pointer-events-auto"
        style={{
          '--x': `${spotlight.x}px`,
          '--y': `${spotlight.y}px`,
          '--w': `${spotlight.w}px`,
          '--h': `${spotlight.h}px`,
          'zIndex': 100000
        } as React.CSSProperties}
        onClick={handleFinish}
      />

      {/* Visible Glowing Border around the spotlight */}
      <motion.div
        animate={{
          left: spotlight.x,
          top: spotlight.y,
          width: spotlight.w,
          height: spotlight.h,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed z-[100001] border-2 border-primary rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.5)] pointer-events-none"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${tourType}-${currentStep}`}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className={cn(
            "fixed z-[100002] pointer-events-auto",
            isCenter ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-64px)] max-w-[340px]" : "w-[calc(100vw-64px)] max-w-[320px]"
          )}
          style={!isCenter ? {
            top: tooltipPos.top,
            left: tooltipPos.left,
          } : undefined}
        >
          <div className="glass-panel p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden border-white/20 bg-background/80 backdrop-blur-3xl">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50" />
             
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/20 rounded-xl">
                  {tourType === 'app' ? <Sparkles className="h-5 w-5 text-primary" /> : <Music className="h-5 w-5 text-primary" />}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white h-auto p-0"
                  onClick={handleFinish}
                >
                  Skip Tour
                </Button>
             </div>

             <h3 className="text-xl font-bold font-headline mb-2 text-white">{step.title}</h3>
             <p className="text-sm text-white/80 leading-relaxed mb-6">
               {step.description}
             </p>

             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Step {currentStep + 1} / {steps.length}
                </span>
                <Button 
                  size="sm" 
                  className="rounded-full font-bold shadow-lg shadow-primary/20 px-6 h-10"
                  onClick={handleNext}
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
             </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

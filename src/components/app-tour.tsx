'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronRight, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  target: string;
  title: string;
  description: string;
  path: string;
  position: 'bottom' | 'top' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'none',
    title: 'Welcome to StreamTune!',
    description: "Let's take a quick look at how to get the most out of your new music experience.",
    path: '/',
    position: 'center'
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

export function AppTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const router = useRouter();
  const pathname = usePathname();

  const updateSpotlight = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    if (step.target === 'none') {
      setSpotlight({ x: 0, y: 0, w: 0, h: 0 });
      return;
    }

    const element = document.querySelector(`[data-tour="${step.target}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setSpotlight({
        x: rect.left - 8,
        y: rect.top - 8,
        w: rect.width + 16,
        h: rect.height + 16
      });
    }
  }, [currentStep]);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('streamtune_tour_completed');
    if (!tourCompleted) {
      // Start tour after a short delay on mount
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const step = TOUR_STEPS[currentStep];
    if (pathname !== step.path) {
      router.push(step.path);
    }

    // Wait for navigation and rendering
    const timer = setTimeout(updateSpotlight, 600);
    window.addEventListener('resize', updateSpotlight);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
    };
  }, [currentStep, isVisible, pathname, router, updateSpotlight]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setIsVisible(false);
    localStorage.setItem('streamtune_tour_completed', 'true');
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dynamic Spotlight Overlay */}
      <div 
        className="tour-spotlight pointer-events-auto"
        style={{
          '--x': `${spotlight.x}px`,
          '--y': `${spotlight.y}px`,
          '--w': `${spotlight.w}px`,
          '--h': `${spotlight.h}px`,
        } as React.CSSProperties}
        onClick={handleFinish}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className={cn(
            "fixed z-[10000] w-full max-w-[320px] pointer-events-auto",
            step.position === 'center' ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" :
            step.position === 'bottom' ? "mt-4" : ""
          )}
          style={step.position !== 'center' ? {
            top: step.position === 'bottom' ? spotlight.y + spotlight.h : 'auto',
            left: step.position === 'right' ? spotlight.x + spotlight.w : 
                  step.position === 'left' ? spotlight.x - 340 : 
                  spotlight.x + (spotlight.w / 2) - 160,
            bottom: step.position === 'top' ? (window.innerHeight - spotlight.y) + 12 : 'auto'
          } : undefined}
        >
          <div className="glass-panel p-6 rounded-[2rem] shadow-2xl relative overflow-hidden border-white/20 bg-background/20 backdrop-blur-3xl">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50" />
             
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleFinish}>
                  <X className="h-4 w-4" />
                </Button>
             </div>

             <h3 className="text-xl font-bold font-headline mb-2 text-white">{step.title}</h3>
             <p className="text-sm text-white/70 leading-relaxed mb-6">
               {step.description}
             </p>

             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Step {currentStep + 1} / {TOUR_STEPS.length}
                </span>
                <Button 
                  size="sm" 
                  className="rounded-full font-bold shadow-lg shadow-primary/20 pr-3"
                  onClick={handleNext}
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
             </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LikeParticle = ({ id, onComplete }: { id: number, onComplete: (id: number) => void }) => {
  const duration = 0.8 + Math.random() * 0.4;
  const delay = Math.random() * 0.2;
  
  return (
    <motion.div
      className="absolute text-red-500 text-lg"
      style={{
        top: '50%',
        left: '50%',
        pointerEvents: 'none',
      }}
      initial={{
        x: '-50%',
        y: '-50%',
        opacity: 0,
        scale: 0.5,
      }}
      animate={{
        x: `calc(-50% + ${Math.random() * 80 - 40}px)`,
        y: `calc(-50% + ${Math.random() * 80 - 40}px)`,
        scale: [1, 1.5, 0],
        opacity: [1, 0.8, 0],
      }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      onAnimationComplete={() => onComplete(id)}
    >
      ❤️
    </motion.div>
  );
};

interface LikeAnimationProps {
  trigger: number;
}

export const LikeAnimation = ({ trigger }: LikeAnimationProps) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      const newParticles = Array.from({ length: 12 }, (_, i) => Date.now() + i);
      setParticles(newParticles);
    }
  }, [trigger]);

  const handleAnimationComplete = (id: number) => {
    setParticles(current => current.filter(pId => pId !== id));
  };
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] grid place-items-center">
        <div className="relative w-24 h-24">
            <AnimatePresence>
                {particles.map((id) => (
                    <LikeParticle key={id} id={id} onComplete={handleAnimationComplete} />
                ))}
            </AnimatePresence>
        </div>
    </div>
  );
};

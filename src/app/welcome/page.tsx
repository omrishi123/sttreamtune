
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { genres } from '@/lib/genres';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveUserPreferences } from '@/lib/preferences';
import { Search } from 'lucide-react';
import { Icons } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

export default function WelcomePage() {
  const router = useRouter();
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) {
        newSet.delete(genre);
      } else {
        newSet.add(genre);
      }
      return newSet;
    });
  };

  const filteredGenres = useMemo(() => {
    if (!searchQuery) return genres;
    return genres.filter((g) =>
      g.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleFinish = () => {
    setIsFinishing(true);
    saveUserPreferences(Array.from(selectedGenres));
    // Brief delay to show loading state before redirecting
    setTimeout(() => {
        router.push('/');
        // After pushing, force a reload of data on the new page.
        // This is more reliable than window.location and keeps the user in-app.
        router.refresh();
    }, 500);
  };
  
    // Preload the home page to make the transition smoother
  useEffect(() => {
    router.prefetch('/');
  }, [router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-foreground relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-50 dark:opacity-30 bg-[radial-gradient(circle_at_20%_80%,_hsl(var(--primary))_0%,_transparent_40%),_radial-gradient(circle_at_80%_30%,_hsl(var(--accent))_0%,_transparent_40%)]" />
        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-4xl h-full py-8">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-4"
            >
                <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">
                Welcome to StreamTune
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                Choose your favorite genres to personalize your experience.
                </p>
            </motion.div>

            <div className="relative w-full max-w-sm my-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="text"
                placeholder="Search genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-base"
                />
            </div>
            
            <ScrollArea className="flex-1 w-full my-4">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1"
                >
                    {filteredGenres.map((genre) => (
                    <motion.div key={genre} variants={itemVariants}>
                        <Button
                        variant={selectedGenres.has(genre) ? 'default' : 'outline'}
                        className="w-full h-12 text-sm transition-all duration-200 ease-out transform active:scale-95"
                        onClick={() => toggleGenre(genre)}
                        >
                        {genre}
                        </Button>
                    </motion.div>
                    ))}
                </motion.div>
            </ScrollArea>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                className="mt-6 w-full max-w-sm"
            >
                <Button
                size="lg"
                className="w-full"
                onClick={handleFinish}
                disabled={selectedGenres.size < 1 || isFinishing}
                >
                {isFinishing ? (
                    <>
                        <Icons.spinner className="mr-2" />
                        Saving your vibe...
                    </>
                ) : (
                    `Finish (${selectedGenres.size} selected)`
                )}
                </Button>
            </motion.div>
        </div>
    </div>
  );
}

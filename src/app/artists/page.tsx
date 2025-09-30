
"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Search, MicVocal } from 'lucide-react';
import { artists as allArtists } from '@/lib/artists';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
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

export default function ArtistsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArtists = useMemo(() => {
    if (!searchQuery) {
      return allArtists;
    }
    return allArtists.filter((artist) =>
      artist.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleArtistClick = (artistName: string) => {
    // Navigate to the search page with the artist's name as the query
    router.push(`/search?q=${encodeURIComponent(artistName)}`);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-3">
            <MicVocal className="h-8 w-8" />
            <h1 className="text-4xl font-bold font-headline tracking-tight">
                Artists
            </h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Discover and search for your favorite artists.
        </p>
      </motion.div>

      <div className="relative w-full max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for an artist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 text-base"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4"
      >
        {filteredArtists.map((artist) => (
          <motion.div
            key={artist.name}
            variants={itemVariants}
            className="group text-center cursor-pointer"
            onClick={() => handleArtistClick(artist.name)}
          >
            <div className="relative aspect-square overflow-hidden rounded-full shadow-lg transition-transform duration-300 group-hover:scale-105">
              <Image
                src={artist.imageUrl}
                alt={artist.name}
                fill
                className="object-cover"
                unoptimized
                data-ai-hint={`${artist.name} portrait`}
              />
            </div>
            <p className="mt-2 text-sm font-semibold truncate transition-colors group-hover:text-primary">
              {artist.name}
            </p>
          </motion.div>
        ))}
      </motion.div>
       {filteredArtists.length === 0 && (
          <div className="col-span-full text-center py-16">
            <p className="text-muted-foreground">No artists found for &quot;{searchQuery}&quot;.</p>
          </div>
        )}
    </div>
  );
}

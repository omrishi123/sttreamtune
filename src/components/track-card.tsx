
'use client';

import Image from 'next/image';
import { Play, Pause } from 'lucide-react';
import type { Track } from '@/lib/types';
import { usePlayer } from '@/context/player-context';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

interface TrackCardProps {
  track: Track;
  tracklist: Track[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1.0]
    }
  },
};


export function TrackCard({ track, tracklist }: TrackCardProps) {
  const { setQueueAndPlay, currentTrack, isPlaying, pause } = usePlayer();

  const handlePlay = () => {
    // If this track is playing, pause it. Otherwise, play the whole list starting with this track.
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      setQueueAndPlay(tracklist, track.id);
    }
  };

  const isActive = currentTrack?.id === track.id;

  return (
    <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        variants={cardVariants}
    >
      <div
        className={cn(
          'group flex items-center gap-4 rounded-lg p-2 transition-colors',
          isActive ? 'bg-primary/10' : 'hover:bg-muted/50'
        )}
      >
        <div className="relative flex-shrink-0">
          <Image
            src={track.artwork}
            alt={track.title}
            width={56}
            height={56}
            className="rounded-md"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{track.title}</p>
          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn('opacity-0 group-hover:opacity-100', isActive && 'opacity-100')}
          onClick={handlePlay}
        >
          {isActive && isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
      </div>
    </motion.div>
  );
}

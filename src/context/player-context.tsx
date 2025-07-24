"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Track } from '@/lib/types';
import { tracks as allTracks } from '@/lib/mock-data';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  play: (track?: Track) => void;
  pause: () => void;
  playNext: () => void;
  playPrev: () => void;
  setQueueAndPlay: (tracks: Track[], startTrackId?: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);

  const play = (track?: Track) => {
    if (track) {
      if(track.id !== currentTrack?.id) {
        setCurrentTrack(track);
      }
    } else if (!currentTrack && queue.length > 0) {
      setCurrentTrack(queue[0]);
    }
    setIsPlaying(true);
  };

  const pause = () => {
    setIsPlaying(false);
  };

  const playNext = () => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > -1 && currentIndex < queue.length - 1) {
      setCurrentTrack(queue[currentIndex + 1]);
      setIsPlaying(true);
    } else {
      setIsPlaying(false); // End of queue
    }
  };

  const playPrev = () => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(queue[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  const setQueueAndPlay = (tracks: Track[], startTrackId?: string) => {
    setQueue(tracks);
    if (startTrackId) {
      const startTrack = tracks.find(t => t.id === startTrackId);
      if (startTrack) {
        setCurrentTrack(startTrack);
        setIsPlaying(true);
      }
    } else if (tracks.length > 0) {
        setCurrentTrack(tracks[0]);
        setIsPlaying(true);
    }
  };


  const value = {
    currentTrack,
    isPlaying,
    queue,
    play,
    pause,
    playNext,
    playPrev,
    setQueue: setQueueAndPlay,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

"use client";

import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import type { Track } from '@/lib/types';
import YouTube from 'react-youtube';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  play: (track?: Track) => void;
  pause: () => void;
  playNext: () => void;
  playPrev: () => void;
  setQueueAndPlay: (tracks: Track[], startTrackId?: string) => void;
  playerRef: React.RefObject<YouTube | null>;
  progress: number;
  handleSeek: (value: number[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [progress, setProgress] = useState(0);

  const playerRef = useRef<YouTube | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(async () => {
      const player = playerRef.current?.getInternalPlayer();
      if (player && typeof player.getCurrentTime === 'function' && typeof player.getDuration === 'function') {
        const currentTime = await player.getCurrentTime();
        const duration = await player.getDuration();
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        }
      }
    }, 1000);
  };

  const stopProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const play = (track?: Track) => {
    if (track) {
      if(track.id !== currentTrack?.id) {
        setCurrentTrack(track);
        setProgress(0);
      }
    } else if (!currentTrack && queue.length > 0) {
       setCurrentTrack(queue[0]);
       setProgress(0);
    }
    setIsPlaying(true);
  };

  const pause = () => {
    const player = playerRef.current?.getInternalPlayer();
    if(player) player.pauseVideo();
    setIsPlaying(false);
  };

  const playNext = () => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > -1 && currentIndex < queue.length - 1) {
      setCurrentTrack(queue[currentIndex + 1]);
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false); // End of queue
      stopProgressInterval();
    }
  };

  const playPrev = () => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(queue[currentIndex - 1]);
       setProgress(0);
      setIsPlaying(true);
    }
  };

  const setQueueAndPlay = (tracks: Track[], startTrackId?: string) => {
    setQueue(tracks);
    const trackToPlay = startTrackId 
        ? tracks.find(t => t.id === startTrackId) 
        : tracks[0];

    if (trackToPlay) {
      play(trackToPlay);
    }
  };

  const handleStateChange = (event: any) => {
    if (event.data === YouTube.PlayerState.PLAYING) {
      setIsPlaying(true);
      startProgressInterval();
    } else if (event.data === YouTube.PlayerState.PAUSED || event.data === YouTube.PlayerState.BUFFERING) {
      setIsPlaying(false);
      stopProgressInterval();
    } else if (event.data === YouTube.PlayerState.ENDED) {
        playNext();
    }
  };

  const handleSeek = (value: number[]) => {
      const newProgress = value[0];
      setProgress(newProgress);
      const player = playerRef.current?.getInternalPlayer();
      if(player && currentTrack) {
          player.seekTo((newProgress / 100) * currentTrack.duration, true);
      }
  }

  const value = {
    currentTrack,
    isPlaying,
    queue,
    play,
    pause,
    playNext,
    playPrev,
    setQueueAndPlay,
    playerRef,
    progress,
    handleSeek
  };

  return (
    <PlayerContext.Provider value={value}>
        {children}
         {currentTrack && (
            <YouTube
                ref={playerRef}
                videoId={currentTrack.youtubeVideoId}
                opts={{
                    height: '0',
                    width: '0',
                    playerVars: {
                        autoplay: 1,
                    },
                }}
                onStateChange={handleStateChange}
                onReady={(e) => e.target.playVideo()}
                className="hidden"
            />
        )}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

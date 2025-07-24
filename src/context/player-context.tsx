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
  const [queue, setQueueState] = useState<Track[]>([]);
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
    let trackToPlay = track;
  
    if (trackToPlay) {
      // If a specific track is provided, play it.
      setCurrentTrack(trackToPlay);
    } else if (!currentTrack && queue.length > 0) {
      // If no track is playing and the queue is not empty, play the first track.
      trackToPlay = queue[0];
      setCurrentTrack(trackToPlay);
    }
  
    // If there's a track to play, start playback.
    if (trackToPlay) {
      setProgress(0);
      setIsPlaying(true);
      // The onReady handler will call playVideo if isPlaying is true.
    }
  };

  const pause = () => {
    playerRef.current?.getInternalPlayer()?.pauseVideo();
    setIsPlaying(false);
  };

  const playNext = () => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > -1 && currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1];
      play(nextTrack);
    } else {
      setIsPlaying(false);
      stopProgressInterval();
    }
  };

  const playPrev = () => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1];
      play(prevTrack);
    }
  };
  
  const setQueueAndPlay = (tracks: Track[], startTrackId?: string) => {
    const newQueue = [...tracks];
    setQueueState(newQueue);
    
    const trackToPlay = startTrackId 
        ? newQueue.find(t => t.id === startTrackId) 
        : newQueue[0];

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
  
  const handleReady = (event: any) => {
    if (isPlaying) {
      event.target.playVideo();
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
                key={currentTrack.id}
                ref={playerRef}
                videoId={currentTrack.youtubeVideoId}
                opts={{
                    height: '0',
                    width: '0',
                    playerVars: {
                        autoplay: isPlaying ? 1 : 0,
                    },
                }}
                onStateChange={handleStateChange}
                onReady={handleReady}
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

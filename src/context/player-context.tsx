
"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import type { Track, Playlist } from '@/lib/types';
import YouTube from 'react-youtube';

// Extend the window type to include our optional AndroidBridge
declare global {
  interface Window {
    AndroidBridge?: {
      playSong: (trackInfoJson: string) => void;
      pause: () => void;
      // Add other methods you might need, e.g., resume, seekTo, etc.
    };
  }
}

interface PlayerContextType {
  currentTrack: Track | null;
  currentPlaylist: Playlist | null;
  isPlaying: boolean;
  queue: Track[];
  play: (track?: Track) => void;
  pause: () => void;
  playNext: () => void;
  playPrev: () => void;
  setQueueAndPlay: (tracks: Track[], startTrackId?: string, playlist?: Playlist) => void;
  playerRef: React.RefObject<YouTube | null>;
  progress: number;
  handleSeek: (value: number[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const playerRef = useRef<YouTube | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const isNativeMode = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!isNativeMode.current && isPlaying && isReady && playerRef.current) {
      playerRef.current.getInternalPlayer()?.playVideo();
      startProgressInterval();
    } else if (!isNativeMode.current && !isPlaying && isReady && playerRef.current) {
      playerRef.current?.getInternalPlayer()?.pauseVideo();
      stopProgressInterval();
    }
    
    return () => {
      stopProgressInterval();
    }
  }, [isMounted, isReady, isPlaying]);

  const startProgressInterval = () => {
    if (isNativeMode.current) return;
    stopProgressInterval(); 
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
    let trackToPlay = track || currentTrack || queue[0];
  
    if (trackToPlay) {
       if (currentTrack?.id !== trackToPlay.id) {
          setProgress(0);
          setCurrentTrack(trackToPlay);
       }
       setIsPlaying(true);

       if (window.AndroidBridge && typeof window.AndroidBridge.playSong === 'function') {
            isNativeMode.current = true;
            console.log("Running in Android App. Delegating playback.");
            const trackInfoJson = JSON.stringify(trackToPlay);
            window.AndroidBridge.playSong(trackInfoJson);
       } else {
            isNativeMode.current = false;
            console.log("Running in a standard browser. Playing audio directly.");
            if (currentTrack?.id !== trackToPlay.id) {
                setIsReady(false);
            }
       }
    }
  };

  const pause = () => {
    setIsPlaying(false);
    if (isNativeMode.current && window.AndroidBridge && typeof window.AndroidBridge.pause === 'function') {
        window.AndroidBridge.pause();
    }
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
  
  const setQueueAndPlay = (tracks: Track[], startTrackId?: string, playlist?: Playlist) => {
    const newQueue = [...tracks];
    setQueueState(newQueue);
    setCurrentPlaylist(playlist || null);
    
    const trackToPlay = startTrackId 
        ? newQueue.find(t => t.id === startTrackId) 
        : newQueue[0];

    if (trackToPlay) {
      play(trackToPlay);
    }
  };
  
  const handleStateChange = (event: any) => {
    if (isNativeMode.current) return;

    if (event.data === YouTube.PlayerState.PLAYING) {
      startProgressInterval();
      if(!isPlaying) setIsPlaying(true);
    } else if (event.data === YouTube.PlayerState.PAUSED || event.data === YouTube.PlayerState.BUFFERING) {
      stopProgressInterval();
    } else if (event.data === YouTube.PlayerState.ENDED) {
        playNext();
    }
  };

  const handleSeek = (value: number[]) => {
      const newProgress = value[0];
      setProgress(newProgress);
      
      if (isNativeMode.current) {
        // window.AndroidBridge.seekTo(newProgress);
      } else {
        const player = playerRef.current?.getInternalPlayer();
        if(player && currentTrack) {
            player.seekTo((newProgress / 100) * currentTrack.duration, true);
        }
      }
  }
  
  const handleReady = (event: any) => {
    if (!isNativeMode.current) {
        setIsReady(true);
    }
  }

  const value = {
    currentTrack,
    currentPlaylist,
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

  if (!isMounted) {
    return null;
  }

  return (
    <PlayerContext.Provider value={value}>
        {children}
         {currentTrack && !isNativeMode.current && (
            <YouTube
                key={currentTrack.id}
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
                onReady={handleReady}
                onEnd={playNext}
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

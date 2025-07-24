
"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import type { Track, Playlist } from '@/lib/types';
import YouTube from 'react-youtube';
import { useUserData } from './user-data-context';

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
  
  const userData = useUserData();

  const playerRef = useRef<YouTube | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying && isReady && playerRef.current) {
      playerRef.current.getInternalPlayer()?.playVideo();
      startProgressInterval();
    } else if (!isPlaying && isReady && playerRef.current) {
      playerRef.current?.getInternalPlayer()?.pauseVideo();
      stopProgressInterval();
    }
    
    return () => {
      stopProgressInterval();
    }
  }, [isReady, isPlaying]);

  useEffect(() => {
    if (currentTrack && userData) {
      userData.addRecentlyPlayed(currentTrack.id);
    }
  }, [currentTrack?.id]);


  const startProgressInterval = () => {
    stopProgressInterval(); // Ensure no multiple intervals
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
        setIsReady(false);
        setProgress(0);
        setCurrentTrack(trackToPlay);
      }
      setIsPlaying(true);
    }
  };

  const pause = () => {
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
      const player = playerRef.current?.getInternalPlayer();
      if(player && currentTrack) {
          player.seekTo((newProgress / 100) * currentTrack.duration, true);
      }
  }
  
  const handleReady = (event: any) => {
    setIsReady(true);
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

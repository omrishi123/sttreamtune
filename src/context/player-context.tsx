
"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect, useCallback } from 'react';
import type { Track, Playlist } from '@/lib/types';
import YouTube from 'react-youtube';
import { useToast } from "@/hooks/use-toast";

// Extend the window type to include our optional AndroidBridge and callbacks
declare global {
  interface Window {
    Android?: {
      startPlayback: (playlistJson: string, currentIndex: number) => void;
      play: () => void;
      pause: () => void;
      seekTo: (positionInSeconds: number) => void;
      setSleepTimer: (durationInMillis: number) => void;
    };
    updateFromNative: (state: { isPlaying?: boolean; currentTime?: number; duration?: number; newSongIndex?: number; }) => void;
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
  removeTrackFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  currentTime: number;
  duration: number;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isNativePlayback, setIsNativePlayback] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const playerRef = useRef<YouTube | null>(null);
  const queueRef = useRef(queue);
  const isPlayingRef = useRef(isPlaying);
  const { toast } = useToast();
  
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);


  const handleNativeUpdate = useCallback((state: { isPlaying?: boolean; currentTime?: number; duration?: number; newSongIndex?: number; }) => {
      if (typeof state.isPlaying === 'boolean') {
          setIsPlaying(state.isPlaying);
      }
  
      if (typeof state.duration === 'number') {
        setDuration(state.duration);
      }
      if (typeof state.currentTime === 'number') {
        setCurrentTime(state.currentTime);
      }
  
      const currentQueue = queueRef.current;
      if (typeof state.newSongIndex === 'number' && state.newSongIndex < currentQueue.length) {
          const newTrack = currentQueue[state.newSongIndex];
          if (newTrack) {
              setCurrentTrack(newTrack);
              setCurrentTime(0);
              setDuration(newTrack.duration);
          }
      }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    window.updateFromNative = handleNativeUpdate;
    return () => {
      delete (window as any).updateFromNative;
    };
  }, [handleNativeUpdate]);

  // This effect handles the automatic timeline progress
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isPlaying && duration > 0) {
      timer = setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime + 1 >= duration) {
            clearInterval(timer);
            return duration;
          }
          return prevTime + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isPlaying, duration]);


  const updateMediaSession = () => {
    if ('mediaSession' in navigator && currentTrack && !isNativePlayback) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: [
          { src: currentTrack.artwork, sizes: '96x96', type: 'image/png' },
          { src: currentTrack.artwork, sizes: '128x128', type: 'image/png' },
          { src: currentTrack.artwork, sizes: '192x192', type: 'image/png' },
          { src: currentTrack.artwork, sizes: '256x256', type: 'image/png' },
          { src: currentTrack.artwork, sizes: '384x384', type: 'image/png' },
          { src: currentTrack.artwork, sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    }
  };
  
  useEffect(() => {
    if (!isMounted) return;

    if (isPlaying && !isNativePlayback) {
      if (isReady && playerRef.current) {
        playerRef.current.getInternalPlayer()?.playVideo();
      }
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    } else if(!isPlaying && !isNativePlayback) {
      if (isReady && playerRef.current) {
        playerRef.current?.getInternalPlayer()?.pauseVideo();
      }
       if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
    
  }, [isMounted, isReady, isPlaying, isNativePlayback]);
  
  useEffect(() => {
    updateMediaSession();
  }, [currentTrack, isNativePlayback]);


  const playSongInApp = (trackToPlay: Track, currentQueue: Track[]) => {
      const currentIndex = currentQueue.findIndex(t => t.id === trackToPlay.id);
      if (currentIndex === -1) return;

      const playlistForNative = currentQueue.map(t => ({
          videoId: t.youtubeVideoId,
          title: t.title,
          artist: t.artist,
          thumbnailUrl: `https://img.youtube.com/vi/${t.youtubeVideoId}/mqdefault.jpg`,
      }));

      const playlistJson = JSON.stringify(playlistForNative);

      if (window.Android?.startPlayback) {
          setIsNativePlayback(true);
          window.Android.startPlayback(
            playlistJson,
            currentIndex
          );
      }
  };

  const play = (track?: Track) => {
    const trackToPlay = track || currentTrack || queue[0];
    if (!trackToPlay) return;
    
    if (isNativePlayback) {
      if(window.Android?.play) {
        window.Android.play();
        setIsPlaying(true);
      }
    } else {
      if (currentTrack?.id !== trackToPlay.id) {
        setCurrentTime(0);
        setCurrentTrack(trackToPlay);
        setIsReady(false);
      }
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (isNativePlayback) {
      if (window.Android?.pause) {
        window.Android.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const playNext = () => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    const nextTrack = queue[nextIndex];

    if (isNativePlayback) {
        playSongInApp(nextTrack, queue);
    } else {
        play(nextTrack);
    }
  };

  const playPrev = () => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    const prevTrack = queue[prevIndex];
    
    if (isNativePlayback) {
        playSongInApp(prevTrack, queue);
    } else {
        play(prevTrack);
    }
  };
  
  const setQueueAndPlay = (tracks: Track[], startTrackId?: string, playlist?: Playlist) => {
    const newQueue = [...tracks];
    const trackToPlay = startTrackId 
        ? newQueue.find(t => t.id === startTrackId) 
        : newQueue[0];

    if (!trackToPlay) return;

    setQueueState(newQueue);
    setCurrentPlaylist(playlist || null);
    setCurrentTrack(trackToPlay);
    setDuration(trackToPlay.duration);
    setCurrentTime(0);

    if (window.Android?.startPlayback) {
      playSongInApp(trackToPlay, newQueue);
    } else {
      setIsNativePlayback(false);
      play(trackToPlay);
    }
  };

  const removeTrackFromQueue = (trackId: string) => {
    setQueueState(prev => prev.filter(track => track.id !== trackId));
  };

  const clearQueue = () => {
    setQueueState(currentTrack ? [currentTrack] : []);
  };
  
  const handleStateChange = (event: any) => {
    if (isNativePlayback) return;

    if (event.data === YouTube.PlayerState.PLAYING) {
      if(!isPlaying) setIsPlaying(true);
    } else if (event.data === YouTube.PlayerState.PAUSED || event.data === YouTube.PlayerState.BUFFERING) {
      // Intentionally do not set isPlaying to false here to allow our controls to be the source of truth
    } else if (event.data === YouTube.PlayerState.ENDED) {
        playNext();
    }
  };
  
  const handleSeek = (value: number[]) => {
      const newProgress = value[0];
      const seekTimeInSeconds = (newProgress / 100) * duration;
      setCurrentTime(seekTimeInSeconds);
      
      if (isNativePlayback) {
          if (window.Android?.seekTo) {
              window.Android.seekTo(Math.round(seekTimeInSeconds));
          }
          return;
      }
      
      const player = playerRef.current?.getInternalPlayer();
      if(player && currentTrack) {
          player.seekTo(seekTimeInSeconds, true);
      }
  }
  
  const handleReady = (event: any) => {
    if (isNativePlayback) return;
    setIsReady(true);
    if(isPlaying) {
      event.target.playVideo();
    }
  }
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
    handleSeek,
    removeTrackFromQueue,
    clearQueue,
    currentTime,
    duration
  };

  if (!isMounted) {
    return null;
  }

  return (
    <PlayerContext.Provider value={value}>
        {children}
         {currentTrack && !isNativePlayback && (
            <YouTube
                key={currentTrack.id}
                ref={playerRef}
                videoId={currentTrack.youtubeVideoId}
                opts={{
                    height: '0',
                    width: '0',
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
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
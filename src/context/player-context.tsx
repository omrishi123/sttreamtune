
"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import type { Track, Playlist } from '@/lib/types';
import YouTube from 'react-youtube';
import { useToast } from "@/hooks/use-toast";

// Extend the window type to include our optional AndroidBridge and callbacks
declare global {
  interface Window {
    Android?: {
      startPlayback: (
        playlistJson: string,
        currentIndex: number
      ) => void;
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
  const [isSeeking, setIsSeeking] = useState(false);
  const [isNativePlayback, setIsNativePlayback] = useState(false);
  
  const playerRef = useRef<YouTube | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);

    const handleNativeUpdate = (state: { isPlaying?: boolean; currentTime?: number; duration?: number; newSongIndex?: number; }) => {
        console.log("Received update from native:", state);

        if (typeof state.isPlaying === 'boolean') {
            setIsPlaying(state.isPlaying);
        }

        if (typeof state.duration === 'number' && state.duration > 0 && typeof state.currentTime === 'number') {
           const newProgress = (state.currentTime / state.duration) * 100;
           setProgress(newProgress);
        }

        if (typeof state.newSongIndex === 'number') {
            setQueueState(currentQueue => {
                const newTrack = currentQueue[state.newSongIndex];
                if (newTrack) {
                    setCurrentTrack(currentTrack => {
                        if (currentTrack?.id !== newTrack.id) {
                            return newTrack;
                        }
                        return currentTrack;
                    });
                }
                return currentQueue;
            });
        }
    };
    
    window.updateFromNative = handleNativeUpdate;
    
    return () => {
      delete (window as any).updateFromNative;
    };
  }, []); 


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
    if (!isMounted || isNativePlayback) return;

    if (isPlaying && isReady && playerRef.current) {
      playerRef.current.getInternalPlayer()?.playVideo();
      startProgressInterval();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    } else if (!isPlaying && isReady && playerRef.current) {
      playerRef.current?.getInternalPlayer()?.pauseVideo();
      stopProgressInterval();
       if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
    
    return () => {
      stopProgressInterval();
    }
  }, [isMounted, isReady, isPlaying, isNativePlayback]);
  
  useEffect(() => {
    updateMediaSession();
  }, [currentTrack, isNativePlayback]);


  const startProgressInterval = () => {
    if (isNativePlayback) return;
    stopProgressInterval(); 
    progressIntervalRef.current = setInterval(async () => {
      if (isSeeking) return; 
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

      if (window.Android && typeof window.Android.startPlayback === 'function') {
          console.log("Calling native playback service with playlist:", playlistJson, "and index:", currentIndex);
          setIsNativePlayback(true);
          setTimeout(() => {
            window.Android?.startPlayback(
              playlistJson,
              currentIndex
            );
          }, 100);
      }
  };

  const play = (track?: Track) => {
    const trackToPlay = track || currentTrack || queue[0];
    if (!trackToPlay) return;
    
    if (isNativePlayback) {
        if(window.Android && typeof window.Android.play === 'function') {
            window.Android.play();
        }
        setIsPlaying(true); // Optimistic UI update
    } else {
        if (currentTrack?.id !== trackToPlay.id) {
          setProgress(0);
          setCurrentTrack(trackToPlay);
          setIsReady(false); 
        }
        setIsPlaying(true);
    }
  };

  const pause = () => {
     if (isNativePlayback) {
        if (window.Android && typeof window.Android.pause === 'function') {
            window.Android.pause();
        }
        setIsPlaying(false); // Optimistic UI update
    } else {
        setIsPlaying(false);
    }
  };

  const playNext = () => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % queue.length; // Loop back to start
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
      const prevIndex = (currentIndex - 1 + queue.length) % queue.length; // Loop to end
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
    
    // Set current track immediately for UI responsiveness
    setCurrentTrack(trackToPlay);
    setIsPlaying(true);

    if (window.Android && typeof window.Android.startPlayback === 'function') {
      setIsNativePlayback(true);
      playSongInApp(trackToPlay, newQueue);
    } else {
      setIsNativePlayback(false);
      // For web, play() will handle setting the track and state
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
      
      if (isNativePlayback) {
          if (currentTrack && window.Android && typeof window.Android.seekTo === 'function') {
              const seekTimeInSeconds = (newProgress / 100) * currentTrack.duration;
              window.Android.seekTo(Math.round(seekTimeInSeconds));
          }
          return;
      }
      
      const player = playerRef.current?.getInternalPlayer();
      if(player && currentTrack) {
          player.seekTo((newProgress / 100) * currentTrack.duration, true);
      }
  }
  
  const handleReady = (event: any) => {
    if (isNativePlayback) return;
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
    handleSeek,
    removeTrackFromQueue,
    clearQueue,
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

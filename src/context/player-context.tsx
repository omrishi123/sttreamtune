
"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import type { Track, Playlist } from '@/lib/types';
import YouTube from 'react-youtube';

// Extend the window type to include our optional AndroidBridge and callbacks
declare global {
  interface Window {
    Android?: {
      startPlayback: (
        playlistJson: string,
        currentIndex: number
      ) => void;
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

  useEffect(() => {
    setIsMounted(true);

    // Attach the update function to the window object for Android to call
    window.updateFromNative = (state) => {
        console.log("Received update from native:", state);
        if (typeof state.isPlaying === 'boolean') {
            setIsPlaying(state.isPlaying);
        }
        if (typeof state.duration === 'number' && state.duration > 0 && typeof state.currentTime === 'number') {
           setProgress((state.currentTime / state.duration) * 100);
        }
         if (typeof state.newSongIndex === 'number' && queue[state.newSongIndex]) {
            const newTrack = queue[state.newSongIndex];
            if (currentTrack?.id !== newTrack.id) {
                setCurrentTrack(newTrack);
            }
        }
    };
    
    // Cleanup function
    return () => {
      delete (window as any).updateFromNative;
    };
  }, [queue, currentTrack]); // Rerun if queue changes to ensure newSongIndex is valid


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
      if (isSeeking) return; // Don't update progress while user is seeking
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
          window.Android.startPlayback(
            playlistJson,
            currentIndex
          );
      }
  };

  const play = (track?: Track) => {
    const trackToPlay = track || currentTrack || queue[0];
    if (!trackToPlay) return;
    
    // PATH 2: RUNNING IN A REGULAR WEB BROWSER
    setIsNativePlayback(false);
    if (currentTrack?.id !== trackToPlay.id) {
      setProgress(0);
      setCurrentTrack(trackToPlay);
      setIsReady(false); // Force the player to re-evaluate readiness for the new track
    }
    setIsPlaying(true);
  };

  const pause = () => {
    if (isNativePlayback) {
        // Native app should handle pause and call back to update UI
        // For now, we just update the UI optimistically.
        setIsPlaying(false);
    } else {
        setIsPlaying(false);
    }
  };

  const playNext = () => {
    if (isNativePlayback) {
       // The native app should handle this and call back to update the UI
       const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
       if (currentIndex > -1 && currentIndex < queue.length - 1) {
         const nextTrack = queue[currentIndex + 1];
         // We don't call playSongInApp here, native player does it.
         // We just update the web UI optimistically.
         setCurrentTrack(nextTrack);
       } else {
         setIsPlaying(false);
       }
       return;
    }
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
    if (isNativePlayback) {
       // The native app should handle this and call back to update the UI
       const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
       if (currentIndex > 0) {
         const prevTrack = queue[currentIndex - 1];
         setCurrentTrack(prevTrack);
       }
       return;
    }
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1];
      play(prevTrack);
    }
  };
  
  const setQueueAndPlay = (tracks: Track[], startTrackId?: string, playlist?: Playlist) => {
    const newQueue = [...tracks];
    const trackToPlay = startTrackId 
        ? newQueue.find(t => t.id === startTrackId) 
        : newQueue[0];

    if (!trackToPlay) return;

    // Update state for both web and native
    setQueueState(newQueue);
    setCurrentPlaylist(playlist || null);
    setCurrentTrack(trackToPlay);
    setIsPlaying(true);

    if (window.Android && typeof window.Android.startPlayback === 'function') {
      // If in native app, call native playback immediately
      playSongInApp(trackToPlay, newQueue);
    } else {
      // Otherwise, use web playback
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
      if (isNativePlayback) {
          // Native seeking is not handled here. Android app should handle it.
          // This function now only handles web seeking.
          return;
      }
      const newProgress = value[0];
      setProgress(newProgress);
      
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


"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect, useCallback } from 'react';
import type { Track, Playlist, User } from '@/lib/types';
import YouTube from 'react-youtube';
import { useUserData } from './user-data-context';
import { generateRecommendations } from '@/ai/flows/generate-recommendations-flow';
import { searchYoutube } from '@/ai/flows/search-youtube-flow';
import { onAuthChange } from '@/lib/auth';
import { getPlaybackQuality, savePlaybackQuality } from '@/lib/preferences';

// Extend the window type to include our optional AndroidBridge and callbacks
declare global {
  interface Window {
    Android?: {
      startPlayback: (playlistJson: string, currentIndex: number) => void;
      play: () => void;
      pause: () => void;
      seekTo: (positionInSeconds: number) => void;
      setSleepTimer: (durationInMillis: number) => void;
      updatePlaybackQueue: (playlistJson: string, currentIndex: number) => void;
    };
    updateFromNative: (state: { isPlaying?: boolean; currentTime?: number; duration?: number; newSongIndex?: number; fetchMore?: boolean; }) => void;
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
  setQueueAndPlay: (tracks: Track[], startTrackId?: string, playlist?: Playlist, searchQuery?: string | null, continuationToken?: string | null) => void;
  playerRef: React.RefObject<YouTube | null>;
  progress: number;
  handleSeek: (value: number[]) => void;
  removeTrackFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  currentTime: number;
  duration: number;
  setSleepTimer: (durationInMillis: number) => void;
  isNowPlayingOpen: boolean;
  setIsNowPlayingOpen: (isOpen: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (isMinimized: boolean) => void;
  videoPlayerRef: React.RefObject<YouTube | null>;
  reorderQueue: (sourceIndex: number, destinationIndex: number) => void;
  showVideoInSheet: boolean;
  setShowVideoInSheet: (show: boolean) => void;
  playbackQuality: string;
  setPlaybackQuality: (quality: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Client-side helpers to generate queries
const getTopArtists = (recentlyPlayed: Track[], count: number): string[] => {
  if (!recentlyPlayed.length) return [];
  const artistCounts: { [artist: string]: number } = {};
  recentlyPlayed.forEach(track => {
    if (track.artist && track.artist !== 'Unknown Artist') {
      artistCounts[track.artist] = (artistCounts[track.artist] || 0) + 1;
    }
  });
  return Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(entry => entry[0]);
};

const getPlaylistDnaQueries = (userPlaylists: Playlist[], communityPlaylists: Playlist[], count: number): string[] => {
    if (!userPlaylists.length || !communityPlaylists.length) return [];
    
    const userTrackIds = new Set(userPlaylists.flatMap(p => p.trackIds));
    const dnaMatches: { query: string; score: number }[] = [];

    communityPlaylists.forEach(publicPlaylist => {
        const matchCount = publicPlaylist.trackIds.filter(tid => userTrackIds.has(tid)).length;
        if (matchCount > 0) {
            dnaMatches.push({ query: publicPlaylist.name, score: matchCount });
        }
    });

    return dnaMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(match => match.query);
};

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isNativePlayback, setIsNativePlayback] = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [playbackQuality, setPlaybackQualityState] = useState('default');
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [sleepTimerId, setSleepTimerId] = useState<NodeJS.Timeout | null>(null);
  const playerRef = useRef<YouTube | null>(null);
  const videoPlayerRef = useRef<YouTube | null>(null);
  const queueRef = useRef(queue);
  const [showVideoInSheet, setShowVideoInSheet] = useState(false);


  // New state for infinite queue
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const { recentlyPlayed, playlists: userPlaylists, communityPlaylists, getTrackById, addTracksToCache } = useUserData();
   const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(setCurrentUser);
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  
  const fetchMoreTracks = useCallback(async () => {
    if (isFetchingMore) return;

    const tokenToUse = continuationToken;
    if (!tokenToUse) return;

    setIsFetchingMore(true);
    try {
        let results;
        if (searchQuery) {
            results = await searchYoutube({
                query: searchQuery,
                continuationToken: tokenToUse,
            });
        } else {
            // For general recommendations, construct the query on the fly
            const recentTracks = recentlyPlayed.map(id => getTrackById(id)).filter(Boolean) as Track[];
            const topArtists = getTopArtists(recentTracks, 2);
            const dnaQueries = getPlaylistDnaQueries(userPlaylists, communityPlaylists, 3);
            const searchQueries = [...new Set([...topArtists, ...dnaQueries])];
            const query = searchQueries.join(' | ');

            if (!query) {
                setIsFetchingMore(false);
                return;
            }

            results = await generateRecommendations({
                query,
                continuationToken: tokenToUse,
                userHistory: { recentlyPlayed, userPlaylists }
            });
        }

        if (results && results.tracks.length > 0) {
            addTracksToCache(results.tracks);
            const newTracks = results.tracks.filter(t => !queueRef.current.some(qt => qt.id === t.id));
            const newQueue = [...queueRef.current, ...newTracks];
            setQueueState(newQueue);
            setContinuationToken(results.nextContinuationToken);

            if (isNativePlayback && window.Android?.startPlayback) {
                const currentIndex = newQueue.findIndex(t => t.id === currentTrack?.id);
                if (currentIndex !== -1) {
                    const playlistForNative = newQueue.map(t => ({
                        videoId: t.youtubeVideoId,
                        title: t.title,
                        artist: t.artist,
                        thumbnailUrl: `https://img.youtube.com/vi/${t.youtubeVideoId}/mqdefault.jpg`,
                    }));
                    const playlistJson = JSON.stringify(playlistForNative);
                    window.Android.startPlayback(playlistJson, currentIndex);
                }
            }
        } else {
            setContinuationToken(null);
        }
    } catch (error) {
        console.error("Failed to fetch more tracks for queue:", error);
    } finally {
        setIsFetchingMore(false);
    }
}, [isFetchingMore, continuationToken, searchQuery, recentlyPlayed, getTrackById, communityPlaylists, userPlaylists, addTracksToCache, isNativePlayback, currentTrack?.id]);


  useEffect(() => {
    const currentIndex = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1;
    if (currentIndex !== -1 && currentIndex >= queue.length - 3 && continuationToken) {
        fetchMoreTracks();
    }
  }, [currentTrack, queue, continuationToken, fetchMoreTracks]);


  const handleNativeUpdate = useCallback((state: { isPlaying?: boolean; currentTime?: number; duration?: number; newSongIndex?: number; fetchMore?: boolean; }) => {
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
              setCurrentTime(state.currentTime !== undefined ? state.currentTime : 0);
              setDuration(newTrack.duration);
          }
      }

      if (state.fetchMore && continuationToken) {
          fetchMoreTracks();
      }
  }, [fetchMoreTracks, continuationToken]);

  useEffect(() => {
    setIsMounted(true);
    const initialQuality = getPlaybackQuality();
    setPlaybackQualityState(initialQuality);
    window.updateFromNative = handleNativeUpdate;
    return () => {
      delete (window as any).updateFromNative;
      if (sleepTimerId) clearTimeout(sleepTimerId);
    };
  }, [handleNativeUpdate, sleepTimerId]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isPlaying && duration > 0 && !isNativePlayback) {
      timer = setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime + 1 >= duration) {
            clearInterval(timer);
            return prevTime;
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
  }, [isPlaying, duration, isNativePlayback]);


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
  
  const syncPlayers = (action: 'play' | 'pause' | 'seek', time?: number) => {
    if(isNativePlayback) return;
    try {
        const audioPlayer = playerRef.current?.getInternalPlayer();
        const videoPlayer = videoPlayerRef.current?.getInternalPlayer();

        if (action === 'play') {
            audioPlayer?.playVideo();
            if (isNowPlayingOpen) videoPlayer?.playVideo();
        } else if (action === 'pause') {
            audioPlayer?.pauseVideo();
            videoPlayer?.pauseVideo();
        } else if (action === 'seek' && time !== undefined) {
            audioPlayer?.seekTo(time, true);
            videoPlayer?.seekTo(time, true);
        }
    } catch (error) {
        console.error("Error syncing players:", error);
    }
  };


  useEffect(() => {
    if (!isMounted) return;

    if (isPlaying && !isNativePlayback) {
      if (isReady) {
        syncPlayers('play');
      }
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    } else if(!isPlaying && !isNativePlayback) {
      if (isReady) {
        syncPlayers('pause');
      }
       if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
    
  }, [isMounted, isReady, isPlaying, isNativePlayback, isNowPlayingOpen]);
  
  useEffect(() => {
    updateMediaSession();
  }, [currentTrack, isNativePlayback]);


  const playYoutubeSongInApp = (trackToPlay: Track, currentQueue: Track[]) => {
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
          window.Android.startPlayback(playlistJson, currentIndex);
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
        setDuration(trackToPlay.duration);
        setIsReady(false); // Set to false to wait for the new track to be ready
      }
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (isNativePlayback) {
        if(window.Android?.pause) {
            window.Android.pause();
            setIsPlaying(false);
        }
    } else {
        setIsPlaying(false);
    }
  };
  
  const playNextPrev = (direction: 'next' | 'prev') => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    let nextIndex;
    if (direction === 'next') {
        if (currentIndex < queue.length - 1) {
            nextIndex = currentIndex + 1;
        } else {
            return;
        }
    } else { // prev
        if (currentIndex > 0) {
            nextIndex = currentIndex - 1;
        } else {
            return;
        }
    }
    
    const nextTrack = queue[nextIndex];
    if (!nextTrack) return;

    if (isNativePlayback) {
      playYoutubeSongInApp(nextTrack, queue);
    } else {
      play(nextTrack);
    }
  }

  const playNext = () => playNextPrev('next');
  const playPrev = () => playNextPrev('prev');
  
  const setQueueAndPlay = async (
    tracks: Track[], 
    startTrackId?: string, 
    playlist?: Playlist,
    searchQueryValue: string | null = null,
    continuationTokenValue: string | null = null
  ) => {
    const newQueue = [...tracks];
    const trackToPlay = startTrackId 
        ? newQueue.find(t => t.id === startTrackId) 
        : newQueue[0];

    if (!trackToPlay) return;

    setQueueState(newQueue);
    setCurrentPlaylist(playlist || null);
    
    setSearchQuery(searchQueryValue);
    setContinuationToken(continuationTokenValue);
    
    if (playlist?.id === 'recommended-for-you' && !searchQueryValue) {
        // This case is for when starting playback from the "Recommended for you" section.
        // We need to generate an initial query and get a continuation token.
        const recentTracks = recentlyPlayed.map(id => getTrackById(id)).filter(Boolean) as Track[];
        const topArtists = getTopArtists(recentTracks, 2);
        const dnaQueries = getPlaylistDnaQueries(userPlaylists, communityPlaylists, 3);
        const query = [...new Set([...topArtists, ...dnaQueries])].join(' | ');

        if (query) {
            const results = await generateRecommendations({
                query,
                userHistory: { recentlyPlayed, userPlaylists },
            });
            setContinuationToken(results.nextContinuationToken);
        }
    }

    if (window.Android?.startPlayback) {
      playYoutubeSongInApp(trackToPlay, newQueue);
    } else {
      setIsNativePlayback(false);
      play(trackToPlay);
    }
  };

  const removeTrackFromQueue = (trackId: string) => {
    setQueueState(prev => prev.filter(track => track.id !== trackId));
  };

  const reorderQueue = (sourceIndex: number, destinationIndex: number) => {
    setQueueState(prev => {
      const newQueue = Array.from(prev);
      const [removed] = newQueue.splice(sourceIndex, 1);
      newQueue.splice(destinationIndex, 0, removed);
      return newQueue;
    });
  };

  const clearQueue = () => {
    setQueueState(currentTrack ? [currentTrack] : []);
  };
  
  const handleStateChange = (event: any) => {
    if (isNativePlayback) return;
    // This is the main audio player
    if (event.data === YouTube.PlayerState.PLAYING) {
      if(!isPlaying) setIsPlaying(true);
    } else if (event.data === YouTube.PlayerState.PAUSED) {
      // Allow our controls to be the source of truth, but if youtube pauses, we pause.
      if(isPlaying) setIsPlaying(false);
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
      syncPlayers('seek', seekTimeInSeconds);
  }
  
  const handleReady = (event: any) => {
    if (isNativePlayback) return;
    event.target.setPlaybackQuality(playbackQuality);
    setIsReady(true);
  }

  const setSleepTimer = (durationInMillis: number) => {
    if (sleepTimerId) {
      clearTimeout(sleepTimerId);
      setSleepTimerId(null);
    }

    if (window.Android?.setSleepTimer) {
      window.Android.setSleepTimer(durationInMillis);
      return;
    }

    if (durationInMillis > 0) {
      const newTimerId = setTimeout(() => {
        pause();
      }, durationInMillis);
      setSleepTimerId(newTimerId);
    }
  };

  const setPlaybackQuality = (quality: string) => {
    setPlaybackQualityState(quality);
    savePlaybackQuality(quality);
    if(playerRef.current) {
        const internalPlayer = playerRef.current.getInternalPlayer();
        internalPlayer?.setPlaybackQuality(quality);
    }
    if(videoPlayerRef.current) {
        const internalPlayer = videoPlayerRef.current.getInternalPlayer();
        internalPlayer?.setPlaybackQuality(quality);
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
    duration,
    setSleepTimer,
    isNowPlayingOpen,
    setIsNowPlayingOpen,
    isMinimized,
    setIsMinimized,
    videoPlayerRef,
    reorderQueue,
    showVideoInSheet,
    setShowVideoInSheet,
    playbackQuality,
    setPlaybackQuality,
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
                        // @ts-ignore
                        quality: playbackQuality,
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

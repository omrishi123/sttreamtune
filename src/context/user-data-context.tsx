
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserData, Playlist, Track } from '@/lib/types';
import { tracks as mockTracks } from '@/lib/mock-data';

const LIKED_SONGS_PLAYLIST_ID = 'liked-songs';

interface CachedTracks {
  [key: string]: Track;
}

interface UserDataContextType extends UserData {
  isLiked: (trackId: string) => boolean;
  toggleLike: (trackId: string) => void;
  addRecentlyPlayed: (trackId: string) => void;
  getTrackById: (trackId: string) => Track | undefined;
  createPlaylist: (name: string, description?: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  addTrackToCache: (track: Track) => void;
  addTracksToCache: (tracks: Track[]) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const getInitialUserData = (userId: string): UserData => {
  if (typeof window === 'undefined') {
    return { likedSongs: [], playlists: [], recentlyPlayed: [] };
  }
  const storedData = window.localStorage.getItem(`userData-${userId}`);
  if (storedData) {
    return JSON.parse(storedData);
  }
  return { likedSongs: [], playlists: [], recentlyPlayed: [] };
};

const getInitialTrackCache = (userId: string): CachedTracks => {
    const initialMockTracks = mockTracks.reduce((acc, track) => {
        acc[track.id] = track;
        return acc;
    }, {} as CachedTracks);

    if (typeof window === 'undefined') {
        return initialMockTracks;
    }
    const storedTracks = window.localStorage.getItem(`trackCache-${userId}`);
    const parsedTracks = storedTracks ? JSON.parse(storedTracks) : {};
    return { ...initialMockTracks, ...parsedTracks };
}


export const UserDataProvider = ({ children, user }: { children: ReactNode, user: User }) => {
  const [userData, setUserData] = useState<UserData>(getInitialUserData(user.id));
  const [trackCache, setTrackCache] = useState<CachedTracks>(getInitialTrackCache(user.id));

  // Persist user data to local storage
  useEffect(() => {
     if (user.id !== 'guest') {
      window.localStorage.setItem(`userData-${user.id}`, JSON.stringify(userData));
    }
  }, [userData, user.id]);

  // Persist track cache to local storage
  useEffect(() => {
    if (user.id !== 'guest') {
      window.localStorage.setItem(`trackCache-${user.id}`, JSON.stringify(trackCache));
    }
  }, [trackCache, user.id]);

  // Reload data when user changes
  useEffect(() => {
    setUserData(getInitialUserData(user.id));
    setTrackCache(getInitialTrackCache(user.id));
  }, [user.id])

  const addTrackToCache = (track: Track) => {
    if (!trackCache[track.id]) {
      setTrackCache(prev => ({ ...prev, [track.id]: track }));
    }
  };

  const addTracksToCache = (tracks: Track[]) => {
    const newTracks: CachedTracks = {};
    tracks.forEach(track => {
      if (!trackCache[track.id]) {
        newTracks[track.id] = track;
      }
    });
    if (Object.keys(newTracks).length > 0) {
      setTrackCache(prev => ({ ...prev, ...newTracks }));
    }
  };

  const isLiked = (trackId: string) => {
    return userData.likedSongs.includes(trackId);
  };

  const toggleLike = (trackId: string) => {
    setUserData(prev => {
      const newLikedSongs = prev.likedSongs.includes(trackId)
        ? prev.likedSongs.filter(id => id !== trackId)
        : [...prev.likedSongs, trackId];
      return { ...prev, likedSongs: newLikedSongs };
    });
  };

  const addRecentlyPlayed = (trackId: string) => {
    setUserData(prev => {
      const newRecentlyPlayed = [trackId, ...prev.recentlyPlayed.filter(id => id !== trackId)].slice(0, 50);
      return { ...prev, recentlyPlayed: newRecentlyPlayed };
    });
  };

  const getTrackById = (trackId: string): Track | undefined => {
    return trackCache[trackId];
  };
  
  const createPlaylist = (name: string, description: string = '') => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      description,
      trackIds: [],
      public: false,
      owner: user.name,
      coverArt: 'https://placehold.co/300x300.png',
      'data-ai-hint': 'playlist cover',
    };
    setUserData(prev => ({
      ...prev,
      playlists: [...prev.playlists, newPlaylist]
    }));
  };
  
  const addTrackToPlaylist = (playlistId: string, trackId: string) => {
      addTrackToCache(getTrackById(trackId)!); // Ensure track is in cache
      setUserData(prev => ({
      ...prev,
      playlists: prev.playlists.map(p => 
        p.id === playlistId 
          ? { ...p, trackIds: [...p.trackIds.filter(id => id !== trackId), trackId] }
          : p
      )
    }));
  };

  const getPlaylistById = (playlistId: string): Playlist | undefined => {
    if (playlistId === LIKED_SONGS_PLAYLIST_ID) {
      return {
        id: LIKED_SONGS_PLAYLIST_ID,
        name: 'Liked Songs',
        description: `${userData.likedSongs.length} songs`,
        coverArt: 'https://c.saavncdn.com/237/Top-10-Sad-Songs-Hindi-Hindi-2021-20250124193408-500x500.jpg',
        'data-ai-hint': 'glowing heart',
        trackIds: userData.likedSongs,
        public: false,
        owner: user.name,
        isLikedSongs: true,
      };
    }
     if (playlistId === 'recently-played') {
      return {
        id: 'recently-played',
        name: 'Recently Played',
        description: 'Tracks you\'ve listened to recently',
        coverArt: 'https://c.saavncdn.com/237/Top-10-Sad-Songs-Hindi-Hindi-2021-20250124193408-500x500.jpg',
        trackIds: userData.recentlyPlayed,
        public: false,
        owner: user.name,
        'data-ai-hint': 'time clock',
      };
    }
    return userData.playlists.find(p => p.id === playlistId);
  }


  const value: UserDataContextType = {
    ...userData,
    isLiked,
    toggleLike,
    addRecentlyPlayed,
    getTrackById,
    createPlaylist,
    addTrackToPlaylist,
    getPlaylistById,
    addTrackToCache,
    addTracksToCache,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = (): UserDataContextType => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

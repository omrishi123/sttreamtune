
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserData, Playlist } from '@/lib/types';
import { tracks as allTracks } from '@/lib/mock-data';

const LIKED_SONGS_PLAYLIST_ID = 'liked-songs';

interface UserDataContextType extends UserData {
  isLiked: (trackId: string) => boolean;
  toggleLike: (trackId: string) => void;
  addRecentlyPlayed: (trackId: string) => void;
  getTrackById: (trackId: string) => any | undefined;
  createPlaylist: (name: string, description?: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const getInitialState = (userId: string): UserData => {
  if (typeof window === 'undefined') {
    return { likedSongs: [], playlists: [], recentlyPlayed: [] };
  }
  const storedData = window.localStorage.getItem(`userData-${userId}`);
  if (storedData) {
    return JSON.parse(storedData);
  }
  return { likedSongs: [], playlists: [], recentlyPlayed: [] };
};


export const UserDataProvider = ({ children, user }: { children: ReactNode, user: User }) => {
  const [userData, setUserData] = useState<UserData>(getInitialState(user.id));

  useEffect(() => {
     if (user.id !== 'guest') {
      window.localStorage.setItem(`userData-${user.id}`, JSON.stringify(userData));
    }
  }, [userData, user.id]);

  useEffect(() => {
    setUserData(getInitialState(user.id));
  }, [user.id])

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

  const getTrackById = (trackId: string) => {
    // In a real app, this might need to fetch from an API if not available
    return allTracks.find(t => t.id === trackId);
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
        description: 'Your favorite tracks',
        coverArt: 'https://placehold.co/300x300.png',
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
        coverArt: 'https://placehold.co/300x300.png',
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

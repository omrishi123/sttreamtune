
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { User, UserData, Playlist, Track } from '@/lib/types';
import { tracks as mockTracks } from '@/lib/mock-data';
import { onAuthChange } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDoc, where, getDocs, writeBatch, deleteDoc } from "firebase/firestore";

const LIKED_SONGS_PLAYLIST_ID = 'liked-songs';

interface CachedTracks {
  [key: string]: Track;
}

interface UserDataContextType extends UserData {
  communityPlaylists: Playlist[];
  isLiked: (trackId: string) => boolean;
  toggleLike: (trackId: string) => void;
  addRecentlyPlayed: (trackId: string) => void;
  getTrackById: (trackId: string) => Track | undefined;
  createPlaylist: (name: string, description: string, isPublic: boolean) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => Promise<void>;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  addTrackToCache: (track: Track) => void;
  addTracksToCache: (tracks: Track[]) => void;
  addPlaylist: (playlist: Playlist) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const getInitialUserData = (userId: string): UserData => {
  const defaults = { likedSongs: [], playlists: [], recentlyPlayed: [] };
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaults;
  }
  try {
    const storedData = window.localStorage.getItem(`userData-${userId}`);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error("Error reading user data from localStorage:", error);
  }
  return defaults;
};

const getInitialTrackCache = (): CachedTracks => {
    const initialMockTracks = mockTracks.reduce((acc, track) => {
        acc[track.id] = track;
        return acc;
    }, {} as CachedTracks);

    if (typeof window === 'undefined' || !window.localStorage) {
        return initialMockTracks;
    }
    try {
      const storedTracks = window.localStorage.getItem('trackCache'); // Simplified to a single cache
      const parsedTracks = storedTracks ? JSON.parse(storedTracks) : {};
      return { ...initialMockTracks, ...parsedTracks };
    } catch (error) {
      console.error("Error reading track cache from localStorage:", error);
      return initialMockTracks;
    }
}

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData>({ likedSongs: [], playlists: [], recentlyPlayed: [] });
  const [trackCache, setTrackCache] = useState<CachedTracks>({});
  const [communityPlaylists, setCommunityPlaylists] = useState<Playlist[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        setUserData(getInitialUserData(user.id));
        setTrackCache(getInitialTrackCache());
      } else {
        // Handle logout case
        setUserData({ likedSongs: [], playlists: [], recentlyPlayed: [] });
      }
       setIsInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch community playlists from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, "communityPlaylists"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const playlists: Playlist[] = [];
      querySnapshot.forEach((doc) => {
        playlists.push({ id: doc.id, ...doc.data() } as Playlist);
      });
      setCommunityPlaylists(playlists);
    }, (error) => {
        console.error("Firestore (11.9.0): Uncaught Error in snapshot listener:", error)
    });

    return () => unsubscribe();
  }, []);

  // Persist user data to local storage
  useEffect(() => {
    if (!isInitialized || !currentUser) return;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`userData-${currentUser.id}`, JSON.stringify(userData));
      } catch(error) {
        console.error("Error writing user data to localStorage:", error);
      }
    }
  }, [userData, currentUser, isInitialized]);

  // Persist track cache to local storage
  useEffect(() => {
    if (!isInitialized || !currentUser) return;
    if (typeof window !== 'undefined' && window.localStorage) {
       try {
        window.localStorage.setItem('trackCache', JSON.stringify(trackCache));
      } catch(error) {
        console.error("Error writing track cache to localStorage:", error);
      }
    }
  }, [trackCache, currentUser, isInitialized]);

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

  const addPlaylist = (playlist: Playlist) => {
    setUserData(prev => ({
      ...prev,
      playlists: [playlist, ...prev.playlists],
    }));
  };
  
  const createPlaylist = async (name: string, description: string = '', isPublic: boolean = false) => {
    if (!currentUser || currentUser.id === 'guest') {
      console.error("Cannot create playlist: no user is logged in.");
      return;
    }
    
    const newPlaylistData = {
      name,
      description,
      trackIds: [],
      public: isPublic,
      owner: currentUser.name, 
      ownerId: currentUser.id,
      coverArt: 'https://c.saavncdn.com/237/Top-10-Sad-Songs-Hindi-Hindi-2021-20250124193408-500x500.jpg',
      'data-ai-hint': 'playlist cover',
    };

    if (isPublic) {
      try {
        await addDoc(collection(db, "communityPlaylists"), {
          ...newPlaylistData,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    } else {
        const newLocalPlaylist: Playlist = {
        ...newPlaylistData,
        id: `playlist-${Date.now()}`,
      };
      addPlaylist(newLocalPlaylist);
    }
  };
  
  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    const track = getTrackById(trackId);
    if (track) {
      addTrackToCache(track); // Ensure track is in cache
    }

    const playlist = getPlaylistById(playlistId);

    if (playlist?.public) {
      const playlistRef = doc(db, 'communityPlaylists', playlistId);
      const trackData = getTrackById(trackId);
      if (!trackData) {
        console.error("Cannot add a track that is not in cache");
        return;
      }
       try {
        await updateDoc(playlistRef, {
          tracks: arrayUnion(trackData),
          trackIds: arrayUnion(trackId) // Also update trackIds for consistency
        });
      } catch (error) {
        console.error("Error updating community playlist:", error);
      }
    } else {
      setUserData(prev => ({
        ...prev,
        playlists: prev.playlists.map(p =>
          p.id === playlistId && !p.trackIds.includes(trackId)
            ? { ...p, trackIds: [...p.trackIds, trackId] }
            : p
        ),
      }));
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
     const playlist = getPlaylistById(playlistId);
    if (!playlist) return;

    if (playlist.public) {
        const playlistRef = doc(db, 'communityPlaylists', playlistId);
        // Find the full track object to remove it from the 'tracks' array
        const trackToRemove = playlist.tracks?.find(t => t.id === trackId);
        try {
            const updates: { trackIds: any, tracks?: any } = {
                trackIds: arrayRemove(trackId)
            };
            if (trackToRemove) {
                updates.tracks = arrayRemove(trackToRemove);
            }
            await updateDoc(playlistRef, updates);
        } catch (error) {
            console.error("Error removing track from public playlist:", error);
        }
    } else {
      setUserData(prev => ({
        ...prev,
        playlists: prev.playlists.map(p =>
          p.id === playlistId
            ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId) }
            : p
        ),
      }));
    }
  };
  
  const deletePlaylist = async (playlistId: string) => {
    const playlist = getPlaylistById(playlistId);
    if (!playlist) return;

    if (playlist.public) {
      try {
        await deleteDoc(doc(db, "communityPlaylists", playlistId));
        // Remove from local state to update UI immediately
        setCommunityPlaylists(prev => prev.filter(p => p.id !== playlistId));
      } catch (error) {
        console.error("Error deleting public playlist:", error);
      }
    } else {
      // It's a private playlist, remove from local state
      setUserData(prev => ({
        ...prev,
        playlists: prev.playlists.filter(p => p.id !== playlistId),
      }));
    }
  };

  const getPlaylistById = (playlistId: string): Playlist | undefined => {
     if (!currentUser) return undefined;

    if (playlistId === LIKED_SONGS_PLAYLIST_ID) {
      return {
        id: LIKED_SONGS_PLAYLIST_ID,
        name: 'Liked Songs',
        description: `${userData.likedSongs.length} songs`,
        coverArt: 'https://i.postimg.cc/SswWC87w/streamtune.png',
        'data-ai-hint': 'glowing heart',
        trackIds: userData.likedSongs,
        public: false,
        owner: currentUser.name || "You",
        ownerId: currentUser.id,
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
        owner: currentUser.name || "You",
        ownerId: currentUser.id,
        'data-ai-hint': 'time clock',
      };
    }
    
    const userPlaylist = userData.playlists.find(p => p.id === playlistId);
    if (userPlaylist) return userPlaylist;

    return communityPlaylists.find(p => p.id === playlistId);
  }

  const value: UserDataContextType = {
    ...userData,
    communityPlaylists,
    isLiked,
    toggleLike,
    addRecentlyPlayed,
    getTrackById,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    deletePlaylist,
    getPlaylistById,
    addTrackToCache,
    addTracksToCache,
    addPlaylist,
  };

  if (!isInitialized) {
    return null;
  }

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

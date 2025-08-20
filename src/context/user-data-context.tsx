
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { User, UserData, Playlist, Track, Channel } from '@/lib/types';
import { tracks as mockTracks } from '@/lib/mock-data';
import { onAuthChange } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDoc, where, getDocs, writeBatch } from "firebase/firestore";
import { removeTrackFromPublicPlaylist } from '@/ai/flows/update-playlist-flow';
import { deletePublicPlaylist } from '@/ai/flows/delete-playlist-flow';
import { useToast } from '@/hooks/use-toast';

const LIKED_SONGS_PLAYLIST_ID = 'liked-songs';

interface CachedTracks {
  [key: string]: Track;
}

interface CachedPlaylists {
  [key: string]: Playlist;
}

interface UserDataContextType extends UserData {
  communityPlaylists: Playlist[];
  isLiked: (trackId: string) => boolean;
  toggleLike: (trackId: string) => void;
  addRecentlyPlayed: (trackId: string) => void;
  getTrackById: (trackId: string) => Track | undefined;
  createPlaylist: (name: string, description: string, isPublic: boolean) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<{ success: boolean; message: string; }>;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  addTrackToCache: (track: Track) => void;
  addTracksToCache: (tracks: Track[]) => void;
  addPlaylist: (playlist: Playlist) => void;
  addFetchedPlaylistToCache: (playlist: Playlist) => void;
  addChannel: (channel: Channel) => void;
  getChannelById: (channelId: string) => Channel | undefined;
  removeChannel: (channelId: string) => void;
  updateChannel: (channel: Channel) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const getInitialUserData = (userId: string): UserData => {
  const defaults = { likedSongs: [], playlists: [], recentlyPlayed: [], channels: [] };
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaults;
  }
  try {
    const storedData = window.localStorage.getItem(`userData-${userId}`);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      // Ensure channels array exists for backward compatibility
      return { ...defaults, ...parsedData, channels: parsedData.channels || [] };
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
  const [userData, setUserData] = useState<UserData>({ likedSongs: [], playlists: [], recentlyPlayed: [], channels: [] });
  const [trackCache, setTrackCache] = useState<CachedTracks>({});
  const [fetchedPlaylistsCache, setFetchedPlaylistsCache] = useState<CachedPlaylists>({}); // New cache for fetched playlists
  const [communityPlaylists, setCommunityPlaylists] = useState<Playlist[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        setUserData(getInitialUserData(user.id));
        setTrackCache(getInitialTrackCache());
        setFetchedPlaylistsCache({}); // Clear fetched playlist cache on user change
      } else {
        // Handle logout case
        setUserData({ likedSongs: [], playlists: [], recentlyPlayed: [], channels: [] });
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
  
  const addFetchedPlaylistToCache = (playlist: Playlist) => {
    setFetchedPlaylistsCache(prev => ({...prev, [playlist.id]: playlist}));
  }

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
     // If the playlist is public, add it to the community playlist state
    if (playlist.public) {
      setCommunityPlaylists(prev => [playlist, ...prev]);
    } else {
      // Otherwise, add it to the user's private playlists
      setUserData(prev => ({
        ...prev,
        playlists: [playlist, ...prev.playlists],
      }));
    }
  };
  
  const createPlaylist = async (name: string, description: string = '', isPublic: boolean = false) => {
    if (!currentUser) {
      throw new Error("Cannot create playlist: no user is logged in.");
    }
    
    // Explicitly block guest users from creating public playlists
    if (currentUser.id === 'guest' && isPublic) {
      throw new Error("Guest users cannot create public playlists. Please log in.");
    }

    const newPlaylistData = {
      name,
      description,
      trackIds: [],
      public: isPublic,
      owner: currentUser.name, 
      ownerId: currentUser.id, // This is the crucial field for ownership
      coverArt: 'https://i.postimg.cc/mkvv8tmp/digital-art-music-player-with-colorful-notes-black-background-900370-14342.avif',
      'data-ai-hint': 'playlist cover',
    };

    if (isPublic) {
      try {
        const docRef = await addDoc(collection(db, "communityPlaylists"), {
          ...newPlaylistData,
          tracks: [], // Initialize with empty tracks array
          createdAt: serverTimestamp(),
        });
        // Add the newly created public playlist to the local state immediately
        addPlaylist({ ...newPlaylistData, id: docRef.id });

      } catch (e) {
        console.error("Error adding document: ", e);
        throw e; // re-throw to be caught by the dialog
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
    const playlist = getPlaylistById(playlistId);
    if (!playlist || !currentUser) return;

    if (playlist.isChannelPlaylist) {
        toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'Cannot add tracks to a channel playlist.' });
        return;
    }

    if (playlist.public) {
        if (playlist.ownerId !== currentUser.id && !currentUser.isAdmin) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not own this public playlist.' });
            return;
        }
        const trackToAdd = getTrackById(trackId);
        if (!trackToAdd) {
            console.error("Cannot add a track that is not in cache to a public playlist.");
            return;
        }
        const playlistRef = doc(db, 'communityPlaylists', playlistId);
        try {
            await updateDoc(playlistRef, {
                tracks: arrayUnion(trackToAdd),
                trackIds: arrayUnion(trackId)
            });
            toast({ title: 'Added to playlist', description: `"${trackToAdd.title}" has been added.` });
        } catch (error: any) {
            console.error("Error updating public playlist:", error);
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    } else {
        // For private playlists in local storage
        let wasAdded = false;
        setUserData(prev => {
            const isTrackAlreadyInPlaylist = prev.playlists.find(p => p.id === playlistId)?.trackIds.includes(trackId);
            if (isTrackAlreadyInPlaylist) {
                return prev; // Return previous state if track is already there
            }
            wasAdded = true;
            return {
                ...prev,
                playlists: prev.playlists.map(p =>
                    p.id === playlistId ? { ...p, trackIds: [...p.trackIds, trackId] } : p
                ),
            };
        });

        // Show toast notification outside of the render cycle
        if (wasAdded) {
            toast({ title: 'Added to playlist', description: 'Song has been added.' });
        } else {
            toast({ title: 'Already in playlist', description: 'This song is already in the playlist.' });
        }
    }
};


  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = getPlaylistById(playlistId);
    if (!playlist || !currentUser) return;

    if (playlist.public) {
        // For public playlists in Firestore - use the secure flow
        const result = await removeTrackFromPublicPlaylist({
            playlistId: playlist.id,
            trackIdToRemove: trackId,
            userId: currentUser.id
        });
        if (result.success) {
           toast({ title: "Track Removed", description: "The track has been removed from the playlist."});
        } else {
           toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: result.message
            });
        }
    } else if (playlist.isChannelPlaylist) {
        // Handle local channel playlists
        const channel = userData.channels.find(c => c.id === playlist.id);
        if (channel) {
            const updatedUploads = channel.uploads.filter(t => t.id !== trackId);
            const updatedChannel = { ...channel, uploads: updatedUploads };
            updateChannel(updatedChannel);
            toast({ title: "Track Removed", description: "The track has been removed from the channel's uploads."});
        }
    } else {
      // For private playlists in local storage
      setUserData(prev => ({
        ...prev,
        playlists: prev.playlists.map(p =>
          p.id === playlistId
            ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId) }
            : p
        ),
      }));
      toast({ title: "Track Removed", description: "The track has been removed from the playlist."});
    }
  };
  
  const deletePlaylist = async (playlistId: string): Promise<{ success: boolean; message: string; }> => {
    const playlist = getPlaylistById(playlistId);
    if (!playlist || !currentUser) return { success: false, message: 'Playlist or user not found.' };

    if (playlist.public) {
        const result = await deletePublicPlaylist({
          playlistId: playlist.id, 
          userId: currentUser.id
        });
        return result;
    } else {
      // It's a private playlist, remove from local state
      setUserData(prev => ({
        ...prev,
        playlists: prev.playlists.filter(p => p.id !== playlistId),
      }));
      return { success: true, message: 'Playlist deleted successfully.' };
    }
  };

  const getPlaylistById = (playlistId: string): Playlist | undefined => {
     if (!currentUser) return undefined;

    if (playlistId === LIKED_SONGS_PLAYLIST_ID) {
      return {
        id: LIKED_SONGS_PLAYLIST_ID,
        name: 'Liked Songs',
        description: `${userData.likedSongs.length} songs`,
        coverArt: 'https://i.postimg.cc/mkvv8tmp/digital-art-music-player-with-colorful-notes-black-background-900370-14342.avif',
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
        coverArt: 'https://i.postimg.cc/mkvv8tmp/digital-art-music-player-with-colorful-notes-black-background-900370-14342.avif',
        trackIds: userData.recentlyPlayed,
        public: false,
        owner: currentUser.name || "You",
        ownerId: currentUser.id,
        'data-ai-hint': 'time clock',
      };
    }
    
    // Check local/private playlists first
    const userPlaylist = userData.playlists.find(p => p.id === playlistId);
    if (userPlaylist) return userPlaylist;

    // Check firestore/community playlists next
    const communityPlaylist = communityPlaylists.find(p => p.id === playlistId);
    if (communityPlaylist) return communityPlaylist;
    
    // Check channel playlists
    for (const channel of userData.channels) {
        if (channel.id === playlistId) { // For the main "uploads" list
             return {
                id: channel.id,
                name: channel.name,
                description: `Uploaded by ${channel.name}`,
                public: false,
                owner: 'You',
                coverArt: channel.logo,
                trackIds: channel.uploads.map(t => t.id),
                tracks: channel.uploads,
                isChannelPlaylist: true,
            }
        }
        const channelPlaylist = channel.playlists.find(p => p.id === playlistId);
        if (channelPlaylist) {
            // Because tracks are not stored inside the channel playlist object, we need to fetch them
            const tracks = channelPlaylist.trackIds.map(id => getTrackById(id)).filter(Boolean) as Track[];
            return {...channelPlaylist, tracks, isChannelPlaylist: true};
        }
    }


    // Finally, check the temporary cache for fetched YT playlists
    return fetchedPlaylistsCache[playlistId];
  }

  const addChannel = (channel: Channel) => {
    setUserData(prev => {
        const otherChannels = prev.channels.filter(c => c.id !== channel.id);
        return {
            ...prev,
            channels: [channel, ...otherChannels]
        }
    });
  };

  const removeChannel = (channelId: string) => {
    setUserData(prev => ({
      ...prev,
      channels: prev.channels.filter(c => c.id !== channelId)
    }));
  };

  const updateChannel = (updatedChannel: Channel) => {
    setUserData(prev => ({
        ...prev,
        channels: prev.channels.map(c => c.id === updatedChannel.id ? updatedChannel : c)
    }));
  }

  const getChannelById = (channelId: string) => {
    return userData.channels.find(c => c.id === channelId);
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
    addFetchedPlaylistToCache,
    addChannel,
    getChannelById,
    removeChannel,
    updateChannel,
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

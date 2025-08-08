
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useUserData } from "@/context/user-data-context";
import { PlaylistCard } from "@/components/playlist-card";
import { AddPlaylistDialog } from "@/components/add-playlist-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Sparkles, Smartphone } from "lucide-react";
import { Playlist, User, Track } from "@/lib/types";
import { ImportPlaylistDialog } from "@/components/import-playlist-dialog";
import { GeneratePlaylistDialog } from "@/components/generate-playlist-dialog";
import { onAuthChange } from '@/lib/auth';
import { TrackList } from '@/components/track-list';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayer } from '@/context/player-context';

// Extend the window type to include our optional AndroidBridge and the new callback
declare global {
  interface Window {
    Android?: {
      getLocalTracks: () => void;
    };
    updateLocalTracks?: (jsonString: string) => void;
  }
}


const PlaylistGrid = ({ playlists, title }: { playlists: Playlist[], title?: string }) => {
    if (playlists.length === 0 && !title) {
        return (
            <div className="text-center py-10 col-span-full">
                <p className="text-muted-foreground">No playlists in this section.</p>
            </div>
        );
    }
     if (playlists.length === 0 && title) {
        return null;
    }
    return (
        <div className="mt-8">
            {title && <h2 className="text-xl font-bold font-headline mb-4">{title}</h2>}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4">
                {playlists.map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
            </div>
        </div>
    );
};

const LocalMusicTab = () => {
    const [localTracks, setLocalTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNative, setIsNative] = useState(false);
    const { setQueueAndPlay } = usePlayer();

    useEffect(() => {
        setIsNative(!!window.Android?.getLocalTracks);

        window.updateLocalTracks = (jsonString: string) => {
            try {
                const tracks = JSON.parse(jsonString);
                const formattedTracks: Track[] = tracks.map((t: any) => ({
                    id: t.uri, // Use URI as a unique ID for local files
                    youtubeVideoId: '', // Not a youtube video
                    title: t.title || 'Unknown Title',
                    artist: t.artist || 'Unknown Artist',
                    album: t.album || 'Unknown Album',
                    artwork: t.artwork || 'https://i.postimg.cc/SswWC87w/streamtune.png',
                    duration: Math.floor(t.duration / 1000), // Convert ms to seconds
                    isLocal: true,
                }));
                setLocalTracks(formattedTracks);
            } catch (error) {
                console.error("Failed to parse local tracks:", error);
            }
            setIsLoading(false);
        };
        
        if (window.Android?.getLocalTracks) {
            window.Android.getLocalTracks();
        } else {
            setIsLoading(false);
        }

        return () => {
            delete window.updateLocalTracks;
        }
    }, []);
    
    const localFilesPlaylist: Playlist = {
        id: "local-files",
        name: "Local Music",
        description: "Music on this device",
        owner: "You",
        public: false,
        trackIds: localTracks.map(t => t.id),
        tracks: localTracks,
        coverArt: "https://placehold.co/300x300.png",
        'data-ai-hint': 'smartphone music'
    };

    if (!isNative) {
        return (
            <div className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg mt-6">
                <Smartphone className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Local Playback Not Available</h3>
                <p className="mt-2 max-w-md mx-auto">This feature is only available in the StreamTune Android app. Install the app to play music directly from your device.</p>
            </div>
        );
    }

    if (isLoading) {
        return <div className="mt-6 space-y-2">
            {Array.from({length: 10}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>;
    }

    if (localTracks.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg mt-6">
                <h3 className="text-lg font-semibold text-foreground">No Music Found</h3>
                <p>We couldn't find any music files on your device.</p>
            </div>
        );
    }
    
    return (
        <div className="mt-6">
            <TrackList tracks={localTracks} playlist={localFilesPlaylist} />
        </div>
    );
};


export default function LibraryPage() {
  const { playlists: userPrivatePlaylists, likedSongs, getTrackById, communityPlaylists } = useUserData();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthChange(setCurrentUser);
    return () => unsubscribe();
  }, []);

  const getFirstTrackArtwork = (trackIds: string[]) => {
    if (trackIds.length > 0) {
      const firstTrack = getTrackById(trackIds[0]);
      return firstTrack?.artwork;
    }
    return undefined;
  };
  
  const likedSongsPlaylist: Playlist = {
    id: "liked-songs",
    name: "Liked Songs",
    description: `${likedSongs.length} songs`,
    owner: "You",
    public: false,
    trackIds: likedSongs,
    coverArt: getFirstTrackArtwork(likedSongs) || "https://c.saavncdn.com/237/Top-10-Sad-Songs-Hindi-Hindi-2021-20250124193408-500x500.jpg",
    'data-ai-hint': 'glowing heart',
    isLikedSongs: true,
  };
  
  const recentlyPlayedPlaylist: Playlist = {
    id: "recently-played",
    name: "Recently Played",
    description: "Your listening history",
    owner: "You",
    public: false,
    trackIds: [],
    coverArt: "https://c.saavncdn.com/237/Top-10-Sad-Songs-Hindi-Hindi-2021-20250124193408-500x500.jpg",
    'data-ai-hint': 'time clock',
  }

  const processedUserPrivatePlaylists = userPrivatePlaylists.map(playlist => ({
    ...playlist,
    coverArt: getFirstTrackArtwork(playlist.trackIds) || playlist.coverArt
  }));
  
  const userPublicPlaylists = useMemo(() => {
    if (!currentUser) return [];
    return communityPlaylists.filter(p => p.ownerId === currentUser.id);
  }, [communityPlaylists, currentUser]);

  const defaultPlaylists = [likedSongsPlaylist, recentlyPlayedPlaylist];

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-tight">Your Library</h1>
        <div className="flex items-center gap-2">
           <GeneratePlaylistDialog>
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Create with AI</span>
              </Button>
           </GeneratePlaylistDialog>
           <ImportPlaylistDialog>
             <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Import</span>
              </Button>
           </ImportPlaylistDialog>
           <AddPlaylistDialog>
             <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New</span>
              </Button>
          </AddPlaylistDialog>
        </div>
      </div>
      
      <Tabs defaultValue="playlists">
        <TabsList>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="device">On this Device</TabsTrigger>
          <TabsTrigger value="artists" disabled>Artists</TabsTrigger>
          <TabsTrigger value="albums" disabled>Albums</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists" className="mt-6 space-y-8">
          <PlaylistGrid playlists={defaultPlaylists} />
          
          {currentUser?.id !== 'guest' ? (
              <>
                <PlaylistGrid playlists={userPublicPlaylists} title="Your Public Playlists" />
                <PlaylistGrid playlists={processedUserPrivatePlaylists} title="Your Private Playlists" />
              </>
          ) : (
             <PlaylistGrid playlists={processedUserPrivatePlaylists} />
          )}
          
        </TabsContent>

        <TabsContent value="device">
            <LocalMusicTab />
        </TabsContent>

      </Tabs>
    </div>
  );
}

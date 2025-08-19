
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
import { Plus, Upload, Sparkles } from "lucide-react";
import { Playlist, User } from "@/lib/types";
import { ImportPlaylistDialog } from "@/components/import-playlist-dialog";
import { GeneratePlaylistDialog } from "@/components/generate-playlist-dialog";
import { onAuthChange } from '@/lib/auth';

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
    coverArt: getFirstTrackArtwork(likedSongs) || "https://i.postimg.cc/mkvv8tmp/digital-art-music-player-with-colorful-notes-black-background-900370-14342.avif",
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
    coverArt: "https://i.postimg.cc/mkvv8tmp/digital-art-music-player-with-colorful-notes-black-background-900370-14342.avif",
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

      </Tabs>
    </div>
  );
}

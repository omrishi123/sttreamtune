"use client";

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
import { Heart, History, Plus } from "lucide-react";
import Link from "next/link";
import { Playlist } from "@/lib/types";

export default function LibraryPage() {
  const { playlists: userPlaylists, likedSongs } = useUserData();
  
  const likedSongsPlaylist: Playlist = {
    id: "liked-songs",
    name: "Liked Songs",
    description: `${likedSongs.length} songs`,
    owner: "You",
    public: false,
    trackIds: likedSongs,
    coverArt: "https://c.saavncdn.com/237/Top-10-Sad-Songs-Hindi-Hindi-2021-20250124193408-500x500.jpg",
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

  const allPlaylists = [likedSongsPlaylist, recentlyPlayedPlaylist, ...userPlaylists];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Your Library</h1>
        <AddPlaylistDialog>
           <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Playlist
            </Button>
        </AddPlaylistDialog>
      </div>
      
      <Tabs defaultValue="playlists">
        <TabsList>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="artists" disabled>Artists</TabsTrigger>
          <TabsTrigger value="albums" disabled>Albums</TabsTrigger>
        </TabsList>
        <TabsContent value="playlists" className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {allPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

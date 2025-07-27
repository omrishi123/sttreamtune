
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
import { Plus, Upload } from "lucide-react";
import { Playlist } from "@/lib/types";
import { ImportPlaylistDialog } from "@/components/import-playlist-dialog";

export default function LibraryPage() {
  const { playlists: userPlaylists, likedSongs, getTrackById } = useUserData();

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

  const processedUserPlaylists = userPlaylists.map(playlist => ({
    ...playlist,
    coverArt: getFirstTrackArtwork(playlist.trackIds) || playlist.coverArt
  }));

  const allPlaylists = [likedSongsPlaylist, recentlyPlayedPlaylist, ...processedUserPlaylists];

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-tight">Your Library</h1>
        <div className="flex items-center gap-2">
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
        <TabsContent value="playlists" className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4">
            {allPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

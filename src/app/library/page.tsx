
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { Plus, Upload, Sparkles, Tv, Settings, User } from "lucide-react";
import { Playlist, User as AppUser, Channel } from "@/lib/types";
import { ImportPlaylistDialog } from "@/components/import-playlist-dialog";
import { GeneratePlaylistDialog } from "@/components/generate-playlist-dialog";
import { ImportChannelDialog } from "@/components/import-channel-dialog";
import { onAuthChange } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const PlaylistGrid = ({ playlists, title, isGuestPrivateSection = false }: { playlists: Playlist[], title?: string, isGuestPrivateSection?: boolean }) => {
    if (playlists.length === 0) {
      if (title === "Your Public Playlists") {
        return (
           <div className="mt-8">
            <h2 className="text-xl font-bold font-headline mb-4">{title}</h2>
             <Card className="flex flex-col items-center justify-center p-6 text-center bg-muted/50 col-span-full">
                <CardContent className="p-0 space-y-4">
                  <h3 className="font-semibold">Share your vibe with the community!</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a public playlist to see it appear here.
                  </p>
                  <div className="flex flex-col gap-2 items-center justify-center mt-4">
                     <GeneratePlaylistDialog>
                        <Button variant="outline" size="sm">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Create with AI
                        </Button>
                    </GeneratePlaylistDialog>
                    <ImportPlaylistDialog>
                        <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Import from YouTube
                        </Button>
                    </ImportPlaylistDialog>
                    <AddPlaylistDialog>
                        <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Playlist
                        </Button>
                    </AddPlaylistDialog>
                  </div>
                </CardContent>
            </Card>
          </div>
        )
      }
      
      if (isGuestPrivateSection) {
        return (
            <div className="mt-8">
              <h2 className="text-xl font-bold font-headline mb-4">Your Playlists</h2>
              <Card className="flex flex-col items-center justify-center p-6 text-center bg-muted/50 col-span-full">
                  <CardContent className="p-0 space-y-4">
                    <h3 className="font-semibold">Create your first playlist!</h3>
                    <p className="text-sm text-muted-foreground">
                      Playlists you create will appear here.
                    </p>
                    <div className="flex flex-col gap-2 items-center justify-center mt-4">
                       <GeneratePlaylistDialog>
                          <Button variant="outline" size="sm">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Create with AI
                          </Button>
                      </GeneratePlaylistDialog>
                      <ImportPlaylistDialog>
                          <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Import from YouTube
                          </Button>
                      </ImportPlaylistDialog>
                      <AddPlaylistDialog>
                          <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              New Playlist
                          </Button>
                      </AddPlaylistDialog>
                    </div>
                  </CardContent>
              </Card>
            </div>
        )
      }

      if (!title) {
        return (
            <div className="text-center py-10 col-span-full">
                <p className="text-muted-foreground">No playlists in this section.</p>
            </div>
        );
      }
      // Return null for other titled sections that are empty
      return null;
    }

    return (
        <div className="mt-8">
            {title && <h2 className="text-xl font-bold font-headline mb-4">{title}</h2>}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4">
                {playlists.map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
            </div>
        </div>
    );
};

const ChannelGrid = ({ channels }: { channels: Channel[] }) => {
  if (channels.length === 0) {
    return (
      <div className="text-center py-16 col-span-full space-y-4">
        <p className="text-muted-foreground">Import a channel to get started.</p>
        <ImportChannelDialog>
            <Button>
                <Tv className="mr-2 h-4 w-4" />
                Import Channel
            </Button>
        </ImportChannelDialog>
      </div>
    );
  }
  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4">
        {channels.map((channel) => (
          <Link href={`/channels/${channel.id}`} key={channel.id} className="group text-center">
            <div className="aspect-square p-2">
              <Image 
                src={channel.logo} 
                alt={channel.name} 
                width={150} 
                height={150} 
                className="rounded-full aspect-square object-cover mx-auto transition-transform group-hover:scale-105"
                unoptimized
              />
            </div>
            <p className="text-sm font-semibold truncate group-hover:text-primary">{channel.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};


export default function LibraryPage() {
  const { playlists: userPrivatePlaylists, likedSongs, getTrackById, communityPlaylists, channels } = useUserData();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const router = useRouter();
  
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
  const isGuest = currentUser?.id === 'guest';

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-tight">Your Library</h1>
        <div className="flex items-center gap-2">
            <ImportChannelDialog>
                <Button variant="outline" size="sm">
                    <Tv className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Import Channel</span>
                </Button>
            </ImportChannelDialog>
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
           <Button variant="outline" size="sm" className="p-2" onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4" />
            </Button>
        </div>
      </div>
      
      <Tabs defaultValue="playlists">
        <TabsList>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="artists" asChild><Link href="/artists">Artists</Link></TabsTrigger>
          <TabsTrigger value="albums" disabled>Albums</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists" className="mt-6 space-y-8">
          <PlaylistGrid playlists={defaultPlaylists} />
          
          {isGuest ? (
              <PlaylistGrid 
                playlists={processedUserPrivatePlaylists} 
                isGuestPrivateSection={true} 
              />
          ) : (
             <>
                <PlaylistGrid playlists={userPublicPlaylists} title="Your Public Playlists" />
                <PlaylistGrid playlists={processedUserPrivatePlaylists} title="Your Private Playlists" />
              </>
          )}
          
        </TabsContent>
        <TabsContent value="channels">
          <ChannelGrid channels={channels} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

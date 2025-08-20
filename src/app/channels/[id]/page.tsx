
"use client";

import Image from "next/image";
import { useParams, notFound, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useUserData } from "@/context/user-data-context";
import { Skeleton } from "@/components/ui/skeleton";
import type { Channel, Playlist } from "@/lib/types";
import { TrackList } from "@/components/track-list";
import { PlaylistCard } from "@/components/playlist-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { getChannelById, removeChannel, updateChannel } = useUserData();
  const { toast } = useToast();
  
  const [channel, setChannel] = useState<Channel | undefined | null>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);

  useEffect(() => {
    if (id) {
      const foundChannel = getChannelById(id);
      setChannel(foundChannel);
      setIsLoading(false);
    }
  }, [id, getChannelById]);
  
  const handleRemoveChannel = () => {
    if (!channel) return;
    setIsDeleting(true);
    removeChannel(channel.id);
    toast({
      title: "Channel Removed",
      description: `"${channel.name}" has been removed from your library.`,
    });
    router.push('/library');
    router.refresh();
  }

  const handlePlaylistDelete = (playlist: Playlist) => {
    if (!channel) return;
    const updatedPlaylists = channel.playlists.filter(p => p.id !== playlist.id);
    const updatedChannel = { ...channel, playlists: updatedPlaylists };
    updateChannel(updatedChannel);
    setChannel(updatedChannel);
    setPlaylistToDelete(null); // Close dialog
    toast({
        title: "Playlist Removed",
        description: `"${playlist.name}" has been removed from this channel.`
    });
  }

  if (isLoading) {
    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row items-center gap-6">
                <Skeleton className="w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] rounded-full shadow-lg flex-shrink-0" />
                <div className="space-y-3 text-center sm:text-left w-full">
                    <Skeleton className="h-10 w-60 mx-auto sm:mx-0" />
                    <Skeleton className="h-4 w-48 mx-auto sm:mx-0" />
                </div>
            </header>
            <section>
                 <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-2">
                    {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </section>
        </div>
    );
  }

  if (!channel) {
    notFound();
  }
  
  const channelPlaylist: Playlist = {
      id: channel.id,
      name: channel.name,
      description: `Uploaded by ${channel.name}`,
      public: false, // Treat as a private collection
      owner: 'You',
      coverArt: channel.logo,
      trackIds: channel.uploads.map(t => t.id),
      tracks: channel.uploads, // Embed tracks for local management
      isChannelPlaylist: true,
  }

  return (
    <>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <Image
            src={channel.logo}
            alt={channel.name}
            width={200}
            height={200}
            className="rounded-full shadow-lg aspect-square object-cover w-[150px] h-[150px] sm:w-[175px] sm:h-[175px] md:w-[200px] md:h-[200px] flex-shrink-0"
            priority
            unoptimized
          />
          <div className="space-y-3 min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wider">Channel</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline tracking-tighter line-clamp-3">
              {channel.name}
            </h1>
            <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isDeleting}>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Channel</span>
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove "{channel.name}" and all its imported content from your library.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveChannel} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

         <Tabs defaultValue="uploads">
            <TabsList>
                <TabsTrigger value="uploads">Uploads</TabsTrigger>
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
            </TabsList>
            <TabsContent value="uploads" className="mt-6">
                {channel.uploads.length > 0 ? (
                    <TrackList tracks={channel.uploads} playlist={channelPlaylist} />
                ) : (
                    <p className="text-muted-foreground text-center py-8">This channel has no uploads.</p>
                )}
            </TabsContent>
            <TabsContent value="playlists" className="mt-6">
                {channel.playlists.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {channel.playlists.map((playlist) => (
                             <div key={playlist.id} className="relative group/card">
                                <PlaylistCard playlist={playlist} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/card:opacity-100 bg-background/70 backdrop-blur-sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                         <DropdownMenuItem onClick={() => setPlaylistToDelete(playlist)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete Playlist</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                ) : (
                     <p className="text-muted-foreground text-center py-8">This channel has no public playlists.</p>
                )}
            </TabsContent>
        </Tabs>
      </div>

       <AlertDialog open={!!playlistToDelete} onOpenChange={() => setPlaylistToDelete(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This will remove "{playlistToDelete?.name}" from this channel's imported playlists.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handlePlaylistDelete(playlistToDelete!)} className="bg-destructive hover:bg-destructive/90">
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

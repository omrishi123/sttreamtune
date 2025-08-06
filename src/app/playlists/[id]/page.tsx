

"use client";

import Image from "next/image";
import { getTracksForPlaylist, getYoutubePlaylistDetails } from "@/ai/flows/get-youtube-playlists-flow";
import { notFound, useParams, useRouter } from "next/navigation";
import { TrackList } from "@/components/track-list";
import { Button } from "@/components/ui/button";
import { Play, Share2, MoreHorizontal, Trash2, ShieldCheck, Wrench } from "lucide-react";
import type { Playlist, Track, User } from "@/lib/types";
import { useUserData } from "@/context/user-data-context";
import React, { useEffect, useState, useCallback } from "react";
import { usePlayer } from "@/context/player-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { onAuthChange } from "@/lib/auth";
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
} from "@/components/ui/alert-dialog";
import { repairPlaylist } from "@/ai/flows/repair-playlist-flow";

const FALLBACK_IMAGE_URL = "https://c.saavncdn.com/237/Top-10-Sad-Songs-Hindi-Hindi-2021-20250124193408-500x500.jpg";

export default function PlaylistPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getPlaylistById, getTrackById, addTracksToCache, deletePlaylist } = useUserData();
  const { setQueueAndPlay } = usePlayer();
  const { toast } = useToast();
  
  const [playlist, setPlaylist] = useState<Playlist | undefined | null>(undefined);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRepairing, setIsRepairing] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(setCurrentUser);
    return () => unsubscribe();
  }, []);
  
  const fetchPlaylistData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);

    let foundPlaylist: Playlist | undefined | null = getPlaylistById(id);
    let fetchedTracks: Track[] = [];

    if (foundPlaylist?.public && foundPlaylist.tracks) { // Public playlist from firestore
        fetchedTracks = foundPlaylist.tracks;
        addTracksToCache(fetchedTracks);
    } else if (foundPlaylist) { // Private playlist
        fetchedTracks = foundPlaylist.trackIds.map(trackId => getTrackById(trackId)).filter(Boolean) as Track[];
    } else { // External YouTube playlist not in our system
      try {
        const ytPlaylistDetails = await getYoutubePlaylistDetails({ playlistId: id });
        if (ytPlaylistDetails) {
          fetchedTracks = await getTracksForPlaylist(id);
          addTracksToCache(fetchedTracks);
          foundPlaylist = {
            ...ytPlaylistDetails,
            trackIds: fetchedTracks.map(t => t.id)
          };
        }
      } catch (error) {
        console.error("Failed to fetch from YouTube", error);
        foundPlaylist = null;
      }
    }

    if (foundPlaylist) {
      setPlaylist(foundPlaylist);
      setTracks(fetchedTracks);
      setImgSrc(foundPlaylist.coverArt);
    } else {
      setPlaylist(null); // Not found
    }
    setIsLoading(false);
  }, [id, getPlaylistById, getTrackById, addTracksToCache]);


  useEffect(() => {
    fetchPlaylistData();
  }, [id, fetchPlaylistData]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row items-center gap-6">
          <Skeleton className="w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] rounded-lg shadow-lg flex-shrink-0" />
          <div className="space-y-3 text-center sm:text-left w-full">
            <Skeleton className="h-4 w-24 mx-auto sm:mx-0" />
            <Skeleton className="h-10 w-60 mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-full max-w-sm mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-48 mx-auto sm:mx-0" />
            <Skeleton className="h-12 w-32 mt-4 mx-auto sm:mx-0" />
          </div>
        </header>
        <section>
          <div className="space-y-2">
            {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </section>
      </div>
    );
  }

  if (!playlist) {
    notFound();
  }
  
  const totalDuration = tracks.reduce((acc, track) => acc + (track?.duration || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  const handlePlayPlaylist = () => {
    if(tracks.length > 0) {
      setQueueAndPlay(tracks, tracks[0].id, playlist);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Playlist link has been copied to your clipboard.",
    });
  }

  const handleDeletePlaylist = async () => {
    if (!playlist) return;

    if (currentUser?.id === 'guest') {
       toast({
            variant: "destructive",
            title: "Login Required",
            description: "You must be logged in to delete a playlist.",
        });
        return;
    }

    const result = await deletePlaylist(playlist.id);

    if (result.success) {
        toast({
            title: "Playlist Deleted",
            description: `"${playlist.name}" has been deleted.`,
        });
        // This will trigger a re-fetch of data in the library page
        router.push('/library');
        router.refresh(); 
    } else {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: result.message,
        });
    }
  };

  const handleRepairPlaylist = async () => {
    if (!playlist || !currentUser || currentUser.id === 'guest') return;
    setIsRepairing(true);
    try {
      const result = await repairPlaylist({ playlistId: playlist.id, userId: currentUser.id });
      if (result.success) {
        toast({
          title: "Playlist Repaired!",
          description: "You now have full control over this playlist.",
        });
        fetchPlaylistData(); // Re-fetch data to update the UI
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Repair Failed",
        description: error.message || "Could not repair the playlist. Please try again.",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  // User can edit if it's a private playlist, or if it's a public playlist they own.
  const canEdit = currentUser && playlist && (playlist.public ? playlist.ownerId === currentUser.id : true);
  // A playlist is broken if it's public and the ownerId is missing.
  const isBroken = currentUser && playlist.public && !playlist.ownerId && currentUser.id !== 'guest';


  return (
    <div className="space-y-8">
       <header className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <Image
          src={imgSrc || playlist.coverArt}
          alt={playlist.name}
          width={200}
          height={200}
          className="rounded-lg shadow-lg aspect-square object-cover w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] flex-shrink-0"
          priority
          data-ai-hint={playlist['data-ai-hint']}
          onError={() => setImgSrc(FALLBACK_IMAGE_URL)}
        />
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wider">Playlist</p>
          <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter break-words">
            {playlist.name}
          </h1>
          {playlist.description && <p className="text-muted-foreground text-sm break-words">{playlist.description}</p>}
          <p className="text-sm text-muted-foreground">
            Created by{" "}
            <span className="text-foreground font-medium">{playlist.owner}</span>
            {" \u2022 "}
            {tracks.length} songs, about {totalMinutes} min
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
             <Button size="lg" onClick={handlePlayPlaylist}>
                <Play className="mr-2 h-5 w-5"/>
                Play
             </Button>
             <Button size="lg" variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-5 w-5"/>
                Share
             </Button>
             {isBroken && (
                <Button size="lg" variant="destructive" onClick={handleRepairPlaylist} disabled={isRepairing}>
                  <Wrench className="mr-2 h-5 w-5"/>
                  {isRepairing ? 'Repairing...' : 'Repair'}
                </Button>
              )}
             {canEdit && (
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="lg" variant="outline">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete playlist</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        playlist "{playlist.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeletePlaylist} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
          </div>
        </div>
      </header>

      <section>
        <TrackList tracks={tracks} playlist={playlist} />
      </section>
    </div>
  );
}

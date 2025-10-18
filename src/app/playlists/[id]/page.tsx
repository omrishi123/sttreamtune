
"use client";

import Image from "next/image";
import { getTracksForPlaylist as fetchTracksForPlaylist, getYoutubePlaylistDetails } from "@/ai/flows/get-youtube-playlists-flow";
import { notFound, useParams, useRouter } from "next/navigation";
import { TrackList } from "@/components/track-list";
import { Button } from "@/components/ui/button";
import { Play, Share2, MoreHorizontal, Trash2, ShieldCheck, BadgeCheck, Plus } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getCachedPlaylistTracks, cachePlaylistTracks, getCachedSinglePlaylist, cacheSinglePlaylist } from "@/lib/recommendations";
import { AddSongsDialog } from "@/components/add-songs-dialog";

const FALLBACK_IMAGE_URL = "https://i.postimg.cc/mkvv8tmp/digital-art-music-player-with-colorful-notes-black-background-900370-14342.avif";

export default function PlaylistPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getPlaylistById, addTracksToCache, deletePlaylist, updateChannel, getTrackById, addTrackToPlaylist } = useUserData();
  const { setQueueAndPlay } = usePlayer();
  const { toast } = useToast();
  
  const [playlist, setPlaylist] = useState<Playlist | undefined | null>(undefined);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
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

    // If playlist exists in user data (local, community, channel), get its tracks
    if (foundPlaylist) {
        if (foundPlaylist.public && foundPlaylist.tracks) {
            fetchedTracks = foundPlaylist.tracks;
            addTracksToCache(fetchedTracks);
        } else if (foundPlaylist.isChannelPlaylist) {
             fetchedTracks = foundPlaylist.tracks || [];
        } else { // Local playlist
            fetchedTracks = foundPlaylist.trackIds.map(tid => getTrackById(tid)).filter(Boolean) as Track[];
        }
    } else { // Not in user library, check our persistent cache for YT playlists
        foundPlaylist = getCachedSinglePlaylist(id);
        if (foundPlaylist) {
            let cachedTracks = getCachedPlaylistTracks(id);
            if (cachedTracks) {
                fetchedTracks = cachedTracks;
            } else {
                 // Playlist metadata was cached but tracks weren't, fetch tracks now
                fetchedTracks = await fetchTracksForPlaylist(id);
                cachePlaylistTracks(id, fetchedTracks); // Save tracks to cache
                addTracksToCache(fetchedTracks);
            }
        } else { // Not in any cache, fetch from YouTube API
            try {
                const ytPlaylistDetails = await getYoutubePlaylistDetails({ playlistId: id });
                if (ytPlaylistDetails) {
                    fetchedTracks = await fetchTracksForPlaylist(id);
                    addTracksToCache(fetchedTracks); // Add tracks to master track cache
                    
                    foundPlaylist = {
                        ...ytPlaylistDetails,
                        trackIds: fetchedTracks.map(t => t.id),
                    };

                    // CRITICAL FIX: Save the fetched playlist and its tracks to their respective persistent caches
                    cacheSinglePlaylist(foundPlaylist);
                    cachePlaylistTracks(id, fetchedTracks);

                }
            } catch (error) {
                console.error("Failed to fetch from YouTube", error);
                foundPlaylist = null;
            }
        }
    }

    if (foundPlaylist) {
      setPlaylist(foundPlaylist);
      setTracks(fetchedTracks);
      setImgSrc(foundPlaylist.coverArt);
    } else {
      setPlaylist(null);
    }
    setIsLoading(false);
  }, [id, getPlaylistById, addTracksToCache, getTrackById]);


  useEffect(() => {
    fetchPlaylistData();
  }, [id, fetchPlaylistData]);

  const handleTrackAdded = (newTrack: Track) => {
    if (!playlist) return;
    addTrackToPlaylist(playlist.id, newTrack); 
    setTracks(currentTracks => {
        if (currentTracks.some(t => t.id === newTrack.id)) {
            return currentTracks;
        }
        if (playlist) {
            const updatedTrackIds = [...playlist.trackIds, newTrack.id];
            const updatedTracks = [...currentTracks, newTrack];
            setPlaylist({...playlist, trackIds: updatedTrackIds, tracks: updatedTracks });
        }
        return [...currentTracks, newTrack];
    });
  };
  
  const handleRemoveTrackFromLocalPlaylist = (trackId: string) => {
    if (!playlist) return;

    const newTracks = tracks.filter(t => t.id !== trackId);
    const newTrackIds = newTracks.map(t => t.id);

    const updatedPlaylist = { ...playlist, tracks: newTracks, trackIds: newTrackIds };
    setPlaylist(updatedPlaylist);
    setTracks(newTracks);

    if (playlist.isChannelPlaylist) {
      const channelId = playlist.id;
      const newChannelData = {
          id: channelId,
          name: playlist.name,
          logo: playlist.coverArt,
          uploads: newTracks,
          playlists: [] 
      };
      updateChannel(newChannelData);
    }

    toast({ title: "Track Removed", description: "The track has been removed from this playlist." });
  };


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
    setIsDeleting(true);
    const result = await deletePlaylist(playlist.id);
    setIsDeleting(false);
    if (result.success) {
        toast({
            title: "Playlist Deleted",
            description: `"${playlist.name}" has been deleted.`,
        });
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

  const canEdit = currentUser && playlist && !playlist.isLikedSongs && !playlist.isChannelPlaylist && (
    (!playlist.public) || (playlist.public && playlist.ownerId === currentUser.id)
  );

  return (
    <div className="space-y-8">
      <div className="relative -mx-6 -mt-6 p-6 pt-16 pb-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
            <Image
            src={imgSrc || FALLBACK_IMAGE_URL}
            alt=""
            fill
            className="object-cover blur-3xl scale-125 opacity-50 dark:opacity-30"
            unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        <header className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <Image
                src={imgSrc || playlist.coverArt}
                alt={playlist.name}
                width={200}
                height={200}
                className="rounded-lg shadow-2xl aspect-square object-cover w-[150px] h-[150px] sm:w-[175px] sm:h-[175px] md:w-[200px] md:h-[200px] flex-shrink-0"
                priority
                data-ai-hint={playlist['data-ai-hint']}
                onError={() => setImgSrc(FALLBACK_IMAGE_URL)}
                unoptimized
            />
            <div className="space-y-3 min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wider">Playlist</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline tracking-tighter line-clamp-3 break-words">
                {playlist.name}
            </h1>
            {playlist.description && <p className="text-muted-foreground text-sm line-clamp-2">{playlist.description}</p>}
            <div className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1.5">
                <span>Created by</span>
                <span className="text-foreground font-medium">{playlist.owner}</span>
                {playlist.ownerIsVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                <span>{" \u2022 "}</span>
                <span>{tracks.length} songs, about {totalMinutes} min</span>
            </div>
            <div className="flex items-center justify-center md:justify-start flex-wrap gap-2 pt-2">
                <Button size="lg" onClick={handlePlayPlaylist}>
                    <Play className="mr-2 h-5 w-5"/>
                    Play
                </Button>
                {canEdit && (
                    <AddSongsDialog playlist={playlist} onTrackAdded={handleTrackAdded}>
                        <Button size="lg" variant="outline">
                            <Plus className="mr-2 h-5 w-5" />
                            Add Songs
                        </Button>
                    </AddSongsDialog>
                )}
                <Button size="lg" variant="outline" onClick={handleShare}>
                    <Share2 className="mr-2 h-5 w-5"/>
                    Share
                </Button>
                {canEdit && (
                    <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button size="lg" variant="outline" disabled={isDeleting}>
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
                        <AlertDialogAction onClick={handleDeletePlaylist} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            </div>
        </header>
       </div>
      <section>
        <TrackList 
          tracks={tracks} 
          playlist={playlist} 
          onRemoveTrack={playlist.isChannelPlaylist ? handleRemoveTrackFromLocalPlaylist : undefined}
        />
      </section>
    </div>
  );
}

    
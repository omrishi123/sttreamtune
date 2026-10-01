"use client";

import Image from "next/image";
import { getTracksForPlaylist as fetchTracksForPlaylist, getYoutubePlaylistDetails } from "@/ai/flows/get-youtube-playlists-flow";
import { notFound, useParams, useRouter } from "next/navigation";
import { TrackList } from "@/components/track-list";
import { Button } from "@/components/ui/button";
import { Play, Share2, MoreHorizontal, Trash2, Plus } from "lucide-react";
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
import { getCachedPlaylistTracks, cachePlaylistTracks, getCachedSinglePlaylist, cacheSinglePlaylist } from "@/lib/recommendations";
import { AddSongsDialog } from "@/components/add-songs-dialog";
import { Icons } from "@/components/icons";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_PLAYLIST_COVER } from "@/lib/constants";
import { motion } from "framer-motion";

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

    if (!foundPlaylist) {
        try {
            const playlistRef = doc(db, 'communityPlaylists', id);
            const docSnap = await getDoc(playlistRef);
            if (docSnap.exists()) {
                foundPlaylist = { ...docSnap.data(), id: docSnap.id } as Playlist;
                fetchedTracks = foundPlaylist.tracks || [];
                addTracksToCache(fetchedTracks);
            }
        } catch (error) {
            console.error("Error fetching playlist directly from Firestore:", error);
        }
    }

    if (foundPlaylist) {
        if (foundPlaylist.public && foundPlaylist.tracks) {
            fetchedTracks = foundPlaylist.tracks;
            addTracksToCache(fetchedTracks);
        } else if (foundPlaylist.isChannelPlaylist) {
             fetchedTracks = foundPlaylist.tracks || [];
        } else {
            fetchedTracks = foundPlaylist.trackIds.map(tid => getTrackById(tid)).filter(Boolean) as Track[];
        }
    } else {
        foundPlaylist = getCachedSinglePlaylist(id);
        if (foundPlaylist) {
            let cachedTracks = getCachedPlaylistTracks(id);
            if (cachedTracks) {
                fetchedTracks = cachedTracks;
            } else {
                fetchedTracks = await fetchTracksForPlaylist(id);
                cachePlaylistTracks(id, fetchedTracks);
                addTracksToCache(fetchedTracks);
            }
        } else {
            try {
                const ytPlaylistDetails = await getYoutubePlaylistDetails({ playlistId: id });
                if (ytPlaylistDetails) {
                    fetchedTracks = await fetchTracksForPlaylist(id);
                    addTracksToCache(fetchedTracks);
                    foundPlaylist = {
                        ...ytPlaylistDetails,
                        trackIds: fetchedTracks.map(t => t.id),
                    };
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
    setTracks(currentTracks => {
        if (currentTracks.some(t => t.id === newTrack.id)) {
            return currentTracks;
        }
        return [...currentTracks, newTrack];
    });
    addTrackToPlaylist(playlist.id, newTrack); 
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
      const newChannelData = { id: channelId, name: playlist.name, logo: playlist.coverArt, uploads: newTracks, playlists: [] };
      updateChannel(newChannelData);
    }
    toast({ title: "Track Removed", description: "The track has been removed from this playlist." });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 pt-20">
        <header className="flex flex-col sm:flex-row items-center gap-6">
          <Skeleton className="w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] rounded-lg shadow-lg flex-shrink-0" />
          <div className="space-y-3 text-center sm:text-left w-full">
            <Skeleton className="h-4 w-24 mx-auto sm:mx-0" />
            <Skeleton className="h-10 w-60 mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-full max-w-sm mx-auto sm:mx-0" />
            <Skeleton className="h-12 w-32 mt-4 mx-auto sm:mx-0" />
          </div>
        </header>
        <div className="space-y-2">
            {Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
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
    if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link Copied!", description: "Playlist link copied to clipboard." });
    }
  }

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    setIsDeleting(true);
    const result = await deletePlaylist(playlist.id);
    setIsDeleting(false);
    if (result.success) {
        toast({ title: "Playlist Deleted", description: `"${playlist.name}" has been deleted.` });
        router.push('/library');
        router.refresh(); 
    } else {
        toast({ variant: "destructive", title: "Deletion Failed", description: result.message });
    }
  };

  const canEdit = currentUser && playlist && !playlist.isLikedSongs && !playlist.isChannelPlaylist && (
    (!playlist.public) || (playlist.public && playlist.ownerId === currentUser.id)
  );

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Cinematic Header with Fluid Adjustments */}
      <div className="relative -mx-6 -mt-6 p-6 pt-16 pb-8 overflow-hidden min-h-[300px] flex items-end">
        <div className="absolute inset-0 z-0">
            <Image
                src={imgSrc || DEFAULT_PLAYLIST_COVER}
                alt=""
                fill
                className="object-cover blur-[100px] scale-125 opacity-50 transition-opacity duration-1000"
                unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
            <div className="absolute inset-0 bg-black/5" />
        </div>
        
        <header className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left w-full max-w-full">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative group flex-shrink-0"
            >
                <Image
                    src={imgSrc || playlist.coverArt}
                    alt={playlist.name}
                    width={220}
                    height={220}
                    className="rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.4)] aspect-square object-cover w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] md:w-[220px] md:h-[220px]"
                    priority
                    data-ai-hint={playlist['data-ai-hint']}
                    onError={() => setImgSrc(DEFAULT_PLAYLIST_COVER)}
                    unoptimized
                />
            </motion.div>
            
            <div className="space-y-3 flex-1 min-w-0 max-w-full overflow-hidden">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Playlist</p>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tighter text-white drop-shadow-sm line-clamp-2 text-balance leading-tight">
                        {playlist.name}
                    </h1>
                </div>
                
                {playlist.description && (
                  <p className="text-white/70 text-sm md:text-base max-w-3xl line-clamp-2 md:line-clamp-3 leading-snug text-balance">
                    {playlist.description}
                  </p>
                )}
                
                <div className="text-xs md:text-sm text-white/80 flex items-center justify-center md:justify-start gap-2 flex-wrap font-medium">
                    <span className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-md">
                        {playlist.owner}
                        {playlist.ownerIsVerified && <Icons.verified className="h-4 w-4" />}
                    </span>
                    <span className="opacity-40">•</span>
                    <span>{tracks.length} tracks</span>
                    <span className="opacity-40">•</span>
                    <span>{totalMinutes} min</span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start flex-wrap gap-2 pt-1">
                    <Button size="lg" className="rounded-full h-12 px-6 text-base font-bold shadow-lg hover:scale-105 transition-transform" onClick={handlePlayPlaylist}>
                        <Play className="mr-2 h-5 w-5 fill-current"/>
                        Play
                    </Button>
                    {canEdit && (
                        <AddSongsDialog playlist={playlist} onTrackAdded={handleTrackAdded}>
                            <Button size="lg" variant="outline" className="rounded-full h-12 glass-panel hover:bg-white/10 px-6 text-sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Songs
                            </Button>
                        </AddSongsDialog>
                    )}
                    <Button size="icon" variant="outline" className="rounded-full h-12 w-12 glass-panel hover:bg-white/10" onClick={handleShare}>
                        <Share2 className="h-4 w-4"/>
                    </Button>
                    {canEdit && (
                        <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="outline" className="rounded-full h-12 w-12 glass-panel hover:bg-white/10" disabled={isDeleting}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="glass-panel">
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Playlist</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent className="glass-panel">
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete "{playlist.name}".
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex justify-end gap-3 mt-4">
                              <AlertDialogAction onClick={handleDeletePlaylist} className="bg-destructive hover:bg-destructive/90 rounded-full" disabled={isDeleting}>
                                  {isDeleting ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                            </div>
                        </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
        </header>
       </div>
      <section className="px-6 pb-12">
        <TrackList 
          tracks={tracks} 
          playlist={playlist} 
          onRemoveTrack={playlist.isChannelPlaylist ? handleRemoveTrackFromLocalPlaylist : undefined}
        />
      </section>
    </div>
  );
}


"use client";

import { Play, Music, Heart, PlusCircle, Trash2, MoreHorizontal } from "lucide-react";
import { usePlayer } from "@/context/player-context";
import { useUserData } from "@/context/user-data-context";
import type { Track, Playlist } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";
import { AddToPlaylistMenu } from "./add-to-playlist-menu";
import React from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface TrackListProps {
  tracks: Track[];
  playlist?: Playlist;
}

export function TrackList({ tracks, playlist }: TrackListProps) {
  const { setQueueAndPlay, currentTrack, isPlaying, play, pause } = usePlayer();
  const { isLiked, toggleLike, addTrackToCache, removeTrackFromPlaylist } = useUserData();

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else if (currentTrack?.id === track.id && !isPlaying) {
      play();
    }
    else {
      setQueueAndPlay(tracks, track.id, playlist);
    }
  };

  const handleToggleLike = (track: Track) => {
    addTrackToCache(track);
    toggleLike(track.id);
  }

  const handleRemoveTrack = (trackId: string) => {
    if (playlist) {
      removeTrackFromPlaylist(playlist.id, trackId);
    }
  };

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const canEditPlaylist = playlist && (
    playlist.id.startsWith('playlist-') || 
    playlist.id.startsWith('pl-ai-') || 
    playlist.id.startsWith('pl-yt-')
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">#</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="hidden md:table-cell">Album</TableHead>
          <TableHead className="hidden sm:table-cell">Duration</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tracks.map((track, index) => {
          if (!track) return null;
          const isActive = currentTrack?.id === track.id;
          const isTrackLiked = isLiked(track.id);

          return (
            <TableRow
              key={`${track.id}-${index}`}
              className="group"
              onDoubleClick={() => handlePlayTrack(track)}
              data-state={isActive ? "selected" : undefined}
            >
              <TableCell className="text-center text-muted-foreground">
                <div 
                  className="relative h-5 flex items-center justify-center cursor-pointer"
                  onClick={() => handlePlayTrack(track)}
                >
                  <span className="group-hover:hidden">{isActive && isPlaying ? <Music className="h-4 w-4 text-primary animate-pulse" /> : index + 1}</span>
                   <Button variant="ghost" size="icon" className="absolute inset-0 h-full w-full hidden group-hover:flex items-center justify-center">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="max-w-[150px] sm:max-w-xs">
                <div className="font-medium break-words">{track.title}</div>
                <div className="text-sm text-muted-foreground break-words">
                  {track.artist}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell break-words">
                {track.album}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {formatDuration(track.duration)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                   <Button variant="ghost" size="icon" className={cn("opacity-0 group-hover:opacity-100", isTrackLiked && "opacity-100")} onClick={() => handleToggleLike(track)}>
                      <Heart className={cn("h-4 w-4", isTrackLiked && "fill-primary text-primary")} />
                   </Button>
                   <span className="text-muted-foreground w-8 mx-1 sm:hidden">{formatDuration(track.duration)}</span>
                   
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
                           <MoreHorizontal className="h-4 w-4" />
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AddToPlaylistMenu track={track}>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <PlusCircle className="mr-2 h-4 w-4" />
                              <span>Add to playlist</span>
                           </DropdownMenuItem>
                        </AddToPlaylistMenu>
                        {canEditPlaylist && (
                          <>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <DropdownMenuItem
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Remove from playlist</span>
                                  </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     This will permanently remove "{track.title}" from this playlist.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleRemoveTrack(track.id)} className="bg-destructive hover:bg-destructive/90">
                                     Remove
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </DropdownMenuContent>
                   </DropdownMenu>

                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
"use client";

import { Play, Music, Heart, PlusCircle, Trash2, MoreHorizontal } from "lucide-react";
import { usePlayer } from "@/context/player-context";
import { useUserData } from "@/context/user-data-context";
import type { Track, Playlist, User } from "@/lib/types";
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
import { onAuthChange } from "@/lib/auth";


interface TrackListProps {
  tracks: Track[];
  playlist?: Playlist;
  onRemoveTrack?: (trackId: string) => void;
  onTrackRendered?: (node: HTMLTableRowElement) => void;
}

export function TrackList({ tracks, playlist, onRemoveTrack, onTrackRendered }: TrackListProps) {
  const { setQueueAndPlay, currentTrack, isPlaying, play, pause } = usePlayer();
  const { isLiked, toggleLike, removeTrackFromPlaylist } = useUserData();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthChange(setCurrentUser);
    return () => unsubscribe();
  }, []);

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

  const handleRemoveTrack = (trackId: string) => {
    if (onRemoveTrack) {
      onRemoveTrack(trackId);
    } else if (playlist) {
      removeTrackFromPlaylist(playlist.id, trackId);
    }
  };

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '-:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const canEditPlaylist = currentUser && playlist && (
    playlist.isChannelPlaylist ||
    (playlist.public ? playlist.ownerId === currentUser.id : true)
  );

  return (
    <Table className="border-separate border-spacing-y-1">
      <TableHeader>
        <TableRow className="border-none hover:bg-transparent">
          <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/60">#</TableHead>
          <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Title</TableHead>
          <TableHead className="hidden md:table-cell text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Album</TableHead>
          <TableHead className="hidden sm:table-cell text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Duration</TableHead>
          <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-muted-foreground/60 pr-4">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tracks.map((track, index) => {
          if (!track) return null;
          const isActive = currentTrack?.id === track.id;
          const isTrackLiked = isLiked(track.id);
          const isLastElement = index === tracks.length - 1;

          return (
            <TableRow
              key={`${track.id}-${index}`}
              ref={isLastElement ? onTrackRendered : null}
              className={cn(
                "group border-none transition-all duration-200 ease-out",
                isActive ? "bg-white/10" : "hover:bg-white/5"
              )}
              onDoubleClick={() => handlePlayTrack(track)}
            >
              <TableCell className="text-center rounded-l-xl">
                <div 
                  className="relative h-5 flex items-center justify-center cursor-pointer"
                  onClick={() => handlePlayTrack(track)}
                >
                  <span className={cn("group-hover:hidden font-medium tabular-nums", isActive ? "text-primary" : "text-muted-foreground/60")}>
                    {isActive && isPlaying ? <Music className="h-4 w-4 text-primary animate-pulse" /> : index + 1}
                  </span>
                   <Button variant="ghost" size="icon" className="absolute inset-0 h-full w-full hidden group-hover:flex items-center justify-center hover:bg-transparent">
                    <Play className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] sm:max-w-xs break-words">
                <div className={cn("font-semibold line-clamp-1", isActive ? "text-primary" : "text-foreground")}>{track.title}</div>
                <div className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer">
                  {track.artist}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground font-medium italic opacity-70">
                {track.album}
              </TableCell>
              <TableCell className="hidden sm:table-cell tabular-nums font-medium text-muted-foreground/60">
                {formatDuration(track.duration)}
              </TableCell>
              <TableCell className="text-right rounded-r-xl pr-4">
                <div className="flex items-center justify-end gap-2">
                   <Button variant="ghost" size="icon" className={cn("opacity-0 group-hover:opacity-100 transition-all active:scale-90", isTrackLiked && "opacity-100 text-primary")} onClick={() => toggleLike(track)}>
                      <Heart className={cn("h-4 w-4", isTrackLiked && "fill-current")} />
                   </Button>
                   
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8 hover:bg-white/10 rounded-full transition-all">
                           <MoreHorizontal className="h-4 w-4" />
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-panel">
                        <AddToPlaylistMenu track={track}>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <PlusCircle className="mr-2 h-4 w-4" />
                              <span>Add to Playlist</span>
                           </DropdownMenuItem>
                        </AddToPlaylistMenu>
                        {canEditPlaylist && (
                          <>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <DropdownMenuItem
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Remove from Playlist</span>
                                  </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="glass-panel">
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Remove Track?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Remove "{track.title}" from this collection?
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleRemoveTrack(track.id)} className="bg-destructive hover:bg-destructive/90 rounded-full">
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
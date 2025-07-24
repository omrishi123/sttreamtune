"use client";

import { Play, Music, Heart, PlusCircle } from "lucide-react";
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


interface TrackListProps {
  tracks: Track[];
  playlist?: Playlist;
}

export function TrackList({ tracks, playlist }: TrackListProps) {
  const { setQueueAndPlay, currentTrack, isPlaying, play, pause } = usePlayer();
  const { isLiked, toggleLike } = useUserData();

  const handlePlayTrack = (trackId: string) => {
    if (currentTrack?.id === trackId && isPlaying) {
      pause();
    } else if (currentTrack?.id === trackId && !isPlaying) {
      play();
    }
    else {
      setQueueAndPlay(tracks, trackId, playlist);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">#</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="hidden md:table-cell">Album</TableHead>
          <TableHead className="hidden sm:table-cell">Date Added</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tracks.map((track, index) => {
          const isActive = currentTrack?.id === track.id;
          const isTrackLiked = isLiked(track.id);

          return (
            <TableRow
              key={`${track.id}-${index}`}
              className="group"
              onDoubleClick={() => handlePlayTrack(track.id)}
              data-state={isActive ? "selected" : undefined}
            >
              <TableCell className="text-center text-muted-foreground">
                <div 
                  className="relative h-5 flex items-center justify-center cursor-pointer"
                  onClick={() => handlePlayTrack(track.id)}
                >
                  <span className="group-hover:hidden">{isActive && isPlaying ? <Music className="h-4 w-4 text-primary animate-pulse" /> : index + 1}</span>
                   <Button variant="ghost" size="icon" className="absolute inset-0 h-full w-full hidden group-hover:flex items-center justify-center">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{track.title}</div>
                <div className="text-sm text-muted-foreground">
                  {track.artist}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {track.album}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                5 days ago
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                   <Button variant="ghost" size="icon" className={cn("opacity-0 group-hover:opacity-100", isTrackLiked && "opacity-100")} onClick={() => toggleLike(track.id)}>
                      <Heart className={cn("h-4 w-4", isTrackLiked && "fill-primary text-primary")} />
                   </Button>
                   <span className="text-muted-foreground w-8">{formatDuration(track.duration)}</span>
                   <AddToPlaylistMenu trackId={track.id}>
                     <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <PlusCircle className="h-4 w-4" />
                     </Button>
                   </AddToPlaylistMenu>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

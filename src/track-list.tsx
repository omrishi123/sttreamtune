"use client";

import { Play, Music } from "lucide-react";
import { usePlayer } from "@/context/player-context";
import type { Track, Playlist } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";

interface TrackListProps {
  tracks: Track[];
  playlist: Playlist;
}

export function TrackList({ tracks, playlist }: TrackListProps) {
  const { setQueueAndPlay, currentTrack, isPlaying, play, pause } = usePlayer();

  const handlePlayTrack = (trackId: string) => {
    if (currentTrack?.id === trackId && isPlaying) {
      pause();
    } else if (currentTrack?.id === trackId && !isPlaying) {
      play();
    }
    else {
      setQueueAndPlay(tracks, trackId);
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
          <TableHead className="text-right">Duration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tracks.map((track, index) => {
          const isActive = currentTrack?.id === track.id;
          return (
            <TableRow
              key={track.id}
              className="group cursor-pointer"
              onClick={() => handlePlayTrack(track.id)}
              data-state={isActive ? "selected" : undefined}
            >
              <TableCell className="text-center text-muted-foreground">
                <div className="relative h-5 flex items-center justify-center">
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
              <TableCell className="text-right text-muted-foreground">
                {formatDuration(track.duration)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

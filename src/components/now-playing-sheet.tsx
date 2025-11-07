
'use client';

import React from 'react';
import Image from 'next/image';
import YouTube from 'react-youtube';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { usePlayer } from '@/context/player-context';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Heart, SkipBack, Play, Pause, SkipForward, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserData } from '@/context/user-data-context';
import { AddToPlaylistMenu } from './add-to-playlist-menu';

interface NowPlayingSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NowPlayingSheet({ isOpen, onOpenChange }: NowPlayingSheetProps) {
  const {
    currentTrack,
    isPlaying,
    play,
    pause,
    playNext,
    playPrev,
    progress,
    handleSeek,
    currentTime,
    duration,
    videoPlayerRef
  } = usePlayer();
  const { isLiked, toggleLike } = useUserData();

  if (!currentTrack) {
    return null;
  }
  
  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const isCurrentTrackLiked = isLiked(currentTrack.id);
  
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-full max-h-[100svh] w-full bg-gradient-to-b from-slate-900 to-black p-4 flex flex-col text-white"
      >
        <SheetHeader className="text-left">
           {/* This title is visually hidden but available for screen readers */}
          <SheetTitle className="sr-only">Now Playing: {currentTrack.title}</SheetTitle>
          <SheetDescription className="sr-only">
             {currentTrack.artist}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden shadow-2xl">
                 <YouTube
                    ref={videoPlayerRef}
                    videoId={currentTrack.youtubeVideoId}
                    opts={{
                      height: '100%',
                      width: '100%',
                      playerVars: {
                        autoplay: 1,
                        controls: 0,
                        rel: 0,
                        showinfo: 0,
                      },
                    }}
                    className="absolute inset-0 w-full h-full"
                />
            </div>

            <div className="w-full max-w-md text-center">
                <h2 className="text-2xl font-bold truncate">{currentTrack.title}</h2>
                <p className="text-muted-foreground">{currentTrack.artist}</p>
            </div>
        </div>

        <div className="w-full max-w-md mx-auto space-y-4 pb-4">
             {/* Progress Bar */}
             <div className="space-y-1">
                <Slider
                    value={[progress]}
                    onValueChange={handleSeek}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Main Controls */}
             <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" size="icon" onClick={playPrev} className="w-12 h-12 text-white hover:text-white/80">
                    <SkipBack className="h-8 w-8" />
                </Button>
                <Button
                    size="icon"
                    className="bg-white hover:bg-white/90 rounded-full h-16 w-16"
                    onClick={handlePlayPause}
                    >
                    {isPlaying ? <Pause className="h-8 w-8 text-black" /> : <Play className="h-8 w-8 text-black" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={playNext} className="w-12 h-12 text-white hover:text-white/80">
                    <SkipForward className="h-8 w-8" />
                </Button>
            </div>

             {/* Secondary Controls */}
             <div className="flex items-center justify-between">
                 <Button variant="ghost" size="icon" onClick={() => toggleLike(currentTrack)} className="text-white hover:text-white/80">
                    <Heart className={cn("h-5 w-5", isCurrentTrackLiked && "fill-primary text-primary")} />
                </Button>
                <AddToPlaylistMenu track={currentTrack}>
                     <Button variant="ghost" size="icon" className="text-white hover:text-white/80">
                        <PlusCircle className="h-5 w-5" />
                    </Button>
                </AddToPlaylistMenu>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

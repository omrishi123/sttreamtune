
"use client";

import React from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Timer,
  Youtube,
} from "lucide-react";
import { usePlayer } from "@/context/player-context";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QueueSheet } from "./queue-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserData } from "@/context/user-data-context";
import { cn } from "@/lib/utils";
import { AddToPlaylistMenu } from "./add-to-playlist-menu";
import { useToast } from "@/hooks/use-toast";
import { NowPlayingSheet } from "./now-playing-sheet";

export function Player() {
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
    setSleepTimer,
    isNowPlayingOpen,
    setIsNowPlayingOpen,
  } = usePlayer();
  const { isLiked, toggleLike, addTrackToCache } = useUserData();
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(50);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  if (!currentTrack) {
    return null; 
  }

  const handleToggleLike = () => {
    addTrackToCache(currentTrack);
    toggleLike(currentTrack.id);
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleSetSleepTimer = (durationMillis: number, label: string) => {
    setSleepTimer(durationMillis);
    toast({
      title: label === 'Off' ? "Sleep Timer Off" : "Sleep Timer Set",
      description: label !== 'Off' ? `Playback will stop in ${label}.` : `The sleep timer has been turned off.`,
    });
  };
  
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  const isCurrentTrackLiked = isLiked(currentTrack.id);

  if (isMobile) {
    return (
       <footer className="fixed bottom-16 left-0 right-0 bg-card border-t border-border px-4 py-3 flex flex-col gap-2 text-card-foreground shadow-md z-40">
        
        {/* Top Row: Song Info & Like/Queue */}
        <div className="flex items-center w-full">
          <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
            <Image
              src={currentTrack.artwork}
              alt={currentTrack.title}
              width={40}
              height={40}
              className="rounded-md"
              data-ai-hint={currentTrack['data-ai-hint']}
              unoptimized
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
          </div>
          <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={handleToggleLike}>
                <Heart className={cn("h-5 w-5", isCurrentTrackLiked && "fill-primary text-primary")} />
              </Button>
              <AddToPlaylistMenu track={currentTrack} />
          </div>
        </div>

        {/* Middle Row: Main Player Controls */}
         <div className="flex items-center justify-around w-full">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mb-2" side="top" align="center">
                <DropdownMenuLabel>Sleep Timer</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSetSleepTimer(15 * 60 * 1000, "15 minutes")}>15 minutes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetSleepTimer(30 * 60 * 1000, "30 minutes")}>30 minutes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetSleepTimer(60 * 60 * 1000, "1 hour")}>1 hour</DropdownMenuItem>
                 <DropdownMenuItem onClick={() => {
                  const remainingTime = (duration - currentTime) * 1000;
                  handleSetSleepTimer(remainingTime, "end of song");
                }}>
                  End of song
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSetSleepTimer(0, "Off")} className="text-destructive">
                  Turn off timer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={playPrev} className="w-8 h-8">
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="bg-primary hover:bg-primary/90 rounded-full h-10 w-10"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-6 w-6 text-primary-foreground" /> : <Play className="h-6 w-6 text-primary-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={playNext} className="w-8 h-8">
              <SkipForward className="h-5 w-5" />
            </Button>
             <div className="flex items-center">
                <QueueSheet />
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setIsNowPlayingOpen(true)}>
                    <Youtube className="h-5 w-5" />
                </Button>
             </div>
        </div>

        {/* Bottom Row: Progress Bar */}
         <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-muted-foreground w-10 text-center">{formatTime(currentTime)}</span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground w-10 text-center">{formatTime(duration)}</span>
        </div>
        <NowPlayingSheet isOpen={isNowPlayingOpen} onOpenChange={setIsNowPlayingOpen} />
      </footer>
    )
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 text-card-foreground shadow-md z-50">
      <div className="grid grid-cols-[minmax(0,1fr)_2fr_minmax(0,1fr)] items-center w-full">
        {/* Left Section: Song Info */}
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <Image
            src={currentTrack.artwork}
            alt={currentTrack.title}
            width={56}
            height={56}
            className="rounded-md"
            data-ai-hint={currentTrack['data-ai-hint']}
            unoptimized
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
           <Button variant="ghost" size="icon" className="ml-2" onClick={handleToggleLike}>
              <Heart className={cn("h-5 w-5", isCurrentTrackLiked && "fill-primary text-primary")} />
            </Button>
            <AddToPlaylistMenu track={currentTrack} />
        </div>

        {/* Center Section: Player Controls */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Shuffle className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={playPrev}>
              <SkipBack className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              className="bg-primary hover:bg-primary/90 rounded-full h-10 w-10"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-6 w-6 text-primary-foreground" /> : <Play className="h-6 w-6 text-primary-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={playNext}>
              <SkipForward className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Repeat className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-xl">
            <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Section: Volume and Queue */}
        <div className="flex items-center justify-end gap-2">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Timer className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mb-2" side="top" align="end">
                <DropdownMenuLabel>Sleep Timer</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSetSleepTimer(15 * 60 * 1000, "15 minutes")}>15 minutes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetSleepTimer(30 * 60 * 1000, "30 minutes")}>30 minutes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetSleepTimer(60 * 60 * 1000, "1 hour")}>1 hour</DropdownMenuItem>
                 <DropdownMenuItem onClick={() => {
                  const remainingTime = (duration - currentTime) * 1000;
                  handleSetSleepTimer(remainingTime > 0 ? remainingTime : 0, "end of song");
                }}>
                  End of song
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSetSleepTimer(0, "Off")} className="text-destructive">
                  Turn off timer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-28 p-2 mb-2">
              <Slider 
                defaultValue={[volume]} 
                max={100} 
                step={1} 
                onValueChange={(value) => setVolume(value[0])}
              />
            </PopoverContent>
          </Popover>
          <div className="w-10">
              <google-cast-launcher />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsNowPlayingOpen(true)}>
              <Youtube className="h-5 w-5" />
          </Button>
          <QueueSheet />
        </div>
      </div>
      <NowPlayingSheet isOpen={isNowPlayingOpen} onOpenChange={setIsNowPlayingOpen} />
    </footer>
  );
}

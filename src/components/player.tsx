"use client";

import React from "react";
import Image from "next/image";
import YouTube from "react-youtube";
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
  ListMusic,
} from "lucide-react";
import { usePlayer } from "@/context/player-context";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { QueueSheet } from "./queue-sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export function Player() {
  const { 
    currentTrack, 
    isPlaying, 
    play, 
    pause, 
    playNext, 
    playPrev,
    progress,
    handleSeek
  } = usePlayer();
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(50);
  const isMobile = useIsMobile();

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
  
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  const currentPosition = currentTrack ? (progress / 100) * currentTrack.duration : 0;

  if (isMobile) {
    return (
      <footer className="bg-card border-t border-border px-4 py-2 text-card-foreground shadow-md z-50">
        <div className="w-full">
           <Slider
              value={[progress]}
              onValueChange={handleSeek}
              className="w-full h-1 [&>span:last-child]:hidden [&>div:first-child>span]:h-1"
            />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <Image
                src={currentTrack.artwork}
                alt={currentTrack.title}
                width={40}
                height={40}
                className="rounded-md"
                data-ai-hint={currentTrack['data-ai-hint']}
              />
              <div className="truncate">
                <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
              </div>
            </div>

            <div className="flex items-center">
               <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
               <QueueSheet />
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-card border-t border-border px-4 py-2 text-card-foreground shadow-md z-50">
      <div className="flex items-center justify-between w-full">
        <div className="w-1/4 flex items-center gap-3">
          <Image
            src={currentTrack.artwork}
            alt={currentTrack.title}
            width={56}
            height={56}
            className="rounded-md"
            data-ai-hint={currentTrack['data-ai-hint']}
          />
          <div>
            <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
           <Button variant="ghost" size="icon" className="ml-2">
              <Heart className="h-5 w-5" />
            </Button>
        </div>

        <div className="w-1/2 flex flex-col items-center justify-center gap-2">
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
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-muted-foreground">{formatTime(currentPosition)}</span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        <div className="w-1/4 flex items-center justify-end gap-2">
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
          <QueueSheet />
        </div>
      </div>
    </footer>
  );
}

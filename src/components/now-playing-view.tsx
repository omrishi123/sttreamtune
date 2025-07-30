
"use client";

import React from "react";
import Image from "next/image";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, X, ListMusic, GripVertical
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from "@hello-pangea/dnd";
import { usePlayer } from "@/context/player-context";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useUserData } from "@/context/user-data-context";
import { cn } from "@/lib/utils";
import { AddToPlaylistMenu } from "./add-to-playlist-menu";
import { ScrollArea } from "./ui/scroll-area";
import { SheetClose } from "./ui/sheet";

export function NowPlayingView() {
  const { 
    currentTrack,
    currentPlaylist,
    isPlaying, 
    play, 
    pause, 
    playNext, 
    playPrev,
    progress,
    handleSeek,
    currentTime,
    duration,
    queue,
    removeTrackFromQueue,
    reorderQueue,
    setQueueAndPlay
  } = usePlayer();
  const { isLiked, toggleLike, addTrackToCache } = useUserData();

  if (!currentTrack) {
    return null; 
  }

  const handleToggleLike = () => {
    addTrackToCache(currentTrack);
    toggleLike(currentTrack.id);
  }

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else play();
  };
  
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  const isCurrentTrackLiked = isLiked(currentTrack.id);

  const tracksInQueue = queue.filter(track => track.id !== currentTrack.id);

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) {
      return;
    }
    // Adjust indices since the queue here doesn't include the current track
    const currentTrackIndex = queue.findIndex(t => t.id === currentTrack.id);
    const sourceIndex = result.source.index >= currentTrackIndex ? result.source.index + 1 : result.source.index;
    const destinationIndex = result.destination.index >= currentTrackIndex ? result.destination.index + 1 : result.destination.index;
    
    reorderQueue(sourceIndex, destinationIndex);
  };

  const handlePlayFromQueue = (trackId: string) => {
     setQueueAndPlay(queue, trackId, currentPlaylist || undefined);
  }

  return (
    <div className="h-full w-full bg-background text-foreground flex flex-col">
       <header className="flex items-center justify-between p-4 flex-shrink-0">
          <SheetClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-6 w-6" />
            </Button>
          </SheetClose>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Playing from</p>
            <p className="font-semibold">{currentPlaylist?.name || "Queue"}</p>
          </div>
          <AddToPlaylistMenu track={currentTrack}>
             <Button variant="ghost" size="icon">
                <ListMusic className="h-6 w-6" />
             </Button>
          </AddToPlaylistMenu>
       </header>

       <main className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
          <Image
              src={currentTrack.artwork}
              alt={currentTrack.title}
              width={500}
              height={500}
              className="rounded-lg shadow-2xl aspect-square object-cover w-full max-w-[300px] sm:max-w-xs"
              data-ai-hint={currentTrack['data-ai-hint']}
            />
          <div className="w-full text-center">
             <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold truncate">{currentTrack.title}</h2>
                  <p className="text-muted-foreground truncate">{currentTrack.artist}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleToggleLike} className="w-10 h-10">
                    <Heart className={cn("h-6 w-6", isCurrentTrackLiked && "fill-primary text-primary")} />
                </Button>
             </div>
             <div className="mt-4">
                <Slider
                    value={[progress]}
                    onValueChange={handleSeek}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
             </div>
             <div className="flex items-center justify-center gap-2 mt-4">
                 <Button variant="ghost" size="icon" className="w-12 h-12">
                    <Shuffle className="h-6 w-6 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={playPrev} className="w-12 h-12">
                    <SkipBack className="h-8 w-8" />
                </Button>
                <Button
                    size="icon"
                    className="bg-primary hover:bg-primary/90 rounded-full h-16 w-16"
                    onClick={handlePlayPause}
                >
                    {isPlaying ? <Pause className="h-8 w-8 text-primary-foreground" /> : <Play className="h-8 w-8 text-primary-foreground pl-1" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={playNext} className="w-12 h-12">
                    <SkipForward className="h-8 w-8" />
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12">
                    <Repeat className="h-6 w-6 text-muted-foreground" />
                </Button>
             </div>
          </div>
       </main>

      <div className="flex-shrink-0">
          <h3 className="text-lg font-semibold px-4 pt-4">Up Next</h3>
          <ScrollArea className="h-[200px] px-2">
             <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="queue">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {tracksInQueue.map((track, index) => (
                       <Draggable key={track.id} draggableId={track.id} index={index}>
                         {(provided, snapshot) => (
                           <div
                             ref={provided.innerRef}
                             {...provided.draggableProps}
                             className={cn(
                               "flex items-center gap-3 p-2 group rounded-md",
                               snapshot.isDragging && "bg-muted"
                             )}
                           >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <Image
                                src={track.artwork}
                                alt={track.title}
                                width={40}
                                height={40}
                                className="rounded-md"
                                onClick={() => handlePlayFromQueue(track.id)}
                              />
                              <div className="flex-1 min-w-0" onClick={() => handlePlayFromQueue(track.id)}>
                                <p className="font-semibold text-sm truncate">{track.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                              </div>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => removeTrackFromQueue(track.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                           </div>
                         )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
             {tracksInQueue.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">The queue is empty.</p>
              )}
          </ScrollArea>
      </div>
    </div>
  );
}

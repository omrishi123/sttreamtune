
"use client";

import Image from "next/image";
import { ListMusic, Trash2, GripVertical } from "lucide-react";
import { usePlayer } from "@/context/player-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import React, { useState, useEffect } from 'react';
import type { Track } from "@/lib/types";
import { Badge } from "./ui/badge";

export function QueueSheet() {
  const { queue, currentTrack, removeTrackFromQueue, clearQueue, reorderQueue } = usePlayer();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // The list that is draggable is the main queue minus the "Now Playing" track
    const draggableTracks = queue.filter(track => track.id !== currentTrack?.id);
    const sourceIndexInDraggableList = result.source.index;
    const destinationIndexInDraggableList = result.destination.index;
    
    const [reorderedItem] = draggableTracks.splice(sourceIndexInDraggableList, 1);
    draggableTracks.splice(destinationIndexInDraggableList, 0, reorderedItem);

    // Reconstruct the full queue with the "Now Playing" track at the top
    const newFullQueue = currentTrack ? [currentTrack, ...draggableTracks] : draggableTracks;
    
    // Find the original index of the item that was moved
    const originalSourceIndex = queue.findIndex(t => t.id === result.draggableId);
    // Find the new index of that same item in our reconstructed queue
    const newDestinationIndex = newFullQueue.findIndex(t => t.id === result.draggableId);

    // Call the reorder function with the correct indices relative to the original full queue
    if (originalSourceIndex !== -1 && newDestinationIndex !== -1) {
        reorderQueue(originalSourceIndex, newDestinationIndex);
    }
  };

  const getDraggableTracks = React.useMemo(() => 
    queue.filter(track => track.id !== currentTrack?.id),
    [queue, currentTrack]
  );
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <ListMusic className="h-5 w-5" />
          <span className="sr-only">Open queue</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between pr-6">
            <SheetTitle>Up Next</SheetTitle>
            {getDraggableTracks.length > 0 && (
              <Badge variant="secondary">{getDraggableTracks.length}</Badge>
            )}
          </div>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">
            {currentTrack && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-primary">Now Playing</h3>
                <div className="flex items-center gap-3 p-2 bg-primary/10 rounded-md">
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
                    <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Separator className="my-4"/>
            
            {isClient ? (
              <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="queue">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {getDraggableTracks.length > 0 ? (
                        getDraggableTracks.map((track: Track, index: number) => (
                          <Draggable key={`${track.id}-${index}`} draggableId={track.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-3 p-2 group rounded-md mb-2 transition-shadow ${snapshot.isDragging ? 'shadow-lg bg-accent' : ''}`}
                              >
                                 <div {...provided.dragHandleProps} className="text-muted-foreground cursor-grab active:cursor-grabbing">
                                  <GripVertical className="h-5 w-5" />
                                </div>
                                <Image
                                  src={track.artwork}
                                  alt={track.title}
                                  width={40}
                                  height={40}
                                  className="rounded-md"
                                  data-ai-hint={track['data-ai-hint']}
                                  unoptimized
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">{track.title}</p>
                                  <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => removeTrackFromQueue(track.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">The queue is empty.</p>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : null}
          </ScrollArea>
        </div>
         {getDraggableTracks.length > 0 && (
          <SheetFooter className="pt-4 border-t">
            <Button variant="outline" className="w-full" onClick={clearQueue}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Queue
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

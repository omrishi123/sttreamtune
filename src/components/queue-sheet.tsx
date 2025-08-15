
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
import React from 'react';
import type { Track } from "@/lib/types";

export function QueueSheet() {
  const { queue, currentTrack, removeTrackFromQueue, clearQueue, reorderQueue } = usePlayer();

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // We need to account for the "Now Playing" track which is not in the draggable list
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    // Find the original indices in the main queue
    const draggableTracks = queue.filter(track => track.id !== currentTrack?.id);
    const draggedTrack = draggableTracks[sourceIndex];

    const originalSourceIndex = queue.findIndex(t => t.id === draggedTrack.id);
    // The target track is the one at the destination in the visible list
    const targetTrackInDraggableList = draggableTracks[destinationIndex];
    const originalDestinationIndex = queue.findIndex(t => t.id === targetTrackInDraggableList.id);

    reorderQueue(originalSourceIndex, originalDestinationIndex);
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
          <SheetTitle>Up Next</SheetTitle>
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
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Separator className="my-4"/>
            
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="queue">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {getDraggableTracks.length > 0 ? (
                      getDraggableTracks.map((track: Track, index: number) => (
                        <Draggable key={track.id} draggableId={track.id} index={index}>
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
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{track.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
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

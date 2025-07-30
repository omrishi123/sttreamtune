
"use client";

import Image from "next/image";
import { ListMusic, Trash2, X } from "lucide-react";
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

export function QueueSheet() {
  const { queue, currentTrack, removeTrackFromQueue, clearQueue, setQueueAndPlay } = usePlayer();
  const tracksInQueue = queue.filter(track => track.id !== currentTrack?.id);

  const handlePlayFromQueue = (trackId: string) => {
     const trackToPlay = queue.find(t => t.id === trackId);
     if (trackToPlay) {
       setQueueAndPlay(queue, trackId);
     }
  }

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
            <div className="space-y-4">
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
              
              <Separator />
              
              <div className="space-y-2">
                {tracksInQueue.length > 0 ? (
                  tracksInQueue.map((track) => (
                    <div key={track.id} className="flex items-center gap-3 p-2 group rounded-md hover:bg-muted/50 cursor-pointer" >
                       <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => handlePlayFromQueue(track.id)}>
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
                       </div>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => removeTrackFromQueue(track.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">The queue is empty.</p>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
         {tracksInQueue.length > 0 && (
          <SheetFooter className="pt-4">
            <SheetClose asChild>
              <Button variant="outline" className="w-full" onClick={clearQueue}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Queue
              </Button>
            </SheetClose>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

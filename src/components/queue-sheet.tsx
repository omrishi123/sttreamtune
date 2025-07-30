
"use client";

import Image from "next/image";
import { ListMusic } from "lucide-react";
import { usePlayer } from "@/context/player-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function QueueSheet() {
  const { queue, currentTrack } = usePlayer();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <ListMusic className="h-5 w-5" />
          <span className="sr-only">Open queue</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Up Next</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-4rem)] pr-4">
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
                  <div>
                    <p className="font-semibold text-sm">{currentTrack.title}</p>
                    <p className="text-xs text-muted-foreground">{currentTrack.artist}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Separator />
            
            <div className="space-y-2">
              {queue.filter(track => track.id !== currentTrack?.id).length > 0 ? (
                queue.filter(track => track.id !== currentTrack?.id).map((track) => (
                  <div key={track.id} className="flex items-center gap-3 p-2">
                    <Image
                      src={track.artwork}
                      alt={track.title}
                      width={40}
                      height={40}
                      className="rounded-md"
                      data-ai-hint={track['data-ai-hint']}
                    />
                    <div>
                      <p className="font-semibold text-sm">{track.title}</p>
                      <p className="text-xs text-muted-foreground">{track.artist}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">The queue is empty.</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import Image from "next/image";
import { ListMusic, X } from "lucide-react";
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
        <ScrollArea className="h-[calc(100%-4rem)] mt-4">
          <div className="space-y-4 pr-4">
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
                  <div className="flex-1">
                    <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Separator />
            
            <div className="space-y-2">
              {queue.map((track) => (
                <div key={track.id} className="flex items-center gap-3 p-2 group">
                   <Image
                    src={track.artwork}
                    alt={track.title}
                    width={40}
                    height={40}
                    className="rounded-md"
                    data-ai-hint={track['data-ai-hint']}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}


'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { searchYoutube } from '@/ai/flows/search-youtube-flow';
import type { Playlist, Track } from '@/lib/types';
import { useUserData } from '@/context/user-data-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from './icons';
import { ScrollArea } from './ui/scroll-area';
import { Check } from 'lucide-react';

interface AddSongsDialogProps {
  playlist: Playlist;
  children: React.ReactNode;
  onTrackAdded: (track: Track) => void;
}

export function AddSongsDialog({ playlist, children, onTrackAdded }: AddSongsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedTrackIds, setAddedTrackIds] = useState<Set<string>>(new Set());

  const { addTrackToCache } = useUserData();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    try {
      const searchResults = await searchYoutube({ query });
      addTrackToCache(searchResults.tracks);
      setResults(searchResults.tracks);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: 'Could not perform search. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTrack = (track: Track) => {
    if (playlist.trackIds.includes(track.id) || addedTrackIds.has(track.id)) {
        toast({
            title: 'Already in playlist',
            description: `"${track.title}" is already in this playlist.`,
        });
        return;
    }
    onTrackAdded(track);
    setAddedTrackIds(prev => new Set(prev).add(track.id));
    toast({
        title: 'Track Added',
        description: `"${track.title}" has been added to "${playlist.name}".`,
    });
  };

  // Reset state when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open) {
          setQuery('');
          setResults([]);
          setAddedTrackIds(new Set());
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add songs to &quot;{playlist.name}&quot;</DialogTitle>
          <DialogDescription>
            Search for songs and add them directly to your playlist.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="search"
            placeholder="Search for songs..."
            className="text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Icons.spinner className="animate-spin" /> : 'Search'}
          </Button>
        </form>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 py-4">
            {isLoading && (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)
            )}
            {!isLoading && results.map((track) => {
              const isAdded = playlist.trackIds.includes(track.id) || addedTrackIds.has(track.id);
              return (
                <div key={track.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
                  <Image
                    src={track.artwork}
                    alt={track.title}
                    width={48}
                    height={48}
                    className="rounded-md"
                    unoptimized
                  />
                  <div className="flex-1">
                    <p className="font-semibold line-clamp-1">{track.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{track.artist}</p>
                  </div>
                  <Button
                    variant={isAdded ? "secondary" : "default"}
                    size="sm"
                    onClick={() => handleAddTrack(track)}
                    disabled={isAdded}
                  >
                    {isAdded ? <Check className="mr-2 h-4 w-4"/> : <Plus className="mr-2 h-4 w-4" />}
                    {isAdded ? 'Added' : 'Add'}
                  </Button>
                </div>
              )
            })}
          </div>
        </ScrollArea>

      </DialogContent>
    </Dialog>
  );
}

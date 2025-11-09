
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserData } from '@/context/user-data-context';
import { useToast } from '@/hooks/use-toast';
import type { Track, Playlist, User } from '@/lib/types';
import { onAuthChange } from '@/lib/auth';
import { Icons } from './icons';

interface SaveSearchDialogProps {
  children: React.ReactNode;
  searchResults: Track[];
}

export function SaveSearchDialog({ children, searchResults }: SaveSearchDialogProps) {
  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const { addPlaylist } = useUserData();
  const { toast } = useToast();

   React.useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = onAuthChange(setUser);
    return () => unsubscribe();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Logged In',
            description: 'You must be logged in to save a playlist.',
        });
        return;
    }

    setIsLoading(true);

    const trackIds = searchResults.map(track => track.id);
    const coverArt = searchResults.length > 0 ? searchResults[0].artwork : 'https://i.postimg.cc/mkvv8tmp/digital-art-music-player-with-colorful-notes-black-background-900370-14342.avif';

    const newPlaylist: Playlist = {
        id: `playlist-${Date.now()}`,
        name,
        description: `Saved from search results.`,
        trackIds,
        public: false, // Always private as requested
        owner: user.name,
        ownerId: user.id,
        coverArt,
        'data-ai-hint': 'playlist cover',
    };
    
    addPlaylist(newPlaylist);

    toast({
      title: 'Playlist Saved!',
      description: `"${name}" has been added to your library.`,
    });

    setIsLoading(false);
    setIsOpen(false);
    setName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Search as Playlist</DialogTitle>
          <DialogDescription>
            This will create a new private playlist in your library with the {searchResults.length} songs from your search.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="My Awesome Playlist"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Save Playlist
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

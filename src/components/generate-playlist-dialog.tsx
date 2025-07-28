
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUserData } from '@/context/user-data-context';
import { useToast } from '@/hooks/use-toast';
import { generatePlaylist } from '@/ai/flows/generate-playlist-flow';
import { onAuthChange } from '@/lib/auth';
import type { User } from '@/lib/types';
import { Icons } from './icons';

export function GeneratePlaylistDialog({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { addPlaylist, addTracksToCache } = useUserData();
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      toast({
        variant: 'destructive',
        title: 'Prompt is empty',
        description: 'Please describe the playlist you want to create.',
      });
      return;
    }
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not logged in',
        description: 'You must be logged in to create an AI playlist.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await generatePlaylist({
        prompt,
        userId: user.id,
        userName: user.name,
      });

      if (!result || !result.playlist || !result.tracks) {
        throw new Error('AI failed to generate a valid playlist.');
      }
      
      // Add tracks to global cache first
      addTracksToCache(result.tracks);
      
      // Then add the playlist to user data
      addPlaylist(result.playlist);

      toast({
        title: 'Playlist Generated!',
        description: `"${result.playlist.name}" has been added to your library.`,
      });

      setIsOpen(false);
      setPrompt('');
    } catch (error: any) {
      console.error('Failed to generate playlist:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error.message || 'Could not generate the playlist. Please try a different prompt.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create with AI</DialogTitle>
          <DialogDescription>
            Describe the kind of playlist you want, and let AI do the rest. For example: "Acoustic songs for a rainy day" or "Upbeat 80s pop for a road trip".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="prompt">Your Vibe</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Lofi beats for studying"
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

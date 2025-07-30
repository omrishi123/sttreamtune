
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
import type { User, Playlist } from '@/lib/types';
import { Icons } from './icons';
import { Switch } from './ui/switch';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function GeneratePlaylistDialog({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { addPlaylist, addTracksToCache } = useUserData();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = onAuthChange(setUser);
    return () => unsubscribe();
  }, [isOpen]);

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
     if (isPublic && user?.id === 'guest') {
       toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'You must be logged in to create a public playlist.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await generatePlaylist({
        prompt,
        userId: user.id,
        userName: user.name,
        isPublic: isPublic,
      });

      if (!result || !result.playlist || !result.tracks) {
        throw new Error('AI failed to generate a valid playlist.');
      }
      
      addTracksToCache(result.tracks);
      
      if (isPublic) {
         await addDoc(collection(db, "communityPlaylists"), {
          ...result.playlist,
          createdAt: serverTimestamp(),
        });
      } else {
        addPlaylist(result.playlist);
      }
      

      toast({
        title: 'Playlist Generated!',
        description: `"${result.playlist.name}" has been added to your library.`,
      });

      setIsOpen(false);
      setPrompt('');
      setIsPublic(false);
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
            <div className="flex items-center justify-between gap-4 pt-2">
              <Label htmlFor="public" className="text-right whitespace-nowrap">
                Make Public
              </Label>
               <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Share with the community</span>
                <Switch
                    id="public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    disabled={isLoading}
                />
              </div>
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

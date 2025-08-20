
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
import { getChannelContent } from '@/ai/flows/get-channel-content-flow';
import { Icons } from './icons';
import type { User } from '@/lib/types';
import { onAuthChange } from '@/lib/auth';

export function ImportChannelDialog({ children }: { children: React.ReactNode }) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const { addChannel, addTracksToCache } = useUserData();
  const { toast } = useToast();

   React.useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = onAuthChange(setUser);
    return () => unsubscribe();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      toast({
        variant: 'destructive',
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube channel URL.',
      });
      return;
    }
    
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Logged In',
            description: 'You must be logged in to import a channel.',
        });
        return;
    }

    setIsLoading(true);

    try {
      const channelData = await getChannelContent({ channelUrl: url });

      // Add all tracks from uploads and playlists to the global track cache
      const allTracks = [...channelData.uploads, ...channelData.playlists.flatMap(p => p.tracks || [])];
      addTracksToCache(allTracks);

      // Add the channel to local storage
      addChannel(channelData);

      toast({
        title: 'Channel Imported!',
        description: `"${channelData.name}" has been added to your library.`,
      });

      setIsOpen(false);
      setUrl('');
    } catch (error: any) {
      console.error('Failed to import channel:', error);
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error.message || 'Could not import the channel. Please check the URL and try again.',
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
            <DialogTitle>Import YouTube Channel</DialogTitle>
            <DialogDescription>
              Paste the URL of a YouTube channel to import their uploads and playlists. This may take a moment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="url" className="text-right">
                  URL
                </Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="col-span-3"
                  placeholder="https://www.youtube.com/@..."
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
                {isLoading ? 'Importing...' : 'Import'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}

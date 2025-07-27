
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
import { getYoutubePlaylistDetails, getTracksForPlaylist } from '@/ai/flows/get-youtube-playlists-flow';
import { Icons } from './icons';

function extractPlaylistId(url: string): string | null {
  const regex = /[?&]list=([^&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function ImportPlaylistDialog({ children }: { children: React.ReactNode }) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { addPlaylist, addTracksToCache } = useUserData();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const playlistId = extractPlaylistId(url);

    if (!playlistId) {
      toast({
        variant: 'destructive',
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube playlist URL.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const playlistDetails = await getYoutubePlaylistDetails({ playlistId });
      if (!playlistDetails) {
        throw new Error('Playlist not found or could not be fetched.');
      }
      
      const tracks = await getTracksForPlaylist(playlistId);
      addTracksToCache(tracks);

      const newPlaylist = {
        ...playlistDetails,
        id: `pl-yt-${playlistId}`, // a unique ID for imported playlists
        trackIds: tracks.map(t => t.id),
      };

      addPlaylist(newPlaylist);

      toast({
        title: 'Playlist Imported!',
        description: `"${playlistDetails.name}" has been added to your library.`,
      });

      setIsOpen(false);
      setUrl('');
    } catch (error: any) {
      console.error('Failed to import playlist:', error);
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error.message || 'Could not import the playlist. Please check the URL and try again.',
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
          <DialogTitle>Import from YouTube</DialogTitle>
          <DialogDescription>
            Paste the URL of a public YouTube playlist to add it to your library.
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
                placeholder="https://www.youtube.com/playlist?list=..."
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

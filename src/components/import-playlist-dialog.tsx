

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserData } from '@/context/user-data-context';
import { useToast } from '@/hooks/use-toast';
import { getYoutubePlaylistDetails, getTracksForPlaylist } from '@/ai/flows/get-youtube-playlists-flow';
import { Icons } from './icons';
import { Switch } from './ui/switch';
import { onAuthChange } from '@/lib/auth';
import type { User, Playlist } from '@/lib/types';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function extractPlaylistId(url: string): string | null {
  const regex = /[?&]list=([^&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function ImportPlaylistDialog({ children }: { children: React.ReactNode }) {
  const [url, setUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const router = useRouter();

  const { addPlaylist, addTracksToCache } = useUserData();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = onAuthChange(setUser);
    return () => unsubscribe();
  }, [isOpen]);

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
    
    if (isPublic && user?.id === 'guest') {
       setShowLoginAlert(true);
       return;
    }

    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Logged In',
            description: 'You must be logged in to import a playlist.',
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

      const importedPlaylistData: Omit<Playlist, 'id'> & { id?: string } = {
        ...playlistDetails,
        trackIds: tracks.map(t => t.id),
        public: isPublic,
        owner: user.name,
        ownerId: user.id, // Ensure ownerId is always set
      };


      if(isPublic) {
        // Firestore will generate an ID. We don't save this locally because the
        // real-time listener in UserDataProvider will automatically add it.
        await addDoc(collection(db, "communityPlaylists"), {
          ...importedPlaylistData,
          tracks: tracks, // Embed full track objects
          createdAt: serverTimestamp(),
        });
      } else {
        const finalPlaylist = { ...importedPlaylistData, id: `pl-yt-${playlistId}`};
        addPlaylist(finalPlaylist as Playlist);
      }

      toast({
        title: 'Playlist Imported!',
        description: `"${playlistDetails.name}" has been added to your library.`,
      });

      setIsOpen(false);
      setUrl('');
      setIsPublic(false);
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
    <>
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
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="public" className="text-right">
                  Public
                </Label>
                <div className="col-span-3 flex items-center justify-between">
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
                {isLoading ? 'Importing...' : 'Import'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You must be logged in to import a public playlist that is shared
              with the community.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/login')}>
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

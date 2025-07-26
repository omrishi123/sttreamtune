
'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Wand2} from 'lucide-react';
import {generatePlaylist} from '@/ai/flows/generate-playlist-flow';
import {useUserData} from '@/context/user-data-context';
import {useToast} from '@/hooks/use-toast';
import {Icons} from './icons';

export function AiPlaylistDialog() {
  const [prompt, setPrompt] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {addPlaylist, addTracksToCache} = useUserData();
  const {toast} = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setIsLoading(true);
    try {
      const {playlist, tracks} = await generatePlaylist({prompt});
      addTracksToCache(tracks);
      addPlaylist(playlist);

      toast({
        title: 'Playlist Created!',
        description: `"${playlist.name}" has been added to your library.`,
      });

      setIsOpen(false);
      setPrompt('');
      router.push(`/playlists/${playlist.id}`);
    } catch (error: any) {
      console.error('Failed to generate AI playlist:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description:
          error.message ||
          'Could not create the playlist. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Wand2 className="mr-2 h-4 w-4" />
          Create with AI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Playlist with AI</DialogTitle>
          <DialogDescription>
            Describe the kind of playlist you want, and let AI do the rest.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Label htmlFor="prompt">Your idea</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., 80s synthwave for a late-night drive"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Create Playlist'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

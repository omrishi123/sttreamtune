
'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { useToast } from '@/hooks/use-toast';
import { AddPlaylistDialog } from './add-playlist-dialog';
import { Track } from '@/lib/types';

export function AddToPlaylistMenu({
  track,
  children,
}: {
  track: Track;
  children?: React.ReactNode;
}) {
  const { playlists, addTrackToPlaylist, addTrackToCache } = useUserData();
  const { toast } = useToast();

  const handleAdd = (playlistId: string) => {
    addTrackToCache(track);
    addTrackToPlaylist(playlistId, track.id);
    toast({
      title: 'Added to playlist',
      description: `"${track?.title}" has been added.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <PlusCircle className="h-5 w-5" />
            <span className="sr-only">Add to playlist</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Add to Playlist</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <AddPlaylistDialog>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>New Playlist</span>
          </DropdownMenuItem>
        </AddPlaylistDialog>
        <DropdownMenuSeparator />
        {playlists.map((playlist) => (
          <DropdownMenuItem
            key={playlist.id}
            onClick={() => handleAdd(playlist.id)}
          >
            {playlist.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

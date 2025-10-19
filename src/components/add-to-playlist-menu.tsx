

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
import { useMemo } from 'react';
import { onAuthChange } from '@/lib/auth';
import type { User } from '@/lib/types';
import React from 'react';

export function AddToPlaylistMenu({
  track,
  children,
}: {
  track: Track;
  children?: React.ReactNode;
}) {
  const { playlists, communityPlaylists, addTrackToPlaylist } = useUserData();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthChange(setCurrentUser);
    return () => unsubscribe();
  }, []);

  const editablePlaylists = useMemo(() => {
    if (!currentUser) return [];

    // Filter private playlists (from localStorage)
    const userPrivatePlaylists = playlists; 
    
    // Filter public playlists (from Firestore) owned by the current user
    const userPublicPlaylists = communityPlaylists.filter(p => p.ownerId === currentUser.id);

    return [...userPrivatePlaylists, ...userPublicPlaylists];
  }, [playlists, communityPlaylists, currentUser]);

  const handleAdd = (playlistId: string) => {
    addTrackToPlaylist(playlistId, track);
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
        {editablePlaylists.length > 0 ? (
          editablePlaylists.map((playlist) => (
            <DropdownMenuItem
              key={playlist.id}
              onClick={() => handleAdd(playlist.id)}
            >
              {playlist.name}
            </DropdownMenuItem>
          ))
        ) : (
           <DropdownMenuItem disabled>No editable playlists</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

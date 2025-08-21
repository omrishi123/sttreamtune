
'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Trash2, Star, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import type { Playlist, Track } from '@/lib/types';
import { toggleFeaturedStatus, deletePlaylist } from '@/lib/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { ViewTracksDialog } from './view-tracks-dialog';

interface PlaylistsTableProps {
  initialPlaylists: Playlist[];
}

export function PlaylistsTable({ initialPlaylists }: PlaylistsTableProps) {
  const [playlists, setPlaylists] = React.useState(initialPlaylists);
  const [selectedPlaylist, setSelectedPlaylist] = React.useState<Playlist | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = React.useState<Playlist | null>(null);
  const { toast } = useToast();

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      await toggleFeaturedStatus(id, !currentStatus);
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, isFeatured: !currentStatus } : p
        )
      );
      toast({
        title: 'Success',
        description: `Playlist has been ${!currentStatus ? 'featured' : 'unfeatured'}.`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update playlist status.',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!playlistToDelete) return;
    try {
      await deletePlaylist(playlistToDelete.id);
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistToDelete.id));
      toast({
        title: 'Playlist Deleted',
        description: `"${playlistToDelete.name}" has been removed.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete playlist.',
      });
    } finally {
        setPlaylistToDelete(null);
    }
  };

  const handleTracksUpdated = (playlistId: string, updatedTracks: Track[]) => {
      setPlaylists(prev => prev.map(p => 
          p.id === playlistId 
            ? { ...p, tracks: updatedTracks, trackIds: updatedTracks.map(t => t.id) } 
            : p
      ));
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Public Playlists</CardTitle>
          <CardDescription>
            Manage playlists shared by the community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Owner</TableHead>
                <TableHead className="hidden md:table-cell">Tracks</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playlists.map((playlist) => (
                <TableRow key={playlist.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={playlist.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={playlist.coverArt}
                      width="64"
                      unoptimized
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/playlists/${playlist.id}`} className="hover:underline" target="_blank">
                      {playlist.name}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 md:hidden">By {playlist.owner}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{playlist.description}</p>
                  </TableCell>
                  <TableCell>
                    {playlist.isFeatured && <Badge>Featured</Badge>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {playlist.owner}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {playlist.tracks?.length || playlist.trackIds?.length || 0}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelectedPlaylist(playlist)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Tracks
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFeatured(playlist.id, !!playlist.isFeatured)}>
                          <Star className="mr-2 h-4 w-4" />
                          {playlist.isFeatured ? 'Unfeature' : 'Feature'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setPlaylistToDelete(playlist)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedPlaylist && (
          <ViewTracksDialog
              playlist={selectedPlaylist}
              isOpen={!!selectedPlaylist}
              onOpenChange={(isOpen) => {
                  if (!isOpen) {
                      setSelectedPlaylist(null);
                  }
              }}
              onTracksUpdated={handleTracksUpdated}
          />
      )}
       <AlertDialog open={!!playlistToDelete} onOpenChange={() => setPlaylistToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the playlist "{playlistToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

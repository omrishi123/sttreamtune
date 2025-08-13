
'use client';

import React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Playlist, Track } from '@/lib/types';
import { removeTrackFromPlaylistAdmin } from '@/lib/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';


interface ViewTracksDialogProps {
    playlist: Playlist;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onTracksUpdated: (playlistId: string, updatedTracks: Track[]) => void;
}

export function ViewTracksDialog({ playlist, isOpen, onOpenChange, onTracksUpdated }: ViewTracksDialogProps) {
    const [tracks, setTracks] = React.useState(playlist.tracks || []);
    const [isLoading, setIsLoading] = React.useState<string | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        setTracks(playlist.tracks || []);
    }, [playlist]);

    const handleRemoveTrack = async (trackToRemove: Track) => {
        setIsLoading(trackToRemove.id);
        try {
            await removeTrackFromPlaylistAdmin(playlist.id, trackToRemove);
            const updatedTracks = tracks.filter(t => t.id !== trackToRemove.id);
            setTracks(updatedTracks);
            onTracksUpdated(playlist.id, updatedTracks);
            toast({
                title: 'Track Removed',
                description: `"${trackToRemove.title}" removed from the playlist.`,
            });
        } catch (error) {
            console.error("Failed to remove track:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to remove track from playlist.',
            });
        } finally {
            setIsLoading(null);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{playlist.name}</DialogTitle>
                    <DialogDescription>
                        Viewing {tracks.length} tracks in this playlist.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Art</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Artist</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tracks.map((track) => (
                                <TableRow key={track.id}>
                                    <TableCell>
                                        <Image
                                            src={track.artwork}
                                            alt={track.title}
                                            width={40}
                                            height={40}
                                            className="rounded-md object-cover"
                                            unoptimized
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{track.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{track.artist}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveTrack(track)}
                                            disabled={isLoading === track.id}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            {isLoading === track.id ? (
                                                <Icons.spinner className="animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}


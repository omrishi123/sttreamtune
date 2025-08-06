'use server';
/**
 * @fileOverview A flow to securely update a public playlist.
 *
 * This flow runs with elevated privileges to update a playlist document
 * in Firestore, which a normal user might have permission issues with
 * if the client-side data is inconsistent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Playlist } from '@/lib/types';

const UpdatePlaylistInputSchema = z.object({
  playlistId: z.string().describe('The ID of the playlist document in Firestore.'),
  trackIdToRemove: z.string().describe('The ID of the track to remove from the playlist.'),
  userId: z.string().describe('The ID of the user attempting the action.'),
});
export type UpdatePlaylistInput = z.infer<typeof UpdatePlaylistInputSchema>;

const UpdatePlaylistOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type UpdatePlaylistOutput = z.infer<typeof UpdatePlaylistOutputSchema>;

export async function removeTrackFromPublicPlaylist(input: UpdatePlaylistInput): Promise<UpdatePlaylistOutput> {
  return updatePlaylistFlow(input);
}

const updatePlaylistFlow = ai.defineFlow(
  {
    name: 'updatePlaylistFlow',
    inputSchema: UpdatePlaylistInputSchema,
    outputSchema: UpdatePlaylistOutputSchema,
  },
  async ({ playlistId, trackIdToRemove, userId }) => {
    if (!playlistId || !trackIdToRemove || !userId) {
        return { success: false, message: 'Playlist ID, Track ID, and User ID are required.' };
    }

    try {
        const playlistRef = doc(db, 'communityPlaylists', playlistId);
        const playlistDoc = await getDoc(playlistRef);

        if (!playlistDoc.exists()) {
            return { success: false, message: 'Playlist not found.' };
        }

        const playlistData = playlistDoc.data() as Playlist;

        // Security Check: Verify ownership before proceeding
        if (playlistData.ownerId !== userId) {
            return { success: false, message: 'Permission denied. You are not the owner of this playlist.' };
        }

        // Find the full track object to remove from the 'tracks' array
        const trackToRemove = playlistData.tracks?.find(t => t.id === trackIdToRemove);
        
        const updates: any = {
            trackIds: arrayRemove(trackIdToRemove), // Always remove the ID from the trackIds array
        };

        if (trackToRemove) {
            // If the track object is found, remove it from the tracks array as well
            updates.tracks = arrayRemove(trackToRemove);
        } else {
             // If we can't find the track object, we should still proceed with removing the ID
             console.warn(`Track object with id ${trackIdToRemove} not found in playlist ${playlistId}, but removing from trackIds.`);
        }

        await updateDoc(playlistRef, updates);

        return { success: true, message: 'Track successfully removed from playlist.' };
    } catch (error: any) {
        console.error("Error in updatePlaylistFlow: ", error);
        return { success: false, message: error.message || 'An unknown error occurred while updating the playlist.' };
    }
  }
);

'use server';
/**
 * @fileOverview A flow to securely delete a public playlist.
 * This flow runs on the backend to bypass client-side permission issues
 * and ensure only the owner can delete their playlist.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Playlist } from '@/lib/types';

const DeletePlaylistInputSchema = z.object({
  playlistId: z.string().describe('The ID of the playlist document in Firestore.'),
  userId: z.string().describe('The ID of the user attempting the action.'),
});
export type DeletePlaylistInput = z.infer<typeof DeletePlaylistInputSchema>;

const DeletePlaylistOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeletePlaylistOutput = z.infer<typeof DeletePlaylistOutputSchema>;

export async function deletePublicPlaylist(input: DeletePlaylistInput): Promise<DeletePlaylistOutput> {
  return deletePlaylistFlow(input);
}

const deletePlaylistFlow = ai.defineFlow(
  {
    name: 'deletePlaylistFlow',
    inputSchema: DeletePlaylistInputSchema,
    outputSchema: DeletePlaylistOutputSchema,
  },
  async ({ playlistId, userId }) => {
    if (!playlistId || !userId) {
        return { success: false, message: 'Playlist ID and User ID are required.' };
    }

    try {
        const playlistRef = doc(db, 'communityPlaylists', playlistId);
        const playlistDoc = await getDoc(playlistRef);

        if (!playlistDoc.exists()) {
            return { success: false, message: 'Playlist not found.' };
        }

        const playlistData = playlistDoc.data() as Playlist;

        // Security Check: Verify ownership before deleting
        if (playlistData.ownerId !== userId) {
            return { success: false, message: 'Permission denied. You are not the owner of this playlist.' };
        }

        await deleteDoc(playlistRef);

        return { success: true, message: 'Playlist successfully deleted.' };
    } catch (error: any) {
        console.error("Error in deletePlaylistFlow: ", error);
        return { success: false, message: error.message || 'An unknown error occurred while deleting the playlist.' };
    }
  }
);

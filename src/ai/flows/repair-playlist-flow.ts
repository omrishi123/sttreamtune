

'use server';
/**
 * @fileOverview This flow is no longer used and can be safely removed or ignored.
 * The playlist repair functionality has been removed from the UI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Playlist } from '@/lib/types';

const RepairPlaylistInputSchema = z.object({
  playlistId: z.string().describe('The ID of the playlist document in Firestore to repair.'),
  userId: z.string().describe('The ID of the user claiming ownership.'),
});
export type RepairPlaylistInput = z.infer<typeof RepairPlaylistInputSchema>;

const RepairPlaylistOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type RepairPlaylistOutput = z.infer<typeof RepairPlaylistOutputSchema>;

export async function repairPlaylist(input: RepairPlaylistInput): Promise<RepairPlaylistOutput> {
  return repairPlaylistFlow(input);
}

const repairPlaylistFlow = ai.defineFlow(
  {
    name: 'repairPlaylistFlow',
    inputSchema: RepairPlaylistInputSchema,
    outputSchema: RepairPlaylistOutputSchema,
  },
  async ({ playlistId, userId }) => {
    if (!playlistId || !userId) {
        return { success: false, message: 'Playlist ID and User ID are required.' };
    }
     if (userId === 'guest') {
        return { success: false, message: 'Guests cannot repair playlists.' };
    }

    try {
        const playlistRef = doc(db, 'communityPlaylists', playlistId);
        const playlistDoc = await getDoc(playlistRef);

        if (!playlistDoc.exists()) {
            return { success: false, message: 'Playlist not found.' };
        }

        const playlistData = playlistDoc.data() as Playlist;

        // A playlist can be repaired if it's public and doesn't have an owner yet.
        if (playlistData.ownerId) {
             return { success: false, message: 'This playlist already has an owner.' };
        }

        // Assign the new owner
        await updateDoc(playlistRef, {
            ownerId: userId,
        });

        return { success: true, message: 'Playlist ownership has been repaired.' };
    } catch (error: any) {
        console.error("Error in repairPlaylistFlow: ", error);
        return { success: false, message: error.message || 'An unknown error occurred while repairing the playlist.' };
    }
  }
);

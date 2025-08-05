
'use server';
/**
 * @fileOverview A flow to repair the ownership of a public playlist.
 *
 * This flow runs with elevated privileges to update the ownerId of a
 * playlist document in Firestore, which a normal user wouldn't have
 * permission to do directly.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const RepairPlaylistInputSchema = z.object({
  playlistId: z.string().describe('The ID of the playlist document in Firestore to repair.'),
  newOwnerId: z.string().describe('The new user ID to set as the ownerId.'),
});
export type RepairPlaylistInput = z.infer<typeof RepairPlaylistInputSchema>;

const RepairPlaylistOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type RepairPlaylistOutput = z.infer<typeof RepairPlaylistOutputSchema>;


export async function repairPlaylistOwner(input: RepairPlaylistInput): Promise<RepairPlaylistOutput> {
  // This is a wrapper function that directly calls the flow.
  return repairPlaylistFlow(input);
}


const repairPlaylistFlow = ai.defineFlow(
  {
    name: 'repairPlaylistFlow',
    inputSchema: RepairPlaylistInputSchema,
    outputSchema: RepairPlaylistOutputSchema,
  },
  async ({ playlistId, newOwnerId }) => {
    if (!playlistId || !newOwnerId) {
        return { success: false, message: 'Playlist ID and new Owner ID are required.' };
    }

    try {
        const playlistRef = doc(db, 'communityPlaylists', playlistId);
        
        // This update operation is executed on the server via the flow,
        // bypassing client-side Firestore security rules.
        await updateDoc(playlistRef, {
            ownerId: newOwnerId,
        });

        return { success: true, message: 'Playlist ownership successfully updated.' };
    } catch (error: any) {
        console.error("Error in repairPlaylistFlow: ", error);
        return { success: false, message: error.message || 'An unknown error occurred while repairing the playlist.' };
    }
  }
);

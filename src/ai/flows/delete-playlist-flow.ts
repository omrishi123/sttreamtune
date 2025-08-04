'use server';
/**
 * @fileOverview A secure playlist deletion utility.
 *
 * - deletePlaylistSecurely - A server-side function to securely delete a playlist.
 */

import { z } from 'zod';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ai } from '@/ai/genkit';

const DeletePlaylistInputSchema = z.object({
  playlistId: z.string().describe("The ID of the playlist to delete."),
  userId: z.string().describe("The ID of the user attempting to delete the playlist."),
});
export type DeletePlaylistInput = z.infer<typeof DeletePlaylistInputSchema>;

export async function deletePlaylistSecurely(input: DeletePlaylistInput): Promise<{ success: boolean; message: string }> {
  return deletePlaylistFlow(input);
}

const deletePlaylistFlow = ai.defineFlow(
  {
    name: 'deletePlaylistFlow',
    inputSchema: DeletePlaylistInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async ({ playlistId, userId }) => {
    try {
      if (!userId || userId === 'guest') {
        throw new Error("User must be authenticated.");
      }

      const playlistRef = doc(db, 'communityPlaylists', playlistId);
      const playlistSnap = await getDoc(playlistRef);

      if (!playlistSnap.exists()) {
        throw new Error("Playlist not found.");
      }

      const playlistData = playlistSnap.data();

      if (playlistData.ownerId !== userId) {
        throw new Error("Permission denied. You are not the owner of this playlist.");
      }

      await deleteDoc(playlistRef);
      
      return { success: true, message: "Playlist deleted successfully." };

    } catch (error: any) {
      console.error("Secure delete failed:", error);
      // Return a structured error to the client
      return { success: false, message: error.message || "An unexpected error occurred during deletion." };
    }
  }
);

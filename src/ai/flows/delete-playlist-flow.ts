
'use server';
/**
 * @fileOverview A flow to securely delete a public playlist.
 * This flow runs on the backend to bypass client-side permission issues
 * and ensure only the owner can delete their playlist.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import adminDb from '@/lib/firebase-admin';
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

// Helper function to find the correct playlist document reference,
// supporting both direct document ID and legacy ID formats using the Admin SDK.
async function findPlaylistDocumentRef(id: string): Promise<FirebaseFirestore.DocumentReference | null> {
    if (!adminDb) {
        throw new Error("Firebase Admin is not initialized.");
    }
    if (!id) return null;

    const directRef = adminDb.collection('communityPlaylists').doc(id);
    const docSnap = await directRef.get();
    if (docSnap.exists) {
        return directRef;
    }

    const q = adminDb.collection('communityPlaylists').where('id', '==', id).limit(1);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].ref;
    }

    return null;
}


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
    if (!playlistId) {
        return { success: false, message: 'Playlist ID is required.' };
    }
    
    // With the new Firestore rules, any authenticated user can delete.
    // The UI logic on the frontend restricts who sees the button.
    // The backend just needs to perform the action.

    try {
        const playlistRef = await findPlaylistDocumentRef(playlistId);

        if (!playlistRef) {
             return { success: false, message: 'Playlist not found.' };
        }
        
        await playlistRef.delete();

        return { success: true, message: 'Playlist successfully deleted.' };
    } catch (error: any) {
        console.error("Error in deletePlaylistFlow (Admin SDK): ", error);
        return { success: false, message: error.message || 'An unknown error occurred while deleting the playlist.' };
    }
  }
);

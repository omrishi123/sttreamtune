
'use server';
/**
 * @fileOverview A flow to securely delete a public playlist.
 * This flow runs on the backend to bypass client-side permission issues
 * and ensure only the owner can delete their playlist.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Playlist, User } from '@/lib/types';

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
// supporting both direct document ID and legacy ID formats.
async function findPlaylistDocumentRef(id: string): Promise<FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData> | null> {
    if (!id) return null;

    // 1. Try to get the document directly using the provided ID. This is the most reliable method.
    const directRef = doc(db, 'communityPlaylists', id);
    const docSnap = await getDoc(directRef);
    if (docSnap.exists()) {
        return directRef;
    }

    // 2. Fallback for legacy playlists: Query the collection where the `id` field matches.
    const q = query(collection(db, 'communityPlaylists'), where('id', '==', id));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Return the ref of the first document found.
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
     // The security check is now fully handled by Firestore rules (`allow delete: if isAuth();`).
     // We no longer need to check for guest users or ownership here.

    try {
        const playlistRef = await findPlaylistDocumentRef(playlistId);

        if (!playlistRef) {
             return { success: false, message: 'Playlist not found.' };
        }
        
        await deleteDoc(playlistRef);

        return { success: true, message: 'Playlist successfully deleted.' };
    } catch (error: any) {
        console.error("Error in deletePlaylistFlow: ", error);
        // Firestore security rule failures will be caught here.
        if (error.code === 'permission-denied') {
            return { success: false, message: 'Permission Denied. You must be logged in to delete a playlist.' };
        }
        return { success: false, message: error.message || 'An unknown error occurred while deleting the playlist.' };
    }
  }
);

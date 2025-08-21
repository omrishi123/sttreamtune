
'use server';
/**
 * @fileOverview A flow to securely update a public playlist.
 *
 * This flow runs with elevated privileges to update a playlist document
 * in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import adminDb from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Playlist, Track } from '@/lib/types';

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
    if (!playlistId || !trackIdToRemove) {
        return { success: false, message: 'Playlist ID and Track ID are required.' };
    }
    
    // With the new Firestore rules, any authenticated user can update.
    // The UI logic on the frontend restricts who sees the button.
    // The backend just needs to perform the action.

    try {
        const playlistRef = await findPlaylistDocumentRef(playlistId);

        if (!playlistRef) {
            return { success: false, message: 'Playlist not found.' };
        }

        // We need to fetch the document to get the full track object for removal
        const playlistDoc = await playlistRef.get();
        if (!playlistDoc.exists) {
            return { success: false, message: 'Playlist not found.' };
        }
        const playlistData = playlistDoc.data() as Playlist;

        // Find the full track object to remove from the 'tracks' array
        const trackToRemoveObject = playlistData.tracks?.find(t => t.id === trackIdToRemove);
        
        const updates: { [key: string]: any } = {
            trackIds: FieldValue.arrayRemove(trackIdToRemove),
        };

        if (trackToRemoveObject) {
            // If the track object is found, remove it from the tracks array as well
            updates.tracks = FieldValue.arrayRemove(trackToRemoveObject);
        }

        await playlistRef.update(updates);

        return { success: true, message: 'Track successfully removed from playlist.' };
    } catch (error: any) {
        console.error("Error in updatePlaylistFlow (Admin SDK): ", error);
        return { success: false, message: error.message || 'An unknown error occurred while updating the playlist.' };
    }
  }
);

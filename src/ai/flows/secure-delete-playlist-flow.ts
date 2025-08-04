
'use server';
/**
 * @fileOverview A secure, server-side playlist deletion utility using the Firebase Admin SDK.
 * This flow bypasses client-side security rules by running in a trusted server environment.
 *
 * - secureDeletePlaylist - A server-side function to securely delete a playlist.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
  // IMPORTANT: In a real production environment, you would use a more secure way to handle credentials,
  // such as Google Cloud Secret Manager or environment variables.
  // For this context, we assume the service account key is available.
  // This configuration is a placeholder and should be adapted for a real deployment.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  adminApp = initializeApp({
    // If serviceAccount is available, use it. Otherwise, rely on Application Default Credentials.
    credential: serviceAccount ? credential.cert(serviceAccount) : undefined,
  });
} else {
  adminApp = getApps()[0];
}

const db = getFirestore(adminApp);

const SecureDeletePlaylistInputSchema = z.object({
  playlistId: z.string().describe("The ID of the playlist to delete."),
  userId: z.string().describe("The ID of the user attempting to delete the playlist."),
});
export type SecureDeletePlaylistInput = z.infer<typeof SecureDeletePlaylistInputSchema>;

export async function secureDeletePlaylist(input: SecureDeletePlaylistInput): Promise<{ success: boolean; message: string }> {
  return secureDeletePlaylistFlow(input);
}

const secureDeletePlaylistFlow = ai.defineFlow(
  {
    name: 'secureDeletePlaylistFlow',
    inputSchema: SecureDeletePlaylistInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async ({ playlistId, userId }) => {
    try {
      if (!userId || userId === 'guest') {
        throw new Error("User must be authenticated to delete playlists.");
      }

      const playlistRef = db.collection('communityPlaylists').doc(playlistId);
      const playlistSnap = await playlistRef.get();

      if (!playlistSnap.exists) {
        return { success: false, message: "Playlist not found." };
      }

      const playlistData = playlistSnap.data();

      // This is the crucial server-side check using the Admin SDK.
      if (playlistData?.ownerId !== userId) {
         return { success: false, message: "Permission denied. You are not the owner of this playlist." };
      }

      await playlistRef.delete();
      
      return { success: true, message: "Playlist deleted successfully." };

    } catch (error: any) {
      console.error("Secure playlist deletion failed:", error);
      return { success: false, message: error.message || "An unexpected error occurred during deletion." };
    }
  }
);

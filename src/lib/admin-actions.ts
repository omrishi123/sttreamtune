
'use server';

import type { User, Playlist, Track } from './types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';
import adminDb from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Helper function to safely convert Firestore Timestamps and other non-serializable data
const serializeFirestoreData = (doc: admin.firestore.DocumentSnapshot): object | null => {
    if (!admin) {
        throw new Error("Admin SDK not initialized in serializeFirestoreData");
    }
    const data = doc.data();
    if (!data) return null;

    const serializedData: { [key: string]: any } = { id: doc.id };
    for (const key in data) {
        const value = data[key];
        if (value instanceof admin.firestore.Timestamp) {
            serializedData[key] = value.toDate().toISOString();
        } else if (value instanceof FieldValue) {
            continue;
        }
        else {
            serializedData[key] = value;
        }
    }
    return serializedData;
};

// ========== DASHBOARD ==========
export async function getAdminStats() {
  if (!adminDb) {
    throw new Error("Firebase Admin is not initialized.");
  }
  try {
    const usersSnapshot = await adminDb.collection('users').get();
    const playlistsSnapshot = await adminDb.collection('communityPlaylists').get();

    const latestSignupsQuery = adminDb.collection('users').orderBy('email', 'desc').limit(5);
    const latestPlaylistsQuery = adminDb.collection('communityPlaylists').orderBy('createdAt', 'desc').limit(5);

    const [latestSignupsSnapshot, latestPlaylistsSnapshot] = await Promise.all([
      latestSignupsQuery.get(),
      latestPlaylistsQuery.get(),
    ]);

    const latestSignups = latestSignupsSnapshot.docs.map(doc => serializeFirestoreData(doc) as User).filter(Boolean);
    const latestPlaylists = latestPlaylistsSnapshot.docs.map(doc => serializeFirestoreData(doc) as Playlist).filter(Boolean);

    return {
      userCount: usersSnapshot.size,
      publicPlaylistCount: playlistsSnapshot.size,
      latestSignups,
      latestPlaylists,
    };
  } catch (error: any) {
      console.error("Error fetching admin stats:", error);
      throw new Error("Failed to fetch admin stats. Check server logs and Firestore rules.");
  }
}


// ========== USERS ==========
export async function getAllUsers(): Promise<User[]> {
  if (!adminDb) {
    throw new Error("Firebase Admin is not initialized.");
  }
  const usersSnapshot = await adminDb.collection('users').orderBy('email', 'asc').get();
  return usersSnapshot.docs.map(doc => serializeFirestoreData(doc) as User).filter(Boolean);
}

export async function updateUserRole(userId: string, isAdmin: boolean) {
  if (!adminDb) {
    throw new Error("Firebase Admin is not initialized.");
  }
  const userRef = adminDb.collection('users').doc(userId);
  await userRef.update({ isAdmin });
  revalidatePath('/admin/users');
}


// ========== PLAYLISTS ==========
export async function getAllPublicPlaylists(): Promise<Playlist[]> {
  if (!adminDb) {
    throw new Error("Firebase Admin is not initialized.");
  }
  const q = adminDb.collection('communityPlaylists').orderBy('createdAt', 'desc');
  const playlistsSnapshot = await q.get();
  return playlistsSnapshot.docs.map(doc => serializeFirestoreData(doc) as Playlist).filter(Boolean);
}

async function findPlaylistDocumentRef(id: string): Promise<FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData> | null> {
    if (!adminDb) {
        throw new Error("Firebase Admin is not initialized.");
    }
    const playlistRef = adminDb.collection('communityPlaylists').doc(id);
    const docSnap = await playlistRef.get();

    if (docSnap.exists) {
        return playlistRef; // The provided ID was the correct Firestore Document ID
    }

    // Fallback: If not found, query by the legacy YouTube ID or other custom ID formats.
    const querySnapshot = await adminDb.collection('communityPlaylists').where('id', '==', id).limit(1).get();
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].ref;
    }

    return null; // No document found by either method.
}

export async function toggleFeaturedStatus(id: string, newStatus: boolean) {
  const playlistRef = await findPlaylistDocumentRef(id);
  if (!playlistRef) {
    throw new Error("Playlist not found.");
  }
  await playlistRef.update({ isFeatured: newStatus });
  revalidatePath('/admin/playlists');
  revalidatePath('/');
}

export async function deletePlaylist(id: string) {
  const playlistRef = await findPlaylistDocumentRef(id);
  if (!playlistRef) {
      throw new Error("Playlist not found.");
  }
  await playlistRef.delete();
  revalidatePath('/admin/playlists');
}

export async function removeTrackFromPlaylistAdmin(playlistId: string, trackToRemove: Track) {
    if (!adminDb) {
        throw new Error("Firebase Admin is not initialized.");
    }

    const playlistRef = await findPlaylistDocumentRef(playlistId);
    if (!playlistRef) {
        throw new Error("Playlist not found.");
    }
    
    try {
        await adminDb.runTransaction(async (transaction) => {
            const playlistDoc = await transaction.get(playlistRef);
            if (!playlistDoc.exists) {
                throw new Error("Playlist not found inside transaction.");
            }

            const playlistData = playlistDoc.data() as Playlist;
            // Find the full track object in the `tracks` array to ensure we remove the correct one.
            const fullTrackToRemove = playlistData.tracks?.find(t => t.id === trackToRemove.id);

            const updates: { [key: string]: any } = {
                // Always remove the ID from the `trackIds` array.
                trackIds: FieldValue.arrayRemove(trackToRemove.id)
            };

            // If the full track object was found, remove it from the `tracks` array.
            if (fullTrackToRemove) {
                updates.tracks = FieldValue.arrayRemove(fullTrackToRemove);
            }

            transaction.update(playlistRef, updates);
        });

        revalidatePath(`/admin/playlists`);
        revalidatePath(`/playlists/${playlistId}`);
    } catch (error: any) {
        console.error("Error removing track from playlist:", error);
        throw new Error(`Failed to remove track: ${error.message}`);
    }
}

// ========== SETTINGS ==========
export async function getAppConfig() {
  if (!adminDb) {
    throw new Error("Firebase Admin is not initialized.");
  }
  const configRef = adminDb.collection('app-config').doc('version');
  const docSnap = await configRef.get();

  if (docSnap.exists) {
    return docSnap.data() as { latestVersion: string; updateUrl: string };
  } else {
    return { latestVersion: '', updateUrl: '' };
  }
}

export async function updateAppConfig(config: {
  latestVersion: string;
  updateUrl: string;
}) {
  if (!adminDb) {
    throw new Error("Firebase Admin is not initialized.");
  }
  const configRef = adminDb.collection('app-config').doc('version');
  await configRef.set(config, { merge: true });
  revalidatePath('/admin/settings');
}

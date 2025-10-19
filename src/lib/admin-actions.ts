

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

export async function updateUserVerification(userId: string, isVerified: boolean) {
  if (!adminDb) {
    throw new Error("Firebase Admin is not initialized.");
  }
  const userRef = adminDb.collection('users').doc(userId);
  await userRef.update({ isVerified });

  // Update all playlists owned by this user
  const playlistsQuery = adminDb.collection('communityPlaylists').where('ownerId', '==', userId);
  const playlistsSnapshot = await playlistsQuery.get();
  const batch = adminDb.batch();
  playlistsSnapshot.forEach(doc => {
    batch.update(doc.ref, { ownerIsVerified: isVerified });
  });
  await batch.commit();

  revalidatePath('/admin/users');
  revalidatePath('/community');
  revalidatePath('/');
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

async function findPlaylistDocumentRef(id: string): Promise<admin.firestore.DocumentReference | null> {
    if (!adminDb) {
        throw new Error("Firebase Admin is not initialized.");
    }
    if (!id) return null;

    // 1. Try to get the document directly using the provided ID, as this is the most common case.
    const directRef = adminDb.collection('communityPlaylists').doc(id);
    const docSnap = await directRef.get();
    if (docSnap.exists) {
        return directRef;
    }

    // 2. Fallback for legacy or imported playlists: Query the collection where the `id` field matches.
    const q = adminDb.collection('communityPlaylists').where('id', '==', id).limit(1);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
        // Return the ref of the first document found.
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
    const data = docSnap.data();
    return { 
        latestVersion: data?.latestVersion || '', 
        updateUrl: data?.updateUrl || '',
        updateNotes: data?.updateNotes || '',
    };
  } else {
    // Return a default structure if the document doesn't exist
    return { latestVersion: '', updateUrl: '', updateNotes: '' };
  }
}

export async function updateAppConfig(config: {
  latestVersion: string;
  updateUrl: string;
  updateNotes: string;
}) {
  if (!adminDb) {
    throw new Error("Firebase Admin is not initialized.");
  }
  const configRef = adminDb.collection('app-config').doc('version');
  await configRef.set(config, { merge: true });
  revalidatePath('/admin/settings');
}


'use server';

import type { User, Playlist, Track } from './types';
import { revalidatePath } from 'next/cache';
import adminDb from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Helper function to safely convert Firestore Timestamps and other non-serializable data
const serializeFirestoreData = (doc: admin.firestore.DocumentSnapshot): object | null => {
    const data = doc.data();
    if (!data) return null;

    const serializedData: { [key: string]: any } = { id: doc.id };
    for (const key in data) {
        const value = data[key];
        if (value instanceof admin.firestore.Timestamp) {
            serializedData[key] = value.toDate().toISOString();
        } else if (FieldValue.isEqual(value)) {
            // FieldValues can't be serialized, so we skip them or handle as needed
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
  const usersSnapshot = await adminDb.collection('users').get();
  return usersSnapshot.docs.map(doc => serializeFirestoreData(doc) as User).filter(Boolean);
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


export async function toggleFeaturedStatus(id: string, newStatus: boolean) {
  if (!adminDb) {
    throw new Error("Firebase Admin is not initialized.");
  }
  const playlistRef = adminDb.collection('communityPlaylists').doc(id);
  await playlistRef.update({ isFeatured: newStatus });
  revalidatePath('/admin/playlists');
  revalidatePath('/'); // Revalidate homepage as well
}

export async function deletePlaylist(id: string) {
  if (!adminDb) {
    throw new Error("Firebase Admin is not initialized.");
  }
  const playlistRef = adminDb.collection('communityPlaylists').doc(id);
  await playlistRef.delete();
  revalidatePath('/admin/playlists');
}

export async function removeTrackFromPlaylistAdmin(playlistId: string, track: Track) {
    if (!adminDb) {
        throw new Error("Firebase Admin is not initialized.");
    }
    const playlistRef = adminDb.collection('communityPlaylists').doc(playlistId);
    
    // The track object in Firestore might have Timestamp objects if it came from there.
    // To ensure the object matches for removal, we must remove it exactly as it is stored.
    // However, since we serialize on the way out, a simple object comparison with the client-side
    // object should be sufficient for arrayRemove. If issues persist, we'd need to fetch
    // the document first and find the exact track object to remove.
    const trackToRemove = {
      ...track,
      // Ensure any potential non-serializable fields are handled if necessary
    };

    await playlistRef.update({
        tracks: FieldValue.arrayRemove(trackToRemove),
        trackIds: FieldValue.arrayRemove(trackToRemove.id)
    });
    revalidatePath(`/admin/playlists`);
    revalidatePath(`/playlists/${playlistId}`);
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
    // Return default/empty values if not found
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

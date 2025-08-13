
'use server';

import type { User, Playlist, Track } from './types';
import { revalidatePath } from 'next/cache';
import adminDb from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Helper function to safely convert Firestore Timestamps to strings
const serializeFirestoreData = (doc: admin.firestore.DocumentData) => {
    const data = doc.data();
    if (!data) return null;
    
    // Create a new object to avoid modifying the original data object
    const serializedData: { [key: string]: any } = { id: doc.id };
    for (const key in data) {
        if (data[key] && typeof data[key].toDate === 'function') {
            serializedData[key] = data[key].toDate().toISOString();
        } else {
            serializedData[key] = data[key];
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

    const latestSignups = latestSignupsSnapshot.docs.map(serializeFirestoreData) as User[];
    const latestPlaylists = latestPlaylistsSnapshot.docs.map(serializeFirestoreData) as Playlist[];

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
    
    await playlistRef.update({
        tracks: FieldValue.arrayRemove(track),
        trackIds: FieldValue.arrayRemove(track.id)
    });
    revalidatePath('/admin/playlists');
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

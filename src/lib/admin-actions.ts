
'use server';

import type { User, Playlist } from './types';
import { revalidatePath } from 'next/cache';
import adminDb from './firebase-admin';

// Helper function to safely convert Firestore Timestamps to strings
const serializeFirestoreData = (doc: any) => {
    const data = doc.data();
    for (const key in data) {
        if (data[key] && typeof data[key].toDate === 'function') {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return { id: doc.id, ...data };
};


// ========== DASHBOARD ==========
export async function getAdminStats() {
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
  const usersSnapshot = await adminDb.collection('users').get();
  return usersSnapshot.docs.map(doc => serializeFirestoreData(doc) as User);
}

// ========== PLAYLISTS ==========
export async function getAllPublicPlaylists(): Promise<Playlist[]> {
  const q = adminDb.collection('communityPlaylists').orderBy('createdAt', 'desc');
  const playlistsSnapshot = await q.get();
  return playlistsSnapshot.docs.map(doc => serializeFirestoreData(doc) as Playlist);
}

export async function toggleFeaturedStatus(id: string, newStatus: boolean) {
  const playlistRef = adminDb.collection('communityPlaylists').doc(id);
  await playlistRef.update({ isFeatured: newStatus });
  revalidatePath('/admin/playlists');
  revalidatePath('/'); // Revalidate homepage as well
}

export async function deletePlaylist(id: string) {
  const playlistRef = adminDb.collection('communityPlaylists').doc(id);
  await playlistRef.delete();
  revalidatePath('/admin/playlists');
}

// ========== SETTINGS ==========
export async function getAppConfig() {
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
  const configRef = adminDb.collection('app-config').doc('version');
  await configRef.set(config, { merge: true });
  revalidatePath('/admin/settings');
}

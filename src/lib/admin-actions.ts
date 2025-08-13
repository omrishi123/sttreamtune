
'use server';

import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, Playlist } from './types';
import { revalidatePath } from 'next/cache';

// ========== DASHBOARD ==========
export async function getAdminStats() {
  try {
    const usersRef = collection(db, 'users');
    const playlistsRef = collection(db, 'communityPlaylists');

    // These queries will be executed with the server's admin privileges
    const usersSnapshot = await getDocs(usersRef);
    const playlistsSnapshot = await getDocs(playlistsRef);

    const latestSignupsQuery = query(usersRef, orderBy('email', 'desc'), limit(5));
    const latestPlaylistsQuery = query(
      playlistsRef,
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const [latestSignupsSnapshot, latestPlaylistsSnapshot] = await Promise.all([
      getDocs(latestSignupsQuery),
      getDocs(latestPlaylistsQuery),
    ]);

    const latestSignups = latestSignupsSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as User)
    );
    const latestPlaylists = latestPlaylistsSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Playlist)
    );

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
  const usersSnapshot = await getDocs(collection(db, 'users'));
  return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
}

// ========== PLAYLISTS ==========
export async function getAllPublicPlaylists(): Promise<Playlist[]> {
  const q = query(collection(db, 'communityPlaylists'), orderBy('createdAt', 'desc'));
  const playlistsSnapshot = await getDocs(q);
  return playlistsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Playlist));
}

export async function toggleFeaturedStatus(id: string, newStatus: boolean) {
  const playlistRef = doc(db, 'communityPlaylists', id);
  await updateDoc(playlistRef, { isFeatured: newStatus });
  revalidatePath('/admin/playlists');
  revalidatePath('/'); // Revalidate homepage as well
}

export async function deletePlaylist(id: string) {
  const playlistRef = doc(db, 'communityPlaylists', id);
  await deleteDoc(playlistRef);
  revalidatePath('/admin/playlists');
}

// ========== SETTINGS ==========
export async function getAppConfig() {
  const configRef = doc(db, 'app-config', 'version');
  const docSnap = await getDoc(configRef);

  if (docSnap.exists()) {
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
  const configRef = doc(db, 'app-config', 'version');
  await setDoc(configRef, config, { merge: true });
  revalidatePath('/admin/settings');
}

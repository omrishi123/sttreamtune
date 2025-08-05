
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from './firebase';
import type { User } from '@/lib/types';

const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest',
  email: '',
  photoURL: 'https://i.postimg.cc/SswWC87w/streamtune.png',
};

// This function adapts a Firebase user to our application's User type.
const adaptFirebaseUser = (firebaseUser: FirebaseUser): User => {
   // Always prefer the locally stored photo for consistency, as Firebase Auth photoURL has size limits.
  const localPhoto = typeof window !== 'undefined' ? window.localStorage.getItem(`photoURL-${firebaseUser.uid}`) : null;

  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    photoURL: localPhoto || firebaseUser.photoURL || 'https://i.postimg.cc/SswWC87w/streamtune.png',
  };
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // One-time profile sync for users who are missing a display name.
      // We no longer sync the photoURL here to avoid the "URL too long" error.
      if (!firebaseUser.displayName) {
        try {
          await updateProfile(firebaseUser, { displayName: "User" });
        } catch (error) {
          console.error("Failed to set default display name for user:", error);
        }
      }
      callback(adaptFirebaseUser(firebaseUser));
    } else {
      callback(GUEST_USER);
    }
  });
};

export const signUp = async (email: string, password: string, name: string, photoDataUrl: string | null) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (user) {
    // We only update the display name here. Photo is handled in localStorage.
    await updateProfile(user, { displayName: name });

    // Store the potentially long data URI in localStorage instead of the auth profile.
    if (photoDataUrl && typeof window !== 'undefined') {
      window.localStorage.setItem(`photoURL-${user.uid}`, photoDataUrl);
    }
  }
  return userCredential;
};

export const login = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  return signOut(auth);
};

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export const sendPasswordReset = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export const updateUserProfile = async (name: string, photoDataUrl: string | null) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is signed in.");
  }

  const profileUpdates: { displayName?: string } = {};

  if (name && name !== user.displayName) {
    profileUpdates.displayName = name;
  }
  
  // Update display name in Firebase Auth profile if it changed
  if (Object.keys(profileUpdates).length > 0) {
      await updateProfile(user, profileUpdates);
  }

  // Always handle photo updates in localStorage to avoid size limit errors.
  if (photoDataUrl && typeof window !== 'undefined') {
    window.localStorage.setItem(`photoURL-${user.uid}`, photoDataUrl);
  }
};

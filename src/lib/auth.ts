
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
   // Check for locally stored photo first for this user
  const localPhoto = typeof window !== 'undefined' ? window.localStorage.getItem(`photoURL-${firebaseUser.uid}`) : null;

  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    photoURL: localPhoto || firebaseUser.photoURL || 'https://i.postimg.cc/SswWC87w/streamtune.png',
  };
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
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
    // We create a profile object that we will use to update
    const profileUpdates: { displayName?: string; photoURL?: string } = {};

    if (name) {
      profileUpdates.displayName = name;
    }
    
    // If a photo data URL was provided (from web or native), we use it.
    if (photoDataUrl) {
      profileUpdates.photoURL = photoDataUrl;
    }

    // Now, update the profile in Firebase Authentication in one go.
    await updateProfile(user, profileUpdates);

    // We can still use localStorage as a quick-access cache if desired,
    // but the primary source of truth is now the Firebase Auth profile.
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

  const profileUpdates: { displayName?: string, photoURL?: string } = {};

  if (name && name !== user.displayName) {
    profileUpdates.displayName = name;
  }
  
  if (photoDataUrl) {
    // If a new photo is provided, we'll update it.
    profileUpdates.photoURL = photoDataUrl;
    if (typeof window !== 'undefined') {
      // Also update localStorage for immediate UI changes.
      window.localStorage.setItem(`photoURL-${user.uid}`, photoDataUrl);
    }
  }

  if (Object.keys(profileUpdates).length > 0) {
      await updateProfile(user, profileUpdates);
  }
};

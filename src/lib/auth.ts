
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
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // One-time profile sync for existing users
      const localPhoto = typeof window !== 'undefined' ? window.localStorage.getItem(`photoURL-${firebaseUser.uid}`) : null;
      const profileNeedsUpdate = !firebaseUser.displayName || (localPhoto && !firebaseUser.photoURL);

      if (profileNeedsUpdate) {
        try {
          const updates: { displayName?: string; photoURL?: string } = {};
          if (!firebaseUser.displayName) updates.displayName = "User"; // Fallback name
          if (localPhoto && !firebaseUser.photoURL) updates.photoURL = localPhoto;
          
          await updateProfile(firebaseUser, updates);
        } catch (error) {
          console.error("Failed to sync user profile:", error);
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
    const profileUpdates: { displayName?: string; photoURL?: string } = {};

    if (name) {
      profileUpdates.displayName = name;
    }
    
    if (photoDataUrl) {
      profileUpdates.photoURL = photoDataUrl;
    }

    await updateProfile(user, profileUpdates);

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
    profileUpdates.photoURL = photoDataUrl;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`photoURL-${user.uid}`, photoDataUrl);
    }
  }

  if (Object.keys(profileUpdates).length > 0) {
      await updateProfile(user, profileUpdates);
  }
};

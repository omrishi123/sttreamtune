
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

export const signUp = async (email: string, password: string, name: string, photo: File | null = null) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // The native app handles photo uploads. This function is for web fallback.
  if (user) {
    await updateProfile(user, {
      displayName: name,
    });

     if (photo && typeof window !== 'undefined' && !window.Android) {
      // Convert file to Base64 Data URL to store locally for web
      const reader = new FileReader();
      const promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(photo);
      });
      
      const photoDataUrl = await promise;
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

export const updateUserProfile = async (name: string, photo: File | null) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is signed in.");
  }

  const profileUpdates: { displayName?: string } = {};

  if (name && name !== user.displayName) {
    profileUpdates.displayName = name;
  }

  // The native app handles photo uploads. This is the web fallback.
  if (photo && typeof window !== 'undefined' && !window.Android) {
    const reader = new FileReader();
    const promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(photo);
    });
    
    const photoDataUrl = await promise;
    window.localStorage.setItem(`photoURL-${user.uid}`, photoDataUrl);
  }

  if (Object.keys(profileUpdates).length > 0) {
      await updateProfile(user, profileUpdates);
  }
};

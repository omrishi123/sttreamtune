import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase';
import type { User } from '@/lib/types';

const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest',
  email: '',
  photoURL: 'https://i.ibb.co/R4m2S1z/logo.png',
};

// This function adapts a Firebase user to our application's User type.
const adaptFirebaseUser = (firebaseUser: FirebaseUser): User => {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || 'https://i.ibb.co/R4m2S1z/logo.png',
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

export const signUp = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
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


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
  signInWithCredential,
} from 'firebase/auth';
import { auth, db } from './firebase';
import type { User } from '@/lib/types';
import { doc, setDoc, getDoc } from 'firebase/firestore';


const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest',
  email: '',
  photoURL: 'https://i.postimg.cc/SswWC87w/streamtune.png',
};

// This function adapts a Firebase user to our application's User type.
const adaptFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  const localPhoto = typeof window !== 'undefined' ? window.localStorage.getItem(`photoURL-${firebaseUser.uid}`) : null;
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDoc = await getDoc(userDocRef);
  const dbUser = userDoc.exists() ? userDoc.data() as User : {};

  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    photoURL: localPhoto || firebaseUser.photoURL || 'https://i.postimg.cc/SswWC87w/streamtune.png',
    isAdmin: dbUser.isAdmin || false,
  };
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const adaptedUser = await adaptFirebaseUser(firebaseUser);
      // One-time profile sync for users who are missing a display name.
      if (!firebaseUser.displayName) {
        try {
          await updateProfile(firebaseUser, { displayName: "User" });
          adaptedUser.name = "User";
        } catch (error) {
          console.error("Failed to set default display name for user:", error);
        }
      }
      callback(adaptedUser);
    } else {
      callback(GUEST_USER);
    }
  });
};

// Sync user data to Firestore
const syncUserToFirestore = async (user: FirebaseUser) => {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);

  const userData: Partial<User> = {
    name: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
  
  // Only write isAdmin if it's a new user, to not overwrite existing admin status
  if (!docSnap.exists()) {
    userData.isAdmin = false;
  }
  
  await setDoc(userRef, userData, { merge: true });
};


export const signUp = async (email: string, password: string, name: string, photoDataUrl: string | null) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // This is the critical fix: update the profile *before* syncing to Firestore.
  if (user) {
    await updateProfile(user, { displayName: name });
    // Now that the displayName is set, syncUserToFirestore will work correctly.
    await syncUserToFirestore(user);

    if (photoDataUrl && typeof window !== 'undefined') {
      window.localStorage.setItem(`photoURL-${user.uid}`, photoDataUrl);
    }
  }
  return userCredential;
};

export const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  if (userCredential.user) {
    await syncUserToFirestore(userCredential.user);
  }
  return userCredential;
};

export const logout = () => {
  return signOut(auth);
};

export const signInWithGoogle = async () => {
  // Check if the native Android interface is available
  // @ts-ignore
  if (window.Android && typeof window.Android.signInWithGoogle === 'function') {
    // @ts-ignore
    window.Android.signInWithGoogle();
    // Native app will handle the sign-in and call back to handleGoogleSignInFromNative
    return;
  }

  // Fallback for web browsers
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  if (result.user) {
      await syncUserToFirestore(result.user);
  }
  return result;
}

export const handleGoogleSignInFromNative = async (idToken: string) => {
    try {
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        if (userCredential.user) {
            await syncUserToFirestore(userCredential.user);
        }
        return userCredential;
    } catch (error) {
        console.error("Firebase sign-in with credential failed:", error);
        // We can optionally expose an error handler to the native app too
        // For now, we'll just log it. The native side should also handle errors.
        throw error;
    }
};

// Expose the function to the window object so the native app can call it
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.handleGoogleSignInFromNative = handleGoogleSignInFromNative;
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
  
  if (Object.keys(profileUpdates).length > 0) {
      await updateProfile(user, profileUpdates);
  }
  
  await syncUserToFirestore(user);

  if (photoDataUrl && typeof window !== 'undefined') {
    window.localStorage.setItem(`photoURL-${user.uid}`, photoDataUrl);
  }
};

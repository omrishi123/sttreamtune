// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBH1y490Wh0rzyS5S_YRIjgeEzJ4k7ulhw",
  authDomain: "tunestream-m2c5m.firebaseapp.com",
  projectId: "tunestream-m2c5m",
  storageBucket: "tunestream-m2c5m.appspot.com",
  messagingSenderId: "896788610817",
  appId: "1:896788610817:web:403ce218eb75cf904ba500"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

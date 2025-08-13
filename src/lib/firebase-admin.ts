import admin from 'firebase-admin';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    // Prevent the app from crashing if initialization fails but log the error.
  }
}

const adminDb = admin.apps.length ? admin.firestore() : null;

export default adminDb;

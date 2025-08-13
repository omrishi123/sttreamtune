
import admin from 'firebase-admin';

// This check prevents re-initializing the app in Next.js hot-reload scenarios.
if (!admin.apps.length) {
  try {
    // Ensure environment variables are loaded. In Next.js, they are loaded automatically.
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key needs to be parsed correctly from the environment variable.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Check if the essential credentials are provided
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } else {
      console.warn("Firebase Admin SDK credentials are not fully provided. Skipping initialization.");
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
}

// Export the firestore instance, which will be null if initialization failed.
const adminDb = admin.apps.length ? admin.firestore() : null;

export default adminDb;

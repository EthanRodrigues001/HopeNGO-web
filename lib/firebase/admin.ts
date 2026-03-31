import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth }      from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  // We use dummy values below if env variables are not set during build to avoid crashing Next.js during static site generation.
  if (process.env.FIREBASE_PROJECT_ID) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        // Ensure private key string is formatted correctly when read from env files
        privateKey:  process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Only used locally before Firebase credentials are setup
    console.warn("Firebase Admin Initialization ignored. Ensure FIREBASE_PROJECT_ID is provided.");
    initializeApp({projectId: 'dummy-project'});
  }
}

export const adminAuth = getAuth();
export const adminDb   = getFirestore();

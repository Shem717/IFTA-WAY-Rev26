import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
};

let services: FirebaseServices | null = null;

export function getFirebase(): FirebaseServices {
  if (services) return services;

  const firebaseConfig = {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ?? 'AIzaSyB4otS98U1W8NxqWNVBcuEsQBRUKMlnOvY',
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ?? 'iftaway.firebaseapp.com',
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ?? 'iftaway',
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ?? 'iftaway.appspot.com',
    appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) ?? '1:176569825506:web:059fa1dce6dad7e9c546bb',
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  const storage = getStorage(app);
  const functions = getFunctions(app);

  services = { app, auth, db, storage, functions };
  return services;
}

export const appId = 'iftaway';
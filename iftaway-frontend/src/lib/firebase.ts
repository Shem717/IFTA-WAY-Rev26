import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';
import { getFirestore, type Firestore } from 'firebase/firestore';

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
    apiKey: 'AIzaSyB4otS98U1W8NxqWNVBcuEsQBRUKMlnOvY',
    authDomain: 'iftaway.web.app',
    projectId: 'iftaway',
    storageBucket: 'iftaway.appspot.com',
    appId: '1:176569825506:web:059fa1dce6dad7e9c546bb',
  };

  /*
   * IMPORTANT: For Google Sign-in to work, you must add the domain where you are hosting the application to the list of authorized domains in the Firebase console.
   * 1. Go to the Firebase console: https://console.firebase.google.com/
   * 2. Select your project.
   * 3. Go to Authentication > Sign-in method.
   * 4. Add the domain to the list of authorized domains.
   */

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const functions = getFunctions(app);

  services = { app, auth, db, storage, functions };
  return services;
}

export const appId = 'iftaway';
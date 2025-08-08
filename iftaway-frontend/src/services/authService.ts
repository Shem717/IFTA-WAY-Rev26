import { getFirebase } from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';

export async function registerWithEmail(email: string, password: string): Promise<User> {
  const { auth } = getFirebase();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const { auth } = getFirebase();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle(): Promise<User> {
  const { auth } = getFirebase();
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function logout(): Promise<void> {
  const { auth } = getFirebase();
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  const { auth } = getFirebase();
  return onAuthStateChanged(auth, callback);
}


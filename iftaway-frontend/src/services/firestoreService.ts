import { getFirebase } from '../lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import type { FuelEntry, Truck } from '../types';

function userPath(uid: string) {
  return `users/${uid}`;
}

export async function listTrucks(uid: string): Promise<Truck[]> {
  const { db } = getFirebase();
  const q = query(collection(db, `${userPath(uid)}/trucks`), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, userId: 0 as any, ...d.data() })) as unknown as Truck[];
}

export async function addTruck(uid: string, number: string, makeModel: string): Promise<string> {
  const { db } = getFirebase();
  const ref = await addDoc(collection(db, `${userPath(uid)}/trucks`), {
    number,
    makeModel,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function removeTruck(uid: string, truckId: string): Promise<void> {
  const { db } = getFirebase();
  await deleteDoc(doc(db, `${userPath(uid)}/trucks/${truckId}`));
}

export async function listEntries(uid: string): Promise<FuelEntry[]> {
  const { db } = getFirebase();
  const q = query(collection(db, `${userPath(uid)}/fuel_entries`), orderBy('dateTime', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as unknown as FuelEntry[];
}

export async function addEntry(uid: string, entry: Partial<FuelEntry>): Promise<string> {
  const { db } = getFirebase();
  const ref = await addDoc(collection(db, `${userPath(uid)}/fuel_entries`), {
    ...entry,
    createdAt: serverTimestamp(),
    lastEditedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEntry(uid: string, id: string, entry: Partial<FuelEntry>): Promise<void> {
  const { db } = getFirebase();
  await updateDoc(doc(db, `${userPath(uid)}/fuel_entries/${id}`), {
    ...entry,
    lastEditedAt: serverTimestamp(),
  });
}

export async function removeEntry(uid: string, id: string): Promise<void> {
  const { db } = getFirebase();
  await deleteDoc(doc(db, `${userPath(uid)}/fuel_entries/${id}`));
}


import { getFirebase } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadReceipt(uid: string, file: File): Promise<string> {
  const { storage } = getFirebase();
  const key = `receipts/${uid}/${Date.now()}-${file.name}`;
  const r = ref(storage, key);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}


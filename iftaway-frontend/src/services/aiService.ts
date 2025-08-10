import { getFirebase } from '../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

export async function scanReceiptViaCallable(imageBase64: string, mimeType: string): Promise<any> {
  const { app } = getFirebase();
  const functions = getFunctions(app);
  const callable = httpsCallable(functions, 'scanReceipt');
  const res = await callable({ imageBase64, mimeType });
  return res.data as any;
}


import { getFirebase } from '../lib/firebase';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

export async function scanReceiptViaCallable(imageBase64: string, mimeType: string): Promise<any> {
  try {
    const { app } = getFirebase();
    const functions = getFunctions(app);

    // Connect to emulator in development
    if (process.env.NODE_ENV === 'development' && !functions.app.options.projectId?.includes('demo')) {
      try {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      } catch (error) {
        // Emulator already connected or not available
        console.log('Functions emulator connection skipped:', error);
      }
    }

    const callable = httpsCallable(functions, 'scanReceipt');
    const res = await callable({ imageBase64, mimeType });
    return res.data as any;
  } catch (error: any) {
    console.error('Receipt scanning error:', error);

    // Provide more specific error messages
    if (error.code === 'functions/not-found') {
      throw new Error('Receipt scanning service is not available. Please try again later.');
    } else if (error.code === 'functions/unauthenticated') {
      throw new Error('Please sign in to use receipt scanning.');
    } else if (error.code === 'functions/permission-denied') {
      throw new Error('You do not have permission to use receipt scanning.');
    } else if (error.code === 'functions/unavailable') {
      throw new Error('Receipt scanning service is temporarily unavailable.');
    }

    throw error;
  }
}


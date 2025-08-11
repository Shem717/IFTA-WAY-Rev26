import { getFirebase } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot, UploadTask } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = (file: File, path: string, onProgress: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const { storage } = getFirebase();
    const fileId = uuidv4();
    const storageRef = ref(storage, `${path}/${fileId}-${file.name}`);
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error: Error) => {
        console.error('Upload failed:', error);
        reject(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL: string) => {
          resolve(downloadURL);
        });
      }
    );
  });
};

export interface FuelEntry {
  id: string;
  userId: string;
  truckNumber: string;
  dateTime: string;
  odometer: number;
  city: string;
  state: string;
  fuelType: 'diesel' | 'def' | 'custom';
  customFuelType?: string;
  amount: number;
  cost: number;
  receiptUrl?: string;
  isIgnored: boolean;
  createdAt: string;
  lastEditedAt: string;
  isDemo?: boolean;
}

export interface Truck {
  id: string;
  userId: number;
  makeModel: string;
  number: string;
  createdAt: string;
}

export type View = 'dashboard' | 'add-entry' | 'entries' | 'reports' | 'settings';

export type Theme = 'light' | 'dark';

export type SaveState = 'idle' | 'saving' | 'success' | 'error';

export type UploadStatus = 'idle' | 'reading' | 'parsing' | 'uploading' | 'success' | 'error';
export interface UploadProgress { status: UploadStatus; percentage: number; message: string; }

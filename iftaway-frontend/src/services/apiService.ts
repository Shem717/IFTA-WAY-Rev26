import { FuelEntry, Truck } from "../types";
import { getFirebase } from "../lib/firebase";
import {
  loginWithEmail,
  registerWithEmail,
  logout as firebaseLogout,
} from "./authService";
import * as fsSvc from "./firestoreService";
import { uploadReceipt } from "./storageService";
import { scanReceiptViaCallable } from "./aiService";

const USE_FIREBASE = Boolean((import.meta as any).env?.VITE_FIREBASE_PROJECT_ID) || (import.meta as any).env?.VITE_USE_FIREBASE === 'true';
const API_BASE_URL: string = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:10000';

async function fetchApi(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem('iftaway_token');
    const headers = new Headers(options.headers || {});
    
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { msg: 'An unknown error occurred. The server might be offline.' };
            }
            throw new Error(errorData.msg || `Request failed with status ${response.status}`);
        }
        
        if (response.status === 204) {
            return null;
        }

        return response.json();
    } catch (error: any) {
        throw new Error(error.message || 'Network request failed. Please check your connection.');
    }
}

// --- Auth ---
const register = async (email: string, password: string) => {
  if (!USE_FIREBASE) return fetchApi('/api/register', { method: 'POST', body: JSON.stringify({ email, password }) });
  const user = await registerWithEmail(email, password);
  return { user: { id: user.uid, email: user.email }, token: 'firebase' };
};

const login = async (email: string, password: string): Promise<{user: any, token: string}> => {
  if (!USE_FIREBASE) return fetchApi('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  const user = await loginWithEmail(email, password);
  return { user: { id: user.uid, email: user.email }, token: 'firebase' };
};

const getMe = async (): Promise<{user: any}> => {
  if (!USE_FIREBASE) return fetchApi('/api/me');
  const { auth } = getFirebase();
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  return { user: { id: u.uid, email: u.email } } as any;
};

const logout = async () => {
  if (!USE_FIREBASE) {
    localStorage.removeItem('iftaway_token');
    return;
  }
  await firebaseLogout();
  localStorage.removeItem('iftaway_token');
};

// --- AI Receipt Scan ---
const scanReceipt = (base64Image: string, mimeType: string): Promise<any> => {
  if (!USE_FIREBASE) {
    return fetchApi('/api/scan-receipt', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image, mimeType }),
    });
  }
  return scanReceiptViaCallable(base64Image, mimeType);
};

// --- Trucks ---
const getTrucks = async (): Promise<Truck[]> => {
  if (!USE_FIREBASE) return fetchApi('/api/trucks');
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return fsSvc.listTrucks(uid);
};

const addTruck = async (number: string, makeModel: string): Promise<Truck> => {
  if (!USE_FIREBASE) return fetchApi('/api/trucks', { method: 'POST', body: JSON.stringify({ number, makeModel }) });
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const id = await fsSvc.addTruck(uid, number, makeModel);
  return { id, userId: 0 as any, number, makeModel, createdAt: new Date().toISOString() } as unknown as Truck;
};

const deleteTruck = async (id: string) => {
  if (!USE_FIREBASE) return fetchApi(`/api/trucks/${id}`, { method: 'DELETE' });
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return fsSvc.removeTruck(uid, id);
};

// --- Fuel Entries ---
const getDashboardStats = (): Promise<any> => fetchApi('/api/dashboard');
const getPaginatedEntries = (page = 1, limit = 20): Promise<{ entries: FuelEntry[], totalPages: number, currentPage: number }> => {
    return fetchApi(`/api/entries?page=${page}&limit=${limit}`);
};
const getEntries = async (): Promise<FuelEntry[]> => {
  if (!USE_FIREBASE) return fetchApi('/api/entries');
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return fsSvc.listEntries(uid);
};

const addEntry = async (entryData: Partial<FuelEntry>) => {
  if (!USE_FIREBASE) return fetchApi('/api/entries', { method: 'POST', body: JSON.stringify(entryData) });
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const id = await fsSvc.addEntry(uid, entryData);
  return { id } as any;
};

const updateEntry = async (id: string, entryData: Partial<FuelEntry>) => {
  if (!USE_FIREBASE) return fetchApi(`/api/entries/${id}`, { method: 'PUT', body: JSON.stringify(entryData) });
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  await fsSvc.updateEntry(uid, id, entryData);
  return { id } as any;
};

const deleteEntry = async (id: string) => {
  if (!USE_FIREBASE) return fetchApi(`/api/entries/${id}`, { method: 'DELETE' });
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return fsSvc.removeEntry(uid, id);
};

const toggleIgnoreEntry = async (id: string, isIgnored: boolean) => {
  if (!USE_FIREBASE) return fetchApi(`/api/entries/${id}/ignore`, { method: 'PUT', body: JSON.stringify({ isIgnored }) });
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return fsSvc.updateEntry(uid, id, { isIgnored });
};

const apiService = {
    register,
    login,
    getMe,
    logout,
    scanReceipt,
    getTrucks,
    addTruck,
    deleteTruck,
    getDashboardStats,
    getPaginatedEntries,
    getEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleIgnoreEntry
};

export default apiService;

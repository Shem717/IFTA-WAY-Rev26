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

// --- Auth ---
const register = async (email: string, password: string) => {
  const user = await registerWithEmail(email, password);
  return { user: { id: user.uid, email: user.email }, token: 'firebase' };
};

const login = async (email: string, password: string): Promise<{user: any, token: string}> => {
  const user = await loginWithEmail(email, password);
  return { user: { id: user.uid, email: user.email }, token: 'firebase' };
};

const getMe = async (): Promise<{user: any}> => {
  const { auth } = getFirebase();
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  return { user: { id: u.uid, email: u.email } } as any;
};

const logout = async () => {
  await firebaseLogout();
  localStorage.removeItem('iftaway_token');
};

// --- AI Receipt Scan ---
const scanReceipt = (base64Image: string, mimeType: string): Promise<any> => {
  return scanReceiptViaCallable(base64Image, mimeType);
};

// --- Trucks ---
const getTrucks = async (): Promise<Truck[]> => {
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return fsSvc.listTrucks(uid);
};

const addTruck = async (number: string, makeModel: string): Promise<Truck> => {
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const id = await fsSvc.addTruck(uid, number, makeModel);
  return { id, number, makeModel, userId: 0, createdAt: new Date().toISOString() };
};

const deleteTruck = async (id: string): Promise<void> => {
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  await fsSvc.removeTruck(uid, id);
};

// --- Fuel Entries ---
const getEntries = async (page = 1, limit = 20): Promise<{ entries: FuelEntry[], totalPages: number, currentPage: number }> => {
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const entries = await fsSvc.listEntries(uid);
  
  // Simple pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEntries = entries.slice(startIndex, endIndex);
  
  return {
    entries: paginatedEntries,
    totalPages: Math.ceil(entries.length / limit),
    currentPage: page
  };
};

const addEntry = async (entry: Partial<FuelEntry>): Promise<FuelEntry> => {
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const id = await fsSvc.addEntry(uid, entry);
  return { id, ...entry } as FuelEntry;
};

const updateEntry = async (id: string, entry: Partial<FuelEntry>): Promise<FuelEntry> => {
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  await fsSvc.updateEntry(uid, id, entry);
  return { id, ...entry } as FuelEntry;
};

const deleteEntry = async (id: string): Promise<void> => {
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  await fsSvc.removeEntry(uid, id);
};

// --- Dashboard Stats ---
const getDashboardStats = async (): Promise<any> => {
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  
  const entries = await fsSvc.listEntries(uid);
  
  // Calculate stats from entries
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const currentMonthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.dateTime);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  });
  
  const prevMonthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.dateTime);
    return entryDate.getMonth() === prevMonth && entryDate.getFullYear() === prevYear;
  });
  
  const calculateStats = (entries: FuelEntry[]) => {
    const totalCost = entries.reduce((sum, entry) => sum + entry.cost, 0);
    const totalGallons = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const miles = entries.length > 1 ? 
      Math.max(...entries.map(e => e.odometer)) - Math.min(...entries.map(e => e.odometer)) : 0;
    const mpg = totalGallons > 0 ? miles / totalGallons : 0;
    
    return { miles, expenses: totalCost, mpg };
  };
  
  const currentMonthStats = calculateStats(currentMonthEntries);
  const prevMonthStats = calculateStats(prevMonthEntries);
  
  // Generate monthly cost data for chart
  const monthlyCostData = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.dateTime);
      return entryDate.getMonth() === date.getMonth() && entryDate.getFullYear() === date.getFullYear();
    });
    const cost = monthEntries.reduce((sum, entry) => sum + entry.cost, 0);
    monthlyCostData.push({
      name: date.toLocaleDateString('en-US', { month: 'short' }),
      cost: cost
    });
  }
  
  return {
    currentMonthStats,
    prevMonthStats,
    monthlyCostData,
    recentEntries: entries.slice(0, 5)
  };
};

// --- File Upload ---
const uploadReceiptFile = async (file: File): Promise<string> => {
  const { auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return uploadReceipt(uid, file);
};

export default {
  register,
  login,
  getMe,
  logout,
  scanReceipt,
  getTrucks,
  addTruck,
  deleteTruck,
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  getDashboardStats,
  uploadReceiptFile,
};
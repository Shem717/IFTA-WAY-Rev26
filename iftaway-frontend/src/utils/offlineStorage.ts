import { FuelEntry } from '../types';

// Offline storage utilities
class OfflineStorage {
  private static readonly ENTRIES_KEY = 'iftaway_offline_entries';

  static saveEntry(entry: Partial<FuelEntry>): void {
    const entries = this.getOfflineEntries();
    const offlineEntry = {
      ...entry,
      id: `offline_${Date.now()}`,
      isOffline: true,
      createdAt: new Date().toISOString(),
    };
    entries.push(offlineEntry);
    localStorage.setItem(this.ENTRIES_KEY, JSON.stringify(entries));
  }

  static getOfflineEntries(): any[] {
    const stored = localStorage.getItem(this.ENTRIES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static clearOfflineEntries(): void {
    localStorage.removeItem(this.ENTRIES_KEY);
  }

  static hasOfflineData(): boolean {
    return this.getOfflineEntries().length > 0;
  }
}

export default OfflineStorage;
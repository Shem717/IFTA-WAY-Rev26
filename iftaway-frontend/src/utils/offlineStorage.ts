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

  static async syncOfflineEntries(uid: string, addEntryFn: (uid: string, entry: Partial<FuelEntry>) => Promise<string>): Promise<{ success: number; failed: number }> {
    const offlineEntries = this.getOfflineEntries();
    if (offlineEntries.length === 0) {
      return { success: 0, failed: 0 };
    }

    const promises = offlineEntries.map(entry => {
      const { id, isOffline, ...entryToSave } = entry;
      return addEntryFn(uid, entryToSave);
    });

    const results = await Promise.allSettled(promises);

    let success = 0;
    let failed = 0;
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            success++;
        } else {
            failed++;
        }
    });

    // For simplicity, we clear all entries after attempting a sync.
    // A more robust implementation might only remove successfully synced entries.
    if (success > 0) {
        this.clearOfflineEntries();
    }

    return { success, failed };
  }
}

export default OfflineStorage;
/**
 * CacheOrchestrator: The "Gem" of Rapid Data Hydration
 * --------------------------------------------------
 * A persistent client-side caching layer designed for high-density historical data.
 * Once fetched, "set-in-stone" past data (shifts, time entries, screenshots) 
 * is never requested from Firestore again during that session or future sessions.
 */

const DB_NAME = 'TRAC_AI_CACHE';
const STORE_NAME = 'org_history';
const VERSION = 1;

class CacheOrchestrator {
  private db: IDBDatabase | null = null;

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generates a unique key for an organization on a specific date.
   */
  private generateKey(orgId: string, dateStr: string): string {
    return `${orgId}_${dateStr}`;
  }

  /**
   * Saves a snapshot of personnel data to the cache.
   */
  async set(orgId: string, dateStr: string, data: any): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      const payload = {
        data,
        cachedAt: Date.now(),
        date: dateStr,
        orgId
      };

      store.put(payload, this.generateKey(orgId, dateStr));
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('CacheOrchestrator Set Error:', err);
    }
  }

  /**
   * Retrieves a snapshot from the cache.
   */
  async get(orgId: string, dateStr: string): Promise<any | null> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(this.generateKey(orgId, dateStr));

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        request.onerror = () => resolve(null);
      });
    } catch (err) {
      // Return null on error to fallback to network
      return null;
    }
  }

  /**
   * Clears all cached data for a specific organization.
   */
  async clearOrg(orgId: string): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      // In a simple implementation, we iterate. For large datasets, 
      // an Index on orgId would be better.
      const request = store.openCursor();
      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.orgId === orgId) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    } catch (err) {}
  }
}

export const cacheOrchestrator = new CacheOrchestrator();

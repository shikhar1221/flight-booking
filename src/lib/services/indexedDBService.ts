import { Database } from '../../types/supabase';

const DB_NAME = 'flightBookingSystem';
const DB_VERSION = 1;

interface FlightSearchResult {
  flights: Database['public']['Tables']['flights']['Row'][];
  timestamp: number;
  searchParams: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: {
      adults: number;
      children: number;
      infants: number;
    };
    cabinClass: string;
  };
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores
        if (!db.objectStoreNames.contains('flightSearchResults')) {
          const store = db.createObjectStore('flightSearchResults', { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('origin', 'searchParams.origin');
          store.createIndex('destination', 'searchParams.destination');
        }
      };
    });
  }

  async cacheFlightSearchResults(results: FlightSearchResult): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['flightSearchResults'], 'readwrite');
      const store = transaction.objectStore('flightSearchResults');

      const request = store.add({
        ...results,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFlightSearchResults(params: Partial<FlightSearchResult['searchParams']>): Promise<FlightSearchResult | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['flightSearchResults'], 'readonly');
      const store = transaction.objectStore('flightSearchResults');
      const index = store.index('timestamp');

      const request = index.openCursor(null, 'prev');
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const result = cursor.value as FlightSearchResult;
          const isMatch = Object.entries(params).every(([key, value]) => {
            const searchParamValue = result.searchParams[key as keyof typeof params];
            return JSON.stringify(searchParamValue) === JSON.stringify(value);
          });

          if (isMatch && Date.now() - result.timestamp < 24 * 60 * 60 * 1000) { // 24 hours cache
            resolve(result);
          } else {
            cursor.continue();
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearOldCache(): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['flightSearchResults'], 'readwrite');
      const store = transaction.objectStore('flightSearchResults');
      const index = store.index('timestamp');

      const request = index.openCursor();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const result = cursor.value as FlightSearchResult;
          if (result.timestamp < oneDayAgo) {
            store.delete(cursor.primaryKey);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBService = new IndexedDBService();

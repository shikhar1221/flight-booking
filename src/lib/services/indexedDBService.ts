import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Flight, FlightSearchResult, CabinClass, SearchFilters } from '@/types/flight';

// Create a type that omits isRoundTrip from SearchFilters
type SearchParams = Omit<SearchFilters, 'isRoundTrip'>;

const DB_NAME = 'flightBookingSystem';
const DB_VERSION = 1;

interface FlightBookingDB extends DBSchema {
  flightSearchResults: {
    key: string;
    value: FlightSearchResult;
    indexes: {
      'by-timestamp': number;
      'by-origin': string;
      'by-destination': string;
    };
  };
}

class IndexedDBService {
   dbPromise: Promise<IDBPDatabase<FlightBookingDB>>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase<FlightBookingDB>> {
    return openDB<FlightBookingDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('flightSearchResults')) {
          const store = db.createObjectStore('flightSearchResults', {
            keyPath: 'id'
          });
          
          // Create indexes
          store.createIndex('by-timestamp', 'timestamp');
          store.createIndex('by-origin', 'searchParams.origin');
          store.createIndex('by-destination', 'searchParams.destination');
        }
      },
    });
  }

  async cacheFlightSearchResults(results: Omit<FlightSearchResult, 'id'>): Promise<string> {
    try {
      const db = await this.dbPromise;
      const id = crypto.randomUUID();
      await db.add('flightSearchResults', {
        ...results,
        id,
        timestamp: Date.now()
      });
      return id;
    } catch (error) {
      console.error('Error caching flight search results:', error);
      throw error;
    }
  }

  async getFlightSearchResults(
    params: Partial<SearchParams>
  ): Promise<FlightSearchResult | null> {
    try {
      const db = await this.dbPromise;
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours cache

      // Get all results sorted by timestamp in descending order
      const results = await db.getAllFromIndex(
        'flightSearchResults',
        'by-timestamp'
      );

      // Find the first matching result that isn't expired
      const matchingResult = results
        .reverse()
        .find(result => {
          const isNotExpired = result.timestamp >= oneDayAgo;
          const paramsMatch = Object.entries(params).every(([key, value]) => {
            const searchParamValue = result.searchParams[key as keyof SearchParams];
            return JSON.stringify(searchParamValue) === JSON.stringify(value);
          });
          return isNotExpired && paramsMatch;
        });

      return matchingResult || null;
    } catch (error) {
      console.error('Error getting flight search results:', error);
      throw error;
    }
  }

  async clearOldCache(): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('flightSearchResults', 'readwrite');
      const store = tx.objectStore('flightSearchResults');
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      let cursor = await store.openCursor();
      
      while (cursor) {
        if (cursor.value.timestamp < oneDayAgo) {
          await cursor.delete();
        }
        cursor = await cursor.continue();
      }

      await tx.done;
    } catch (error) {
      console.error('Error clearing old cache:', error);
      throw error;
    }
  }

  // Helper method to get all cached searches (useful for debugging)
  async getAllCachedSearches(): Promise<FlightSearchResult[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAll('flightSearchResults');
    } catch (error) {
      console.error('Error getting all cached searches:', error);
      throw error;
    }
  }
}

export const indexedDBService = new IndexedDBService();

import { useState, useEffect } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Flight } from '@/types/flight';
import type { Database } from '@/types/supabase';

type FlightPrice = Database['public']['Tables']['flight_prices']['Row'];
type SeatMap = Database['public']['Tables']['seat_map']['Row'];

interface FlightCacheEntry {
  id: string;
  flights: Flight[];
  flightPrices: Record<string, FlightPrice[]>;
  seatData: SeatMap[];
  returnFlights?: Flight[];
  timestamp: number;
}

interface FlightCacheDB extends DBSchema {
  flightSearches: {
    key: string;
    value: FlightCacheEntry;
    indexes: {
      'by-route': string;
      'by-timestamp': number;
    };
  };
}

export function useFlightCache() {
  const [db, setDb] = useState<IDBPDatabase<FlightCacheDB> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB<FlightCacheDB>('flight-booking-system', 1, {
          upgrade(db) {
            const store = db.createObjectStore('flightSearches', {
              keyPath: 'id'
            });
            store.createIndex('by-route', 'from,to,departureDate');
            store.createIndex('by-timestamp', 'timestamp');
          },
        });
        setDb(database);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize IndexedDB'));
      }
    };

    initDB();
  }, []);

  const getCachedFlights = async (
    from: string,
    to: string,
    departureDate: string
  ): Promise<FlightCacheEntry | null> => {
    if (!db) return null;

    try {
      const cacheKey = `${from}-${to}-${departureDate}`;
      const tx = db.transaction('flightSearches', 'readonly');
      const store = tx.objectStore('flightSearches');
      const cache = await store.get(cacheKey);

      if (!cache || Date.now() - cache.timestamp > CACHE_DURATION) {
        if (cache) {
          await db.delete('flightSearches', cacheKey);
        }
        return null;
      }

      return cache;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get cached results'));
      console.error('Error reading from cache:', err);
      return null;
    }
  };

  const cacheFlights = async (
    from: string,
    to: string,
    departureDate: string,
    flights: Flight[],
    flightPrices: Record<string, FlightPrice[]>,
    seatData: SeatMap[],
    returnFlights?: Flight[]
  ): Promise<void> => {
    if (!db) return;

    try {
      const cacheKey = `${from}-${to}-${departureDate}`;
      await db.put('flightSearches', {
        id: cacheKey,
        flights,
        flightPrices,
        seatData,
        returnFlights,
        timestamp: Date.now()
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cache flight results'));
      console.error('Error caching flights:', err);
    }
  };

  const clearExpiredCache = async () => {
    if (!db) return;

    try {
      const tx = db.transaction('flightSearches', 'readwrite');
      const store = tx.objectStore('flightSearches');
      const index = store.index('by-timestamp');
      const oldEntries = await index.getAllKeys(
        IDBKeyRange.upperBound(Date.now() - CACHE_DURATION)
      );
      
      await Promise.all(oldEntries.map(key => store.delete(key)));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to clear expired cache'));
      throw err;
    }
  };

  return {
    isReady: !!db,
    error,
    cacheFlights,
    getCachedFlights,
    clearExpiredCache
  };
}

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Database } from '@/types/supabase';

type Flight = Database['public']['Tables']['flights']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass: 'Economy' | 'Premium Economy' | 'Business' | 'First';
}

export interface CacheEntry {
  id: string;
  searchParams: SearchParams;
  results: Flight[];
  timestamp: number;
  expiresAt: number;
}

interface FlightBookingDB extends DBSchema {
  flights: {
    key: string;
    value: CacheEntry;
    indexes: {
      'by-timestamp': number;
      'by-origin': string;
      'by-destination': string;
      'by-expiry': number;
    };
  };
  bookings: {
    key: string;
    value: {
      booking: Booking;
      timestamp: number;
    };
    indexes: {
      'by-user': string;
      'by-status': string;
      'by-reference': string;
    };
  };
}

const DB_NAME = 'flight-booking-system';
const DB_VERSION = 3; // Incremented version for schema updates

export async function initDB(): Promise<IDBPDatabase<FlightBookingDB>> {
  try {
    return openDB<FlightBookingDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<FlightBookingDB>, oldVersion: number) {
        // Create or update flights store
        if (!db.objectStoreNames.contains('flights')) {
          const flightStore = db.createObjectStore('flights', { keyPath: 'id' });
          flightStore.createIndex('by-timestamp', 'timestamp');
          flightStore.createIndex('by-expiry', 'expiresAt');
          flightStore.createIndex('by-origin', 'searchParams.origin');
          flightStore.createIndex('by-destination', 'searchParams.destination');
        } else if (oldVersion < 3) {
          const tx = db.transaction('flights', 'readwrite');
          const flightStore = tx.objectStore('flights');
          
          // Add new indexes if they don't exist
          // if (!flightStore.indexNames.contains('by-origin')) {
          //   flightStore.createIndex('by-origin', 'searchParams.origin');
          // }
          // if (!flightStore.indexNames.contains('by-destination')) {
          //   flightStore.createIndex('by-destination', 'searchParams.destination');
          // }
        }

        // Create or update bookings store
        if (!db.objectStoreNames.contains('bookings')) {
          const bookingStore = db.createObjectStore('bookings', { keyPath: 'booking.id' });
          bookingStore.createIndex('by-user', 'booking.user_id');
          bookingStore.createIndex('by-status', 'booking.status');
          bookingStore.createIndex('by-reference', 'booking.reference');
        } else if (oldVersion < 3) {
          // Handle migration of existing data if needed
          // This would require more complex logic to transform existing data
          // to the new schema format
        }
      },
    });
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
}

/**
 * Helper function to clear expired flight search results
 */
export async function clearExpiredFlights(db: IDBPDatabase<FlightBookingDB>): Promise<void> {
  try {
    const now = Date.now();
    const tx = db.transaction('flights', 'readwrite');
    const store = tx.objectStore('flights');
    const expiryIndex = store.index('by-expiry');

    const expiredFlights = await expiryIndex.getAll(IDBKeyRange.upperBound(now));
    
    await Promise.all(expiredFlights.map(flight => store.delete(flight.id)));
    await tx.done;
    
    console.log(`Cleared ${expiredFlights.length} expired flight cache entries`);
  } catch (error) {
    console.error('Error clearing expired flights:', error);
    throw error;
  }
}

/**
 * Helper function to get cached flight results by origin and destination
 */
export async function getCachedFlightsByRoute(
  db: IDBPDatabase<FlightBookingDB>, 
  origin: string, 
  destination: string
): Promise<CacheEntry[]> {
  try {
    const tx = db.transaction('flights', 'readonly');
    const store = tx.objectStore('flights');
    const originIndex = store.index('by-origin');
    
    // Get all flights from the origin
    const originFlights = await originIndex.getAll(origin);
    
    // Filter for the destination
    return originFlights.filter(flight => 
      flight.searchParams.destination === destination &&
      flight.expiresAt > Date.now() // Only return non-expired results
    );
  } catch (error) {
    console.error('Error getting cached flights by route:', error);
    throw error;
  }
}

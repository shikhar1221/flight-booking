import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FlightBookingDB extends DBSchema {
  flights: {
    key: string;
    value: {
      id: string;
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
      results: any[];
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
  bookings: {
    key: string;
    value: {
      id: string;
      flightId: string;
      userId: string;
      data: any;
      timestamp: number;
    };
    indexes: { 'by-user': string };
  };
}

const DB_NAME = 'flight-booking-system';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<FlightBookingDB>> {
  return openDB<FlightBookingDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create flights store
      if (!db.objectStoreNames.contains('flights')) {
        const flightStore = db.createObjectStore('flights', { keyPath: 'id' });
        flightStore.createIndex('by-timestamp', 'timestamp');
      }

      // Create bookings store
      if (!db.objectStoreNames.contains('bookings')) {
        const bookingStore = db.createObjectStore('bookings', { keyPath: 'id' });
        bookingStore.createIndex('by-user', 'userId');
      }
    },
  });
}

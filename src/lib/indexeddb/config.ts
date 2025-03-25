import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define types for better type safety
export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';
export type BookingStatus = 'draft' | 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PassengerType = 'adult' | 'child' | 'infant';

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
  cabinClass: CabinClass;
}

export interface FlightResult {
  id: string;
  airline: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  departure_airport: string;
  arrival_airport: string;
  duration: string;
  economy_available_seats: number;
  premium_economy_available_seats: number;
  business_available_seats: number;
  first_available_seats: number;
  economy_price: number;
  premium_economy_price: number;
  business_price: number;
  first_price: number;
}

export interface PassengerDetails {
  type: PassengerType;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: string;
}

export interface ContactDetails {
  email: string;
  phone: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface BookingData {
  passengersDetails: PassengerDetails[];
  contactDetails: ContactDetails;
  selectedSeats?: string[];
  cabinClass: CabinClass;
  totalPrice: number;
  paymentStatus: PaymentStatus;
}

interface FlightBookingDB extends DBSchema {
  flights: {
    key: string;
    value: {
      id: string;
      searchParams: SearchParams;
      results: FlightResult[];
      timestamp: number;
      expiresAt: number; // TTL for cache invalidation
    };
    indexes: { 
      'by-timestamp': number;
      'by-expiry': number;
    };
  };
  bookings: {
    key: string;
    value: {
      id: string;
      flightId: string;
      userId: string;
      bookingReference: string;
      status: BookingStatus;
      data: BookingData;
      createdAt: number;
      updatedAt: number;
    };
    indexes: { 
      'by-user': string;
      'by-status': string;
      'by-reference': string;
    };
  };
}

const DB_NAME = 'flight-booking-system';
const DB_VERSION = 2; // Incremented version for schema updates

export async function initDB(): Promise<IDBPDatabase<FlightBookingDB>> {
  try {
    return openDB<FlightBookingDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<FlightBookingDB>, oldVersion: number, newVersion: number | null) {
        // Create or update flights store
        if (!db.objectStoreNames.contains('flights')) {
          // Create the store first
          const flightStore = db.createObjectStore('flights', { keyPath: 'id' });
          // Then safely create indexes
          flightStore.createIndex('by-timestamp', 'timestamp');
          flightStore.createIndex('by-expiry', 'expiresAt');
        } else if (oldVersion < 2) {
          // Handle upgrade for existing store
          // const flightStore = db.transaction('flights', 'readwrite')
          //   .objectStore('flights');

          // Check if index exists before creating
          // if (!flightStore.indexNames.contains('by-expiry')) {
          //   flightStore.createIndex('by-expiry', 'expiresAt');
          // }
        }

        // Create or update bookings store
        if (!db.objectStoreNames.contains('bookings')) {
          // Create the store first
          const bookingStore = db.createObjectStore('bookings', { keyPath: 'id' });
          // Then safely create indexes
          bookingStore.createIndex('by-user', 'userId');
          bookingStore.createIndex('by-status', 'status');
          bookingStore.createIndex('by-reference', 'bookingReference');
        } else if (oldVersion < 2) {
          // Handle upgrade for existing store
          // const bookingStore = db.transaction('bookings', 'readwrite')
          //   .objectStore('bookings');

          // Check if indexes exist before creating
          // if (!bookingStore.indexNames.contains('by-status')) {
          //   bookingStore.createIndex('by-status', 'status');
          // }
          // if (!bookingStore.indexNames.contains('by-reference')) {
          //   bookingStore.createIndex('by-reference', 'bookingReference');
          // }
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
  } catch (error) {
    console.error('Error clearing expired flights:', error);
    throw error;
  }
}

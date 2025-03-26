import { 
  initDB, 
  CabinClass, 
  FlightResult, 
  SearchParams as ConfigSearchParams,
  BookingStatus,
  PassengerDetails, // Import PassengerDetails from config
  PassengerType // Import PassengerType if it exists in config
} from './config';
import type { Database } from '@/types/supabase';

// Remove the local SearchParams interface and use the one from config
export type { 
  ConfigSearchParams as SearchParams,
  PassengerDetails // Re-export PassengerDetails from config
};
export { BookingStatus };

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
  flightDetails: FlightResult;
  cabinClass: CabinClass;
  totalPrice: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentInfo?: {
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: string;
  };
}

export interface CachedBooking {
  id: string;
  flightId: string;
  userId: string;
  bookingReference: string;
  status: BookingStatus;
  data: BookingData;
  createdAt: number;
  updatedAt: number;
  validUntil: number; // Using validUntil instead of expiresAt to match schema
}

export interface FlightCache {
  id: string;
  searchParams: ConfigSearchParams;
  results: FlightResult[];
  timestamp: number;
  expiresAt: number; // Added expiresAt field
}

class FlightService {
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  private static readonly BOOKING_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Cache flight search results
   */
  async cacheSearchResults(
    searchParams: ConfigSearchParams, 
    results: Database['public']['Tables']['flights']['Row'][]
  ): Promise<void> {
    const db = await initDB();
    const id = this.generateSearchId(searchParams);
    const timestamp = Date.now();

    // Convert database results to FlightResult type
    const convertedResults: FlightResult[] = results.map(flight => ({
      ...flight,
      duration: flight.duration.toString() // Convert number to string
    }));

    await db.put('flights', {
      id,
      searchParams,
      results: convertedResults,
      timestamp,
      expiresAt: timestamp + this.CACHE_DURATION // Add expiration timestamp
    });

    // Clean up old cache entries
    await this.cleanupOldCache();
  }

  /**
   * Get cached flight search results if available and not expired
   */
  async getCachedResults(searchParams: ConfigSearchParams): Promise<FlightResult[] | null> {
    const db = await initDB();
    const id = this.generateSearchId(searchParams);

    const cached = await db.get('flights', id);
    if (!cached) return null;

    // Check if cache is expired using expiresAt
    if (Date.now() >= cached.expiresAt) {
      await db.delete('flights', id);
      return null;
    }

    return cached.results;
  }

  /**
   * Cache booking data for offline access
   */
  static async cacheBooking(
    userId: string, 
    bookingId: string, 
    flightId: string, 
    bookingData: BookingData,
    status: BookingStatus = BookingStatus.PENDING
  ): Promise<void> {
    const db = await initDB();
    const timestamp = Date.now();
    
    // Validate passenger details
    if (!bookingData.passengersDetails.every(passenger => 
      passenger.type && passenger.title && 
      passenger.firstName && passenger.lastName)) {
      throw new Error('Invalid passenger details');
    }
    
    const booking: CachedBooking = {
      id: bookingId,
      userId,
      flightId,
      bookingReference: `BK-${bookingId.slice(0, 8).toUpperCase()}`,
      status,
      data: {
        passengersDetails: bookingData.passengersDetails,
        contactDetails: bookingData.contactDetails,
        flightDetails: bookingData.flightDetails,
        cabinClass: bookingData.cabinClass,
        totalPrice: bookingData.totalPrice,
        paymentStatus: bookingData.paymentStatus,
        ...(bookingData.paymentInfo && { paymentInfo: bookingData.paymentInfo })
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      validUntil: timestamp + FlightService.BOOKING_CACHE_DURATION
    };

    await db.put('bookings', booking);
  }

  /**
   * Get user's cached bookings
   */
  static async getCachedBookings(userId: string): Promise<CachedBooking[]> {
    const db = await initDB();
    const index = db.transaction('bookings').store.index('by-user');
    const rawBookings = await index.getAll(userId);
    
    // Ensure proper typing of the raw bookings
    const bookings = rawBookings.map(booking => booking as CachedBooking);
    
    // Filter out expired bookings
    const currentTime = Date.now();
    return bookings.filter(booking => currentTime < booking.validUntil);
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
    const db = await initDB();
    const rawBooking = await db.get('bookings', bookingId);
    
    if (!rawBooking) return;

    const booking = rawBooking as CachedBooking;
    
    // Validate booking data structure
    if (!booking.data || 
        !Array.isArray(booking.data.passengersDetails) || 
        !booking.data.passengersDetails.every(passenger => 
          passenger.type && passenger.title && 
          passenger.firstName && passenger.lastName) ||
        !booking.data.contactDetails ||
        !booking.data.flightDetails) {
      console.error('Invalid booking data structure:', booking);
      return;
    }

    const updatedBooking: CachedBooking = {
      id: booking.id,
      flightId: booking.flightId,
      userId: booking.userId,
      bookingReference: booking.bookingReference,
      status,
      data: {
        passengersDetails: [...booking.data.passengersDetails],
        contactDetails: { ...booking.data.contactDetails },
        flightDetails: booking.data.flightDetails,
        cabinClass: booking.data.cabinClass,
        totalPrice: booking.data.totalPrice,
        paymentStatus: booking.data.paymentStatus,
        ...(booking.data.paymentInfo && { paymentInfo: booking.data.paymentInfo })
      },
      createdAt: booking.createdAt,
      updatedAt: Date.now(),
      validUntil: booking.validUntil
    };
    
    await db.put('bookings', updatedBooking);
  }

  /**
   * Clean up expired bookings
   */
  private static async cleanupExpiredBookings(): Promise<void> {
    const db = await initDB();
    const tx = db.transaction('bookings', 'readwrite');
    const store = tx.objectStore('bookings');
    const currentTime = Date.now();

    let cursor = await store.openCursor();
    while (cursor) {
      const booking = cursor.value as CachedBooking;
      if (currentTime >= booking.validUntil) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupOldCache(): Promise<void> {
    const db = await initDB();
    const tx = db.transaction('flights', 'readwrite');
    const index = tx.store.index('by-timestamp');
    const currentTime = Date.now();

    let cursor = await index.openCursor();
    while (cursor) {
      if (currentTime >= cursor.value.expiresAt) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }

    // Also cleanup expired bookings
    await FlightService.cleanupExpiredBookings();
  }

  /**
   * Generate a unique ID for the search parameters
   */
  private generateSearchId(params: ConfigSearchParams): string {
    const searchKey = `${params.origin}-${params.destination}-${params.departureDate}-${params.returnDate || ''}-${params.cabinClass}-${params.passengers.adults}-${params.passengers.children}-${params.passengers.infants}`;
    return btoa(searchKey);
  }

  /**
   * Check if IndexedDB is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const db = await initDB();
      await db.close();
      return true;
    } catch (error) {
      console.error('IndexedDB not available:', error);
      return false;
    }
  }
}

export const flightService = new FlightService();

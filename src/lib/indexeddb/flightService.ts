import { initDB } from './config';
import type { Database } from '@/types/supabase';

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
  cabinClass: string;
}

export interface FlightCache {
  id: string;
  searchParams: SearchParams;
  results: Database['public']['Tables']['flights']['Row'][];
  timestamp: number;
}

class FlightService {
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

  /**
   * Cache flight search results
   */
  async cacheSearchResults(searchParams: SearchParams, results: Database['public']['Tables']['flights']['Row'][]): Promise<void> {
    const db = await initDB();
    const id = this.generateSearchId(searchParams);

    await db.put('flights', {
      id,
      searchParams,
      results,
      timestamp: Date.now(),
    });

    // Clean up old cache entries
    await this.cleanupOldCache();
  }

  /**
   * Get cached flight search results if available and not expired
   */
  async getCachedResults(searchParams: SearchParams): Promise<Database['public']['Tables']['flights']['Row'][] | null> {
    const db = await initDB();
    const id = this.generateSearchId(searchParams);

    const cached = await db.get('flights', id);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      await db.delete('flights', id);
      return null;
    }

    return cached.results;
  }

  /**
   * Cache booking data for offline access
   */
  static async cacheBooking(userId: string, bookingId: string, flightId: string, data: any): Promise<void> {
    const db = await initDB();
    await db.put('bookings', {
      id: bookingId,
      userId,
      flightId,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get user's cached bookings
   */
  static async getCachedBookings(userId: string): Promise<any[]> {
    const db = await initDB();
    const index = db.transaction('bookings').store.index('by-user');
    return index.getAll(userId);
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupOldCache(): Promise<void> {
    const db = await initDB();
    const tx = db.transaction('flights', 'readwrite');
    const index = tx.store.index('by-timestamp');
    const expiredTimestamp = Date.now() - this.CACHE_DURATION;

    let cursor = await index.openCursor();
    while (cursor) {
      if (cursor.value.timestamp < expiredTimestamp) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
  }

  /**
   * Generate a unique ID for the search parameters
   */
  private generateSearchId(params: SearchParams): string {
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

// import { initDB } from './config';
// import type { Database } from '@/types/supabase';
// import { CabinClass } from '@/types/flight';

// type DBFlight = Database['public']['Tables']['flights']['Row'];

// // Transform database flight type to match FlightResult type
// interface FlightResult extends Omit<DBFlight, 'duration'> {
//   duration: string; // Convert duration to string format
// }

// export interface SearchParams {
//   origin: string;
//   destination: string;
//   departureDate: string;
//   returnDate?: string;
//   passengers: {
//     adults: number;
//     children: number;
//     infants: number;
//   };
//   cabinClass: CabinClass; // Updated to use CabinClass type
// }

// export interface FlightCache {
//   id: string;
//   searchParams: SearchParams;
//   results: FlightResult[];
//   timestamp: number;
// }

// class FlightService {
//   private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

//   /**
//    * Transform database flight to FlightResult
//    */
//   private transformFlight(flight: DBFlight): FlightResult {
//     return {
//       ...flight,
//       duration: this.formatDuration(flight.duration)
//     };
//   }

//   /**
//    * Format duration from number to string (HH:mm:ss)
//    */
//   private formatDuration(minutes: number): string {
//     const hours = Math.floor(minutes / 60);
//     const mins = minutes % 60;
//     return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
//   }

//   /**
//    * Cache flight search results
//    */
//   async cacheSearchResults(searchParams: SearchParams, flights: DBFlight[]): Promise<void> {
//     const db = await initDB();
//     const id = this.generateSearchId(searchParams);

//     await db.put('flights', {
//       id,
//       searchParams,
//       results: flights.map(flight => this.transformFlight(flight)),
//       timestamp: Date.now(),
//       expiresAt: Date.now() + this.CACHE_DURATION
//     });

//     // Clean up old cache entries
//     await this.cleanupOldCache();
//   }

//   /**
//    * Get cached flight search results if available and not expired
//    */
//   async getCachedResults(searchParams: SearchParams): Promise<FlightResult[] | null> {
//     const db = await initDB();
//     const id = this.generateSearchId(searchParams);

//     const cached = await db.get('flights', id);
//     if (!cached) return null;

//     // Check if cache is expired
//     if (Date.now() > cached.expiresAt) {
//       await db.delete('flights', id);
//       return null;
//     }

//     return cached.results;
//   }

//   /**
//    * Cache booking data for offline access
//    */
//   static async cacheBooking(userId: string, bookingId: string, flightId: string, data: any): Promise<void> {
//     const db = await initDB();
//     await db.put('bookings', {
//       id: bookingId,
//       userId,
//       flightId,
//       data,
//       timestamp: Date.now(),
//     });
//   }

//   /**
//    * Get user's cached bookings
//    */
//   static async getCachedBookings(userId: string): Promise<any[]> {
//     const db = await initDB();
//     const index = db.transaction('bookings').store.index('by-user');
//     return index.getAll(userId);
//   }

//   /**
//    * Clean up expired cache entries
//    */
//   private async cleanupOldCache(): Promise<void> {
//     const db = await initDB();
//     const tx = db.transaction('flights', 'readwrite');
//     const index = tx.store.index('by-timestamp');
//     const expiredTimestamp = Date.now();

//     let cursor = await index.openCursor();
//     while (cursor) {
//       if (cursor.value.expiresAt < expiredTimestamp) {
//         await cursor.delete();
//       }
//       cursor = await cursor.continue();
//     }
//   }

//   /**
//    * Generate a unique ID for the search parameters
//    */
//   private generateSearchId(params: SearchParams): string {
//     const searchKey = `${params.origin}-${params.destination}-${params.departureDate}-${params.returnDate || ''}-${params.cabinClass}-${params.passengers.adults}-${params.passengers.children}-${params.passengers.infants}`;
//     return btoa(searchKey);
//   }

//   /**
//    * Check if IndexedDB is available
//    */
//   async isAvailable(): Promise<boolean> {
//     try {
//       const db = await initDB();
//       await db.close();
//       return true;
//     } catch (error) {
//       console.error('IndexedDB not available:', error);
//       return false;
//     }
//   }
// }

// export const flightService = new FlightService();

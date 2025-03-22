import { Database } from '../../types/supabase';

type Flight = Database['public']['Tables']['flights']['Row'];

interface SearchParams {
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
  sortBy?: 'price' | 'duration' | 'departureTime';
  sortOrder?: 'asc' | 'desc';
  priceRange?: {
    min: number;
    max: number;
  };
  airlines?: string[];
}

class FlightSearchWorkerService {
  private worker: Worker | null = null;

  private initWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('../../workers/flightSearch.worker.ts', import.meta.url));
    }
    return this.worker;
  }

  async searchFlights(flights: Flight[], searchParams: SearchParams): Promise<Flight[]> {
    const worker = this.initWorker();

    return new Promise((resolve, reject) => {
      worker.onmessage = (event: MessageEvent) => {
        if (event.data.type === 'SUCCESS') {
          resolve(event.data.flights);
        } else {
          reject(new Error(event.data.error));
        }
      };

      worker.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`));
      };

      worker.postMessage({ flights, searchParams });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const flightSearchWorkerService = new FlightSearchWorkerService();

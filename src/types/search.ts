import { CabinClass } from '@/lib/indexeddb/config';

export interface Passengers {
  adults: number;
  children: number;
  infants: number;
}

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  cabinClass: CabinClass;
  passengers: Passengers;
}
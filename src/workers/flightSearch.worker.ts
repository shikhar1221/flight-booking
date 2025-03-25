import { Database } from '../types/supabase';

type Flight = Database['public']['Tables']['flights']['Row'];
type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

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
  cabinClass: CabinClass;
  sortBy?: 'price' | 'duration' | 'departureTime';
  sortOrder?: 'asc' | 'desc';
  priceRange?: {
    min: number;
    max: number;
  };
  airlines?: string[];
  // maxStops removed as it's not in the database schema
}

// Helper function to get available seats for a cabin class
const getAvailableSeats = (flight: Flight, cabinClass: CabinClass): number => {
  const seatsKey = `${cabinClass}_available_seats` as keyof Flight;
  return flight[seatsKey] as number || 0;
};

// Helper function to get price for a cabin class
const getPrice = (flight: Flight, cabinClass: CabinClass): number => {
  const priceKey = `${cabinClass}_price` as keyof Flight;
  return flight[priceKey] as number || 0;
};

const filterFlights = (flights: Flight[], params: SearchParams): Flight[] => {
  const totalPassengers = params.passengers.adults + params.passengers.children + params.passengers.infants;

  return flights.filter(flight => {
    // Basic criteria
    const matchesRoute = flight.departure_airport === params.origin && 
                        flight.arrival_airport === params.destination;
    const hasAvailableSeats = getAvailableSeats(flight, params.cabinClass) >= totalPassengers;
    const matchesDate = new Date(flight.departure_time).toDateString() === new Date(params.departureDate).toDateString();

    // Price range
    let matchesPrice = true;
    if (params.priceRange) {
      const price = getPrice(flight, params.cabinClass);
      matchesPrice = price >= params.priceRange.min && price <= params.priceRange.max;
    }

    // Airlines
    const matchesAirline = !params.airlines?.length || params.airlines.includes(flight.airline);

    // Note: Stops functionality removed as it's not supported in the current database schema
    return matchesRoute && hasAvailableSeats && matchesDate && matchesPrice && matchesAirline;
  });
};

const sortFlights = (flights: Flight[], params: SearchParams): Flight[] => {
  const sortBy = params.sortBy || 'price';
  const sortOrder = params.sortOrder || 'asc';
  
  return [...flights].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'price':
        comparison = getPrice(a, params.cabinClass) - getPrice(b, params.cabinClass);
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
      case 'departureTime':
        comparison = new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

// Web Worker message handler
self.onmessage = (event: MessageEvent<{ flights: Flight[]; searchParams: SearchParams }>) => {
  try {
    const { flights, searchParams } = event.data;
    
    // Filter flights based on search criteria
    let filteredFlights = filterFlights(flights, searchParams);
    
    // Sort filtered results
    filteredFlights = sortFlights(filteredFlights, searchParams);

    // Send back the results
    self.postMessage({
      type: 'SUCCESS',
      flights: filteredFlights
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

// Required for TypeScript to recognize this as a module
export {};

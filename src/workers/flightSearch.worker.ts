import { Database } from '../types/supabase';

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

const filterFlights = (flights: Flight[], params: SearchParams): Flight[] => {
  const totalPassengers = params.passengers.adults + params.passengers.children + params.passengers.infants;

  return flights.filter(flight => {
    // Basic criteria
    const matchesRoute = flight.departure_airport === params.origin && 
                        flight.arrival_airport === params.destination;
    const hasAvailableSeats = flight.available_seats[params.cabinClass as keyof typeof flight.available_seats] >= totalPassengers;
    const matchesDate = new Date(flight.departure_time).toDateString() === new Date(params.departureDate).toDateString();

    // Price range
    const matchesPrice = !params.priceRange || 
                        (flight.price >= params.priceRange.min && flight.price <= params.priceRange.max);

    // Airlines
    const matchesAirline = !params.airlines?.length || params.airlines.includes(flight.airline);

    return matchesRoute && hasAvailableSeats && matchesDate && matchesPrice && matchesAirline;
  });
};

const sortFlights = (flights: Flight[], sortBy: string = 'price', sortOrder: 'asc' | 'desc' = 'asc'): Flight[] => {
  return [...flights].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'price':
        comparison = a.price - b.price;
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
    
    // Sort filtered results if sort parameters are provided
    if (searchParams.sortBy) {
      filteredFlights = sortFlights(filteredFlights, searchParams.sortBy, searchParams.sortOrder);
    }

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

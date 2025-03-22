type SortField = 'price' | 'duration' | 'departureTime' | 'arrivalTime';
type SortOrder = 'asc' | 'desc';

interface Flight {
  id: string;
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  duration: number;
  price: number;
  available_seats: Record<string, number>;
  status: string;
}

interface FilterCriteria {
  priceRange?: { min: number; max: number };
  airlines?: string[];
  departureTimeRange?: { start: string; end: string };
  cabinClass?: string;
  minimumSeats?: number;
}

interface WorkerMessage {
  type: 'FILTER' | 'SORT';
  data: {
    flights: Flight[];
    criteria?: FilterCriteria;
    sortField?: SortField;
    sortOrder?: SortOrder;
  };
}

// Filter flights based on criteria
function filterFlights(flights: Flight[], criteria: FilterCriteria): Flight[] {
  return flights.filter(flight => {
    // Price range filter
    if (criteria.priceRange) {
      if (flight.price < criteria.priceRange.min || flight.price > criteria.priceRange.max) {
        return false;
      }
    }

    // Airlines filter
    if (criteria.airlines && criteria.airlines.length > 0) {
      if (!criteria.airlines.includes(flight.airline)) {
        return false;
      }
    }

    // Departure time range filter
    if (criteria.departureTimeRange) {
      const departureTime = new Date(flight.departure_time).getTime();
      const startTime = new Date(criteria.departureTimeRange.start).getTime();
      const endTime = new Date(criteria.departureTimeRange.end).getTime();
      if (departureTime < startTime || departureTime > endTime) {
        return false;
      }
    }

    // Available seats filter
    if (criteria.cabinClass && criteria.minimumSeats) {
      if (flight.available_seats[criteria.cabinClass] < criteria.minimumSeats) {
        return false;
      }
    }

    return true;
  });
}

// Sort flights based on field and order
function sortFlights(flights: Flight[], field: SortField, order: SortOrder): Flight[] {
  return [...flights].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
      case 'departureTime':
        comparison = new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
        break;
      case 'arrivalTime':
        comparison = new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime();
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });
}

// Handle messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  try {
    let result: Flight[];

    switch (type) {
      case 'FILTER':
        if (!data.criteria) throw new Error('Filter criteria not provided');
        result = filterFlights(data.flights, data.criteria);
        break;

      case 'SORT':
        if (!data.sortField || !data.sortOrder) throw new Error('Sort parameters not provided');
        result = sortFlights(data.flights, data.sortField, data.sortOrder);
        break;

      default:
        throw new Error('Invalid operation type');
    }

    self.postMessage({ success: true, data: result });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

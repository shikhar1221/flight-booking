export type CabinClass = 'Economy' | 'Premium Economy' | 'Business' | 'First';

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // in minutes
  price: number;
  availableSeats: {
    [key in CabinClass]: number;
  };
}

export interface SearchFilters {
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
  isRoundTrip: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  flightId: string;
  passengers: PassengerInfo[];
  status: BookingStatus;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface PassengerInfo {
  type: 'adult' | 'child' | 'infant';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  specialRequirements?: string;
}

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled';

export type BookingType = 'one-way' | 'round-trip' | 'multi-city';
export type PassengerType = 'adult' | 'child' | 'infant';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface PassengerDetails {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  type?: PassengerType;
  seatNumber?: string;
  fare?: number;
}

export interface BookingFormErrors {
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  type?: string;
  seatNumber?: string;
}

export interface FlightBookingData {
  flight: {
    id: string;
    airline: string;
    flight_number: string;
    departure_time: string;
    arrival_time: string;
    departure_airport: string;
    arrival_airport: string;
    duration: number;
    economy_available_seats: number;
    premium_economy_available_seats: number;
    business_available_seats: number;
    first_available_seats: number;
    economy_price?: number;
    premium_economy_price?: number;
    business_price?: number;
    first_price?: number;
  };
  prices: {
    economy: number;
    premium_economy: number;
    business: number;
    first: number;
  };
}

export interface BookingDetails {
  id?: string;
  userId: string;
  flightId: string;
  bookingType: BookingType;
  isOutbound?: boolean;
  relatedBookingId?: string;
  multiCityGroupId?: string;
  multiCitySequence?: number;
  passengers: PassengerDetails[];
  totalPrice: number;
  status: BookingStatus;
  loyaltyPointsEarned?: number;
  loyaltyTier?: LoyaltyTier;
  createdAt?: string;
  updatedAt?: string;
}

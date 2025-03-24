export interface PassengerDetails {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
}

export interface BookingFormErrors {
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
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
  };
  prices: Array<{
    cabin_class: string;
    price: number;
  }>;
}
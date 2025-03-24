import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase/config';
import { Database } from '../../types/supabase';
import  emailService  from './emailService';

type Flight = Database['public']['Tables']['flights']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

interface MultiCityBookingInput {
  userId: string;
  flights: Flight[];
  passengers: {
    type: 'adult' | 'child' | 'infant';
    first_name: string;
    last_name: string;
    date_of_birth: string;
    passport_number?: string;
    special_requirements?: string;
  }[];
  cabinClass: string;
}

class MultiCityBookingService {
  async createMultiCityBooking(input: MultiCityBookingInput): Promise<Booking[]> {
    const { userId, flights, passengers, cabinClass } = input;

    try {
      // Start a Supabase transaction
      const { data: bookings, error } = await supabase.rpc('create_multi_city_booking', {
        p_user_id: userId,
        p_flight_ids: flights.map(f => f.id),
        p_passengers: passengers,
        p_cabin_class: cabinClass,
        p_multi_city_group_id: uuidv4()
      });

      if (error) throw error;

      // Send email confirmation for multi-city booking
      const userResponse = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (userResponse.error) throw userResponse.error;

      // Send email confirmation
      await emailService.sendBookingConfirmation({
        to: userResponse.data.email,
        bookingIds: bookings.map(b => b.id),
        flightNumbers: flights.map(f => f.flight_number),
        passengerName: `${passengers[0].first_name} ${passengers[0].last_name}`,
        departureAirports: flights.map(f => f.departure_airport),
        arrivalAirports: flights.map(f => f.arrival_airport),
        departureTimes: flights.map(f => f.departure_time)
      });

      return bookings;
    } catch (error) {
      console.error('Error creating multi-city booking:', error);
      throw error;
    }
  }

  async validateMultiCityBooking(input: MultiCityBookingInput): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check if flights are in chronological order
      for (let i = 1; i < input.flights.length; i++) {
        const prevFlight = input.flights[i - 1];
        const currentFlight = input.flights[i];
        
        if (new Date(currentFlight.departure_time) <= new Date(prevFlight.arrival_time)) {
          errors.push(`Invalid flight sequence: Flight ${i + 1} departs before Flight ${i} arrives`);
        }

        // Check if cities connect properly
        if (currentFlight.departure_airport !== prevFlight.arrival_airport) {
          errors.push(`Invalid route: Flight ${i + 1} does not depart from Flight ${i}'s arrival city`);
        }
      }

      // Check seat availability for all flights
      const totalPassengers = input.passengers.length;
      for (const flight of input.flights) {
        const availableSeats = flight.available_seats[input.cabinClass as keyof typeof flight.available_seats];
        if (availableSeats < totalPassengers) {
          errors.push(`Not enough seats available on flight ${flight.flight_number}`);
        }
      }

      // Validate passenger information
      for (const passenger of input.passengers) {
        if (!passenger.first_name || !passenger.last_name || !passenger.date_of_birth) {
          errors.push('Missing required passenger information');
          break;
        }

        // Validate passport for international flights
        const hasInternationalFlight = input.flights.some(
          flight => flight.departure_airport.slice(-2) !== flight.arrival_airport.slice(-2)
        );
        if (hasInternationalFlight && !passenger.passport_number) {
          errors.push('Passport number required for international flights');
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating multi-city booking:', error);
      throw error;
    }
  }

  async getMultiCityBookings(userId: string): Promise<Booking[]> {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .eq('booking_type', 'multi-city')
        .order('multi_city_sequence', { ascending: true });

      if (error) throw error;
      return bookings;
    } catch (error) {
      console.error('Error fetching multi-city bookings:', error);
      throw error;
    }
  }

  async cancelMultiCityBooking(groupId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('multi_city_group_id', groupId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling multi-city booking:', error);
      throw error;
    }
  }
}

export const multiCityBookingService = new MultiCityBookingService();

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { supabase } from '@/lib/supabase/config';
import { useAuth } from '@/contexts/AuthContext';
import EmailService from '@/lib/services/emailService';
import type { Database } from '@/types/supabase';

type Flight = Database['public']['Tables']['flights']['Row'];
type BookingType = 'one-way' | 'round-trip';

type Passenger = {
  type: 'adult' | 'child' | 'infant';
  first_name: string;
  last_name: string;
  date_of_birth: string;
  passport_number?: string;
  special_requirements?: string;
};

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [returnFlight, setReturnFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [bookingType, setBookingType] = useState<BookingType>('one-way');

  // Parse passenger counts from URL
  const passengersParam = searchParams.get('passengers');
  const passengerCounts = passengersParam ? JSON.parse(passengersParam) : { adults: 1, children: 0, infants: 0 };
  const totalPassengers = passengerCounts.adults + passengerCounts.children + passengerCounts.infants;

  // Initialize passenger forms
  useEffect(() => {
    const initialPassengers: Passenger[] = [];
    for (let i = 0; i < passengerCounts.adults; i++) {
      initialPassengers.push({ type: 'adult', first_name: '', last_name: '', date_of_birth: '' });
    }
    for (let i = 0; i < passengerCounts.children; i++) {
      initialPassengers.push({ type: 'child', first_name: '', last_name: '', date_of_birth: '' });
    }
    for (let i = 0; i < passengerCounts.infants; i++) {
      initialPassengers.push({ type: 'infant', first_name: '', last_name: '', date_of_birth: '' });
    }
    setPassengers(initialPassengers);
  }, [passengerCounts.adults, passengerCounts.children, passengerCounts.infants]);

  // Load flight details
  useEffect(() => {
    const loadFlights = async () => {
      try {
        const flightId = searchParams.get('flightId');
        const returnFlightId = searchParams.get('returnFlightId');
        const type = searchParams.get('type') as BookingType || 'one-way';
        setBookingType(type);

        if (!flightId) throw new Error('Flight ID not provided');

        const { data: outboundData, error: outboundError } = await supabase
          .from('flights')
          .select('*')
          .eq('id', flightId)
          .single();

        if (outboundError) throw outboundError;
        if (!outboundData) throw new Error('Flight not found');

        setFlight(outboundData);

        if (type === 'round-trip' && returnFlightId) {
          const { data: returnData, error: returnError } = await supabase
            .from('flights')
            .select('*')
            .eq('id', returnFlightId)
            .single();

          if (returnError) throw returnError;
          if (!returnData) throw new Error('Return flight not found');

          setReturnFlight(returnData);
        }
      } catch (err) {
        console.error('Error loading flights:', err);
        setError('Failed to load flight details');
      } finally {
        setLoading(false);
      }
    };

    loadFlights();
  }, [searchParams]);

  const validatePassenger = (passenger: Passenger, index: number): string[] => {
    const errors: string[] = [];
    const today = new Date();
    const birthDate = new Date(passenger.date_of_birth);

    if (!passenger.first_name.trim()) {
      errors.push('First name is required');
    }

    if (!passenger.last_name.trim()) {
      errors.push('Last name is required');
    }

    if (!passenger.date_of_birth) {
      errors.push('Date of birth is required');
    } else {
      if (passenger.type === 'adult' && today.getFullYear() - birthDate.getFullYear() < 18) {
        errors.push('Adult passengers must be at least 18 years old');
      }
      if (passenger.type === 'child' && (today.getFullYear() - birthDate.getFullYear() < 2 || today.getFullYear() - birthDate.getFullYear() > 11)) {
        errors.push('Child passengers must be between 2 and 11 years old');
      }
      if (passenger.type === 'infant' && today.getFullYear() - birthDate.getFullYear() >= 2) {
        errors.push('Infant passengers must be under 2 years old');
      }
    }

    if (!passenger.passport_number?.trim()) {
      errors.push('Passport number is required for international flights');
    }

    return errors;
  };

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Clear errors for this field when it's changed
    setFormErrors(prev => {
      const updated = { ...prev };
      delete updated[`passenger${index}`];
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flight || !user || (bookingType === 'round-trip' && !returnFlight)) return;

    // Validate all passengers
    const newErrors: Record<string, string[]> = {};
    let hasErrors = false;

    passengers.forEach((passenger, index) => {
      const passengerErrors = validatePassenger(passenger, index);
      if (passengerErrors.length > 0) {
        newErrors[`passenger${index}`] = passengerErrors;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setFormErrors(newErrors);
      setError('Please fix the validation errors before proceeding');
      return;
    }

    setBooking(true);
    setError(null);

    try {
      // Calculate total price based on passenger types and cabin class
      const cabinClass = searchParams.get('cabinClass') || 'Economy';
      const totalPrice = flight.price * (
        passengerCounts.adults +
        (passengerCounts.children * 0.75) + // 25% discount for children
        (passengerCounts.infants * 0.1)     // 90% discount for infants
      );

      // Create booking
      // Create outbound booking
      const { data: outboundBooking, error: outboundError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          flight_id: flight.id,
          passengers: passengers,
          status: 'confirmed',
          total_price: totalPrice,
          cabin_class: cabinClass,
          booking_type: bookingType,
          is_outbound: true
        })
        .select()
        .single();

      if (outboundError) throw outboundError;

      // Create return booking if round-trip
      if (bookingType === 'round-trip' && returnFlight) {
        const { error: returnError } = await supabase
          .from('bookings')
          .insert({
            user_id: user.id,
            flight_id: returnFlight.id,
            passengers: passengers,
            status: 'confirmed',
            total_price: totalPrice,
            cabin_class: cabinClass,
            booking_type: bookingType,
            is_outbound: false,
            related_booking_id: outboundBooking.id
          });

        if (returnError) throw returnError;
      }

      // Update available seats for outbound flight
      const { error: outboundSeatError } = await supabase
        .from('flights')
        .update({
          available_seats: {
            ...flight.available_seats,
            [cabinClass]: flight.available_seats[cabinClass as keyof typeof flight.available_seats] - passengers.length
          }
        })
        .eq('id', flight.id);

      if (outboundSeatError) throw outboundSeatError;

      // Create return booking if round-trip
      if (bookingType === 'round-trip' && returnFlight) {
        // Create return booking
        const { data: returnBooking, error: returnError } = await supabase
          .from('bookings')
          .insert({
            user_id: user.id,
            flight_id: returnFlight.id,
            passengers: passengers,
            status: 'confirmed',
            total_price: totalPrice,
            cabin_class: cabinClass,
            booking_type: bookingType,
            is_outbound: false,
            related_booking_id: outboundBooking.id
          })
          .select()
          .single();

        if (returnError) throw returnError;

        // Update available seats for return flight
        const { error: returnSeatError } = await supabase
          .from('flights')
          .update({
            available_seats: {
              ...returnFlight.available_seats,
              [cabinClass]: returnFlight.available_seats[cabinClass as keyof typeof returnFlight.available_seats] - passengers.length
            }
          })
          .eq('id', returnFlight.id);

        if (returnSeatError) throw returnSeatError;
      }

      // Send booking confirmation email
      await EmailService.sendBookingConfirmation(
        user.email!,
        outboundBooking.id,
        flight.flight_number,
        passengers[0].first_name + ' ' + passengers[0].last_name,
        flight.departure_airport,
        flight.arrival_airport,
        flight.departure_time,
        bookingType === 'round-trip' ? returnFlight?.flight_number : undefined,
        bookingType === 'round-trip' ? returnFlight?.departure_time : undefined
      );

      // Redirect to booking confirmation
      router.push(`/bookings/${outboundBooking.id}`);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedLayout>
    );
  }

  if (!flight) {
    return (
      <ProtectedLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error || 'Flight not found'}</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Booking</h1>

          {error && (
            <div className="mb-8 bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-white shadow sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Flight Details</h2>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setBookingType('one-way')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      bookingType === 'one-way'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    One Way
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingType('round-trip')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      bookingType === 'round-trip'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Round Trip
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Flight Number</p>
                  <p className="font-medium">{flight.flight_number}</p>
                </div>
                <div>
                  <p className="text-gray-500">Airline</p>
                  <p className="font-medium">{flight.airline}</p>
                </div>
                <div>
                  <p className="text-gray-500">From</p>
                  <p className="font-medium">{flight.departure_airport}</p>
                </div>
                <div>
                  <p className="text-gray-500">To</p>
                  <p className="font-medium">{flight.arrival_airport}</p>
                </div>
                <div>
                  <p className="text-gray-500">Departure</p>
                  <p className="font-medium">
                    {new Date(flight.departure_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Arrival</p>
                  <p className="font-medium">
                    {new Date(flight.arrival_time).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {passengers.map((passenger, index) => (
              <div key={index} className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {passenger.type.charAt(0).toUpperCase() + passenger.type.slice(1)} Passenger {index + 1}
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`firstName-${index}`} className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        id={`firstName-${index}`}
                        value={passenger.first_name}
                        onChange={(e) => handlePassengerChange(index, 'first_name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                      {formErrors[`passenger${index}`]?.includes('First name is required') && (
                        <p className="mt-1 text-sm text-red-600">First name is required</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`lastName-${index}`} className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id={`lastName-${index}`}
                        value={passenger.last_name}
                        onChange={(e) => handlePassengerChange(index, 'last_name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                      {formErrors[`passenger${index}`]?.includes('Last name is required') && (
                        <p className="mt-1 text-sm text-red-600">Last name is required</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`dateOfBirth-${index}`} className="block text-sm font-medium text-gray-700">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id={`dateOfBirth-${index}`}
                        value={passenger.date_of_birth}
                        onChange={(e) => handlePassengerChange(index, 'date_of_birth', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                      {formErrors[`passenger${index}`]?.map(error => (
                        error.includes('years old') && (
                          <p key={error} className="mt-1 text-sm text-red-600">{error}</p>
                        )
                      ))}
                    </div>

                    <div>
                      <label htmlFor={`passportNumber-${index}`} className="block text-sm font-medium text-gray-700">
                        Passport Number
                      </label>
                      <input
                        type="text"
                        id={`passportNumber-${index}`}
                        value={passenger.passport_number || ''}
                        onChange={(e) => handlePassengerChange(index, 'passport_number', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {formErrors[`passenger${index}`]?.includes('Passport number is required for international flights') && (
                        <p className="mt-1 text-sm text-red-600">Passport number is required for international flights</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor={`specialRequirements-${index}`} className="block text-sm font-medium text-gray-700">
                        Special Requirements
                      </label>
                      <input
                        type="text"
                        id={`specialRequirements-${index}`}
                        value={passenger.special_requirements || ''}
                        onChange={(e) => handlePassengerChange(index, 'special_requirements', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., Wheelchair assistance, special meal, etc."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={booking}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {booking ? 'Processing...' : 'Complete Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  );
}

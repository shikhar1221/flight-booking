'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { supabase } from '@/lib/supabase/config';
import { useAuth } from '@/contexts/AuthContext';
import EmailService from '@/lib/services/emailService';
import type { Database } from '@/types/supabase';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Flight = Database['public']['Tables']['flights']['Row'];

export default function BookingConfirmationPage() {
  const params = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookingDetails = async () => {
      try {
        if (!user) throw new Error('User not authenticated');
        const bookingId = params.id;

        // Fetch booking details
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .eq('user_id', user.id)
          .single();

        if (bookingError) throw bookingError;
        if (!bookingData) throw new Error('Booking not found');

        setBooking(bookingData);

        // Fetch flight details
        const { data: flightData, error: flightError } = await supabase
          .from('flights')
          .select('*')
          .eq('id', bookingData.flight_id)
          .single();

        if (flightError) throw flightError;
        if (!flightData) throw new Error('Flight not found');

        setFlight(flightData);
      } catch (err) {
        console.error('Error loading booking details:', err);
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    loadBookingDetails();
  }, [params.id, user]);

  const handleDownloadETicket = () => {
    if (!booking || !flight) return;

    // Generate e-ticket content
    const eTicketContent = `
FLIGHT BOOKING CONFIRMATION
--------------------------
Booking Reference: ${booking.id}
Status: ${booking.status}

FLIGHT DETAILS
-------------
Flight Number: ${flight.flight_number}
Airline: ${flight.airline}
From: ${flight.departure_airport}
To: ${flight.arrival_airport}
Departure: ${new Date(flight.departure_time).toLocaleString()}
Arrival: ${new Date(flight.arrival_time).toLocaleString()}

PASSENGER DETAILS
----------------
${booking.passengers.map((p: any, i: number) => `
${i + 1}. ${p.firstName} ${p.lastName}
   Type: ${p.type}
   Passport: ${p.passportNumber || 'N/A'}
   Special Requirements: ${p.specialRequirements || 'None'}
`).join('\n')}

PAYMENT DETAILS
--------------
Total Amount: $${booking.total_price.toFixed(2)}

Thank you for choosing our service!
    `;

    // Create and download the e-ticket file
    const blob = new Blob([eTicketContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `e-ticket-${booking.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCancelBooking = async () => {
    if (!booking || !flight || !user) return;

    try {
      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      // Update available seats
      // const { error: flightError } = await supabase
      //   .from('flights')
      //   .update({
      //     available_seats: {
      //       ...flight.available_seats,
      //       [booking.cabin_class]: flight.available_seats[booking.cabin_class as keyof typeof flight.available_seats] + booking.passengers.length,
      //     },
      //   })
      //   .eq('id', flight.id);

      // if (flightError) throw flightError;

      // Send cancellation email
      await EmailService.sendBookingCancellation(
        user.email!,
        booking.id,
        flight.flight_number,
        booking.passengers[0].name
      );

      // Refresh booking data
      setBooking({ ...booking, status: 'cancelled' });
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking');
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

  if (!booking || !flight) {
    return (
      <ProtectedLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error || 'Booking not found'}</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Booking Confirmation</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              {error && (
                <div className="mb-8 bg-red-50 p-4 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Flight Details</h2>
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
                    <div>
                      <p className="text-gray-500">Total Price</p>
                      <p className="font-medium">${booking.total_price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Passenger Details</h2>
                  <div className="space-y-4">
                    {booking.passengers.map((passenger: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Name</p>
                            <p className="font-medium">{passenger.firstName} {passenger.lastName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Type</p>
                            <p className="font-medium">{passenger.type}</p>
                          </div>
                          {passenger.passportNumber && (
                            <div>
                              <p className="text-gray-500">Passport Number</p>
                              <p className="font-medium">{passenger.passportNumber}</p>
                            </div>
                          )}
                          {passenger.specialRequirements && (
                            <div className="col-span-2">
                              <p className="text-gray-500">Special Requirements</p>
                              <p className="font-medium">{passenger.specialRequirements}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleDownloadETicket}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Download E-Ticket
                  </button>
                  {booking.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={handleCancelBooking}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

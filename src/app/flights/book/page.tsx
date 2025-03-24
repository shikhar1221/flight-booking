'use client';

import { useFlightBooking } from '@/hooks/useFlightBooking';
import { useBookingForm } from '@/hooks/useBookingForm';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import { FlightDetailsCard } from '@/components/booking/FlightDetailsCard';
import { PriceSummary } from '@/components/booking/PriceSummary';
import { PassengerFormField } from '@/components/booking/PassengerFormField';
import { useAuth } from '@/contexts/AuthContext';

export default function FlightBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth(); // Add this hook
  const flightId = searchParams.get('flightId');
  const cabinClass = searchParams.get('cabinClass');
  
  const { data: bookFlight, loading, error: flightError } = useFlightBooking(flightId!, cabinClass!);
  const {
    passengerDetails,
    formErrors,
    isSubmitting,
    bookingError,
    setIsSubmitting,
    setBookingError,
    updatePassengerDetail,
    validateForm
  } = useBookingForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !bookFlight || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setBookingError(null);

      // Ensure user is logged in
      if (!session?.user?.id) {
        throw new Error('Please log in to continue');
      }

      // Calculate total price including GST (18%)
      const cabinPrice = bookFlight.prices.find(
        p => p.cabin_class.toLowerCase() === cabinClass?.toLowerCase()
      )?.price || 0;
      const totalPrice = cabinPrice * 1.18;

      // Format passengers data according to the database schema
      const passengers = [{
        name: `${passengerDetails.title} ${passengerDetails.firstName} ${passengerDetails.lastName}`,
        type: 'adult' as const,
        seat_number: '', // Empty string as null isn't allowed per schema
        fare: cabinPrice
      }];

      // Create booking record matching the exact database schema
      const bookingData = {
        user_id: session.user.id,
        flight_id: bookFlight.flight.id,
        booking_type: searchParams.get('isReturn') === 'true' ? 'round-trip' : 'one-way' as const,
        is_outbound: true,
        related_booking_id: null,
        multi_city_group_id: null,
        multi_city_sequence: null,
        passengers: passengers,
        total_price: totalPrice,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        loyalty_points_earned: Math.floor(totalPrice * 0.1), // 10% of price as points
        loyalty_tier: 'BRONZE' as const
      };

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) throw bookingError;
      if (!booking) throw new Error('Failed to create booking');

      // Redirect to booking confirmation page
      router.push(`/bookings/${booking.id}`);
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rest of the component remains the same...
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-600">Loading flight details...</p>
        </div>
      </div>
    );
  }

  if (flightError || !bookFlight) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertDescription className="flex items-center justify-between">
            <span>{flightError || 'Flight not found'}</span>
            <button 
              onClick={() => router.back()}
              className="px-4 py-2 bg-white text-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2 inline-block" />
              Go Back
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Booking</h1>

          {bookingError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{bookingError}</AlertDescription>
            </Alert>
          )}

          <FlightDetailsCard bookFlight={bookFlight} cabinClass={cabinClass || 'economy'} />

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Passenger Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(passengerDetails).map((field) => (
                  <PassengerFormField
                    key={field}
                    field={field as keyof typeof passengerDetails}
                    value={passengerDetails[field as keyof typeof passengerDetails]}
                    error={formErrors[field as keyof typeof formErrors]}
                    onChange={(value) => updatePassengerDetail(field as keyof typeof passengerDetails, value)}
                  />
                ))}
              </div>

              <PriceSummary
                bookFlight={bookFlight}
                cabinClass={cabinClass || 'economy'}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

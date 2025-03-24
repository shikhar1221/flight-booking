'use client';

import { useFlightBooking } from '@/hooks/useFlightBooking';
import { useBookingForm } from '@/hooks/useBookingForm';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { FlightDetailsCard } from '@/components/booking/FlightDetailsCard';
import { PriceSummary } from '@/components/booking/PriceSummary';
import { PassengerFormField } from '@/components/booking/PassengerFormField';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import EmailService from '@/lib/services/emailService';
import { useToast } from '@/components/ui/use-toast';

type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

export default function FlightBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const { toast } = useToast();

  const flightId = searchParams.get('flightId');
  const cabinClass = (searchParams.get('cabinClass')?.toLowerCase() || '') as CabinClass;
  const passengerCount = {
    adults: parseInt(searchParams.get('adults') || '1'),
    children: parseInt(searchParams.get('children') || '0'),
    infants: parseInt(searchParams.get('infants') || '0'),
  };
  
  const { 
    data: bookFlight, 
    loading, 
    error: flightError, 
    refetch 
  } = useFlightBooking(flightId!, cabinClass);

  const {
    passengerDetails,
    formErrors,
    isSubmitting,
    bookingError,
    setIsSubmitting,
    setBookingError,
    updatePassengerDetail,
    validateForm,
  } = useBookingForm();

  // Get available seats for the selected cabin class
  const getAvailableSeats = () => {
    if (!bookFlight?.flight) return 0;
    return bookFlight.flight[`${cabinClass}_available_seats`] || 0;
  };

  // Get price for the selected cabin class
  const getCabinPrice = () => {
    if (!bookFlight?.flight) return 0;
    return bookFlight.flight[`${cabinClass}_price`] || 0;
  };

  // Set up real-time flight status and availability updates
  useEffect(() => {
    if (!flightId) return;

    const flightUpdates = supabase
      .channel('flight-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'flights',
          filter: `id=eq.${flightId}`
        },
        (payload) => {
          if (payload.new.status) {
            toast({
              title: 'Flight Update',
              description: `Status updated to: ${payload.new.status}`,
              duration: 5000
            });
          }
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(flightUpdates);
    };
  }, [flightId, toast, refetch]);

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

      const availableSeats = getAvailableSeats();
      const cabinPrice = getCabinPrice();

      // Check if enough seats are available
      const totalPassengers = passengerCount.adults + passengerCount.children;
      if (totalPassengers > availableSeats) {
        throw new Error(`Only ${availableSeats} seats available in ${cabinClass.replace('_', ' ')} class`);
      }

      if (!cabinPrice) {
        throw new Error(`Price not available for ${cabinClass.replace('_', ' ')} class`);
      }

      const totalPrice = cabinPrice * 1.18 * totalPassengers;

      // Format passengers data
      const passengers = Array(totalPassengers).fill(null).map((_, index) => ({
        name: index === 0 
          ? `${passengerDetails.title} ${passengerDetails.firstName} ${passengerDetails.lastName}`
          : `Additional Passenger ${index + 1}`,
        type: 'adult' as const,
        cabin_class: cabinClass,
        fare: cabinPrice
      }));

      // Create booking record
      const bookingData = {
        user_id: session.user.id,
        flight_id: bookFlight.flight.id,
        booking_type: searchParams.get('isReturn') === 'true' ? 'round-trip' : 'one-way' as const,
        is_outbound: true,
        related_booking_id: null,
        multi_city_group_id: null,
        multi_city_sequence: null,
        passengers,
        total_price: totalPrice,
        status: 'confirmed' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        loyalty_points_earned: Math.floor(totalPrice * 0.1),
        loyalty_tier: 'BRONZE' as const
      };

      // Start a transaction
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) throw bookingError;
      if (!booking) throw new Error('Failed to create booking');

      // Update available seats for the specific cabin class
      const updateData = {
        [`${cabinClass}_available_seats`]: availableSeats - totalPassengers,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('flights')
        .update(updateData)
        .eq('id', flightId);

      if (updateError) throw updateError;

      // Try to send confirmation email but don't let failure stop the process
    try {
      await EmailService.sendBookingConfirmation(
        passengerDetails.email,
        booking.id,
        bookFlight.flight.flight_number,
        passengers[0].name,
        bookFlight.flight.departure_airport,
        bookFlight.flight.arrival_airport,
        bookFlight.flight.departure_time,
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Show a toast notification about email failure but continue with booking
      toast({
        title: 'Booking Successful',
        description: 'Your booking is confirmed but we could not send the confirmation email. Please check your booking details in your account.',
        duration: 5000,
      });
    }
      // Redirect to booking confirmation
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

  const availableSeats = getAvailableSeats();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
            {availableSeats < 10 && (
              <Alert variant="default" className="w-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Only {availableSeats} seats left in {cabinClass.replace('_', ' ')} class
                </AlertDescription>
              </Alert>
            )}
          </div>

          {bookingError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{bookingError}</AlertDescription>
            </Alert>
          )}

          <FlightDetailsCard 
            bookFlight={bookFlight} 
            cabinClass={cabinClass}
          />

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
                cabinClass={cabinClass}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                passengerCount={passengerCount.adults+passengerCount.children}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
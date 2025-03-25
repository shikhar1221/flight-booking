import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingForm } from '@/hooks/useBookingForm';
import { supabase } from '@/lib/supabase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PriceSummary } from './PriceSummary';
import type { FlightBookingData } from '@/types/booking';
import type { CabinClass } from '@/types/flight';

interface PassengerFormProps {
  flightId: string;
  cabinClass: string;
  passengerCount: number;
}
const getFareForCabinClass = (bookFlight: FlightBookingData | null, cabinClass: string): number => {
  if (!bookFlight?.flight) return 0;
  
  switch (cabinClass) {
    case 'Premium Economy':
      return bookFlight.flight.premium_economy_price || 0;
    case 'Economy':
      return bookFlight.flight.economy_price || 0;
    case 'Business':
      return bookFlight.flight.business_price || 0;
    case 'First':
      return bookFlight.flight.first_price || 0;
    default:
      return 0;
  }
};
export function PassengerForm({ flightId, cabinClass, passengerCount }: PassengerFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [bookFlight, setBookFlight] = useState<FlightBookingData | null>(null);
  
  useEffect(() => {
    const fetchFlightDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('flights')
          .select('*')
          .eq('id', flightId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Flight not found');

        setBookFlight({
          flight: data,
          prices: {
            economy: data.economy_price,
            premium_economy: data.premium_economy_price,
            business: data.business_price,
            first: data.first_price
          }
        });
      } catch (err) {
        setBookingError(err instanceof Error ? err.message : 'Failed to load flight details');
      }
    };

    fetchFlightDetails();
  }, [flightId]);
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
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const bookingData = {
        user_id: user?.id,
        flight_id: flightId,
        booking_type: 'one-way',
        passengers: [{
          ...passengerDetails,
          type: 'adult',
          fare: getFareForCabinClass(bookFlight, cabinClass)
        }],
        total_price: getFareForCabinClass(bookFlight, cabinClass) * passengerCount,
        status: 'pending'
      };

      const { error } = await supabase
        .from('bookings')
        .insert(bookingData);

      if (error) throw error;

      router.push('/bookings/confirmation');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!bookFlight) {
    return null;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Title"
              value={passengerDetails.title}
              onValueChange={(value) => updatePassengerDetail('title', value)}
              options={[
                { label: 'Mr', value: 'mr' },
                { label: 'Mrs', value: 'mrs' },
                { label: 'Ms', value: 'ms' }
              ]}
              error={formErrors.title}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={passengerDetails.firstName}
            onChange={(e:any) => updatePassengerDetail('firstName', e.target.value)}
            error={formErrors.firstName}
          />
          <Input
            label="Last Name"
            value={passengerDetails.lastName}
            onChange={(e:any) => updatePassengerDetail('lastName', e.target.value)}
            error={formErrors.lastName}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={passengerDetails.email}
            onChange={(e:any) => updatePassengerDetail('email', e.target.value)}
            error={formErrors.email}
          />
          <Input
            label="Phone"
            type="tel"
            value={passengerDetails.phone}
            onChange={(e:any) => updatePassengerDetail('phone', e.target.value)}
            error={formErrors.phone}
          />
        </div>

        <Input
          label="Nationality"
          value={passengerDetails.nationality}
          onChange={(e:any) => updatePassengerDetail('nationality', e.target.value)}
          error={formErrors.nationality}
        />

        {bookingError && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4">
            <p>{bookingError}</p>
          </div>
        )}
      </form>
    </div>
  );
}

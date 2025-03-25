'use client';

import { Flight } from '@/types/flight';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/config';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FlightSummary } from './FlightSummary';
import { PassengerForm } from './PassengerForm';


export default function ClientFlightBooking() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const flightId = searchParams.get('flightId');
  const cabinClass = searchParams.get('class') || 'economy';
  const passengers = parseInt(searchParams.get('passengers') || '1', 10);

  useEffect(() => {
    const loadFlight = async () => {
      if (!flightId) {
        setError('No flight selected');
        setLoading(false);
        return;
      }

      try {
        const { data, error: flightError } = await supabase
          .from('flights')
          .select('*')
          .eq('id', flightId)
          .single();

        if (flightError) throw flightError;
        if (!data) throw new Error('Flight not found');

        setFlight(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load flight details');
      } finally {
        setLoading(false);
      }
    };

    loadFlight();
  }, [flightId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error || 'Flight not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Book Flight</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Flight Summary */}
        <div className="lg:col-span-1">
          <FlightSummary
            flight={flight}
            passengers={passengers}
          />
        </div>

        {/* Passenger Forms */}
        <div className="lg:col-span-2">
          <PassengerForm
            flightId={flight.id}
            cabinClass={cabinClass}
            passengerCount={passengers}
          />
        </div>
      </div>
    </div>
  );
}
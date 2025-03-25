import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/config';
import type { Database } from '@/types/supabase';
import { FlightBookingData } from '@/types/booking';
import { CabinClass } from '@/types/flight';

type Flight = Database['public']['Tables']['flights']['Row'];

const transformFlightData = (flight: Flight): FlightBookingData => {

  return {
    flight: {
      id: flight.id,
      airline: flight.airline,
      flight_number: flight.flight_number,
      departure_time: flight.departure_time,
      arrival_time: flight.arrival_time,
      departure_airport: flight.departure_airport,
      arrival_airport: flight.arrival_airport,
      duration: flight.duration,
      economy_available_seats: flight.economy_available_seats,
      premium_economy_available_seats: flight.premium_economy_available_seats,
      business_available_seats: flight.business_available_seats,
      first_available_seats: flight.first_available_seats,
      economy_price: flight.economy_price,
      premium_economy_price: flight.premium_economy_price,
      business_price: flight.business_price,
      first_price: flight.first_price
    },
    prices: {
      economy: flight.economy_price,
      premium_economy: flight.premium_economy_price,
      business: flight.business_price,
      first: flight.first_price
    }
  };
};

export const useFlightBooking = (flightId: string, cabinClass: CabinClass) => {
  const [data, setData] = useState<FlightBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlightData = async () => {
      try {
        if (!flightId || !cabinClass) {
          throw new Error('Flight ID and cabin class are required');
        }

        const flightResponse = await supabase
          .from('flights')
          .select('*')
          .eq('id', flightId)
          .single();

        if (flightResponse.error) throw flightResponse.error;
        if (!flightResponse.data) throw new Error('Flight not found');

        const transformedData = transformFlightData(flightResponse.data);
        setData(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch flight data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFlightData();
  }, [flightId, cabinClass]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const flightResponse = await supabase
        .from('flights')
        .select('*')
        .eq('id', flightId)
        .single();

      if (flightResponse.error) throw flightResponse.error;
      if (!flightResponse.data) throw new Error('Flight not found');

      const transformedData = transformFlightData(flightResponse.data);
      setData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flight data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch
  };
};

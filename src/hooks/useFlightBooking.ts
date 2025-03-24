import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/config';
import type { Database } from '@/types/supabase';

type Flight = Database['public']['Tables']['flights']['Row'];
type FlightPrice = Database['public']['Tables']['flight_prices']['Row'];

interface FlightBookingData {
  flight: Flight;
  prices: FlightPrice[];
}

export const useFlightBooking = (flightId: string, cabinClass: string) => {
  const [data, setData] = useState<FlightBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlightData = async () => {
      try {
        if (!flightId || !cabinClass) {
          throw new Error('Flight ID and cabin class are required');
        }

        // Fetch flight and price data concurrently
        const [flightResponse, pricesResponse] = await Promise.all([
          supabase
            .from('flights')
            .select('*')
            .eq('id', flightId)
            .single(),
          supabase
            .from('flight_prices')
            .select('*')
            .eq('flight_id', flightId)
            .eq('cabin_class', cabinClass)
        ]);

        // Handle potential errors from either query
        if (flightResponse.error) throw flightResponse.error;
        if (pricesResponse.error) throw pricesResponse.error;
        if (!flightResponse.data) throw new Error('Flight not found');

        setData({
          flight: flightResponse.data,
          prices: pricesResponse.data || []
        });
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
      const [flightResponse, pricesResponse] = await Promise.all([
        supabase
          .from('flights')
          .select('*')
          .eq('id', flightId)
          .single(),
        supabase
          .from('flight_prices')
          .select('*')
          .eq('flight_id', flightId)
          .eq('cabin_class', cabinClass)
      ]);

      if (flightResponse.error) throw flightResponse.error;
      if (pricesResponse.error) throw pricesResponse.error;
      if (!flightResponse.data) throw new Error('Flight not found');

      setData({
        flight: flightResponse.data,
        prices: pricesResponse.data || []
      });
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
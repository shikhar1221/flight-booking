'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/config';
import type { Database } from '@/types/supabase';
import { flightService, type SearchParams } from '@/lib/indexeddb/flightService';

interface FlightData {
  flight: Database['public']['Tables']['flights']['Row'];
  prices: Database['public']['Tables']['flight_prices']['Row'][];
  availableSeats: Record<string, number>;
}
type FlightPrice = Database['public']['Tables']['flight_prices']['Row'];


export function useFlightSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = useCallback(async (searchParams: SearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: flightsData, error: searchError } = await supabase
        .from('flights')
        .select(`
          *,
          flight_prices (*)
        `)
        .eq('departure_airport', searchParams.origin)
        .eq('arrival_airport', searchParams.destination)
        .gte('departure_time', `${searchParams.departureDate}T00:00:00`)
        .lte('departure_time', `${searchParams.departureDate}T23:59:59`);

      if (searchError) throw searchError;

      const transformedFlights = flightsData?.map(flight => ({
        flight,
        prices: flight.flight_prices || [],
        availableSeats: {
          economy: flight.economy_available_seats,
          premium_economy: flight.premium_economy_available_seats,
          business: flight.business_available_seats,
          first: flight.first_available_seats
        }
      })) || [];

      let transformedReturnFlights: FlightData[] = [];

      if (searchParams.returnDate) {
        const { data: returnFlightsData, error: returnError } = await supabase
          .from('flights')
          .select(`
            *,
            flight_prices (*)
          `)
          .eq('departure_airport', searchParams.destination)
          .eq('arrival_airport', searchParams.origin)
          .gte('departure_time', `${searchParams.returnDate}T00:00:00`)
          .lte('departure_time', `${searchParams.returnDate}T23:59:59`);

        if (returnError) throw returnError;

        transformedReturnFlights = returnFlightsData?.map(flight => ({
          flight,
          prices: flight.flight_prices || [],
          availableSeats: {
            economy: flight.economy_available_seats,
            premium_economy: flight.premium_economy_available_seats,
            business: flight.business_available_seats,
            first: flight.first_available_seats
          }
        })) || [];
      }

      return {
        outboundFlights: transformedFlights,
        returnFlights: transformedReturnFlights
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search flights');
      console.error('Error searching flights:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchFlights,
    loading,
    error
  };
}
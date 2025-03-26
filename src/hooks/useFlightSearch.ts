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
  const [outboundFlights, setOutboundFlights] = useState<FlightData[]>([]);
  const [returnFlights, setReturnFlights] = useState<FlightData[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Listen for online/offline status changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const searchFlights = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);

    try {
      // Check for cached results first
      const cachedResults = await flightService.getCachedResults(params);
      if (cachedResults) {
        // setOutboundFlights(cachedResults);
        setLoading(false);
        return;
      }

      // If offline and no cache, show error
      if (isOffline) {
        throw new Error('You are offline and no cached results are available');
      }

      // Perform live search
      const { data: outboundData, error: outboundError } = await supabase
        .from('flights')
        .select('*, flight_prices(*)')
        .eq('departure_airport', params.origin)
        .eq('arrival_airport', params.destination)
        .gte('departure_time', `${params.departureDate}T00:00:00`)
        .lte('departure_time', `${params.departureDate}T23:59:59`)
        .eq('status', 'scheduled');

      console.log(outboundData);
      if (outboundError) throw outboundError;

      // Get return flights if round trip
      let returnData = [];
      if (params.returnDate) {
        const { data: returnFlightsData, error: returnError } = await supabase
          .from('flights')
          .select('*, flight_prices(*)')
          .eq('departure_airport', params.destination)
          .eq('arrival_airport', params.origin)
          .gte('departure_time', `${params.returnDate}T00:00:00`)
          .lte('departure_time', `${params.returnDate}T23:59:59`)
          .eq('status', 'scheduled');

        if (returnError) throw returnError;
        returnData = returnFlightsData || [];
      }

      // Process seat data
      const flightIds = [...(outboundData || []), ...returnData].map(flight => flight.id);
      const { data: seatData, error: seatError } = await supabase
        .from('seat_map')
        .select('*')
        .in('flight_id', flightIds)
        .eq('is_available', true);

      if (seatError) throw seatError;

// Filter flights based on available seats
const filterFlightsBySeats = (flights: Database['public']['Tables']['flights']['Row'][], cabinClass: string) => {
  const requiredSeats = params.passengers.adults + params.passengers.children + params.passengers.infants;
  
  return flights.filter(flight => {
    let availableSeats: number;
    
    switch (cabinClass) {
      case 'Economy':
        availableSeats = flight.economy_available_seats;
        break;
      case 'Premium Economy':
        availableSeats = flight.premium_economy_available_seats;
        break;
      case 'Business':
        availableSeats = flight.business_available_seats;
        break;
      case 'First':
        availableSeats = flight.first_available_seats;
        break;
      default:
        throw new Error(`Invalid cabin class: ${cabinClass}`);
    }
    
    return availableSeats >= requiredSeats;
  });
};

      // Prepare flight data
      // Filter and prepare outbound flights
      const outboundWithSeats = filterFlightsBySeats(outboundData || [], params.cabinClass).map(flight => ({
        flight,
        prices: [
          {
            id: flight.id,
            flight_id: flight.id,
            cabin_class: 'Economy' as const,
            price: flight.economy_price,
            effective_date: flight.departure_time,
            created_at: flight.created_at,
            updated_at: flight.updated_at
          },
          {
            id: flight.id,
            flight_id: flight.id,
            cabin_class: 'Premium Economy' as const,
            price: flight.premium_economy_price,
            effective_date: flight.departure_time,
            created_at: flight.created_at,
            updated_at: flight.updated_at
          },
          {
            id: flight.id,
            flight_id: flight.id,
            cabin_class: 'Business' as const,
            price: flight.business_price,
            effective_date: flight.departure_time,
            created_at: flight.created_at,
            updated_at: flight.updated_at
          },
          {
            id: flight.id,
            flight_id: flight.id,
            cabin_class: 'First' as const,
            price: flight.first_price,
            effective_date: flight.departure_time,
            created_at: flight.created_at,
            updated_at: flight.updated_at
          }
        ] as FlightPrice[],
        availableSeats: {
          economy: flight.economy_available_seats,
          premium_economy: flight.premium_economy_available_seats,
          business: flight.business_available_seats,
          first: flight.first_available_seats
        }
      }));
      
      const returnWithSeats = filterFlightsBySeats(returnData || [], params.cabinClass).map(flight => ({
        flight,
        prices: [
          {
            id: flight.id,
            flight_id: flight.id,
            cabin_class: 'Economy' as const,
            price: flight.economy_price,
            effective_date: flight.departure_time,
            created_at: flight.created_at,
            updated_at: flight.updated_at
          },
          {
            id: flight.id,
            flight_id: flight.id,
            cabin_class: 'Premium Economy' as const,
            price: flight.premium_economy_price,
            effective_date: flight.departure_time,
            created_at: flight.created_at,
            updated_at: flight.updated_at
          },
          {
            id: flight.id,
            flight_id: flight.id,
            cabin_class: 'Business' as const,
            price: flight.business_price,
            effective_date: flight.departure_time,
            created_at: flight.created_at,
            updated_at: flight.updated_at
          },
          {
            id: flight.id,
            flight_id: flight.id,
            cabin_class: 'First' as const,
            price: flight.first_price,
            effective_date: flight.departure_time,
            created_at: flight.created_at,
            updated_at: flight.updated_at
          }
        ] as FlightPrice[],
        availableSeats: {
          economy: flight.economy_available_seats,
          premium_economy: flight.premium_economy_available_seats,
          business: flight.business_available_seats,
          first: flight.first_available_seats
        }
      }));
      // Cache the results
      // await flightService.cacheSearchResults(params, outboundWithSeats);
      setOutboundFlights(outboundWithSeats);
      setReturnFlights(returnWithSeats);

    } catch (err) {
      console.error('Error searching flights:', err);
      setError(err instanceof Error ? err.message : 'Failed to search flights');
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  return {
    searchFlights,
    loading,
    error,
    outboundFlights,
    returnFlights
  };
}
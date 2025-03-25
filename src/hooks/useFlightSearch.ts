import { useState } from 'react';
import { supabase } from '@/lib/supabase/config';
import type { Database } from '@/types/supabase';
import { useFlightCache } from '@/hooks/useIndexedDB';

type Flight = Database['public']['Tables']['flights']['Row'];
type FlightPrice = Database['public']['Tables']['flight_prices']['Row'];
type SeatMap = Database['public']['Tables']['seat_map']['Row'];

export type FlightData = {
  flight: Flight;
  prices: FlightPrice[];
  availableSeats: Record<string, number>;
};

interface SearchParams {
  from: string | null;
  to: string | null;
  departureDate: string | null;
  isRoundTrip: boolean;
}

export function useFlightSearch() {
  const [outboundFlights, setOutboundFlights] = useState<FlightData[]>([]);
  const [returnFlights, setReturnFlights] = useState<FlightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isReady, cacheFlights, getCachedFlights } = useFlightCache();

  const processSeatData = (seatData: SeatMap[]) => {
    return seatData.reduce((acc, seat) => {
      if (!acc[seat.flight_id]) {
        acc[seat.flight_id] = getEmptySeatMap();
      }
      const cabinClass = seat.cabin_class.toLowerCase();
      acc[seat.flight_id][cabinClass] += 1;
      return acc;
    }, {} as Record<string, Record<string, number>>);
  };

  const getEmptySeatMap = () => ({
    economy: 0,
    premium_economy: 0,
    business: 0,
    first: 0
  });

  const searchFlights = async (params: SearchParams) => {
    try {
      setLoading(true);
      setError(null);

      if (!params.from || !params.to || !params.departureDate) {
        throw new Error('Missing required search parameters');
      }

      // Try cached results first
      if (isReady) {
        const cachedData = await getCachedFlights(
          params.from,
          params.to,
          params.departureDate
        );

        if (cachedData) {
          const outboundFlightData = cachedData.flights.map((flight) => ({
            flight,
            prices: cachedData.flightPrices[flight.id] || [],
            availableSeats: processSeatData(
              cachedData.seatData.filter(seat => seat.flight_id === flight.id)
            )
          }));

          const returnFlightData = (cachedData.returnFlights || []).map((flight) => ({
            flight,
            prices: cachedData.flightPrices[flight.id] || [],
            availableSeats: processSeatData(
              cachedData.seatData.filter(seat => seat.flight_id === flight.id)
            )
          }));

          setOutboundFlights(outboundFlightData);
          setReturnFlights(returnFlightData);
          setLoading(false);
          return;
        }
      }

      // Fetch from API if no cache
      const { data: outboundData, error: outboundError } = await supabase
        .from('flights')
        .select('*, flight_prices(*)')
        .eq('departure_airport', params.from)
        .eq('arrival_airport', params.to)
        .eq('status', 'scheduled')
        .order('departure_time', { ascending: true })
        .limit(10);

      if (outboundError) throw outboundError;

      let returnData = [];
      if (params.isRoundTrip) {
        const { data: returnFlightsData, error: returnError } = await supabase
          .from('flights')
          .select('*, flight_prices(*)')
          .eq('departure_airport', params.to)
          .eq('arrival_airport', params.from)
          .eq('status', 'scheduled');

        if (returnError) throw returnError;
        returnData = returnFlightsData || [];
      }

      const flightIds = [...(outboundData || []), ...returnData].map(flight => flight.id);
      const { data: seatData, error: seatError } = await supabase
        .from('seat_map')
        .select('*')
        .in('flight_id', flightIds)
        .eq('is_available', true);

      if (seatError) throw seatError;

      // Cache results
      if (isReady) {
        const flightPrices = [...(outboundData || []), ...returnData].reduce((acc, flight) => {
          acc[flight.id] = flight.flight_prices;
          return acc;
        }, {} as Record<string, FlightPrice[]>);

        await cacheFlights(
          params.from,
          params.to,
          params.departureDate,
          outboundData || [],
          flightPrices,
          seatData || [],
          returnData
        );
      }

      const seatAvailability = processSeatData(seatData || []);

      setOutboundFlights((outboundData || []).map(flight => ({
        flight,
        prices: flight.flight_prices || [],
        availableSeats: seatAvailability[flight.id] || getEmptySeatMap()
      })));

      setReturnFlights(returnData.map(flight => ({
        flight,
        prices: flight.flight_prices || [],
        availableSeats: seatAvailability[flight.id] || getEmptySeatMap()
      })));

    } catch (err: any) {
      setError(err.message || 'Failed to fetch flights');
    } finally {
      setLoading(false);
    }
  };

  return {
    outboundFlights,
    returnFlights,
    loading,
    error,
    searchFlights
  };
}
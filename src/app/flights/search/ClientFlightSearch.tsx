'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/config';
import type { Database } from '@/types/supabase';
import { FlightCard } from '@/components/flights/FlightCard';

type Flight = Database['public']['Tables']['flights']['Row'];
type FlightPrice = Database['public']['Tables']['flight_prices']['Row'];

interface FlightData {
  flight: Flight;
  prices: FlightPrice[];
  availableSeats: Record<string, number>;
}

export default function ClientFlightSearch() {
  const searchParams = useSearchParams();
  const [outboundFlights, setOutboundFlights] = useState<FlightData[]>([]);
  const [returnFlights, setReturnFlights] = useState<FlightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRoundTrip] = useState(searchParams.get('returnDate') !== null);
  const [sortBy, setSortBy] = useState<'departure' | 'price' | 'duration'>('departure');

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        setError(null);

        const outboundSearchParams = {
          from: searchParams.get('from'),
          to: searchParams.get('to'),
          departureDate: searchParams.get('departureDate')
        };

        if (!outboundSearchParams.from || !outboundSearchParams.to || !outboundSearchParams.departureDate) {
          throw new Error('Missing required search parameters');
        }

        const { data: outboundData, error: outboundError } = await supabase
          .from('flights')
          .select('*, flight_prices(*)')
          .eq('departure_airport', outboundSearchParams.from)
          .eq('arrival_airport', outboundSearchParams.to)
          .eq('status', 'scheduled')
          .order('departure_time', { ascending: true })
          .limit(10);

        if (outboundError) throw outboundError;

        // Get return flights if round trip
        let returnData = [];
        if (isRoundTrip) {
          const { data: returnFlightsData, error: returnError } = await supabase
            .from('flights')
            .select('*, flight_prices(*)')
            .eq('departure_airport', searchParams.get('to'))
            .eq('arrival_airport', searchParams.get('from'))
            .eq('status', 'scheduled');

          if (returnError) throw returnError;
          returnData = returnFlightsData || [];
        }

        // Get seat availability
        const flightIds = [...(outboundData || []), ...returnData].map(flight => flight.id);
        const { data: seatData, error: seatError } = await supabase
          .from('seat_map')
          .select('*')
          .in('flight_id', flightIds)
          .eq('is_available', true);

        if (seatError) throw seatError;

        // Process seat data
        const seatAvailability = seatData.reduce((acc, seat) => {
          if (!acc[seat.flight_id]) {
            acc[seat.flight_id] = {
              economy: 0,
              premium_economy: 0,
              business: 0,
              first: 0
            };
          }
          const cabinClass = seat.cabin_class.toLowerCase();
          acc[seat.flight_id][cabinClass] += 1;
          return acc;
        }, {} as Record<string, { economy: number; premium_economy: number; business: number; first: number }>);

        // Prepare flight data
        const outboundWithSeats = (outboundData || []).map(flight => ({
          flight,
          prices: flight.flight_prices || [],
          availableSeats: seatAvailability[flight.id] || {
            economy: 0,
            premium_economy: 0,
            business: 0,
            first: 0
          }
        }));

        const returnWithSeats = returnData.map(flight => ({
          flight,
          prices: flight.flight_prices || [],
          availableSeats: seatAvailability[flight.id] || {
            economy: 0,
            premium_economy: 0,
            business: 0,
            first: 0
          }
        }));

        setOutboundFlights(outboundWithSeats);
        setReturnFlights(returnWithSeats);
      } catch (err: any) {
        console.error('Error fetching flights:', err);
        setError(err.message || 'Failed to fetch flights');
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchParams, isRoundTrip]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Available Flights</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-1.5 rounded-md border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="departure">Departure Time</option>
                <option value="price">Price</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {searchParams.get('from')} → {searchParams.get('to')} •{' '}
          {new Date(searchParams.get('departureDate') || '').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Flight Grid */}
      <div className="space-y-8">
        {/* Outbound Flights */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Outbound Flights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outboundFlights.map((flightData) => (
              <FlightCard
                key={flightData.flight.id}
                flight={flightData.flight}
                prices={flightData.prices}
                availableSeats={flightData.availableSeats}
              />
            ))}
          </div>
        </div>

        {/* Return Flights */}
        {isRoundTrip && returnFlights.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Return Flights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {returnFlights.map((flightData) => (
                <FlightCard
                  key={flightData.flight.id}
                  flight={flightData.flight}
                  prices={flightData.prices}
                  availableSeats={flightData.availableSeats}
                  isReturn={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

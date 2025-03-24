'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { supabase } from '@/lib/supabase/config';
import type { Database } from '@/types/supabase';
import { FlightCard } from '@/components/flights/FlightCard';

type Flight = Database['public']['Tables']['flights']['Row'];
type FlightPrice = Database['public']['Tables']['flight_prices']['Row'];
type SeatMap = Database['public']['Tables']['seat_map']['Row'];

export default function FlightSearchPage() {
  const searchParams = useSearchParams();
  const [outboundFlights, setOutboundFlights] = useState<{ flight: Flight; prices: FlightPrice[]; availableSeats: Record<string, number> }[]>([]);
  const [returnFlights, setReturnFlights] = useState<{ flight: Flight; prices: FlightPrice[]; availableSeats: Record<string, number> }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRoundTrip] = useState(searchParams.get('returnDate') !== null);
  const [sortBy, setSortBy] = useState<'departure' | 'price' | 'duration'>('departure');

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get outbound flights with prices
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
  // .gte('departure_time', new Date(outboundSearchParams.departureDate).toISOString())
  // .lte('departure_time', new Date(outboundSearchParams.departureDate).toISOString())
  .eq('status', 'scheduled')
  .order('departure_time', { ascending: true })
  .limit(10);

if (outboundError) {
  console.error('Error fetching outbound flights:', outboundError);
  throw outboundError;
}

if (!outboundData || outboundData.length === 0) {
  console.log('No outbound flights found');
  return;
}

console.log('Fetched outbound flights:', outboundData.length);

        // Get return flights if round trip
        let returnData = [];
        if (isRoundTrip) {
          const { data: returnFlightsData, error: returnError } = await supabase
            .from('flights')
            .select('*, flight_prices(*)')
            .eq('departure_airport', searchParams.get('to'))
            .eq('arrival_airport', searchParams.get('from'))
            // .gte('departure_time', searchParams.get('returnDate'))
            // .lte('departure_time', searchParams.get('returnDate'))
            .eq('status', 'scheduled');

          if (returnError) throw returnError;
          returnData = returnFlightsData || [];
        }

        // Get seat availability for all flights
        const flightIds = [...(outboundData || []), ...(returnData || [])].map(flight => flight.id);
        const { data: seatData, error: seatError } = await supabase
          .from('seat_map')
          .select('*')
          .in('flight_id', flightIds)
          .eq('is_available', true);

        if (seatError) throw seatError;

        // Process seat data to create availability map
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

        // Filter flights based on seat availability and cabin class
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

        const returnWithSeats = (returnData || []).map(flight => ({
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
      } catch (err:any) {
        setError(err.message || 'Failed to fetch flights');
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchParams]);

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  if (error) {
    return (
      <ProtectedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-600">{error}</div>
        </div>
      </ProtectedLayout>
    );
  }
  return (
    <ProtectedLayout>
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
    </ProtectedLayout>
  );
}
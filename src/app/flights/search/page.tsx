'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { supabase } from '@/lib/supabase/config';
import type { Database } from '@/types/supabase';

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Available Flights</h1>
          <p className="mt-1 text-sm text-gray-500">
            {searchParams.get('from')} → {searchParams.get('to')} •{' '}
            {new Date(searchParams.get('departureDate') || '').toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
  
        {outboundFlights.length === 0 ? (
          <div className="text-gray-500">No outbound flights available for your search criteria.</div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Outbound Flights</h2>
            {outboundFlights.map((flightData) => {
              const selectedClass = (searchParams.get('cabinClass') || 'economy').toLowerCase();
              const price = flightData.prices.find(p => p.cabin_class.toLowerCase() === selectedClass)?.price || 0;
              const availableSeats = flightData.availableSeats[selectedClass] || 0;
  
              return (
                <div
                  key={flightData.flight.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {flightData.flight.airline}
                      </div>
                      <div className="text-sm text-gray-500">
                        {flightData.flight.flight_number}
                      </div>
                    </div>
                    <div className="text-gray-500">
                      {new Date(flightData.flight.departure_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-gray-600">From</div>
                      <div className="font-medium">{flightData.flight.departure_airport}</div>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div>
                      <div className="text-gray-600">To</div>
                      <div className="font-medium">{flightData.flight.arrival_airport}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">
                      Duration: {Math.floor(flightData.flight.duration / 60)}h {flightData.flight.duration % 60}m
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Available seats in {selectedClass}:
                      {availableSeats}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      ₹{price}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
  
        {isRoundTrip && returnFlights.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Return Flights</h2>
            <p className="text-sm text-gray-500 mb-4">
              {searchParams.get('to')} → {searchParams.get('from')} •{' '}
              {new Date(searchParams.get('returnDate') || '').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <div className="space-y-4">
              {returnFlights.map((flightData) => {
                const selectedClass = (searchParams.get('cabinClass') || 'economy').toLowerCase();
                const price = flightData.prices.find(p => p.cabin_class.toLowerCase() === selectedClass)?.price || 0;
                const availableSeats = flightData.availableSeats[selectedClass] || 0;
  
                return (
                  <div
                    key={flightData.flight.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {flightData.flight.airline}
                        </div>
                        <div className="text-sm text-gray-500">
                          {flightData.flight.flight_number}
                        </div>
                      </div>
                      <div className="text-gray-500">
                        {new Date(flightData.flight.departure_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <div className="text-gray-600">From</div>
                        <div className="font-medium">{flightData.flight.departure_airport}</div>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div>
                        <div className="text-gray-600">To</div>
                        <div className="font-medium">{flightData.flight.arrival_airport}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-500">
                        Duration: {Math.floor(flightData.flight.duration / 60)}h {flightData.flight.duration % 60}m
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Available seats in {selectedClass}:
                        {availableSeats}
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        ₹{price}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { supabase } from '@/lib/supabase/config';
import type { Database } from '@/types/supabase';

type Flight = Database['public']['Tables']['flights']['Row'];

export default function FlightSearchPage() {
  const searchParams = useSearchParams();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchFlights = async () => {
      try {
        const origin = searchParams.get('origin');
        const destination = searchParams.get('destination');
        const departureDate = searchParams.get('departureDate');
        const cabinClass = searchParams.get('cabinClass');

        let query = supabase
          .from('flights')
          .select('*')
          .eq('departure_airport', origin)
          .eq('arrival_airport', destination)
          .gte('departure_time', `${departureDate}T00:00:00`)
          .lte('departure_time', `${departureDate}T23:59:59`)
          .gt(`available_seats->>${cabinClass}`, 0);

        const { data, error } = await query;

        if (error) throw error;
        setFlights(data || []);
      } catch (err) {
        console.error('Error searching flights:', err);
        setError('Failed to load flights');
      } finally {
        setLoading(false);
      }
    };

    if (searchParams.get('origin')) {
      searchFlights();
    }
  }, [searchParams]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Available Flights</h1>
          <p className="mt-1 text-sm text-gray-500">
            {searchParams.get('origin')} → {searchParams.get('destination')} •{' '}
            {new Date(searchParams.get('departureDate') || '').toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : flights.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No flights found for your search criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flights.map((flight) => (
              <div
                key={flight.id}
                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">{flight.airline}</p>
                      <p className="text-xs text-gray-400">Flight {flight.flight_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        ${flight.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">per passenger</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-lg font-semibold">{formatDate(flight.departure_time)}</p>
                      <p className="text-sm text-gray-500">{flight.departure_airport}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-sm text-gray-500">{formatDuration(flight.duration)}</p>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-white px-2 text-sm text-gray-500">Direct</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-lg font-semibold">{formatDate(flight.arrival_time)}</p>
                      <p className="text-sm text-gray-500">{flight.arrival_airport}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {flight.available_seats[searchParams.get('cabinClass') as keyof typeof flight.available_seats]} seats available in {searchParams.get('cabinClass')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const bookingParams = new URLSearchParams({
                          flightId: flight.id,
                          ...Object.fromEntries(searchParams.entries()),
                        });
                        window.location.href = `/flights/book?${bookingParams.toString()}`;
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Select Flight
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

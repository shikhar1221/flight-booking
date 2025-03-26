'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { useFlightWorker } from '@/hooks/useFlightWorker';
import { FlightCard } from '@/components/flights/FlightCard';
import type { Database } from '@/types/supabase';
import { SortField } from '@/hooks/useFlightWorker';

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
  const [isRoundTrip] = useState(searchParams.get('returnDate') !== null);
  const [sortBy, setSortBy] = useState<SortField>('departureTime');
  const cabinClasses = ['economy', 'premium_economy', 'business', 'first'];
  const [outboundCabin, setOutboundCabin] = useState(cabinClasses[0]);
  const [returnCabin, setReturnCabin] = useState(cabinClasses[0]);
  const cabinClassLabels = {
    economy: 'Economy',
    premium_economy: 'Premium Economy',
    business: 'Business',
    first: 'First'
  };

  // Use the hooks
  const { 
    searchFlights, 
    loading: isSearching, 
    error: searchError, 
    outboundFlights: searchOutboundFlights, 
    returnFlights: searchReturnFlights 
  } = useFlightSearch();
  
  const { 
    filterFlights, 
    sortFlights, 
    processing: isProcessing, 
    error: workerError 
  } = useFlightWorker();

  // Convert search params to SearchParams type with validation
  const searchParamsObj = useMemo(() => {
    const origin = searchParams.get('from') || '';
    const destination = searchParams.get('to') || '';
    const departureDate = searchParams.get('departureDate') || '';
    const returnDate = searchParams.get('returnDate') || '';
    const cabinClass = searchParams.get('cabinClass') || 'Economy';
    
    if (!origin || !destination || !departureDate) {
      throw new Error('Missing required search parameters');
    }

    return {
      origin,
      destination,
      departureDate,
      returnDate,
      cabinClass,
      passengers: {
        adults: parseInt(searchParams.get('adults') || '1'),
        children: parseInt(searchParams.get('children') || '0'),
        infants: parseInt(searchParams.get('infants') || '0')
      }
    };
  }, [searchParams]);

  useEffect(() => {
    // Search for flights when parameters change
    const search = async () => {
      setLoading(true);
      try {
        await searchFlights(searchParamsObj);
      } catch (error) {
        console.error('Error searching flights:', error);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [searchParamsObj, searchFlights]);

  const handleSort = async (field: SortField) => {
    setSortBy(field);
    if (searchOutboundFlights.length > 0) {
      try {
        setLoading(true);
        const sortedFlights = await sortFlights(searchOutboundFlights.map(f => f.flight), field, 'asc');
        
        // Convert sorted flights back to FlightData format
        const sortedFlightData = sortedFlights.map(flight => {
          const originalFlightData = searchOutboundFlights.find(fd => fd.flight.id === flight.id);
          return {
            flight,
            prices: originalFlightData?.prices || [],
            availableSeats: originalFlightData?.availableSeats || {
              economy: 0,
              premium_economy: 0,
              business: 0,
              first: 0
            }
          };
        });
  
        setOutboundFlights(sortedFlightData);
      } catch (error) {
        console.error('Error sorting flights:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
                onChange={(e) => handleSort(e.target.value as SortField)}
                className="px-3 py-1.5 rounded-md border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="departureTime">Departure Time</option>
                <option value="price">Price</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {searchParams.get('from')} → {searchParams.get('to')} •{' '}
          {formatDate(searchParams.get('departureDate') || '')}
          {isRoundTrip && ` • ${formatDate(searchParams.get('returnDate') || '')}`}
        </div>
      </div>

      {/* Cabin Selection */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {/* Outbound Cabin Selection */}
          <div className="border-r border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Outbound Cabin Class</h3>
              <div className="flex space-x-4">
                {cabinClasses.map((cabin) => (
                  <button
                    key={cabin}
                    onClick={() => setOutboundCabin(cabin)}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                      outboundCabin === cabin
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cabinClassLabels[cabin as keyof typeof cabinClassLabels]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Return Cabin Selection */}
          {isRoundTrip && (
            <div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Return Cabin Class</h3>
                <div className="flex space-x-4">
                  {cabinClasses.map((cabin) => (
                    <button
                      key={cabin}
                      onClick={() => setReturnCabin(cabin)}
                      className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                        returnCabin === cabin
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cabinClassLabels[cabin as keyof typeof cabinClassLabels]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {(loading || isSearching || isProcessing) && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Searching for flights...</p>
        </div>
      )}

      {/* Error State */}
      {searchError || workerError ? (
        <div className="text-center py-12">
          <div className="text-red-600 text-lg">{searchError || workerError}</div>
          <button 
            onClick={() => searchFlights(searchParamsObj)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {/* Outbound Column */}
            <div className="border-r border-gray-100">
              <div className="p-8 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Outbound Flights</h2>
                {searchOutboundFlights.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No outbound flights found for your search criteria.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchOutboundFlights.map((flightData) => (
                      <FlightCard
                        key={flightData.flight.id}
                        flight={flightData.flight}
                        prices={flightData.prices}
                        availableSeats={flightData.availableSeats}
                        selectedCabin={outboundCabin}
                        isReturn={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Return Column */}
            <div className="border-r border-gray-100">
              <div className="p-8 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Return Flights</h2>
                {searchReturnFlights.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No return flights found for your search criteria.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchReturnFlights.map((flightData) => (
                      <FlightCard
                        key={flightData.flight.id}
                        flight={flightData.flight}
                        prices={flightData.prices}
                        availableSeats={flightData.availableSeats}
                        selectedCabin={returnCabin}
                        isReturn={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
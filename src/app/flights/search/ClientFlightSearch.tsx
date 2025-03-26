'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { useFlightWorker, SortField } from '@/hooks/useFlightWorker';
import { FlightCard } from '@/components/flights/FlightCard';
import type { Database } from '@/types/supabase';

type Flight = Database['public']['Tables']['flights']['Row'];
type FlightPrice = Database['public']['Tables']['flight_prices']['Row'];
import { CabinClass } from '@/lib/indexeddb/config';
import type { SearchParams } from '@/types/search';

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
  const cabinClasses = [
    CabinClass.Economy,
    CabinClass.PremiumEconomy,
    CabinClass.Business,
    CabinClass.First
  ];
  const [outboundCabin, setOutboundCabin] = useState(cabinClasses[0]);
  const [returnCabin, setReturnCabin] = useState(cabinClasses[0]);
  const cabinClassLabels = {
    [CabinClass.Economy]: 'Economy',
    [CabinClass.PremiumEconomy]: 'Premium Economy',
    [CabinClass.Business]: 'Business',
    [CabinClass.First]: 'First'
  };

  // Convert search params to SearchParams type with validation
  const searchParamsObj = useMemo(() => {
    const origin = searchParams.get('from') || '';
    const destination = searchParams.get('to') || '';
    const departureDate = searchParams.get('departureDate') || '';
    const returnDate = searchParams.get('returnDate') || '';
    const rawCabinClass = searchParams.get('cabinClass')?.toUpperCase() || 'ECONOMY';
    
    // Map the raw cabin class to enum
    const cabinClass = CabinClass[rawCabinClass as keyof typeof CabinClass] || CabinClass.Economy;
    
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
    } satisfies SearchParams;
  }, [searchParams]);

  // Use the hooks
  const { 
    searchFlights, 
    loading: isSearching, 
    error: searchError
  } = useFlightSearch();
  
  const { 
    filterFlights, 
    sortFlights, 
    processing: isProcessing, 
    error: workerError 
  } = useFlightWorker();

  // Add initial loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      try {
        const result = await searchFlights(searchParamsObj);
        if (result) {
          console.log('Flight results:', result); // Add this debug log
          setOutboundFlights(result.outboundFlights);
          setReturnFlights(result.returnFlights);
        }
      } catch (error) {
        console.error('Error searching flights:', error);
      } finally {
        setLoading(false);
        setIsInitialLoading(false);
      }
    };
    search();
  }, [searchParamsObj, searchFlights]);

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="text-xl text-gray-600">Loading flights...</p>
      </div>
    );
  }

  const handleSort = async (field: SortField) => {
    setSortBy(field);
    try {
      setLoading(true);
      
      // Sort outbound flights
      if (outboundFlights.length > 0) {
        const sortedOutbound = await sortFlights(
          outboundFlights.map(f => f.flight),
          field,
          'asc'
        );
        const sortedOutboundData = sortedOutbound.map(flight => ({
          flight,
          prices: outboundFlights.find(fd => fd.flight.id === flight.id)?.prices || [],
          availableSeats: outboundFlights.find(fd => fd.flight.id === flight.id)?.availableSeats || {
            economy: 0,
            premium_economy: 0,
            business: 0,
            first: 0
          }
        }));
        setOutboundFlights(sortedOutboundData);
      }

      // Sort return flights
      if (isRoundTrip && returnFlights.length > 0) {
        const sortedReturn = await sortFlights(
          returnFlights.map(f => f.flight),
          field,
          'asc'
        );
        const sortedReturnData = sortedReturn.map(flight => ({
          flight,
          prices: returnFlights.find(fd => fd.flight.id === flight.id)?.prices || [],
          availableSeats: returnFlights.find(fd => fd.flight.id === flight.id)?.availableSeats || {
            economy: 0,
            premium_economy: 0,
            business: 0,
            first: 0
          }
        }));
        setReturnFlights(sortedReturnData);
      }
    } catch (error) {
      console.error('Error sorting flights:', error);
    } finally {
      setLoading(false);
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
                className="px-3 py-1.5 rounded-md border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
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
          <div className={`grid grid-cols-1 ${isRoundTrip ? 'md:grid-cols-2' : 'md:max-w-3xl md:mx-auto'} gap-8`}>
            {/* Outbound Column */}
            <div className={`${isRoundTrip ? 'border-r border-gray-100' : ''}`}>
              <div className="p-8 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Outbound Flights</h2>
                {outboundFlights.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No outbound flights found for your search criteria.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {outboundFlights.map((flightData) => (
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
            {isRoundTrip && (
              <div>
                <div className="p-8 bg-white rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Return Flights</h2>
                  {returnFlights.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No return flights found for your search criteria.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {returnFlights.map((flightData) => (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
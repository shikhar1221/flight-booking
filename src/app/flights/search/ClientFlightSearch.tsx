'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { FlightSearchHeader } from '@/components/flights/FlightSearchHeader';
import { FlightGrid } from '@/components/flights/FlightGrid';

export default function ClientFlightSearch() {
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<'departure' | 'price' | 'duration'>('departure');
  const isRoundTrip = searchParams.get('returnDate') !== null;
  
  const {
    outboundFlights,
    returnFlights,
    loading,
    error,
    searchFlights
  } = useFlightSearch();

  useEffect(() => {
    searchFlights({
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      departureDate: searchParams.get('departureDate'),
      isRoundTrip
    });
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
      <FlightSearchHeader
        searchParams={searchParams}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="space-y-8">
        <FlightGrid
          title="Outbound Flights"
          flights={outboundFlights}
        />

        {isRoundTrip && returnFlights.length > 0 && (
          <FlightGrid
            title="Return Flights"
            flights={returnFlights}
            isReturn
          />
        )}
      </div>
    </div>
  );
}
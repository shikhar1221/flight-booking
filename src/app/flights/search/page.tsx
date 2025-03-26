'use client';

import { Suspense } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import ClientFlightSearch from './ClientFlightSearch';
import { SearchHeader } from '@/components/flights/SearchHeader';

export default function FlightSearchPage() {
  return (
    <ProtectedLayout>
      <div className="container mx-auto px-4 py-8">
        <SearchHeader />
        
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Searching for flights...</p>
            </div>
          }
        >
          <ClientFlightSearch />
        </Suspense>
      </div>
    </ProtectedLayout>
  );
}
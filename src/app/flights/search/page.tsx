'use client';

import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import ClientFlightSearch from './ClientFlightSearch';
import { SearchHeader } from '@/components/flights/SearchHeader';

export default function FlightSearchPage() {
  return (
    <ProtectedLayout>
      <div className="container mx-auto px-4 py-8">
        <SearchHeader />
        <ClientFlightSearch />
      </div>
    </ProtectedLayout>
  );
}
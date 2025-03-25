import { Suspense } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import ClientFlightSearch from './ClientFlightSearch';

export default function FlightSearchPage() {
  return (
    <ProtectedLayout>
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        }
      >
        <ClientFlightSearch />
      </Suspense>
    </ProtectedLayout>
  );
}

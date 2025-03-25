import { Suspense } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import ClientFlightBooking from './ClientFlightBooking';
import { Loader2 } from 'lucide-react';

export default function FlightBookPage() {
  return (
    <ProtectedLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-gray-600">Loading flight details...</p>
            </div>
          </div>
        }
      >
        <ClientFlightBooking />
      </Suspense>
    </ProtectedLayout>
  );
}
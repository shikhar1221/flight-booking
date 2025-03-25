import { Suspense } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import ClientBookings from './ClientBookings';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function BookingsPage() {
  return (
    <ProtectedLayout>
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <LoadingSpinner />
            </div>
          </div>
        }
      >
        <ClientBookings />
      </Suspense>
    </ProtectedLayout>
  );
}

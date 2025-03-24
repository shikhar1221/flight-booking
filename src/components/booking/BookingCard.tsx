'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { BookingWithFlight } from '@/app/bookings/page';

interface BookingCardProps {
  booking: BookingWithFlight;
  onClick: () => void;
}

export function BookingCard({ booking, onClick }: BookingCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    onClick();
    router.push(`/bookings/${booking.id}`);
  };

  if (!booking || !booking.flight) {
    return null;
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {booking.flights?.flight_number || 'N/A'}
          </h3>
          <p className="text-sm text-gray-500">
            {booking.flights?.airline || 'N/A'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {booking.created_at 
              ? format(new Date(booking.created_at), 'dd MMM yyyy')
              : 'N/A'
            }
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-gray-600">
        <p>
          {booking.flights?.departure_airport || 'N/A'} → 
          {booking.flights?.arrival_airport || 'N/A'}
        </p>
        <p className="font-medium text-primary">
          ₹{(booking.total_price || 0).toLocaleString('en-IN')}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
          {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'N/A'}
        </span>
        <span className="text-sm text-gray-500">
          {(booking.passengers?.length || 0)} passenger(s)
        </span>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
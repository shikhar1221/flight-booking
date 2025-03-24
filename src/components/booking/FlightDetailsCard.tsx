import { FlightBookingData } from '@/types/booking';
import { Plane, Clock } from 'lucide-react';

interface FlightDetailsCardProps {
  bookFlight: FlightBookingData;
  cabinClass: string;
}

export const FlightDetailsCard = ({ bookFlight, cabinClass }: FlightDetailsCardProps) => {
  const price = bookFlight.prices.find(
    p => p.cabin_class.toLowerCase() === cabinClass?.toLowerCase()
  )?.price || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Plane className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold text-gray-900">{bookFlight.flight.airline}</h3>
          </div>
          <p className="text-gray-500 text-sm">{bookFlight.flight.flight_number}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">
            ₹{price.toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-gray-500">Per passenger</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-gray-900">
            {new Date(bookFlight.flight.departure_time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="text-gray-600">{bookFlight.flight.departure_airport}</p>
        </div>
        <div className="text-center px-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span>
              {Math.floor(bookFlight.flight.duration / 60)}h {bookFlight.flight.duration % 60}m
            </span>
          </div>
          <div className="mt-1 flex items-center">
            <div className="h-0.5 w-24 bg-gray-300"></div>
            <div className="mx-2">
              <Plane className="h-4 w-4 text-primary transform rotate-90" />
            </div>
            <div className="h-0.5 w-24 bg-gray-300"></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Non-stop</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-2xl font-semibold text-gray-900">
            {new Date(bookFlight.flight.arrival_time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="text-gray-600">{bookFlight.flight.arrival_airport}</p>
        </div>
      </div>
    </div>
  );
};
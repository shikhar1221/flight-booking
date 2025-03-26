import { FlightBookingData } from '@/types/booking';
import { Plane, Clock, Calendar, MapPin, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { CabinClass } from '@/types/flight';


interface FlightDetailsCardProps {
  bookFlight: FlightBookingData;
  getCabinClass: CabinClass;
  price:number;
}
type DbCabinClass = 'economy' | 'premium_economy' | 'business' | 'first';


const cabinClassToDbField = (cabinClass: CabinClass): DbCabinClass => {
  switch (cabinClass) {
    case 'Premium Economy':
      return 'premium_economy';
    case 'Economy':
      return 'economy';
    case 'Business':
      return 'business';
    case 'First':
      return 'first';
  }
};

export const FlightDetailsCard = ({ bookFlight, getCabinClass, price }: FlightDetailsCardProps) => {
  const cabinClass= cabinClassToDbField(getCabinClass);

  const getPrice = () => {
    return price;
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) {
      // Calculate duration from departure and arrival times
      const departure = new Date(bookFlight.flight.departure_time);
      const arrival = new Date(bookFlight.flight.arrival_time);
      const diffInMinutes = Math.round((arrival.getTime() - departure.getTime()) / (1000 * 60));
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
    
    // Split the time string into hours, minutes
    const [hours, minutes] = duration.toString().split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    return `${h}h ${m}m`;
  };


  const getFlightDate = (dateString: string) => {
    return format(new Date(dateString), 'EEE, MMM d');
  };

  const getAvailableSeats = () => {
    const seatKey = `${cabinClass}_available_seats` as keyof typeof bookFlight.flight;
    return bookFlight.flight[seatKey] || 0;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <Plane className="h-6 w-6" />
              <h3 className="text-2xl font-bold">{bookFlight.flight.airline}</h3>
            </div>
            <p className="text-blue-100 font-medium">{bookFlight.flight.flight_number}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">
              ₹{getPrice().toLocaleString('en-IN')}
            </p>
            <p className="text-blue-100">Per passenger</p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-blue-500 text-sm font-medium">
          {getCabinClass}
        </div>
      </div>

      {/* Flight Details Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{getFlightDate(bookFlight.flight.departure_time)}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{formatDuration(bookFlight.flight.duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between relative">
          {/* Departure */}
          <div className="flex-1">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {new Date(bookFlight.flight.departure_time).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <div className="flex items-center space-x-1 text-gray-500">
                <MapPin className="h-4 w-4" />
                <p className="font-medium">{bookFlight.flight.departure_airport}</p>
              </div>
            </div>
          </div>

          {/* Flight Path */}
          <div className="flex-1 flex items-center justify-center relative px-4">
            <div className="h-0.5 w-full bg-gray-300 absolute"></div>
            <div className="bg-black p-2 rounded-full border-2 border-primary z-10">
              <Plane className="h-5 w-5 text-primary transform rotate-90" />
            </div>
          </div>

          {/* Arrival */}
          <div className="flex-1 text-right">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {new Date(bookFlight.flight.arrival_time).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <div className="flex items-center justify-end space-x-1 text-gray-500">
                <MapPin className="h-4 w-4" />
                <p className="font-medium">{bookFlight.flight.arrival_airport}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-gray-600">
              <Tag className="h-4 w-4" />
              <span>Available seats in {getCabinClass}:</span>
            </div>
            <span className="text-lg font-bold text-black bg-gray-100 px-2 py-1 rounded-full">
              {getAvailableSeats()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

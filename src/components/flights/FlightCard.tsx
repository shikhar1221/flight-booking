// components/flights/FlightCard.tsx
import { useRouter } from 'next/navigation';
import { Database } from '@/types/supabase';
type FlightPrice = Database['public']['Tables']['flight_prices']['Row'];
type Flight = Database['public']['Tables']['flights']['Row'];

interface FlightCardProps {
  flight: Flight;
  prices: FlightPrice[];
  availableSeats: Record<string, number>;
  selectedCabin: string;
  isReturn?: boolean;
  className?: string;
}

const cabinClasses = ['economy', 'premium_economy', 'business', 'first'];
const cabinClassLabels = {
  economy: 'Economy',
  premium_economy: 'Premium Economy',
  business: 'Business',
  first: 'First'
};

type PriceKey = `${Lowercase<string>}_price`;
type FlightPriceKeys = keyof Pick<Flight, 'economy_price' | 'premium_economy_price' | 'business_price' | 'first_price'>;

export function FlightCard({ flight, prices, availableSeats, selectedCabin, isReturn = false, className = '' }: FlightCardProps) {
  const router = useRouter();

  // Update the price selection logic with proper type checking
  const selectedPrice = prices.find(p => 
    p.cabin_class.toLowerCase() === selectedCabin.toLowerCase()
  )?.price || flight[`${selectedCabin.toLowerCase()}_price` as FlightPriceKeys] || 0;
  const selectedAvailableSeats = availableSeats[selectedCabin.toLowerCase()] || 0;

  const handleCardClick = () => {
    const params = new URLSearchParams();
    params.append('flightId', flight.id);
    params.append('cabinClass', selectedCabin);
    params.append('price', selectedPrice.toString());
    params.append('isReturn', isReturn.toString());

    router.push(`/flights/book?${params.toString()}`);
  };

  // Add duration formatting helper
  const formatDuration = (duration: string) => {
    if (!duration) return '0h';
    
    // Remove leading zeros and get hours and minutes
    const cleanTime = duration.replace(/^0+/, '');
    const [hours, minutes] = cleanTime.split(':');
    const numHours = parseInt(hours || '0', 10);
    const numMinutes = parseInt(minutes || '0', 10);
    
    if (numHours === 0 && numMinutes === 0) return '0h';
    return numMinutes > 0 ? `${numHours}h ${numMinutes}m` : `${numHours}h`;
  };

  // Add duration calculation helper
  const calculateDuration = () => {
    const departure = new Date(flight.departure_time);
    const arrival = new Date(flight.arrival_time);
    const diffInMinutes = Math.round((arrival.getTime() - departure.getTime()) / (1000 * 60));
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  const flightDuration = flight.duration || calculateDuration();

  return (
    <div
      className={`group bg-green-50 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Flight Details */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <img 
              src="/favicon.ico" 
              alt={flight.airline} 
              className="w-10 h-10 rounded-full bg-white p-1"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{flight.airline}</h3>
              <p className="text-sm text-gray-500">{flight.flight_number}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {flightDuration}
          </div>
        </div>
  
        {/* Cabin Class Display */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium">
              {cabinClassLabels[selectedCabin as keyof typeof cabinClassLabels]}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {selectedAvailableSeats} seats available
          </div>
        </div>
  
        {/* Flight Times */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col items-center space-y-2">
            <div className="text-sm text-gray-500">
              {new Date(flight.departure_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(flight.departure_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full">
                <span className="text-sm font-medium text-gray-600">{flightDuration}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="text-sm text-gray-500">
              {new Date(flight.arrival_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(flight.arrival_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
  
        {/* Price Display */}
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
            ₹{selectedPrice.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            {selectedAvailableSeats} seats available
          </div>
        </div>
      </div>
    </div>
  );
}
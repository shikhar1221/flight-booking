// components/flights/FlightCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Database } from '@/types/supabase';
import { Loader2 } from 'lucide-react';

type Flight = Database['public']['Tables']['flights']['Row'];
type FlightPrice = Database['public']['Tables']['flight_prices']['Row'];

interface FlightCardProps {
  flight: Flight;
  prices: FlightPrice[];
  availableSeats: Record<string, number>;
  isReturn?: boolean;
}

export function FlightCard({ flight, prices, availableSeats, isReturn = false }: FlightCardProps) {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<string>('economy');
  const [isLoading, setIsLoading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const selectedPrice = prices.find(p => p.cabin_class.toLowerCase() === selectedClass.toLowerCase())?.price || 0;
  const selectedAvailableSeats = availableSeats[selectedClass.toLowerCase()] || 0;
  const cabinClasses = ['economy', 'premium_economy', 'business', 'first'];
  const selectedClassIndex = cabinClasses.indexOf(selectedClass);

  const handleBooking = async () => {
    if (selectedAvailableSeats === 0) {
      alert('No available seats in selected class');
      return;
    }

    setIsLoading(true);
    try {
      const passengerCounts = {
        adults: 1,
        children: 0,
        infants: 0
      };

      const searchParams = new URLSearchParams(window.location.search);
      const returnDate = searchParams.get('returnDate');

      const params = new URLSearchParams({
        flightId: flight.id,
        cabinClass: selectedClass,
        passengers: JSON.stringify(passengerCounts),
        isReturn: isReturn.toString(),
        ...(returnDate && { returnDate })
      });

      router.push(`/flights/book?${params.toString()}`);
    } catch (error) {
      alert('Failed to book flight. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isBooked) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-500">Booked</h3>
            <p className="text-gray-600">Thank you for your booking</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleBooking}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{flight.airline}</h3>
          <p className="text-gray-600">{flight.flight_number}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            ₹{selectedPrice.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Per adult</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="font-medium">{new Date(flight.departure_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p className="text-gray-600">{flight.departure_airport}</p>
        </div>
        <div className="text-gray-500">
          <p>{flight.duration}</p>
          <p className="text-sm">Non-stop</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{new Date(flight.arrival_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p className="text-gray-600">{flight.arrival_airport}</p>
        </div>
      </div>

      <div className="flex justify-between text-sm text-gray-600">
        <div>
          <p>Available Seats</p>
          <p className="font-medium">{selectedAvailableSeats} {selectedClass}</p>
        </div>
        <div className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
          {flight.status}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Select Cabin Class</span>
        </div>
        <div className="flex space-x-2 overflow-x-auto">
          {cabinClasses.map((cabinClass, index) => (
            <button
              key={cabinClass}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedClass(cabinClass);
              }}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                selectedClassIndex === index 
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              aria-selected={selectedClassIndex === index}
              aria-label={`Select ${cabinClass.replace('_', ' ')} cabin`}
            >
              {cabinClass.replace('_', ' ')}
              {selectedClassIndex === index && (
                <span className="ml-1 text-blue-200">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
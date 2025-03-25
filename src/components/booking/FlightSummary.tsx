import { Flight } from '@/types/flight';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Plane, Calendar, Clock } from 'lucide-react';

// type CabinClass = 'economy' | 'premiumEconomy' | 'business' | 'first';

interface FlightSummaryProps {
  flight: Flight;
  // cabinClass: CabinClass;
  passengers: number;
}

export function FlightSummary({ flight, passengers }: FlightSummaryProps) {
  const basePrice = flight.price;
  const totalPrice = basePrice * passengers;
  const taxes = totalPrice * 0.18; // 18% GST
  const finalPrice = totalPrice + taxes;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Flight Summary</h2>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <Plane className="w-5 h-5 mr-2" />
          <div>
            <p className="font-medium">{flight.airline}</p>
            <p className="text-sm text-gray-600">{flight.flightNumber}</p>
          </div>
        </div>

        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          <div>
            <p className="font-medium">
              {new Date(flight.departureTime).toLocaleDateString()}
            </p>
            <div className="flex items-center text-sm text-gray-600">
              <p>{flight.departureAirport}</p>
              <span className="mx-2">→</span>
              <p>{flight.arrivalAirport}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          <div>
            <p className="font-medium">Duration</p>
            <p className="text-sm text-gray-600">{formatDuration(flight.duration)}</p>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-2">Price Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base Fare ({passengers} passengers)</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes & Fees</span>
              <span>{formatCurrency(taxes)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(finalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
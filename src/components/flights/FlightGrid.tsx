import { FlightCard } from '@/components/flights/FlightCard';
import type { FlightData } from '@/hooks/useFlightSearch';

interface FlightGridProps {
  title: string;
  flights: FlightData[];
  isReturn?: boolean;
}

export function FlightGrid({ title, flights, isReturn = false }: FlightGridProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flights.map((flightData) => (
          <FlightCard
            key={flightData.flight.id}
            flight={flightData.flight}
            prices={flightData.prices}
            availableSeats={flightData.availableSeats}
            isReturn={isReturn}
          />
        ))}
      </div>
    </div>
  );
}
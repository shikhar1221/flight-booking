import { useEffect, useState } from 'react';
import { flightRecommendationService } from '@/lib/services/flightRecommendationService';
import { Database } from '@/types/supabase';

type Flight = Database['public']['Tables']['flights']['Row'];

interface FlightRecommendationsProps {
  origin: string;
  destination: string;
  preferredDate: Date;
  maxPriceDifference?: number;
  maxDateDifference?: number;
  cabinClass: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  onSelectFlight?: (flight: Flight) => void;
  className?: string;
}

export default function FlightRecommendations({
  origin,
  destination,
  preferredDate,
  maxPriceDifference,
  maxDateDifference,
  cabinClass,
  passengers,
  onSelectFlight,
  className = ''
}: FlightRecommendationsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{
    flight: Flight;
    reasons: Array<{
      type: string;
      description: string;
      savingsAmount?: number;
      pointsEarned?: number;
    }>;
    score: number;
  }>>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        const results = await flightRecommendationService.getRecommendations({
          origin,
          destination,
          preferredDate,
          maxPriceDifference,
          maxDateDifference,
          cabinClass,
          passengers
        });

        setRecommendations(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [origin, destination, preferredDate, maxPriceDifference, maxDateDifference, cabinClass, passengers]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-32"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 rounded-lg bg-red-50">
        {error}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center">
        No alternative flights found matching your criteria.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Recommended Alternatives</h3>
      {recommendations.map(({ flight, reasons, score }) => (
        <div
          key={flight.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900">
                {flight.airline} - Flight {flight.flight_number}
              </h4>
              <div className="mt-1 text-sm text-gray-600">
                {new Date(flight.departure_time).toLocaleString()} -{' '}
                {new Date(flight.arrival_time).toLocaleString()}
              </div>
              <div className="mt-2 space-y-1">
                {reasons.map((reason, index) => (
                  <div
                    key={index}
                    className={`text-sm flex items-center ${
                      reason.type === 'BETTER_PRICE'
                        ? 'text-green-600'
                        : reason.type === 'LOYALTY_POINTS'
                        ? 'text-purple-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {reason.type === 'BETTER_PRICE' && (
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {reason.description}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                ${flight.price.toLocaleString()}
              </div>
              <button
                onClick={() => onSelectFlight?.(flight)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Select
              </button>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Match Score</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
                <span className="ml-2">{Math.round(score)}%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

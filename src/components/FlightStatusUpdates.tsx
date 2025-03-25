import { useEffect, useState } from 'react';
import { flightStatusService, FlightStatus } from '@/lib/services/flightStatusService';

interface FlightStatusUpdatesProps {
  flightId: string;
  initialStatus?: FlightStatus;
  className?: string;
}

export default function FlightStatusUpdates({ 
  flightId, 
  initialStatus = 'ON_TIME', 
  className = '' 
}: FlightStatusUpdatesProps) {
  const [status, setStatus] = useState<FlightStatus>(initialStatus);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Subscribe to flight status updates
      const unsubscribe = flightStatusService.subscribeToFlightStatus(flightId, (update) => {
        setStatus(update.status);
        setLastUpdate(update.updatedAt);
        setError(null);
      });

      // Cleanup subscription on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to flight updates');
    }
  }, [flightId]);

  const { text: statusText, color: statusColor } = flightStatusService.formatStatus(status);

  return (
    <div className={`rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Flight Status</h3>
          <p className={`text-lg font-semibold ${statusColor}`}>{statusText}</p>
        </div>
        {lastUpdate && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Last Updated</p>
            <p className="text-sm text-gray-700">
              {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

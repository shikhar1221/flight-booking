'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/config';
import type { Database } from '@/types/supabase';

type Flight = Database['public']['Tables']['flights']['Row'];
type FlightUpdate = {
  flightId: string;
  status: 'ON_TIME' | 'DELAYED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED';
  message: string;
  timestamp: string;
};

interface Props {
  flightId: string;
  onStatusChange?: (update: FlightUpdate) => void;
}

export default function FlightStatusUpdates({ flightId, onStatusChange }: Props) {
  const [updates, setUpdates] = useState<FlightUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource;

    const setupSSE = () => {
      // Connect to our SSE endpoint
      eventSource = new EventSource(`/api/flights/${flightId}/status`);

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          const update: FlightUpdate = JSON.parse(event.data);
          setUpdates(prev => [update, ...prev].slice(0, 5)); // Keep last 5 updates
          if (onStatusChange) {
            onStatusChange(update);
          }
        } catch (err) {
          console.error('Error parsing flight update:', err);
        }
      };

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        setError('Lost connection to flight updates. Retrying...');
        eventSource.close();
        // Attempt to reconnect after 5 seconds
        setTimeout(setupSSE, 5000);
      };
    };

    // Set up real-time subscription using Supabase
    const subscription = supabase
      .channel(`flight-${flightId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'flights',
          filter: `id=eq.${flightId}`,
        },
        (payload) => {
          const flight = payload.new as Flight;
          const update: FlightUpdate = {
            flightId: flight.id,
            status: flight.status,
            message: `Flight ${flight.flight_number} status updated to ${flight.status}`,
            timestamp: new Date().toISOString(),
          };
          setUpdates(prev => [update, ...prev].slice(0, 5));
          if (onStatusChange) {
            onStatusChange(update);
          }
        }
      )
      .subscribe();

    // Initialize SSE connection
    setupSSE();

    // Cleanup
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      subscription.unsubscribe();
    };
  }, [flightId, onStatusChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Flight Status Updates</h3>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        {updates.length === 0 ? (
          <p className="text-sm text-gray-500">No recent updates</p>
        ) : (
          updates.map((update, index) => (
            <div
              key={index}
              className={`p-4 rounded-md ${
                update.status === 'ON_TIME' ? 'bg-green-50' :
                update.status === 'DELAYED' ? 'bg-yellow-50' :
                update.status === 'CANCELLED' ? 'bg-red-50' :
                'bg-blue-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-medium ${
                    update.status === 'ON_TIME' ? 'text-green-800' :
                    update.status === 'DELAYED' ? 'text-yellow-800' :
                    update.status === 'CANCELLED' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {update.status.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{update.message}</p>
                </div>
                <time className="text-xs text-gray-500">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </time>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

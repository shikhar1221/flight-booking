'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Database } from '@/types/supabase';

type Flight = Database['public']['Tables']['flights']['Row'];
type FlightPrice = Database['public']['Tables']['flight_prices']['Row'];

interface FilterCriteria {
  priceRange?: { min: number; max: number };
  airlines?: string[];
  departureTimeRange?: { start: string; end: string };
  cabinClass?: string;
  minimumSeats?: number;
}

export type SortField = 'price' | 'duration' | 'departureTime' | 'arrivalTime';
type SortOrder = 'asc' | 'desc';

export function useFlightWorker() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize worker
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Worker) {
      const flightWorker = new Worker(new URL('../workers/flightWorker.ts', import.meta.url));
      
      flightWorker.onerror = (error) => {
        console.error('Worker error:', error);
        setError('An error occurred while processing flight data');
        setProcessing(false);
      };

      setWorker(flightWorker);

      return () => {
        flightWorker.terminate();
      };
    }
  }, []);

  // Filter flights using worker
  const filterFlights = useCallback(
    (flights: Flight[], criteria: FilterCriteria): Promise<Flight[]> => {
      if (!worker) {
        return Promise.reject(new Error('Web Worker not available'));
      }

      return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          worker.removeEventListener('message', handleMessage);
          setProcessing(false);

          if (event.data.success) {
            resolve(event.data.data);
          } else {
            setError(event.data.error);
            reject(new Error(event.data.error));
          }
        };

        worker.addEventListener('message', handleMessage);
        setProcessing(true);
        worker.postMessage({ type: 'filter', data: { flights, criteria } });
      });
    },
    [worker]
  );

  // Sort flights using worker
  const sortFlights = useCallback(
    (flights: Flight[], field: SortField, order: SortOrder): Promise<Flight[]> => {
      if (!worker) {
        return Promise.reject(new Error('Web Worker not available'));
      }

      return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          worker.removeEventListener('message', handleMessage);
          setProcessing(false);

          if (event.data.success) {
            resolve(event.data.data);
          } else {
            setError(event.data.error);
            reject(new Error(event.data.error));
          }
        };

        worker.addEventListener('message', handleMessage);
        setProcessing(true);
        worker.postMessage({ type: 'sort', data: { flights, field, order } });
      });
    },
    [worker]
  );

  return {
    filterFlights,
    sortFlights,
    processing,
    error
  };
}
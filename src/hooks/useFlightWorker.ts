'use client';

import { useState, useEffect, useCallback } from 'react';

interface Flight {
  id: string;
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  duration: number;
  price: number;
  available_seats: Record<string, number>;
  status: string;
}

interface FilterCriteria {
  priceRange?: { min: number; max: number };
  airlines?: string[];
  departureTimeRange?: { start: string; end: string };
  cabinClass?: string;
  minimumSeats?: number;
}

type SortField = 'price' | 'duration' | 'departureTime' | 'arrivalTime';
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

      setProcessing(true);
      setError(null);

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
        worker.postMessage({
          type: 'FILTER',
          data: { flights, criteria },
        });
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

      setProcessing(true);
      setError(null);

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
        worker.postMessage({
          type: 'SORT',
          data: { flights, sortField: field, sortOrder: order },
        });
      });
    },
    [worker]
  );

  // Process flights (filter and sort)
  const processFlights = useCallback(
    async (
      flights: Flight[],
      criteria?: FilterCriteria,
      sortField?: SortField,
      sortOrder?: SortOrder
    ): Promise<Flight[]> => {
      try {
        let processedFlights = flights;

        // Apply filters if provided
        if (criteria) {
          processedFlights = await filterFlights(processedFlights, criteria);
        }

        // Apply sorting if provided
        if (sortField && sortOrder) {
          processedFlights = await sortFlights(processedFlights, sortField, sortOrder);
        }

        return processedFlights;
      } catch (err) {
        console.error('Error processing flights:', err);
        throw err;
      }
    },
    [filterFlights, sortFlights]
  );

  return {
    processing,
    error,
    filterFlights,
    sortFlights,
    processFlights,
  };
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/config';
import type { Database } from '@/types/supabase';
import { flightService, type SearchParams } from '@/lib/indexeddb/flightService';

export function useFlightSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Database['public']['Tables']['flights']['Row'][]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Listen for online/offline status changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const searchFlights = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);

    try {
      // Check for cached results first
      const cachedResults = await flightService.getCachedResults(params);
      if (cachedResults) {
        setResults(cachedResults);
        setLoading(false);
        return;
      }

      // If offline and no cache, show error
      if (isOffline) {
        throw new Error('You are offline and no cached results are available');
      }

      // Perform live search
      const { data, error } = await supabase
        .from('flights')
        .select('*')
        .eq('departure_airport', params.origin)
        .eq('arrival_airport', params.destination)
        .gte('departure_time', `${params.departureDate}T00:00:00`)
        .lte('departure_time', `${params.departureDate}T23:59:59`)
        .gt(`available_seats->>${params.cabinClass}`, 
          params.passengers.adults + params.passengers.children + params.passengers.infants - 1);

      if (error) throw error;

      // Cache the results
      await flightService.cacheSearchResults(params, data || []);
      setResults(data || []);

    } catch (err) {
      console.error('Error searching flights:', err);
      setError(err instanceof Error ? err.message : 'Failed to search flights');
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  const getFlightById = useCallback(async (flightId: string) => {
    try {
      const { data, error } = await supabase
        .from('flights')
        .select('*')
        .eq('id', flightId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting flight:', err);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    results,
    isOffline,
    searchFlights,
    getFlightById,
  };
}

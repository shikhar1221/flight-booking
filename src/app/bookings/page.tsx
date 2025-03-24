'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { supabase } from '@/lib/supabase/config';
import type { Database } from '@/types/supabase';
import { BookingCard } from '@/components/booking/BookingCard';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Flight = Database['public']['Tables']['flights']['Row'];

export interface BookingWithFlight extends Booking {
  flight: Flight;
}

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialBookings = async () => {
      if (user) {
        await loadBookings();
      }
    };

    loadInitialBookings();
  }, [user]);

  useEffect(() => {
    // Create a Supabase channel for real-time updates
    const channel = supabase
      .channel('bookings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.new) {
            loadBookings();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`*, flights(*)`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Transform the data to ensure consistent structure
      const transformedBookings = (bookingsData || []).map((booking: any) => ({
        ...booking,
        flight: booking.flight || {},
        passengers: booking.passengers || [],
        status: booking.status || 'pending',
        total_price: booking.total_price || 0
      }));

      setBookings(transformedBookings as BookingWithFlight[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

        {loading && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {bookings.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No bookings found</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onClick={() => handleBookingClick(booking.id)}
            />
          ))}
        </div>
      </div>
    </ProtectedLayout>
  );
}
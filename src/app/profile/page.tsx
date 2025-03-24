// frontend/src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <h2 className="text-xl font-semibold mb-2">Not Authenticated</h2>
          <p>Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-white p-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {profile?.full_name?.[0] || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile?.full_name}
              </h1>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-gray-600 mt-2">
                Mobile: {profile?.mobile_number}
              </p>
              <p className="text-gray-600 mt-2">
                Location: {profile?.country}, {profile?.state}
              </p>
              <p className="text-gray-600 mt-2">
                Loyalty Points: {profile?.loyalty_points}
              </p>
              <p className="text-gray-600 mt-2">
                Role: {profile?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
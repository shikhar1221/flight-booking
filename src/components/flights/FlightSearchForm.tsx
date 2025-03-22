'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface FlightSearchFilters {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass: 'Economy' | 'Premium Economy' | 'Business' | 'First';
  isRoundTrip: boolean;
}

const initialFilters: FlightSearchFilters = {
  origin: '',
  destination: '',
  departureDate: '',
  returnDate: '',
  passengers: {
    adults: 1,
    children: 0,
    infants: 0,
  },
  cabinClass: 'Economy',
  isRoundTrip: true,
};

export function FlightSearchForm() {
  const [filters, setFilters] = useState<FlightSearchFilters>(initialFilters);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams({
      origin: filters.origin,
      destination: filters.destination,
      departureDate: filters.departureDate,
      ...(filters.isRoundTrip && filters.returnDate && { returnDate: filters.returnDate }),
      passengers: JSON.stringify(filters.passengers),
      cabinClass: filters.cabinClass,
      isRoundTrip: filters.isRoundTrip.toString(),
    });
    
    router.push(`/flights/search?${searchParams.toString()}`);
  };

  const handlePassengerChange = (type: keyof typeof filters.passengers, value: number) => {
    setFilters((prev) => ({
      ...prev,
      passengers: {
        ...prev.passengers,
        [type]: Math.max(0, value),
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, isRoundTrip: true }))}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filters.isRoundTrip
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Round Trip
        </button>
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, isRoundTrip: false }))}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            !filters.isRoundTrip
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          One Way
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-gray-700">
            From
          </label>
          <input
            type="text"
            id="origin"
            value={filters.origin}
            onChange={(e) => setFilters((prev) => ({ ...prev, origin: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="City or Airport"
            required
          />
        </div>

        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
            To
          </label>
          <input
            type="text"
            id="destination"
            value={filters.destination}
            onChange={(e) => setFilters((prev) => ({ ...prev, destination: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="City or Airport"
            required
          />
        </div>

        <div>
          <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700">
            Departure Date
          </label>
          <input
            type="date"
            id="departureDate"
            value={filters.departureDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, departureDate: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {filters.isRoundTrip && (
          <div>
            <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">
              Return Date
            </label>
            <input
              type="date"
              id="returnDate"
              value={filters.returnDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, returnDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              min={filters.departureDate || new Date().toISOString().split('T')[0]}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Adults (12+ years)</span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handlePassengerChange('adults', filters.passengers.adults - 1)}
                  className="p-1 rounded-md border border-gray-300 hover:bg-gray-100"
                  disabled={filters.passengers.adults <= 1}
                >
                  -
                </button>
                <span className="w-8 text-center">{filters.passengers.adults}</span>
                <button
                  type="button"
                  onClick={() => handlePassengerChange('adults', filters.passengers.adults + 1)}
                  className="p-1 rounded-md border border-gray-300 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Children (2-11 years)</span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handlePassengerChange('children', filters.passengers.children - 1)}
                  className="p-1 rounded-md border border-gray-300 hover:bg-gray-100"
                  disabled={filters.passengers.children <= 0}
                >
                  -
                </button>
                <span className="w-8 text-center">{filters.passengers.children}</span>
                <button
                  type="button"
                  onClick={() => handlePassengerChange('children', filters.passengers.children + 1)}
                  className="p-1 rounded-md border border-gray-300 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Infants (under 2)</span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handlePassengerChange('infants', filters.passengers.infants - 1)}
                  className="p-1 rounded-md border border-gray-300 hover:bg-gray-100"
                  disabled={filters.passengers.infants <= 0}
                >
                  -
                </button>
                <span className="w-8 text-center">{filters.passengers.infants}</span>
                <button
                  type="button"
                  onClick={() => handlePassengerChange('infants', filters.passengers.infants + 1)}
                  className="p-1 rounded-md border border-gray-300 hover:bg-gray-100"
                  disabled={filters.passengers.infants >= filters.passengers.adults}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="cabinClass" className="block text-sm font-medium text-gray-700">
            Cabin Class
          </label>
          <select
            id="cabinClass"
            value={filters.cabinClass}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                cabinClass: e.target.value as FlightSearchFilters['cabinClass'],
              }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="Economy">Economy</option>
            <option value="Premium Economy">Premium Economy</option>
            <option value="Business">Business</option>
            <option value="First">First</option>
          </select>
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Search Flights
        </button>
      </div>
    </form>
  );
}

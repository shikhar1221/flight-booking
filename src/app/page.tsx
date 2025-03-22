"use client";

import { useState } from 'react';
import { SearchFilters, CabinClass } from '@/types/flight';

export default function Home() {
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
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
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement flight search
    console.log('Searching flights with filters:', searchFilters);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Find Your Perfect Flight
            </h1>
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsRoundTrip(true);
                    setSearchFilters(prev => ({ ...prev, isRoundTrip: true }));
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${isRoundTrip ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Round Trip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRoundTrip(false);
                    setSearchFilters(prev => ({ ...prev, isRoundTrip: false, returnDate: undefined }));
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${!isRoundTrip ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
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
                    value={searchFilters.origin}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, origin: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter city or airport"
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
                    value={searchFilters.destination}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, destination: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter city or airport"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    id="departureDate"
                    value={searchFilters.departureDate}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, departureDate: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>

                {isRoundTrip && (
                  <div>
                    <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">
                      Return Date
                    </label>
                    <input
                      type="date"
                      id="returnDate"
                      value={searchFilters.returnDate}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, returnDate: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="passengers" className="block text-sm font-medium text-gray-700">
                    Passengers
                  </label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="adults" className="block text-xs text-gray-500">Adults</label>
                      <input
                        type="number"
                        id="adults"
                        min="1"
                        max="9"
                        value={searchFilters.passengers.adults}
                        onChange={(e) => setSearchFilters(prev => ({
                          ...prev,
                          passengers: { ...prev.passengers, adults: parseInt(e.target.value) }
                        }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="children" className="block text-xs text-gray-500">Children</label>
                      <input
                        type="number"
                        id="children"
                        min="0"
                        max="9"
                        value={searchFilters.passengers.children}
                        onChange={(e) => setSearchFilters(prev => ({
                          ...prev,
                          passengers: { ...prev.passengers, children: parseInt(e.target.value) }
                        }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="infants" className="block text-xs text-gray-500">Infants</label>
                      <input
                        type="number"
                        id="infants"
                        min="0"
                        max="9"
                        value={searchFilters.passengers.infants}
                        onChange={(e) => setSearchFilters(prev => ({
                          ...prev,
                          passengers: { ...prev.passengers, infants: parseInt(e.target.value) }
                        }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="cabinClass" className="block text-sm font-medium text-gray-700">
                    Cabin Class
                  </label>
                  <select
                    id="cabinClass"
                    value={searchFilters.cabinClass}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, cabinClass: e.target.value as CabinClass }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business</option>
                    <option value="First">First</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Search Flights
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    cabinClass: 'Economy',
    isRoundTrip: false
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchParamsString = new URLSearchParams({
      from: searchParams.from,
      to: searchParams.to,
      departureDate: searchParams.departureDate,
      ...(searchParams.isRoundTrip && searchParams.returnDate && { returnDate: searchParams.returnDate }),
      passengers: searchParams.passengers.toString(),
      cabinClass: searchParams.cabinClass,
      isRoundTrip: searchParams.isRoundTrip.toString()
    }).toString();
  
    router.push(`/flights/search?${searchParamsString}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect Flight
          </h1>
          <p className="text-xl text-gray-600">
            Search and book flights with ease
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 mb-6">
                <div className="flex gap-4">
                  <div
                    className={`flex-1 p-4 rounded-lg cursor-pointer transition-all duration-300 transform ${!searchParams.isRoundTrip ? 'bg-blue-50 border-blue-600 shadow-md' : 'border-gray-300 shadow'} hover:shadow-lg hover:-translate-y-0.5`}
                    onClick={() => setSearchParams(prev => ({ ...prev, isRoundTrip: false }))}
                  >
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">→</div>
                      <div className="text-sm font-medium text-gray-700">One Way</div>
                    </div>
                  </div>
                  <div
                    className={`flex-1 p-4 rounded-lg cursor-pointer transition-all duration-300 transform ${searchParams.isRoundTrip ? 'bg-blue-50 border-blue-600 shadow-md' : 'border-gray-300 shadow'} hover:shadow-lg hover:-translate-y-0.5`}
                    onClick={() => setSearchParams(prev => ({ ...prev, isRoundTrip: true }))}
                  >
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">→ ⇦</div>
                      <div className="text-sm font-medium text-gray-700">Round Trip</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="from"
                    value={searchParams.from}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, from: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-3 pr-10"
                    placeholder="Departure city"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    ✈️
                  </span>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="to"
                    value={searchParams.to}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, to: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-3 pr-10"
                    placeholder="Arrival city"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🛫
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Date
                </label>
                <input
                  type="date"
                  name="departureDate"
                  value={searchParams.departureDate}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-3"
                />
              </div>

              {searchParams.isRoundTrip && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Date
                  </label>
                  <input
                    type="date"
                    name="returnDate"
                    value={searchParams.returnDate}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-3"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passengers
                    </label>
                    <select
                      name="passengers"
                      value={searchParams.passengers}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-3"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          {num} Passenger{num > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cabin Class
                    </label>
                    <select
                      name="cabinClass"
                      value={searchParams.cabinClass}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, cabinClass: e.target.value }))}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-3"
                    >
                      <option value="Economy">Economy</option>
                      <option value="Premium Economy">Premium Economy</option>
                      <option value="Business">Business</option>
                      <option value="First">First</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Search Flights
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
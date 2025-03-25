'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPlaneDeparture, FaPlaneArrival, FaCalendarAlt, FaUsers } from 'react-icons/fa';
import { MdAirlineSeatReclineExtra } from 'react-icons/md';

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

  const [dateErrors, setDateErrors] = useState({
    departureDate: '',
    returnDate: ''
  });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate max date (1 year from today)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Validate dates whenever they change
  useEffect(() => {
    const newDateErrors = { departureDate: '', returnDate: '' };

    if (searchParams.departureDate) {
      const departureDate = new Date(searchParams.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (departureDate < today) {
        newDateErrors.departureDate = 'Departure date cannot be in the past';
      }
    }

    if (searchParams.isRoundTrip && searchParams.returnDate && searchParams.departureDate) {
      const departureDate = new Date(searchParams.departureDate);
      const returnDate = new Date(searchParams.returnDate);

      if (returnDate < departureDate) {
        newDateErrors.returnDate = 'Return date must be after departure date';
      }
    }

    setDateErrors(newDateErrors);
  }, [searchParams.departureDate, searchParams.returnDate, searchParams.isRoundTrip]);

  const handleDateChange = (field: 'departureDate' | 'returnDate', value: string) => {
    setSearchParams(prev => {
      const updates: any = { [field]: value };
      
      // If setting departure date and there's a return date that would become invalid
      if (field === 'departureDate' && prev.returnDate && new Date(value) > new Date(prev.returnDate)) {
        updates.returnDate = value; // Reset return date to match departure date
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for validation errors before proceeding
    if (dateErrors.departureDate || dateErrors.returnDate) {
      return;
    }
    
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-600 to-blue-400 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-blue-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-extrabold text-white mb-6 tracking-tight">
            Your Journey Begins Here
          </h1>
          <p className="text-2xl text-blue-100 font-light">
            Discover the world with our seamless flight booking experience
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20"
        >
          <form onSubmit={handleSearch} className="space-y-8">
            {/* Trip Type Selection */}
            <div className="md:col-span-2 mb-8">
              <div className="flex gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                    !searchParams.isRoundTrip 
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30' 
                      : 'bg-gray-100'
                  }`}
                  onClick={() => setSearchParams(prev => ({ ...prev, isRoundTrip: false }))}
                >
                  <div className="text-center">
                    <div className={`text-4xl mb-3 ${!searchParams.isRoundTrip ? 'text-white' : 'text-gray-600'}`}>→</div>
                    <div className={`text-lg font-medium ${!searchParams.isRoundTrip ? 'text-white' : 'text-gray-600'}`}>One Way</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                    searchParams.isRoundTrip 
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30' 
                      : 'bg-gray-100'
                  }`}
                  onClick={() => setSearchParams(prev => ({ ...prev, isRoundTrip: true }))}
                >
                  <div className="text-center">
                    <div className={`text-4xl mb-3 ${searchParams.isRoundTrip ? 'text-white' : 'text-gray-600'}`}>↔</div>
                    <div className={`text-lg font-medium ${searchParams.isRoundTrip ? 'text-white' : 'text-gray-600'}`}>Round Trip</div>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Field */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="from"
                    value={searchParams.from}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, from: e.target.value }))}
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-base px-4 py-4 pl-12 transition-all duration-300 group-hover:border-blue-400 text-gray-800 placeholder-gray-500"
                    placeholder="Departure city"
                  />
                  <FaPlaneDeparture className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 text-lg" />
                </div>
              </div>

              {/* To Field */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="to"
                    value={searchParams.to}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, to: e.target.value }))}
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-base px-4 py-4 pl-12 transition-all duration-300 group-hover:border-blue-400 text-gray-800 placeholder-gray-500"
                    placeholder="Arrival city"
                  />
                  <FaPlaneArrival className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 text-lg" />
                </div>
              </div>

              {/* Enhanced Date Fields */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="departureDate"
                    value={searchParams.departureDate}
                    onChange={(e) => handleDateChange('departureDate', e.target.value)}
                    min={today}
                    max={maxDateString}
                    className={`block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-base px-4 py-4 pl-12 transition-all duration-300 group-hover:border-blue-400 text-gray-800 ${
                      dateErrors.departureDate ? 'border-red-500' : ''
                    }`}
                  />
                  <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 text-lg" />
                  {searchParams.departureDate && (
                    <div className="absolute top-full left-0 mt-1 text-sm text-gray-800">
                      {formatDateForDisplay(searchParams.departureDate)}
                    </div>
                  )}
                  {dateErrors.departureDate && (
                    <div className="absolute top-full left-0 mt-1 text-sm text-red-500">
                      {dateErrors.departureDate}
                    </div>
                  )}
                </div>
              </div>

              {searchParams.isRoundTrip && (
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="returnDate"
                      value={searchParams.returnDate}
                      onChange={(e) => handleDateChange('returnDate', e.target.value)}
                      min={searchParams.departureDate || today}
                      max={maxDateString}
                      className={`block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-base px-4 py-4 pl-12 transition-all duration-300 group-hover:border-blue-400 text-gray-800 ${
                        dateErrors.returnDate ? 'border-red-500' : ''
                      }`}
                    />
                    <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 text-lg" />
                    {searchParams.returnDate && (
                      <div className="absolute top-full left-0 mt-1 text-sm text-gray-800">
                        {formatDateForDisplay(searchParams.returnDate)}
                      </div>
                    )}
                    {dateErrors.returnDate && (
                      <div className="absolute top-full left-0 mt-1 text-sm text-red-500">
                        {dateErrors.returnDate}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Passengers and Cabin Class */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passengers
                    </label>
                    <div className="relative">
                      <select
                        name="passengers"
                        value={searchParams.passengers}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                        className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-base px-4 py-4 pl-12 appearance-none transition-all duration-300 group-hover:border-blue-400 text-gray-800"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <option key={num} value={num}>
                            {num} Passenger{num > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                      <FaUsers className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 text-lg" />
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cabin Class
                    </label>
                    <div className="relative">
                      <select
                        name="cabinClass"
                        value={searchParams.cabinClass}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, cabinClass: e.target.value }))}
                        className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-base px-4 py-4 pl-12 appearance-none transition-all duration-300 group-hover:border-blue-400 text-gray-800"
                      >
                        <option value="Economy">Economy</option>
                        <option value="Premium Economy">Premium Economy</option>
                        <option value="Business">Business</option>
                        <option value="First">First</option>
                      </select>
                      <MdAirlineSeatReclineExtra className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 text-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <motion.div 
              className="mt-8"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="submit"
                disabled={!!dateErrors.departureDate || !!dateErrors.returnDate}
                className={`w-full flex justify-center items-center gap-2 py-5 px-8 rounded-xl text-lg font-medium text-white 
                  ${dateErrors.departureDate || dateErrors.returnDate
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'
                  } transition-all duration-300 shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600`}
              >
                <FaPlaneDeparture className="text-xl" />
                Search Flights
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

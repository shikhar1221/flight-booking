// 'use client';

// import { useState, useEffect } from 'react';
// import { useFlightSearch } from '@/hooks/useFlightSearch';
// import { useFlightWorker } from '@/hooks/useFlightWorker';
// import type { SearchParams } from '@/lib/indexeddb/flightService';

// interface Flight {
//   id: string;
//   flight_number: string;
//   airline: string;
//   departure_airport: string;
//   arrival_airport: string;
//   departure_time: string;
//   arrival_time: string;
//   duration: number;
//   price: number;
//   available_seats: Record<string, number>;
//   status: string;
// }

// interface FilterCriteria {
//   priceRange?: { min: number; max: number };
//   airlines?: string[];
//   departureTimeRange?: { start: string; end: string };
//   cabinClass?: string;
//   minimumSeats?: number;
// }

// interface Props {
//   searchParams: SearchParams;
//   onSelectFlight: (flight: Flight) => void;
// }

// export default function FlightSearchResults({ searchParams, onSelectFlight }: Props) {
//   const { loading, error, results, isOffline, searchFlights } = useFlightSearch();
//   const { processing, error: workerError, processFlights } = useFlightWorker();
//   const [filteredResults, setFilteredResults] = useState<Flight[]>([]);
//   const [sortField, setSortField] = useState<'price' | 'duration' | 'departureTime' | 'arrivalTime'>('departureTime');
//   const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
//   const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
//     cabinClass: searchParams.cabinClass,
//     minimumSeats: searchParams.passengers.adults + searchParams.passengers.children + searchParams.passengers.infants,
//   });

//   // Perform initial search
//   useEffect(() => {
//     searchFlights(searchParams);
//   }, [searchParams, searchFlights]);

//   // Process results using Web Worker when results or filters change
//   useEffect(() => {
//     if (results.length > 0) {
//       processFlights(results, filterCriteria, sortField, sortOrder)
//         .then(setFilteredResults)
//         .catch(console.error);
//     } else {
//       setFilteredResults([]);
//     }
//   }, [results, filterCriteria, sortField, sortOrder, processFlights]);

//   // Update price range filter
//   const handlePriceRangeChange = (min: number, max: number) => {
//     setFilterCriteria(prev => ({
//       ...prev,
//       priceRange: { min, max },
//     }));
//   };

//   // Update airline filter
//   const handleAirlineFilter = (airlines: string[]) => {
//     setFilterCriteria(prev => ({
//       ...prev,
//       airlines,
//     }));
//   };

//   // Update departure time range filter
//   const handleTimeRangeChange = (start: string, end: string) => {
//     setFilterCriteria(prev => ({
//       ...prev,
//       departureTimeRange: { start, end },
//     }));
//   };

//   // Handle sort changes
//   const handleSort = (field: typeof sortField) => {
//     setSortField(field);
//     setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
//   };

//   if (loading || processing) {
//     return (
//       <div className="flex justify-center items-center py-12">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   if (error || workerError) {
//     return (
//       <div className="bg-red-50 p-4 rounded-md">
//         <p className="text-sm text-red-700">{error || workerError}</p>
//       </div>
//     );
//   }

//   if (isOffline && filteredResults.length === 0) {
//     return (
//       <div className="bg-yellow-50 p-4 rounded-md">
//         <p className="text-sm text-yellow-700">
//           You are currently offline and no cached results are available.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Filters */}
//       <div className="bg-white shadow rounded-lg p-4">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* Price Range Filter */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Price Range
//             </label>
//             <div className="flex items-center space-x-2">
//               <input
//                 type="number"
//                 min="0"
//                 placeholder="Min"
//                 className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
//                 onChange={(e) => {
//                   const max = filterCriteria.priceRange?.max || Infinity;
//                   handlePriceRangeChange(Number(e.target.value), max);
//                 }}
//               />
//               <span>-</span>
//               <input
//                 type="number"
//                 min="0"
//                 placeholder="Max"
//                 className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
//                 onChange={(e) => {
//                   const min = filterCriteria.priceRange?.min || 0;
//                   handlePriceRangeChange(min, Number(e.target.value));
//                 }}
//               />
//             </div>
//           </div>

//           {/* Airline Filter */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Airlines
//             </label>
//             <select
//               multiple
//               className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
//               onChange={(e) => {
//                 const selectedAirlines = Array.from(e.target.selectedOptions, option => option.value);
//                 handleAirlineFilter(selectedAirlines);
//               }}
//             >
//               {Array.from(new Set(results.map(flight => flight.airline))).map(airline => (
//                 <option key={airline} value={airline}>
//                   {airline}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Time Range Filter */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Departure Time
//             </label>
//             <div className="flex items-center space-x-2">
//               <input
//                 type="time"
//                 className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
//                 onChange={(e) => {
//                   const end = filterCriteria.departureTimeRange?.end || '23:59';
//                   handleTimeRangeChange(e.target.value, end);
//                 }}
//               />
//               <span>-</span>
//               <input
//                 type="time"
//                 className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
//                 onChange={(e) => {
//                   const start = filterCriteria.departureTimeRange?.start || '00:00';
//                   handleTimeRangeChange(start, e.target.value);
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Sort Controls */}
//       <div className="flex justify-end space-x-4">
//         <button
//           onClick={() => handleSort('price')}
//           className={`px-3 py-1 rounded-md text-sm font-medium ${
//             sortField === 'price' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
//           }`}
//         >
//           Price {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
//         </button>
//         <button
//           onClick={() => handleSort('duration')}
//           className={`px-3 py-1 rounded-md text-sm font-medium ${
//             sortField === 'duration' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
//           }`}
//         >
//           Duration {sortField === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
//         </button>
//         <button
//           onClick={() => handleSort('departureTime')}
//           className={`px-3 py-1 rounded-md text-sm font-medium ${
//             sortField === 'departureTime' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
//           }`}
//         >
//           Departure {sortField === 'departureTime' && (sortOrder === 'asc' ? '↑' : '↓')}
//         </button>
//       </div>

//       {/* Results */}
//       <div className="space-y-4">
//         {filteredResults.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-gray-500">No flights found matching your criteria.</p>
//           </div>
//         ) : (
//           filteredResults.map((flight) => (
//             <div
//               key={flight.id}
//               className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
//               onClick={() => onSelectFlight(flight)}
//             >
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 <div>
//                   <p className="text-sm text-gray-500">Flight</p>
//                   <p className="font-medium">{flight.flight_number}</p>
//                   <p className="text-sm text-gray-700">{flight.airline}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500">Departure</p>
//                   <p className="font-medium">
//                     {new Date(flight.departure_time).toLocaleTimeString([], {
//                       hour: '2-digit',
//                       minute: '2-digit',
//                     })}
//                   </p>
//                   <p className="text-sm text-gray-700">{flight.departure_airport}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500">Arrival</p>
//                   <p className="font-medium">
//                     {new Date(flight.arrival_time).toLocaleTimeString([], {
//                       hour: '2-digit',
//                       minute: '2-digit',
//                     })}
//                   </p>
//                   <p className="text-sm text-gray-700">{flight.arrival_airport}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500">Price</p>
//                   <p className="font-medium">${flight.price.toFixed(2)}</p>
//                   <p className="text-sm text-gray-700">
//                     {flight.available_seats[searchParams.cabinClass]} seats left
//                   </p>
//                 </div>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// import { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase/config';
// import { flightSearchWorkerService } from '@/lib/services/flightSearchWorkerService';
// import { indexedDBService } from '@/lib/services/indexedDBService';
// import { Database } from '@/types/supabase';

// type Flight = Database['public']['Tables']['flights']['Row'];

// interface FareCalendarProps {
//   origin: string;
//   destination: string;
//   startDate: Date;
//   cabinClass: string;
//   passengers: {
//     adults: number;
//     children: number;
//     infants: number;
//   };
//   onDateSelect: (date: Date, lowestPrice: number) => void;
// }

// interface DayPrice {
//   date: Date;
//   price: number;
//   available: boolean;
// }

// export default function FareCalendar({
//   origin,
//   destination,
//   startDate,
//   cabinClass,
//   passengers,
//   onDateSelect
// }: FareCalendarProps) {
//   const [monthData, setMonthData] = useState<DayPrice[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchPrices = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         // Calculate date range (current month)
//         const monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
//         const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

//         // Try to get cached data first
//         const cachedData = await indexedDBService.getFlightSearchResults({
//           origin,
//           destination,
//           departureDate: monthStart.toISOString(),
//           cabinClass
//         });

//         let flights: Flight[] = [];

//         if (cachedData) {
//           flights = cachedData.flights;
//         } else {
//           // Fetch from Supabase if not in cache
//           const { data, error } = await supabase
//             .from('flights')
//             .select('*')
//             .eq('departure_airport', origin)
//             .eq('arrival_airport', destination)
//             .gte('departure_time', monthStart.toISOString())
//             .lte('departure_time', monthEnd.toISOString());

//           if (error) throw error;
//           flights = data;

//           // Cache the results
//           await indexedDBService.cacheFlightSearchResults({
//             flights,
//             timestamp: Date.now(),
//             searchParams: {
//               origin,
//               destination,
//               departureDate: monthStart.toISOString(),
//               passengers,
//               cabinClass
//             }
//           });
//         }

//         // Use Web Worker for filtering and finding lowest prices
//         const filteredFlights = await flightSearchWorkerService.searchFlights(flights, {
//           origin,
//           destination,
//           departureDate: monthStart.toISOString(),
//           passengers,
//           cabinClass,
//           sortBy: 'price',
//           sortOrder: 'asc'
//         });

//         // Create calendar data
//         const calendar: DayPrice[] = [];
//         let currentDate = new Date(monthStart);

//         while (currentDate <= monthEnd) {
//           const dayFlights = filteredFlights.filter(
//             flight => new Date(flight.departure_time).toDateString() === currentDate.toDateString()
//           );

//           const lowestPrice = dayFlights.length > 0 ? Math.min(...dayFlights.map(f => f.price)) : 0;
//           const totalPassengers = passengers.adults + passengers.children + passengers.infants;
//           const hasAvailableSeats = dayFlights.some(
//             flight => flight.available_seats[cabinClass as keyof typeof flight.available_seats] >= totalPassengers
//           );

//           calendar.push({
//             date: new Date(currentDate),
//             price: lowestPrice,
//             available: hasAvailableSeats
//           });

//           currentDate.setDate(currentDate.getDate() + 1);
//         }

//         setMonthData(calendar);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Failed to load fare calendar');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPrices();
//   }, [origin, destination, startDate, cabinClass, passengers]);

//   if (loading) {
//     return (
//       <div className="animate-pulse">
//         <div className="h-64 bg-gray-200 rounded-lg"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-red-600 p-4 rounded-lg bg-red-50">
//         {error}
//       </div>
//     );
//   }

//   const today = new Date();

//   return (
//     <div className="bg-white rounded-lg shadow">
//       <div className="grid grid-cols-7 gap-px bg-gray-200">
//         {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
//           <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-700">
//             {day}
//           </div>
//         ))}
//       </div>
//       <div className="grid grid-cols-7 gap-px bg-gray-200">
//         {monthData.map(({ date, price, available }, index) => {
//           const isToday = date.toDateString() === today.toDateString();
//           const isPast = date < today;
//           const isSelected = date.toDateString() === startDate.toDateString();

//           return (
//             <button
//               key={index}
//               onClick={() => available && !isPast && onDateSelect(date, price)}
//               disabled={!available || isPast}
//               className={`
//                 bg-white p-2 h-24 flex flex-col items-center justify-between
//                 ${isSelected ? 'ring-2 ring-blue-500' : ''}
//                 ${isPast ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-blue-50'}
//                 ${isToday ? 'font-bold' : ''}
//               `}
//             >
//               <span className={`text-sm ${isPast ? 'text-gray-400' : 'text-gray-700'}`}>
//                 {date.getDate()}
//               </span>
//               {available ? (
//                 <span className={`text-sm font-medium ${isPast ? 'text-gray-400' : 'text-green-600'}`}>
//                   ${price.toLocaleString()}
//                 </span>
//               ) : (
//                 <span className="text-xs text-red-600">Unavailable</span>
//               )}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

import { ReadonlyURLSearchParams } from 'next/navigation';

interface FlightSearchHeaderProps {
  searchParams: ReadonlyURLSearchParams;
  sortBy: 'departure' | 'price' | 'duration';
  onSortChange: (value: 'departure' | 'price' | 'duration') => void;
}

export function FlightSearchHeader({ searchParams, sortBy, onSortChange }: FlightSearchHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Available Flights</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="departure">Departure Time</option>
              <option value="price">Price</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        {searchParams.get('from')} → {searchParams.get('to')} •{' '}
        {new Date(searchParams.get('departureDate') || '').toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
    </div>
  );
}
import { FlightBookingData } from '@/types/booking';
import { Loader2 } from 'lucide-react';

interface PriceSummaryProps {
  bookFlight: FlightBookingData;
  cabinClass: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const PriceSummary = ({ bookFlight, cabinClass, isSubmitting, onSubmit }: PriceSummaryProps) => {
  const basePrice = bookFlight.prices.find(
    p => p.cabin_class.toLowerCase() === cabinClass?.toLowerCase()
  )?.price || 0;
  const taxAmount = basePrice * 0.18;
  const totalAmount = basePrice * 1.18;

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Base fare</span>
          <span className="font-medium">₹{basePrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Taxes & fees</span>
          <span className="font-medium">₹{taxAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="border-t border-gray-200 my-2"></div>
        <div className="flex justify-between text-lg font-semibold">
          <span>Total Amount</span>
          <span className="text-primary">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
      <button
          type="submit"
          disabled={isSubmitting}
          className="relative w-full bg-blue-600 text-white rounded-lg px-6 py-4 font-medium 
            transform transition-all duration-200 
            hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5
            active:translate-y-0 active:shadow-md
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <div className="flex items-center justify-center space-x-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing your booking...</span>
              </>
            ) : (
              <>
                <span className="text-lg">Confirm & Pay</span>
                <span className="text-sm opacity-90">₹{totalAmount.toLocaleString('en-IN')}</span>
              </>
            )}
          </div>
          <div className="absolute inset-x-0 h-1 bottom-0 rounded-b-lg bg-black/10"></div>
        </button>
        
        <p className="text-center text-sm text-gray-500">
          By clicking "Confirm & Pay", you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline">Terms & Conditions</a>
          {' '}and{' '}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};
import { FlightBookingData } from '@/types/booking';
import { CabinClass } from '@/types/flight';
import { Loader2, CreditCard, Shield, Info, Users } from 'lucide-react';

type DbCabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

interface PriceSummaryProps {
  bookFlight: FlightBookingData;
  cabinClass: string;
  isSubmitting: boolean;
  basePrice:number;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  passengerCount: number;
}

const cabinClassToDbField = (cabinClass: CabinClass): DbCabinClass => {
  switch (cabinClass) {
    case 'Premium Economy':
      return 'premium_economy';
    case 'Economy':
      return 'economy';
    case 'Business':
      return 'business';
    case 'First':
      return 'first';
  }
};

export const PriceSummary = ({ 
  bookFlight,
  basePrice,
  cabinClass, 
  isSubmitting, 
  onSubmit,
  passengerCount
}: PriceSummaryProps) => {
  const dbCabinClass = cabinClassToDbField(cabinClass as CabinClass);
  const basePriceTotal: number = basePrice * passengerCount;
  const taxAmount: number = basePriceTotal * 0.18; // 18% GST
  const totalAmount: number = basePriceTotal + taxAmount;
  const loyaltyPoints: number = Math.floor(totalAmount * 0.1); // 10% of total as loyalty points

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      {/* Price Breakdown */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Summary</h3>
        
        {/* Passenger Count */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <Users className="h-4 w-4" />
          <span>{passengerCount} Passenger{passengerCount > 1 ? 's' : ''}</span>
        </div>

        {/* Base Fare Section */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Base fare (per passenger)</span>
            <span className="font-medium text-blue-900">
              ₹{basePrice.toLocaleString('en-IN')}
            </span>
          </div>

          {passengerCount > 1 && (
            <div className="flex justify-between items-center pl-4 text-sm text-gray-500">
              <span>× {passengerCount} passengers</span>
              <span>₹{basePriceTotal.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        {/* Taxes Section */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Taxes & fees (18% GST)</span>
            <Info className="h-4 w-4 text-gray-400" />
          </div>
          <span className="font-medium text-blue-900">₹{taxAmount.toLocaleString('en-IN')}</span>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        {/* Total Amount */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-semibold text-blue-950">Total Amount</span>
          <span className="text-xl font-bold text-blue-950">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>

        {/* Per Passenger Average */}
        {passengerCount > 1 && (
          <div className="text-sm text-gray-500 flex items-center justify-end mb-2">
            <span>
              ₹{Math.round(totalAmount / passengerCount).toLocaleString('en-IN')} per passenger
            </span>
          </div>
        )}

        {/* Loyalty Points */}
        <div className="text-sm text-gray-500 flex items-center justify-end space-x-1">
          <span>You'll earn</span>
          <span className="font-semibold text-green-600">{loyaltyPoints}</span>
          <span>loyalty points</span>
        </div>
      </div>

      {/* Payment Section */}
      <div className="mt-6 space-y-4">
        {/* Security Badge */}
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
          <Shield className="h-4 w-4" />
          <span>Secure payment powered by Stripe</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="relative w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl 
            px-6 py-4 font-medium transform transition-all duration-200 
            hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:-translate-y-0.5
            active:translate-y-0 active:shadow-md
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 
            disabled:hover:shadow-none group"
        >
          <div className="flex items-center justify-center space-x-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing your booking...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-lg">Confirm & Pay</span>
                <span className="text-sm opacity-90">₹{totalAmount.toLocaleString('en-IN')}</span>
              </>
            )}
          </div>
          <div className="absolute inset-x-0 h-1 bottom-0 rounded-b-xl bg-black/10"></div>
        </button>

        {/* Terms and Privacy */}
        <p className="text-center text-sm text-gray-500">
          By clicking "Confirm & Pay", you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:text-blue-700 hover:underline">
            Terms & Conditions
          </a>
          {' '}and{' '}
          <a href="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

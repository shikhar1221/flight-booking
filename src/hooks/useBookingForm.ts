import { useState } from 'react';
import { PassengerDetails, BookingFormErrors } from '@/types/booking';

export const useBookingForm = () => {
  const [passengerDetails, setPassengerDetails] = useState<PassengerDetails>({
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    seatNumber: ''
  });

  const [formErrors, setFormErrors] = useState<BookingFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const validateForm = () => {
    const errors: BookingFormErrors = {};
    
    if (!passengerDetails.title) {
      errors.title = 'Please select a title';
    }
    
    if (!passengerDetails.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!passengerDetails.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!passengerDetails.email.trim() || !/\S+@\S+\.\S+/.test(passengerDetails.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!passengerDetails.phone.trim() || !/^\d{10}$/.test(passengerDetails.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!passengerDetails.nationality.trim()) {
      errors.nationality = 'Please select your nationality';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updatePassengerDetail = (field: keyof PassengerDetails, value: string) => {
    setPassengerDetails(prev => ({ ...prev, [field]: value }));
  };

  return {
    passengerDetails,
    formErrors,
    isSubmitting,
    bookingError,
    setIsSubmitting,
    setBookingError,
    updatePassengerDetail,
    validateForm
  };
};
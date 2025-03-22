import { supabase } from '@/lib/supabase/config';

interface EmailData {
  bookingId?: string;
  flightNumber?: string;
  returnFlightNumber?: string;
  passengerName?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureTime?: string;
  returnDepartureTime?: string;
  status?: string;
}

type EmailType = 'BOOKING_CONFIRMATION' | 'STATUS_UPDATE' | 'BOOKING_CANCELLED';

class EmailService {
  private static async sendEmail(
    to: string,
    subject: string,
    type: EmailType,
    data: EmailData
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          type,
          data,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error sending email:', err);
      throw new Error('Failed to send email notification');
    }
  }

  static async sendBookingConfirmation(
    email: string,
    bookingId: string,
    flightNumber: string,
    passengerName: string,
    departureAirport: string,
    arrivalAirport: string,
    departureTime: string,
    returnFlightNumber?: string,
    returnDepartureTime?: string
  ): Promise<void> {
    await this.sendEmail(
      email,
      'Flight Booking Confirmation',
      'BOOKING_CONFIRMATION',
      {
        bookingId,
        flightNumber,
        returnFlightNumber,
        passengerName,
        departureAirport,
        arrivalAirport,
        departureTime,
        returnDepartureTime,
      }
    );
  }

  static async sendStatusUpdate(
    email: string,
    bookingId: string,
    flightNumber: string,
    passengerName: string,
    status: string
  ): Promise<void> {
    await this.sendEmail(
      email,
      'Flight Status Update',
      'STATUS_UPDATE',
      {
        bookingId,
        flightNumber,
        passengerName,
        status,
      }
    );
  }

  static async sendBookingCancellation(
    email: string,
    bookingId: string,
    flightNumber: string,
    passengerName: string
  ): Promise<void> {
    await this.sendEmail(
      email,
      'Flight Booking Cancellation',
      'BOOKING_CANCELLED',
      {
        bookingId,
        flightNumber,
        passengerName,
      }
    );
  }
}

export default EmailService;

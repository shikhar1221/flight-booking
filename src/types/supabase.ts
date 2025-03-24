export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      flights: {
        Row: {
          id: string
          flight_number: string
          airline: string
          departure_airport: string
          arrival_airport: string
          departure_time: string
          arrival_time: string
          duration: number
          status: 'ON_TIME' | 'DELAYED' | 'BOARDING' | 'DEPARTED' | 'CANCELLED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          flight_number: string
          airline: string
          departure_airport: string
          arrival_airport: string
          departure_time: string
          arrival_time: string
          duration: number
          status?: 'ON_TIME' | 'DELAYED' | 'BOARDING' | 'DEPARTED' | 'CANCELLED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          flight_number?: string
          airline?: string
          departure_airport?: string
          arrival_airport?: string
          departure_time?: string
          arrival_time?: string
          duration?: number
          status?: 'ON_TIME' | 'DELAYED' | 'BOARDING' | 'DEPARTED' | 'CANCELLED'
          created_at?: string
          updated_at?: string
        }
      }
      flight_prices: {
        Row: {
          id: string
          flight_id: string
          cabin_class: 'Economy' | 'Premium Economy' | 'Business' | 'First'
          price: number
          effective_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          flight_id: string
          cabin_class: 'Economy' | 'Premium Economy' | 'Business' | 'First'
          price: number
          effective_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          flight_id?: string
          cabin_class?: 'Economy' | 'Premium Economy' | 'Business' | 'First'
          price?: number
          effective_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      seat_map: {
        Row: {
          id: string
          flight_id: string
          seat_number: string
          cabin_class: 'Economy' | 'Premium Economy' | 'Business' | 'First'
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          flight_id: string
          seat_number: string
          cabin_class: 'Economy' | 'Premium Economy' | 'Business' | 'First'
          is_available: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          flight_id?: string
          seat_number?: string
          cabin_class?: 'Economy' | 'Premium Economy' | 'Business' | 'First'
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          password: string
          full_name: string
          phone_number: string
          address: string
          date_of_birth: string
          passport_number: string
          nationality: string
          loyalty_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password: string
          full_name: string
          phone_number: string
          address: string
          date_of_birth: string
          passport_number: string
          nationality: string
          loyalty_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          full_name?: string
          phone_number?: string
          address?: string
          date_of_birth?: string
          passport_number?: string
          nationality?: string
          loyalty_points?: number
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string;
          user_id: string;
          flight_id: string;
          booking_type: 'one-way' | 'round-trip' | 'multi-city';
          is_outbound: boolean;
          related_booking_id: string | null;
          multi_city_group_id: string | null;
          multi_city_sequence: number | null;
          passengers: {
            name: string;
            type: 'adult' | 'child' | 'infant';
            seat_number: string;
            fare: number;
          }[];
          total_price: number;
          status: 'pending' | 'confirmed' | 'cancelled';
          created_at: string;
          updated_at: string;
          loyalty_points_earned: number;
          loyalty_tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
        }
        Insert: {
          id?: string;
          user_id: string;
          flight_id: string;
          booking_type: 'one-way' | 'round-trip' | 'multi-city';
          is_outbound?: boolean;
          related_booking_id?: string;
          multi_city_group_id?: string;
          multi_city_sequence?: number;
          passengers: {
            name: string;
            type: 'adult' | 'child' | 'infant';
            seat_number: string;
            fare: number;
          }[];
          total_price: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
          loyalty_points_earned?: number;
          loyalty_tier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
        }
        Update: {
          id?: string;
          user_id?: string;
          flight_id?: string;
          booking_type?: 'one-way' | 'round-trip' | 'multi-city';
          is_outbound?: boolean;
          related_booking_id?: string;
          multi_city_group_id?: string;
          multi_city_sequence?: number;
          passengers?: {
            name: string;
            type: 'adult' | 'child' | 'infant';
            seat_number: string;
            fare: number;
          }[];
          total_price?: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
          loyalty_points_earned?: number;
          loyalty_tier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
        }
      }

      // Passengers table (normalized)
      passengers: {
        Row: {
          id: string;
          booking_id: string;
          name: string;
          type: 'adult' | 'child' | 'infant';
          seat_number: string;
          fare: number;
          created_at: string;
        }
        Insert: {
          id?: string;
          booking_id: string;
          name: string;
          type: 'adult' | 'child' | 'infant';
          seat_number: string;
          fare: number;
          created_at?: string;
        }
        Update: {
          id?: string;
          booking_id?: string;
          name?: string;
          type?: 'adult' | 'child' | 'infant';
          seat_number?: string;
          fare?: number;
          created_at?: string;
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
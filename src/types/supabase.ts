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
          price: number
          available_seats: {
            Economy: number
            'Premium Economy': number
            Business: number
            First: number
          }
          created_at: string
          updated_at: string
          status: 'ON_TIME' | 'DELAYED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED'
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
          price: number
          available_seats: {
            Economy: number
            'Premium Economy': number
            Business: number
            First: number
          }
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
          price?: number
          available_seats?: {
            Economy: number
            'Premium Economy': number
            Business: number
            First: number
          }
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          flight_id: string
          passengers: {
            type: 'adult' | 'child' | 'infant'
            first_name: string
            last_name: string
            date_of_birth: string
            passport_number?: string
            special_requirements?: string
          }[]
          status: 'confirmed' | 'pending' | 'cancelled'
          multi_city_group_id?: string
          multi_city_sequence?: number
          booking_type: 'one-way' | 'round-trip' | 'multi-city'
          is_outbound: boolean
          related_booking_id?: string
          total_price: number
          cabin_class: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          flight_id: string
          passengers: {
            type: 'adult' | 'child' | 'infant'
            first_name: string
            last_name: string
            date_of_birth: string
            passport_number?: string
            special_requirements?: string
          }[]
          status?: 'confirmed' | 'pending' | 'cancelled'
          booking_type: 'one-way' | 'round-trip' | 'multi-city'
          is_outbound: boolean
          related_booking_id?: string
          total_price: number
          cabin_class: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          flight_id?: string
          passengers?: {
            type: 'adult' | 'child' | 'infant'
            first_name: string
            last_name: string
            date_of_birth: string
            passport_number?: string
            special_requirements?: string
          }[]
          status?: 'confirmed' | 'pending' | 'cancelled'
          booking_type?: 'one-way' | 'round-trip'
          is_outbound?: boolean
          related_booking_id?: string
          total_price?: number
          cabin_class?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone_number?: string
          address?: string
          date_of_birth?: string
          passport_number?: string
          nationality?: string
          loyalty_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone_number?: string
          address?: string
          date_of_birth?: string
          passport_number?: string
          nationality?: string
          loyalty_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
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

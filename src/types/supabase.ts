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
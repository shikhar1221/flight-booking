import { Database } from '../../types/supabase';
import { supabase } from '../supabase/config';

type Flight = Database['public']['Tables']['flights']['Row'];
type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

interface RecommendationCriteria {
  origin: string;
  destination: string;
  preferredDate: Date;
  maxPriceDifference?: number;
  maxDateDifference?: number;
  cabinClass: CabinClass;
  preferredAirlines?: string[];
  maxDuration?: number;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
}

interface RecommendationReason {
  type: 'BETTER_PRICE' | 'BETTER_TIME' | 'ALTERNATIVE_DATE' | 'PREFERRED_AIRLINE';
  description: string;
  savingsAmount?: number;
}

interface FlightRecommendation {
  flight: Flight;
  reasons: RecommendationReason[];
  score: number;
}

class FlightRecommendationService {
  private getFlightPrice(flight: Flight, cabinClass: CabinClass): number {
    const priceKey = `${cabinClass}_price` as keyof Flight;
    return flight[priceKey] as number || 0;
  }

  private getAvailableSeats(flight: Flight, cabinClass: CabinClass): number {
    const seatsKey = `${cabinClass}_available_seats` as keyof Flight;
    return flight[seatsKey] as number || 0;
  }
  private async fetchAlternativeFlights(criteria: RecommendationCriteria): Promise<Flight[]> {
    const dateRange = criteria.maxDateDifference || 3; // Default to 3 days
    const startDate = new Date(criteria.preferredDate);
    startDate.setDate(startDate.getDate() - dateRange);
    const endDate = new Date(criteria.preferredDate);
    endDate.setDate(endDate.getDate() + dateRange);

    const { data: flights, error } = await supabase
      .from('flights')
      .select('*')
      .eq('departure_airport', criteria.origin)
      .eq('arrival_airport', criteria.destination)
      .gte('departure_time', startDate.toISOString())
      .lte('departure_time', endDate.toISOString());

    if (error) throw error;
    return flights || [];
  }


  private calculateScore(flight: Flight, criteria: RecommendationCriteria, reasons: RecommendationReason[]): number {
    let score = 0;

    // Base score starts at 100
    score = 100;

    // Get price for the selected cabin class
    const flightPrice = this.getFlightPrice(flight, criteria.cabinClass);

    // Price factor (0-40 points)
    const maxPrice = criteria.maxPriceDifference || flightPrice * 0.2; // Default to 20% price difference
    const priceDifference = flightPrice - (criteria.maxPriceDifference || 0);
    if (priceDifference < 0) {
      score += Math.min(40, Math.abs(priceDifference / maxPrice) * 40);
      reasons.push({
        type: 'BETTER_PRICE',
        description: `Save ${Math.abs(priceDifference).toLocaleString()} on this flight`,
        savingsAmount: Math.abs(priceDifference)
      });
    }

    // Date proximity factor (0-30 points)
    const daysDifference = Math.abs(
      (new Date(flight.departure_time).getTime() - criteria.preferredDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dateScore = Math.max(0, 30 - (daysDifference * 10));
    score += dateScore;
    
    if (daysDifference > 0 && dateScore > 0) {
      reasons.push({
        type: 'ALTERNATIVE_DATE',
        description: `Available ${daysDifference} day${daysDifference > 1 ? 's' : ''} ${
          new Date(flight.departure_time) > criteria.preferredDate ? 'later' : 'earlier'
        }`
      });
    }

    // Time of day factor (0-20 points)
    const departureHour = new Date(flight.departure_time).getHours();
    if (departureHour >= 8 && departureHour <= 20) {
      score += 20;
      reasons.push({
        type: 'BETTER_TIME',
        description: 'Convenient departure time during daytime'
      });
    }

    // Airline preference factor (0-10 points)
    if (criteria.preferredAirlines?.includes(flight.airline)) {
      score += 10;
      reasons.push({
        type: 'PREFERRED_AIRLINE',
        description: `Preferred airline: ${flight.airline}`
      });
    }

    // Duration factor (0-10 points)
    if (criteria.maxDuration && flight.duration < criteria.maxDuration) {
      const durationDifference = criteria.maxDuration - flight.duration;
      const durationScore = Math.min(10, (durationDifference / criteria.maxDuration) * 10);
      score += durationScore;
      if (durationScore > 0) {
        reasons.push({
          type: 'BETTER_TIME',
          description: `Shorter flight duration by ${Math.floor(durationDifference / 60)} hours ${durationDifference % 60} minutes`
        });
      }
    }


    return score;
  }

  async getRecommendations(criteria: RecommendationCriteria): Promise<FlightRecommendation[]> {
    try {
      const flights = await this.fetchAlternativeFlights(criteria);
      const recommendations: FlightRecommendation[] = [];

      for (const flight of flights) {
        // Check if flight has enough seats
        const totalPassengers = criteria.passengers.adults + criteria.passengers.children + criteria.passengers.infants;
        const availableSeats = this.getAvailableSeats(flight, criteria.cabinClass);

        if (availableSeats >= totalPassengers) {
          const reasons: RecommendationReason[] = [];
          const score = this.calculateScore(flight, criteria, reasons);

          if (reasons.length > 0) {
            recommendations.push({ flight, reasons, score });
          }
        }
      }

      // Sort by score descending and return top 5
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting flight recommendations:', error);
      throw error;
    }
  }
}

export const flightRecommendationService = new FlightRecommendationService();

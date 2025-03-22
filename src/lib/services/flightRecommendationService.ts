import { Database } from '../../types/supabase';
import { supabase } from '../supabase/config';

type Flight = Database['public']['Tables']['flights']['Row'];

interface RecommendationCriteria {
  origin: string;
  destination: string;
  preferredDate: Date;
  maxPriceDifference?: number;
  maxDateDifference?: number;
  cabinClass: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
}

interface RecommendationReason {
  type: 'BETTER_PRICE' | 'BETTER_TIME' | 'ALTERNATIVE_DATE' | 'LOYALTY_POINTS';
  description: string;
  savingsAmount?: number;
  pointsEarned?: number;
}

interface FlightRecommendation {
  flight: Flight;
  reasons: RecommendationReason[];
  score: number;
}

class FlightRecommendationService {
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

    // Price factor (0-40 points)
    const maxPrice = criteria.maxPriceDifference || flight.price * 0.2; // Default to 20% price difference
    const priceDifference = flight.price - criteria.maxPriceDifference!;
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

    // Loyalty points factor (0-10 points)
    const pointsEarned = Math.floor(flight.price * 0.1); // Example: 10% of price as points
    score += 10;
    reasons.push({
      type: 'LOYALTY_POINTS',
      description: `Earn ${pointsEarned} loyalty points`,
      pointsEarned
    });

    return score;
  }

  async getRecommendations(criteria: RecommendationCriteria): Promise<FlightRecommendation[]> {
    try {
      const flights = await this.fetchAlternativeFlights(criteria);
      const recommendations: FlightRecommendation[] = [];

      for (const flight of flights) {
        // Check if flight has enough seats
        const totalPassengers = criteria.passengers.adults + criteria.passengers.children + criteria.passengers.infants;
        const availableSeats = flight.available_seats[criteria.cabinClass as keyof typeof flight.available_seats];

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

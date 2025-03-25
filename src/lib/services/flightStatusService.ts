export type FlightStatus = 'ON_TIME' | 'DELAYED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED';

export interface FlightStatusUpdate {
  flightId: string;
  status: FlightStatus;
  updatedAt: string;
}

export interface FormattedStatus {
  text: string;
  color: string;
}

type StatusUpdateCallback = (update: FlightStatusUpdate) => void;

class FlightStatusService {
  private eventSource: EventSource | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 5000;

  subscribeToFlightStatus(flightId: string, callback: StatusUpdateCallback): () => void {
    this.closeConnection();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Missing SUPABASE_URL environment variable');
    }

    const url = `${supabaseUrl}/functions/v1/flight-status?flightId=${flightId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data: FlightStatusUpdate = JSON.parse(event.data);
        callback(data);
        this.retryCount = 0; // Reset retry count on successful message
      } catch (error) {
        console.error('Error parsing flight status update:', error);
      }
    };

    this.eventSource.onerror = this.handleError.bind(this);

    // Return cleanup function
    return () => this.closeConnection();
  }

  private handleError(error: Event): void {
    console.error('SSE connection error:', error);

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`Retrying connection (${this.retryCount}/${this.maxRetries})...`);
      
      setTimeout(() => {
        this.closeConnection();
        // Reconnect with the same parameters
        if (this.eventSource?.url) {
          this.eventSource = new EventSource(this.eventSource.url);
        }
      }, this.retryDelay);
    } else {
      console.error('Max retries reached, closing connection');
      this.closeConnection();
    }
  }

  private closeConnection(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Format flight status for display
  formatStatus(status: FlightStatus): FormattedStatus {
    switch (status) {
      case 'ON_TIME':
        return { text: 'On Time', color: 'text-green-600' };
      case 'DELAYED':
        return { text: 'Delayed', color: 'text-amber-600' };
      case 'BOARDING':
        return { text: 'Boarding', color: 'text-blue-600' };
      case 'DEPARTED':
        return { text: 'Departed', color: 'text-purple-600' };
      case 'ARRIVED':
        return { text: 'Arrived', color: 'text-green-600' };
      case 'CANCELLED':
        return { text: 'Cancelled', color: 'text-red-600' };
      default:
        return { text: 'Unknown', color: 'text-gray-600' };
    }
  }
}

export const flightStatusService = new FlightStatusService();

import './commands'

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      searchFlights(params: {
        origin: string
        destination: string
        departureDate: string
        returnDate?: string
        passengers?: {
          adults: number
          children: number
          infants: number
        }
        cabinClass?: string
      }): Chainable<void>
      completeBooking(params: {
        passengers: Array<{
          type: 'adult' | 'child' | 'infant'
          firstName: string
          lastName: string
          dateOfBirth: string
          passportNumber?: string
        }>
      }): Chainable<void>
    }
  }
}

/// <reference types="cypress" />

describe('Booking Flow', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'testpassword123')
  })

  it('should complete one-way booking', () => {
    cy.searchFlights({
      origin: 'SFO',
      destination: 'JFK',
      departureDate: '2025-04-01',
      passengers: {
        adults: 1,
        children: 0,
        infants: 0
      }
    })

    cy.completeBooking({
      passengers: [{
        type: 'adult',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        passportNumber: 'A1234567'
      }]
    })

    cy.get('[data-cy="booking-confirmation"]').should('contain', 'Booking Confirmed')
    cy.get('[data-cy="e-ticket"]').should('be.visible')
  })

  it('should complete round-trip booking', () => {
    cy.searchFlights({
      origin: 'SFO',
      destination: 'JFK',
      departureDate: '2025-04-01',
      returnDate: '2025-04-08',
      passengers: {
        adults: 2,
        children: 1,
        infants: 0
      }
    })

    cy.completeBooking({
      passengers: [
        {
          type: 'adult',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          passportNumber: 'A1234567'
        },
        {
          type: 'adult',
          firstName: 'Jane',
          lastName: 'Doe',
          dateOfBirth: '1992-03-15',
          passportNumber: 'B1234567'
        },
        {
          type: 'child',
          firstName: 'Jimmy',
          lastName: 'Doe',
          dateOfBirth: '2020-06-10'
        }
      ]
    })

    cy.get('[data-cy="booking-confirmation"]').should('contain', 'Round-trip Booking Confirmed')
  })

  it('should complete multi-city booking', () => {
    cy.visit('/flights/search')
    cy.get('[data-cy="multi-city-option"]').click()
    
    // First flight
    cy.get('[data-cy="flight-0-origin"]').type('SFO')
    cy.get('[data-cy="flight-0-destination"]').type('JFK')
    cy.get('[data-cy="flight-0-date"]').type('2025-04-01')
    
    // Second flight
    cy.get('[data-cy="flight-1-origin"]').type('JFK')
    cy.get('[data-cy="flight-1-destination"]').type('MIA')
    cy.get('[data-cy="flight-1-date"]').type('2025-04-03')
    
    // Third flight
    cy.get('[data-cy="add-flight"]').click()
    cy.get('[data-cy="flight-2-origin"]').type('MIA')
    cy.get('[data-cy="flight-2-destination"]').type('SFO')
    cy.get('[data-cy="flight-2-date"]').type('2025-04-05')
    
    cy.get('[data-cy="search-button"]').click()
    
    // Select flights
    cy.get('[data-cy="select-flight-0"]').first().click()
    cy.get('[data-cy="select-flight-1"]').first().click()
    cy.get('[data-cy="select-flight-2"]').first().click()
    
    cy.completeBooking({
      passengers: [{
        type: 'adult',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        passportNumber: 'A1234567'
      }]
    })

    cy.get('[data-cy="multi-city-confirmation"]').should('be.visible')
  })

  it('should handle booking modifications', () => {
    cy.visit('/bookings')
    cy.get('[data-cy="booking-card"]').first().click()
    cy.get('[data-cy="modify-booking"]').click()
    
    // Change seat selection
    cy.get('[data-cy="seat-map"]').should('be.visible')
    cy.get('[data-cy="seat-15A"]').click()
    cy.get('[data-cy="confirm-seat"]').click()
    
    cy.get('[data-cy="modification-success"]').should('be.visible')
  })

  it('should handle booking cancellation', () => {
    cy.visit('/bookings')
    cy.get('[data-cy="booking-card"]').first().click()
    cy.get('[data-cy="cancel-booking"]').click()
    cy.get('[data-cy="confirm-cancellation"]').click()
    
    cy.get('[data-cy="cancellation-success"]').should('be.visible')
    cy.get('[data-cy="refund-info"]').should('be.visible')
  })

  it('should show real-time flight updates', () => {
    cy.visit('/bookings')
    cy.get('[data-cy="booking-card"]').first().click()
    
    // Wait for SSE connection
    cy.get('[data-cy="status-indicator"]', { timeout: 10000 }).should('be.visible')
    
    // Simulate status change
    cy.window().then((win) => {
      win.postMessage({ 
        type: 'FLIGHT_STATUS_UPDATE',
        status: 'BOARDING'
      }, '*')
    })
    
    cy.get('[data-cy="status-indicator"]').should('contain', 'Boarding')
  })
})

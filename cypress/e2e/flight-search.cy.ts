/// <reference types="cypress" />

describe('Flight Search', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'testpassword123')
  })

  it('should search for one-way flights', () => {
    cy.searchFlights({
      origin: 'SFO',
      destination: 'JFK',
      departureDate: '2025-04-01',
      passengers: {
        adults: 1,
        children: 0,
        infants: 0
      },
      cabinClass: 'Economy'
    })

    cy.get('[data-cy="flight-results"]').should('be.visible')
    cy.get('[data-cy="flight-card"]').should('have.length.at.least', 1)
    cy.get('[data-cy="flight-price"]').first().should('be.visible')
  })

  it('should search for round-trip flights', () => {
    cy.searchFlights({
      origin: 'SFO',
      destination: 'JFK',
      departureDate: '2025-04-01',
      returnDate: '2025-04-08',
      passengers: {
        adults: 2,
        children: 1,
        infants: 0
      },
      cabinClass: 'Economy'
    })

    cy.get('[data-cy="outbound-flights"]').should('be.visible')
    cy.get('[data-cy="return-flights"]').should('be.visible')
  })

  it('should filter flights by cabin class', () => {
    cy.searchFlights({
      origin: 'SFO',
      destination: 'JFK',
      departureDate: '2025-04-01',
      cabinClass: 'Business'
    })

    cy.get('[data-cy="flight-card"]').each(($card: JQuery<HTMLElement>) => {
      cy.wrap($card).find('[data-cy="cabin-class"]').should('contain', 'Business')
    })
  })

  it('should show fare calendar', () => {
    cy.visit('/flights/search')
    cy.get('[data-cy="show-fare-calendar"]').click()
    cy.get('[data-cy="fare-calendar"]').should('be.visible')
    cy.get('[data-cy="calendar-day"]').should('have.length.above', 20)
    cy.get('[data-cy="lowest-fare"]').should('be.visible')
  })

  it('should show flight recommendations', () => {
    cy.searchFlights({
      origin: 'SFO',
      destination: 'JFK',
      departureDate: '2025-04-01'
    })

    cy.get('[data-cy="show-recommendations"]').click()
    cy.get('[data-cy="recommendation-card"]').should('have.length.at.least', 1)
    cy.get('[data-cy="recommendation-reason"]').should('be.visible')
  })
})

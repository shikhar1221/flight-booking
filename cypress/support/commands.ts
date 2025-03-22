import { createClient } from '@supabase/supabase-js'

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-cy="email-input"]').type(email)
  cy.get('[data-cy="password-input"]').type(password)
  cy.get('[data-cy="login-button"]').click()
  cy.url().should('not.include', '/login')
  cy.get('[data-cy="user-menu"]').should('be.visible')
})

Cypress.Commands.add('searchFlights', (params) => {
  cy.visit('/flights/search')
  cy.get('[data-cy="origin-input"]').type(params.origin)
  cy.get('[data-cy="destination-input"]').type(params.destination)
  cy.get('[data-cy="departure-date"]').type(params.departureDate)
  
  if (params.returnDate) {
    cy.get('[data-cy="trip-type-round"]').click()
    cy.get('[data-cy="return-date"]').type(params.returnDate)
  }

  if (params.passengers) {
    cy.get('[data-cy="passenger-select"]').click()
    cy.get('[data-cy="adults-count"]').clear().type(String(params.passengers.adults))
    if (params.passengers.children) {
      cy.get('[data-cy="children-count"]').clear().type(String(params.passengers.children))
    }
    if (params.passengers.infants) {
      cy.get('[data-cy="infants-count"]').clear().type(String(params.passengers.infants))
    }
    cy.get('body').click() // Close passenger selector
  }

  if (params.cabinClass) {
    cy.get('[data-cy="cabin-class-select"]').select(params.cabinClass)
  }

  cy.get('[data-cy="search-button"]').click()
  cy.get('[data-cy="flight-results"]').should('be.visible')
})

Cypress.Commands.add('completeBooking', (params) => {
  cy.get('[data-cy="select-flight-button"]').first().click()
  
  params.passengers.forEach((passenger, index) => {
    cy.get(`[data-cy="passenger-${index}-type"]`).select(passenger.type)
    cy.get(`[data-cy="passenger-${index}-first-name"]`).type(passenger.firstName)
    cy.get(`[data-cy="passenger-${index}-last-name"]`).type(passenger.lastName)
    cy.get(`[data-cy="passenger-${index}-dob"]`).type(passenger.dateOfBirth)
    if (passenger.passportNumber) {
      cy.get(`[data-cy="passenger-${index}-passport"]`).type(passenger.passportNumber)
    }
  })

  cy.get('[data-cy="continue-to-payment"]').click()
  cy.get('[data-cy="card-number"]').type('4242424242424242')
  cy.get('[data-cy="card-expiry"]').type('1230')
  cy.get('[data-cy="card-cvc"]').type('123')
  cy.get('[data-cy="complete-payment"]').click()
  
  cy.get('[data-cy="booking-confirmation"]', { timeout: 10000 }).should('be.visible')
  cy.get('[data-cy="booking-reference"]').should('be.visible')
})

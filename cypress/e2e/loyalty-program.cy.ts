/// <reference types="cypress" />

describe('Loyalty Program', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'testpassword123')
  })

  it('should display loyalty account details', () => {
    cy.visit('/loyalty')
    cy.get('[data-cy="loyalty-tier"]').should('be.visible')
    cy.get('[data-cy="points-balance"]').should('be.visible')
    cy.get('[data-cy="tier-progress"]').should('be.visible')
  })

  it('should show tier benefits', () => {
    cy.visit('/loyalty/benefits')
    cy.get('[data-cy="tier-benefits"]').should('be.visible')
    cy.get('[data-cy="benefit-card"]').should('have.length.at.least', 4)
    cy.get('[data-cy="upgrade-tier"]').should('be.visible')
  })

  it('should redeem points for rewards', () => {
    cy.visit('/loyalty/rewards')
    cy.get('[data-cy="available-rewards"]').should('be.visible')
    
    // Select cabin upgrade reward
    cy.get('[data-cy="reward-cabin-upgrade"]').click()
    cy.get('[data-cy="select-booking"]').click()
    cy.get('[data-cy="booking-option"]').first().click()
    cy.get('[data-cy="confirm-redemption"]').click()
    
    cy.get('[data-cy="redemption-success"]').should('be.visible')
    cy.get('[data-cy="updated-points"]').should('be.visible')
  })

  it('should track points history', () => {
    cy.visit('/loyalty/history')
    cy.get('[data-cy="points-history"]').should('be.visible')
    cy.get('[data-cy="transaction-card"]').should('have.length.at.least', 1)
    
    // Verify transaction details
    cy.get('[data-cy="transaction-card"]').first().within(() => {
      cy.get('[data-cy="transaction-date"]').should('be.visible')
      cy.get('[data-cy="transaction-type"]').should('be.visible')
      cy.get('[data-cy="points-amount"]').should('be.visible')
    })
  })

  it('should handle tier upgrades', () => {
    cy.visit('/loyalty')
    cy.get('[data-cy="current-tier"]').invoke('text').then((currentTier) => {
      // Simulate points accumulation
      cy.window().then((win) => {
        win.postMessage({ 
          type: 'POINTS_UPDATE',
          points: 50000
        }, '*')
      })
      
      // Check tier upgrade notification
      cy.get('[data-cy="tier-upgrade-notification"]', { timeout: 10000 }).should('be.visible')
      cy.get('[data-cy="new-tier"]').should('not.contain', currentTier)
    })
  })

  it('should apply tier benefits to bookings', () => {
    // Start a new booking
    cy.searchFlights({
      origin: 'SFO',
      destination: 'JFK',
      departureDate: '2025-04-01'
    })

    // Verify tier benefits are applied
    cy.get('[data-cy="tier-discount"]').should('be.visible')
    cy.get('[data-cy="bonus-points"]').should('be.visible')
    cy.get('[data-cy="priority-boarding"]').should('be.visible')
  })

  it('should handle lounge access redemption', () => {
    cy.visit('/loyalty/rewards')
    cy.get('[data-cy="reward-lounge-access"]').click()
    
    // Select airport and date
    cy.get('[data-cy="select-airport"]').select('JFK')
    cy.get('[data-cy="select-date"]').type('2025-04-01')
    cy.get('[data-cy="confirm-lounge"]').click()
    
    cy.get('[data-cy="lounge-pass"]').should('be.visible')
    cy.get('[data-cy="qr-code"]').should('be.visible')
  })

  it('should handle extra baggage redemption', () => {
    cy.visit('/loyalty/rewards')
    cy.get('[data-cy="reward-extra-baggage"]').click()
    
    // Select booking to apply extra baggage
    cy.get('[data-cy="select-booking"]').click()
    cy.get('[data-cy="booking-option"]').first().click()
    cy.get('[data-cy="confirm-baggage"]').click()
    
    cy.get('[data-cy="baggage-confirmation"]').should('be.visible')
    cy.get('[data-cy="updated-baggage-allowance"]').should('be.visible')
  })
})

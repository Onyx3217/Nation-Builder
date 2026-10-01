import { describe, expect, it } from 'vitest'
import { applyFiscalEffects, deriveFiscalMetrics, settleFiscalPeriod, withFiscalProfile } from './fiscalEngine'

describe('fiscal engine', () => {
  it('derives a visible nominal GDP and annual public accounts', () => {
    const country = withFiscalProfile({ population: 30000000, gdpPerCapita: 28000, publicDebt: 64 })
    const metrics = deriveFiscalMetrics(country)

    expect(metrics.gdpNominalBillions).toBe(840)
    expect(metrics.treasuryBillions).toBe(33.6)
    expect(metrics.annualRevenueBillions).toBe(201.6)
    expect(metrics.annualInterestBillions).toBeGreaterThan(0)
    expect(metrics.annualBalanceBillions).toBeLessThan(0)
  })

  it('uses treasury before borrowing, then funds the deficit through public debt', () => {
    const country = {
      population: 10000000,
      gdpPerCapita: 10000,
      gdpNominal: 100,
      treasury: 1,
      taxRevenuePct: 10,
      governmentSpendingPct: 30,
      publicDebt: 20,
      inflationRate: 2,
      militaryTension: 20,
    }

    const cashRunway = settleFiscalPeriod(country, 10)
    const afterRunway = settleFiscalPeriod(country, 365)

    expect(cashRunway.treasury).toBeLessThan(country.treasury)
    expect(cashRunway.publicDebt).toBe(country.publicDebt)
    expect(afterRunway.treasury).toBe(0)
    expect(afterRunway.publicDebt).toBeGreaterThan(country.publicDebt)
  })

  it('caps treasury surpluses and uses them to pay down debt', () => {
    const country = {
      population: 10000000,
      gdpPerCapita: 10000,
      gdpNominal: 100,
      treasury: 14,
      taxRevenuePct: 40,
      governmentSpendingPct: 5,
      publicDebt: 30,
      inflationRate: 2,
      militaryTension: 20,
    }

    const next = settleFiscalPeriod(country, 365)

    expect(next.treasury).toBe(15)
    expect(next.publicDebt).toBeLessThan(country.publicDebt)
  })

  it('bounds treasury and fiscal-policy changes from an order', () => {
    const country = withFiscalProfile({ population: 10000000, gdpPerCapita: 10000, publicDebt: 40 })
    const effects = applyFiscalEffects(country, { treasury: 10000, taxRevenuePct: 100, governmentSpendingPct: -100 })

    expect(effects.treasury).toBe(15)
    expect(effects.taxRevenuePct).toBe(50)
    expect(effects.governmentSpendingPct).toBe(5)
  })
})

const DEFAULT_TAX_REVENUE_PCT = 24
const DEFAULT_GOVERNMENT_SPENDING_PCT = 24
const MAX_TREASURY_SHARE_OF_GDP = 0.15

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function numberOr(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function calculateNominalGdpBillions(country = {}) {
  const storedGdp = Number(country.gdpNominal)
  if (Number.isFinite(storedGdp) && storedGdp > 0) return storedGdp
  const population = Math.max(0, numberOr(country.population, 0))
  const gdpPerCapita = Math.max(0, numberOr(country.gdpPerCapita, 0))
  return population * gdpPerCapita / 1e9
}

export function withFiscalProfile(country = {}, source = country) {
  const gdpNominal = calculateNominalGdpBillions(country)
  return {
    ...country,
    treasury: Math.max(0, numberOr(source.treasury, gdpNominal * 0.04)),
    taxRevenuePct: clamp(numberOr(source.taxRevenuePct, DEFAULT_TAX_REVENUE_PCT), 5, 50),
    governmentSpendingPct: clamp(numberOr(source.governmentSpendingPct, DEFAULT_GOVERNMENT_SPENDING_PCT), 5, 60),
  }
}

export function deriveFiscalMetrics(country = {}) {
  const profile = withFiscalProfile(country)
  const gdpNominalBillions = calculateNominalGdpBillions(profile)
  const publicDebtPct = clamp(numberOr(profile.publicDebt, 0), 0, 300)
  const inflationRate = numberOr(profile.inflationRate, 2.3)
  const militaryTension = numberOr(profile.militaryTension, 20)
  const interestRatePct = clamp(
    2 + Math.max(0, publicDebtPct - 60) * 0.025
      + Math.max(0, inflationRate - 3) * 0.04
      + Math.max(0, militaryTension - 50) * 0.02,
    1.5,
    12,
  )
  const annualRevenueBillions = gdpNominalBillions * profile.taxRevenuePct / 100
  const annualPrimarySpendingBillions = gdpNominalBillions * profile.governmentSpendingPct / 100
  const annualInterestBillions = gdpNominalBillions * publicDebtPct / 100 * interestRatePct / 100

  return {
    gdpNominalBillions,
    treasuryBillions: profile.treasury,
    taxRevenuePct: profile.taxRevenuePct,
    governmentSpendingPct: profile.governmentSpendingPct,
    annualRevenueBillions,
    annualPrimarySpendingBillions,
    annualInterestBillions,
    interestRatePct,
    annualBalanceBillions: annualRevenueBillions - annualPrimarySpendingBillions - annualInterestBillions,
  }
}

export function applyFiscalEffects(country, effects = {}) {
  const profile = withFiscalProfile(country)
  const treasuryCap = calculateNominalGdpBillions(profile) * MAX_TREASURY_SHARE_OF_GDP
  return {
    treasury: Math.round(clamp(profile.treasury + numberOr(effects.treasury, 0), 0, treasuryCap) * 10) / 10,
    taxRevenuePct: Math.round(clamp(profile.taxRevenuePct + numberOr(effects.taxRevenuePct, 0), 5, 50) * 10) / 10,
    governmentSpendingPct: Math.round(clamp(profile.governmentSpendingPct + numberOr(effects.governmentSpendingPct, 0), 5, 60) * 10) / 10,
  }
}

export function settleFiscalPeriod(country, elapsedDays) {
  const profile = withFiscalProfile(country)
  const metrics = deriveFiscalMetrics(profile)
  const gdp = metrics.gdpNominalBillions
  if (gdp <= 0) return profile

  const projectedTreasury = profile.treasury + metrics.annualBalanceBillions * Math.max(0, Number(elapsedDays) || 0) / 365
  const treasuryCap = gdp * MAX_TREASURY_SHARE_OF_GDP
  const unfundedDeficit = Math.max(0, -projectedTreasury)
  const surplusAboveCap = Math.max(0, projectedTreasury - treasuryCap)
  const treasury = clamp(projectedTreasury, 0, treasuryCap)
  const publicDebt = clamp(
    numberOr(profile.publicDebt, 0) + (unfundedDeficit - surplusAboveCap) / gdp * 100,
    0,
    300,
  )

  return {
    ...profile,
    treasury: Math.round(treasury * 10) / 10,
    publicDebt: Math.round(publicDebt * 10) / 10,
  }
}

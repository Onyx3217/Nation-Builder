const LIMITS_PER_30_DAYS = {
  stability: 5,
  globalReputation: 3,
  militaryTension: 6,
  gdpPerCapita: 1000,
  inflationRate: 2,
  unemploymentRate: 1.5,
  publicDebt: 2,
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Validates a narrated AI proposal against code-owned game rules.
 * No AI value is applied without a known key, a finite number and a time-scaled cap.
 */
export function resolveTurnProposal(proposal, { currentDay, daysToSkip, countryIds, playerCountryId, relations = {} }) {
  if (!proposal) return null
  const requestedDays = Math.max(1, Math.round(Number(daysToSkip) || 1))
  const interruptedEarly = requestedDays > 1 && proposal.interruptedEarly
  const endDay = interruptedEarly
    ? clamp(proposal.interruptedAtDay, currentDay + 1, currentDay + requestedDays)
    : currentDay + requestedDays
  const elapsedDays = endDay - currentDay
  const statDeltas = Object.fromEntries(Object.entries(LIMITS_PER_30_DAYS).flatMap(([stat, perMonth]) => {
    const proposed = Number(proposal.statDeltas?.[stat])
    if (!Number.isFinite(proposed)) return []
    const cap = perMonth * elapsedDays / 30
    return [[stat, clamp(proposed, -cap, cap)]]
  }))
  const knownIds = new Set(countryIds)
  const contactLimit = elapsedDays >= 365 ? 4 : elapsedDays >= 91 ? 2 : 1
  const senders = new Set()
  const incomingDiplomacy = (proposal.incomingDiplomacy || [])
    .filter((item) => knownIds.has(item.countryId) && item.countryId !== playerCountryId && !senders.has(item.countryId))
    .slice(0, contactLimit)
    .map((item) => {
      senders.add(item.countryId)
      return item
    })
  const relationLimit = elapsedDays >= 365 ? 4 : elapsedDays >= 91 ? 3 : elapsedDays >= 30 ? 2 : 1
  const changedCountries = new Set()
  const relationChanges = (proposal.relationChanges || [])
    .filter((item) => knownIds.has(item.countryId)
      && item.countryId !== playerCountryId
      && ['ally', 'friendly', 'neutral', 'tense', 'hostile', 'war'].includes(item.relation)
      && (relations[item.countryId] || 'neutral') !== item.relation
      && !changedCountries.has(item.countryId))
    .slice(0, relationLimit)
    .map((item) => {
      changedCountries.add(item.countryId)
      return item
    })
  const eventLimit = elapsedDays >= 365 ? 8 : elapsedDays >= 91 ? 4 : 2
  const events = proposal.events.slice(0, eventLimit).map((event) => ({
    ...event,
    turn: clamp(event.turn, currentDay + 1, endDay),
  }))
  return { ...proposal, interruptedEarly, interruptedAtDay: endDay, statDeltas, incomingDiplomacy, relationChanges, events }
}

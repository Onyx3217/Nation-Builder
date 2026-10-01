import { describe, expect, it } from 'vitest'
import { resolveTurnProposal } from './turnEngine'

describe('resolveTurnProposal', () => {
  it('caps AI stat changes and rejects unknown diplomatic senders', () => {
    const result = resolveTurnProposal({
      interruptedEarly: false, interruptedAtDay: 31, crisisHeadline: '', crisisSummary: '',
      recommendedActions: [], periodReport: 'Calme.',
      statDeltas: { stability: -99, gdpPerCapita: 999999 },
      incomingDiplomacy: [{ countryId: 'ally', message: 'Bonjour' }, { countryId: 'unknown', message: 'Non' }],
      events: [],
    }, { currentDay: 1, daysToSkip: 30, countryIds: ['ally'] })
    expect(result.statDeltas.stability).toBe(-5)
    expect(result.statDeltas.gdpPerCapita).toBe(1000)
    expect(result.incomingDiplomacy).toEqual([{ countryId: 'ally', message: 'Bonjour' }])
  })
})

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

  it('accepts one-day diplomatic openings and only known, changed foreign relations', () => {
    const result = resolveTurnProposal({
      interruptedEarly: false,
      interruptedAtDay: 8,
      recommendedActions: [],
      periodReport: 'Évolution diplomatique.',
      statDeltas: {},
      incomingDiplomacy: [
        { countryId: 'ally', message: 'Proposons une rencontre.' },
        { countryId: 'unknown', message: 'Contact inconnu.' },
        { countryId: 'player', message: 'Message au joueur.' },
      ],
      relationChanges: [
        { countryId: 'ally', relation: 'neutral' },
        { countryId: 'player', relation: 'war' },
        { countryId: 'unknown', relation: 'hostile' },
      ],
      events: [],
    }, {
      currentDay: 7,
      daysToSkip: 1,
      countryIds: ['ally', 'player'],
      playerCountryId: 'player',
      relations: { ally: 'ally' },
    })

    expect(result.incomingDiplomacy).toEqual([{ countryId: 'ally', message: 'Proposons une rencontre.' }])
    expect(result.relationChanges).toEqual([{ countryId: 'ally', relation: 'neutral' }])
  })
})

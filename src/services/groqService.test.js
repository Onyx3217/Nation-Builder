import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAiCabinetAdvice, simulateTimePassage } from './groqService'

const country = {
  id: 'player',
  name: 'République solaire',
  flag: '☀️',
  regime: 'Republic',
  continent: 'Europe',
  population: 30000000,
  gdpPerCapita: 28000,
  gdpNominal: 840,
  treasury: 33.6,
  taxRevenuePct: 24,
  governmentSpendingPct: 24,
  publicDebt: 64,
  inflationRate: 2.3,
  unemploymentRate: 5.6,
  giniIndex: 31,
  stability: 75,
  militaryTension: 20,
  globalReputation: 60,
  militaryPower: 6,
}

afterEach(() => vi.unstubAllGlobals())

describe('geopolitical AI service prompts', () => {
  it('builds a Council request with current treasury without requiring time-simulation variables', async () => {
    const advice = {
      isDecision: false,
      title: 'Budget public',
      analysis: 'La trésorerie couvre les dépenses courantes.',
      flavorConsequence: '',
      collapseWarning: '',
      statEffects: {},
      diplomaticMessage: null,
      project: null,
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(advice) } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getAiCabinetAdvice({
      playerCountry: country,
      worldCountries: [],
      relations: {},
      playerQuery: 'Comment évolue notre trésorerie ?',
    })
    const request = JSON.parse(fetchMock.mock.calls[0][1].body)

    expect(result.analysis).toBe(advice.analysis)
    expect(request.messages[0].content).toContain('treasury $33.6B')
    expect(request.messages[0].content).not.toContain('Elapsed request: +undefined')
  })

  it('caps AI treasury changes for a one-day simulation', async () => {
    const proposal = {
      interruptedEarly: false,
      interruptedAtDay: 2,
      crisisHeadline: '',
      crisisSummary: '',
      recommendedActions: [],
      periodReport: 'Journée sans rupture.',
      statDeltas: { treasury: 100, taxRevenuePct: 2 },
      incomingDiplomacy: [],
      relationChanges: [],
      events: [],
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(proposal) } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await simulateTimePassage({
      playerCountry: country,
      worldCountries: [],
      relations: {},
      daysToSkip: 1,
      currentDay: 1,
    })

    expect(result.statDeltas.treasury).toBeCloseTo(0.28)
    expect(result.statDeltas.taxRevenuePct).toBeCloseTo(0.8 / 30)
  })
})

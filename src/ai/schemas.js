import { z } from 'zod'

const boundedText = (max) => z.string().trim().min(1).max(max)

export const statDeltasSchema = z.object({
  stability: z.number().finite().optional(),
  globalReputation: z.number().finite().optional(),
  militaryTension: z.number().finite().optional(),
  gdpPerCapita: z.number().finite().optional(),
  inflationRate: z.number().finite().optional(),
  unemploymentRate: z.number().finite().optional(),
  publicDebt: z.number().finite().optional(),
}).strict()

export const timeSimulationSchema = z.object({
  interruptedEarly: z.boolean(),
  interruptedAtDay: z.number().int().positive(),
  crisisHeadline: z.string().max(240),
  crisisSummary: z.string().max(1800),
  recommendedActions: z.array(boundedText(300)).max(3),
  periodReport: z.string().max(4000),
  statDeltas: statDeltasSchema,
  incomingDiplomacy: z.array(z.object({
    countryId: boundedText(100),
    message: boundedText(240),
  }).strict()).max(4),
  relationChanges: z.array(z.object({
    countryId: boundedText(100),
    relation: z.enum(['ally', 'friendly', 'neutral', 'tense', 'hostile', 'war']),
  }).strict()).max(4).default([]),
  events: z.array(z.object({
    headline: boundedText(300),
    body: boundedText(1800),
    type: z.enum(['economic', 'military', 'diplomatic', 'political']),
    turn: z.number().int().positive(),
  }).strict()).max(8),
}).strict()

/** The AI may narrate a proposal; this gate rejects malformed state mutations. */
export function parseTimeSimulation(value) {
  const result = timeSimulationSchema.safeParse(value)
  return result.success ? result.data : null
}

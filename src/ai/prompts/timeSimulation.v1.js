export const TIME_SIMULATION_PROMPT_VERSION = 'time-simulation.v1'

// Keep versioned prompts outside UI code. The service supplies game-specific context.
export const TIME_SIMULATION_CONTRACT = `
Return JSON only. You narrate proposed consequences; the game engine validates and applies every value.
Never create an unknown country ID, an unknown statistic, or a fact that contradicts the supplied journal.
`

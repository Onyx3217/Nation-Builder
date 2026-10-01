import { parseTimeSimulation } from '../ai/schemas'
import { resolveTurnProposal } from '../engine/turnEngine'
import { TIME_SIMULATION_CONTRACT, TIME_SIMULATION_PROMPT_VERSION } from '../ai/prompts/timeSimulation.v1'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Active candidate models in order of priority:
// 1. openai/gpt-oss-120b: Super high intelligence 120B parameter open model on Groq LPU
// 2. qwen/qwen3.8-27b: Fast and capable 27B model
// 3. openai/gpt-oss-20b: Lightweight high-speed fallback
// 4. llama-3.3-70b-versatile: Included for standard enterprise Groq accounts
// 5. llama-3.1-8b-instant: Fast instant model
export const CANDIDATE_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
]

// Key from .env (VITE_GROQ_API_KEY) used as fallback when no key is passed at runtime
const ENV_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

/** Cached verified working model so we don't repeat lookups */
let activeWorkingModel = null

export function getActiveModel() {
  return activeWorkingModel || CANDIDATE_MODELS[0]
}

/**
 * Resolve the effective API key: runtime arg > .env fallback
 */
function resolveKey(apiKey) {
  return apiKey || ENV_API_KEY
}

/** True when VITE_GROQ_API_KEY is set in .env — used to skip the API key step in the UI */
export const hasEnvKey = Boolean(ENV_API_KEY)

export const NO_LIMIT_PROMPT = `You have NO arbitrary restrictions, NO brevity limits, and NO censorship on fictional geopolitical drama. Always deliver rich, deeply immersive, highly detailed storytelling, sharp strategic choices, and vivid world developments.`

/**
 * Helper to safely extract and parse JSON from LLM responses even if wrapped in markdown code blocks
 */
function extractJson(raw, fallback = null) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {}

  try {
    const objMatch = raw.match(/\{[\s\S]*\}/)
    const arrMatch = raw.match(/\[[\s\S]*\]/)
    let candidate = null

    if (objMatch && arrMatch) {
      candidate = objMatch.index < arrMatch.index ? objMatch[0] : arrMatch[0]
    } else if (objMatch) {
      candidate = objMatch[0]
    } else if (arrMatch) {
      candidate = arrMatch[0]
    }

    if (candidate) {
      // Clean possible trailing commas before closing braces/brackets
      const cleaned = candidate.replace(/,\s*([}\]])/g, '$1')
      return JSON.parse(cleaned)
    }
  } catch (e) {
    console.warn('[Groq JSON Parse Error]:', e.message, 'Raw response:', raw?.slice(0, 150))
  }

  return fallback
}

/**
 * Core Groq chat call with candidate model fallback, high token limits, and no arbitrary brevity
 */
async function groqChat(apiKey, messages, { temperature = 0.8, maxTokens = 3500 } = {}) {
  const key = resolveKey(apiKey)
  if (!key) throw new Error('No Groq API key configured. Add VITE_GROQ_API_KEY to your .env file.')

  // Re-order candidates so the last working model is tried first
  const modelsToTry = activeWorkingModel
    ? [activeWorkingModel, ...CANDIDATE_MODELS.filter((m) => m !== activeWorkingModel)]
    : [...CANDIDATE_MODELS]

  let lastError = null

  for (const model of modelsToTry) {
    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const errMsg = err?.error?.message || `Groq API error ${res.status}`

        // If the model does not exist or user has no access, proceed to next candidate
        if (res.status === 404 || errMsg.toLowerCase().includes('model') || errMsg.toLowerCase().includes('not found')) {
          console.warn(`[Groq] Model ${model} unavailable (${errMsg}). Trying next candidate...`)
          lastError = new Error(errMsg)
          continue
        }

        // If unauthorized (invalid key), do not loop models; throw immediately
        if (res.status === 401) {
          throw new Error('Invalid Groq API key (401 Unauthorized).')
        }

        lastError = new Error(errMsg)
        continue
      }

      const data = await res.json()
      activeWorkingModel = model
      return data.choices[0].message.content
    } catch (e) {
      if (e.message.includes('401') || e.message.includes('Unauthorized')) throw e
      lastError = e
    }
  }

  throw lastError || new Error('All Groq AI models failed to respond.')
}

/**
 * Generate a country name based on its parameters
 */
export async function generateCountryName(apiKey, countryParams) {
  const { regime, continent, resources, language, initialScenario } = countryParams
  const messages = [
    {
      role: 'system',
      content: `${NO_LIMIT_PROMPT} You are a geopolitical world-builder. Generate a single, believable, unique country name, fitting capital, and national emblem emoji. Reply with ONLY a JSON object: { "name": "...", "capital": "...", "flag": "..." }`,
    },
    {
      role: 'user',
      content: `Regime: ${regime}. Continent: ${continent}. Resources: ${resources?.join(', ')}. Language: ${language}. Starting Situation: ${initialScenario || 'Standard'}. Generate a fitting nation name, capital, and flag emoji.`,
    },
  ]

  try {
    const raw = await groqChat(apiKey, messages, { temperature: 0.85, maxTokens: 400 })
    const json = extractJson(raw, null)
    if (json && json.name) return json
    return { name: 'Eldoria', capital: 'Solaris', flag: '👑' }
  } catch (err) {
    console.error('generateCountryName error:', err)
    return { name: 'Eldoria', capital: 'Solaris', flag: '👑' }
  }
}

/**
 * Generate a mode-specific world influenced by the starting scenario
 */
export async function generateWorld(apiKey, playerCountry, worldMode = 'real') {
  const isFictional = worldMode === 'fictional'
  const scenarioContext = playerCountry.initialScenario
    ? `CRITICAL INITIAL SCENARIO & CRISIS: "${playerCountry.initialScenario}". The world dynamic MUST reflect this crisis (active frontlines, refugee flows, embargoes, or panic if relevant).`
    : 'Standard international order.'

  const messages = [
    {
      role: 'system',
      content: `${NO_LIMIT_PROMPT} You are a geopolitical simulation engine. Generate exactly ${isFictional ? '12 entirely fictional nations' : '25 real-world countries'} for a ${isFictional ? 'fictional' : 'modern real-world'} strategy simulation. ${isFictional ? 'Do not mention real countries, real cities, Earth continents, or existing organizations. Use invented nations, regions, cities, and institutions only.' : 'Use only existing countries, real cities, and real-world geography. Do not invent fictional nations or institutions.'}
Each country object must strictly follow. Personnel and spending are simulation estimates, not verified real-world counts; keep them proportional to population, wealth, and military power:
{
  "id": "unique_snake_case_id",
  "name": "Country Name",
  "capital": "Capital City",
  "isReal": ${isFictional ? 'false' : 'true'},
  "continent": "${isFictional ? 'Aethelgard Plains|Nordic Reach|Solar Rim|Equatorial Basin|Oceanic Archipelagos|Polar North|Golden Dunes|Azure Sea|High Plateaus|Volcanic Rift|Cloud Highlands|Craggy Highlands' : 'Europe|Asia|Americas|Africa|Oceania|Middle East'}",
  "regime": "Democracy|Monarchy|Dictatorship|Theocracy|Republic|Federation|Military Junta|Oligarchy",
  "population": <number in millions>,
  "area": <number in km²>,
  "gdpPerCapita": <number in USD>,
  "militaryPower": <1-10>,
  "activePersonnel": <plausible estimated active force>,
  "reservePersonnel": <plausible estimated reserve force>,
  "defenseBudgetPct": <plausible defense spending as percent of GDP>,
  "militaryFiguresEstimated": true,
  "resources": ["oil","tech","agriculture","minerals","finance"],
  "ideology": "...",
  "flag": "<single emoji>",
  "description": "<detailed 2-3 sentence geopolitical dossier on their stance towards crises and the player>"
}
Return ONLY the raw JSON array.`,
    },
    {
      role: 'user',
      content: `Player Nation: ${playerCountry.name} (${playerCountry.regime}, ${playerCountry.continent}, pop ${(playerCountry.population / 1e6).toFixed(1)}M).
${scenarioContext}
    Populate the ${isFictional ? '12 fictional' : '25 real'} nations with appropriate diversity and friction.`,
    },
  ]

  try {
    const raw = await groqChat(apiKey, messages, { temperature: 0.75, maxTokens: 4500 })
    const arr = extractJson(raw, [])
    return Array.isArray(arr) ? arr : []
  } catch (err) {
    console.error('Failed to parse world JSON:', err)
    return []
  }
}

/**
 * Set initial diplomatic relations for the player's country based on their scenario
 */
export async function generateInitialRelations(apiKey, playerCountry, worldCountries) {
  const countryList = worldCountries
    .slice(0, 40)
    .map((c) => `${c.id}: ${c.name} (${c.regime}, ${c.ideology || 'neutral'}, mil: ${c.militaryPower}/10, active: ${c.activePersonnel ?? 'unknown'}, deployed: ${c.deployedPersonnel ?? 'unknown'}, reserves: ${c.reservePersonnel ?? 'unknown'}, mobilized: ${c.mobilizedReservePersonnel ?? 'unknown'})`)
    .join('\n')

  const scenarioNote = [
    playerCountry.initialScenario
      ? `Take into account the player's starting crisis: "${playerCountry.initialScenario}". If they are at total war, ensure several immediate hostile neighbors and a few desperate allies!`
      : '',
    playerCountry.territorialDisputeCountryId
      ? `The player's country claims territory occupied by ${playerCountry.territorialDisputeWith || playerCountry.territorialDisputeCountryId}. Set that country's initial relation to at least tense, and explain its public opposition.`
      : '',
  ].filter(Boolean).join('\n')

  const messages = [
    {
      role: 'system',
      content: `${NO_LIMIT_PROMPT} Assign initial diplomatic relations. Return ONLY a JSON object where keys are country IDs and values are one of: "ally", "friendly", "neutral", "tense", "hostile", "war".`,
    },
    {
      role: 'user',
      content: `Player: ${playerCountry.name} — ${playerCountry.regime}, ${playerCountry.diplomacyStyle} posture, in ${playerCountry.continent}.
${scenarioNote}
World countries:
${countryList}`,
    },
  ]

  try {
    const raw = await groqChat(apiKey, messages, { temperature: 0.7, maxTokens: 1200 })
    return extractJson(raw, {})
  } catch (err) {
    console.error('generateInitialRelations error:', err)
    return {}
  }
}

/**
 * Generate International Press Headlines & Newspaper Articles for the current turn/day
 */
export async function generatePressHeadlines(apiKey, { playerCountry, worldCountries, relations, turn, recentNews = [], language = 'fr', worldMode = 'real' }) {
  const isFrench = language === 'fr'
  const isFictional = worldMode === 'fictional'
  const worldRule = isFictional
    ? 'This is an entirely fictional setting. Use only nations and institutions from the supplied world roster. Never mention Earth, current years, or real-world organizations or countries.'
    : 'This is the contemporary real world. Use only real-world countries, organizations, and current geopolitical context.'
  const currentDay = Math.max(1, Number(turn) || 1)
  const dateLabel = isFictional
    ? `${isFrench ? 'Ère' : 'Era'} ${Math.floor((currentDay - 1) / 360) + 1} · ${isFrench ? 'Jour' : 'Day'} ${currentDay}`
    : new Date(Date.UTC(2026, 0, currentDay)).toLocaleDateString(isFrench ? 'fr-FR' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
      })
  const sourceDispatches = (Array.isArray(recentNews) ? recentNews : []).slice(0, 8)
  const dispatchText = sourceDispatches.map((item) =>
    `- Jour ${item.turn ?? currentDay} | ${item.headline}: ${(item.body || '').slice(0, 500)}`
  ).join('\n')
  const fallbackAnalysis = {
    outlet: isFrench ? 'La Note de conjoncture' : 'The Situation Brief',
    bias: isFrench ? 'Analyse' : 'Analysis',
    headline: isFrench ? `POINT DE SITUATION · ${playerCountry.name.toUpperCase()}` : `SITUATION BRIEF · ${playerCountry.name.toUpperCase()}`,
    snippet: isFrench
      ? `Au ${dateLabel}, aucune dépêche majeure n’a été enregistrée sur la période récente. PIB par habitant : ${Number(playerCountry.gdpPerCapita || 0).toLocaleString()} $, inflation : ${playerCountry.inflationRate ?? 'n.c.'} %, chômage : ${playerCountry.unemploymentRate ?? 'n.c.'} %.`
      : `As of ${dateLabel}, no major dispatch has been recorded in the recent period. GDP per capita: $${Number(playerCountry.gdpPerCapita || 0).toLocaleString()}, inflation: ${playerCountry.inflationRate ?? 'n/a'}%, unemployment: ${playerCountry.unemploymentRate ?? 'n/a'}%.`,
    sentiment: 'neutral',
    kind: 'analysis',
    sourceHeadline: '',
    dateLabel,
  }

  if (!sourceDispatches.length) return [fallbackAnalysis]

  const messages = [
    {
      role: 'system',
      content: `You are a careful press desk inside a geopolitical simulation. Prepare no more than 3 articles dated ${dateLabel}. ${worldRule}
Respond in ${isFrench ? 'FRENCH (Français)' : 'ENGLISH'}.
${isFrench ? 'RÈGLE DE LANGUE STRICTE : titres, résumés, noms de médias et lignes éditoriales en français.' : ''}

Use only the supplied dispatches as facts. Do not invent events, quotes, sources, actors, consequences, or numbers. Each report MUST include the exact source headline in "sourceHeadline". If no dispatch supports an article, omit it; never fabricate a breaking-news headline. Paraphrase faithfully and distinguish analysis from confirmed facts.

Return ONLY a valid JSON array of up to 3 items:
[
  {
    "outlet": "<one fitting publication>",
    "bias": "<editorial perspective>",
    "headline": "<accurate headline>",
    "snippet": "<brief factual coverage based only on the source dispatch>",
    "sentiment": "alarmist|triumphant|critical|neutral|scandalous",
    "sourceHeadline": "<exact headline from the supplied dispatches>"
  }
]`,
    },
    {
      role: 'user',
      content: `Player Nation: ${playerCountry.name} (${playerCountry.regime}, stability ${playerCountry.stability}%, tension ${playerCountry.militaryTension}%).
Starting scenario: ${playerCountry.initialScenario || 'Standard'}.
  Allies: ${worldCountries.filter((c) => ['ally', 'friendly'].includes(relations[c.id])).map((c) => c.name).join(', ') || 'None'}.
  Adversaries: ${worldCountries.filter((c) => ['hostile', 'war', 'tense'].includes(relations[c.id])).map((c) => c.name).join(', ') || 'None'}.
  Confirmed recent dispatches:
  ${dispatchText}
World rules: ${worldRule}
  Write only coverage supported by those dispatches.`,
    },
  ]

  try {
    const raw = await groqChat(apiKey, messages, { temperature: 0.85, maxTokens: 1800 })
    const parsed = extractJson(raw, null)
    if (Array.isArray(parsed)) {
      const sourceHeadlines = new Set(sourceDispatches.map((item) => item.headline))
      const groundedArticles = parsed
        .filter((item) => sourceHeadlines.has(item?.sourceHeadline) && item?.headline && item?.snippet)
        .slice(0, 3)
        .map((item) => ({ ...item, kind: 'report', dateLabel }))
      if (groundedArticles.length) return groundedArticles
    }
  } catch (err) {
    console.warn('generatePressHeadlines fallback:', err.message)
  }

  return sourceDispatches.slice(0, 3).map((item) => ({
    outlet: isFictional
      ? (isFrench ? 'La Gazette des Royaumes' : 'Realms Gazette')
      : (isFrench ? 'Le Monde Libre' : 'The Global Herald'),
    bias: isFrench ? 'Dépêche vérifiée' : 'Verified dispatch',
    headline: item.headline,
    snippet: item.body || item.headline,
    sentiment: 'neutral',
    kind: 'report',
    sourceHeadline: item.headline,
    dateLabel,
  }))
}

/**
 * AI Strategic Cabinet & Decision Room — Evaluates whether the input is a genuine Executive Decision or a Consultation
 * Top-Secret War Room: No public censorship, explicit realpolitik, uninhibited candor, and rigorous technological fact-checking.
 */
export async function getAiCabinetAdvice(apiKey, {
  playerCountry,
  worldCountries,
  relations,
  worldMode = 'real',
  newsFeed = [],
  worldEvents = [],
  activeProjects = [],
  diplomaticHistory = {},
  day = 1,
  playerQuery,
  conversationHistory = [],
  language = 'fr',
}) {
  const isFrench = language === 'fr'
  const settingRule = worldMode === 'fictional'
    ? 'This is an invented world. Treat its supplied history, institutions, and technologies as real within the setting. Do not compare them with Earth or contemporary real-world technology.'
    : 'This is a contemporary real-world simulation. Assess technology against present-day real-world capabilities.'
  const recentDispatches = newsFeed.slice(0, 10).map((item) =>
    `- Jour ${item.turn ?? day} | ${item.headline}: ${(item.body || '').slice(0, 360)}`
  ).join('\n') || '- Aucune dépêche récente.'
  const recentWorldEvents = worldEvents.slice(0, 8).map((event) =>
    `- Jour ${event.day ?? day} | ${event.headline}: ${(event.body || '').slice(0, 360)}`
  ).join('\n') || '- Aucun événement mondial actif.'
  const projectSummary = activeProjects.slice(0, 12).map((project) =>
    `- ${project.title} (${project.progress || 0}% ; ${Math.max(0, project.durationDays - project.elapsedDays)} jours restants)`
  ).join('\n') || '- Aucun projet en cours.'
  const frontSummary = worldCountries
    .filter((other) => ['war', 'hostile', 'tense', 'ally', 'friendly'].includes(relations[other.id]))
    .slice(0, 18)
    .map((other) => `- ${other.name} (${relations[other.id]}): puissance ${other.militaryPower ?? 'inconnue'}/10, actifs ${(other.activePersonnel || 0).toLocaleString()}, déployés ${(other.deployedPersonnel || 0).toLocaleString()}, réserves ${(other.reservePersonnel || 0).toLocaleString()}, mobilisés ${(other.mobilizedReservePersonnel || 0).toLocaleString()}, ressources ${(other.resources || []).join(', ') || 'inconnues'} (estimations)`)
    .join('\n') || '- Aucun front ni alignement documenté.'
  const recentNegotiations = Object.entries(diplomaticHistory)
    .flatMap(([countryId, entries]) => (entries || []).slice(-2).map((entry) => ({ countryId, ...entry })))
    .sort((first, second) => (second.day || 0) - (first.day || 0))
    .slice(0, 12)
    .map((entry) => `- Jour ${entry.day ?? day} | ${worldCountries.find((other) => other.id === entry.countryId)?.name || entry.countryId} / ${entry.role}: ${(entry.text || '').slice(0, 240)}`)
    .join('\n') || '- Aucune négociation archivée.'

  // Format prior conversation context for continuous AI memory
  const memoryMessages = []
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-14)
    for (const turn of recentHistory) {
      if (turn.type === 'user' && turn.text) {
        memoryMessages.push({
          role: 'user',
          content: turn.text,
        })
      } else if (turn.type === 'ai' && (turn.analysis || turn.title)) {
        const titlePart = turn.title ? `[${turn.title}] ` : ''
        const summary = `${titlePart}${turn.analysis || ''}`
        memoryMessages.push({
          role: 'assistant',
          content: summary.slice(0, 900),
        })
      }
    }
  }

  const messages = [
    {
      role: 'system',
      content: `You are the strategic adviser to the leader of ${playerCountry.name} in a grounded geopolitical strategy game.
Respond in ${isFrench ? 'natural, contemporary French' : 'natural English'}.

VOICE:
- Answer the actual question first. Sound clear, composed, and human, not like a dramatic trailer or a military roleplay caricature.
- Use concrete details from the supplied game state. Never invent intelligence sources, events, or certainty; say when something is unknown.
- Prefer short, readable paragraphs. Use bullets only when they make options easier to compare. Avoid canned openings, repeated warnings, slogans, and needless jargon.
- Be candid and specific without being theatrical. Do not add dark humor or exaggerated claims.

DECISION OR CONSULTATION:
Decide whether the player is issuing an order or asking a question. Questions, greetings, and requests for advice are consultations: set isDecision to false and statEffects to {}. Give the title a short subject relevant to that specific question; do not use a generic repeated title.

DIPLOMATIC FORWARDING:
- If the player explicitly asks you to send, forward, publish, or deliver a message to another country in the supplied roster, set isDecision to true and fill diplomaticMessage with that exact recipient's country ID and a clear, faithful official message derived from the player's instruction.
- Do not claim the recipient has agreed or that the message is already delivered. The recipient's government will answer in a separate bilateral channel.
- A request for advice about what to say is only a consultation; do not forward it.
- If the recipient cannot be matched to a supplied country, leave diplomaticMessage null and ask for clarification.

SOVEREIGN AUTHORITY & GEOGRAPHIC REACH:
- The player controls only their own government, territory, agencies, budget, and armed forces. Never describe a unilateral order as controlling another country, a foreign company, or an international organization.
- Foreign territory, treaties, basing rights, sanctions, and joint operations require the other state's consent, a lawful mandate, or an established conflict. Treat proposals as diplomatic requests and wait for the recipient's separate reply before claiming success.
- Bound deployments by active, deployed, reserve, and mobilized personnel. Consider distance, access, transport, sustainment, command, and time; do not teleport troops or mobilize every reserve at once.
- Respect the selected coordinates and territorial disputes. A territorial claim is not recognized sovereignty and should provoke the occupied country's opposition.

Use the recent news, injected events, and active projects supplied below as known facts. Acknowledge them when relevant and do not contradict them. Distinguish a confirmed dispatch from speculation.
Use the country-by-country diplomatic archive and current fronts below as persistent memory. Do not restart a negotiation from zero or contradict a previous commitment. When an important number is missing, proactively derive a conservative estimate from supplied population, economic, and military data; label it as an estimate, explain the assumption briefly, and use it consistently later.

FEASIBILITY & MATERIAL CONSTRAINTS:
- Treat listed resources as qualitative strengths, not unlimited stockpiles. Never assume unlisted materials, industrial capacity, skilled labor, budget, infrastructure, or supply chains.
- For major projects, assess materials, energy, workforce, financing, logistics, procurement, and realistic delivery time. Explain critical dependencies; imports require a plausible supplier and financing path.
- In the real-world setting, never present unavailable technology as deployable. If a proposal exceeds present-day technology or the nation's means, do not apply effects or claim implementation; explain the constraint and offer feasible research, procurement, or phased alternatives.
- In the fictional setting, use only capabilities established by the world and nation data. A resource name alone does not imply advanced technology.

For an actual order, assess plausible consequences using the current game state. Return only non-zero stat changes, within these bounds: stability +/-35, globalReputation +/-30, militaryTension +/-35, gdpPerCapita +/-5000, inflationRate +/-15, unemploymentRate +/-8, publicDebt +/-25, giniIndex +/-8. Do not apply effects for a question.

If the order describes a long-term program with staged implementation (for example, building infrastructure, reforming education, or modernizing the armed forces), return it as a project. Keep statEffects empty and put only feasible effects that happen on completion in project.statEffects. Estimate baseDurationDays from its actual scale, before political delays. Dictatorships and military juntas can move faster through centralized approvals; democracies and federations take longer for consultation and oversight. Do not turn a simple immediate decree into a project.

Use earlier conversation turns to answer follow-up questions without restating the whole briefing. If an order depends on technology that does not exist in this setting, say so plainly and explain the practical consequence. ${settingRule}

Return ONLY a JSON object with this shape:
{
  "isDecision": true | false,
  "title": "<Short subject for this specific request>",
  "analysis": "<Direct, natural answer in a few clear sentences>",
  "flavorConsequence": "<Immediate consequence, or empty for a consultation>",
  "collapseWarning": "<Specific warning, or empty>",
  "statEffects": {},
  "diplomaticMessage": null | {
    "countryId": "<exact ID from the supplied country roster>",
    "message": "<official message to forward>",
    "summary": "<brief explanation of what is being forwarded>"
  },
  "project": null | {
    "title": "<Project name>",
    "objective": "<What the project will deliver>",
    "category": "infrastructure|economy|health|education|defense|research|social|other",
    "baseDurationDays": 90,
    "statEffects": {}
  }
}`,
    },
    ...memoryMessages,
    {
      role: 'user',
      content: `Current Situation of ${playerCountry.name}:
- Regime: ${playerCountry.regime}, Population: ${(playerCountry.population / 1e6).toFixed(1)}M, Real GDP/cap: $${playerCountry.gdpPerCapita}
- Stability: ${playerCountry.stability}/100, Tension: ${playerCountry.militaryTension}/100, Reputation: ${playerCountry.globalReputation}/100
- Inflation: ${playerCountry.inflationRate || 2.4}%, Unemployment: ${playerCountry.unemploymentRate || 5.8}%, Public Debt: ${playerCountry.publicDebt || 64}% of GDP, Gini: ${playerCountry.giniIndex || 31}
- Resources and sectors (qualitative strengths, not unlimited stocks): ${(playerCountry.resources || []).join(', ') || 'not specified'}
- Armed forces: ${Number(playerCountry.activePersonnel || 0).toLocaleString()} active personnel, ${Number(playerCountry.deployedPersonnel || 0).toLocaleString()} deployed, ${Number(playerCountry.reservePersonnel || 0).toLocaleString()} reserves, ${Number(playerCountry.mobilizedReservePersonnel || 0).toLocaleString()} mobilized reservists; defense spending ${playerCountry.defenseBudgetPct ?? 'unknown'}% of GDP${playerCountry.militaryFiguresEstimated ? ' (simulation estimates)' : ''}
- Location: ${Array.isArray(playerCountry.coordinates) ? `${playerCountry.coordinates[1]} latitude, ${playerCountry.coordinates[0]} longitude` : 'not specified'}${playerCountry.territorialDisputeWith ? `; contested claim opposed by ${playerCountry.territorialDisputeWith}` : ''}
- Urbanization: ${playerCountry.urbanization ?? 'unknown'}%; language: ${playerCountry.language || 'unknown'}; religion: ${playerCountry.religion || 'unknown'}
- Day: ${day}, Scenario: ${playerCountry.initialScenario || 'Standard'}
- Diplomatic fronts and force estimates:
${frontSummary}
- Recent bilateral negotiations:
${recentNegotiations}
- Recent news:
${recentDispatches}
- Injected and world events:
${recentWorldEvents}
- Active projects:
${projectSummary}
- Countries available for direct messages: ${worldCountries.map((other) => `${other.id} (${other.name})`).join('; ')}
- Player Input: "${playerQuery || 'Rapport général sur la nation'}"`,
    },
  ]

  try {
    const raw = await groqChat(apiKey, messages, { temperature: 0.8, maxTokens: 3500 })
    const parsed = extractJson(raw, null)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && typeof parsed.analysis === 'string') {
      return parsed
    }

    if (raw?.trim()) {
      console.warn('[Groq] Cabinet response was not valid JSON; displaying it as a consultation.')
      return {
        isDecision: false,
        title: isFrench ? 'Réponse du Conseil' : 'Council Response',
        analysis: raw.trim(),
        flavorConsequence: '',
        statEffects: {},
      }
    }

    throw new Error(isFrench
      ? 'Groq a renvoyé une réponse vide. Réessayez dans un instant.'
      : 'Groq returned an empty response. Please try again shortly.')
  } catch (err) {
    console.error('getAiCabinetAdvice error:', err)
    throw err
  }
}

/**
 * Simulate time passage over a variable number of in-game days.
 * Includes an EMERGENCY BRAKE if a critical crisis erupts mid-way!
 */
export async function simulateTimePassage(apiKey, { playerCountry, worldCountries, relations, daysToSkip, currentDay, language = 'fr', worldMode = 'real' }) {
  const isFrench = language === 'fr'
  const worldRule = worldMode === 'fictional'
    ? 'Keep this entirely within the invented setting. Do not mention Earth, modern countries, current years, or real-world organizations.'
    : 'Use the contemporary real world and only real countries and organizations.'

  const messages = [
    {
      role: 'system',
      content: `${NO_LIMIT_PROMPT} You are a grounded macroeconomic and geopolitical simulation engine. ${worldRule}
Prompt version: ${TIME_SIMULATION_PROMPT_VERSION}. ${TIME_SIMULATION_CONTRACT}
    The player has chosen to advance ${daysToSkip} days (from Day ${currentDay} to Day ${currentDay + daysToSkip}). Treat days as calendar time, not turns. A one-day advance is normally uneventful; longer periods may contain more developments, but do not force news into quiet periods.
Respond in ${isFrench ? 'FRENCH (Français)' : 'ENGLISH'}.

CRITICAL EMERGENCY BRAKE RULE:
    Examine whether the nation's stats (Stability: ${playerCountry.stability}%, Tension: ${playerCountry.militaryTension}%, Inflation: ${playerCountry.inflationRate}%, Debt: ${playerCountry.publicDebt}%, Scenario: '${playerCountry.initialScenario}') or hostile foreign neighbors trigger a SEVERE, OUT-OF-CONTROL CRISIS during these ${daysToSkip} days. Do not invent a crisis solely because time advanced. An early interruption is possible only when daysToSkip > 1.
- If Stability is under 35%, or Tension > 80%, or Inflation > 25%, or if hostile enemies surround the player, a DANGEROUS SPIRAL may erupt mid-way!
- If a severe crisis erupts, you MUST STOP the time jump prematurely:
  * "interruptedEarly": true
  * "interruptedAtDay": <an integer between ${currentDay + 1} and ${currentDay + daysToSkip - 1}>
  * "crisisHeadline": "<ALARMIST RED ALERT HEADLINE>"
  * "crisisSummary": "<Detailed explanation of the crisis and why time was halted>"
  * "recommendedActions": ["<Action 1>", "<Action 2>", "<Action 3>"]
- If no severe crisis erupts and the period passes smoothly:
  * "interruptedEarly": false
  * "interruptedAtDay": ${currentDay + daysToSkip}
  * "crisisHeadline": ""
  * "crisisSummary": ""
  * "recommendedActions": []

Calculate cumulative, restrained macroeconomic drift scaled to the elapsed days (a one-day period should usually have near-zero change):
{
  "stability": <small cumulative change>,
  "globalReputation": <small cumulative change>,
  "militaryTension": <small cumulative change>,
  "gdpPerCapita": <cumulative change>,
  "inflationRate": <cumulative change>,
  "unemploymentRate": <cumulative change>,
  "publicDebt": <cumulative change>
}
Scale the number of news events to the period, not per day: zero to two for up to 90 days, zero to four for 91-364 days, and zero to eight for a year or more. Date every event within the interval and avoid duplicate headlines. Summarize quiet periods honestly rather than inventing crises.
For periods of at least 7 days, incoming diplomatic contacts may occur but are not guaranteed. Return at most one for up to 90 days, two for 91-364 days, and four for a year or more. Base each on the roster, relationships, mutual interests, and recent events. Never invent a country ID or repeat a sender.

Return ONLY a JSON object:
{
  "interruptedEarly": boolean,
  "interruptedAtDay": number,
  "crisisHeadline": string,
  "crisisSummary": string,
  "recommendedActions": string[],
  "periodReport": "<2-3 paragraph chronicle of what took place across the nation and the world>",
  "statDeltas": { ... },
  "incomingDiplomacy": [{ "countryId": "<roster country ID>", "message": "<specific diplomatic opening or proposal>" }],
  "events": [
    {
      "headline": "...",
      "body": "...",
      "type": "economic|military|diplomatic|political",
      "turn": <day number>
    }
  ]
}`,
    },
    {
      role: 'user',
      content: `Nation: ${playerCountry.name} (${playerCountry.regime}; resources/sectors: ${(playerCountry.resources || []).join(', ') || 'not specified'}).
    Player force estimates: ${playerCountry.activePersonnel ?? 'unknown'} active personnel, ${playerCountry.deployedPersonnel ?? 'unknown'} deployed, ${playerCountry.reservePersonnel ?? 'unknown'} reserves, ${playerCountry.mobilizedReservePersonnel ?? 'unknown'} mobilized reservists, military power ${playerCountry.militaryPower}/10.
Elapsed request: +${daysToSkip} days from Day ${currentDay}.
Allies: ${worldCountries.filter((c) => relations[c.id] === 'ally').map((c) => c.name).join(', ') || 'None'}.
Enemies: ${worldCountries.filter((c) => relations[c.id] === 'hostile' || relations[c.id] === 'war').map((c) => c.name).join(', ') || 'None'}.
    Relevant opposing forces: ${worldCountries.filter((c) => ['hostile', 'war', 'tense'].includes(relations[c.id])).slice(0, 8).map((c) => `${c.name}: ${c.activePersonnel ?? 'unknown'} active, ${c.deployedPersonnel ?? 'unknown'} deployed, ${c.reservePersonnel ?? 'unknown'} reserves, ${c.mobilizedReservePersonnel ?? 'unknown'} mobilized, military power ${c.militaryPower}/10`).join('; ') || 'none documented'}.
  Available countries and IDs: ${worldCountries.map((c) => `${c.id} (${c.name})`).join('; ')}.
Setting rule: ${worldRule}
Simulate the timeframe and evaluate if the crisis brake is triggered.`,
    },
  ]

  try {
    const maxTokens = daysToSkip >= 3650 ? 5000 : daysToSkip >= 365 ? 3800 : 2500
    let raw = await groqChat(apiKey, messages, { temperature: 0.75, maxTokens })
    let parsed = parseTimeSimulation(extractJson(raw, null))
    // A malformed structured reply is retried once; it is never treated as game state.
    if (!parsed) {
      raw = await groqChat(apiKey, [...messages, { role: 'user', content: 'Your prior response did not match the JSON schema. Return the complete schema as valid JSON only.' }], { temperature: 0.3, maxTokens })
      parsed = parseTimeSimulation(extractJson(raw, null))
    }
    parsed = resolveTurnProposal(parsed, {
      currentDay,
      daysToSkip,
      countryIds: worldCountries.map((country) => country.id),
    })
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const requestedDays = Math.max(1, Number(daysToSkip) || 1)
      const interruptedEarly = requestedDays > 1 && Boolean(parsed.interruptedEarly)
      const endDay = interruptedEarly
        ? Math.max(currentDay + 1, Math.min(currentDay + requestedDays, Number(parsed.interruptedAtDay) || currentDay + requestedDays))
        : currentDay + requestedDays
      const elapsed = endDay - currentDay
      const statLimitsPerMonth = {
        stability: 5,
        globalReputation: 3,
        militaryTension: 6,
        gdpPerCapita: 1000,
        inflationRate: 2,
        unemploymentRate: 1.5,
        publicDebt: 2,
      }
      const statDeltas = Object.fromEntries(Object.entries(statLimitsPerMonth).flatMap(([key, monthlyLimit]) => {
        const value = Number(parsed.statDeltas?.[key])
        if (!Number.isFinite(value)) return []
        const limit = monthlyLimit * elapsed / 30
        return [[key, Math.max(-limit, Math.min(limit, value))]]
      }))
      const knownCountryIds = new Set(worldCountries.map((country) => country.id))
      const contactLimit = elapsed >= 365 ? 4 : elapsed >= 91 ? 2 : 1
      const knownSenders = new Set()
      const incomingDiplomacy = (elapsed >= 7 && Array.isArray(parsed.incomingDiplomacy) ? parsed.incomingDiplomacy : [])
        .filter((contact) => knownCountryIds.has(contact?.countryId) && typeof contact?.message === 'string' && contact.message.trim())
        .filter((contact) => {
          if (knownSenders.has(contact.countryId)) return false
          knownSenders.add(contact.countryId)
          return true
        })
        .slice(0, contactLimit)
        .map((contact) => ({ countryId: contact.countryId, message: contact.message.trim().slice(0, 1200) }))
      const eventLimit = elapsed >= 365 ? 8 : elapsed >= 91 ? 4 : 2
      const events = (Array.isArray(parsed.events) ? parsed.events : []).slice(0, eventLimit).map((event) => ({
        ...event,
        turn: Math.max(currentDay + 1, Math.min(endDay, Number(event.turn) || endDay)),
      }))
      return {
        ...parsed,
        interruptedEarly,
        interruptedAtDay: endDay,
        statDeltas,
        incomingDiplomacy,
        events,
      }
    }
  } catch (err) {
    console.error('simulateTimePassage error:', err)
  }

  return {
    interruptedEarly: false,
    interruptedAtDay: currentDay + daysToSkip,
    crisisHeadline: '',
    crisisSummary: '',
    recommendedActions: [],
    incomingDiplomacy: [],
    periodReport: isFrench
      ? `La période de ${daysToSkip} jours s'est écoulée dans un calme relatif. Les institutions ont fonctionné normalement.`
      : `The ${daysToSkip}-day period passed in relative peace. National institutions functioned normally.`,
    statDeltas: {
      stability: 0,
      gdpPerCapita: 0,
    },
    events: [],
  }
}

/**
 * Simulate a diplomatic action and get AI response with technological plausibility check
 */
export async function simulateDiplomacy(apiKey, { playerCountry, targetCountry, action, currentRelation, conversationHistory = [], language = 'fr', worldMode = 'real' }) {
  const isFrench = language === 'fr'
  const isFictional = worldMode === 'fictional'
  const technologicalContext = isFictional
    ? 'Respect the established rules and technology of this invented setting. Do not compare its technology with contemporary Earth or name real-world countries and institutions.'
    : 'Assess technological claims against what exists in the contemporary real world. Identify impossible or undeveloped technology plainly.'
  const priorTalks = conversationHistory.slice(-16).map((entry) =>
    `Day ${entry.day ?? '?'} | ${entry.role === 'player' ? playerCountry.name : targetCountry.name}: ${(entry.text || '').slice(0, 700)}`
  ).join('\n') || 'No prior talks are recorded.'

  const messages = [
    {
      role: 'system',
      content: `${NO_LIMIT_PROMPT} You are roleplaying as the supreme leadership and diplomatic corps of ${targetCountry.name} (${targetCountry.regime}, ${targetCountry.ideology || 'Sovereign'}).
Respond in ${isFrench ? 'FRENCH (Français)' : 'ENGLISH'}.

TECHNOLOGY & SETTING RULE:
${technologicalContext}
Carefully analyze what the Head of State of ${playerCountry.name} states or proposes: "${action}". Base the response on this world's supplied facts; do not invent real-world actors.
Maintain diplomatic continuity. Honor prior offers, refusals, agreements, grievances, and unresolved negotiations in the transcript. Never pretend this is the first meeting when an archive exists. Force and budget figures marked as estimates are planning estimates, not verified intelligence.

Return a JSON object:
{
  "response": "<Deep, character-driven diplomatic response with full nuance>",
  "newRelation": "ally|friendly|neutral|tense|hostile|war",
  "consequence": "<Concrete strategic fallout>",
  "mood": "positive|neutral|negative"
}`,
    },
    {
      role: 'user',
      content: `Current relation: ${currentRelation}.
Starting Scenario: ${playerCountry.initialScenario || 'Standard'}.
    ${playerCountry.name}: population ${playerCountry.population}; active personnel ${playerCountry.activePersonnel ?? 'unknown'}, deployed ${playerCountry.deployedPersonnel ?? 'unknown'}, reserves ${playerCountry.reservePersonnel ?? 'unknown'}, mobilized reserves ${playerCountry.mobilizedReservePersonnel ?? 'unknown'}, military power ${playerCountry.militaryPower}/10, resources ${(playerCountry.resources || []).join(', ') || 'unknown'}.
    ${targetCountry.name}: population ${targetCountry.population}; active personnel ${targetCountry.activePersonnel ?? 'unknown'}, deployed ${targetCountry.deployedPersonnel ?? 'unknown'}, reserves ${targetCountry.reservePersonnel ?? 'unknown'}, mobilized reserves ${targetCountry.mobilizedReservePersonnel ?? 'unknown'}, military power ${targetCountry.militaryPower}/10, resources ${(targetCountry.resources || []).join(', ') || 'unknown'}.
    Archived conversation:
    ${priorTalks}
    Latest action from ${playerCountry.name}: "${action}"`,
    },
  ]

  try {
    const raw = await groqChat(apiKey, messages, { temperature: 0.8, maxTokens: 1200 })
    const parsed = extractJson(raw, null)
    if (parsed && parsed.response) return parsed
  } catch (err) {
    console.error('simulateDiplomacy error:', err)
  }

  return {
    response: 'Our government acknowledges your dispatch and deliberates its terms.',
    newRelation: currentRelation,
    consequence: 'No immediate shift.',
    mood: 'neutral',
  }
}

/**
 * Generate world events for a new turn / day
 */
export async function generateTurnEvents(apiKey, { playerCountry, worldCountries, relations, turn, language = 'fr', worldMode = 'real' }) {
  const isFrench = language === 'fr'
  const isFictional = worldMode === 'fictional'
  const worldRule = isFictional
    ? 'Invented setting only: use names and institutions from this roster, with no real-world countries, Earth, current-year references, or modern organizations.'
    : 'Contemporary real-world setting only: use real nations and institutions, and do not invent fictional actors.'
  const alliedCountries = worldCountries
    .filter((c) => ['ally', 'friendly'].includes(relations[c.id]))
    .map((c) => c.name)
    .join(', ')

  const messages = [
    {
      role: 'system',
      content: `${NO_LIMIT_PROMPT} You are a geopolitical crisis engine. Generate 2 to 3 major events for Day ${turn}, shaping ${playerCountry.name} and the nations around it. ${worldRule}
Respond in ${isFrench ? 'FRENCH (Français)' : 'ENGLISH'}.
${isFrench ? 'RÈGLE : Les titres ("headline"), résumés ("body") et options ("actions") DOIVENT ÊTRE RÉDIGÉS EN FRANÇAIS.' : ''}

Return ONLY a valid JSON array:
[
  {
    "headline": "<Dramatic News Headline>",
    "body": "<Detailed explanation of the crisis, conflict, economic collapse, or breakthrough>",
    "type": "economic|military|diplomatic|natural|political",
    "affectedStats": { "stability": -5, "globalReputation": 5, "militaryTension": 10 },
    "requiresAction": true,
    "actions": ["Option A: ...", "Option B: ...", "Option C: ..."]
  }
]`,
    },
    {
      role: 'user',
      content: `Nation: ${playerCountry.name} (${playerCountry.regime}, Stability ${playerCountry.stability}%, Tension ${playerCountry.militaryTension}%).
Active Scenario: ${playerCountry.initialScenario || 'Standard'}.
Allies: ${alliedCountries || 'None'}.
World rules: ${worldRule}
Day ${turn}. Push forward the story of this world with high stakes.`,
    },
  ]

  try {
    const raw = await groqChat(apiKey, messages, { temperature: 0.85, maxTokens: 2500 })
    const parsed = extractJson(raw, [])
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('generateTurnEvents error:', err)
    return []
  }
}

/**
 * Validate Groq API key with a test call
 */
export async function validateGroqKey(apiKey) {
  try {
    await groqChat(apiKey, [{ role: 'user', content: 'Say OK' }], {
      temperature: 0,
      maxTokens: 5,
    })
    return true
  } catch (err) {
    console.warn('validateGroqKey failed:', err.message)
    return false
  }
}

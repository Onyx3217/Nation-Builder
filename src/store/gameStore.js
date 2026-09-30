import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_WORLD_COUNTRIES } from '../data/defaultWorld'
import { FICTIONAL_WORLD_COUNTRIES } from '../data/fictionalWorld'

// ─── Default settings ──────────────────────────────────────────────────────
const defaultSettings = {
  language: 'fr',       // 'fr' | 'en'
  musicEnabled: false,  // toggle music on/off
  musicVolume: 0.5,     // 0.0 – 1.0
  musicPosition: 0,
}

const defaultCountry = {
  name: 'New Republic',
  flag: '👑',
  capital: 'Solaris',
  continent: 'Europe',
  area: 250000,
  population: 30000000,
  regime: 'Republic',
  // Real macroeconomic indicators
  gdpPerCapita: 28000,   // Real GDP per capita in USD
  gdpNominal: 840,       // Nominal GDP in Billions USD: (30M * 28k) / 1e9 = $840B
  unemploymentRate: 5.6, // Taux de chômage (%)
  inflationRate: 2.3,   // Taux d'inflation (%)
  publicDebt: 64.0,      // Dette publique (% du PIB)
  giniIndex: 31.0,       // Indice de Gini / Équité (31 = très équilibré)
  povertyRate: 8.4,      // Taux de pauvreté (%)
  // Sovereign institutions
  resources: ['tech', 'agriculture'],
  language: 'Indo-European',
  religion: 'Secular',
  militaryPower: 6,
  activePersonnel: 117000,
  reservePersonnel: 294000,
  deployedPersonnel: 0,
  mobilizedReservePersonnel: 0,
  defenseBudgetPct: 3.1,
  militaryFiguresEstimated: true,
  diplomacyStyle: 'neutral',
  urbanization: 65,
  stability: 75,
  globalReputation: 60,
  militaryTension: 20,
  initialScenario: 'Standard Geopolitical Order',
}

/** Check if current nation stats trigger a total state collapse / Game Over */
function evaluateGameOver(country) {
  if (!country) return null

  // 1. Revolution / Civil War / Total anarchy
  if (country.stability !== undefined && country.stability <= 0) {
    return {
      title: 'Effondrement de l\'État & Insurrection Populaire',
      description: 'La stabilité civile est tombée à zéro. Des émeutes incontrôlables et une mutinerie générale ont renversé le gouvernement. La nation s\'est disloquée en guerre civile.',
      type: 'revolution',
    }
  }

  // 2. Sovereign Bankruptcy & Economic Annihilation
  if (
    (country.gdpPerCapita !== undefined && country.gdpPerCapita <= 400) ||
    ((country.publicDebt || 0) >= 280 && (country.inflationRate || 0) >= 60)
  ) {
    return {
      title: 'Banqueroute Souveraine Totale & Hyperinflation',
      description: 'Le Trésor national est en faillite absolue. La monnaie s\'est désintégrée sous une hyperinflation dévastatrice, provoquant l\'arrêt des approvisionnements vitaux et la famine.',
      type: 'bankruptcy',
    }
  }

  // 3. Military Invasion & Overthrow
  if (
    (country.militaryTension !== undefined && country.militaryTension >= 100) &&
    (country.militaryPower !== undefined && country.militaryPower < 4)
  ) {
    return {
      title: 'Invasion & Capitulation Inconditionnelle',
      description: 'Face à une coalition ennemie écrasante et à des tensions intolérables, vos défenses ont été balayées. Les forces étrangères occupent la capitale.',
      type: 'invasion',
    }
  }

  return null
}

function getProjectDurationFactor(regime = '') {
  const normalizedRegime = String(regime || '').toLowerCase()
  if (normalizedRegime.includes('dictator') || normalizedRegime.includes('authoritarian')) return 0.7
  if (normalizedRegime.includes('junta') || normalizedRegime.includes('military')) return 0.8
  if (normalizedRegime.includes('democracy') || normalizedRegime.includes('federation')) return 1.25
  if (normalizedRegime.includes('republic')) return 1.15
  if (normalizedRegime.includes('theocracy')) return 1.15
  if (normalizedRegime.includes('oligarchy')) return 0.9
  if (normalizedRegime.includes('monarchy')) return 0.95
  return 1
}

function estimateMilitaryForces(country) {
  const population = Math.max(0, Number(country.population) || 0)
  const militaryPower = Math.max(1, Math.min(10, Number(country.militaryPower) || 5))
  return {
    activePersonnel: Math.round(population * (0.0012 + militaryPower * 0.00045)),
    reservePersonnel: Math.round(population * (0.002 + militaryPower * 0.0013)),
    defenseBudgetPct: Math.round((1 + militaryPower * 0.35) * 10) / 10,
  }
}

function withEstimatedForces(country, relation = 'neutral') {
  const estimates = estimateMilitaryForces(country)
  const activePersonnel = Number.isFinite(country.activePersonnel) ? country.activePersonnel : estimates.activePersonnel
  const reservePersonnel = Number.isFinite(country.reservePersonnel) ? country.reservePersonnel : estimates.reservePersonnel
  const missingFigures = !Number.isFinite(country.activePersonnel)
    || !Number.isFinite(country.reservePersonnel)
    || !Number.isFinite(country.defenseBudgetPct)
  const deploymentRate = relation === 'war' ? 0.18 : relation === 'hostile' ? 0.06 : relation === 'tense' ? 0.02 : 0
  const mobilizationRate = relation === 'war' ? 0.12 : relation === 'hostile' ? 0.03 : 0
  return {
    ...country,
    activePersonnel,
    reservePersonnel,
    deployedPersonnel: Math.round(activePersonnel * deploymentRate),
    mobilizedReservePersonnel: Math.round(reservePersonnel * mobilizationRate),
    defenseBudgetPct: Number.isFinite(country.defenseBudgetPct) ? country.defenseBudgetPct : estimates.defenseBudgetPct,
    militaryFiguresEstimated: country.militaryFiguresEstimated ?? missingFigures,
  }
}

const PROJECT_STAT_LIMITS = {
  stability: [0, 100],
  globalReputation: [0, 100],
  militaryTension: [0, 100],
  gdpPerCapita: [200, Number.POSITIVE_INFINITY],
  inflationRate: [-5, 150],
  unemploymentRate: [1, 50],
  publicDebt: [0, 300],
  giniIndex: [18, 75],
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Game phase: 'creation' | 'integration' | 'world'
      phase: 'creation',

      // Player's country
      country: { ...defaultCountry },

      // World countries (canonical 100 countries)
      worldCountries: DEFAULT_WORLD_COUNTRIES.map((item) => withEstimatedForces(item)),

      // Diplomatic relations { countryId: 'ally' | 'neutral' | 'hostile' | 'war' }
      relations: {
        france: 'friendly',
        united_states: 'ally',
        united_kingdom: 'ally',
        germany: 'friendly',
        russia: 'tense',
        china: 'neutral',
      },

      // News / event feed
      newsFeed: [],

      // Groq API key
      groqApiKey: '',

      // ─── Time & Monthly Directive Quota ───────────────────────────────────
      day: 1,
      // Executive actions replenish every 30 in-game days, not every click.
      dailyDirectivesRemaining: 5,

      // Major event injections replenish on the same 30-day cycle.
      dailyEventInjectionsRemaining: 2,
      incomingDiplomacy: [],
      diplomaticHistory: {},

      // ─── AI Cabinet & Decision Room Conversation Memory ───────────────────
      cabinetHistory: [],

      // ─── Game Over State ──────────────────────────────────────────────────
      isGameOver: false,
      gameOverReason: null,

      // ─── World Mode ────────────────────────────────────────────────────────
      // 'real'  = 100 real countries, UN / NATO / IMF / NASA etc.
      // 'fictional' = AI-generated fictional world with fictional orgs
      worldMode: 'real',
      difficultyMode: 'normal',

      // Active UN-style resolutions (visible to the player)
      activeResolutions: [],

      // World events log (NASA discoveries, CERN breakthroughs, etc.)
      worldEvents: [],

      // Long-term national projects
      projects: [],
      musicError: '',
      musicPlaying: false,

      // ─── Settings ────────────────────────────────────────────────────────
      ...defaultSettings,

      // Actions
      setPhase: (phase) => set({ phase }),
      setWorldMode: (mode) => set({ worldMode: mode }),
      setDifficultyMode: (mode) => set({ difficultyMode: mode }),

      addResolution: (res) =>
        set((state) => ({
          activeResolutions: [...(state.activeResolutions || []), res].slice(-20),
        })),

      addWorldEvent: (event) =>
        set((state) => ({
          worldEvents: [event, ...(state.worldEvents || [])].slice(-40),
        })),

      addProject: (project) => {
        let createdProject
        set((state) => {
          const baseDurationDays = Math.max(1, Math.round(Number(project.baseDurationDays) || 90))
          const durationFactor = getProjectDurationFactor(state.country.regime)
          const durationDays = Math.max(1, Math.ceil(baseDurationDays * durationFactor))
          createdProject = {
            ...project,
            id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            baseDurationDays,
            durationFactor,
            durationDays,
            elapsedDays: 0,
            progress: 0,
            status: 'active',
            createdDay: state.day,
            regimeAtStart: state.country.regime,
            language: state.language || 'fr',
          }
          const label = createdProject.language === 'fr' ? 'Nouveau projet' : 'New project'

          return {
            projects: [createdProject, ...(state.projects || [])].slice(0, 30),
            newsFeed: [{
              headline: `${label} : ${createdProject.title}`,
              body: createdProject.objective,
              type: 'political',
              turn: state.day,
            }, ...(state.newsFeed || [])].slice(0, 80),
          }
        })
        return createdProject
      },

      setProjectStatus: (projectId, status) =>
        set((state) => ({
          projects: (state.projects || []).map((project) =>
            project.id === projectId && ['active', 'paused', 'cancelled'].includes(status)
              ? { ...project, status }
              : project
          ),
        })),

      updateProjectDetails: (projectId, details) =>
        set((state) => ({
          projects: (state.projects || []).map((project) =>
            project.id === projectId && project.status !== 'completed' && project.status !== 'cancelled'
              ? (() => {
                  const requestedDuration = Number(details.durationDays)
                  const elapsedDays = Number(project.elapsedDays) || 0
                  const durationDays = Number.isFinite(requestedDuration) && requestedDuration > 0
                    ? elapsedDays + Math.max(1, Math.round(requestedDuration))
                    : project.durationDays
                  const durationFactor = Number(project.durationFactor) || 1
                  return {
                    ...project,
                    title: details.title?.trim() || project.title,
                    objective: details.objective?.trim() || project.objective,
                    durationDays,
                    baseDurationDays: Math.max(1, Math.round(durationDays / durationFactor)),
                    progress: Math.min(99, Math.round((elapsedDays / durationDays) * 100)),
                  }
                })()
              : project
          ),
        })),

      addCabinetHistory: (entry) =>
        set((state) => ({
          cabinetHistory: [...(state.cabinetHistory || []), entry].slice(-100),
        })),

      clearCabinetHistory: () => set({ cabinetHistory: [] }),

      updateCountry: (patch) =>
        set((state) => {
          const updatedCountry = { ...state.country, ...patch }

          if (patch.population !== undefined || patch.militaryPower !== undefined) {
            const estimatedForces = estimateMilitaryForces(updatedCountry)
            if (patch.activePersonnel === undefined) updatedCountry.activePersonnel = estimatedForces.activePersonnel
            if (patch.reservePersonnel === undefined) updatedCountry.reservePersonnel = estimatedForces.reservePersonnel
            if (patch.defenseBudgetPct === undefined) updatedCountry.defenseBudgetPct = estimatedForces.defenseBudgetPct
            const relations = Object.values(state.relations)
            const deploymentRate = Math.min(0.7,
              relations.filter((relation) => relation === 'war').length * 0.18
              + relations.filter((relation) => relation === 'hostile').length * 0.06
              + relations.filter((relation) => relation === 'tense').length * 0.02
            )
            const mobilizationRate = Math.min(0.5,
              relations.filter((relation) => relation === 'war').length * 0.12
              + relations.filter((relation) => relation === 'hostile').length * 0.03
            )
            updatedCountry.deployedPersonnel = Math.round(updatedCountry.activePersonnel * deploymentRate)
            updatedCountry.mobilizedReservePersonnel = Math.round(updatedCountry.reservePersonnel * mobilizationRate)
            updatedCountry.militaryFiguresEstimated = true
          }

          // Auto-recalculate nominal GDP if population or gdpPerCapita changed
          if (patch.population || patch.gdpPerCapita) {
            const pop = updatedCountry.population || 1e6
            const gdpCap = updatedCountry.gdpPerCapita || 1000
            updatedCountry.gdpNominal = Math.round((pop * gdpCap) / 1e9 * 10) / 10
          }

          // Check if changes trigger a Game Over
          const collapse = evaluateGameOver(updatedCountry)

          return {
            country: updatedCountry,
            isGameOver: Boolean(collapse),
            gameOverReason: collapse || state.gameOverReason,
          }
        }),

      setWorldCountries: (countries) =>
        set((state) => {
          const isFictional = state.worldMode === 'fictional'
          const canonicalCountries = isFictional ? FICTIONAL_WORLD_COUNTRIES : DEFAULT_WORLD_COUNTRIES
          const uniqueCountries = new Map()
          ;(countries || [])
            .filter((country) => isFictional ? country.isReal !== true : country.isReal !== false)
            .forEach((country) => uniqueCountries.set(country.id, country))
          const modeCountries = [...uniqueCountries.values()]
          const existingIds = new Set(modeCountries.map((country) => country.id))
          const merged = [...modeCountries]
          canonicalCountries.forEach((c) => {
            if (!existingIds.has(c.id)) {
              merged.push(c)
              existingIds.add(c.id)
            }
          })
          return { worldCountries: merged.map((item) => withEstimatedForces(item, state.relations[item.id])) }
        }),

      setRelation: (countryId, relation) =>
        set((state) => {
          const relations = { ...state.relations, [countryId]: relation }
          const warCount = Object.values(relations).filter((value) => value === 'war').length
          const hostileCount = Object.values(relations).filter((value) => value === 'hostile').length
          const tenseCount = Object.values(relations).filter((value) => value === 'tense').length
          const deploymentRate = Math.min(0.7, warCount * 0.18 + hostileCount * 0.06 + tenseCount * 0.02)
          const mobilizationRate = Math.min(0.5, warCount * 0.12 + hostileCount * 0.03)
          return {
            relations,
            worldCountries: state.worldCountries.map((item) => withEstimatedForces(item, relations[item.id])),
            country: {
              ...state.country,
              deployedPersonnel: Math.round((state.country.activePersonnel || 0) * deploymentRate),
              mobilizedReservePersonnel: Math.round((state.country.reservePersonnel || 0) * mobilizationRate),
            },
          }
        }),

      queueDiplomaticContact: (contact) =>
        set((state) => ({
          incomingDiplomacy: [
            ...(state.incomingDiplomacy || []).filter((item) => item.id !== contact.id),
            contact,
          ].slice(-20),
        })),

      dismissDiplomaticContact: (contactId) =>
        set((state) => ({
          incomingDiplomacy: (state.incomingDiplomacy || []).filter((item) => item.id !== contactId),
        })),

      addDiplomaticHistory: (countryId, message) =>
        set((state) => ({
          diplomaticHistory: {
            ...(state.diplomaticHistory || {}),
            [countryId]: [...(state.diplomaticHistory?.[countryId] || []), message].slice(-80),
          },
        })),

      addNews: (item) =>
        set((state) => ({
          newsFeed: [item, ...state.newsFeed].slice(0, 80),
        })),

      setGroqApiKey: (key) => set({ groqApiKey: key }),

      /** Use one of the 5 executive actions available each 30-day period */
      consumeDirective: () =>
        set((state) => ({
          dailyDirectivesRemaining: Math.max(0, state.dailyDirectivesRemaining - 1),
        })),

      /** Use one of the 2 major event injections available each 30-day period */
      consumeEventInjection: () =>
        set((state) => ({
          dailyEventInjectionsRemaining: Math.max(0, state.dailyEventInjectionsRemaining - 1),
        })),

      /** Advance time by X days; executive quotas refresh only after a 30-day boundary. */
      advanceDays: (daysToAdvance = 1, statDeltas = {}) =>
        set((state) => {
          const elapsedDays = Math.max(1, Math.round(Number(daysToAdvance) || 1))
          const nextDay = state.day + elapsedDays
          const crossedMonth = Math.floor((nextDay - 1) / 30) > Math.floor((state.day - 1) / 30)
          const cur = state.country
          const patch = {}
          const completedProjects = []

          const projects = (state.projects || []).map((project) => {
            if (project.status !== 'active') return project
            const durationDays = Math.max(1, Number(project.durationDays) || 1)
            const projectElapsedDays = Math.min(durationDays, (Number(project.elapsedDays) || 0) + elapsedDays)
            const progress = Math.min(100, Math.round((projectElapsedDays / durationDays) * 100))
            if (projectElapsedDays >= durationDays) {
              const completedProject = { ...project, elapsedDays: projectElapsedDays, progress: 100, status: 'completed', completedDay: nextDay }
              completedProjects.push(completedProject)
              return completedProject
            }
            return { ...project, elapsedDays: projectElapsedDays, progress }
          })

          // Apply macro stat changes
          if (statDeltas.stability !== undefined) {
            patch.stability = Math.max(0, Math.min(100, (cur.stability || 75) + statDeltas.stability))
          }
          if (statDeltas.globalReputation !== undefined) {
            patch.globalReputation = Math.max(0, Math.min(100, (cur.globalReputation || 60) + statDeltas.globalReputation))
          }
          if (statDeltas.militaryTension !== undefined) {
            patch.militaryTension = Math.max(0, Math.min(100, (cur.militaryTension || 20) + statDeltas.militaryTension))
          }
          if (statDeltas.gdpPerCapita !== undefined) {
            patch.gdpPerCapita = Math.max(200, (cur.gdpPerCapita || 28000) + statDeltas.gdpPerCapita)
          }
          if (statDeltas.inflationRate !== undefined) {
            patch.inflationRate = Math.max(-5, Math.min(150, (cur.inflationRate || 2.3) + statDeltas.inflationRate))
          }
          if (statDeltas.unemploymentRate !== undefined) {
            patch.unemploymentRate = Math.max(1, Math.min(50, (cur.unemploymentRate || 5.6) + statDeltas.unemploymentRate))
          }
          if (statDeltas.publicDebt !== undefined) {
            patch.publicDebt = Math.max(0, Math.min(300, (cur.publicDebt || 64) + statDeltas.publicDebt))
          }
          if (statDeltas.giniIndex !== undefined) {
            patch.giniIndex = Math.max(18, Math.min(75, (cur.giniIndex || 31) + statDeltas.giniIndex))
          }

          completedProjects.forEach((project) => {
            Object.entries(project.statEffects || {}).forEach(([stat, rawDelta]) => {
              const limits = PROJECT_STAT_LIMITS[stat]
              const delta = Number(rawDelta)
              if (!limits || !Number.isFinite(delta)) return
              const currentValue = patch[stat] ?? cur[stat] ?? 0
              patch[stat] = Math.max(limits[0], Math.min(limits[1], currentValue + delta))
            })
          })

          if (patch.gdpPerCapita !== undefined) {
            patch.gdpNominal = Math.round(((cur.population || 1e6) * patch.gdpPerCapita) / 1e9 * 10) / 10
          }

          const updatedCountry = { ...cur, ...patch }
          const collapse = evaluateGameOver(updatedCountry)
          const completionNews = completedProjects.map((project) => ({
            headline: `${project.language === 'fr' ? 'Projet achevé' : 'Project completed'} : ${project.title}`,
            body: project.objective,
            type: project.category === 'defense' ? 'military' : project.category === 'economy' ? 'economic' : 'political',
            turn: nextDay,
          }))

          return {
            day: nextDay,
            dailyDirectivesRemaining: crossedMonth ? 5 : state.dailyDirectivesRemaining,
            dailyEventInjectionsRemaining: crossedMonth ? 2 : state.dailyEventInjectionsRemaining,
            country: updatedCountry,
            projects,
            newsFeed: [...completionNews, ...(state.newsFeed || [])].slice(0, 80),
            isGameOver: Boolean(collapse),
            gameOverReason: collapse || state.gameOverReason,
          }
        }),

      // Settings actions
      setLanguage: (lang) => set({ language: lang }),
      setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
      setMusicVolume: (vol) => set({ musicVolume: Math.max(0, Math.min(1, vol)) }),
      setMusicPosition: (seconds) => set({ musicPosition: Math.max(0, Number(seconds) || 0) }),
      setMusicError: (error) => set({ musicError: error }),
      setMusicPlaying: (playing) => set({ musicPlaying: playing }),

      restoreCloudSave: (gameData) =>
        set((state) => {
          const worldMode = gameData.worldMode === 'fictional' ? 'fictional' : 'real'
          const relations = gameData.relations || {}
          const canonicalCountries = worldMode === 'fictional' ? FICTIONAL_WORLD_COUNTRIES : DEFAULT_WORLD_COUNTRIES
          const uniqueCountries = new Map()
          ;(gameData.worldCountries || []).forEach((item) => {
            if (item?.id && (worldMode === 'fictional' ? item.isReal !== true : item.isReal !== false)) {
              uniqueCountries.set(item.id, item)
            }
          })
          canonicalCountries.forEach((item) => {
            if (!uniqueCountries.has(item.id)) uniqueCountries.set(item.id, item)
          })
          const worldCountries = [...uniqueCountries.values()]
            .map((item) => withEstimatedForces(item, relations[item.id]))
          const country = withEstimatedForces({ ...defaultCountry, ...(gameData.country || {}) })
          const day = Math.max(1, Math.round(Number(gameData.day ?? gameData.turn) || 1))
          const collapse = evaluateGameOver(country)
          const music = gameData.music || {}

          return {
            phase: 'world',
            country,
            worldCountries,
            relations,
            newsFeed: Array.isArray(gameData.newsFeed) ? gameData.newsFeed.slice(0, 80) : [],
            day,
            dailyDirectivesRemaining: Math.max(0, Math.min(5, Number(gameData.dailyDirectivesRemaining ?? 5))),
            dailyEventInjectionsRemaining: Math.max(0, Math.min(2, Number(gameData.dailyEventInjectionsRemaining ?? 2))),
            cabinetHistory: Array.isArray(gameData.cabinetHistory) ? gameData.cabinetHistory.slice(-100) : [],
            incomingDiplomacy: Array.isArray(gameData.incomingDiplomacy) ? gameData.incomingDiplomacy.slice(-20) : [],
            diplomaticHistory: gameData.diplomaticHistory || {},
            worldMode,
            difficultyMode: gameData.difficultyMode || state.difficultyMode,
            activeResolutions: Array.isArray(gameData.activeResolutions) ? gameData.activeResolutions.slice(-20) : [],
            worldEvents: Array.isArray(gameData.worldEvents) ? gameData.worldEvents.slice(-40) : [],
            projects: Array.isArray(gameData.projects) ? gameData.projects.slice(0, 30) : [],
            language: gameData.language || state.language,
            musicEnabled: typeof music.enabled === 'boolean' ? music.enabled : state.musicEnabled,
            musicVolume: Number.isFinite(Number(music.volume)) ? Math.max(0, Math.min(1, Number(music.volume))) : state.musicVolume,
            musicPosition: Math.max(0, Number(music.position) || 0),
            isGameOver: Boolean(collapse),
            gameOverReason: collapse,
          }
        }),

      dismissGameOver: () => set({ isGameOver: false, gameOverReason: null }),

      resetGame: () =>
        set((state) => ({
          phase: 'creation',
          country: { ...defaultCountry },
          worldCountries: DEFAULT_WORLD_COUNTRIES.map((item) => withEstimatedForces(item)),
          relations: {
            france: 'friendly',
            united_states: 'ally',
            united_kingdom: 'ally',
            germany: 'friendly',
            russia: 'tense',
            china: 'neutral',
          },
          newsFeed: [],
          day: 1,
          dailyDirectivesRemaining: 5,
          dailyEventInjectionsRemaining: 2,
          incomingDiplomacy: [],
          diplomaticHistory: {},
          cabinetHistory: [],
          isGameOver: false,
          gameOverReason: null,
          worldMode: 'real',
          difficultyMode: 'normal',
          activeResolutions: [],
          worldEvents: [],
          projects: [],
          // preserve user settings
          language: state.language,
          musicEnabled: state.musicEnabled,
          musicVolume: state.musicVolume,
          musicPosition: state.musicPosition,
        })),
    }),
    {
      name: 'nation-builder-save-v5',
      partialize: (state) => ({
        phase: state.phase,
        country: state.country,
        worldCountries: state.worldCountries?.length ? state.worldCountries : DEFAULT_WORLD_COUNTRIES,
        relations: state.relations,
        newsFeed: state.newsFeed,
        day: state.day,
        dailyDirectivesRemaining: state.dailyDirectivesRemaining,
        dailyEventInjectionsRemaining: state.dailyEventInjectionsRemaining ?? 2,
        incomingDiplomacy: state.incomingDiplomacy || [],
        diplomaticHistory: state.diplomaticHistory || {},
        cabinetHistory: (state.cabinetHistory || []).slice(-100),
        groqApiKey: state.groqApiKey,
        language: state.language,
        musicEnabled: state.musicEnabled,
        musicVolume: state.musicVolume,
        musicPosition: state.musicPosition,
        worldMode: state.worldMode || 'real',
        difficultyMode: state.difficultyMode || 'normal',
        activeResolutions: state.activeResolutions || [],
        worldEvents: state.worldEvents || [],
        projects: state.projects || [],
      }),
    }
  )
)

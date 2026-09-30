import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { DEFAULT_WORLD_COUNTRIES } from '../data/defaultWorld'
import {
  generateWorld,
  generateInitialRelations,
  generateTurnEvents,
  simulateDiplomacy,
  generatePressHeadlines,
  simulateTimePassage,
} from '../services/groqService'
import CountryCard from '../components/CountryCard'
import NewsFeed from '../components/NewsFeed'
import StatCard from '../components/StatCard'
import WorldMap from '../components/WorldMap'
import CloudSyncModal from '../components/CloudSyncModal'
import PressWindow from '../components/PressWindow'
import AiCabinetModal from '../components/AiCabinetModal'
import SettingsModal from '../components/SettingsModal'
import EventInjectorModal from '../components/EventInjectorModal'
import ProjectsModal from '../components/ProjectsModal'
import AutoWeekTimer from '../components/AutoWeekTimer'
import { checkRandomWorldEvent } from '../services/randomEventsEngine'
import { t } from '../i18n'
import {
  Globe,
  Newspaper,
  BarChart3,
  ChevronRight,
  Zap,
  RotateCcw,
  Map as MapIcon,
  LayoutGrid,
  Search,
  Cloud,
  Landmark,
  Radio,
  Flame,
  Home,
  Settings,
  FastForward,
  AlertTriangle,
  Skull,
  ClipboardList,
  Mail,
  X,
  Clock3,
} from 'lucide-react'

export default function World() {
  const navigate = useNavigate()
  const {
    country,
    groqApiKey,
    worldCountries,
    setWorldCountries,
    relations,
    setRelation,
    addNews,
    newsFeed,
    day,
    dailyDirectivesRemaining,
    advanceDays,
    isGameOver,
    gameOverReason,
    resetGame,
    updateCountry,
    phase,
    setPhase,
    language,
    worldMode,
    addWorldEvent,
    worldEvents,
    activeResolutions,
    dailyEventInjectionsRemaining,
    projects,
    incomingDiplomacy,
    queueDiplomaticContact,
    dismissDiplomaticContact,
    diplomaticHistory,
    addDiplomaticHistory,
  } = useGameStore()

  const lang = language || 'fr'
  const isFrench = lang === 'fr'
  const locale = isFrench ? 'fr-FR' : 'en-US'
  const gameYear = 2026 + Math.floor((day - 1) / 365)
  const formatNumber = (value, maximumFractionDigits = 1) => {
    const number = Number(value)
    return Number.isFinite(number)
      ? new Intl.NumberFormat(locale, { maximumFractionDigits }).format(number)
      : '—'
  }
  const activeProjectCount = (projects || []).filter((project) => ['active', 'paused'].includes(project.status)).length

  const SIDEBAR_TABS = [
    { id: 'countries', label: t('world_nations_tab', lang), icon: <Globe size={16} /> },
    { id: 'news', label: t('world_events_tab', lang), icon: <Newspaper size={16} /> },
    { id: 'stats', label: t('world_dossier_tab', lang), icon: <BarChart3 size={16} /> },
  ]

  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [sideTab, setSideTab] = useState('countries')
  const [viewMode, setViewMode] = useState('map') // 'map' | 'grid' | 'press'
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [diplomacyOpen, setDiplomacyOpen] = useState(false)
  const [diplomacyInput, setDiplomacyInput] = useState('')
  const [diplomacyLoading, setDiplomacyLoading] = useState(false)
  const [diplomacyHistory, setDiplomacyHistory] = useState([])
  const [incomingContactOpen, setIncomingContactOpen] = useState(false)
  const [turnLoading, setTurnLoading] = useState(false)
  const [cloudModalOpen, setCloudModalOpen] = useState(false)
  const [aiCabinetOpen, setAiCabinetOpen] = useState(false)
  const [eventInjectorOpen, setEventInjectorOpen] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Time Skip Menu & Crisis Modal
  const [timeSkipMenuOpen, setTimeSkipMenuOpen] = useState(false)
  const [timeFeedback, setTimeFeedback] = useState(null)
  const [crisisModalData, setCrisisModalData] = useState(null)

  // Press headlines
  const [pressHeadlines, setPressHeadlines] = useState([])
  const [pressLoading, setPressLoading] = useState(false)

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('')
  const [relationFilter, setRelationFilter] = useState('all') // 'all' | 'ally' | 'neutral' | 'hostile'
  const [selectedContinent, setSelectedContinent] = useState('All')
  const [focusedCountry, setFocusedCountry] = useState(null)

  // Initial world generation
  useEffect(() => {
    if (worldCountries.length && worldCountries.some((other) =>
      !Number.isFinite(other.activePersonnel) || !Number.isFinite(other.reservePersonnel) || !Number.isFinite(other.deployedPersonnel)
      || !Number.isFinite(other.mobilizedReservePersonnel) || !Number.isFinite(other.defenseBudgetPct)
    )) {
      setWorldCountries(worldCountries)
    }
    if (!Number.isFinite(country.activePersonnel) || !Number.isFinite(country.reservePersonnel) || !Number.isFinite(country.deployedPersonnel)
      || !Number.isFinite(country.mobilizedReservePersonnel) || !Number.isFinite(country.defenseBudgetPct)) {
      updateCountry({ population: country.population, militaryPower: country.militaryPower })
    }
    if (!worldCountries.length && country.name) {
      initWorld()
    } else if (country.name && pressHeadlines.length === 0) {
      fetchPress(worldCountries, relations, day)
    }
  }, [])

  const fetchPress = async (wCountries = worldCountries, curRels = relations, curDay = day) => {
    setPressLoading(true)
    try {
      const recentNews = useGameStore.getState().newsFeed
        .filter((item) => Number(item.turn ?? curDay) >= curDay - 30)
        .slice(0, 8)
      const data = await generatePressHeadlines(groqApiKey, {
        playerCountry: country,
        worldCountries: wCountries,
        relations: curRels,
        turn: curDay,
        recentNews,
        language: lang,
        worldMode,
      })
      setPressHeadlines(data)
    } catch (err) {
      console.error(err)
    } finally {
      setPressLoading(false)
    }
  }

  const initWorld = async () => {
    setLoading(true)
    try {
      setLoadingMsg(isFrench ? 'Génération de l\'ordre mondial géopolitique...' : 'Generating world geopolitical order...')
      const generatedWorld = await generateWorld(groqApiKey, country, worldMode)
      setWorldCountries(generatedWorld)
      const world = useGameStore.getState().worldCountries

      setLoadingMsg(isFrench ? 'Alignements régionaux & fronts géopolitiques...' : 'Regional alignments & geopolitical fronts...')
      const rels = await generateInitialRelations(groqApiKey, country, world)
      if (country.territorialDisputeCountryId && world.some((item) => item.id === country.territorialDisputeCountryId)) {
        rels[country.territorialDisputeCountryId] = 'hostile'
        const disputedCountry = world.find((item) => item.id === country.territorialDisputeCountryId)
        addNews({
          headline: isFrench ? `CRISE TERRITORIALE AVEC ${disputedCountry.name.toUpperCase()}` : `TERRITORIAL DISPUTE WITH ${disputedCountry.name.toUpperCase()}`,
          body: isFrench
            ? `${disputedCountry.name} conteste officiellement l’implantation de ${country.name} sur son territoire. Les relations commencent au niveau hostile.`
            : `${disputedCountry.name} formally rejects ${country.name}'s claim over its territory. Relations begin at hostile.`,
          type: 'diplomatic',
          turn: 1,
        })
      }
      Object.entries(rels).forEach(([id, rel]) => setRelation(id, rel))

      setLoadingMsg(isFrench ? 'Interception des premières dépêches d\'actualité...' : 'Intercepting global intelligence dispatches...')
      const events = await generateTurnEvents(groqApiKey, {
        playerCountry: country,
        worldCountries: world,
        relations: rels,
        turn: 1,
        language: lang,
        worldMode,
      })
      events.forEach((e) => addNews({ ...e, turn: 1 }))

      await fetchPress(world, rels, 1)
      setPhase('world')
    } catch (err) {
      console.error(err)
      setLoadingMsg('Error initializing world: ' + err.message)
    }
    setLoading(false)
  }

  /** Advance calendar time; only periods of a week or more need an AI simulation. */
  const handleAdvanceDays = async (daysToSkip = 1) => {
    setTimeSkipMenuOpen(false)
    setTurnLoading(true)
    try {
      const result = daysToSkip < 7
        ? { interruptedEarly: false, statDeltas: {}, events: [], incomingDiplomacy: [] }
        : await simulateTimePassage(groqApiKey, {
          playerCountry: country,
          worldCountries,
          relations,
          daysToSkip,
          currentDay: day,
          language: lang,
          worldMode,
        })

      const elapsedDays = result.interruptedEarly
        ? Math.max(1, (result.interruptedAtDay || (day + 1)) - day)
        : daysToSkip
      const effectiveDay = day + elapsedDays

      if (result.interruptedEarly) {
        // Crisis broke out before completing the jump!
        advanceDays(elapsedDays, result.statDeltas || {})
        setCrisisModalData(result)
        addNews({
          headline: `🚨 [ALERTE CRISE] ${result.crisisHeadline}`,
          body: result.crisisSummary,
          type: 'military',
          turn: effectiveDay,
        })
      } else {
        // Normal peaceful advancement
        advanceDays(elapsedDays, result.statDeltas || {})
        if (result.events?.length) {
          result.events.forEach((ev) => addNews({ ...ev, turn: ev.turn || effectiveDay }))
        }
      }

      ;(result.incomingDiplomacy || []).forEach((contact) => {
        const target = worldCountries.find((item) => item.id === contact.countryId)
        if (!target) return
        const message = {
          id: `contact-${contact.countryId}-${effectiveDay}-${Date.now()}`,
          countryId: contact.countryId,
          message: contact.message,
          day: effectiveDay,
        }
        queueDiplomaticContact(message)
        addNews({
          headline: `[${target.name.toUpperCase()}] ${isFrench ? 'Demande de contact diplomatique' : 'Request for diplomatic contact'}`,
          body: contact.message,
          type: 'diplomatic',
          turn: effectiveDay,
        })
      })

      // Check for random global discovery / breakthrough event (NASA, CERN, etc.)
      const randomEv = checkRandomWorldEvent(effectiveDay, elapsedDays, isFrench, worldMode)
      if (randomEv) {
        addWorldEvent(randomEv)
        addNews({
          headline: `📡 [${randomEv.org?.toUpperCase()}] ${randomEv.headline}`,
          body: randomEv.body,
          type: 'discovery',
          turn: effectiveDay,
        })
      }

      if (daysToSkip >= 30 || result.events?.length || result.incomingDiplomacy?.length || result.interruptedEarly || randomEv) {
        await fetchPress(worldCountries, relations, effectiveDay)
      }
      const currentProjects = useGameStore.getState().projects || []
      const completedProjects = currentProjects.filter((project) =>
        project.status === 'completed' && project.completedDay > day && project.completedDay <= effectiveDay
      )
      setTimeFeedback({
        fromDay: day,
        toDay: effectiveDay,
        elapsedDays,
        periodReport: result.periodReport || '',
        eventCount: (result.events?.length || 0) + (result.incomingDiplomacy?.length || 0) + Number(Boolean(randomEv)) + Number(Boolean(result.interruptedEarly)),
        activeProjects: currentProjects.filter((project) => project.status === 'active').length,
        completedProjects: completedProjects.map((project) => project.title),
        calm: !result.interruptedEarly && !result.events?.length && !result.incomingDiplomacy?.length && !randomEv && !completedProjects.length,
      })
    } catch (err) {
      console.error(err)
      advanceDays(daysToSkip, {})
      setTimeFeedback({ fromDay: day, toDay: day + daysToSkip, elapsedDays: daysToSkip, eventCount: 0, activeProjects: (projects || []).length, completedProjects: [], calm: true })
    }
    setTurnLoading(false)
  }

  const handleOpenDiplomacy = (target) => {
    setSelectedCountry(target)
    setDiplomacyOpen(true)
    setDiplomacyHistory((diplomaticHistory[target.id] || []).slice(-20))
    setDiplomacyInput('')
  }

  const dispatchDiplomaticMessage = async (target, message, fromCouncil = false) => {
    const previousTalks = (diplomaticHistory[target.id] || []).slice(-24)
    const playerMessage = { role: 'player', text: message, day }
    setDiplomacyLoading(true)
    addDiplomaticHistory(target.id, playerMessage)
    setDiplomacyHistory(fromCouncil ? [...previousTalks, playerMessage].slice(-20) : (history) => [...history, playerMessage])

    try {
      const result = await simulateDiplomacy(groqApiKey, {
        playerCountry: country,
        targetCountry: target,
        action: message,
        currentRelation: relations[target.id] || 'neutral',
        conversationHistory: [...previousTalks, playerMessage],
        language: lang,
        worldMode,
      })

      const countryMessage = { role: 'country', text: result.response, mood: result.mood, day }
      addDiplomaticHistory(target.id, countryMessage)
      setDiplomacyHistory((history) => [...history, countryMessage])
      setRelation(target.id, result.newRelation)

      // If caught bluffing or negative fallout, slightly decrease diplomatic reputation
      if (result.mood === 'negative') {
        updateCountry({
          globalReputation: Math.max(0, (country.globalReputation || 60) - 4),
        })
      }

      addNews({
        headline: `[${target.name.toUpperCase()}] ${isFrench ? 'Dépêche Diplomatique' : 'Diplomatic Dispatch'}`,
        body: result.consequence || result.response,
        type: 'diplomatic',
        turn: day,
      })
      return { targetName: target.name, response: result.response }
    } catch (err) {
      setDiplomacyHistory((h) => [...h, { role: 'error', text: err.message }])
      return null
    } finally {
      setDiplomacyLoading(false)
    }
  }

  const sendDiplomacy = async () => {
    if (!diplomacyInput.trim() || !selectedCountry) return
    const message = diplomacyInput.trim()
    setDiplomacyInput('')
    await dispatchDiplomaticMessage(selectedCountry, message)
  }

  const handleForwardDiplomacy = async (message) => {
    const target = worldCountries.find((item) => item.id === message.countryId)
    if (!target || !message.message?.trim()) return null
    setAiCabinetOpen(false)
    setSelectedCountry(target)
    setDiplomacyOpen(true)
    setDiplomacyInput('')
    return dispatchDiplomaticMessage(target, message.message.trim(), true)
  }

  // Filtered countries list (guaranteed fallback to DEFAULT_WORLD_COUNTRIES)
  const filteredCountries = useMemo(() => {
    const list = worldCountries?.length ? worldCountries : DEFAULT_WORLD_COUNTRIES
    const q = searchQuery.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    return list.filter((c) => {
      const name = (c.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const id = (c.id || '').toLowerCase()
      const capital = (c.capital || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const continent = (c.continent || '').toLowerCase()

      const matchesSearch = !q || name.includes(q) || id.includes(q) || capital.includes(q) || continent.includes(q)

      const currentRel = relations[c.id] || 'neutral'
      const matchesRelation =
        relationFilter === 'all'
          ? true
          : relationFilter === 'ally'
          ? currentRel === 'ally' || currentRel === 'friendly'
          : relationFilter === 'hostile'
          ? currentRel === 'hostile' || currentRel === 'war' || currentRel === 'tense'
          : currentRel === 'neutral'

      const matchesContinent = q.length > 0 || selectedContinent === 'All' || c.continent === selectedContinent

      return matchesSearch && matchesRelation && matchesContinent
    })
  }, [worldCountries, searchQuery, relationFilter, selectedContinent, relations])

  // ─── Loading Screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-[#050812]">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{
            rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, repeat: Infinity },
          }}
          className="text-7xl"
          style={{ filter: 'drop-shadow(0 0 40px rgba(59,130,246,0.7))' }}
        >
          🌍
        </motion.div>
        <div className="text-center max-w-md space-y-2">
          <h2 className="font-display text-2xl md:text-3xl text-gradient-gold font-bold tracking-wide">
            {t('world_loading', lang)}
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">{loadingMsg}</p>
          {country.initialScenario && (
            <p className="text-[11px] text-amber-400/90 italic bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              {t('world_scenario', lang)} {country.initialScenario}
            </p>
          )}

        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.3 }}
              className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
            />
          ))}
        </div>
      </div>
    )
  }

  // ─── Main World UI ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#050814] text-white">
      {/* Header */}
      <header className="glass border-b border-slate-800/80 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-y-3 flex-shrink-0 z-30 bg-slate-950/70">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-600 glass text-slate-400 hover:text-white text-xs transition-colors"
          >
            <Home size={14} />
            <span className="hidden sm:inline">{t('world_menu', lang)}</span>
          </button>
          <div className="text-3xl" style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))' }}>
            {country.flag}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-base md:text-lg font-bold text-gradient-gold">
                {country.name}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-medium">
                {t(`regime_${country.regime?.replace(/\s+/g, '_')}`, lang) || country.regime}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {country.capital || 'Capital'} · {country.continent} · Pop. {formatNumber(country.population / 1e6)}M · ~{Number(country.activePersonnel || 0).toLocaleString(locale)} {isFrench ? 'actifs' : 'active'} · {Number(country.deployedPersonnel || 0).toLocaleString(locale)} {isFrench ? 'déployés' : 'deployed'}
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex w-full max-w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-xl border border-slate-800 hover:border-slate-600 glass text-slate-400 hover:text-white transition-colors"
            title={t('home_settings', lang)}
          >
            <Settings size={14} />
          </button>

          {/* AI Decision Room Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setAiCabinetOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <Landmark size={14} className="text-amber-400" />
            <span className="hidden sm:inline">{t('world_ai_cabinet', lang)}</span>
            <span className="sm:hidden">{t('world_cabinet_short', lang)}</span>
          </motion.button>

          <button
            onClick={() => setIncomingContactOpen(true)}
            className="relative p-1.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 glass text-slate-400 hover:text-white transition-colors"
            title={isFrench ? 'Messages diplomatiques reçus' : 'Incoming diplomatic messages'}
          >
            <Mail size={14} />
            {incomingDiplomacy.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-[9px] font-bold text-slate-950 flex items-center justify-center">
                {incomingDiplomacy.length}
              </span>
            )}
          </button>

          {/* Daily Directives Counter (Integer count + Visual indicator dots, NO fractions) */}
          <button
            onClick={() => setAiCabinetOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-all"
            title={
              isFrench
                ? `${dailyDirectivesRemaining} décrets disponibles pour cette période de 30 jours (cliquez pour ouvrir le Conseil)`
                : `${dailyDirectivesRemaining} decrees available in this 30-day period (click to open Cabinet)`
            }
          >
            <span className="flex items-center gap-1 font-bold">
              <span>⚡</span>
              <span>{dailyDirectivesRemaining} {isFrench ? 'décrets' : 'decrees'}</span>
            </span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx < dailyDirectivesRemaining
                      ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                      : 'bg-slate-700/80 border border-slate-600'
                  }`}
                />
              ))}
            </div>
          </button>

          <button
            onClick={() => setProjectsOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-amber-500/50 hover:text-white"
            title={isFrench ? 'Suivre les projets nationaux' : 'Track national projects'}
          >
            <ClipboardList size={14} className="text-amber-300" />
            <span>{activeProjectCount}</span>
            <span className="hidden xl:inline">{isFrench ? 'Projets' : 'Projects'}</span>
          </button>

          {/* Event Injector Button (Max 2 per 30-day period) */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setEventInjectorOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              dailyEventInjectionsRemaining > 0
                ? 'bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                : 'bg-slate-800/60 border-slate-700 text-slate-500 opacity-60'
            }`}
            title={
              isFrench
                ? `Injecteur d'événements géopolitiques majeurs (${dailyEventInjectionsRemaining}/2 pour cette période)`
                : `Major geopolitical event injector (${dailyEventInjectionsRemaining}/2 this period)`
            }
          >
            <Flame size={14} className={dailyEventInjectionsRemaining > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'} />
            <span className="hidden sm:inline">{isFrench ? 'Injecteur' : 'Injector'}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-red-950/60 border border-red-500/30 text-red-300">
              {dailyEventInjectionsRemaining}/2
            </span>
          </motion.button>

          <button
            onClick={() => setCloudModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-xl border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <Cloud size={14} className="text-blue-400" />
            <span className="hidden md:inline">{t('world_saves', lang)}</span>
          </button>

          {/* Day Display */}
          <span className="text-xs text-slate-300 glass border border-slate-700/80 rounded-xl px-2.5 py-1.5 font-mono font-bold">
            {t('world_day', lang)} {day} · {isFrench ? 'A' : 'Y'}{gameYear}
          </span>

          <AutoWeekTimer
            paused={loading || turnLoading || isGameOver || diplomacyOpen || diplomacyLoading || incomingContactOpen || cloudModalOpen || aiCabinetOpen || eventInjectorOpen || projectsOpen || settingsOpen}
            isFrench={isFrench}
            onAdvance={handleAdvanceDays}
          />

          {/* Quick +1 Day Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAdvanceDays(1)}
            disabled={turnLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              turnLoading
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-blue-600 hover:bg-blue-500 text-white glow-blue shadow-lg'
            }`}
          >
            {turnLoading ? (
              <>
                <RotateCcw size={13} className="animate-spin" /> {t('world_advancing', lang)}
              </>
            ) : (
              <>
                <Zap size={13} /> {t('world_next_day', lang)}
              </>
            )}
          </motion.button>

          {/* Time Skip Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setTimeSkipMenuOpen(!timeSkipMenuOpen)}
              disabled={turnLoading}
              className="p-1.5 rounded-xl border border-slate-800 hover:border-blue-500/50 glass text-blue-400 hover:text-white text-xs transition-all"
              title={t('world_skip_time', lang)}
            >
              <FastForward size={14} />
            </button>

            {timeSkipMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl glass border border-slate-700 bg-slate-950 p-2 shadow-2xl z-50 space-y-1">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  {t('world_skip_time', lang)}
                </div>
                <button
                  onClick={() => handleAdvanceDays(7)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-between"
                >
                  <span>{t('world_skip_7d', lang)}</span>
                  <span className="text-[10px] text-blue-400 font-mono">+7j</span>
                </button>
                <button
                  onClick={() => handleAdvanceDays(30)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-between"
                >
                  <span>{t('world_skip_30d', lang)}</span>
                  <span className="text-[10px] text-blue-400 font-mono">+30j</span>
                </button>
                <button
                  onClick={() => handleAdvanceDays(90)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-between"
                >
                  <span>{t('world_skip_90d', lang)}</span>
                  <span className="text-[10px] text-blue-400 font-mono">+90j</span>
                </button>
                <div className="px-2 pt-2 mt-1 text-[10px] uppercase font-bold text-slate-400 border-t border-slate-800">
                  {isFrench ? 'Années' : 'Years'}
                </div>
                {[1, 5, 10].map((years) => (
                  <button
                    key={years}
                    onClick={() => handleAdvanceDays(years * 365)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-between"
                  >
                    <span>{t(`world_skip_${years}y`, lang)}</span>
                    <span className="text-[10px] text-emerald-300 font-mono">+{years}{isFrench ? 'a' : 'y'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Playfield */}
        <div className="flex-1 flex flex-col overflow-auto p-4 md:p-6 space-y-4">
          {/* Active Scenario Banner */}
          {country.initialScenario && (
            <div className="px-4 py-2.5 rounded-2xl border border-red-500/30 bg-red-950/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 truncate">
                <Flame size={15} className="text-red-400 flex-shrink-0 animate-pulse" />
                <span className="text-slate-300 truncate">
                  <strong className="text-red-300">{t('world_scenario', lang)}</strong> {country.initialScenario}
                </span>
              </div>
              <button
                onClick={() => setAiCabinetOpen(true)}
                className="text-[11px] font-bold text-amber-300 hover:underline flex-shrink-0"
              >
                {t('world_consult', lang)}
              </button>
            </div>
          )}

          {timeFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
              className="flex items-start gap-3 border-l-2 border-emerald-500 bg-[#101a15] px-4 py-3"
            >
              <Clock3 size={15} className="mt-0.5 shrink-0 text-emerald-300" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-emerald-100">
                  {isFrench
                    ? `Temps écoulé · Jour ${timeFeedback.fromDay} → ${timeFeedback.toDay}`
                    : `Time advanced · Day ${timeFeedback.fromDay} → ${timeFeedback.toDay}`}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {timeFeedback.periodReport || (timeFeedback.calm
                    ? (isFrench ? 'Période calme : aucun événement majeur.' : 'Quiet period: no major events.')
                    : (isFrench
                      ? `${timeFeedback.eventCount} développement(s), ${timeFeedback.completedProjects.length} projet(s) achevé(s).`
                      : `${timeFeedback.eventCount} development(s), ${timeFeedback.completedProjects.length} project(s) completed.`))}
                  {timeFeedback.completedProjects.length > 0 && ` ${timeFeedback.completedProjects.join(', ')}`}
                  {timeFeedback.calm && timeFeedback.activeProjects > 0 && (isFrench
                    ? ` ${timeFeedback.activeProjects} projet(s) actif(s) ont progressé.`
                    : ` ${timeFeedback.activeProjects} active project(s) progressed.`)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTimeFeedback(null)}
                className="shrink-0 text-slate-500 hover:text-white"
                aria-label={isFrench ? 'Fermer le rapport de progression' : 'Dismiss time update'}
              >
                <X size={14} />
              </button>
            </motion.div>
          )}

          {worldEvents?.[0] && (
            <motion.div
              key={worldEvents[0].id || worldEvents[0].headline}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 border-l-2 border-amber-400 bg-amber-950/15 px-4 py-3"
            >
              <Flame size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase font-bold text-amber-300">
                  <span>{worldEvents[0].org || (isFrench ? 'Événement mondial' : 'World event')}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{t('world_day', lang)} {worldEvents[0].day || day}</span>
                </div>
                <h3 className="mt-1 text-sm font-semibold leading-snug text-white">
                  {worldEvents[0].headline}
                </h3>
                {worldEvents[0].body && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">{worldEvents[0].body}</p>
                )}
              </div>
              <span className="hidden flex-shrink-0 text-lg sm:block" aria-hidden="true">
                {worldEvents[0].icon || '🌍'}
              </span>
            </motion.div>
          )}

          {/* Quick Breaking News Bar */}
          {pressHeadlines?.length > 0 && (
            <div
              onClick={() => setViewMode('press')}
              className="cursor-pointer px-4 py-2 rounded-2xl glass border border-slate-800 hover:border-slate-700 flex items-center gap-2 text-xs transition-colors bg-slate-950/40"
            >
              <Radio size={14} className="text-red-400 animate-pulse flex-shrink-0" />
              <span className="text-[10px] uppercase font-bold text-red-400">{t('world_press_wire', lang)}</span>
              <span className="text-slate-300 font-medium truncate text-xs">
                "{pressHeadlines[0]?.headline}" — {pressHeadlines[0]?.outlet}
              </span>
              <span className="text-[10px] text-blue-400 ml-auto flex-shrink-0 hover:underline">
                {t('world_read', lang)}
              </span>
            </div>
          )}

          {/* Top Geopolitical Bar + View Modes */}
          <div className="glass rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/50">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  {t('world_power_tier', lang)}
                </span>
                <span className="text-lg font-bold text-amber-400">
                  Tier {Math.min(5, Math.ceil((country.militaryPower + (country.gdpPerCapita || 25000) / 15000) / 2))}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  {t('world_allies', lang)}
                </span>
                <span className="text-lg font-bold text-emerald-400">
                  {Object.values(relations).filter((r) => r === 'ally' || r === 'friendly').length}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  {t('world_enemies', lang)}
                </span>
                <span className="text-lg font-bold text-red-400">
                  {Object.values(relations).filter((r) => r === 'hostile' || r === 'war' || r === 'tense').length}
                </span>
              </div>
            </div>

            {/* View Mode Toggle: Map, Grid, Press */}
            <div className="flex items-center gap-1 glass p-1 rounded-xl border border-slate-700/60 bg-slate-900/60">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapIcon size={13} /> {t('world_map', lang)}
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={13} /> {t('world_nations', lang)}
              </button>
              <button
                onClick={() => setViewMode('press')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'press'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio size={13} /> {t('world_press', lang)}
              </button>
            </div>
          </div>

          {/* Universal Geopolitical Command & Search Bar */}
          <div className="glass p-3.5 rounded-2xl border border-slate-800 bg-slate-950/70 space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('world_search', lang)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Relation Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: t('world_filter_all', lang) },
                  { id: 'ally', label: t('world_filter_allies', lang) },
                  { id: 'neutral', label: t('world_filter_neutral', lang) },
                  { id: 'hostile', label: t('world_filter_hostile', lang) },
                ].map((rf) => (
                  <button
                    key={rf.id}
                    onClick={() => setRelationFilter(rf.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${
                      relationFilter === rf.id
                        ? 'bg-slate-700 text-white font-semibold border border-slate-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Continent Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-500 px-1 whitespace-nowrap">
                {t('world_continents', lang)}
              </span>
              {['All', 'Europe', 'Asia', 'Americas', 'Africa', 'Middle East', 'Oceania'].map((cont) => (
                <button
                  key={cont}
                  onClick={() => setSelectedContinent(cont)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
                    selectedContinent === cont
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80'
                  }`}
                >
                  {cont}
                </button>
              ))}
            </div>

            {/* Live Instant Search Autocomplete Matches */}
            {searchQuery && (
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">
                  {t('world_matches', lang, { n: filteredCountries.length })}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {filteredCountries.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setFocusedCountry(c)
                        handleOpenDiplomacy(c)
                      }}
                      className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-blue-500 flex items-center justify-between text-xs text-left transition-all group"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{c.flag}</span>
                        <span className="font-semibold text-white group-hover:text-blue-400 truncate">{c.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">{t(`rel_${relations[c.id] || 'neutral'}`, lang)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* VIEW: Interactive World Map */}
          {viewMode === 'map' && (
            <div className="space-y-3">
              <WorldMap
                worldCountries={worldCountries}
                relations={relations}
                playerCountry={country}
                onSelectCountry={handleOpenDiplomacy}
                focusedCountry={focusedCountry}
                worldMode={worldMode}
                isFrench={isFrench}
              />
            </div>
          )}

          {/* VIEW: Global Press Window */}
          {viewMode === 'press' && (
            <PressWindow
              headlines={pressHeadlines}
              loading={pressLoading}
              onRefresh={() => fetchPress()}
            />
          )}

          {/* VIEW: Nations Grid */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-1">
              {filteredCountries.map((c) => (
                <CountryCard
                  key={c.id}
                  country={c}
                  relation={relations[c.id]}
                  onClick={handleOpenDiplomacy}
                />
              ))}
              {filteredCountries.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-slate-500 glass rounded-2xl">
                  {t('world_no_nations', lang)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 md:w-96 flex-shrink-0 border-l border-slate-800/80 flex flex-col bg-slate-950/60 backdrop-blur-xl">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-slate-800/80 bg-slate-950/80">
            {SIDEBAR_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSideTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all ${
                  sideTab === t.id
                    ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {sideTab === 'countries' && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-1">
                  {t('world_diplo_index', lang, { n: worldCountries.length })}
                </p>
                {worldCountries.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleOpenDiplomacy(c)}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all"
                  >
                    <span className="text-xl flex-shrink-0">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {t(`regime_${c.regime?.replace(/\s+/g, '_')}`, lang) || c.regime} · {c.continent}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        relations[c.id] === 'ally'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                          : relations[c.id] === 'hostile' || relations[c.id] === 'war'
                          ? 'text-red-400 bg-red-500/10 border border-red-500/30'
                          : 'text-slate-400 bg-slate-800 border border-slate-700'
                      }`}
                    >
                      {t(`rel_${relations[c.id] || 'neutral'}`, lang)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {sideTab === 'news' && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-1 mb-3">
                  {t('world_intel_feed', lang)}
                </p>
                <NewsFeed items={newsFeed} />
              </div>
            )}

            {sideTab === 'stats' && (
              <div className="space-y-4">
                <StatCard
                  label={t('world_stability', lang)}
                  value={country.stability}
                  locale={locale}
                  icon="🏛️"
                  color={country.stability > 50 ? 'green' : country.stability > 25 ? 'yellow' : 'red'}
                  subtitle={isFrench ? 'Ordre civil & résilience institutionnelle' : 'Civil order & institutional resilience'}
                />
                <StatCard
                  label={t('world_reputation', lang)}
                  value={country.globalReputation}
                  locale={locale}
                  icon="🌐"
                  color="blue"
                  subtitle={isFrench ? 'Crédit diplomatique & puissance douce' : 'Diplomatic prestige & soft power'}
                />
                <StatCard
                  label={t('world_tension', lang)}
                  value={country.militaryTension}
                  locale={locale}
                  icon="⚔️"
                  color={country.militaryTension > 65 ? 'red' : 'green'}
                  subtitle={isFrench ? 'Risque de guerre armée frontalière' : 'Risk of regional armed conflict'}
                />

                {/* Comprehensive Macroeconomic Dossier */}
                <div className="glass rounded-2xl p-4 space-y-3 border border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {t('world_dossier', lang)}
                  </h4>
                  {[
                    [t('world_capital', lang), country.capital],
                    [t('world_regime', lang), t(`regime_${country.regime?.replace(/\s+/g, '_')}`, lang) || country.regime],
                    [t('econ_gdp_real', lang), `$${formatNumber(country.gdpPerCapita, 0)}`],
                    [t('econ_gdp_nominal', lang), `$${formatNumber(country.gdpNominal || (country.population * country.gdpPerCapita) / 1e9)} ${isFrench ? 'Mds USD' : 'B USD'}`],
                    [t('econ_unemployment', lang), `${formatNumber(country.unemploymentRate ?? 5.6)}%`],
                    [t('econ_inflation', lang), `${formatNumber(country.inflationRate ?? 2.3)}%`],
                    [t('econ_public_debt', lang), `${formatNumber(country.publicDebt ?? 64)}%`],
                    [t('econ_gini', lang), formatNumber((country.giniIndex ?? 31) / 100, 2)],
                    [t('econ_poverty', lang), `${formatNumber(country.povertyRate ?? 8.4)}%`],
                    [t('world_military', lang), `${country.militaryPower} / 10`],
                    [t('world_population', lang), `${formatNumber(country.population / 1e6)}M`],
                    [t('world_urbanization', lang), `${formatNumber(country.urbanization, 0)}%`],
                    [t('world_resources', lang), country.resources?.join(', ') || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-400">{k}</span>
                      <span className="text-white font-medium font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cloud & Local Saves Modal */}
      <CloudSyncModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
      />

      {/* AI War Cabinet & Decision Room Modal */}
      <AiCabinetModal
        isOpen={aiCabinetOpen}
        onClose={() => setAiCabinetOpen(false)}
        onForwardDiplomacy={handleForwardDiplomacy}
      />

      {/* Geopolitical Event Injector Modal (Max 2 per day) */}
      <EventInjectorModal
        isOpen={eventInjectorOpen}
        onClose={() => setEventInjectorOpen(false)}
      />

      <ProjectsModal
        isOpen={projectsOpen}
        onClose={() => setProjectsOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Emergency Crisis Brake Modal */}
      <AnimatePresence>
        {crisisModalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass rounded-3xl border border-red-500/60 p-6 md:p-8 max-w-lg w-full bg-[#12080d] shadow-[0_0_50px_rgba(239,68,68,0.3)] space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  <Flame size={24} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 block font-mono">
                    {t('time_skip_brake_alert', lang)}
                  </span>
                  <h3 className="text-lg font-bold text-white font-display leading-tight mt-0.5">
                    {crisisModalData.crisisHeadline || 'Alerte Rouge Majeure'}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-red-200/90 leading-relaxed font-sans bg-red-950/30 p-3.5 rounded-xl border border-red-900/40">
                {crisisModalData.crisisSummary}
              </p>

              {crisisModalData.recommendedActions?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isFrench ? 'Mesures d\'urgence suggérées :' : 'Urgent recommended decrees:'}
                  </span>
                  <div className="space-y-1.5">
                    {crisisModalData.recommendedActions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCrisisModalData(null)
                          setAiCabinetOpen(true)
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/60 text-xs text-slate-200 transition-all"
                      >
                        ⚡ {act}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setCrisisModalData(null)}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all glow-blue"
              >
                {t('time_skip_resume', lang)} ({t('world_day', lang)} {day})
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* State Collapse / Game Over Modal */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="glass rounded-3xl border border-red-500/50 p-6 md:p-8 max-w-lg w-full bg-[#0d070b] text-center shadow-[0_0_60px_rgba(239,68,68,0.3)] space-y-6"
            >
              <div className="text-6xl animate-bounce">
                <Skull size={56} className="mx-auto text-red-500" />
              </div>
              <div>
                <span className="text-xs uppercase font-mono font-bold tracking-widest text-red-400 px-3 py-1 rounded-full bg-red-950/50 border border-red-500/30">
                  {t('game_over_title', lang)}
                </span>
                <h2 className="text-2xl font-display font-black text-white mt-3">
                  {gameOverReason?.title || t('game_over_title', lang)}
                </h2>
                <p className="text-xs md:text-sm text-slate-300 mt-2 leading-relaxed">
                  {gameOverReason?.description}
                </p>
              </div>

              {/* Autopsy Stats */}
              <div className="grid grid-cols-2 gap-2 text-left p-3.5 rounded-2xl bg-red-950/20 border border-red-900/40 text-xs font-mono">
                <div>
                  <span className="text-slate-400">{isFrench ? 'Stabilité :' : 'Stability:'}</span>{' '}
                  <strong className="text-red-400">{country.stability}%</strong>
                </div>
                <div>
                  <span className="text-slate-400">{isFrench ? 'Tension :' : 'Tension:'}</span>{' '}
                  <strong className="text-red-400">{country.militaryTension}%</strong>
                </div>
                <div>
                  <span className="text-slate-400">{isFrench ? 'Inflation :' : 'Inflation:'}</span>{' '}
                  <strong className="text-red-400">{country.inflationRate}%</strong>
                </div>
                <div>
                  <span className="text-slate-400">{isFrench ? 'Dette :' : 'Debt:'}</span>{' '}
                  <strong className="text-red-400">{country.publicDebt}%</strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    resetGame()
                    navigate('/create')
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                >
                  {t('game_over_restart', lang)}
                </button>
                <button
                  onClick={() => setCloudModalOpen(true)}
                  className="py-3 px-4 rounded-xl glass border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-semibold transition-all"
                >
                  {t('game_over_load', lang)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Diplomacy Modal */}
      <AnimatePresence>
        {incomingContactOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(event) => event.target === event.currentTarget && setIncomingContactOpen(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="w-full max-w-lg max-h-[80vh] overflow-y-auto border border-slate-700 bg-slate-950 shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">{isFrench ? 'Contacts diplomatiques reçus' : 'Incoming diplomatic contacts'}</h2>
                <button onClick={() => setIncomingContactOpen(false)} className="p-1.5 text-slate-400 hover:text-white" aria-label={isFrench ? 'Fermer' : 'Close'}>
                  <X size={16} />
                </button>
              </div>
              <div className="divide-y divide-slate-800">
                {incomingDiplomacy.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">{isFrench ? 'Aucun message en attente.' : 'No messages waiting.'}</p>
                ) : incomingDiplomacy.map((contact) => {
                  const sender = worldCountries.find((item) => item.id === contact.countryId)
                  if (!sender) return null
                  return (
                    <div key={contact.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">{sender.flag} {sender.name}</h3>
                        <span className="text-[10px] text-slate-500">{t('world_day', lang)} {contact.day}</span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">{contact.message}</p>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => dismissDiplomaticContact(contact.id)}
                          className="px-3 py-1.5 border border-slate-700 text-xs text-slate-400 hover:text-white"
                        >{isFrench ? 'Ignorer' : 'Dismiss'}</button>
                        <button
                          onClick={() => {
                            dismissDiplomaticContact(contact.id)
                            setIncomingContactOpen(false)
                            setSelectedCountry(sender)
                            const incomingMessage = { role: 'country', text: contact.message, day: contact.day }
                            addDiplomaticHistory(sender.id, incomingMessage)
                            setDiplomacyHistory([...(diplomaticHistory[sender.id] || []), incomingMessage].slice(-20))
                            setDiplomacyInput('')
                            setDiplomacyOpen(true)
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold text-white"
                        >{isFrench ? 'Répondre' : 'Reply'}</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {diplomacyOpen && selectedCountry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setDiplomacyOpen(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="glass rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-700 shadow-2xl bg-slate-900/90"
            >
              {/* Modal Header */}
              <div className="flex items-center gap-3.5 p-5 border-b border-slate-800 bg-slate-950/60">
                <span className="text-4xl" style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.2))' }}>
                  {selectedCountry.flag}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base md:text-lg leading-tight">
                      {selectedCountry.name}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        relations[selectedCountry.id] === 'ally'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                          : relations[selectedCountry.id] === 'hostile' ||
                            relations[selectedCountry.id] === 'war'
                          ? 'text-red-400 bg-red-500/10 border border-red-500/30'
                          : 'text-slate-400 bg-slate-800 border border-slate-700'
                      }`}
                    >
                      {t(`rel_${relations[selectedCountry.id] || 'neutral'}`, lang)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t(`regime_${selectedCountry.regime?.replace(/\s+/g, '_')}`, lang) || selectedCountry.regime} · {selectedCountry.capital} · {t('world_military', lang)} {selectedCountry.militaryPower}/10
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isFrench ? 'Estimations :' : 'Estimates:'} {Number(selectedCountry.activePersonnel || 0).toLocaleString(locale)} {isFrench ? 'actifs' : 'active'} · {Number(selectedCountry.deployedPersonnel || 0).toLocaleString(locale)} {isFrench ? 'déployés' : 'deployed'} · {Number(selectedCountry.reservePersonnel || 0).toLocaleString(locale)} {isFrench ? 'réserves' : 'reserves'} · {Number(selectedCountry.mobilizedReservePersonnel || 0).toLocaleString(locale)} {isFrench ? 'mobilisés' : 'mobilized'}
                  </p>
                </div>
                <button
                  onClick={() => setDiplomacyOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Country Geopolitical Intel */}
              <div className="p-4 bg-slate-950/30 border-b border-slate-800/80 text-xs text-slate-300 italic leading-relaxed">
                "{selectedCountry.description}"
              </div>

              {/* Live Diplomatic Dialogue */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px]">
                {diplomacyHistory.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-500">
                    {t('world_diplo_begin', lang)}
                  </div>
                )}
                {diplomacyHistory.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'player' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'player'
                          ? 'bg-blue-600 text-white shadow-md'
                          : msg.role === 'error'
                          ? 'bg-red-950/80 text-red-200 border border-red-800'
                          : 'glass border border-slate-700/80 text-slate-200 shadow-md'
                      }`}
                    >
                      {msg.role === 'country' && (
                        <p className="text-[10px] font-bold text-amber-400 mb-1">
                          {t('world_ministry', lang, { name: selectedCountry.name })}
                        </p>
                      )}
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {diplomacyLoading && (
                  <div className="flex items-center gap-2 p-2 text-xs text-slate-400">
                    <RotateCcw size={13} className="animate-spin text-blue-400" />
                    <span>{t('world_sending', lang)}</span>
                  </div>
                )}
              </div>

              {/* Action Presets */}
              <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                {(isFrench ? [
                  '🤝 Proposer un pacte commercial bilatéral',
                  '🛡️ Négocier un traité de défense mutuelle',
                  '💰 Offrir une aide économique & technologique',
                  '⚠️ Émettre un avertissement diplomatique',
                  '⚔️ Déclarer des sanctions hostiles',
                ] : [
                  '🤝 Propose bilateral trade pact',
                  '🛡️ Negotiate mutual defense treaty',
                  '💰 Offer economic grant & tech exchange',
                  '⚠️ Issue diplomatic warning on borders',
                  '⚔️ Declare hostile sanctions',
                ]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDiplomacyInput(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/50"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Message Input Box */}
              <div className="flex gap-2 p-4 border-t border-slate-800 bg-slate-950/60">
                <input
                  value={diplomacyInput}
                  onChange={(e) => setDiplomacyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendDiplomacy()}
                  placeholder={t('world_diplo_prompt', lang, { name: selectedCountry.name })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={sendDiplomacy}
                  disabled={diplomacyLoading || !diplomacyInput.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all glow-blue"
                >
                  {t('world_send', lang)} <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { DEFAULT_WORLD_COUNTRIES } from '../data/defaultWorld'
import { FICTIONAL_WORLD_COUNTRIES, INITIAL_RESOLUTIONS } from '../data/fictionalWorld'
import { ChevronRight, ArrowLeft } from 'lucide-react'

export default function WorldModeSelector() {
  const navigate = useNavigate()
  const { setWorldMode, setDifficultyMode, setWorldCountries, addResolution, addWorldEvent, language, resetGame } = useGameStore()
  const lang = language || 'fr'
  const isFrench = lang === 'fr'

  const [step, setStep] = useState('mode')
  const [selectedMode, setSelectedMode] = useState(null)
  const [generating, setGenerating] = useState(false)

  const handleModeSelect = (mode) => {
    setSelectedMode(mode)
    setStep('difficulty')
  }

  const handleDifficultySelect = (difficulty) => {
    handleConfirm(difficulty)
  }

  const handleConfirm = (difficulty) => {
    if (!selectedMode) return
    setGenerating(true)

    resetGame()
    setWorldMode(selectedMode)
    setDifficultyMode(difficulty)

    if (selectedMode === 'real') {
      // Real world: load real countries, real orgs, seed initial resolutions
      setWorldCountries(DEFAULT_WORLD_COUNTRIES)
      INITIAL_RESOLUTIONS.forEach(res => addResolution(res))
    } else {
      // Fictional world: load fictional countries
      setWorldCountries(FICTIONAL_WORLD_COUNTRIES)
      // Seed fictional resolutions
      const fictionalResolutions = [
        {
          id: 'fic-res-01',
          title: isFrench
            ? 'Protocole Vert de Néovéridia : Moratoire Mondial sur les Mines de Surface'
            : 'Neo-Veridia Green Protocol: Global Surface Mining Moratorium',
          org: 'planetary_league',
          description: isFrench
            ? 'Interdiction de toute exploitation minière de surface dans un rayon de 500km des grandes forêts planétaires protégées.'
            : 'Prohibition of all surface mining within 500km of protected planetary forest preserves.',
          sponsor: 'neo_veridia',
          sponsorName: 'Néovéridia',
          status: 'voting',
          deadlineDay: 45,
        },
        {
          id: 'fic-res-02',
          title: isFrench
            ? 'Proclamation de Guerre Valoria : Autorisation d\'Intervention Collective'
            : 'Valoria War Declaration: Collective Intervention Authorization',
          org: 'planetary_league',
          description: isFrench
            ? 'Motion d\'autorisation de déploiement de forces coalisées contre l\'agression valorienne sur les plaines d\'Aethelgard.'
            : 'Authorization motion to deploy coalition forces against Valorian aggression on the Aethelgard plains.',
          sponsor: 'eldoria',
          sponsorName: 'Eldoria',
          status: 'voting',
          deadlineDay: 20,
        },
      ]
      fictionalResolutions.forEach(res => addResolution(res))

      // Seed a world event for immersion
      addWorldEvent({
        id: `world-event-${Date.now()}`,
        category: 'discovery',
        org: isFrench ? 'Consortium Spatial Suprême' : 'Supreme Cosmic Consortium',
        icon: '🚀',
        headline: isFrench
          ? 'LE CONSORTIUM SPATIAL CARTOGRAPHIE UN ASTÉROÏDE ULTRA-DENSE À 12 MOIS-NAVETTE'
          : 'COSMIC CONSORTIUM MAPS ULTRA-DENSE ASTEROID AT 12 SHUTTLE-MONTHS DISTANCE',
        body: isFrench
          ? 'Sonde automatisée CS-Lyra a identifié un astéroïde contenant 2 milliards de tonnes d\'alliages d\'Obsidium. Course aux armements orbitaux engagée.'
          : 'Automated probe CS-Lyra identified an asteroid containing 2 billion tons of Obsidium alloys. The orbital arms race has begun.',
        day: 1,
        type: 'discovery',
      })
    }

    setTimeout(() => {
      setGenerating(false)
      navigate('/create')
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b100e] p-4 md:p-8 overflow-y-auto text-[#edf2ec]">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(171,193,164,0.12) 0.7px, transparent 0.7px)',
          backgroundSize: '24px 24px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-5xl"
      >
        <AnimatePresence mode="wait">
          {/* ── Step 1: Mode selection ── */}
          {step === 'mode' && (
            <motion.div
              key="mode"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-8 text-center"
            >
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-semibold text-white leading-tight mb-3">
                  {isFrench ? 'Choisissez votre Monde' : 'Choose Your World'}
                </h1>
                <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
                  {isFrench
                    ? 'Le monde réel avec les 100 vraies nations mondiales et les vraies organisations, ou un monde fictif cohérent généré pour l\'immersion.'
                    : 'The real world with 100 genuine nations and real organizations, or a coherent fictional world built for immersion.'}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-left">
                {/* Real World */}
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => handleModeSelect('real')}
                  className="group relative text-left p-5 md:p-6 border border-emerald-800/70 bg-[#101a15] hover:border-emerald-500/60 transition-colors"
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div className="text-5xl" style={{ filter: 'drop-shadow(0 0 18px rgba(59,130,246,0.5))' }}>🌍</div>
                    <div>
                      <h2 className="font-display font-bold text-white text-xl tracking-wide mb-1">
                        {isFrench ? 'Monde Réel' : 'Real World'}
                      </h2>
                      <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">100 pays documentés</p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-5">
                    {isFrench
                      ? 'France, Russie, Chine, États-Unis… avec les indicateurs disponibles et les organisations internationales existantes.'
                      : 'France, Russia, China, USA… with available indicators and existing international organizations.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['🇫🇷', '🇺🇸', '🇩🇪', '🇷🇺', '🇨🇳', '🇧🇷', '🇯🇵', '🇮🇳'].map((f, i) => (
                      <span key={i} className="text-xl">{f}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['🌐 ONU', '🛡️ OTAN', '🏦 FMI', '⚛️ CERN', '🚀 NASA'].map(o => (
                      <span key={o} className="text-[10px] font-semibold px-2 py-0.5 border border-emerald-800/60 text-emerald-200">
                        {o}
                      </span>
                    ))}
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={20} className="text-blue-400" />
                  </div>
                </motion.button>

                {/* Fictional World */}
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => handleModeSelect('fictional')}
                  className="group relative text-left p-5 md:p-6 border border-orange-900/70 bg-[#1b1511] hover:border-orange-500/60 transition-colors"
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div className="text-5xl" style={{ filter: 'drop-shadow(0 0 18px rgba(245,158,11,0.5))' }}>🗺️</div>
                    <div>
                      <h2 className="font-display font-bold text-white text-xl tracking-wide mb-1">
                        {isFrench ? 'Monde Fictif' : 'Fictional World'}
                      </h2>
                      <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider">
                        {isFrench ? '12 nations imaginaires cohérentes' : '12 coherent fictional nations'}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-5">
                    {isFrench
                      ? 'Eldoria, Valoria, Solaria, Néovéridia, Thalassia… Un monde imaginaire mais géopolitiquement cohérent, avec ses propres organisations, conflits et histoires.'
                      : 'Eldoria, Valoria, Solaria, Neo-Veridia, Thalassia… An imaginary but geopolitically consistent world with its own organizations, conflicts, and stories.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['👑', '⚔️', '☀️', '🌿', '🔱', '❄️', '💎', '🕊️'].map((f, i) => (
                      <span key={i} className="text-xl">{f}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['🌐 Ligue Planétaire', '🛡️ Pacte Astria', '🏦 BCI', '🚀 CSSS'].map(o => (
                      <span key={o} className="text-[10px] font-semibold px-2 py-0.5 border border-orange-900/70 text-orange-200">
                        {o}
                      </span>
                    ))}
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={20} className="text-amber-400" />
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Scenario selection ── */}
          {step === 'difficulty' && (
            <motion.div
              key="difficulty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setStep('mode')} className="p-2 text-slate-400 hover:text-white" aria-label={isFrench ? 'Retour au choix du monde' : 'Back to world selection'}>
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">{isFrench ? 'Difficulté' : 'Difficulty'}</h2>
                  <p className="mt-1 text-xs text-slate-400">{isFrench ? 'Choisissez votre façon de créer une nation.' : 'Choose how to create your nation.'}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { id: 'ai', icon: '✦', title: isFrench ? 'Création IA' : 'AI creation', detail: isFrench ? 'Une nation générée, puis vous choisissez son nom.' : 'A generated nation; you choose its name.' },
                  { id: 'normal', icon: '◉', title: isFrench ? 'Mode normal' : 'Standard', detail: isFrench ? 'Choisissez librement les paramètres.' : 'Choose each parameter freely.' },
                  { id: 'hard', icon: '⚑', title: isFrench ? 'Mode contraint' : 'Limited attempts', detail: isFrench ? 'Deux tentatives par caractéristique, avec des choix explicites.' : 'Two attempts per characteristic, using explicit choices.' },
                  { id: 'existing', icon: '◈', title: isFrench ? 'Pays existant' : 'Existing country', detail: isFrench ? 'Cliquez un pays sur la carte, puis adaptez-le à votre stratégie.' : 'Pick a country on the map, then tailor it to your strategy.' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleDifficultySelect(option.id)}
                    disabled={generating}
                    className={`min-h-44 border p-5 text-left transition-colors disabled:cursor-wait disabled:opacity-60 ${option.id === 'hard' ? 'border-orange-900/70 bg-[#1b1511] hover:border-orange-500/60' : option.id === 'existing' ? 'border-blue-900/70 bg-[#101727] hover:border-blue-500/60' : 'border-slate-700 bg-[#121715] hover:border-emerald-700/70'}`}
                  >
                    <span className="text-3xl text-amber-300">{option.icon}</span>
                    <h3 className="mt-5 text-base font-semibold text-white">{option.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{generating ? (isFrench ? 'Initialisation...' : 'Initializing...') : option.detail}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}

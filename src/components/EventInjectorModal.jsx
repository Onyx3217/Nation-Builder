import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { PRESET_INJECTOR_EVENTS, evaluateCustomEventWithAi } from '../services/eventInjectorService'
import {
  Flame, Zap, AlertTriangle, TrendingUp, TrendingDown,
  X, Sparkles, Send, CheckCircle2, ShieldAlert, Edit3, ArrowRight
} from 'lucide-react'

function StatDeltaBadge({ label, value, invert = false, isPercent = false, isCurrency = false }) {
  if (value === undefined || value === null || value === 0) return null
  const positive = invert ? value <= 0 : value >= 0
  const formattedVal = Math.abs(value)
  const display = `${value > 0 ? '+' : '-'}${isCurrency ? '$' : ''}${formattedVal}${isPercent ? '%' : ''}`

  return (
    <div
      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border font-mono ${
        positive
          ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
          : 'text-red-300 bg-red-500/10 border-red-500/30'
      }`}
    >
      {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      <span className="font-bold">{display}</span>
      <span className="opacity-75">{label}</span>
    </div>
  )
}

export default function EventInjectorModal({ isOpen, onClose }) {
  const {
    country,
    worldCountries,
    day,
    advanceDays,
    dailyEventInjectionsRemaining = 2,
    consumeEventInjection,
    updateCountry,
    addNews,
    addWorldEvent,
    language,
  } = useGameStore()

  const isFrench = (language || 'fr') === 'fr'
  const quota = dailyEventInjectionsRemaining ?? 2

  const [activeTab, setActiveTab] = useState('presets') // 'presets' | 'custom'
  const [customInput, setCustomInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastInjectedResult, setLastInjectedResult] = useState(null)

  if (!isOpen) return null

  const handleApplyEffects = (eventTitle, summary, collapseWarning, statEffects, usedFallback = false) => {
    // 1. Consume 1 injection quota
    consumeEventInjection()

    // 2. Apply stat modifications
    const patch = {}
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val))

    if (statEffects.stability !== undefined) {
      patch.stability = clamp((country.stability || 75) + statEffects.stability, 0, 100)
    }
    if (statEffects.militaryTension !== undefined) {
      patch.militaryTension = clamp((country.militaryTension || 20) + statEffects.militaryTension, 0, 100)
    }
    if (statEffects.gdpPerCapita !== undefined) {
      patch.gdpPerCapita = Math.max(200, (country.gdpPerCapita || 28000) + statEffects.gdpPerCapita)
    }
    if (statEffects.inflationRate !== undefined) {
      patch.inflationRate = clamp((country.inflationRate || 2.3) + statEffects.inflationRate, -5, 150)
    }
    if (statEffects.unemploymentRate !== undefined) {
      patch.unemploymentRate = clamp((country.unemploymentRate || 5.6) + statEffects.unemploymentRate, 1, 50)
    }
    if (statEffects.publicDebt !== undefined) {
      patch.publicDebt = clamp((country.publicDebt || 64) + statEffects.publicDebt, 0, 300)
    }
    if (statEffects.globalReputation !== undefined) {
      patch.globalReputation = clamp((country.globalReputation || 60) + statEffects.globalReputation, 0, 100)
    }

    updateCountry(patch)
    addWorldEvent({
      id: `injected-${day}-${Date.now()}`,
      category: 'injected',
      org: isFrench ? 'Conseil stratégique' : 'Strategic council',
      icon: '🚨',
      headline: eventTitle,
      body: summary,
      statEffects,
      day,
      type: 'injected',
    })

    // 3. Broadcast to world news wire
    addNews({
      headline: `🚨 ${eventTitle}`,
      body: summary,
      type: statEffects.militaryTension > 20 ? 'military' : statEffects.gdpPerCapita ? 'economic' : 'political',
      turn: day,
    })
    advanceDays(1)

    setErrorMessage('')
    setLastInjectedResult({
      title: eventTitle,
      summary,
      collapseWarning,
      statEffects,
      usedFallback,
    })
  }

  const handleTriggerPreset = (preset) => {
    if (quota <= 0) return
    const title = isFrench ? preset.titleFr : preset.titleEn
    const summary = isFrench ? preset.summaryFr : preset.summaryEn
    const collapseWarning = isFrench ? preset.riskWarningFr : preset.riskWarningEn
    handleApplyEffects(title, summary, collapseWarning, preset.statEffects)
  }

  const handleTriggerCustom = async (e) => {
    e.preventDefault()
    if (!customInput.trim() || quota <= 0 || loading) return
    setLoading(true)
    setErrorMessage('')

    try {
      const evaluation = await evaluateCustomEventWithAi({
        playerCountry: country,
        worldCountries,
        eventText: customInput.trim(),
        language,
      })

      handleApplyEffects(
        evaluation.title,
        evaluation.summary,
        evaluation.collapseWarning,
        evaluation.statEffects || {},
        evaluation.usedFallback
      )
      setCustomInput('')
    } catch (err) {
      console.error(err)
      setErrorMessage(isFrench
        ? `L'évaluation a échoué : ${err.message}`
        : `Evaluation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl border border-red-500/40 bg-[#080d1d] shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-500/20 bg-red-950/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
              <Flame size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-white text-base tracking-wide">
                  {isFrench ? 'Injecteur d\'Événements Géopolitiques' : 'Geopolitical Event Injector'}
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  {isFrench ? 'BASCULE DU MONDE' : 'WORLD SHIFTER'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isFrench
                  ? 'Déclenchez des événements majeurs (maximum 2 par période de 30 jours).'
                  : 'Trigger major events (maximum 2 per 30-day period).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quota Counter (Max 2 per 30-day period) */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                quota > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <span>⚡</span>
              <span>{quota}/2 {isFrench ? 'injections dispo' : 'injections left'}</span>
              <div className="flex items-center gap-1 ml-0.5">
                {[0, 1].map((idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx < quota
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]'
                        : 'bg-slate-700/80 border border-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── Quota Alert Banner if 0 remaining ── */}
        {quota <= 0 && (
          <div className="bg-red-950/40 border-b border-red-500/30 px-5 py-2.5 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span>
                {isFrench
                  ? 'Limite de 2 événements atteinte. Le quota revient au prochain cycle de 30 jours.'
                  : 'Limit of 2 events reached. The quota refreshes at the next 30-day cycle.'}
              </span>
            </div>
          </div>
        )}

        {/* ── Injected Event Feedback Banner ── */}
        {lastInjectedResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="m-4 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} />
                {isFrench ? 'ÉVÉNEMENT INJECTÉ AVEC SUCCÈS' : 'EVENT SUCCESSFULLY INJECTED'}
              </span>
              <button
                onClick={() => setLastInjectedResult(null)}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <h4 className="text-xs font-bold text-white">{lastInjectedResult.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{lastInjectedResult.summary}</p>
            {lastInjectedResult.usedFallback && (
              <p className="text-[10px] text-amber-300">
                {isFrench ? 'Simulation locale : l’IA n’a pas fourni de résultat exploitable.' : 'Local simulation: the AI did not provide a usable result.'}
              </p>
            )}
            {lastInjectedResult.collapseWarning && (
              <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/40 text-[11px] text-red-300 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                <span>{lastInjectedResult.collapseWarning}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <StatDeltaBadge label={isFrench ? 'Stabilité' : 'Stability'} value={lastInjectedResult.statEffects.stability} isPercent />
              <StatDeltaBadge label={isFrench ? 'Tension' : 'Tension'} value={lastInjectedResult.statEffects.militaryTension} invert isPercent />
              <StatDeltaBadge label={isFrench ? 'PIB/hab' : 'GDP/cap'} value={lastInjectedResult.statEffects.gdpPerCapita} isCurrency />
              <StatDeltaBadge label={isFrench ? 'Inflation' : 'Inflation'} value={lastInjectedResult.statEffects.inflationRate} invert isPercent />
              <StatDeltaBadge label={isFrench ? 'Chômage' : 'Unemployment'} value={lastInjectedResult.statEffects.unemploymentRate} invert isPercent />
              <StatDeltaBadge label={isFrench ? 'Dette' : 'Debt'} value={lastInjectedResult.statEffects.publicDebt} invert isPercent />
              <StatDeltaBadge label={isFrench ? 'Réputation' : 'Reputation'} value={lastInjectedResult.statEffects.globalReputation} isPercent />
            </div>
          </motion.div>
        )}

        {/* ── Navigation Tabs ── */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'presets'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isFrench ? 'Événements Majeurs Préconfigurés' : 'Preset Cataclysmic Events'}
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 size={13} />
            <span>{isFrench ? 'Événement Sur-Mesure (IA)' : 'Custom Event (AI)'}</span>
          </button>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {activeTab === 'presets' && (
            <div className="grid gap-3">
              {PRESET_INJECTOR_EVENTS.map((preset) => {
                const title = isFrench ? preset.titleFr : preset.titleEn
                const desc = isFrench ? preset.summaryFr : preset.summaryEn
                const warning = isFrench ? preset.riskWarningFr : preset.riskWarningEn

                return (
                  <div
                    key={preset.id}
                    className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{preset.icon}</span>
                          <h4 className="text-xs font-bold text-white">{title}</h4>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {preset.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-2.5">{desc}</p>
                      {warning && (
                        <p className="text-[11px] text-amber-400 font-semibold mb-2 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          <span>{warning}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        <StatDeltaBadge label="Stabilité" value={preset.statEffects.stability} isPercent />
                        <StatDeltaBadge label="Tension" value={preset.statEffects.militaryTension} invert isPercent />
                        <StatDeltaBadge label="PIB" value={preset.statEffects.gdpPerCapita} isCurrency />
                        <StatDeltaBadge label="Inflation" value={preset.statEffects.inflationRate} invert isPercent />
                        <StatDeltaBadge label="Chômage" value={preset.statEffects.unemploymentRate} invert isPercent />
                        <StatDeltaBadge label="Dette" value={preset.statEffects.publicDebt} invert isPercent />
                        <StatDeltaBadge label="Réputation" value={preset.statEffects.globalReputation} isPercent />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleTriggerPreset(preset)}
                        disabled={quota <= 0}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                      >
                        <Zap size={13} />
                        <span>{isFrench ? 'Injecter cet événement' : 'Inject this event'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              {errorMessage && (
                <div role="alert" className="border-l-2 border-red-400 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                  {errorMessage}
                </div>
              )}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {isFrench
                    ? 'Décrivez un événement. Son récit et ses conséquences apparaîtront dans le fil mondial; les indicateurs de votre pays seront mis à jour.'
                    : 'Describe an event. Its story and consequences will appear in the world feed, and your country indicators will update.'}
                </p>
              </div>

              <form onSubmit={handleTriggerCustom} className="space-y-3">
                <textarea
                  rows={4}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={
                    isFrench
                      ? "ex: Une insurrection militaire d'envergure prend le contrôle du port principal et proclame l'indépendance de la province pétrolière avec le soutien d'une puissance ennemie..."
                      : "e.g. A major military defection seizes the primary seaport and proclaims the secession of the oil-rich province with foreign backing..."
                  }
                  disabled={quota <= 0 || loading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/70 transition-colors disabled:opacity-40"
                />

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">
                    {isFrench ? 'Consomme 1 injection de votre quota par période' : 'Consumes 1 injection from this period’s quota'}
                  </span>
                  <button
                    type="submit"
                    disabled={!customInput.trim() || quota <= 0 || loading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  >
                    {loading ? (
                      <>
                        <Sparkles size={14} className="animate-spin" />
                        <span>{isFrench ? 'Évaluation IA en cours...' : 'AI Simulating...'}</span>
                      </>
                    ) : (
                      <>
                        <Flame size={14} />
                        <span>{isFrench ? 'Injecter & Tout Faire Basculer' : 'Inject & Shift the World'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { getAiCabinetAdvice } from '../services/groqService'
import { getSituationalAdvice } from '../services/situationalAdvice'
import { t } from '../i18n'
import {
  Landmark, Sparkles, Send, X, TrendingUp, TrendingDown,
  Zap, ShieldAlert, ScrollText, AlertTriangle, CheckCircle2,
  Info, Lightbulb, RotateCcw, RefreshCw,
} from 'lucide-react'

// ─── Stat Delta Badge ─────────────────────────────────────────────────────────
function StatDelta({ label, value, invert = false, isPercent = false, isCurrency = false }) {
  if (value === undefined || value === null || value === 0) return null
  const positive = invert ? value <= 0 : value >= 0
  const formattedVal = Math.abs(value)
  const display = `${value > 0 ? '+' : '-'}${isCurrency ? '$' : ''}${formattedVal}${isPercent ? '%' : ''}`

  return (
    <div
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border ${
        positive
          ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
          : 'text-red-300 bg-red-500/10 border-red-500/30'
      }`}
    >
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      <span className="font-bold">{display}</span>
      <span className="opacity-75">{label}</span>
    </div>
  )
}

// ─── Formatted Analysis (markdown tables, bold, lists) ────────────────────────
function FormattedAnalysis({ content }) {
  if (!content) return null

  const sanitized = content
    .replace(/\\br|\/br|<br\s*\/?>/gi, '\n')
    .replace(/\r\n/g, '\n')

  const lines = sanitized.split('\n')
  const blocks = []
  let currentTable = null

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (!currentTable) currentTable = []
      currentTable.push(trimmed)
    } else {
      if (currentTable) {
        blocks.push({ type: 'table', rows: currentTable })
        currentTable = null
      }
      if (trimmed) blocks.push({ type: 'text', content: trimmed })
    }
  }
  if (currentTable) blocks.push({ type: 'table', rows: currentTable })

  const renderInline = (str) => {
    if (!str) return null
    const parts = str.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-amber-300">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  return (
    <div className="space-y-2 text-xs text-slate-200 leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        if (block.type === 'table') {
          const isDivider = (r) => /^\|(\s*:?-+:?\s*\|)+$/.test(r)
          const headers = block.rows[0].split('|').slice(1, -1).map(c => c.trim())
          const dataRows = block.rows.slice(1).filter(r => !isDivider(r))
          return (
            <div key={idx} className="overflow-x-auto my-2.5 rounded-xl border border-slate-700/80 bg-slate-950/70 shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/80 bg-slate-900/90">
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {dataRows.map((r, rIdx) => {
                    const cells = r.split('|').slice(1, -1).map(c => c.trim())
                    return (
                      <tr key={rIdx} className="hover:bg-slate-800/30">
                        {cells.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-slate-200">{renderInline(cell)}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.content.startsWith('- ') || block.content.startsWith('* ') || block.content.startsWith('• ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span className="flex-1">{renderInline(block.content.replace(/^[-*•]\s*/, ''))}</span>
            </div>
          )
        }
        return <p key={idx}>{renderInline(block.content)}</p>
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AiCabinetModal({ isOpen, onClose, onForwardDiplomacy }) {
  const {
    country,
    worldCountries,
    worldMode,
    relations,
    newsFeed,
    worldEvents,
    projects,
    day,
    dailyDirectivesRemaining,
    consumeDirective,
    addProject,
    updateCountry,
    addNews,
    language,
    cabinetHistory,
    diplomaticHistory,
    addCabinetHistory,
    clearCabinetHistory,
  } = useGameStore()

  const lang = language || 'fr'
  const isFrench = lang === 'fr'

  const history = cabinetHistory || []
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  // Track which suggestion index offset we're showing (rotates on each AI response)
  const [adviceOffset, setAdviceOffset] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Compute all situational advices (changes with country state)
  const allAdvices = useMemo(
    () => getSituationalAdvice(country, relations, worldCountries, lang),
    [country, relations, worldCountries, lang]
  )

  // The 3 suggestions to show right now — rotate every time adviceOffset changes
  // Never repeat: we pick a slice of 3 distinct items cycling through the pool
  const visibleAdvices = useMemo(() => {
    if (!allAdvices.length) return []
    // Build an extended list (repeat twice) to allow smooth cycling
    const extended = [...allAdvices, ...allAdvices]
    // Pick 3 unique items from offset, wrap around
    const results = []
    for (let i = 0; i < Math.min(3, allAdvices.length); i++) {
      results.push(extended[(adviceOffset + i) % allAdvices.length])
    }
    return results
  }, [allAdvices, adviceOffset])

  const rotateAdvice = useCallback(() => {
    setAdviceOffset(prev => (prev + 3) % Math.max(1, allAdvices.length))
  }, [allAdvices.length])

  useEffect(() => {
    if (!isOpen) return
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
  }, [history, loading, isOpen])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const executeDirective = async (directiveText) => {
    if (!directiveText.trim()) return

    addCabinetHistory({ type: 'user', text: directiveText })
    setInput('')
    setLoading(true)

    try {
      const result = await getAiCabinetAdvice({
        playerCountry: country,
        worldCountries,
        relations,
        newsFeed,
        worldEvents,
        activeProjects: (projects || []).filter((project) => project.status === 'active'),
        diplomaticHistory,
        day,
        worldMode,
        playerQuery: directiveText,
        conversationHistory: history,
        language,
      })

      const isDiplomaticForward = Boolean(result.diplomaticMessage?.countryId && result.diplomaticMessage?.message)
      const isDecision = Boolean(result.isDecision || isDiplomaticForward)
      const statEffects = isDiplomaticForward ? {} : (result.statEffects || {})
      let createdProject = null

      if (isDecision) {
        if (dailyDirectivesRemaining <= 0) {
          addCabinetHistory({
            type: 'ai',
            isDecision: true,
            title: result.title,
            analysis: isFrench
              ? `[QUOTA DE PÉRIODE ÉPUISÉ]\nVous avez déjà utilisé vos 5 décrets exécutifs pour cette période de 30 jours.\n\n${result.analysis}`
              : `[PERIOD QUOTA EXHAUSTED]\nYou have used all 5 executive decrees for this 30-day period.\n\n${result.analysis}`,
            flavorConsequence: isFrench
                ? 'Décret mis en réserve jusqu’au prochain cycle de 30 jours.'
                : 'Decree archived pending the next 30-day cycle.',
            collapseWarning: result.collapseWarning,
            statEffects: {},
          })
          setLoading(false)
          return
        }

        consumeDirective()

        if (result.project && typeof result.project === 'object' && result.project.title) {
          createdProject = addProject({
            title: result.project.title,
            objective: result.project.objective || result.analysis,
            category: result.project.category || 'other',
            baseDurationDays: result.project.baseDurationDays,
            statEffects: result.project.statEffects || {},
          })
        } else if (Object.keys(statEffects).length > 0) {
          const patch = {}
          const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v))
          if (statEffects.stability !== undefined) patch.stability = clamp((country.stability || 75) + statEffects.stability, 0, 100)
          if (statEffects.globalReputation !== undefined) patch.globalReputation = clamp((country.globalReputation || 60) + statEffects.globalReputation, 0, 100)
          if (statEffects.militaryTension !== undefined) patch.militaryTension = clamp((country.militaryTension || 20) + statEffects.militaryTension, 0, 100)
          if (statEffects.gdpPerCapita !== undefined) patch.gdpPerCapita = Math.max(200, (country.gdpPerCapita || 28000) + statEffects.gdpPerCapita)
          if (statEffects.inflationRate !== undefined) patch.inflationRate = clamp((country.inflationRate || 2.3) + statEffects.inflationRate, -5, 150)
          if (statEffects.unemploymentRate !== undefined) patch.unemploymentRate = clamp((country.unemploymentRate || 5.6) + statEffects.unemploymentRate, 1, 50)
          if (statEffects.publicDebt !== undefined) patch.publicDebt = clamp((country.publicDebt || 64) + statEffects.publicDebt, 0, 300)
          if (statEffects.giniIndex !== undefined) patch.giniIndex = clamp((country.giniIndex || 31) + statEffects.giniIndex, 18, 75)
          updateCountry(patch)

          addNews({
            headline: `[${t('cabinet_title', lang).toUpperCase()}] ${result.title || directiveText}`,
            body: result.flavorConsequence || result.analysis,
            type: statEffects.militaryTension > 15 ? 'military' : statEffects.gdpPerCapita ? 'economic' : 'political',
            turn: day,
          })
        }
      }

      const forwardedContact = isDiplomaticForward && onForwardDiplomacy
        ? await onForwardDiplomacy(result.diplomaticMessage)
        : null

      addCabinetHistory({
        type: 'ai',
        isDecision,
        title: result.title,
        analysis: forwardedContact?.targetName
          ? `${result.analysis}\n\n${isFrench
            ? `Communiqué transmis à ${forwardedContact.targetName}. Sa réponse est archivée dans le canal diplomatique.`
            : `Message forwarded to ${forwardedContact.targetName}. Their response is archived in the diplomatic channel.`}`
          : createdProject
          ? `${result.analysis}\n\n${isFrench
            ? `Projet lancé : ${createdProject.title}. Durée estimée : ${createdProject.durationDays} jours, selon le régime ${country.regime}.`
            : `Project started: ${createdProject.title}. Estimated duration: ${createdProject.durationDays} days under ${country.regime}.`}`
          : result.analysis,
        flavorConsequence: result.flavorConsequence,
        collapseWarning: result.collapseWarning,
        statEffects,
        project: createdProject,
      })

      // Rotate suggestions after each AI response so new ones appear
      rotateAdvice()

    } catch (err) {
      addCabinetHistory({ type: 'error', text: err.message })
    }

    setLoading(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    executeDirective(input.trim())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-700/80 bg-[#07101f] shadow-2xl overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/70 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Landmark size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-white text-sm md:text-base tracking-wide">
                  {t('cabinet_title', lang)}
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {t('cabinet_badge', lang)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t('cabinet_subtitle', lang, { flag: country.flag, name: country.name, day })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Directives counter — integer + dots */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                dailyDirectivesRemaining > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
              title={
                isFrench
                  ? `${dailyDirectivesRemaining} décrets disponibles pour cette période de 30 jours`
                  : `${dailyDirectivesRemaining} decrees available in this 30-day period`
              }
            >
              <span>⚡</span>
              <span>{dailyDirectivesRemaining} {isFrench ? 'décrets' : 'decrees'}</span>
              <div className="flex items-center gap-1 ml-0.5">
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
            </div>

            {/* Clear memory */}
            {history.length > 0 && (
              <button
                onClick={clearCabinetHistory}
                title={isFrench ? 'Effacer la mémoire de conversation' : 'Clear conversation memory'}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── Conversation History ── */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-2 space-y-4 min-h-[220px]">
          {/* Empty state — just a minimal welcome, NO duplicated suggestions here */}
          {history.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="text-5xl" style={{ filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.4))' }}>🏛️</div>
              <div>
                <p className="text-slate-200 text-sm font-bold font-display tracking-wider">
                  {country.flag} {country.name}
                </p>
                <p className="text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed">
                  {isFrench
                    ? 'Le Conseil Suprême est en session. Utilisez les suggestions ci-dessous ou rédigez votre propre directive.'
                    : 'The Supreme Cabinet is in session. Use the suggestions below or draft your own directive.'}
                </p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {history.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                {/* User message */}
                {entry.type === 'user' && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-xs leading-relaxed shadow-lg">
                      <p className="text-[10px] text-blue-200 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert size={11} />
                        {isFrench ? 'Directive du Chef d\'État' : 'Head of State Directive'}
                      </p>
                      {entry.text}
                    </div>
                  </div>
                )}

                {/* AI response */}
                {entry.type === 'ai' && (
                  <div className="flex justify-start">
                    <div className="max-w-[92%] space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.isDecision ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 size={11} />
                            {t('cabinet_is_decision', lang)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            <Info size={11} />
                            {t('cabinet_is_consultation', lang)}
                          </span>
                        )}
                        {entry.title && (
                          <span className="text-xs font-bold text-white truncate max-w-[260px]">
                            {entry.title}
                          </span>
                        )}
                      </div>

                      {entry.collapseWarning && (
                        <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200">
                          <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="font-bold block text-red-300 text-[11px] uppercase">
                              {t('cabinet_collapse_warning', lang)}
                            </span>
                            <p className="mt-0.5 leading-relaxed">{entry.collapseWarning}</p>
                          </div>
                        </div>
                      )}

                      {entry.analysis && (
                        <div className="bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-lg">
                          <p className="text-[10px] text-amber-400 font-bold mb-1.5 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} />
                            {t('cabinet_briefing_label', lang)}
                          </p>
                          <FormattedAnalysis content={entry.analysis} />
                        </div>
                      )}

                      {entry.isDecision && Object.keys(entry.statEffects || {}).length > 0 && (
                        <div className="bg-slate-900/70 border border-blue-500/20 px-4 py-3 rounded-2xl">
                          <p className="text-[10px] text-blue-400 font-bold mb-2 uppercase tracking-wider flex items-center gap-1">
                            <Zap size={11} />
                            {t('cabinet_impact_title', lang)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <StatDelta label={t('stat_stability', lang)} value={entry.statEffects.stability} isPercent />
                            <StatDelta label={t('stat_reputation', lang)} value={entry.statEffects.globalReputation} isPercent />
                            <StatDelta label={t('stat_tension', lang)} value={entry.statEffects.militaryTension} invert isPercent />
                            <StatDelta label={t('stat_gdp', lang)} value={entry.statEffects.gdpPerCapita} isCurrency />
                            <StatDelta label={t('stat_inflation', lang)} value={entry.statEffects.inflationRate} invert isPercent />
                            <StatDelta label={t('stat_unemployment', lang)} value={entry.statEffects.unemploymentRate} invert isPercent />
                            <StatDelta label={t('stat_debt', lang)} value={entry.statEffects.publicDebt} invert isPercent />
                            <StatDelta label={t('stat_gini', lang)} value={entry.statEffects.giniIndex} invert isPercent />
                          </div>
                        </div>
                      )}

                      {!entry.isDecision && (
                        <p className="text-[11px] text-slate-500 italic pl-1">
                          {t('cabinet_no_impact', lang)}
                        </p>
                      )}

                      {entry.flavorConsequence && (
                        <div className="bg-slate-900/70 border border-slate-800 px-4 py-3 rounded-2xl">
                          <p className="text-[10px] text-slate-400 font-bold mb-1.5 uppercase tracking-wider flex items-center gap-1">
                            <ScrollText size={11} />
                            {t('cabinet_consequence', lang)}
                          </p>
                          <FormattedAnalysis content={entry.flavorConsequence} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error */}
                {entry.type === 'error' && (
                  <div className="flex justify-center">
                    <div className="text-xs text-red-300 px-4 py-2 bg-red-950/60 border border-red-800/60 rounded-xl">
                      ⚠ {entry.text}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-xs text-slate-400 pl-1"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((idx) => (
                  <motion.div
                    key={idx}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-amber-400"
                  />
                ))}
              </div>
              <span>{t('cabinet_loading', lang)}</span>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Situational Advice Chips (ONLY here, NOT in empty state) ── */}
        <div className="flex-shrink-0 border-t border-slate-800/80 bg-slate-950/80 p-4 space-y-2.5">
          {visibleAdvices.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold">
                  <Lightbulb size={11} />
                  {isFrench ? 'Priorités actuelles :' : 'Current priorities:'}
                </span>
                <button
                  type="button"
                  onClick={rotateAdvice}
                  title={isFrench ? 'Voir d\'autres suggestions' : 'See other suggestions'}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-400 transition-colors"
                >
                  <RefreshCw size={10} />
                  {isFrench ? 'Autres' : 'More'}
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {visibleAdvices.map((adv) => {
                  const isCrit = adv.urgency === 'critical'
                  const isWarn = adv.urgency === 'warning'
                  return (
                    <button
                      key={adv.id + adviceOffset}
                      type="button"
                      onClick={() => {
                        setInput(adv.suggestedAction)
                        inputRef.current?.focus()
                      }}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] transition-all ${
                        isCrit
                          ? 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50'
                          : isWarn
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                      }`}
                      title={adv.description}
                    >
                      <span>{isCrit ? '🚨' : isWarn ? '⚠️' : '💡'}</span>
                      <span className="font-semibold">{adv.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {dailyDirectivesRemaining <= 0 && (
            <div className="py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] text-center font-medium">
              {isFrench
                ? '⚡ Quota de décrets épuisé. Questions & consultations restent illimitées.'
                : '⚡ Decree quota exhausted. Questions & consultations remain unlimited.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                dailyDirectivesRemaining > 0
                  ? t('cabinet_directive', lang)
                  : isFrench
                  ? 'Posez une question ou consultation stratégique...'
                  : 'Ask a question or strategic consultation...'
              }
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)]"
            >
              <Send size={13} />
              <span className="hidden sm:inline">{t('cabinet_submit', lang)}</span>
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

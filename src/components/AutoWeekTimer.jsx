import { useEffect, useRef, useState } from 'react'
import { Clock3, Pause, Play } from 'lucide-react'

const AUTO_WEEK_SECONDS = 7 * 60

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function AutoWeekTimer({ paused, isFrench, onAdvance }) {
  const [enabled, setEnabled] = useState(true)
  const [remaining, setRemaining] = useState(AUTO_WEEK_SECONDS)
  const remainingRef = useRef(AUTO_WEEK_SECONDS)
  const advanceRef = useRef(onAdvance)
  const jumpInFlightRef = useRef(false)

  useEffect(() => {
    advanceRef.current = onAdvance
  }, [onAdvance])

  useEffect(() => {
    if (!enabled || paused) return undefined

    const intervalId = window.setInterval(() => {
      const next = remainingRef.current - 1
      if (next <= 0) {
        remainingRef.current = AUTO_WEEK_SECONDS
        setRemaining(AUTO_WEEK_SECONDS)
        if (!jumpInFlightRef.current) {
          jumpInFlightRef.current = true
          Promise.resolve(advanceRef.current?.(7)).finally(() => {
            jumpInFlightRef.current = false
          })
        }
        return
      }

      remainingRef.current = next
      setRemaining(next)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [enabled, paused])

  return (
    <button
      type="button"
      onClick={() => setEnabled((value) => !value)}
      className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-xs font-mono transition-colors ${
        enabled
          ? 'border-emerald-800/70 bg-emerald-950/30 text-emerald-200 hover:border-emerald-500/70'
          : 'border-slate-700 bg-slate-900/70 text-slate-400 hover:text-white'
      }`}
      title={isFrench
        ? `${enabled ? 'Pause' : 'Reprendre'} l’avance automatique d’une semaine toutes les 7 minutes`
        : `${enabled ? 'Pause' : 'Resume'} automatic one-week advance every 7 minutes`}
      aria-label={isFrench
        ? `${enabled ? 'Mettre en pause' : 'Reprendre'} l’avance automatique hebdomadaire, ${formatCountdown(remaining)} restantes`
        : `${enabled ? 'Pause' : 'Resume'} automatic weekly advance, ${formatCountdown(remaining)} remaining`}
    >
      <Clock3 size={13} />
      <span>{formatCountdown(remaining)}</span>
      {enabled ? <Pause size={12} /> : <Play size={12} />}
    </button>
  )
}
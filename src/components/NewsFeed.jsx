import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { t } from '../i18n'

const typeColors = {
  economic: 'text-amber-400',
  military: 'text-red-400',
  diplomatic: 'text-blue-400',
  natural: 'text-emerald-400',
  political: 'text-purple-400',
}

const typeIcons = {
  economic: '💰',
  military: '⚔️',
  diplomatic: '🤝',
  natural: '🌪️',
  political: '🏛️',
}

export default function NewsFeed({ items }) {
  const language = useGameStore((s) => s.language) || 'fr'
  const isFrench = language === 'fr'

  if (!items?.length) {
    return (
      <div className="text-center text-slate-500 py-8 text-xs glass rounded-2xl">
        {isFrench
          ? 'Aucun événement pour le moment. Avancez le temps pour voir l\'histoire s\'écrire.'
          : 'No events yet. Advance time to see global developments unfold.'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.4) }}
          className="glass rounded-2xl p-3 border border-slate-800/80 bg-slate-900/60 space-y-1.5"
        >
          <div className="flex items-start gap-2.5">
            <span className="text-lg flex-shrink-0 mt-0.5">
              {typeIcons[item.type] || '📰'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${typeColors[item.type] || 'text-slate-400'}`}>
                  {item.type}
                </span>
                {item.turn !== undefined && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {t('world_day', language)} {item.turn}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-white leading-snug mt-0.5">{item.headline}</h4>
              {item.body && (
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-1">
                  {item.body}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

import { motion } from 'framer-motion'
import { Radio, RefreshCw } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { t } from '../i18n'

export default function PressWindow({ headlines, loading, onRefresh }) {
  const language = useGameStore((s) => s.language) || 'fr'
  const isFrench = language === 'fr'

  const sentimentColors = {
    alarmist: 'border-red-500/40 text-red-300 bg-red-950/20',
    triumphant: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20',
    critical: 'border-amber-500/40 text-amber-300 bg-amber-950/20',
    scandalous: 'border-orange-500/40 text-orange-200 bg-orange-950/20',
    neutral: 'border-slate-700 text-slate-300 bg-slate-900/40',
  }

  return (
    <section className="border-y border-slate-800 px-1 py-4 space-y-4">
      {/* Header with News Ticker */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 border border-emerald-500/30 bg-emerald-950/30 text-emerald-300">
            <Radio size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>{t('press_title', language)}</span>
            </h3>
            <p className="text-[10px] text-slate-400">{t('press_subtitle', language)}</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">{t('press_refresh', language)}</span>
        </button>
      </div>

      {/* Breaking Ticker Ribbon */}
      {headlines?.[0]?.kind === 'report' && (
        <div className="border-l-2 border-emerald-500 py-1 pl-3 flex items-center gap-2 text-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-300 shrink-0">
            {isFrench ? 'DÉPÊCHE' : 'DISPATCH'}
          </span>
          <div className="truncate text-slate-200 font-medium text-[11px]">
            {headlines[0]?.headline} — {headlines[0]?.outlet}
          </div>
        </div>
      )}

      {/* Newspaper Frontpages Grid */}
      {loading ? (
        <div className="text-center py-10 text-xs text-slate-500 flex flex-col items-center gap-2">
          <RefreshCw size={16} className="animate-spin text-blue-400" />
          <span>{t('press_loading', language)}</span>
        </div>
      ) : !headlines || headlines.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500">
          {t('press_empty', language)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {headlines.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`p-4 border-l-2 flex flex-col justify-between space-y-3 transition-colors ${
                sentimentColors[item.sentiment] || sentimentColors.neutral
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif font-bold text-xs text-slate-100 uppercase border-b border-current pb-0.5">
                    {item.outlet}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700/60 text-slate-400">
                    {item.bias}
                  </span>
                </div>
                <h4 className="font-bold text-sm md:text-base leading-snug text-white font-serif mb-2">
                  {item.headline}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans opacity-90">
                  {item.snippet}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                <span className="min-w-0 truncate">
                  {item.kind === 'analysis' ? (isFrench ? 'Analyse' : 'Analysis') : `${isFrench ? 'Source : ' : 'Source: '}${item.sourceHeadline}`}
                </span>
                <span className="shrink-0">{item.dateLabel}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}

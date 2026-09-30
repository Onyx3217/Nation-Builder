import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { t } from '../i18n'

const relationColors = {
  ally: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  friendly: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  neutral: 'text-slate-400 border-slate-600 bg-slate-800/40',
  tense: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  hostile: 'text-red-400 border-red-500/30 bg-red-500/10',
  war: 'text-red-300 border-red-400/50 bg-red-950/40',
}

const regimeIcons = {
  Democracy: '🗳️',
  Republic: '🏛️',
  Federation: '🔗',
  Monarchy: '👑',
  Dictatorship: '🎖️',
  Theocracy: '☪️',
  Oligarchy: '💼',
  'Military Junta': '⚔️',
  default: '🏳️',
}

export default function CountryCard({ country, relation = 'neutral', onClick }) {
  const language = useGameStore((s) => s.language) || 'fr'
  const isFrench = language === 'fr'
  const rel = relation || 'neutral'
  const icon = regimeIcons[country.regime] || regimeIcons.default

  const popMillions = typeof country.population === 'number'
    ? country.population >= 1e6
      ? `${new Intl.NumberFormat(isFrench ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 }).format(country.population / 1e6)}M`
      : `${new Intl.NumberFormat(isFrench ? 'fr-FR' : 'en-US', { maximumFractionDigits: 0 }).format(country.population / 1e3)}k`
    : country.population

  const nominalGdp = country.gdpNominal || (
    typeof country.population === 'number' && country.gdpPerCapita
      ? Math.round((country.population * country.gdpPerCapita) / 1e9 * 10) / 10
      : null
  )

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(country)}
      className="glass rounded-2xl p-4 cursor-pointer transition-all hover:border-blue-500/50 flex flex-col justify-between space-y-3 bg-slate-900/60"
    >
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">{country.flag}</span>
            <div>
              <h3 className="font-bold text-white text-sm leading-tight">{country.name}</h3>
              <p className="text-xs text-slate-400">{country.capital}</p>
            </div>
          </div>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${relationColors[rel]}`}>
            {t(`rel_${rel}`, language)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{icon} {t(`regime_${country.regime?.replace(/\s+/g, '_')}`, language) || country.regime}</span>
          <span>·</span>
          <span>👥 {popMillions}</span>
          <span>·</span>
          <span>🛡️ {country.militaryPower}/10</span>
        </div>
      </div>

      {/* Macroeconomics Summary Strip */}
      <div className="pt-2 border-t border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">
            {isFrench ? 'PIB / hab :' : 'GDP / cap:'}
          </span>
          <span className="font-bold text-white font-mono">
            ${country.gdpPerCapita?.toLocaleString()}
          </span>
        </div>

        {nominalGdp && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">
              {isFrench ? 'PIB Nominal :' : 'Nominal GDP:'}
            </span>
              <span className="font-bold text-amber-400 font-mono">
              ${nominalGdp.toLocaleString(isFrench ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 })} {isFrench ? 'Mds' : 'B'}
            </span>
          </div>
        )}

        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all"
            style={{ width: `${Math.min(100, ((country.gdpPerCapita || 5000) / 75000) * 100)}%` }}
          />
        </div>
      </div>
    </motion.div>
  )
}

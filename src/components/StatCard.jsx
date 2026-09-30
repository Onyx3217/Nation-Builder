import { motion } from 'framer-motion'

export default function StatCard({ label, value, max = 100, color = 'blue', icon, subtitle, locale = 'fr-FR' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const formattedValue = typeof value === 'number'
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)
    : value

  const gradients = {
    blue: 'from-blue-600 to-blue-400',
    green: 'from-green-600 to-green-400',
    red: 'from-red-600 to-red-400',
    gold: 'from-amber-600 to-amber-400',
    purple: 'from-purple-600 to-purple-400',
  }

  const textColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    gold: 'text-amber-400',
    purple: 'text-purple-400',
  }

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
        </div>
        <span className={`text-lg font-bold ${textColors[color] || textColors.blue}`}>
          {typeof value === 'number' && max === 100 ? `${formattedValue}%` : formattedValue}
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${gradients[color] || gradients.blue}`}
        />
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>
      )}
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { Globe, Sword, Landmark, Zap, Cloud, Settings } from 'lucide-react'
import CloudSyncModal from '../components/CloudSyncModal'
import SettingsModal from '../components/SettingsModal'
import { t } from '../i18n'

export default function Home() {
  const navigate = useNavigate()
  const { phase, country, language, resetGame } = useGameStore()
  const lang = language || 'fr'
  const hasSave = phase !== 'creation' && country.name

  const [cloudModalOpen, setCloudModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-x-clip bg-[#07100d] px-4 py-16 text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(132,160,134,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(132,160,134,0.055) 1px, transparent 1px), linear-gradient(135deg, #07100d 0%, #0c1712 52%, #12140f 100%)',
            backgroundSize: '56px 56px, 56px 56px, cover',
          }}
        />
      </div>

      {/* Top right settings */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="absolute right-4 top-4 z-20 flex min-h-11 items-center gap-2 border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-white sm:right-6 sm:top-6"
      >
        <Settings size={14} />
        <span className="hidden sm:inline">{t('home_settings', lang)}</span>
      </button>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="z-10 w-full max-w-2xl px-0 text-center sm:px-6"
      >
        {/* Globe icon */}
        <motion.div
          animate={{ rotate: [0, 4, -4, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-5 select-none text-6xl leading-none sm:text-7xl md:mb-6 md:text-8xl"
          style={{ filter: 'drop-shadow(0 0 40px rgba(245,158,11,0.35))' }}
        >
          🌍
        </motion.div>

        {/* Title */}
        <h1 className="font-display mb-3 text-4xl font-extrabold uppercase text-gradient-gold sm:text-5xl md:text-6xl">
          {t('home_title', lang)}
        </h1>
        <p className="mb-2 text-base font-light text-slate-200 sm:text-lg md:text-xl">
          {t('home_tagline', lang)}
        </p>
        <p className="mb-8 text-xs text-slate-400 sm:mb-10 sm:text-sm">
          {t('home_subtitle', lang)}
        </p>

        {/* Feature pills */}
        <div className="mb-8 flex flex-wrap justify-center gap-2 sm:mb-10">
          {[
            { icon: <Globe size={13} />, key: 'home_feat_map' },
            { icon: <Sword size={13} />, key: 'home_feat_diplo' },
            { icon: <Landmark size={13} />, key: 'home_feat_nations' },
            { icon: <Zap size={13} />, key: 'home_feat_ai' },
          ].map(({ icon, key }) => (
            <span
              key={key}
              className="flex items-center gap-1.5 border border-slate-700/80 bg-slate-950/55 px-3 py-2 text-xs text-slate-300"
            >
              {icon} {t(key, lang)}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
          {/* New Nation → World Mode Selector first */}
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { resetGame(); navigate('/mode-select') }}
            className="min-h-12 w-full border border-emerald-400/50 bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-emerald-600 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
          >
            {t('home_new_nation', lang)}
          </motion.button>

          {/* Continue */}
          {hasSave && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(phase === 'world' ? '/world' : '/create')}
              className="min-h-12 w-full border border-amber-500/40 bg-amber-950/30 px-6 py-3 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-900/40 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              {t('home_continue', lang)} {country.flag} {country.name}
            </motion.button>
          )}

          {/* Saves */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setCloudModalOpen(true)}
            className="flex min-h-12 w-full items-center justify-center gap-2 border border-slate-700/80 bg-slate-950/60 px-5 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white sm:w-auto sm:py-4"
          >
            <Cloud size={15} className="text-blue-400" /> {t('home_saves', lang)}
          </motion.button>
        </div>
      </motion.div>

      {/* Modals */}
      <CloudSyncModal isOpen={cloudModalOpen} onClose={() => setCloudModalOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Version footer */}
      <div className="relative z-10 mt-10 text-center text-[11px] text-slate-500">
        {t('home_version', lang)}
      </div>
    </div>
  )
}

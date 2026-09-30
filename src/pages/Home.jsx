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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#050914]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
            backgroundSize: '70px 70px',
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-700/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-600/8 rounded-full blur-[80px]" />
        <div className="absolute top-3/4 left-1/5 w-64 h-64 bg-purple-700/5 rounded-full blur-[100px]" />
      </div>

      {/* Top right settings */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3 py-2 glass rounded-xl border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-xs"
      >
        <Settings size={14} />
        <span className="hidden sm:inline">{t('home_settings', lang)}</span>
      </button>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="text-center z-10 px-6 max-w-2xl w-full"
      >
        {/* Globe icon */}
        <motion.div
          animate={{ rotate: [0, 4, -4, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[80px] md:text-[96px] mb-6 leading-none select-none"
          style={{ filter: 'drop-shadow(0 0 40px rgba(245,158,11,0.35))' }}
        >
          🌍
        </motion.div>

        {/* Title */}
        <h1 className="font-display text-5xl md:text-7xl font-extrabold text-gradient-gold mb-3 tracking-widest uppercase">
          {t('home_title', lang)}
        </h1>
        <p className="text-slate-300 text-lg md:text-xl mb-2 font-light tracking-wide">
          {t('home_tagline', lang)}
        </p>
        <p className="text-slate-500 text-xs md:text-sm mb-10">
          {t('home_subtitle', lang)}
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-10">
          {[
            { icon: <Globe size={13} />, key: 'home_feat_map' },
            { icon: <Sword size={13} />, key: 'home_feat_diplo' },
            { icon: <Landmark size={13} />, key: 'home_feat_nations' },
            { icon: <Zap size={13} />, key: 'home_feat_ai' },
          ].map(({ icon, key }) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-xs text-slate-300 border border-slate-800/80 glass rounded-full px-3.5 py-1.5 shadow-sm"
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
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl transition-all text-sm md:text-base shadow-xl border border-blue-500/50"
          >
            {t('home_new_nation', lang)}
          </motion.button>

          {/* Continue */}
          {hasSave && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(phase === 'world' ? '/world' : '/create')}
              className="w-full sm:w-auto px-8 py-4 glass border border-blue-500/30 text-blue-300 hover:text-white font-semibold rounded-2xl transition-all text-sm md:text-base"
            >
              {t('home_continue', lang)} {country.flag} {country.name}
            </motion.button>
          )}

          {/* Saves */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setCloudModalOpen(true)}
            className="w-full sm:w-auto px-5 py-4 glass border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-2xl transition-all text-sm flex items-center justify-center gap-2"
          >
            <Cloud size={15} className="text-blue-400" /> {t('home_saves', lang)}
          </motion.button>
        </div>
      </motion.div>

      {/* Modals */}
      <CloudSyncModal isOpen={cloudModalOpen} onClose={() => setCloudModalOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Version footer */}
      <div className="absolute bottom-5 text-[11px] text-slate-700">
        {t('home_version', lang)}
      </div>
    </div>
  )
}

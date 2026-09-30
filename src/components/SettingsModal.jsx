import { motion, AnimatePresence } from 'framer-motion'
import { X, Music, Volume2, VolumeX, Globe, Settings, Check } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { t } from '../i18n'

export default function SettingsModal({ isOpen, onClose }) {
  const {
    language,
    musicEnabled,
    musicPlaying,
    musicError,
    musicVolume,
    setLanguage,
    setMusicEnabled,
    setMusicVolume,
  } = useGameStore()

  const lang = language || 'fr'

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-xl border border-slate-700/80 bg-[#0d1410] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 border-b border-slate-800 bg-[#101a15]">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-emerald-800/60 bg-emerald-950/30 text-emerald-300">
                <Settings size={18} />
              </div>
              <h2 className="font-display font-bold text-white text-base tracking-wide">
                {t('settings_title', lang)}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-6">

            {/* ── Language ── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={15} className="text-emerald-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t('settings_language', lang)}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: 'fr', label: '🇫🇷  Français' },
                  { code: 'en', label: '🇬🇧  English' },
                ].map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                      lang === code
                        ? 'bg-emerald-900/30 border-emerald-500/60 text-white'
                        : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <span>{label}</span>
                    {lang === code && <Check size={14} className="text-blue-400" />}
                  </button>
                ))}
              </div>
            </section>

            {/* ── Music ── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Music size={15} className="text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t('settings_music', lang)}
                </h3>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between gap-3 p-4 bg-[#111b15] border border-slate-700/60 mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {musicEnabled ? t('settings_music_on', lang) : t('settings_music_off', lang)}
                  </p>
                  <p className={`mt-1 text-[11px] ${musicError ? 'text-red-300' : 'text-slate-400'}`}>
                    {musicError || (musicPlaying
                      ? (lang === 'fr' ? 'Lecture en cours' : 'Playing now')
                      : musicEnabled
                      ? (lang === 'fr' ? 'En attente de lecture' : 'Waiting to play')
                      : (lang === 'fr' ? 'Lecture désactivée' : 'Playback off'))}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={musicEnabled}
                  onClick={() => {
                    const enabled = !musicEnabled
                    setMusicEnabled(enabled)
                    window.dispatchEvent(new CustomEvent('nation-builder:music-toggle', { detail: enabled }))
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    musicEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      musicEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Volume slider */}
              <div className="p-4 bg-[#111b15] border border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {musicEnabled && musicVolume > 0
                      ? <Volume2 size={14} className="text-emerald-300" />
                      : <VolumeX size={14} className="text-slate-500" />
                    }
                    <span>{t('settings_volume', lang)}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {Math.round(musicVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-emerald-500 cursor-pointer"
                  disabled={!musicEnabled}
                />
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="px-4 pb-4 sm:px-6 sm:pb-5">
            <button
              onClick={onClose}
              className="w-full min-h-11 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
            >
              {t('settings_close', lang)}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

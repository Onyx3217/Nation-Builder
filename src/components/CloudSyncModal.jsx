import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { hasSupabase } from '../services/supabaseClient'
import { saveGameToCloud, getCloudSaves, loadGameFromCloud, deleteCloudSave, estimateCloudSaveBytes } from '../services/supabaseService'
import { useGameStore } from '../store/gameStore'
import { Cloud, Trash2, CheckCircle2, AlertTriangle, RefreshCw, X, Database } from 'lucide-react'

export default function CloudSyncModal({ isOpen, onClose }) {
  const {
    country,
    worldCountries,
    relations,
    newsFeed,
    day,
    dailyDirectivesRemaining,
    dailyEventInjectionsRemaining,
    cabinetHistory,
    incomingDiplomacy,
    diplomaticHistory,
    worldEvents,
    activeResolutions,
    projects,
    worldMode,
    difficultyMode,
    language,
    musicEnabled,
    musicVolume,
    musicPosition,
    gameId,
    restoreCloudSave,
  } = useGameStore()

  const [saves, setSaves] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const lang = language || 'fr'
  const isFrench = lang === 'fr'
  const locale = isFrench ? 'fr-FR' : 'en-US'
  const cloudState = useMemo(() => ({
    worldCountries,
    relations,
    newsFeed,
    day,
    dailyDirectivesRemaining,
    dailyEventInjectionsRemaining,
    cabinetHistory,
    incomingDiplomacy,
    diplomaticHistory,
    worldEvents,
    activeResolutions,
    projects,
    worldMode,
    difficultyMode,
    language,
    musicEnabled,
    musicVolume,
    musicPosition,
    gameId,
  }), [worldCountries, relations, newsFeed, day, dailyDirectivesRemaining, dailyEventInjectionsRemaining, cabinetHistory, incomingDiplomacy, diplomaticHistory, worldEvents, activeResolutions, projects, worldMode, difficultyMode, language, musicEnabled, musicVolume, musicPosition, gameId])
  const estimatedBytes = useMemo(() => estimateCloudSaveBytes(country, cloudState), [country, cloudState])
  const formatBytes = (bytes) => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 }).format(bytes / 1024)

  useEffect(() => {
    if (isOpen && hasSupabase) {
      fetchSaves()
    }
  }, [isOpen])

  const fetchSaves = async () => {
    setLoading(true)
    try {
      const data = await getCloudSaves()
      setSaves(data)
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error fetching saves: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToCloud = async () => {
    setSaving(true)
    setStatusMsg(null)
    try {
      await saveGameToCloud(country, {
        ...cloudState,
      })
      setStatusMsg({
        type: 'success',
        text: isFrench
          ? `Partie mise à jour (${formatBytes(estimatedBytes)} Ko de données JSON).`
          : `Game updated (${formatBytes(estimatedBytes)} KB of JSON data).`,
      })
      await fetchSaves()
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleLoadSave = async (saveId) => {
    setLoading(true)
    setStatusMsg(null)
    try {
      const gameData = await loadGameFromCloud(saveId)
      if (gameData) {
        restoreCloudSave(gameData)
        window.dispatchEvent(new CustomEvent('nation-builder:music-toggle', { detail: Boolean(gameData.music?.enabled) }))
        setStatusMsg({
          type: 'success',
          text: isFrench ? `Partie de ${gameData.country?.name || 'votre pays'} chargée.` : `Loaded ${gameData.country?.name || 'your game'}.`,
        })
        setTimeout(() => onClose(), 1000)
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to load: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSave = async (saveId) => {
    if (!window.confirm('Delete this cloud save from Supabase?')) return
    try {
      await deleteCloudSave(saveId)
      setSaves((s) => s.filter((x) => x.id !== saveId))
      setStatusMsg({ type: 'success', text: 'Save deleted.' })
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass w-full max-w-xl max-h-[90dvh] overflow-hidden flex flex-col rounded-xl border border-slate-700 shadow-2xl bg-slate-900/95"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Database size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">{isFrench ? 'Sauvegardes Supabase' : 'Supabase cloud saves'}</h3>
              <p className="text-xs text-slate-400">
                {hasSupabase
                  ? (isFrench ? 'Connecté à Supabase' : 'Connected to Supabase')
                  : (isFrench ? 'Supabase non configuré' : 'Supabase not configured')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div
            className={`px-4 py-3 text-xs flex items-start gap-2 sm:px-6 ${
              statusMsg.type === 'error'
                ? 'bg-red-500/10 text-red-300 border-b border-red-500/30'
                : 'bg-green-500/10 text-green-300 border-b border-green-500/30'
            }`}
          >
            {statusMsg.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            <span className="min-w-0">{statusMsg.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cloud size={14} className="text-blue-400" /> {isFrench ? 'Sauvegardes de partie' : 'Game saves'}
            </span>
            {hasSupabase && (
              <button
                onClick={fetchSaves}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            )}
          </div>

          {hasSupabase ? (
            <div className="space-y-4">
              {/* Save Current Session Button */}
              {country.name ? (
                <button
                  onClick={handleSaveToCloud}
                  disabled={saving}
                  className="w-full min-h-12 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 glow-blue transition-all shadow-lg"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Cloud size={14} />}
                  {isFrench ? 'Mettre à jour la sauvegarde' : 'Update save'} {country.flag} {country.name} · {isFrench ? 'Jour' : 'Day'} {day}
                </button>
              ) : (
                <div className="p-3 bg-slate-800/40 border border-slate-800 text-center text-xs text-slate-500">
                  {isFrench ? 'Créez ou chargez un pays pour activer les sauvegardes.' : 'Create or load a nation to enable saving.'}
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                {isFrench ? 'Taille JSON estimée' : 'Estimated JSON size'}: {formatBytes(estimatedBytes)} {isFrench ? 'Ko' : 'KB'}
              </p>
              <p className="border-l-2 border-amber-500/70 bg-amber-950/20 px-3 py-2 text-[11px] leading-relaxed text-amber-200/90">
                {isFrench
                  ? 'Sauvegardes privées par session invitée. Elles restent liées à ce navigateur; pour les retrouver sur un autre appareil, il faudra relier un compte OAuth ou configurer un SMTP.'
                  : 'Saves are private to this guest session and remain tied to this browser. To recover them on another device, link an OAuth account or configure SMTP.'}
              </p>

              {/* Cloud Saves List */}
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-blue-400" /> Synchronizing with Supabase...
                  </div>
                ) : saves.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 bg-slate-800/30 border border-slate-800">
                    {isFrench ? 'Aucune sauvegarde cloud. Lancez-en une avec le bouton ci-dessus.' : 'No cloud saves yet. Create one with the button above.'}
                  </p>
                ) : (
                  saves.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 bg-slate-800/50 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between hover:border-blue-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{s.nation_flag || '🌐'}</span>
                        <div>
                          <p className="text-xs font-bold text-white">{s.nation_name}</p>
                          <p className="text-[10px] text-slate-400">
                            {isFrench ? 'Jour' : 'Day'} {s.turn} · {new Date(s.updated_at).toLocaleDateString(locale)} ·{' '}
                            {new Date(s.updated_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:shrink-0">
                        <button
                          onClick={() => handleLoadSave(s.id)}
                          className="min-h-10 px-4 py-2 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:bg-blue-600/50 text-xs font-semibold transition-colors"
                        >
                          {isFrench ? 'Charger' : 'Load'}
                        </button>
                        <button
                          onClick={() => handleDeleteSave(s.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                          title={isFrench ? 'Supprimer la sauvegarde' : 'Delete save'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 border border-amber-500/20 bg-amber-500/5 space-y-2">
              <p className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle size={14} /> {isFrench ? 'Configuration Supabase requise' : 'Supabase configuration required'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isFrench ? 'Ajoutez' : 'Add'} <code className="text-slate-300 bg-slate-800 px-1 py-0.5">VITE_SUPABASE_URL</code> {isFrench ? 'et' : 'and'}{' '}
                <code className="text-slate-300 bg-slate-800 px-1 py-0.5">VITE_SUPABASE_ANON_KEY</code> {isFrench ? 'dans le fichier' : 'to your'}{' '}
                <code className="text-slate-300 bg-slate-800 px-1 py-0.5">.env</code>.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

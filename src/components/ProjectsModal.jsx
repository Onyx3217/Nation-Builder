import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock3, Pause, Play, Save, X } from 'lucide-react'
import { useGameStore } from '../store/gameStore'

const CATEGORY_LABELS = {
  infrastructure: ['Infrastructure', 'Infrastructure'],
  economy: ['Économie', 'Economy'],
  health: ['Santé', 'Health'],
  education: ['Éducation', 'Education'],
  defense: ['Défense', 'Defense'],
  research: ['Recherche', 'Research'],
  social: ['Social', 'Social'],
  other: ['Autre', 'Other'],
}

export default function ProjectsModal({ isOpen, onClose, onAdvanceDay }) {
  const {
    projects = [],
    day,
    language,
    setProjectStatus,
    updateProjectDetails,
  } = useGameStore()
  const isFrench = (language || 'fr') === 'fr'
  const [showArchive, setShowArchive] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({ title: '', objective: '', durationDays: '' })

  if (!isOpen) return null

  const visibleProjects = projects.filter((project) => showArchive
    ? ['completed', 'cancelled'].includes(project.status)
    : ['active', 'paused'].includes(project.status)
  )

  const startEditing = (project) => {
    setEditingId(project.id)
    setDraft({
      title: project.title,
      objective: project.objective,
      durationDays: Math.max(1, project.durationDays - project.elapsedDays),
    })
  }

  const saveDraft = (projectId) => {
    updateProjectDetails(projectId, draft)
    onAdvanceDay?.()
    setEditingId(null)
  }

  const changeProjectStatus = (projectId, status) => {
    setProjectStatus(projectId, status)
    onAdvanceDay?.()
  }

  const statusLabel = (status) => {
    const labels = {
      active: isFrench ? 'En cours' : 'In progress',
      paused: isFrench ? 'En pause' : 'Paused',
      completed: isFrench ? 'Terminé' : 'Completed',
      cancelled: isFrench ? 'Annulé' : 'Cancelled',
    }
    return labels[status] || status
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
        onClick={(event) => event.target === event.currentTarget && onClose()}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="projects-title"
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.985 }}
          className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden border border-slate-700 bg-[#0a1019] shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <div className="flex items-center gap-2 text-amber-300">
                <Clock3 size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isFrench ? `Jour ${day}` : `Day ${day}`}
                </span>
              </div>
              <h2 id="projects-title" className="mt-1 text-lg font-semibold text-white">
                {isFrench ? 'Projets nationaux' : 'National projects'}
              </h2>
            </div>
            <button type="button" onClick={onClose} aria-label={isFrench ? 'Fermer' : 'Close'} className="p-2 text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </header>

          <nav aria-label={isFrench ? 'Filtrer les projets' : 'Filter projects'} className="flex gap-5 border-b border-slate-800 px-5">
            {[
              { archived: false, label: isFrench ? 'En cours' : 'Active' },
              { archived: true, label: isFrench ? 'Terminés / annulés' : 'Completed / cancelled' },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => { setShowArchive(tab.archived); setEditingId(null) }}
                className={`border-b-2 py-3 text-xs font-semibold transition-colors ${
                  showArchive === tab.archived
                    ? 'border-amber-400 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {visibleProjects.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                {showArchive
                  ? (isFrench ? 'Aucun projet archivé.' : 'No archived projects.')
                  : (isFrench ? 'Aucun projet en cours.' : 'No active projects.')}
              </p>
            ) : visibleProjects.map((project) => {
              const remainingDays = Math.max(0, project.durationDays - project.elapsedDays)
              const category = CATEGORY_LABELS[project.category] || CATEGORY_LABELS.other
              const editable = !['completed', 'cancelled'].includes(project.status)

              return (
                <article key={project.id} className="border-b border-slate-800 pb-4 last:border-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{project.title}</h3>
                        <span className="text-[10px] uppercase tracking-wide text-slate-500">
                          {category[isFrench ? 0 : 1]}
                        </span>
                        <span className={`text-[10px] ${project.status === 'active' ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {statusLabel(project.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">{project.objective}</p>
                    </div>
                    <div className="text-right text-xs text-slate-300">
                      {project.status === 'completed'
                        ? (isFrench ? 'Livré' : 'Delivered')
                        : (isFrench ? `${remainingDays} j restants` : `${remainingDays} days left`)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div
                      role="progressbar"
                      aria-label={isFrench ? `Avancement de ${project.title}` : `${project.title} progress`}
                      aria-valuenow={project.progress || 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-1.5 flex-1 overflow-hidden bg-slate-800"
                    >
                      <div className="h-full bg-amber-400 transition-all" style={{ width: `${project.progress || 0}%` }} />
                    </div>
                    <span className="w-10 text-right font-mono text-[11px] text-amber-300">{project.progress || 0}%</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-600">
                    {isFrench
                      ? `Lancé au jour ${project.createdDay} · échéance estimée : jour ${project.createdDay + project.durationDays}`
                      : `Started day ${project.createdDay} · estimated delivery: day ${project.createdDay + project.durationDays}`}
                  </p>

                  {editingId === project.id && (
                    <div className="mt-4 grid gap-3 border-l border-slate-700 pl-3">
                      <label className="grid gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                        {isFrench ? 'Nom du projet' : 'Project name'}
                        <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs normal-case tracking-normal text-white" />
                      </label>
                      <label className="grid gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                        {isFrench ? 'Objectif' : 'Objective'}
                        <textarea rows={2} value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs normal-case tracking-normal text-white" />
                      </label>
                      <label className="grid max-w-xs gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                        {isFrench ? 'Jours restants souhaités' : 'Requested days remaining'}
                        <input type="number" min="1" value={draft.durationDays} onChange={(event) => setDraft({ ...draft, durationDays: event.target.value })} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs normal-case tracking-normal text-white" />
                      </label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saveDraft(project.id)} className="inline-flex items-center gap-1.5 bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400">
                          <Save size={13} /> {isFrench ? 'Enregistrer' : 'Save'}
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="px-3 py-2 text-xs text-slate-400 hover:text-white">
                          {isFrench ? 'Annuler' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}

                  {!showArchive && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {editable && (
                        <button type="button" onClick={() => startEditing(project)} className="text-xs font-medium text-amber-300 hover:text-amber-200">
                          {isFrench ? 'Modifier le projet' : 'Edit project'}
                        </button>
                      )}
                      {project.status === 'active' ? (
                        <button type="button" onClick={() => changeProjectStatus(project.id, 'paused')} title={isFrench ? 'Mettre en pause' : 'Pause project'} className="p-1.5 text-slate-400 hover:text-white">
                          <Pause size={14} />
                        </button>
                      ) : project.status === 'paused' ? (
                        <button type="button" onClick={() => changeProjectStatus(project.id, 'active')} title={isFrench ? 'Reprendre' : 'Resume project'} className="p-1.5 text-slate-400 hover:text-white">
                          <Play size={14} />
                        </button>
                      ) : null}
                      {editable && (
                        <button type="button" onClick={() => changeProjectStatus(project.id, 'cancelled')} title={isFrench ? 'Annuler le projet' : 'Cancel project'} className="p-1.5 text-slate-500 hover:text-red-300">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          <footer className="flex items-center gap-2 border-t border-slate-800 px-5 py-3 text-[11px] text-slate-500">
            <Check size={13} className="text-emerald-400" />
            {isFrench ? 'Les effets sont appliqués à la livraison.' : 'Effects apply when the project is delivered.'}
          </footer>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, RefreshCw, ChevronRight, CheckCircle2, Circle, Loader, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'text-slate-400', icon: Circle, bg: 'bg-slate-700' },
  in_progress: { label: 'In Progress', color: 'text-amber-400', icon: Loader, bg: 'bg-amber-500/20' },
  completed: { label: 'Completed', color: 'text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-500/20' },
}

const CATEGORY_COLORS = {
  Foundation: 'badge-slate',
  'Core Skills': 'badge-indigo',
  Tools: 'badge-amber',
  Projects: 'badge-emerald',
  'Soft Skills': 'badge-rose',
}

const COMMON_ROLES = [
  'Software Development Engineer (SDE)',
  'Data Scientist',
  'Machine Learning Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Analyst',
  'Product Manager',
  'Cybersecurity Analyst',
  'Cloud Engineer',
  'TCS Prime – AI/ML',
  'Infosys Systems Engineer',
]

function RoadmapItem({ item, progress, onStatusChange }) {
  const status = progress?.status || 'not_started'
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  const nextStatus = status === 'not_started' ? 'in_progress' : status === 'in_progress' ? 'completed' : 'not_started'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`glass p-4 flex gap-4 items-start group cursor-pointer hover:border-white/10 transition-all`}
      onClick={() => onStatusChange(item.id, nextStatus)}
    >
      <div className={`mt-0.5 p-2 rounded-xl ${cfg.bg} flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${cfg.color} ${status === 'in_progress' ? 'animate-spin-slow' : ''}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-200 text-sm">{item.title}</p>
          {item.category && (
            <span className={`badge ${CATEGORY_COLORS[item.category] || 'badge-slate'} flex-shrink-0 text-xs`}>
              {item.category}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
        <p className={`text-xs mt-2 ${cfg.color}`}>{cfg.label} · Click to advance</p>
      </div>
    </motion.div>
  )
}

export default function Roadmap() {
  const qc = useQueryClient()
  const [targetRole, setTargetRole] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [filter, setFilter] = useState('all')

  const { data: roadmap, isLoading, error } = useQuery({
    queryKey: ['roadmap'],
    queryFn: () => client.get('/roadmap').then(r => r.data).catch(e => {
      if (e.response?.status === 404) return null
      throw e
    }),
  })

  const generateMutation = useMutation({
    mutationFn: (role) => client.post('/roadmap/generate', { target_role: role }),
    onSuccess: () => {
      toast.success('Roadmap generated!')
      qc.invalidateQueries({ queryKey: ['roadmap'] })
      setShowConfirm(false)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Generation failed'),
  })

  const progressMutation = useMutation({
    mutationFn: ({ itemId, status }) => client.put(`/roadmap/progress/${itemId}`, { status }),
    onMutate: async ({ itemId, status }) => {
      await qc.cancelQueries({ queryKey: ['roadmap'] })
      const previous = qc.getQueryData(['roadmap'])
      qc.setQueryData(['roadmap'], (old) => {
        if (!old) return old
        return {
          ...old,
          progress: old.progress.map(p =>
            p.item_id === itemId ? { ...p, status } : p
          ),
        }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['roadmap'], context.previous)
      toast.error('Could not update progress')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['roadmap'] }),
  })

  const progressMap = Object.fromEntries((roadmap?.progress || []).map(p => [p.item_id, p]))
  const completedCount = (roadmap?.progress || []).filter(p => p.status === 'completed').length
  const totalCount = roadmap?.items?.length || 0
  const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  const filteredItems = (roadmap?.items || []).filter(item => {
    if (filter === 'all') return true
    const status = progressMap[item.id]?.status || 'not_started'
    return status === filter
  })

  const handleGenerate = () => {
    if (!targetRole.trim()) { toast.error('Please enter a target role'); return }
    if (roadmap) { setShowConfirm(true) } else { generateMutation.mutate(targetRole) }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title">Role Roadmap</h1>
        <p className="text-slate-400 mt-1">Get a personalised AI-generated learning path for your target role</p>
      </div>

      {/* Generate section */}
      <div className="card">
        <h2 className="section-title mb-4">Generate / Regenerate Roadmap</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              id="target-role"
              list="role-suggestions"
              className="input"
              placeholder="Enter target role (e.g. Data Scientist, SDE)"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
            />
            <datalist id="role-suggestions">
              {COMMON_ROLES.map(r => <option key={r} value={r} />)}
            </datalist>
          </div>
          <button
            id="generate-roadmap"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="btn-primary"
          >
            {generateMutation.isPending ? <span className="spinner" /> : <Map className="w-4 h-4" />}
            Generate
          </button>
        </div>

        {/* Confirm regenerate modal */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-300 font-medium">You already have an active roadmap</p>
                  <p className="text-xs text-slate-400 mt-1">Generating a new one will archive the current roadmap and its progress. Your old progress won't be lost, but it won't be active.</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => generateMutation.mutate(targetRole)} className="btn-primary text-xs py-1.5 px-3">
                      {generateMutation.isPending ? <span className="spinner w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                      Yes, generate new
                    </button>
                    <button onClick={() => setShowConfirm(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Roadmap content */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="spinner scale-150" /></div>
      ) : !roadmap ? (
        <div className="text-center py-16 text-slate-500">
          <Map className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-400">No roadmap yet</p>
          <p className="text-sm mt-1">Enter a target role above and click Generate</p>
        </div>
      ) : (
        <>
          {/* Progress summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Target Role</p>
                <p className="font-semibold text-slate-200 mt-0.5">{roadmap.target_role}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">{completedCount}/{totalCount} completed</p>
                <p className={`text-2xl font-bold mt-0.5 ${pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-indigo-400'}`}>{pct}%</p>
              </div>
            </div>
            <div className="progress-bar-track">
              <motion.div
                className={`progress-bar-fill ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'not_started', 'in_progress', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`badge cursor-pointer transition-all ${
                  filter === f ? 'badge-indigo' : 'badge-slate hover:border-white/20'
                }`}
              >
                {f === 'all' ? `All (${totalCount})` : STATUS_CONFIG[f]?.label}
              </button>
            ))}
          </div>

          {/* Items list */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <RoadmapItem
                  key={item.id}
                  item={item}
                  progress={progressMap[item.id]}
                  onStatusChange={(itemId, status) => progressMutation.mutate({ itemId, status })}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

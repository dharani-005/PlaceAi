import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Trophy, Users, Search } from 'lucide-react'
import { useState } from 'react'
import client from '../../api/client'

export default function JobDetail() {
  const { id } = useParams()
  const [search, setSearch] = useState('')

  const { data: job } = useQuery({
    queryKey: ['job', id],
    queryFn: () => client.get(`/jobs/${id}`).then(r => r.data),
  })

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['candidates', id],
    queryFn: () => client.get(`/jobs/${id}/candidates`).then(r => r.data),
  })

  const filtered = candidates.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.branch.toLowerCase().includes(search.toLowerCase())
  )

  const medalColors = ['text-amber-400', 'text-slate-300', 'text-amber-700']

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/admin/jobs" className="btn-ghost p-2 mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="page-title">{job?.company_name || '…'}</h1>
          <p className="text-indigo-400">{job?.role_title}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Matched', value: candidates.length, color: 'indigo' },
          { label: 'Avg Match Score', value: candidates.length ? `${(candidates.reduce((a, c) => a + c.match_score, 0) / candidates.length).toFixed(1)}%` : '—', color: 'emerald' },
          { label: 'Top Score', value: candidates[0] ? `${candidates[0].match_score.toFixed(1)}%` : '—', color: 'amber' },
        ].map((s, i) => (
          <div key={s.label} className="card text-center">
            <p className={`text-3xl font-bold ${s.color === 'indigo' ? 'text-indigo-400' : s.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {s.value}
            </p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          className="input pl-10"
          placeholder="Search by name or branch…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Candidate table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="spinner scale-150" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">
            {candidates.length === 0
              ? 'No eligible candidates have checked this drive yet'
              : 'No candidates match your search'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10" style={{ background: 'var(--bg-card2)' }}>
                {['Rank', 'Name', 'Branch', 'CGPA', 'Match Score', 'Matched Skills'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <motion.tr
                  key={c.user_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className={`font-black text-base ${i < 3 ? medalColors[i] : 'text-slate-400'}`}>
                      {i < 3 ? <Trophy className="w-4 h-4 inline mr-1" /> : null} #{c.rank}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{c.full_name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="badge badge-slate font-semibold">{c.branch}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`font-bold text-sm ${c.cgpa >= 8 ? 'text-emerald-600 dark:text-emerald-400' : c.cgpa >= 6.5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                      {c.cgpa.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 progress-bar-track">
                        <div
                          className={`progress-bar-fill ${c.match_score >= 70 ? 'bg-emerald-500' : c.match_score >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${c.match_score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-extrabold ${c.match_score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : c.match_score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {c.match_score.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-48">
                      {(c.matched_skills || []).slice(0, 3).map(s => (
                        <span key={s} className="badge badge-indigo text-xs">{s}</span>
                      ))}
                      {(c.matched_skills?.length || 0) > 3 && (
                        <span className="badge badge-slate text-xs">+{c.matched_skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

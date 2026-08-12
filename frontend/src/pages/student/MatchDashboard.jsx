import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Building2, Calendar, DollarSign, Loader, ArrowUpRight, AlertTriangle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import client from '../../api/client'

function MatchScoreBar({ score }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">Skill Match</span>
        <span className={`font-bold ${score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{score.toFixed(1)}%</span>
      </div>
      <div className="progress-bar-track">
        <motion.div
          className={`progress-bar-fill ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function JobCard({ job }) {
  const [expanded, setExpanded] = useState(false)
  const [matchData, setMatchData] = useState(null)
  const [loading, setLoading] = useState(false)

  const checkMatch = async () => {
    if (matchData) { setExpanded(!expanded); return }
    setLoading(true)
    setExpanded(true)
    try {
      const res = await client.get(`/match/${job.id}`)
      setMatchData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Match check failed')
      setExpanded(false)
    } finally {
      setLoading(false)
    }
  }

  const daysLeft = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24))
  const isExpired = daysLeft < 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass overflow-hidden"
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-700 border border-white/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-200">{job.company_name}</p>
              <p className="text-sm text-indigo-400">{job.role_title}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {job.ctc && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <DollarSign className="w-3 h-3" />{job.ctc}
                  </span>
                )}
                <span className={`flex items-center gap-1 text-xs ${isExpired ? 'text-rose-400' : daysLeft <= 3 ? 'text-amber-400' : 'text-slate-400'}`}>
                  <Calendar className="w-3 h-3" />
                  {isExpired ? 'Expired' : `${daysLeft}d left`}
                </span>
                <span className="text-xs text-slate-500">Batch {job.batch_year}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {job.cgpa_cutoff && (
              <span className="badge badge-slate text-xs">CGPA ≥ {job.cgpa_cutoff}</span>
            )}
            <button
              id={`check-match-${job.id}`}
              onClick={checkMatch}
              disabled={loading}
              className="btn-primary text-xs py-1.5 px-3"
            >
              {loading ? <span className="spinner w-3 h-3" /> : expanded ? <ChevronUp className="w-3 h-3" /> : <BarChart2 className="w-3 h-3" />}
              {matchData ? (expanded ? 'Hide' : 'Show') : 'Check Match'}
            </button>
          </div>
        </div>

        {/* Eligible branches */}
        <div className="flex flex-wrap gap-1 mt-3">
          {job.eligible_branches.map(b => (
            <span key={b} className="badge badge-slate text-xs">{b}</span>
          ))}
        </div>
      </div>

      {/* Expanded match result */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/5"
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="spinner" />
              </div>
            ) : matchData ? (
              <div className="p-5 space-y-4">
                {/* Eligibility status */}
                <div className={`flex items-start gap-3 p-3 rounded-xl border ${
                  matchData.is_eligible
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-rose-500/10 border-rose-500/20'
                }`}>
                  {matchData.is_eligible
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    : <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  }
                  <div>
                    <p className={`font-semibold text-sm ${matchData.is_eligible ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {matchData.is_eligible ? 'You are eligible!' : 'Not eligible'}
                    </p>
                    {!matchData.is_eligible && (
                      <ul className="mt-1 space-y-0.5">
                        {matchData.ineligibility_reasons?.map((r, i) => (
                          <li key={i} className="text-xs text-slate-400">• {r.reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Skill match (only if eligible) */}
                {matchData.is_eligible && matchData.match_score !== null && (
                  <>
                    <MatchScoreBar score={matchData.match_score} />

                    <div className="grid grid-cols-2 gap-4">
                      {/* Matched skills */}
                      {matchData.matched_skills?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Matched
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {matchData.matched_skills.map(s => (
                              <span key={s} className="badge badge-emerald">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing skills */}
                      {matchData.missing_skills?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-400" /> To improve
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {matchData.missing_skills.map(s => (
                              <span key={s} className="badge badge-rose">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {matchData.missing_skills?.length > 0 && (
                      <Link
                        to="/roadmap"
                        className="btn-secondary text-xs py-1.5 inline-flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                        Build these skills in your roadmap
                      </Link>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function MatchDashboard() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => client.get('/jobs').then(r => r.data),
  })

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => client.get('/resume/history').then(r => r.data),
  })
  const hasResume = resumes.length > 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title">Match Dashboard</h1>
        <p className="text-slate-400 mt-1">Check your eligibility and skill match for every active placement drive</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="spinner scale-150" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-400">No active drives</p>
          <p className="text-sm mt-1">Check back when the placement cell posts new opportunities</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">{jobs.length} active drive{jobs.length !== 1 ? 's' : ''} — click "Check Match" on any card</p>
          {!hasResume && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                You haven't uploaded a resume yet.{' '}
                <Link to="/resume" className="font-semibold underline underline-offset-2">Upload one</Link>
                {' '}before checking your match.
              </p>
            </div>
          )}
          {jobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  )
}

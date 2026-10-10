import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Building2, Calendar, DollarSign, ArrowUpRight, AlertTriangle,
  Sparkles, ShieldCheck, Zap, Bot, BookOpen
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import client from '../../api/client'

function MatchScoreBar({ score }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
  const textColor = score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-rose-500'

  return (
    <div className="space-y-1.5 card p-3.5 rounded-xl">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          <Zap className="w-3.5 h-3.5 text-cyan-500" />
          Semantic Skill Match Compatibility
        </span>
        <span className={`font-extrabold text-sm ${textColor}`}>
          {score.toFixed(1)}%
        </span>
      </div>
      <div className="progress-bar-track h-2.5">
        <motion.div
          className={`progress-bar-fill ${color} h-2.5`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function JobCard({ job }) {
  const [expanded, setExpanded] = useState(false)
  const [matchData, setMatchData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanningStep, setScanningStep] = useState(null) // 'academic' | 'semantic'

  const checkMatch = async () => {
    if (matchData) {
      setExpanded(!expanded)
      return
    }

    setLoading(true)
    setExpanded(true)
    setScanningStep('academic')

    try {
      // Step 1: Ultra-fast instant academic criteria check (<1ms)
      const quickRes = await client.get(`/match/${job.id}/quick-eligibility`)
      const quick = quickRes.data

      // If already ineligible based on academic criteria, display immediately without waiting!
      if (!quick.is_eligible) {
        setMatchData({
          is_eligible: false,
          ineligibility_reasons: quick.ineligibility_reasons,
          match_score: null,
          matched_skills: [],
          missing_skills: [],
        })
        setLoading(false)
        setScanningStep(null)
        return
      }

      // Step 2: Eligible! Run full skill matching with pre-warmed AI model
      setScanningStep('semantic')
      const res = await client.get(`/match/${job.id}`)
      setMatchData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Eligibility check failed. Ensure academic profile is recorded.')
      setExpanded(false)
    } finally {
      setLoading(false)
      setScanningStep(null)
    }
  }

  const daysLeft = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24))
  const isExpired = daysLeft < 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden transition-all rounded-2xl p-0"
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{job.company_name}</p>
              <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">{job.role_title}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {job.ctc && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                    <DollarSign className="w-3 h-3" />{job.ctc}
                  </span>
                )}
                <span className={`flex items-center gap-1 text-xs font-medium ${isExpired ? 'text-rose-500' : daysLeft <= 3 ? 'text-amber-500' : 'text-slate-500'}`}>
                  <Calendar className="w-3 h-3" />
                  {isExpired ? 'Drive Closed' : `${daysLeft} days remaining`}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/5" style={{ background: 'var(--bg-deep)', color: 'var(--text-muted)' }}>
                  Batch {job.batch_year}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {job.cgpa_cutoff && (
              <span className="badge badge-slate text-xs font-semibold">Cutoff: CGPA ≥ {job.cgpa_cutoff}</span>
            )}
            <button
              id={`check-match-${job.id}`}
              onClick={checkMatch}
              disabled={loading}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-glow-purple"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              {loading ? (
                <span className="spinner w-3.5 h-3.5 border-top-color-white" />
              ) : matchData ? (
                expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {matchData ? (expanded ? 'Hide Match' : 'View Match') : 'Check Match'}
            </button>
          </div>
        </div>

        {/* Eligible branches */}
        <div className="flex flex-wrap gap-1.5 mt-3.5 items-center">
          <span className="text-[11px] font-medium mr-1" style={{ color: 'var(--text-muted)' }}>Eligible Branches:</span>
          {job.eligible_branches.map(b => (
            <span key={b} className="badge badge-indigo text-[11px] font-medium">{b}</span>
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
            className="border-t border-slate-200 dark:border-white/5"
            style={{ background: 'var(--bg-card2)' }}
          >
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center space-y-3">
                <div className="spinner scale-125" />
                <div className="text-center space-y-1">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {scanningStep === 'academic'
                      ? '⚡ Verifying Academic Eligibility (CGPA, Branch, Backlogs)...'
                      : '🧠 Calculating Semantic Skill Alignment with AI...'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Fast criteria evaluation running</p>
                </div>
              </div>
            ) : matchData ? (
              <div className="p-5 space-y-5">
                {/* Eligibility status */}
                <div className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${
                  matchData.is_eligible
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}>
                  {matchData.is_eligible ? (
                    <div className="p-1 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 mt-0.5">
                      <XCircle className="w-5 h-5" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className={`font-bold text-sm ${matchData.is_eligible ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                      {matchData.is_eligible ? 'You Meet All Academic Criteria & Are Eligible!' : 'Not Eligible for this Drive'}
                    </p>
                    {!matchData.is_eligible && (
                      <ul className="mt-1 space-y-1">
                        {matchData.ineligibility_reasons?.map((r, i) => (
                          <li key={i} className="text-xs text-rose-600 dark:text-rose-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {r.reason}
                          </li>
                        ))}
                      </ul>
                    )}
                    {matchData.is_eligible && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Your verified CGPA, branch, and backlog criteria fulfill the company requirements.
                      </p>
                    )}
                  </div>
                </div>

                {/* Skill match (only if eligible) */}
                {matchData.is_eligible && matchData.match_score !== null && (
                  <div className="space-y-4">
                    <MatchScoreBar score={matchData.match_score} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Matched skills */}
                      <div className="card p-4 rounded-xl space-y-2">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Matched Technical Skills ({matchData.matched_skills?.length || 0})
                        </p>
                        {matchData.matched_skills?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {matchData.matched_skills.map(s => (
                              <span key={s} className="badge badge-emerald text-xs">{s}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No specific direct keywords overlapping yet</p>
                        )}
                      </div>

                      {/* Missing skills */}
                      <div className="card p-4 rounded-xl space-y-2">
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          Missing Job Requirements ({matchData.missing_skills?.length || 0})
                        </p>
                        {matchData.missing_skills?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {matchData.missing_skills.map(s => (
                              <span key={s} className="badge badge-rose text-xs">{s}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 italic font-medium">Great match! No major skills missing.</p>
                        )}
                      </div>
                    </div>

                    {/* Quick navigation actions */}
                    {matchData.missing_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-1">
                        <Link
                          to="/roadmap"
                          className="btn-secondary text-xs py-2 px-3.5 inline-flex items-center gap-1.5 rounded-xl shadow-sm"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Add Missing Skills to Learning Roadmap</span>
                        </Link>
                        <Link
                          to="/chatbot"
                          className="btn-ghost text-xs py-2 px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-purple-500/40"
                        >
                          <Bot className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>Ask AI Interview Coach to Prepare for this Role</span>
                        </Link>
                      </div>
                    )}
                  </div>
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
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <span>Drive Match & Eligibility</span>
          <span className="badge badge-indigo text-xs font-semibold">Instant Evaluation</span>
        </h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Check real-time academic eligibility cutoffs and AI-powered semantic skill matches for all placement drives
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="spinner scale-150" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 card rounded-2xl p-10">
          <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>No active placement drives right now</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Check back when new company drives are published by the Placement Cell</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            {jobs.length} active drive{jobs.length !== 1 ? 's' : ''} available
          </p>

          {!hasResume && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-200">
                You haven't uploaded a resume yet.{' '}
                <Link to="/resume" className="font-bold underline underline-offset-2 text-amber-800 dark:text-amber-300">
                  Upload your resume
                </Link>
                {' '}to enable AI semantic skill matching.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

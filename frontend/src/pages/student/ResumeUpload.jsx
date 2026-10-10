import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Trash2, ChevronDown, ChevronUp, Award, Clock,
  Sparkles, CheckCircle2, ArrowRight, Copy, Check, AlertCircle, Plus,
  Wand2, Target, BarChart, Lightbulb
} from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'

// ─── Radial ATS Gauge ────────────────────────────────────────────────────────
function ATSGauge({ score }) {
  const r = 52
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (score / 100) * circumference
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e'
  const glow = score >= 75 ? 'rgba(16, 185, 129, 0.3)' : score >= 50 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(244, 63, 94, 0.3)'

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8" stroke="rgba(255,255,255,0.06)" />
        <motion.circle
          cx="60" cy="60" r={r}
          fill="none" strokeWidth="8"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
        />
      </svg>
      <div className="absolute text-center flex flex-col items-center">
        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-3xl font-black"
          style={{ color }}
        >
          {Math.round(score)}
        </motion.p>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">ATS Score</p>
      </div>
    </div>
  )
}

// ─── Breakdown accordion ─────────────────────────────────────────────────────
const BREAKDOWN_LABELS = {
  contact_info: 'Contact & Links',
  standard_sections: 'Standard Sections',
  parsability: 'Format Parsability',
  quantified_achievements: 'Quantified Metrics',
  action_verbs: 'Power Action Verbs',
  appropriate_length: 'Word Length Density',
  keyword_density: 'Tech Keyword Breadth',
  spelling: 'Spelling & Grammar',
}

const BREAKDOWN_MAX = {
  contact_info: 10, standard_sections: 15, parsability: 10,
  quantified_achievements: 20, action_verbs: 15,
  appropriate_length: 10, keyword_density: 10, spelling: 10,
}

function BreakdownRow({ label, score, max }) {
  const pct = (score / max) * 100
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-44 flex-shrink-0">{label}</span>
      <div className="flex-1 progress-bar-track">
        <motion.div
          className={`progress-bar-fill ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-slate-300 w-12 text-right font-mono">{score}/{max}</span>
    </div>
  )
}

// ─── AI Resume Optimizer & Suggestions Component ─────────────────────────────
function AIResumeOptimizer({ resumeId }) {
  const [copiedIndex, setCopiedIndex] = useState(null)

  const {
    data: aiData,
    isLoading,
    refetch,
    isRefetching,
    error,
  } = useQuery({
    queryKey: ['resume-ai-improve', resumeId],
    queryFn: () => client.post(`/resume/${resumeId}/ai-improve`).then(r => r.data),
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    enabled: false, // user clicks to generate
  })

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Improved bullet copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2500)
  }

  return (
    <div className="pt-4 border-t border-white/5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400">
            <Sparkles className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              AI Resume Optimizer & Skills Enhancer
              <span className="badge badge-purple text-[10px]">Powered by Nexus LLM</span>
            </h4>
            <p className="text-xs text-slate-400">
              Get targeted missing skills and STAR-format bullet rewrites to boost your ATS score
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="btn-primary text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-glow-purple"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          {isLoading || isRefetching ? (
            <>
              <span className="spinner w-3.5 h-3.5 border-top-color-white" />
              <span>Analyzing with AI...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              <span>{aiData ? 'Regenerate Suggestions' : '✨ Improve Resume with AI'}</span>
            </>
          )}
        </button>
      </div>

      {/* AI Results */}
      <AnimatePresence>
        {aiData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 bg-purple-950/20 border border-purple-500/20 p-5 rounded-2xl"
          >
            {/* Summary & Diagnosis */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/3 p-4 rounded-xl border border-white/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Domain Fit:</span>
                  <span className="badge badge-indigo text-xs font-bold">{aiData.target_role_fit}</span>
                  <span className="badge badge-emerald text-xs">{aiData.overall_rating}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {aiData.summary}
                </p>
              </div>
            </div>

            {/* High-Impact Missing Skills */}
            {aiData.missing_skills?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  High-Priority Missing Skills (Searched by ATS & Recruiters)
                </p>
                <p className="text-[11px] text-slate-400">
                  Adding these technologies to your skills section and project bullets significantly increases match percentage:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {aiData.missing_skills.map((skill, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        navigator.clipboard.writeText(skill)
                        toast.success(`Copied "${skill}" to clipboard!`)
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
                      title="Click to copy skill"
                    >
                      <Plus className="w-3 h-3 text-amber-400" />
                      {skill}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* STAR-Method Bullet Point Rewrites */}
            {aiData.bullet_rewrites?.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Bullet Point Transformations (Google XYZ & STAR Impact Formula)
                </p>
                <div className="space-y-3">
                  {aiData.bullet_rewrites.map((item, idx) => (
                    <div
                      key={idx}
                      className="glass p-4 rounded-xl border border-white/5 space-y-3 bg-slate-900/40"
                    >
                      {/* Original */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Before (Weak / Low Impact)
                        </span>
                        <p className="text-xs text-rose-300/80 line-through italic pl-2 border-l-2 border-rose-500/30">
                          {item.original}
                        </p>
                      </div>

                      {/* Improved */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            After (ATS-Optimized with Quantified Impact)
                          </span>
                          <button
                            onClick={() => copyToClipboard(item.improved, idx)}
                            className="btn-ghost py-1 px-2.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1 rounded-lg"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Bullet</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-100 font-medium pl-2 border-l-2 border-emerald-500 bg-emerald-500/5 p-2 rounded-r-lg leading-relaxed">
                          {item.improved}
                        </p>
                      </div>

                      {/* Impact Factor */}
                      {item.impact_factor && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                          <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          <span><strong className="text-slate-300">Why it scores higher:</strong> {item.impact_factor}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ATS Action Plan */}
            {aiData.ats_action_plan?.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  Step-by-Step ATS Score Booster Action Plan
                </p>
                <ul className="space-y-1.5 pl-1">
                  {aiData.ats_action_plan.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Resume card ─────────────────────────────────────────────────────────────
function ResumeCard({ resume, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  const atsScore = resume.ats_score || 0
  const qualityBadge = atsScore >= 75
    ? { label: 'High Compatibility', color: 'badge-emerald' }
    : atsScore >= 50
    ? { label: 'Moderate Compatibility', color: 'badge-amber' }
    : { label: 'Needs Optimization', color: 'badge-rose' }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass p-5 border border-white/5 hover:border-purple-500/20 transition-all rounded-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: file info */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-200 text-sm">{resume.file_name}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {new Date(resume.uploaded_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
              <span className={`badge ${qualityBadge.color} text-[10px]`}>
                {qualityBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Right: score + actions */}
        <div className="flex items-center gap-2">
          {resume.ats_score !== null && (
            <div className={`badge ${resume.ats_score >= 75 ? 'badge-emerald' : resume.ats_score >= 50 ? 'badge-amber' : 'badge-rose'} font-bold`}>
              <Award className="w-3.5 h-3.5 mr-1" />
              {Math.round(resume.ats_score)}/100
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 rounded-xl"
            title="Toggle details"
          >
            <span>{expanded ? 'Hide Details' : 'View ATS Audit'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onDelete(resume.id)}
            className="btn-ghost p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-xl"
            title="Delete resume"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded breakdown & AI Optimizer */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 pt-5 border-t border-white/5 space-y-6"
          >
            {/* Top Gauge & Stats */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
              <ATSGauge score={resume.ats_score || 0} />
              <div className="space-y-2 text-center md:text-left">
                <h4 className="text-base font-bold text-slate-100">
                  ATS Resume Quality Audit
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Evaluated using online ATS standard criteria: Contact parsability, section headers, quantifiable bullet metrics, action verbs, and keyword density.
                </p>
                <div className="flex items-center gap-2 justify-center md:justify-start pt-1">
                  <span className="badge badge-indigo text-xs">
                    {resume.extracted_skills?.length || 0} Tech Skills Extracted
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown Bars */}
            {resume.ats_breakdown && (
              <div className="space-y-2.5 max-w-xl mx-auto glass p-4 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-slate-300 mb-2">Category Score Breakdown</p>
                {Object.entries(resume.ats_breakdown).map(([key, val]) => (
                  <BreakdownRow
                    key={key}
                    label={BREAKDOWN_LABELS[key] || key}
                    score={val}
                    max={BREAKDOWN_MAX[key] || 10}
                  />
                ))}
              </div>
            )}

            {/* Detected Skills */}
            {resume.extracted_skills?.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-300 mb-2">Recognized Technical Skills ({resume.extracted_skills.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {resume.extracted_skills.map(s => (
                    <span key={s} className="badge badge-indigo text-xs">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* LLM Powered Resume Optimizer */}
            <AIResumeOptimizer resumeId={resume.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ResumeUpload() {
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => client.get('/resume/history').then(r => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData()
      fd.append('file', file)
      return client.post('/resume/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      toast.success('Resume parsed and ATS score generated!')
      qc.invalidateQueries({ queryKey: ['resumes'] })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Upload failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/resume/${id}`),
    onSuccess: () => {
      toast.success('Resume deleted')
      qc.invalidateQueries({ queryKey: ['resumes'] })
    },
    onError: () => toast.error('Delete failed'),
  })

  const handleFile = useCallback((file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      toast.error('Please upload a PDF or DOCX file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)')
      return
    }
    uploadMutation.mutate(file)
  }, [uploadMutation])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }, [handleFile])

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <span>Resume & Online ATS Scorer</span>
          <span className="badge badge-purple text-xs flex items-center gap-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            AI Optimizer
          </span>
        </h1>
        <p className="text-slate-400 mt-1">
          Upload your resume for instant ATS scoring, keyword analysis, and LLM-driven skill recommendations
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          dragging
            ? 'border-indigo-500 bg-indigo-500/10 shadow-glow-indigo'
            : 'border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-300 text-sm font-semibold">Analyzing resume & computing ATS metrics…</p>
            <p className="text-slate-500 text-xs">Checking sections, keywords, and action verbs</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-4">
              <Upload className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="font-semibold text-slate-200">Drag & drop your resume here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse — PDF or DOCX (max 5MB)</p>
          </>
        )}
      </div>

      {/* History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Upload History ({resumes.length})</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : resumes.length === 0 ? (
          <div className="card text-center py-12 text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No resumes uploaded yet</p>
            <p className="text-xs text-slate-600 mt-1">Upload your latest PDF/DOCX to get your score</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {resumes.map((r) => (
                <ResumeCard
                  key={r.id}
                  resume={r}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Trash2, ChevronDown, ChevronUp, Award, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'

// ─── Radial ATS Gauge ────────────────────────────────────────────────────────
function ATSGauge({ score }) {
  const r = 52
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (score / 100) * circumference
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e'

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8" stroke="rgba(0,0,0,0.06)" />
        <motion.circle
          cx="60" cy="60" r={r}
          fill="none" strokeWidth="8"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold" style={{ color }}>{Math.round(score)}</p>
        <p className="text-xs text-slate-500">/ 100</p>
      </div>
    </div>
  )
}

// ─── Breakdown accordion ─────────────────────────────────────────────────────
const BREAKDOWN_LABELS = {
  contact_info: 'Contact Info',
  standard_sections: 'Standard Sections',
  parsability: 'Parsability',
  quantified_achievements: 'Quantified Achievements',
  action_verbs: 'Action Verbs',
  appropriate_length: 'Length',
  keyword_density: 'Keyword Density',
  spelling: 'Spelling',
}

const BREAKDOWN_MAX = {
  contact_info: 10, standard_sections: 15, parsability: 10,
  quantified_achievements: 20, action_verbs: 10,
  appropriate_length: 10, keyword_density: 15, spelling: 10,
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
      <span className="text-xs text-slate-300 w-12 text-right">{score}/{max}</span>
    </div>
  )
}

// ─── Resume card ─────────────────────────────────────────────────────────────
function ResumeCard({ resume, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass p-5"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: file info */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="font-medium text-slate-200 text-sm">{resume.file_name}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {new Date(resume.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right: score + actions */}
        <div className="flex items-center gap-3">
          {resume.ats_score !== null && (
            <div className={`badge ${resume.ats_score >= 75 ? 'badge-emerald' : resume.ats_score >= 50 ? 'badge-amber' : 'badge-rose'}`}>
              <Award className="w-3 h-3 mr-1" />
              {Math.round(resume.ats_score)}/100
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-ghost p-1.5"
            title="Toggle details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(resume.id)}
            className="btn-ghost p-1.5 text-rose-400 hover:bg-rose-500/10"
            title="Delete resume"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded breakdown */}
      <AnimatePresence>
        {expanded && resume.ats_breakdown && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/5 space-y-2.5"
          >
            <div className="flex items-center justify-center mb-4">
              <ATSGauge score={resume.ats_score} />
            </div>
            {Object.entries(resume.ats_breakdown).map(([key, val]) => (
              <BreakdownRow
                key={key}
                label={BREAKDOWN_LABELS[key] || key}
                score={val}
                max={BREAKDOWN_MAX[key] || 10}
              />
            ))}
            {/* Skills */}
            {resume.extracted_skills?.length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <p className="text-xs text-slate-400 mb-2">Detected Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {resume.extracted_skills.map(s => (
                    <span key={s} className="badge badge-indigo">{s}</span>
                  ))}
                </div>
              </div>
            )}
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
      toast.success('Resume uploaded and scored!')
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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title">Resume & ATS Scorer</h1>
        <p className="text-slate-400 mt-1">Upload your resume to get an instant ATS quality score and detailed feedback</p>
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
            <p className="text-slate-400 text-sm">Parsing and scoring…</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-4">
              <Upload className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="font-semibold text-slate-200">Drag & drop your resume here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse — PDF, DOCX (max 5MB)</p>
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
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No resumes uploaded yet</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
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

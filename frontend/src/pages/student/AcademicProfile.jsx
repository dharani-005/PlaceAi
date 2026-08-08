import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Save, User, BookOpen, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'

const BRANCHES = [
  'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM',
  'AI/ML', 'DS', 'AIDS', 'IOT', 'CSBS', 'Other',
]

export default function AcademicProfile() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ cgpa: '', backlog_count: 0, branch: '', batch_year: new Date().getFullYear() })
  const [saved, setSaved] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => client.get('/profile').then(r => r.data).catch(() => null),
  })

  useEffect(() => {
    if (profile) {
      setForm({
        cgpa: profile.cgpa,
        backlog_count: profile.backlog_count,
        branch: profile.branch,
        batch_year: profile.batch_year,
      })
    }
  }, [profile])

  const saveMutation = useMutation({
    mutationFn: (data) => client.put('/profile', data),
    onSuccess: () => {
      toast.success('Academic profile saved!')
      qc.invalidateQueries({ queryKey: ['profile'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Save failed'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const cgpa = parseFloat(form.cgpa)
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      toast.error('CGPA must be between 0 and 10')
      return
    }
    saveMutation.mutate({ ...form, cgpa })
  }

  const cgpaVal = parseFloat(form.cgpa) || 0
  const cgpaColor = cgpaVal >= 8 ? 'text-emerald-400' : cgpaVal >= 6.5 ? 'text-amber-400' : 'text-rose-400'

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Academic Profile</h1>
        <p className="text-slate-400 mt-1">This data is used for accurate eligibility checks — enter your actual details</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-300">
          Eligibility checks use this profile, not your resume text. Enter accurate values — including any backlogs — so the results are trustworthy.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* CGPA */}
        <div>
          <label className="label">
            <GraduationCap className="w-4 h-4 inline mr-1" />
            CGPA (out of 10)
          </label>
          <div className="flex items-center gap-4">
            <input
              id="cgpa"
              type="number"
              step="0.01"
              min="0"
              max="10"
              className="input max-w-xs"
              placeholder="e.g. 8.25"
              value={form.cgpa}
              onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
              required
            />
            {form.cgpa && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-2xl font-bold ${cgpaColor}`}
              >
                {parseFloat(form.cgpa).toFixed(2)}
              </motion.span>
            )}
          </div>
          {/* CGPA visual bar */}
          <div className="mt-2 progress-bar-track max-w-xs">
            <motion.div
              className={`progress-bar-fill ${cgpaVal >= 8 ? 'bg-emerald-500' : cgpaVal >= 6.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
              animate={{ width: `${(cgpaVal / 10) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Backlogs */}
        <div>
          <label className="label">
            <BookOpen className="w-4 h-4 inline mr-1" />
            Active Backlogs
          </label>
          <div className="flex items-center gap-3">
            {[0, 1, 2, 3, '4+'].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm({ ...form, backlog_count: typeof n === 'number' ? n : 4 })}
                className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-all ${
                  form.backlog_count === (typeof n === 'number' ? n : 4)
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {form.backlog_count > 0 && (
            <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Backlog restrictions apply to some drives
            </p>
          )}
        </div>

        {/* Branch */}
        <div>
          <label className="label">
            <User className="w-4 h-4 inline mr-1" />
            Branch / Department
          </label>
          <select
            id="branch"
            className="input"
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
            required
          >
            <option value="">Select your branch…</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Batch year */}
        <div>
          <label className="label">Graduating Batch Year</label>
          <input
            id="batch_year"
            type="number"
            min="2020"
            max="2030"
            className="input max-w-xs"
            value={form.batch_year}
            onChange={(e) => setForm({ ...form, batch_year: parseInt(e.target.value) })}
            required
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            id="save-profile"
            type="submit"
            disabled={saveMutation.isPending}
            className="btn-primary"
          >
            {saveMutation.isPending ? <span className="spinner" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-sm text-emerald-400"
            >
              <CheckCircle2 className="w-4 h-4" />
              Saved!
            </motion.span>
          )}
        </div>
      </form>
    </div>
  )
}

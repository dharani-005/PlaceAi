import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Save, ArrowLeft, Plus, Trash2, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'AI/ML', 'DS', 'AIDS', 'IOT', 'CSBS']

const EMPTY_FORM = {
  company_name: '',
  role_title: '',
  eligible_branches: [],
  batch_year: new Date().getFullYear(),
  cgpa_cutoff: '',
  backlog_allowed: 0,
  ctc: '',
  interview_rounds: [],
  deadline: '',
  requirements_text: '',
  is_active: true,
}

export default function JobForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: existing } = useQuery({
    queryKey: ['job', id],
    queryFn: () => client.get(`/jobs/${id}`).then(r => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        ...existing,
        cgpa_cutoff: existing.cgpa_cutoff ?? '',
        deadline: existing.deadline?.slice(0, 10) || '',
      })
    }
  }, [existing])

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? client.put(`/jobs/${id}`, data) : client.post('/jobs', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Job updated!' : 'Job posted!')
      navigate('/admin/jobs')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Save failed'),
  })

  const toggleBranch = (b) => {
    setForm(f => ({
      ...f,
      eligible_branches: f.eligible_branches.includes(b)
        ? f.eligible_branches.filter(x => x !== b)
        : [...f.eligible_branches, b],
    }))
  }

  const addRound = () => {
    setForm(f => ({
      ...f,
      interview_rounds: [
        ...f.interview_rounds,
        { round_number: f.interview_rounds.length + 1, round_type: '', description: '' },
      ],
    }))
  }

  const removeRound = (i) => {
    setForm(f => ({ ...f, interview_rounds: f.interview_rounds.filter((_, idx) => idx !== i) }))
  }

  const updateRound = (i, field, value) => {
    setForm(f => ({
      ...f,
      interview_rounds: f.interview_rounds.map((r, idx) => idx === i ? { ...r, [field]: value } : r),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.eligible_branches.length === 0) {
      toast.error('Select at least one eligible branch')
      return
    }
    const payload = {
      ...form,
      cgpa_cutoff: form.cgpa_cutoff === '' ? null : parseFloat(form.cgpa_cutoff),
      backlog_allowed: parseInt(form.backlog_allowed),
    }
    saveMutation.mutate(payload)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Job Posting' : 'Post New Job'}</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Fill in all details — students will see this in their match dashboard</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Company Info */}
        <div className="card space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            Company Info
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name</label>
              <input id="company_name" className="input" placeholder="e.g. TCS" value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Role Title</label>
              <input id="role_title" className="input" placeholder="e.g. Software Engineer" value={form.role_title}
                onChange={e => setForm({ ...form, role_title: e.target.value })} required />
            </div>
            <div>
              <label className="label">CTC / Stipend</label>
              <input id="ctc" className="input" placeholder="e.g. 6 LPA" value={form.ctc}
                onChange={e => setForm({ ...form, ctc: e.target.value })} />
            </div>
            <div>
              <label className="label">Application Deadline</label>
              <input id="deadline" type="date" className="input" value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })} required />
            </div>
          </div>
        </div>

        {/* Section 2: Eligibility Criteria */}
        <div className="card space-y-4">
          <h2 className="section-title">Eligibility Criteria</h2>

          {/* Branches */}
          <div>
            <label className="label">Eligible Branches (select all that apply)</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {BRANCHES.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBranch(b)}
                  className={`badge cursor-pointer transition-all ${
                    form.eligible_branches.includes(b) ? 'badge-indigo' : 'badge-slate hover:border-white/20'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Batch Year</label>
              <input id="batch_year" type="number" min="2020" max="2030" className="input"
                value={form.batch_year}
                onChange={e => setForm({ ...form, batch_year: parseInt(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Minimum CGPA (optional)</label>
              <input id="cgpa_cutoff" type="number" step="0.1" min="0" max="10" className="input"
                placeholder="No cutoff"
                value={form.cgpa_cutoff}
                onChange={e => setForm({ ...form, cgpa_cutoff: e.target.value })} />
            </div>
            <div>
              <label className="label">Max Backlogs Allowed</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, backlog_allowed: n })}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-all ${
                      form.backlog_allowed === n
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                        : 'border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Interview Rounds */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Interview Rounds</h2>
            <button type="button" onClick={addRound} className="btn-ghost text-xs">
              <Plus className="w-3 h-3" /> Add Round
            </button>
          </div>
          {form.interview_rounds.length === 0 ? (
            <p className="text-sm text-slate-500">No rounds added yet</p>
          ) : (
            <div className="space-y-3">
              {form.interview_rounds.map((round, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 items-start"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs text-indigo-400 font-bold flex-shrink-0 mt-2">
                    {i + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      className="input"
                      placeholder="Round type (e.g. Technical)"
                      value={round.round_type}
                      onChange={e => updateRound(i, 'round_type', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Description (optional)"
                      value={round.description}
                      onChange={e => updateRound(i, 'description', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRound(i)}
                    className="btn-ghost p-2 text-rose-400 hover:bg-rose-500/10 mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Requirements */}
        <div className="card">
          <label className="label">
            Job Requirements / Description
            <span className="text-slate-500 font-normal ml-1">(used for skill matching)</span>
          </label>
          <textarea
            id="requirements_text"
            className="input min-h-40 resize-none"
            placeholder="Describe required skills, experience, responsibilities, and any other requirements..."
            value={form.requirements_text}
            onChange={e => setForm({ ...form, requirements_text: e.target.value })}
            required
          />
          <p className="text-xs text-slate-500 mt-2">Write clearly — this text is analysed by AI to match candidates' skills</p>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            id="save-job"
            type="submit"
            disabled={saveMutation.isPending}
            className="btn-primary"
          >
            {saveMutation.isPending ? <span className="spinner" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Save Changes' : 'Post Job'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

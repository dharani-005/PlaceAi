import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Users, Calendar, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'

export default function JobList() {
  const qc = useQueryClient()

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => client.get('/jobs').then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/jobs/${id}`),
    onSuccess: () => {
      toast.success('Job deleted')
      qc.invalidateQueries({ queryKey: ['admin-jobs'] })
    },
    onError: () => toast.error('Delete failed'),
  })

  const handleDelete = (job) => {
    if (window.confirm(`Delete "${job.role_title}" at ${job.company_name}?`)) {
      deleteMutation.mutate(job.id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Job Postings</h1>
          <p className="text-slate-400 mt-1">{jobs.length} drive{jobs.length !== 1 ? 's' : ''} posted</p>
        </div>
        <Link to="/admin/jobs/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Post New Job
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="spinner scale-150" /></div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-16 text-slate-500">
          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-400">No job postings yet</p>
          <Link to="/admin/jobs/new" className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" /> Create First Posting
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => {
            const days = Math.ceil((new Date(job.deadline) - new Date()) / 86400000)
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-200">{job.company_name}</p>
                    <span className={`badge ${job.is_active ? 'badge-emerald' : 'badge-slate'}`}>
                      {job.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-indigo-400 mt-0.5">{job.role_title}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {job.ctc && <span className="text-xs text-emerald-400">{job.ctc}</span>}
                    <span className={`text-xs ${days < 0 ? 'text-rose-400' : days <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {days < 0 ? 'Expired' : `${days}d left — ${new Date(job.deadline).toLocaleDateString('en-IN')}`}
                    </span>
                    {job.cgpa_cutoff && <span className="text-xs text-slate-400">CGPA ≥ {job.cgpa_cutoff}</span>}
                    <span className="text-xs text-slate-500">Batch {job.batch_year}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.eligible_branches.map(b => (
                      <span key={b} className="badge badge-slate text-xs">{b}</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/admin/jobs/${job.id}/candidates`}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <Users className="w-3 h-3" />
                    Candidates
                  </Link>
                  <Link
                    to={`/admin/jobs/${job.id}/edit`}
                    className="btn-ghost text-xs py-1.5 px-2"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(job)}
                    className="btn-ghost text-xs py-1.5 px-2 text-rose-400 hover:bg-rose-500/10"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

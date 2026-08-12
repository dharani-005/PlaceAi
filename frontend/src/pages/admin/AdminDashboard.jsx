import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Briefcase, Users, Calendar, ArrowRight, PlusCircle, TrendingUp } from 'lucide-react'
import client from '../../api/client'

export default function AdminDashboard() {
  const { data: jobs = [] } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => client.get('/jobs').then(r => r.data),
  })

  const activeJobs = jobs  // all returned jobs are active (API filters server-side)
  const soonDeadline = activeJobs.filter(j => {
    const days = Math.ceil((new Date(j.deadline) - new Date()) / 86400000)
    return days >= 0 && days <= 7
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Placement Cell Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage job drives and track candidate matches</p>
        </div>
        <Link to="/admin/jobs/new" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Post New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Drives', value: activeJobs.length, icon: Briefcase, color: 'indigo' },
          { label: 'Closing in 7 days', value: soonDeadline.length, icon: Calendar, color: 'amber' },
          { label: 'Open Drives', value: jobs.length, icon: TrendingUp, color: 'emerald' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card"
          >
            <div className={`inline-flex p-2 rounded-xl mb-3 ${
              stat.color === 'indigo' ? 'bg-indigo-500/15 text-indigo-400'
              : stat.color === 'amber' ? 'bg-amber-500/15 text-amber-400'
              : 'bg-emerald-500/15 text-emerald-400'
            }`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent drives */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Active Drives</h2>
          <Link to="/admin/jobs" className="btn-ghost text-xs">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>

        {activeJobs.length === 0 ? (
          <div className="card text-center py-12 text-slate-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No active drives yet</p>
            <Link to="/admin/jobs/new" className="btn-primary mt-4 inline-flex">
              <PlusCircle className="w-4 h-4" /> Post First Job
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobs.slice(0, 5).map((job, i) => {
              const days = Math.ceil((new Date(job.deadline) - new Date()) / 86400000)
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-200">{job.company_name}</p>
                    <p className="text-sm text-indigo-400">{job.role_title}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {job.ctc && <span className="badge badge-emerald text-xs">{job.ctc}</span>}
                      <span className={`badge text-xs ${days <= 3 ? 'badge-rose' : days <= 7 ? 'badge-amber' : 'badge-slate'}`}>
                        {days < 0 ? 'Expired' : `${days}d left`}
                      </span>
                      <span className="text-xs text-slate-500">{job.eligible_branches.join(', ')}</span>
                    </div>
                  </div>
                  <Link
                    to={`/admin/jobs/${job.id}/candidates`}
                    className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
                  >
                    <Users className="w-3 h-3" />
                    Candidates
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

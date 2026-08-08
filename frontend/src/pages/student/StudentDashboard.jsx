import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FileText, User, Map, BarChart2, MessageSquare, ArrowRight, TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import client from '../../api/client'

const features = [
  { to: '/resume', icon: FileText, label: 'Resume & ATS', desc: 'Upload resume, get instant score', color: 'indigo' },
  { to: '/profile', icon: User, label: 'Academic Profile', desc: 'Set your CGPA & branch', color: 'emerald' },
  { to: '/roadmap', icon: Map, label: 'Role Roadmap', desc: 'Get a personalised learning path', color: 'amber' },
  { to: '/match', icon: BarChart2, label: 'Match Dashboard', desc: 'Check eligibility for all drives', color: 'rose' },
  { to: '/chatbot', icon: MessageSquare, label: 'Interview Prep', desc: 'Practice with AI mock interviews', color: 'indigo' },
]

const colorMap = {
  indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  rose: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
}

export default function StudentDashboard() {
  const { user } = useAuth()

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => client.get('/resume/history').then(r => r.data),
  })

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => client.get('/profile').then(r => r.data).catch(() => null),
  })

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => client.get('/jobs').then(r => r.data),
  })

  const { data: roadmap } = useQuery({
    queryKey: ['roadmap'],
    queryFn: () => client.get('/roadmap').then(r => r.data).catch(() => null),
  })

  const latestResume = resumes?.[0]
  const completedItems = roadmap?.progress?.filter(p => p.status === 'completed').length || 0
  const totalItems = roadmap?.items?.length || 0
  const progressPct = totalItems ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-400 mt-1">Your placement journey at a glance</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ATS Score', value: latestResume ? `${latestResume.ats_score?.toFixed(0)}/100` : '—', sub: 'Latest resume', color: 'indigo' },
          { label: 'CGPA', value: profile?.cgpa?.toFixed(2) || '—', sub: profile?.branch || 'Not set', color: 'emerald' },
          { label: 'Active Drives', value: jobs?.length ?? '—', sub: 'Open right now', color: 'amber' },
          { label: 'Roadmap', value: totalItems ? `${progressPct}%` : '—', sub: `${completedItems}/${totalItems} completed`, color: 'rose' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wide">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color === 'indigo' ? 'text-indigo-400' : stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>
              {stat.value}
            </p>
            <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick access */}
      <div>
        <h2 className="section-title mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ to, icon: Icon, label, desc, color }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
            >
              <Link
                to={to}
                className="card group flex items-start gap-4 hover:border-indigo-500/30 hover:shadow-glow-indigo"
              >
                <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all mt-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Resume score progress */}
      {resumes && resumes.length > 1 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h2 className="section-title">ATS Score Progress</h2>
          </div>
          <div className="flex items-end gap-2 h-16">
            {resumes.slice(0, 8).reverse().map((r, i) => (
              <div key={r.id} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full bg-indigo-500/20 rounded-t-sm transition-all duration-500"
                  style={{ height: `${(r.ats_score / 100) * 56}px`, background: `rgba(99,102,241,${0.3 + (r.ats_score / 100) * 0.7})` }}
                />
                <span className="text-xs text-slate-500">{r.ats_score?.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

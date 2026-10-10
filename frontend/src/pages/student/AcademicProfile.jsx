import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  GraduationCap, BookOpen, Calendar, ShieldCheck,
  AlertTriangle, Lock, Award, CheckCircle2, Building, RefreshCw
} from 'lucide-react'
import client from '../../api/client'

export default function AcademicProfile() {
  const { data: profile, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['profile'],
    queryFn: () => client.get('/profile').then(r => r.data).catch(() => null),
  })

  const cgpaVal = profile?.cgpa || 0
  const cgpaColor = cgpaVal >= 8 ? 'text-emerald-400' : cgpaVal >= 6.5 ? 'text-amber-400' : 'text-rose-400'
  const cgpaBadge = cgpaVal >= 8 ? 'First Class with Distinction' : cgpaVal >= 6.5 ? 'First Class' : 'Second Class'

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <span>Academic Profile</span>
            <span className="badge badge-emerald text-xs flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Official Record
            </span>
          </h1>
          <p className="text-slate-400 mt-1">
            Verified academic credentials used to determine your placement drive eligibility
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-ghost text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Lock Notice Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3.5 shadow-sm"
      >
        <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 flex-shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-1">
          <p className="font-semibold text-indigo-200">
            Managed Solely by Placement Cell Administration
          </p>
          <p className="text-indigo-300/80 leading-relaxed">
            For academic integrity, students cannot directly edit their CGPA, branch, or backlog count.
            Drive eligibility filters automatically query this record.
            If your marks have updated or you spot a discrepancy, contact your department placement coordinator for verification.
          </p>
        </div>
      </motion.div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <div className="spinner scale-125" />
        </div>
      ) : !profile ? (
        /* Unconfigured profile state */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-10 text-center rounded-2xl border border-white/5 space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-100">No Academic Profile Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The placement administration has not yet recorded your verified CGPA, branch, and backlog details.
              Please reach out to the Placement Cell Admin to publish your official profile so you can check eligibility for upcoming recruitment drives.
            </p>
          </div>
        </motion.div>
      ) : (
        /* Verified Profile Display */
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CGPA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  Cumulative CGPA
                </span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">Scale of 10</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-extrabold ${cgpaColor}`}>
                  {profile.cgpa.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">/ 10.0</span>
              </div>
              <div className="mt-3 progress-bar-track">
                <motion.div
                  className={`progress-bar-fill ${cgpaVal >= 8 ? 'bg-emerald-500' : cgpaVal >= 6.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(cgpaVal / 10) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">{cgpaBadge}</p>
            </motion.div>

            {/* Backlogs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-5 rounded-2xl border border-white/5"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-rose-400" />
                  Active Backlogs
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-extrabold ${profile.backlog_count === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {profile.backlog_count}
                </span>
                <span className="text-xs text-slate-500">standing</span>
              </div>
              <div className="mt-4">
                {profile.backlog_count === 0 ? (
                  <span className="badge badge-emerald text-[11px] flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3 h-3" />
                    All Cleared (No Backlogs)
                  </span>
                ) : (
                  <span className="badge badge-rose text-[11px] flex items-center gap-1 w-fit">
                    <AlertTriangle className="w-3 h-3" />
                    {profile.backlog_count} Standing Backlog(s)
                  </span>
                )}
              </div>
            </motion.div>

            {/* Branch */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass p-5 rounded-2xl border border-white/5"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-cyan-400" />
                  Branch
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-100 truncate" title={profile.branch}>
                {profile.branch}
              </p>
              <p className="text-xs text-slate-500 mt-4">Engineering Specialization</p>
            </motion.div>

            {/* Batch Year */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-5 rounded-2xl border border-white/5"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Batch Year
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-100">
                {profile.batch_year}
              </p>
              <p className="text-xs text-slate-500 mt-4">Graduation Class</p>
            </motion.div>
          </div>

          {/* Official Verification Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass p-6 rounded-2xl border border-white/5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Placement Cell Institutional Verification</h3>
                  <p className="text-xs text-slate-400">Official College Placement Cell Record</p>
                </div>
              </div>
              <span className="badge badge-emerald text-xs">Status: Verified</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="p-3.5 rounded-xl bg-white/2 border border-white/5">
                <span className="text-slate-400 block mb-1">Campus Placement Eligibility:</span>
                <span className="text-slate-200 font-medium">
                  {profile.backlog_count === 0 && profile.cgpa >= 7.0
                    ? 'Eligible for Dream & Super-Dream campus recruitment drives'
                    : profile.backlog_count === 0
                    ? 'Eligible for standard campus placement drives'
                    : 'Eligibility depends on company backlog threshold allowances'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/2 border border-white/5">
                <span className="text-slate-400 block mb-1">Last Admin Record Update:</span>
                <span className="text-slate-200 font-medium">
                  {profile.updated_at
                    ? new Date(profile.updated_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Initial Placement Enrolment'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

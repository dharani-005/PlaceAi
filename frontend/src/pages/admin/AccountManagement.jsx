import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Trash2, Shield, User, X, Calendar,
  Mail, Check, GraduationCap, UserPlus, KeyRound
} from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const BRANCHES = [
  'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM',
  'AI/ML', 'DS', 'AIDS', 'IOT', 'CSBS', 'Other',
]

export default function AccountManagement() {
  const qc = useQueryClient()
  const { user: currentAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('') // '' | 'student' | 'admin'

  // Modals state
  const [addAdminOpen, setAddAdminOpen] = useState(false)
  const [academicStudent, setAcademicStudent] = useState(null)
  const [passwordAccount, setPasswordAccount] = useState(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch, roleFilter],
    queryFn: () => client.get('/admin/users', {
      params: {
        search: debouncedSearch || undefined,
        role: roleFilter || undefined
      }
    }).then(r => r.data)
  })

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: (data) => client.post('/admin/admins', data),
    onSuccess: (res) => {
      toast.success(`Admin account for ${res.data.full_name} created successfully!`)
      setAddAdminOpen(false)
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err) => {
      const errMsg = err.response?.data?.detail || 'Failed to create admin account'
      toast.error(errMsg)
    }
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ account, password }) => client.put(`/admin/users/${account.id}`, {
      full_name: account.full_name,
      email: account.email,
      role: account.role,
      password,
    }),
    onSuccess: (_, { account }) => {
      toast.success(`Password updated for ${account.full_name}`)
      setPasswordAccount(null)
    },
    onError: (err) => {
      const errMsg = err.response?.data?.detail || 'Failed to update account password'
      toast.error(errMsg)
    }
  })

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (userId) => client.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      toast.success('User account deleted successfully')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err) => {
      const errMsg = err.response?.data?.detail || 'Failed to delete user'
      toast.error(errMsg)
    }
  })

  const handleDelete = (user) => {
    const warning = user.role === 'admin'
      ? `Are you sure you want to delete administrator "${user.full_name}"?`
      : `Are you sure you want to delete student "${user.full_name}"? This will permanently delete all associated resumes, roadmap progress, and matching records.`

    if (window.confirm(warning)) {
      deleteMutation.mutate(user.id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Manage Accounts & Academic Records</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Manage account access, review official academic records, and administer student and staff accounts
          </p>
        </div>
        <button
          onClick={() => setAddAdminOpen(true)}
          className="btn-primary text-xs sm:text-sm flex items-center gap-2 self-start sm:self-auto py-2.5 px-4 shadow-glow-purple"
        >
          <UserPlus className="w-4 h-4 text-cyan-300" />
          <span>Add Admin</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 glass p-3.5 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search accounts by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs / Filter Buttons */}
        <div className="flex gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-white/10 self-start md:self-auto" style={{ background: 'var(--bg-deep)' }}>
          {[
            { value: '', label: 'All Accounts' },
            { value: 'student', label: 'Students' },
            { value: 'admin', label: 'Admins' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === tab.value
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="spinner scale-150" />
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-16">
          <User className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>No matching accounts found</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Try resetting your search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u, i) => {
            const isSelf = currentAdmin && (u.id === currentAdmin.user_id || u.id === currentAdmin.id)
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`card p-5 flex flex-col justify-between transition-all duration-300 min-h-[12rem] ${
                  isSelf
                    ? 'border-cyan-500/50 shadow-glow-cyan'
                    : 'hover:border-purple-500/30 hover:shadow-glow-purple'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`p-2 rounded-xl ${
                        u.role === 'admin'
                          ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/25'
                          : 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/25'
                      }`}>
                        {u.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </span>
                      <h3 className="font-bold truncate text-sm" style={{ color: 'var(--text-primary)' }} title={u.full_name}>
                        {u.full_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {isSelf && (
                        <span className="badge badge-emerald text-[9px] uppercase font-bold">You</span>
                      )}
                      <span className={`badge text-[10px] uppercase font-bold tracking-wider ${
                        u.role === 'admin' ? 'badge-cyan' : 'badge-purple'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : 'Student'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <span className="truncate font-mono text-[11px]" title={u.email}>{u.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-muted)' }}>Joined: {new Date(u.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 border-t border-slate-200 dark:border-white/10 pt-3 mt-3">
                  {u.role === 'student' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAcademicStudent(u)}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Academic Profile</span>
                      </button>
                      <button
                        onClick={() => setPasswordAccount(u)}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Set Password</span>
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 flex items-center justify-center transition-colors"
                        title="Delete Student Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Placement Administrator</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPasswordAccount(u)}
                          className="py-1.5 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Set Password</span>
                        </button>
                        {!isSelf && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xs flex items-center gap-1 transition-colors"
                          title="Delete Admin Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Admin Modal */}
      <AnimatePresence>
        {addAdminOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddAdminOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl space-y-4"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-h)' }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <UserPlus className="w-5 h-5 text-cyan-500" />
                  Add New Administrator
                </h3>
                <button
                  onClick={() => setAddAdminOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AddAdminForm
                onSubmit={(data) => createAdminMutation.mutate(data)}
                loading={createAdminMutation.isPending}
                onCancel={() => setAddAdminOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Password Modal */}
      <AnimatePresence>
        {passwordAccount && (
          <AccountPasswordModal
            account={passwordAccount}
            loading={changePasswordMutation.isPending}
            onClose={() =>             setPasswordAccount((current) => current?.id === account.id ? null : current)}
            onSubmit={(password) => changePasswordMutation.mutate({ account: passwordAccount, password })}
          />
        )}
      </AnimatePresence>

      {/* Student Academic Profile Modal (Admin Editor) */}
      <AnimatePresence>
        {academicStudent && (
          <StudentAcademicModal
            student={academicStudent}
            onClose={() => setAcademicStudent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AccountPasswordModal({ account, loading, onClose, onSubmit }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const newPassword = password.trim()

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword.trim()) {
      toast.error('Password and confirmation do not match')
      return
    }

    onSubmit(newPassword)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl space-y-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-h)' }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <KeyRound className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Set Account Password
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Update credentials for <strong style={{ color: 'var(--text-primary)' }}>{account.full_name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close password dialog"
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Enter a new password of at least 6 characters. This takes effect the next time the account signs in.
          </p>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="flex gap-3 border-t border-slate-200 dark:border-white/10 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center text-xs">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center text-xs">
              {loading ? <span className="spinner w-4 h-4 border-top-color-white" /> : 'Update Password'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function AddAdminForm({ onSubmit, loading, onCancel }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleFormSubmit = (e) => {
    e.preventDefault()

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error('All fields are required to create an admin account')
      return
    }

    if (password.trim().length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    onSubmit({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Create a new Placement Cell administrator account with full privileges to post drives and manage students.
      </p>

      {/* Full Name */}
      <div>
        <label className="label text-xs">Admin Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input mt-1"
          placeholder="e.g. Dr. Rajesh Kumar"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="label text-xs">Official Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mt-1"
          placeholder="e.g. rajesh.placement@college.edu"
          required
        />
      </div>

      {/* Password */}
      <div>
        <label className="label text-xs">Initial Password (Min 6 chars)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mt-1"
          placeholder="Create secure admin password"
          required
          minLength={6}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t border-slate-200 dark:border-white/10 pt-4 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1 flex items-center justify-center text-xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2 text-xs"
        >
          {loading ? (
            <span className="spinner w-4 h-4 border-top-color-white" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              Create Admin
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function StudentAcademicModal({ student, onClose }) {
  const qc = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-student-profile', student.id],
    queryFn: () => client.get(`/admin/users/${student.id}/profile`).then(r => r.data),
  })

  const [form, setForm] = useState({
    cgpa: '',
    branch: '',
    batch_year: new Date().getFullYear(),
    active_backlogs: 0,
    history_of_backlogs: 0,
    tenth_percentage: '',
    twelfth_percentage: '',
    diploma_percentage: '',
    gap_years: 0,
  })

  useEffect(() => {
    if (profile) {
      setForm({
        cgpa: profile.cgpa ?? '',
        branch: profile.branch ?? '',
        batch_year: profile.batch_year ?? new Date().getFullYear(),
        active_backlogs: profile.active_backlogs ?? 0,
        history_of_backlogs: profile.history_of_backlogs ?? 0,
        tenth_percentage: profile.tenth_percentage ?? '',
        twelfth_percentage: profile.twelfth_percentage ?? '',
        diploma_percentage: profile.diploma_percentage ?? '',
        gap_years: profile.gap_years ?? 0,
      })
    }
  }, [profile])

  const saveMutation = useMutation({
    mutationFn: (payload) => client.put(`/admin/users/${student.id}/profile`, payload),
    onSuccess: () => {
      toast.success(`Official academic profile saved for ${student.full_name}!`)
      qc.invalidateQueries({ queryKey: ['admin-student-profile', student.id] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to save academic profile')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.branch) {
      toast.error('Branch is required')
      return
    }
    const payload = {
      cgpa: form.cgpa !== '' ? parseFloat(form.cgpa) : null,
      branch: form.branch,
      batch_year: parseInt(form.batch_year),
      active_backlogs: parseInt(form.active_backlogs) || 0,
      history_of_backlogs: parseInt(form.history_of_backlogs) || 0,
      tenth_percentage: form.tenth_percentage !== '' ? parseFloat(form.tenth_percentage) : null,
      twelfth_percentage: form.twelfth_percentage !== '' ? parseFloat(form.twelfth_percentage) : null,
      diploma_percentage: form.diploma_percentage !== '' ? parseFloat(form.diploma_percentage) : null,
      gap_years: parseInt(form.gap_years) || 0,
    }
    saveMutation.mutate(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass p-6 rounded-2xl w-full max-w-lg relative z-10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-h)' }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Official Student Academic Record
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Editing: <strong style={{ color: 'var(--text-primary)' }}>{student.full_name}</strong> ({student.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="spinner scale-125" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Branch & Batch */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Branch / Discipline *</label>
                <select
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  className="input mt-1"
                  required
                >
                  <option value="">Select Branch</option>
                  {BRANCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label text-xs">Graduation Batch *</label>
                <input
                  type="number"
                  value={form.batch_year}
                  onChange={(e) => setForm({ ...form, batch_year: e.target.value })}
                  className="input mt-1"
                  min="2020"
                  max="2035"
                  required
                />
              </div>
            </div>

            {/* CGPA */}
            <div>
              <label className="label text-xs">Current CGPA (0 - 10)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={form.cgpa}
                onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
                className="input mt-1"
                placeholder="e.g. 8.45"
              />
            </div>

            {/* Backlogs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Active Backlogs</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={form.active_backlogs}
                  onChange={(e) => setForm({ ...form, active_backlogs: e.target.value })}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="label text-xs">Total History of Backlogs</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={form.history_of_backlogs}
                  onChange={(e) => setForm({ ...form, history_of_backlogs: e.target.value })}
                  className="input mt-1"
                />
              </div>
            </div>

            {/* School / Diploma % */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">10th Class (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.tenth_percentage}
                  onChange={(e) => setForm({ ...form, tenth_percentage: e.target.value })}
                  className="input mt-1"
                  placeholder="e.g. 92.5"
                />
              </div>
              <div>
                <label className="label text-xs">12th / Inter (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.twelfth_percentage}
                  onChange={(e) => setForm({ ...form, twelfth_percentage: e.target.value })}
                  className="input mt-1"
                  placeholder="e.g. 88.0"
                />
              </div>
            </div>

            {/* Gap Years */}
            <div>
              <label className="label text-xs">Education Gap Years</label>
              <input
                type="number"
                min="0"
                max="10"
                value={form.gap_years}
                onChange={(e) => setForm({ ...form, gap_years: e.target.value })}
                className="input mt-1"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 border-t border-slate-200 dark:border-white/10 pt-4 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 flex items-center justify-center text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-xs"
              >
                {saveMutation.isPending ? (
                  <span className="spinner w-4 h-4 border-top-color-white" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Record
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Edit, Trash2, Shield, User, X, Key, Calendar, Mail, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'

export default function AccountManagement() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('') // '' | 'student' | 'admin'
  
  // Modals state
  const [editingUser, setEditingUser] = useState(null)
  
  // Debounce search input to avoid spamming backend
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

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ userId, data }) => client.put(`/admin/users/${userId}`, data),
    onSuccess: () => {
      toast.success('User updated successfully')
      setEditingUser(null)
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err) => {
      const errMsg = err.response?.data?.detail || 'Failed to update user'
      toast.error(errMsg)
    }
  })

  const handleDelete = (user) => {
    const warning = user.role === 'admin'
      ? `Are you sure you want to delete admin "${user.full_name}"?`
      : `Are you sure you want to delete student "${user.full_name}"? This will permanently delete all associated resumes, roadmap progress, and matching records.`
      
    if (window.confirm(warning)) {
      deleteMutation.mutate(user.id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">User Accounts</h1>
          <p className="text-slate-400 mt-1">Manage and edit access controls for students and administrators</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5" style={{ backgroundColor: 'rgba(11, 11, 20, 0.4)' }}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
            style={{ backgroundColor: 'rgba(11, 11, 20, 0.6)', borderColor: 'rgba(255,255,255,0.06)' }}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs / Filter Buttons */}
        <div className="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-white/5 self-start md:self-auto">
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
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={roleFilter === tab.value ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}
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
        <div className="card text-center py-16 text-slate-500">
          <User className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-400">No matching accounts found</p>
          <p className="text-sm text-slate-600 mt-1">Try resetting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass p-5 flex flex-col justify-between h-48 border border-white/5 hover:border-purple-500/20 hover:shadow-glow-purple transition-all duration-350"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`p-1.5 rounded-lg ${
                      u.role === 'admin' 
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10' 
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                    }`}>
                      {u.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </span>
                    <h3 className="font-semibold text-slate-200 truncate text-sm" title={u.full_name}>{u.full_name}</h3>
                  </div>
                  <span className={`badge text-[10px] uppercase font-bold tracking-wider ${
                    u.role === 'admin' ? 'badge-cyan' : 'badge-purple'
                  }`}>
                    {u.role === 'admin' ? 'Admin' : 'Student'}
                  </span>
                </div>
                
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate text-slate-300" title={u.email}>{u.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span>Registered: {new Date(u.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-white/5 pt-3.5 mt-2">
                <button
                  onClick={() => setEditingUser(u)}
                  className="btn-secondary flex-1 py-1.5 text-xs flex items-center justify-center gap-1.5"
                  style={{ borderRadius: '10px' }}
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="btn-ghost py-1.5 px-3 hover:bg-rose-500/10 hover:text-rose-400 text-rose-500 flex items-center justify-center"
                  style={{ borderRadius: '10px' }}
                  title="Delete User"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit User Modal Overlay */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl space-y-4"
              style={{ backgroundColor: 'var(--sidebar-bg)' }}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-purple-400" />
                  Edit Account Details
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Edit Form */}
              <EditUserForm
                user={editingUser}
                onSubmit={(data) => updateMutation.mutate({ userId: editingUser.id, data })}
                loading={updateMutation.isPending}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EditUserForm({ user, onSubmit, loading }) {
  const [email, setEmail] = useState(user.email)
  const [fullName, setFullName] = useState(user.full_name)
  const [role, setRole] = useState(user.role)
  const [password, setPassword] = useState('')

  const handleFormSubmit = (e) => {
    e.preventDefault()
    
    if (!email.trim() || !fullName.trim()) {
      toast.error('Email and Full Name are required')
      return
    }

    const payload = {
      email: email.trim(),
      full_name: fullName.trim(),
      role: role
    }

    if (password.trim()) {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      payload.password = password.trim()
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
      {/* Name */}
      <div>
        <label className="label text-xs">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input mt-1"
          placeholder="e.g. Rahul Sharma"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="label text-xs">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mt-1"
          placeholder="e.g. user@placement.edu"
          required
        />
      </div>

      {/* Role */}
      <div>
        <label className="label text-xs">Role / Account Type</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input mt-1 select"
          style={{ appearance: 'none', WebkitAppearance: 'none' }}
        >
          <option value="student">Student</option>
          <option value="admin">Placement Cell (Admin)</option>
        </select>
      </div>

      {/* Password Reset */}
      <div className="bg-white/3 p-3 rounded-xl border border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
        <label className="label text-xs text-amber-400 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5" />
          Reset Password (Optional)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mt-1"
          placeholder="Type new password (min 6 chars)"
          minLength={6}
        />
        <p className="text-[10px] text-slate-500 mt-1">Leave empty to keep current password.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t border-white/5 pt-4 mt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
          style={{ borderRadius: '12px' }}
        >
          {loading ? (
            <span className="spinner w-4 h-4 border-top-color-white" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Updates
            </>
          )}
        </button>
      </div>
    </form>
  )
}

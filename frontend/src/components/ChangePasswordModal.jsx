import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Lock, X, Check, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../api/client'

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required')
      return
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }

    setLoading(true)
    try {
      await client.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      toast.success('Your password has been changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onClose()
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to update password'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
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
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-h)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Key className="w-5 h-5 text-purple-500" />
            Change Your Password
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Update your account password securely. You will stay signed in on this device.
          </p>

          {/* Current Password */}
          <div>
            <label className="label text-xs">Current Password</label>
            <div className="relative mt-1">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input pr-10"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="label text-xs">New Password (Min 6 chars)</label>
            <div className="relative mt-1">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input pr-10"
                placeholder="Enter new strong password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label text-xs">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input mt-1"
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-white/10 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
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
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

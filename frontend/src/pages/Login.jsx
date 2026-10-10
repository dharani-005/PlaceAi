import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Users, Shield, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      if (mode === 'login') {
        res = await client.post('/auth/login', { email: form.email, password: form.password })
      } else {
        res = await client.post('/auth/register', { ...form, role })
      }
      login({ ...res.data, email: form.email.trim().lower ? form.email.trim().toLowerCase() : form.email })
      toast.success(`Welcome, ${res.data.full_name}!`)
      navigate(res.data.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-grid overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      {/* Ambient blobs */}
      <div style={{ position:'fixed', top:'-100px', left:'-100px', width:'600px', height:'600px',
        background:'radial-gradient(circle, rgba(147,51,234,0.08) 0%, transparent 70%)',
        pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-100px', right:'-100px', width:'500px', height:'500px',
        background:'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)',
        pointerEvents:'none', zIndex:0 }} />

      {/* Left panel — hero (Dark Side) */}
      <div className="hidden lg:flex flex-col justify-between flex-1 p-12 relative z-10" style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div style={{
            width:'42px', height:'42px', borderRadius:'12px',
            background:'linear-gradient(135deg,#9333ea,#06b6d4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 24px rgba(147,51,234,0.4)'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <span style={{ fontWeight:800, fontSize:'1.375rem', background:'linear-gradient(135deg,#c084fc,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>PlaceAI</span>
        </div>

        {/* Hero text */}
        <div>
          <motion.h1
            initial={{ opacity:0, y:30 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, ease:'easeOut' }}
            style={{ fontSize:'3.25rem', fontWeight:800, lineHeight:1.15, color:'#f1f5f9', marginBottom:'1.25rem' }}
          >
            Your Placement<br />
            <span style={{ background:'linear-gradient(135deg,#c084fc 0%,#818cf8 40%,#38bdf8 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Supercharged
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.2, duration:0.6 }}
            style={{ fontSize:'1rem', color:'#64748b', lineHeight:1.7, maxWidth:'420px' }}
          >
            AI-powered resume screening, skill matching, personalised roadmaps and mock interviews — all in one place.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.4 }}
            style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem', marginTop:'2rem' }}
          >
            {[
              { label:'ATS Scorer', color:'#9333ea', bg:'rgba(147,51,234,0.12)' },
              { label:'Skill Match', color:'#06b6d4', bg:'rgba(6,182,212,0.12)' },
              { label:'AI Roadmap', color:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
              { label:'Mock Interview', color:'#10b981', bg:'rgba(16,185,129,0.12)' },
            ].map(f => (
              <span key={f.label} style={{
                padding:'0.35rem 0.875rem', borderRadius:'9999px',
                fontSize:'0.78rem', fontWeight:600,
                color: f.color, background: f.bg,
                border:`1px solid ${f.color}30`
              }}>{f.label}</span>
            ))}
          </motion.div>
        </div>

        {/* Bottom stat row */}
        <div style={{ display:'flex', gap:'2.5rem' }}>
          {[['Resume Scoring','AI-Powered'],['Eligibility Checks','Real-time'],['Interview Prep','Mock + Q&A']].map(([a,b]) => (
            <div key={a}>
              <p style={{ color:'#e2e8f0', fontWeight:700, fontSize:'0.9rem' }}>{a}</p>
              <p style={{ color:'#475569', fontSize:'0.8rem', marginTop:'2px' }}>{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-shrink-0 w-full lg:w-[480px] flex flex-col justify-center items-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-[420px] flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity:0, x:30 }}
          animate={{ opacity:1, x:0 }}
          transition={{ duration:0.55, ease:'easeOut' }}
          style={{ width:'100%', maxWidth:'420px' }}
        >
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'linear-gradient(135deg,#9333ea,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <span style={{ fontWeight:800, fontSize:'1.25rem', background:'linear-gradient(135deg,#c084fc,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>PlaceAI</span>
          </div>

          <h2 style={{ fontSize:'1.75rem', fontWeight:800, color:'var(--text-primary)', marginBottom:'0.5rem' }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem', marginBottom:'2rem' }}>
            {mode === 'login' ? 'Access your campus placement portal' : 'Join the placement platform'}
          </p>

          {/* Mode toggle */}
          <div style={{ display:'flex', gap:'4px', padding:'4px', background:'rgba(0,0,0,0.03)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:'14px', marginBottom:'1.75rem' }}>
            {[['login','Sign In'],['register','Register']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex:1, padding:'0.5rem 0', borderRadius:'10px', fontSize:'0.875rem', fontWeight:600,
                  border:'none', cursor:'pointer', transition:'all 0.2s',
                  background: mode === m ? 'linear-gradient(135deg,#9333ea,#6366f1)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-muted)',
                  boxShadow: mode === m ? '0 4px 12px rgba(147,51,234,0.25)' : 'none',
                }}
              >{label}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.125rem' }}>
            {/* Full name (register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  key="fullname"
                  initial={{ opacity:0, height:0, marginBottom:0 }}
                  animate={{ opacity:1, height:'auto' }}
                  exit={{ opacity:0, height:0 }}
                >
                  <label className="label">Full Name</label>
                  <input
                    id="full_name"
                    className="input"
                    placeholder="Your full name"
                    value={form.full_name}
                    onChange={e => setForm({...form, full_name: e.target.value})}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div style={{ position:'relative' }}>
                <Mail size={15} color="#4a5568" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input
                  id="email"
                  type="email"
                  className="input"
                  style={{ paddingLeft:'2.5rem' }}
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} color="#4a5568" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  style={{ paddingLeft:'2.5rem', paddingRight:'2.75rem' }}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#4a5568', padding:'4px' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Role selector (register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  key="role"
                  initial={{ opacity:0, height:0 }}
                  animate={{ opacity:1, height:'auto' }}
                  exit={{ opacity:0, height:0 }}
                >
                  <label className="label">Account Type</label>
                  <div style={{ display:'flex', gap:'10px' }}>
                    {[
                      { value:'student', label:'Student', icon: Users, color:'#7c3aed', bg:'rgba(124,58,237,0.08)', border:'rgba(124,58,237,0.2)' },
                      { value:'admin', label:'Placement Cell', icon: Shield, color:'#0e7490', bg:'rgba(8,145,178,0.08)', border:'rgba(8,145,178,0.2)' },
                    ].map(({ value, label, icon: Icon, color, bg, border }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRole(value)}
                        style={{
                          flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                          padding:'0.65rem', borderRadius:'12px', fontSize:'0.875rem', fontWeight:600,
                          cursor:'pointer', transition:'all 0.2s',
                          background: role === value ? bg : 'rgba(0,0,0,0.02)',
                          border: `1px solid ${role === value ? border : 'rgba(0,0,0,0.06)'}`,
                          color: role === value ? color : 'var(--text-muted)',
                        }}
                      >
                        <Icon size={15} />
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              id="submit-auth"
              type="submit"
              disabled={loading}
              style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                padding:'0.75rem', borderRadius:'13px', border:'none', cursor:'pointer',
                fontWeight:700, fontSize:'0.9375rem', color:'#fff',
                background: loading ? 'rgba(147,51,234,0.5)' : 'linear-gradient(135deg,#9333ea 0%,#6366f1 60%,#06b6d4 100%)',
                boxShadow: loading ? 'none' : '0 0 24px rgba(147,51,234,0.4)',
                transition:'all 0.2s',
                marginTop:'0.375rem',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <span className="spinner" style={{ width:'18px', height:'18px', borderTopColor:'#fff', borderColor:'rgba(255,255,255,0.3)' }} />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Bottom divider */}
          <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid rgba(0,0,0,0.06)', textAlign:'center' }}>
            <p style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#7c3aed', fontWeight:600, fontSize:'0.8rem' }}
              >
                {mode === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

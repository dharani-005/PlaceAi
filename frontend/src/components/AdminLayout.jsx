import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Briefcase, PlusCircle, LogOut, Sparkles } from 'lucide-react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/jobs', icon: Briefcase, label: 'Job Postings' },
  { to: '/admin/jobs/new', icon: PlusCircle, label: 'Post New Job' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-deep)' }}>
      {/* Ambient blobs */}
      <div style={{ position:'fixed', top:'-150px', left:'-150px', width:'500px', height:'500px',
        background:'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col relative z-10 border-r border-white/5" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div style={{
              width:'30px', height:'30px', borderRadius:'8px',
              background:'linear-gradient(135deg,#06b6d4,#9333ea)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(6,182,212,0.3)'
            }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <span style={{ fontWeight:800, fontSize:'1.125rem', background:'linear-gradient(135deg,#38bdf8,#c084fc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>PlaceAI</span>
          </div>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Placement Cell</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="px-4 py-3 rounded-xl mb-3 border border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.full_name}</p>
            <p className="text-xs text-cyan-400 font-medium mt-0.5">Administrator</p>
          </div>
          <button onClick={handleLogout} className="sidebar-link w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-grid relative z-10">
        <div className="p-8 min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

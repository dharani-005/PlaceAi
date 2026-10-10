import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, FileText, User, Map, BarChart2,
  MessageSquare, LogOut, Sparkles, Menu, X,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resume', icon: FileText, label: 'Resume & ATS' },
  { to: '/profile', icon: User, label: 'Academic Profile' },
  { to: '/roadmap', icon: Map, label: 'Role Roadmap' },
  { to: '/match', icon: BarChart2, label: 'Match Dashboard' },
  { to: '/chatbot', icon: MessageSquare, label: 'Interview Prep' },
]

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-deep)' }}>
      {/* Ambient blobs */}
      <div style={{ position:'fixed', top:'-150px', left:'-150px', width:'500px', height:'500px',
        background:'radial-gradient(circle, rgba(147,51,234,0.04) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      
      {/* Mobile Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 lg:hidden relative z-20" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div style={{
            width:'28px', height:'28px', borderRadius:'6px',
            background:'linear-gradient(135deg,#9333ea,#06b6d4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 12px rgba(147,51,234,0.2)'
          }}>
            <Sparkles size={13} color="#fff" />
          </div>
          <span style={{ fontWeight:800, fontSize:'1rem', background:'linear-gradient(135deg,#c084fc,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>PlaceAI</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col border-r border-white/5 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`} 
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
      >
        {/* Brand */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between gap-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div style={{
                width:'30px', height:'30px', borderRadius:'8px',
                background:'linear-gradient(135deg,#9333ea,#06b6d4)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 0 16px rgba(147,51,234,0.3)'
              }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <span style={{ fontWeight:800, fontSize:'1.125rem', background:'linear-gradient(135deg,#c084fc,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>PlaceAI</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">Student Portal</p>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle className="hidden lg:flex" />
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info & logout */}
        <div className="px-3 py-3 border-t border-white/5 space-y-2">
          <div className="px-3.5 py-2.5 rounded-xl border border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.full_name}</p>
              <span className="badge badge-purple text-[9px] uppercase font-bold py-0.5 px-1.5">Student</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email || 'Student Account'}</p>
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={handleLogout}
              className="sidebar-link w-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 py-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-grid relative z-10 flex flex-col">
        <div className="p-4 sm:p-5 lg:p-6 min-h-full flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>

    </div>
  )
}

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth pages
import Login from './pages/Login'

// Student pages
import StudentLayout from './components/StudentLayout'
import ResumeUpload from './pages/student/ResumeUpload'
import AcademicProfile from './pages/student/AcademicProfile'
import Roadmap from './pages/student/Roadmap'
import MatchDashboard from './pages/student/MatchDashboard'
import Chatbot from './pages/student/Chatbot'
import StudentDashboard from './pages/student/StudentDashboard'

// Admin pages
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import JobList from './pages/admin/JobList'
import JobForm from './pages/admin/JobForm'
import JobDetail from './pages/admin/JobDetail'
import AccountManagement from './pages/admin/AccountManagement'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
          <p className="text-2xl font-bold text-slate-800">Something went wrong</p>
          <p className="text-sm text-slate-500 max-w-md text-center">{this.state.error?.message}</p>
          <button
            className="btn-primary"
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />

      {/* Student routes */}
      <Route path="/" element={<ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="resume" element={<ResumeUpload />} />
        <Route path="profile" element={<AcademicProfile />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="match" element={<MatchDashboard />} />
        <Route path="chatbot" element={<Chatbot />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="jobs" element={<JobList />} />
        <Route path="jobs/new" element={<JobForm />} />
        <Route path="jobs/:id/edit" element={<JobForm />} />
        <Route path="jobs/:id/candidates" element={<JobDetail />} />
        <Route path="accounts" element={<AccountManagement />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </AuthProvider>
  )
}

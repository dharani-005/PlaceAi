import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative flex items-center justify-between p-1 rounded-full border transition-all duration-300 w-14 h-7 ${
        isDark
          ? 'bg-slate-900 border-purple-500/40 text-purple-300'
          : 'bg-slate-200 border-slate-300 text-amber-500'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span className="sr-only">Toggle theme</span>
      <Sun className={`w-3.5 h-3.5 ml-1 transition-opacity ${isDark ? 'opacity-30' : 'opacity-100 text-amber-500'}`} />
      <Moon className={`w-3.5 h-3.5 mr-1 transition-opacity ${isDark ? 'opacity-100 text-purple-300' : 'opacity-30'}`} />
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md flex items-center justify-center ${
          isDark
            ? 'right-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
            : 'left-1 bg-white text-amber-500 shadow-sm'
        }`}
      >
        {isDark ? <Moon className="w-2.5 h-2.5 text-white" /> : <Sun className="w-2.5 h-2.5 text-amber-500" />}
      </motion.div>
    </button>
  )
}

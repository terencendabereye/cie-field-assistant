import { NavLink } from 'react-router-dom'
import { Calculator, FileText, Calendar, BookOpen, Gauge } from 'lucide-react'

const tabs = [
  { to: '/tools',       icon: Calculator, label: 'Tools'    },
  { to: '/notes',       icon: FileText,   label: 'Notes'    },
  { to: '/schedule',    icon: Calendar,   label: 'Schedule' },
  { to: '/formulas',    icon: BookOpen,   label: 'Formulas' },
  { to: '/calibration', icon: Gauge,      label: 'Calib'    },
]

export function BottomNav() {
  return (
    <nav className="flex items-stretch"
         style={{ background: 'var(--bg-light)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to}
                 className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-medium transition-colors"
                 style={({ isActive }) => ({ color: isActive ? 'var(--amber)' : 'var(--text-faint)' })}>
          {({ isActive }) => (
            <>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span style={{ fontSize: '10px' }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
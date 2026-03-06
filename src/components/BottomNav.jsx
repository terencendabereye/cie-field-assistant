import { NavLink } from 'react-router-dom'
import { Calculator, FileText, Calendar, BookOpen, Settings } from 'lucide-react'

const tabs = [
  { to: '/tools',    icon: Calculator, label: 'Tools'    },
  { to: '/notes',    icon: FileText,   label: 'Notes'    },
  { to: '/schedule', icon: Calendar,   label: 'Schedule' },
  { to: '/formulas', icon: BookOpen,   label: 'Formulas' },
  { to: '/settings', icon: Settings,   label: 'Settings' },
]

export function BottomNav() {
  return (
    <nav style={{
           background: 'var(--bg-light)',
           borderTop: '1px solid var(--border)',
           // Bottom safe area handled here — pads buttons above home indicator
           // The background naturally extends to the screen edge behind it
           paddingBottom: 'env(safe-area-inset-bottom)',
           flexShrink: 0, // critical — prevents nav from shrinking when tab content changes
         }}
         className="flex items-stretch">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 font-medium transition-colors"
          style={({ isActive }) => ({
            color: isActive ? 'var(--amber)' : 'var(--text-faint)',
            fontSize: '10px',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

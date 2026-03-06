import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { TrendingUp, Ruler } from 'lucide-react'

const toolTabs = [
  { to: '/tools/interpolation', icon: TrendingUp, label: 'Interpolation' },
  { to: '/tools/units',         icon: Ruler,      label: 'Unit Converter' },
]

export function ToolsPage() {
  const location = useLocation()
  const isRoot = location.pathname === '/tools' || location.pathname === '/tools/'

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-light)' }}>
        {toolTabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors
               ${isActive ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isRoot ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Select a tool above
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  )
}

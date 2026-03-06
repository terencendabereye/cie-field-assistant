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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="flex" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-light)', flexShrink: 0 }}>
        {toolTabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors"
            style={({ isActive }) => ({
              borderColor: isActive ? 'var(--amber)' : 'transparent',
              color: isActive ? 'var(--amber)' : 'var(--text-faint)',
            })}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Always fills remaining height whether empty or has content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {isRoot ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: '14px' }}>
            Select a tool above
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  )
}
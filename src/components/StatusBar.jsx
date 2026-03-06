import { Wifi, WifiOff, RefreshCw, Sun, Moon } from 'lucide-react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { usePWAUpdate } from '../hooks/usePWAUpdate'
import { useTheme } from '../hooks/useTheme'

export function StatusBar() {
  const isOnline = useOnlineStatus()
  const { needsUpdate, triggerUpdate } = usePWAUpdate()
  const { dark, toggle } = useTheme()

  return (
    <div className="flex items-center justify-between px-4 text-xs"
         style={{
           background: 'var(--bg-light)',
           borderBottom: '1px solid var(--border)',
           paddingTop: '52px',   /* fixed space for Dynamic Island / notch */
           paddingBottom: '10px',
           flexShrink: 0,
         }}>

      <span className="mono font-bold tracking-widest uppercase"
            style={{ color: 'var(--amber)', fontSize: '15px' }}>
        CIE Assist
      </span>

      <div className="flex items-center gap-3">
        {needsUpdate && (
          <button
            onClick={triggerUpdate}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
            style={{ background: 'var(--amber)', color: 'var(--bg)' }}
          >
            <RefreshCw size={11} />
            Update available
          </button>
        )}

        <button
          onClick={toggle}
          className="p-1.5 rounded-full transition-colors"
          style={{ background: 'var(--bg-mid)', color: 'var(--text-muted)' }}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={13} /> : <Moon size={13} />}
        </button>

        <span className={`flex items-center gap-1 font-medium ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  )
}
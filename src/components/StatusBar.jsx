import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { usePWAUpdate } from '../hooks/usePWAUpdate'

export function StatusBar() {
  const isOnline = useOnlineStatus()
  const { needsUpdate, triggerUpdate } = usePWAUpdate()

  return (
    <div className="flex items-center justify-between px-4 text-xs"
         style={{
           background: 'var(--bg-light)',
           borderBottom: '1px solid var(--border)',
           // Top safe area handled here — pushes content below Dynamic Island
           paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
           paddingBottom: '8px',
           flexShrink: 0, // never shrink — always full height
         }}>

      <span className="mono font-bold tracking-widest text-xs uppercase"
            style={{ color: 'var(--amber)' }}>
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
        <span className={`flex items-center gap-1 font-medium ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  )
}

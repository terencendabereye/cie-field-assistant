import { useState } from 'react'
import { Sun, Moon, Type, Trash2, Info, ChevronRight } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useFontSize } from '../../hooks/useFontSize'

const VERSION = '1.1.0'

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-widest px-1 mb-1"
         style={{ color: 'var(--text-faint)', fontFamily: "'JetBrains Mono', monospace" }}>
        {title}
      </p>
      <div className="rounded-xl overflow-hidden"
           style={{ border: '1px solid var(--border)', background: 'var(--bg-light)' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, children, danger, onClick, last }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 ${onClick ? 'cursor-pointer active:opacity-70' : ''}`}
      style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
           style={{ background: danger ? 'rgba(239,68,68,0.12)' : 'var(--bg-mid)' }}>
        <Icon size={14} style={{ color: danger ? '#ef4444' : 'var(--amber)' }} />
      </div>
      <span className="flex-1 text-sm font-medium" style={{ color: danger ? '#ef4444' : 'var(--text)' }}>
        {label}
      </span>
      {children}
      {onClick && !children && <ChevronRight size={14} style={{ color: 'var(--text-faint)' }} />}
    </div>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
           style={{ background: 'var(--bg-light)', border: '1px solid var(--border)' }}>
        <p className="text-sm text-center" style={{ color: 'var(--text)' }}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--bg-mid)', color: 'var(--text)' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#ef4444', color: '#fff' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { dark, toggle } = useTheme()
  const { size, setSize, sizes } = useFontSize()
  const [confirm, setConfirm] = useState(null) // 'notes' | 'tasks' | null

  const clearNotes = () => {
    localStorage.removeItem('cie_notes_v1')
    setConfirm(null)
  }

  const clearTasks = () => {
    localStorage.removeItem('cie_schedule_v1')
    setConfirm(null)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-4 flex flex-col gap-5">

        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Settings</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>App preferences and data management</p>
        </div>

        {/* Appearance */}
        <Section title="Appearance">
          <Row icon={dark ? Moon : Sun} label={dark ? 'Dark Mode' : 'Light Mode'} last>
            <button
              onClick={toggle}
              className="relative w-11 h-6 rounded-full transition-colors duration-200"
              style={{ background: dark ? 'var(--amber)' : 'var(--bg-mid)' }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200"
                style={{
                  background: '#fff',
                  left: '2px',
                  transform: dark ? 'translateX(20px)' : 'translateX(0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }}
              />
            </button>
          </Row>
        </Section>

        {/* Text Size */}
        <Section title="Text Size">
          <Row icon={Type} label="Font Size" last>
            <div className="flex items-center gap-2">
              <span className="text-xs mono" style={{ color: 'var(--text-faint)' }}>A</span>
              <input
                type="range"
                min={12}
                max={22}
                value={size}
                onChange={e => setSize(parseInt(e.target.value))}
                style={{ width: '120px', accentColor: 'var(--amber)' }}
              />
              <span className="text-base mono font-bold" style={{ color: 'var(--text-faint)' }}>A</span>
              <span className="mono text-xs" style={{ color: 'var(--amber)', minWidth: '32px' }}>{size}px</span>
            </div>
          </Row>
        </Section>

        {/* Data Management */}
        <Section title="Data">
          <Row icon={Trash2} label="Clear all notes" danger onClick={() => setConfirm('notes')} />
          <Row icon={Trash2} label="Clear all tasks" danger onClick={() => setConfirm('tasks')} last />
        </Section>

        {/* App Info */}
        <Section title="About">
          <Row icon={Info} label="Version" last>
            <span className="text-xs mono" style={{ color: 'var(--text-faint)' }}>v{VERSION}</span>
          </Row>
        </Section>

        <p className="text-center text-xs pb-2" style={{ color: 'var(--text-faint)' }}>
          CIE Field Assistant · Built for power plant teams
        </p>
      </div>

      {/* Confirm dialogs */}
      {confirm === 'notes' && (
        <ConfirmDialog
          message="Delete all notes? This cannot be undone."
          onConfirm={clearNotes}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'tasks' && (
        <ConfirmDialog
          message="Delete all tasks? This cannot be undone."
          onConfirm={clearTasks}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react'

const STORAGE_KEY = 'cie_schedule_v1'

const PRIORITIES = [
  { id: 'high',   label: 'High',   color: '#ef4444' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'low',    label: 'Low',    color: '#10b981' },
]

const CATEGORIES = ['Maintenance', 'Inspection', 'Calibration', 'Testing', 'Admin', 'Other']

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

export function SchedulePage() {
  const [tasks, setTasks] = useState(load)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', time: '', priority: 'medium', category: 'Maintenance', notes: '' })

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)), [tasks])

  const addTask = () => {
    if (!form.title.trim()) return
    setTasks([...tasks, { id: Date.now(), ...form, done: false, createdAt: new Date().toISOString() }])
    setForm({ title: '', date: '', time: '', priority: 'medium', category: 'Maintenance', notes: '' })
    setShowForm(false)
  }

  const toggle = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const remove = (id) => setTasks(tasks.filter(t => t.id !== id))

  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (a.date && b.date) return a.date.localeCompare(b.date)
    return 0
  })

  const inputStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header — fixed height, never shrinks */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Schedule</h2>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-faint)' }}>{tasks.filter(t => !t.done).length} pending tasks</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: showForm ? 'var(--bg-mid)' : 'var(--amber)', color: showForm ? 'var(--text)' : 'var(--bg)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          <Plus size={13} /> {showForm ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {/* Add task form — fixed height when visible, gone when not */}
      {showForm && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                 placeholder="Task title *" style={inputStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                   style={{ ...inputStyle, colorScheme: 'dark' }} />
            <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                   style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
              {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label} Priority</option>)}
            </select>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Notes (optional)" rows={2}
                    style={{ ...inputStyle, resize: 'none', fontFamily: "'Barlow', sans-serif" }} />
          <button onClick={addTask}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--amber)', color: 'var(--bg)', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
            Add Task
          </button>
        </div>
      )}

      {/* Task list — fills all remaining space exactly */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: '14px' }}>
            No tasks scheduled
          </div>
        ) : (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sorted.map(task => {
              const priority = PRIORITIES.find(p => p.id === task.priority)
              return (
                <div key={task.id}
                     style={{ display: 'flex', gap: '12px', borderRadius: '8px', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', opacity: task.done ? 0.5 : 1 }}>
                  <button onClick={() => toggle(task.id)} style={{ marginTop: '2px', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {task.done
                      ? <CheckCircle2 size={18} color="#10b981" />
                      : <Circle size={18} color="var(--text-faint)" />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: task.done ? 'var(--text-faint)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none' }}>
                      {task.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {(task.date || task.time) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-faint)' }}>
                          <Clock size={10} /> {task.date} {task.time}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '999px', background: priority.color + '22', color: priority.color }}>
                        {task.category}
                      </span>
                      <span style={{ fontSize: '11px', color: priority.color }}>{priority.label}</span>
                    </div>
                    {task.notes && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-faint)' }}>{task.notes}</p>}
                  </div>
                  <button onClick={() => remove(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', flexShrink: 0, padding: 0, marginTop: '2px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
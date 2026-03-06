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
    const task = { id: Date.now(), ...form, done: false, createdAt: new Date().toISOString() }
    setTasks([...tasks, task])
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
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3"
           style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="text-base font-semibold">Schedule</h2>
          <p className="text-xs text-slate-500">{tasks.filter(t => !t.done).length} pending tasks</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
                style={{ background: showForm ? 'var(--bg-mid)' : 'var(--amber)', color: showForm ? 'var(--text)' : 'var(--bg)' }}>
          <Plus size={13} /> {showForm ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {showForm && (
        <div className="p-4 flex flex-col gap-3"
             style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border)' }}>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                 placeholder="Task title *" style={inputStyle} />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                   style={{ ...inputStyle, colorScheme: 'dark' }} />
            <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                   style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
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
                  className="w-full py-2 rounded font-semibold text-sm"
                  style={{ background: 'var(--amber)', color: 'var(--bg)' }}>
            Add Task
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No tasks scheduled
          </div>
        ) : sorted.map(task => {
          const priority = PRIORITIES.find(p => p.id === task.priority)
          return (
            <div key={task.id}
                 className="rounded-lg p-3 flex gap-3"
                 style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', opacity: task.done ? 0.5 : 1 }}>
              <button onClick={() => toggle(task.id)} className="mt-0.5 shrink-0">
                {task.done
                  ? <CheckCircle2 size={18} className="text-emerald-400" />
                  : <Circle size={18} className="text-slate-500" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.done ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {(task.date || task.time) && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={10} /> {task.date} {task.time}
                    </span>
                  )}
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: priority.color + '22', color: priority.color }}>
                    {task.category}
                  </span>
                  <span className="text-xs" style={{ color: priority.color }}>{priority.label}</span>
                </div>
                {task.notes && <p className="text-xs text-slate-500 mt-1">{task.notes}</p>}
              </div>
              <button onClick={() => remove(task.id)} className="text-slate-600 hover:text-red-400 shrink-0 mt-0.5">
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

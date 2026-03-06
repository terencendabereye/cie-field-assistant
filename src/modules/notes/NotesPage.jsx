import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronLeft } from 'lucide-react'

const STORAGE_KEY = 'cie_notes_v1'

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export function NotesPage() {
  const [notes, setNotes] = useState(loadNotes)
  const [activeId, setActiveId] = useState(null)

  useEffect(() => saveNotes(notes), [notes])

  const activeNote = notes.find(n => n.id === activeId)

  const createNote = () => {
    const note = { id: Date.now(), title: 'New Note', body: '', createdAt: new Date().toISOString() }
    const updated = [note, ...notes]
    setNotes(updated)
    setActiveId(note.id)
  }

  const updateNote = (field, value) => {
    setNotes(notes.map(n => n.id === activeId ? { ...n, [field]: value } : n))
  }

  const deleteNote = (id) => {
    setNotes(notes.filter(n => n.id !== id))
    if (activeId === id) setActiveId(null)
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
  }

  if (activeNote) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div className="flex items-center gap-3 px-4 py-3"
             style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-light)', flexShrink: 0 }}>
          <button onClick={() => setActiveId(null)} className="text-slate-400 hover:text-slate-200">
            <ChevronLeft size={20} />
          </button>
          <input
            value={activeNote.title}
            onChange={e => updateNote('title', e.target.value)}
            className="flex-1 bg-transparent outline-none font-semibold text-sm"
            style={{ color: 'var(--text)' }}
            placeholder="Note title"
          />
          <button onClick={() => deleteNote(activeNote.id)} className="text-red-400 hover:text-red-300 p-1">
            <Trash2 size={16} />
          </button>
        </div>
        <textarea
          value={activeNote.body}
          onChange={e => updateNote('body', e.target.value)}
          className="p-4 outline-none text-sm resize-none leading-relaxed"
          style={{ flex: 1, minHeight: 0, background: 'var(--bg)', color: 'var(--text-muted)', fontFamily: "'Barlow', sans-serif" }}
          placeholder="Start typing your note…"
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="flex items-center justify-between px-4 py-3"
           style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Notes</h2>
        <button onClick={createNote}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
                style={{ background: 'var(--amber)', color: 'var(--bg)' }}>
          <Plus size={13} /> New Note
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3"
               style={{ color: 'var(--text-faint)' }}>
            <p className="text-sm">No notes yet</p>
            <button onClick={createNote}
                    className="text-xs px-4 py-2 rounded"
                    style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--amber)' }}>
              Create your first note
            </button>
          </div>
        ) : (
          <div className="p-3 flex flex-col gap-2">
            {notes.map(note => (
              <button key={note.id} onClick={() => setActiveId(note.id)}
                      className="w-full text-left rounded-lg p-3"
                      style={{ background: 'var(--bg-light)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium truncate flex-1" style={{ color: 'var(--text)' }}>
                    {note.title || 'Untitled'}
                  </p>
                  <span className="text-xs ml-2 shrink-0" style={{ color: 'var(--text-faint)' }}>
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                {note.body && (
                  <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                    {note.body}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
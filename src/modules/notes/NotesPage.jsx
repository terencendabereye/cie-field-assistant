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
    setNotes([note, ...notes])
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
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (activeNote) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)', flexShrink: 0 }}>
          <button onClick={() => setActiveId(null)} style={{ color: 'var(--text-muted)' }}>
            <ChevronLeft size={20} />
          </button>
          <input
            value={activeNote.title}
            onChange={e => updateNote('title', e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}
            placeholder="Note title"
          />
          <button onClick={() => deleteNote(activeNote.id)} style={{ color: '#ef4444', padding: '4px' }}>
            <Trash2 size={16} />
          </button>
        </div>
        <textarea
          value={activeNote.body}
          onChange={e => updateNote('body', e.target.value)}
          style={{ flex: 1, minHeight: 0, padding: '16px', background: 'var(--bg)', color: 'var(--text-muted)', border: 'none', outline: 'none', resize: 'none', fontSize: '14px', lineHeight: 1.6, fontFamily: "'Barlow', sans-serif" }}
          placeholder="Start typing your note…"
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Notes</h2>
        <button onClick={createNote}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'var(--amber)', color: 'var(--bg)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          <Plus size={13} /> New Note
        </button>
      </div>

      {/* flex: 1 + minHeight: 0 makes this always fill remaining space exactly */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {notes.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-faint)' }}>
            <p style={{ margin: 0, fontSize: '14px' }}>No notes yet</p>
            <button onClick={createNote}
                    style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '6px', background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--amber)', cursor: 'pointer' }}>
              Create your first note
            </button>
          </div>
        ) : (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notes.map(note => (
              <button key={note.id} onClick={() => setActiveId(note.id)}
                      style={{ width: '100%', textAlign: 'left', borderRadius: '8px', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {note.title || 'Untitled'}
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: '8px', flexShrink: 0 }}>
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                {note.body && (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-faint)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, ChevronLeft, Eye, Edit3, Image, X, AlertTriangle } from 'lucide-react'
import { marked } from 'marked'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const STORAGE_KEY = 'cie_notes_v1'
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}
function saveNotes(notes) { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)) }

marked.setOptions({ breaks: true, gfm: true })

function renderMath(text) {
  text = text.replace(/\$\$([^$]+?)\$\$/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), { throwOnError: false, displayMode: true }) }
    catch { return `$$${expr}$$` }
  })
  text = text.replace(/\$([^$\n]+?)\$/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), { throwOnError: false, displayMode: false }) }
    catch { return `$${expr}$` }
  })
  return text
}

function MarkdownPreview({ content }) {
  const html = marked.parse(renderMath(content || ''))
  return (
    <div className="md-preview"
         style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.7 }}
         dangerouslySetInnerHTML={{ __html: html }} />
  )
}

function ImageThumb({ src, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block', margin: '4px' }}>
        <img src={src} alt="attachment" onClick={() => setExpanded(true)}
             style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }} />
        {onRemove && (
          <button onClick={onRemove}
                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <X size={10} color="white" />
          </button>
        )}
      </div>
      {expanded && (
        <div onClick={() => setExpanded(false)}
             style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <img src={src} alt="attachment" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '10px', objectFit: 'contain' }} />
        </div>
      )}
    </>
  )
}

export function NotesPage() {
  const [notes, setNotes] = useState(loadNotes)
  const [activeId, setActiveId] = useState(null)
  const [preview, setPreview] = useState(false)
  const [warning, setWarning] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => saveNotes(notes), [notes])

  const active = notes.find(n => n.id === activeId)

  const createNote = () => {
    const note = { id: Date.now(), title: 'New Note', body: '', images: [], createdAt: new Date().toISOString() }
    setNotes(prev => [note, ...prev])
    setActiveId(note.id)
    setPreview(false)
  }

  const update = (field, value) =>
    setNotes(prev => prev.map(n => n.id === activeId
      ? { ...n, [field]: value, updatedAt: new Date().toISOString() }
      : n
    ))

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activeId === id) setActiveId(null)
  }

  const addImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if ((active?.images || []).length >= 2) {
      setWarning(true)
      setTimeout(() => setWarning(false), 4000)
    }
    const reader = new FileReader()
    reader.onload = (ev) => update('images', [...(active?.images || []), ev.target.result])
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeImage = (idx) => {
    const imgs = [...(active?.images || [])]
    imgs.splice(idx, 1)
    update('images', imgs)
  }

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  if (active) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)' }}>
        <button onClick={() => { setActiveId(null); setPreview(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '2px' }}>
          <ChevronLeft size={20} />
        </button>
        <input value={active.title} onChange={e => update('title', e.target.value)}
               style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}
               placeholder="Note title" />
        <button onClick={() => setPreview(v => !v)} title={preview ? 'Edit' : 'Preview'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: preview ? 'var(--amber)' : 'var(--text-faint)' }}>
          {preview ? <Edit3 size={16} /> : <Eye size={16} />}
        </button>
        <button onClick={() => fileRef.current?.click()} title="Attach image"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-faint)' }}>
          <Image size={16} />
        </button>
        <button onClick={() => deleteNote(active.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#ef4444' }}>
          <Trash2 size={16} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={addImage} style={{ display: 'none' }} />
      </div>

      {/* Storage warning */}
      {warning && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid var(--border)' }}>
          <AlertTriangle size={12} color="var(--amber)" />
          <span style={{ fontSize: '11px', color: 'var(--amber)' }}>Images stored locally — many large images may fill storage.</span>
        </div>
      )}

      {/* Image strip */}
      {(active.images || []).length > 0 && (
        <div style={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
          {active.images.map((src, i) => (
            <ImageThumb key={i} src={src} onRemove={preview ? null : () => removeImage(i)} />
          ))}
        </div>
      )}

      {/* Hint bar */}
      {!preview && (
        <div style={{ flexShrink: 0, padding: '3px 14px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'monospace' }}>
            # h1 &nbsp;## h2 &nbsp;**bold** &nbsp;*italic* &nbsp;- list &nbsp;`code` &nbsp;&gt; quote &nbsp;$$math$$
          </span>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px' }}>
        {preview
          ? <MarkdownPreview content={active.body} />
          : <textarea value={active.body} onChange={e => update('body', e.target.value)}
                      placeholder="Start typing… markdown + $$LaTeX$$ supported"
                      style={{ width: '100%', height: '100%', minHeight: '240px', background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: 'var(--text)', resize: 'none', lineHeight: 1.7, fontFamily: "'Barlow', sans-serif", boxSizing: 'border-box' }} />
        }
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Notes</h2>
        <button onClick={createNote}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'var(--amber)', color: 'var(--bg)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
          <Plus size={13} /> New Note
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px', color: 'var(--text-faint)' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No notes yet</p>
            <button onClick={createNote}
                    style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--amber)', cursor: 'pointer' }}>
              Create your first note
            </button>
          </div>
        ) : notes.map(note => (
          <button key={note.id} onClick={() => setActiveId(note.id)}
                  style={{ width: '100%', textAlign: 'left', borderRadius: '10px', padding: '12px 14px', background: 'var(--bg-light)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>
                {note.title || 'Untitled'}
              </p>
              <span style={{ fontSize: '10px', color: 'var(--text-faint)', flexShrink: 0 }}>
                {fmtDate(note.updatedAt || note.createdAt)}
              </span>
            </div>
            {note.body && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {note.body.replace(/[#*`_~\[\]>$]/g, '').slice(0, 120)}
              </p>
            )}
            {(note.images || []).length > 0 && (
              <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Image size={10} color="var(--text-faint)" />
                <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                  {note.images.length} image{note.images.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
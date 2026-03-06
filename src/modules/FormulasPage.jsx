import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Trash2, X, Copy, Download, Wand2, Code2 } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { formulaCategories } from '../data/formulas'

function Math({ expr, block = false }) {
  if (!expr) return null
  try {
    const html = katex.renderToString(expr, { throwOnError: false, displayMode: block })
    return <span dangerouslySetInnerHTML={{ __html: html }} style={{ color: 'var(--amber)' }} />
  } catch {
    return <span style={{ color: 'var(--amber)', fontFamily: 'monospace' }}>{expr}</span>
  }
}

const SNIPPETS = [
  { label: 'frac',   insert: '\\frac{a}{b}' },
  { label: 'sqrt',   insert: '\\sqrt{x}' },
  { label: 'x²',     insert: 'x^{2}' },
  { label: 'xₙ',     insert: 'x_{n}' },
  { label: 'sum',    insert: '\\sum_{i=0}^{n}' },
  { label: 'pi',     insert: '\\pi' },
  { label: 'omega',  insert: '\\omega' },
  { label: 'Delta',  insert: '\\Delta' },
  { label: 'sqrt3',  insert: '\\sqrt{3}' },
  { label: 'approx', insert: '\\approx' },
  { label: 'times',  insert: '\\times' },
  { label: 'cdot',   insert: '\\cdot' },
  { label: 'Omega',  insert: '\\Omega' },
  { label: 'mu',     insert: '\\mu' },
  { label: 'theta',  insert: '\\theta' },
  { label: 'rho',    insert: '\\rho' },
  { label: 'phi',    insert: '\\phi' },
  { label: 'infty',  insert: '\\infty' },
]

const VISUAL_BLOCKS = [
  {
    group: 'Structure',
    blocks: [
      { label: '÷',  desc: 'Fraction',    build: () => ({ expr: '\\frac{□}{□}',          slots: ['Numerator', 'Denominator'] }) },
      { label: '√',  desc: 'Square root', build: () => ({ expr: '\\sqrt{□}',              slots: ['Expression'] }) },
      { label: 'xⁿ', desc: 'Power',       build: () => ({ expr: '□^{□}',                 slots: ['Base', 'Exponent'] }) },
      { label: 'xₙ', desc: 'Subscript',   build: () => ({ expr: '□_{□}',                 slots: ['Symbol', 'Subscript'] }) },
      { label: '( )',desc: 'Brackets',    build: () => ({ expr: '\\left(□\\right)',        slots: ['Expression'] }) },
      { label: '∑',  desc: 'Sum',         build: () => ({ expr: '\\sum_{□}^{□} □',        slots: ['From', 'To', 'Expression'] }) },
    ]
  },
  {
    group: 'Symbols',
    blocks: [
      { label: 'π',  desc: 'Pi',      insert: '\\pi' },
      { label: 'ω',  desc: 'Omega',   insert: '\\omega' },
      { label: 'Ω',  desc: 'Ohm',     insert: '\\Omega' },
      { label: 'Δ',  desc: 'Delta',   insert: '\\Delta' },
      { label: 'ρ',  desc: 'Rho',     insert: '\\rho' },
      { label: 'μ',  desc: 'Mu',      insert: '\\mu' },
      { label: 'θ',  desc: 'Theta',   insert: '\\theta' },
      { label: 'φ',  desc: 'Phi',     insert: '\\phi' },
      { label: 'η',  desc: 'Eta',     insert: '\\eta' },
      { label: '∞',  desc: 'Infinity',insert: '\\infty' },
      { label: '≈',  desc: 'Approx',  insert: '\\approx' },
      { label: '×',  desc: 'Times',   insert: '\\times' },
      { label: '·',  desc: 'Dot',     insert: '\\cdot' },
      { label: '√3', desc: 'Root 3',  insert: '\\sqrt{3}' },
      { label: '°',  desc: 'Degree',  insert: '^{\\circ}' },
      { label: '%',  desc: 'Percent', insert: '\\%' },
    ]
  },
]

function VisualBuilder({ value, onChange }) {
  const [slotDialog, setSlotDialog] = useState(null)

  const insertAt = (text) => {
    const ta = document.getElementById('visual-hidden-input')
    if (!ta) { onChange(value + text); return }
    const s = ta.selectionStart, e = ta.selectionEnd
    const next = value.slice(0, s) + text + value.slice(e)
    onChange(next)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + text.length, s + text.length) }, 10)
  }

  const handleBlock = (block) => {
    if (block.insert) { insertAt(block.insert); return }
    const built = block.build()
    setSlotDialog({ ...built, values: built.slots.map(() => ''), block })
  }

  const applySlots = () => {
    if (!slotDialog) return
    let expr = slotDialog.expr
    slotDialog.values.forEach(v => { expr = expr.replace('□', v || '{}') })
    insertAt(expr)
    setSlotDialog(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {VISUAL_BLOCKS.map(group => (
        <div key={group.group}>
          <p style={{ margin: '0 0 5px', fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {group.group}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {group.blocks.map(block => (
              <button key={block.desc} onClick={() => handleBlock(block)} title={block.desc}
                      style={{ minWidth: '36px', padding: '5px 8px', borderRadius: '6px', background: 'var(--bg-mid)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                <span>{block.label}</span>
                <span style={{ fontSize: '8px', color: 'var(--text-faint)' }}>{block.desc}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <textarea id="visual-hidden-input" value={value} onChange={e => onChange(e.target.value)}
                rows={2} placeholder="Formula builds here — or type directly…"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', fontFamily: 'monospace', outline: 'none', resize: 'none', width: '100%', boxSizing: 'border-box' }} />

      {slotDialog && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--amber)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            Fill in the parts for <strong style={{ color: 'var(--amber)' }}>{slotDialog.block.desc}</strong>:
          </p>
          {slotDialog.slots.map((slot, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-faint)', minWidth: '80px' }}>{slot}</label>
              <input value={slotDialog.values[i]}
                     onChange={e => {
                       const vals = [...slotDialog.values]
                       vals[i] = e.target.value
                       setSlotDialog({ ...slotDialog, values: vals })
                     }}
                     placeholder="e.g. V_1"
                     style={{ flex: 1, background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setSlotDialog(null)}
                    style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', background: 'var(--bg-mid)', color: 'var(--text)', fontSize: '12px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={applySlots}
                    style={{ flex: 2, padding: '7px', borderRadius: '7px', border: 'none', background: 'var(--amber)', color: 'var(--bg)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
              Insert
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const STORAGE_KEY = 'cie_custom_formulas_v1'
function loadCustom() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

function AddFormulaModal({ onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [expr, setExpr] = useState('')
  const [vars, setVars] = useState('')
  const [varsLatex, setVarsLatex] = useState(false)
  const [category, setCategory] = useState('Custom')
  const [mode, setMode] = useState('visual')

  const categories = [...formulaCategories.map(c => c.label), 'Custom']
  const canSave = title.trim() && expr.trim()

  const insertSnippet = (snippet) => {
    const ta = document.getElementById('latex-input')
    if (!ta) { setExpr(e => e + snippet); return }
    const s = ta.selectionStart, e2 = ta.selectionEnd
    const next = expr.slice(0, s) + snippet + expr.slice(e2)
    setExpr(next)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + snippet.length, s + snippet.length) }, 10)
  }

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
    borderRadius: '8px', padding: '9px 12px', fontSize: '14px', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }

  const labelStyle = {
    fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'monospace',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-light)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Add Formula</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', padding: '10px 16px', gap: '8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={() => setMode('visual')}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, fontSize: '12px', background: mode === 'visual' ? 'var(--amber)' : 'var(--bg-mid)', color: mode === 'visual' ? 'var(--bg)' : 'var(--text-muted)' }}>
            <Wand2 size={13} /> Visual Builder
          </button>
          <button onClick={() => setMode('latex')}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, fontSize: '12px', background: mode === 'latex' ? 'var(--amber)' : 'var(--bg-mid)', color: mode === 'latex' ? 'var(--bg)' : 'var(--text-muted)' }}>
            <Code2 size={13} /> LaTeX
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
                   placeholder="e.g. Transformer Turns Ratio" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Formula</label>
            {mode === 'visual' ? (
              <VisualBuilder value={expr} onChange={setExpr} />
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '4px' }}>
                  {SNIPPETS.map(s => (
                    <button key={s.label} onClick={() => insertSnippet(s.insert)}
                            style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontFamily: 'monospace', background: 'var(--bg-mid)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <textarea id="latex-input" value={expr} onChange={e => setExpr(e.target.value)}
                          placeholder={'e.g. \\frac{N_1}{N_2} = \\frac{V_1}{V_2}'} rows={3}
                          style={{ ...inputStyle, fontSize: '13px', fontFamily: 'monospace', resize: 'none' }} />
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Preview</label>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowX: 'auto' }}>
              {expr
                ? <Math expr={expr} block />
                : <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Preview appears here</span>
              }
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={labelStyle}>Variable descriptions <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <button onClick={() => setVarsLatex(v => !v)}
                      style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', border: `1px solid ${varsLatex ? 'var(--amber)' : 'var(--border)'}`, background: varsLatex ? 'rgba(245,158,11,0.1)' : 'var(--bg-mid)', color: varsLatex ? 'var(--amber)' : 'var(--text-faint)', cursor: 'pointer', fontFamily: 'monospace' }}>
                {varsLatex ? 'LaTeX ON' : 'LaTeX OFF'}
              </button>
            </div>
            <textarea value={vars} onChange={e => setVars(e.target.value)}
                      placeholder={varsLatex ? 'e.g. V_1 = primary\\ voltage,\\ N = turns' : 'e.g. V1 = primary voltage, N = turns'}
                      rows={2}
                      style={{ ...inputStyle, resize: 'none', fontFamily: varsLatex ? 'monospace' : "'Barlow', sans-serif", fontSize: '13px' }} />
            {varsLatex && vars && (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', overflowX: 'auto' }}>
                <Math expr={vars} />
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={() => canSave && onSave({ title: title.trim(), expr, vars, varsLatex, category })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: canSave ? 'var(--amber)' : 'var(--bg-mid)', color: canSave ? 'var(--bg)' : 'var(--text-faint)', fontWeight: 700, fontSize: '14px', cursor: canSave ? 'pointer' : 'default', transition: 'background 0.15s' }}>
            Save Formula
          </button>
        </div>
      </div>
    </div>
  )
}

function FormulaCard({ formula: f, onDelete }) {
  const [copied, setCopied] = useState(false)

  const copyLatex = async () => {
    try {
      await navigator.clipboard.writeText(f.expr || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const copyCard = async () => {
    const text = [f.title, f.expr, f.vars].filter(Boolean).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div style={{ borderRadius: '10px', padding: '12px 14px', background: 'var(--bg-light)', border: '1px solid var(--border)', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)', flex: 1, paddingRight: '8px' }}>{f.title}</p>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
          <button onClick={copyLatex} title="Copy LaTeX"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: copied ? 'var(--amber)' : 'var(--text-faint)' }}>
            <Copy size={12} />
          </button>
          <button onClick={copyCard} title="Copy as text"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-faint)' }}>
            <Download size={12} />
          </button>
          {onDelete && (
            <button onClick={() => onDelete(f.id)} title="Delete"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-faint)' }}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto', padding: '4px 0', marginBottom: '6px' }}>
        <Math expr={f.expr} block />
      </div>

      {f.vars && (
        <div style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.6 }}>
          {f.varsLatex ? <Math expr={f.vars} /> : <span>{f.vars}</span>}
        </div>
      )}

      {copied && (
        <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '10px', color: 'var(--amber)', fontFamily: 'monospace' }}>
          copied!
        </div>
      )}
    </div>
  )
}

export function FormulasPage() {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [customFormulas, setCustomFormulas] = useState(loadCustom)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(customFormulas)) }, [customFormulas])

  const saveFormula = (data) => {
    setCustomFormulas(prev => [...prev, { id: Date.now(), ...data, createdAt: new Date().toISOString() }])
    setShowAdd(false)
  }

  const deleteFormula = (id) => setCustomFormulas(prev => prev.filter(f => f.id !== id))

  const q = search.toLowerCase()

  const builtInCats = formulaCategories.map(cat => ({
    ...cat,
    formulas: cat.formulas
      .filter(f => !q || f.title.toLowerCase().includes(q) || (f.expr || '').toLowerCase().includes(q))
      .map(f => ({ ...f, isBuiltIn: true })),
  }))

  const customByCat = customFormulas.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = []
    acc[f.category].push(f)
    return acc
  }, {})

  const allCats = builtInCats.map(cat => ({
    ...cat,
    formulas: [...cat.formulas, ...(customByCat[cat.label] || []).filter(f => !q || f.title.toLowerCase().includes(q))],
  }))

  const builtInLabels = formulaCategories.map(c => c.label)
  Object.entries(customByCat).forEach(([label, formulas]) => {
    if (!builtInLabels.includes(label)) {
      allCats.push({ id: label.toLowerCase(), label, formulas: formulas.filter(f => !q || f.title.toLowerCase().includes(q)) })
    }
  })

  const filtered = allCats
    .filter(cat => activeCat === 'all' || cat.id === activeCat || cat.label === activeCat)
    .filter(cat => cat.formulas.length > 0)

  const catButtons = [{ id: 'all', label: 'All' }, ...allCats.filter(c => c.formulas.length > 0)]
    .filter((c, i, arr) => arr.findIndex(x => x.label === c.label) === i)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      <div style={{ flexShrink: 0, padding: '10px 12px 8px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search formulas…"
                   style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-light)', color: 'var(--text)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button onClick={() => setShowAdd(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'var(--amber)', color: 'var(--bg)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
            <Plus size={13} /> Add
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {catButtons.map(cat => {
            const active = activeCat === (cat.id || cat.label.toLowerCase())
            return (
              <button key={cat.id || cat.label} onClick={() => setActiveCat(cat.id || cat.label.toLowerCase())}
                      style={{ flexShrink: 0, padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: `1px solid ${active ? 'var(--amber)' : 'var(--border)'}`, background: active ? 'var(--amber)' : 'var(--bg-light)', color: active ? 'var(--bg)' : 'var(--text-muted)' }}>
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '14px', marginTop: '40px' }}>
            No formulas match your search
          </div>
        ) : filtered.map(cat => (
          <div key={cat.id || cat.label}>
            <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 600, color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {cat.label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cat.formulas.map(f => (
                <FormulaCard key={f.id || f.title} formula={f} onDelete={!f.isBuiltIn ? deleteFormula : null} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddFormulaModal onSave={saveFormula} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
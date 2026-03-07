import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react'

const STORAGE_KEY = 'cie_calibrations_v1'
function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] } }
function save(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) }

const TYPES = [
  {
    id: '4-20ma',
    label: '4-20 mA Transmitter',
    inputUnit: 'mA',
    defaultPoints: [4, 8, 12, 16, 20],
    tolerance: 0.1,
    calcExpected: (mA) => mA,
  },
  {
    id: 'pressure',
    label: 'Pressure Gauge',
    inputUnit: 'kPa',
    defaultPoints: [0, 25, 50, 75, 100],
    tolerance: 1.0,
    calcExpected: (pct, lo, hi) => lo + (pct / 100) * (hi - lo),
  },
  {
    id: 'temperature',
    label: 'Temperature (RTD/TC)',
    inputUnit: '°C',
    defaultPoints: [0, 25, 50, 75, 100],
    tolerance: 0.5,
    calcExpected: (pct, lo, hi) => lo + (pct / 100) * (hi - lo),
  },
  {
    id: 'flow',
    label: 'Flow Meter',
    inputUnit: '%',
    defaultPoints: [0, 25, 50, 75, 100],
    tolerance: 0.5,
    calcExpected: (pct) => 4 + (pct / 100) * 16,
  },
  {
    id: 'positioner',
    label: 'Valve Positioner',
    inputUnit: 'mA',
    defaultPoints: [4, 8, 12, 16, 20],
    tolerance: 2.0,
    calcExpected: (mA) => ((mA - 4) / 16) * 100,
  },
]

function getType(id) { return TYPES.find(t => t.id === id) || TYPES[0] }

function PassBadge({ pass }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, background: pass ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: pass ? '#4ade80' : '#f87171' }}>
      {pass ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {pass ? 'PASS' : 'FAIL'}
    </span>
  )
}

function NewCalibration({ onSave, onClose }) {
  const [step, setStep] = useState(0)
  const [typeId, setTypeId] = useState('4-20ma')
  const [tag, setTag] = useState('')
  const [tech, setTech] = useState('')
  const [lo, setLo] = useState('0')
  const [hi, setHi] = useState('100')
  const [tolerance, setTolerance] = useState('')
  const [notes, setNotes] = useState('')
  const [asFound, setAsFound] = useState([])
  const [asLeft, setAsLeft] = useState([])
  const [customPoints, setCustomPoints] = useState('')

  const type = getType(typeId)
  const tol = parseFloat(tolerance) || type.tolerance

  const getPoints = () => {
    if (customPoints.trim()) {
      return customPoints.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
    }
    if (['pressure', 'temperature'].includes(typeId)) {
      return type.defaultPoints.map(pct => type.calcExpected(pct, parseFloat(lo), parseFloat(hi)))
    }
    return type.defaultPoints
  }

  const initRows = (setter) => {
    const pts = getPoints()
    setter(pts.map(pt => {
      let expected
      if (typeId === '4-20ma') expected = pt
      else if (typeId === 'flow') expected = type.calcExpected(pt)
      else if (typeId === 'positioner') expected = type.calcExpected(pt)
      else expected = pt
      return { input: pt.toFixed(2), expected: expected.toFixed(2), measured: '' }
    }))
  }

  const goToAsFound = () => { initRows(setAsFound); setStep(1) }
  const goToAsLeft = () => { initRows(rows => setAsLeft(rows.map((r, i) => ({ ...r, measured: asFound[i]?.measured || '' })))); setStep(2) }

  const updateRow = (setter, idx, val) =>
    setter(prev => prev.map((r, i) => i === idx ? { ...r, measured: val } : r))

  const checkPass = (rows) => rows.every(r => {
    const m = parseFloat(r.measured), e = parseFloat(r.expected)
    return !isNaN(m) && Math.abs(m - e) <= tol
  })

  const finish = () => {
    onSave({
      id: Date.now(), typeId,
      tag: tag.trim() || 'Untagged',
      tech: tech.trim(), lo: parseFloat(lo), hi: parseFloat(hi),
      tolerance: tol, notes, asFound, asLeft,
      asFoundPass: checkPass(asFound),
      asLeftPass: checkPass(asLeft),
      createdAt: new Date().toISOString(),
    })
  }

  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl = (t) => <label style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>{t}</label>

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-light)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', maxHeight: '94vh', overflow: 'hidden' }}>

        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>New Calibration</h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-faint)' }}>
              {step === 0 ? 'Step 1 of 3 — Setup' : step === 1 ? 'Step 2 of 3 — As-Found' : 'Step 3 of 3 — As-Left'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: '18px' }}>✕</button>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', padding: '8px 16px', gap: '6px' }}>
          {[0,1,2].map(s => (
            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= step ? 'var(--amber)' : 'var(--border)' }} />
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {step === 0 && <>
            <div>
              {lbl('Instrument Type')}
              <select value={typeId} onChange={e => setTypeId(e.target.value)} style={inputStyle}>
                {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              {lbl('Tag / ID')}
              <input value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. PT-101, TT-204" style={inputStyle} />
            </div>
            <div>
              {lbl('Technician')}
              <input value={tech} onChange={e => setTech(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
            {['pressure', 'temperature'].includes(typeId) && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  {lbl(`Lower Range (${type.inputUnit})`)}
                  <input value={lo} onChange={e => setLo(e.target.value)} type="number" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  {lbl(`Upper Range (${type.inputUnit})`)}
                  <input value={hi} onChange={e => setHi(e.target.value)} type="number" style={inputStyle} />
                </div>
              </div>
            )}
            <div>
              {lbl(`Tolerance (±${type.inputUnit})`)}
              <input value={tolerance} onChange={e => setTolerance(e.target.value)} type="number" placeholder={`Default: ${type.tolerance}`} style={inputStyle} />
            </div>
            <div>
              {lbl('Custom test points (comma separated, optional)')}
              <input value={customPoints} onChange={e => setCustomPoints(e.target.value)} placeholder={`e.g. ${type.defaultPoints.join(', ')}`} style={inputStyle} />
            </div>
            <div>
              {lbl('Notes')}
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                        placeholder="Location, ambient conditions, equipment used…"
                        style={{ ...inputStyle, resize: 'none', fontFamily: "'Barlow', sans-serif" }} />
            </div>
          </>}

          {(step === 1 || step === 2) && (() => {
            const rows = step === 1 ? asFound : asLeft
            const setter = step === 1 ? setAsFound : setAsLeft
            return (
              <>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  {step === 1 ? 'Record readings before any adjustment.' : 'Record readings after adjustment.'}
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        {['Input', 'Expected', 'Measured', 'Error', ''].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-faint)', fontSize: '10px', fontFamily: 'monospace', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => {
                        const m = parseFloat(row.measured)
                        const e = parseFloat(row.expected)
                        const err = !isNaN(m) ? m - e : null
                        const pass = err !== null ? Math.abs(err) <= tol : null
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{row.input}</td>
                            <td style={{ padding: '6px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{row.expected}</td>
                            <td style={{ padding: '4px 6px' }}>
                              <input value={row.measured} onChange={e2 => updateRow(setter, i, e2.target.value)}
                                     type="number" inputMode="decimal" placeholder="—"
                                     style={{ width: '70px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', padding: '5px 7px', fontSize: '12px', outline: 'none' }} />
                            </td>
                            <td style={{ padding: '6px 8px', color: err !== null ? (pass ? '#4ade80' : '#f87171') : 'var(--text-faint)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                              {err !== null ? (err >= 0 ? '+' : '') + err.toFixed(3) : '—'}
                            </td>
                            <td style={{ padding: '6px 4px' }}>
                              {pass !== null && <PassBadge pass={pass} />}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Tolerance: ±{tol} {type.inputUnit}</div>
              </>
            )
          })()}
        </div>

        <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
                    style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-mid)', color: 'var(--text)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              Back
            </button>
          )}
          {step < 2 ? (
            <button onClick={step === 0 ? goToAsFound : goToAsLeft}
                    style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--amber)', color: 'var(--bg)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              Next →
            </button>
          ) : (
            <button onClick={finish}
                    style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--amber)', color: 'var(--bg)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              Save Record
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CalibRecord({ record, onBack, onDelete }) {
  const type = getType(record.typeId)
  const [copied, setCopied] = useState(false)

  const fmtDate = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const copyReport = async () => {
    const fmt = (rows) => rows.map(r => {
      const err = r.measured ? ((parseFloat(r.measured) - parseFloat(r.expected)) >= 0 ? '+' : '') + (parseFloat(r.measured) - parseFloat(r.expected)).toFixed(3) : '—'
      return `  ${r.input}\t${r.expected}\t${r.measured || '—'}\t${err}`
    }).join('\n')
    const text = [
      `CALIBRATION RECORD`,
      `==================`,
      `Tag:        ${record.tag}`,
      `Type:       ${type.label}`,
      `Tech:       ${record.tech || 'N/A'}`,
      `Date:       ${fmtDate(record.createdAt)}`,
      `Tolerance:  ±${record.tolerance} ${type.inputUnit}`,
      record.notes ? `Notes:      ${record.notes}` : null,
      ``,
      `AS-FOUND — ${record.asFoundPass ? 'PASS' : 'FAIL'}`,
      `  Input\tExpected\tMeasured\tError`,
      fmt(record.asFound),
      ``,
      `AS-LEFT — ${record.asLeftPass ? 'PASS' : 'FAIL'}`,
      `  Input\tExpected\tMeasured\tError`,
      fmt(record.asLeft),
    ].filter(l => l !== null).join('\n')
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  const ReadingTable = ({ rows }) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            {['Input', 'Expected', 'Measured', 'Error', ''].map(h => (
              <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-faint)', fontSize: '10px', fontFamily: 'monospace', borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const m = parseFloat(row.measured), e = parseFloat(row.expected)
            const err = !isNaN(m) ? m - e : null
            const pass = err !== null ? Math.abs(err) <= record.tolerance : null
            return (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{row.input}</td>
                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{row.expected}</td>
                <td style={{ padding: '6px 8px', color: 'var(--text)', fontWeight: 500 }}>{row.measured || '—'}</td>
                <td style={{ padding: '6px 8px', color: pass !== null ? (pass ? '#4ade80' : '#f87171') : 'var(--text-faint)', fontFamily: 'monospace' }}>
                  {err !== null ? (err >= 0 ? '+' : '') + err.toFixed(3) : '—'}
                </td>
                <td style={{ padding: '6px 4px' }}>{pass !== null && <PassBadge pass={pass} />}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '2px' }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{record.tag}</p>
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-faint)' }}>{type.label} · {fmtDate(record.createdAt)}</p>
        </div>
        <button onClick={copyReport} title="Copy report"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: copied ? 'var(--amber)' : 'var(--text-faint)' }}>
          <Copy size={15} />
        </button>
        <button onClick={() => onDelete(record.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#ef4444' }}>
          <Trash2 size={15} />
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase' }}>As-Found</p>
            <PassBadge pass={record.asFoundPass} />
          </div>
          <div style={{ flex: 1, background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase' }}>As-Left</p>
            <PassBadge pass={record.asLeftPass} />
          </div>
          <div style={{ flex: 1, background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase' }}>Tolerance</p>
            <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>±{record.tolerance}</span>
          </div>
        </div>

        {(record.tech || record.notes) && (
          <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {record.tech && <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Tech: <strong style={{ color: 'var(--text)' }}>{record.tech}</strong></p>}
            {record.notes && <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{record.notes}</p>}
          </div>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>As-Found</p>
            <PassBadge pass={record.asFoundPass} />
          </div>
          <ReadingTable rows={record.asFound} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>As-Left</p>
            <PassBadge pass={record.asLeftPass} />
          </div>
          <ReadingTable rows={record.asLeft} />
        </div>
      </div>
    </div>
  )
}

export function CalibrationPage() {
  const [records, setRecords] = useState(load)
  const [showNew, setShowNew] = useState(false)
  const [activeId, setActiveId] = useState(null)

  useEffect(() => save(records), [records])

  const saveRecord = (r) => { setRecords(prev => [r, ...prev]); setShowNew(false) }
  const deleteRecord = (id) => { setRecords(prev => prev.filter(r => r.id !== id)); setActiveId(null) }

  const active = records.find(r => r.id === activeId)
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  if (active) return <CalibRecord record={active} onBack={() => setActiveId(null)} onDelete={deleteRecord} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Calibrations</h2>
        <button onClick={() => setShowNew(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'var(--amber)', color: 'var(--bg)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
          <Plus size={13} /> New
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {records.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px', color: 'var(--text-faint)' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No calibration records yet</p>
            <button onClick={() => setShowNew(true)}
                    style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--amber)', cursor: 'pointer' }}>
              Start first calibration
            </button>
          </div>
        ) : records.map(r => {
          const type = getType(r.typeId)
          const overallPass = r.asFoundPass && r.asLeftPass
          return (
            <button key={r.id} onClick={() => setActiveId(r.id)}
                    style={{ width: '100%', textAlign: 'left', borderRadius: '10px', padding: '12px 14px', background: 'var(--bg-light)', border: `1px solid ${overallPass ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{r.tag}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-faint)' }}>{type.label}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <PassBadge pass={overallPass} />
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{fmtDate(r.createdAt)}</span>
                </div>
              </div>
              {r.tech && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-faint)' }}>Tech: {r.tech}</p>}
            </button>
          )
        })}
      </div>

      {showNew && <NewCalibration onSave={saveRecord} onClose={() => setShowNew(false)} />}
    </div>
  )
}
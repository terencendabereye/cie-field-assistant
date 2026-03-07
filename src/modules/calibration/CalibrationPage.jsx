import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, Trash2, Copy, CheckCircle, XCircle, Pencil, FileText, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'

const STORAGE_KEY = 'cie_calibrations_v1'
function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] } }
function save(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) }

// ── Instrument types ──────────────────────────────────────────────
// outputMode:
//   'mA'     — engineering unit input, 4-20 mA output (expected mA = 4 + pct*16)
//   'direct' — compare instrument reading directly to reference (e.g. gauge vs reference)
//   'switch' — trip / reset points only, no multi-point table
const PCT_POINTS_5 = [0, 25, 50, 75, 100]

const TYPES = [
  {
    id: 'pressure-tx',
    label: 'Pressure Transmitter',
    desc: 'Apply reference pressure, measure mA output',
    outputMode: 'mA',
    inputUnitSuggestions: ['bar', 'kPa', 'MPa', 'psi', 'inH2O', 'mmHg'],
    defaultInputUnit: 'bar',
    defaultPoints: PCT_POINTS_5,
    defaultTol: 2,
    defaultTolMode: 'pct',
    isSwitch: false,
  },
  {
    id: 'pressure-gauge',
    label: 'Pressure Gauge (Analog)',
    desc: 'Compare gauge reading to reference pressure',
    outputMode: 'direct',
    inputUnitSuggestions: ['bar', 'kPa', 'MPa', 'psi', 'inH2O', 'mmHg'],
    defaultInputUnit: 'bar',
    defaultPoints: PCT_POINTS_5,
    defaultTol: 2,
    defaultTolMode: 'pct',
    isSwitch: false,
  },
  {
    id: 'pressure-switch',
    label: 'Pressure Switch',
    desc: 'Records trip and reset points only',
    outputMode: 'switch',
    inputUnitSuggestions: ['bar', 'kPa', 'MPa', 'psi', 'inH2O', 'mmHg'],
    defaultInputUnit: 'bar',
    defaultTol: 2,
    defaultTolMode: 'pct',
    isSwitch: true,
  },
  {
    id: 'level-tx',
    label: 'Level Transmitter',
    desc: 'Apply reference level, measure mA output',
    outputMode: 'mA',
    inputUnitSuggestions: ['m', 'mm', '%', 'mH2O', 'inH2O', 'ft'],
    defaultInputUnit: 'm',
    defaultPoints: PCT_POINTS_5,
    defaultTol: 2,
    defaultTolMode: 'pct',
    isSwitch: false,
  },
]

function getType(id) { return TYPES.find(t => t.id === id) || TYPES[0] }

// ── Error calculation helpers ─────────────────────────────────────
function calcError(measured, expected) {
  const m = parseFloat(measured), e = parseFloat(expected)
  if (isNaN(m) || isNaN(e)) return null
  return m - e
}

function calcPctError(err, span) {
  if (err === null || !span) return null
  return (err / span) * 100
}

function isPass(err, tol, tolMode, span) {
  if (err === null) return null
  if (tolMode === 'pct') return Math.abs(calcPctError(err, span)) <= tol
  return Math.abs(err) <= tol
}

function getSpan(lo, hi) { return Math.abs(parseFloat(hi) - parseFloat(lo)) || 1 }

// ── Pass badge ────────────────────────────────────────────────────
function PassBadge({ pass }) {
  if (pass === null || pass === undefined) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, background: pass ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: pass ? '#4ade80' : '#f87171' }}>
      {pass ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {pass ? 'PASS' : 'FAIL'}
    </span>
  )
}

// ── Reading table ─────────────────────────────────────────────────
// mA types:     Input (eng. unit) | Exp. mA  | Meas. mA | Err%
// direct types: Input (reference) | Expected | Measured | Err%
function ReadingTable({ rows, onChange, tol, tolMode, lo, hi, type, readOnly = false }) {
  const span = getSpan(lo, hi)
  const isMa = type?.outputMode === 'mA'
  const inputUnit = type?.selectedUnit || type?.defaultInputUnit || ''
  // For mA output the relevant span for % error is always 16 mA (4→20)
  const outputSpan = isMa ? 16 : span

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-faint)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>Input ({inputUnit})</th>
            <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-faint)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{isMa ? 'Exp. mA' : 'Expected'}</th>
            <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-faint)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{isMa ? 'Meas. mA' : 'Measured'}</th>
            <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-faint)', fontFamily: 'monospace' }}>Err%</th>
            <th style={{ padding: '5px 4px' }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const err = calcError(row.measured, row.expected)
            const pctErr = calcPctError(err, outputSpan)
            const pass = isPass(err, tol, tolMode, outputSpan)
            return (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '4px 6px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{row.input}</td>
                <td style={{ padding: '4px 6px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{row.expected}</td>
                <td style={{ padding: '3px 4px' }}>
                  {readOnly
                    ? <span style={{ color: 'var(--text)', fontWeight: 500 }}>{row.measured || '—'}</span>
                    : <input value={row.measured} onChange={e => onChange(i, 'measured', e.target.value)}
                             type="number" inputMode="decimal" placeholder="—"
                             style={{ width: '66px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '5px', padding: '4px 6px', fontSize: '11px', outline: 'none' }} />
                  }
                </td>
                <td style={{ padding: '4px 6px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  <span style={{ color: pass !== null ? (pass ? '#4ade80' : '#f87171') : 'var(--text-faint)', fontSize: '10px' }}>
                    {pctErr !== null ? (pctErr >= 0 ? '+' : '') + pctErr.toFixed(2) + '%' : '—'}
                  </span>
                </td>
                <td style={{ padding: '4px 3px' }}><PassBadge pass={pass} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Switch calibration table ──────────────────────────────────────
function SwitchTable({ data, onChange, readOnly, unit, setpoint, reset, tol, tolMode }) {
  const fields = [
    { key: 'tripUp',    label: 'Trip (↑)',  desc: 'Trip point on increasing pressure' },
    { key: 'resetUp',   label: 'Reset (↑)', desc: 'Reset point on increasing pressure' },
    { key: 'tripDown',  label: 'Trip (↓)',  desc: 'Trip point on decreasing pressure' },
    { key: 'resetDown', label: 'Reset (↓)', desc: 'Reset point on decreasing pressure' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {fields.map(f => {
        const val = data?.[f.key] || ''
        const sp = parseFloat(f.key.startsWith('trip') ? setpoint : reset)
        const err = val ? parseFloat(val) - sp : null
        const span = Math.abs(parseFloat(setpoint) - parseFloat(reset)) || 1
        const pass = isPass(err, tol, tolMode, span)
        const pctErr = calcPctError(err, span)
        return (
          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ minWidth: '80px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>{f.label}</p>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-faint)' }}>{f.desc}</p>
            </div>
            <div style={{ flex: 1 }}>
              {readOnly
                ? <span style={{ color: 'var(--text)', fontSize: '12px' }}>{val || '—'} {unit}</span>
                : <input value={val} onChange={e => onChange(f.key, e.target.value)}
                         type="number" inputMode="decimal" placeholder={`e.g. ${sp || '—'}`}
                         style={{ width: '80px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', outline: 'none' }} />
              }
            </div>
            {err !== null && (
              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: pass ? '#4ade80' : '#f87171' }}>
                {pctErr !== null ? (pctErr >= 0 ? '+' : '') + pctErr.toFixed(2) + '%' : ''}
              </span>
            )}
            <PassBadge pass={err !== null ? pass : null} />
          </div>
        )
      })}
    </div>
  )
}

// ── Overall error summary ─────────────────────────────────────────
function calcOverallError(rows, tol, tolMode, lo, hi, outputMode) {
  const span = getSpan(lo, hi)
  const outputSpan = outputMode === 'mA' ? 16 : span
  let maxAbsErr = 0, maxPctErr = 0, allPass = true
  rows.forEach(row => {
    const err = calcError(row.measured, row.expected)
    if (err !== null) {
      const abs = Math.abs(err)
      const pct = Math.abs(calcPctError(err, outputSpan))
      if (abs > maxAbsErr) maxAbsErr = abs
      if (pct > maxPctErr) maxPctErr = pct
      if (!isPass(err, tol, tolMode, outputSpan)) allPass = false
    }
  })
  return { maxAbsErr: maxAbsErr.toFixed(4), maxPctErr: maxPctErr.toFixed(2), allPass }
}

// ── Calibration wizard (new + edit) ──────────────────────────────
function CalibWizard({ onSave, onClose, existing = null }) {
  const isEdit = !!existing

  const [step, setStep] = useState(0)
  const [typeId, setTypeId] = useState(existing?.typeId || 'pressure-tx')
  const [tag, setTag] = useState(existing?.tag || '')
  const [tech, setTech] = useState(existing?.tech || '')
  const [location, setLocation] = useState(existing?.location || '')
  const [lo, setLo] = useState(String(existing?.lo ?? '0'))
  const [hi, setHi] = useState(String(existing?.hi ?? '100'))
  const [unit, setUnit] = useState(existing?.unit || '')
  const [tol, setTol] = useState(String(existing?.tol ?? 2))
  const [tolMode, setTolMode] = useState(existing?.tolMode || 'pct')
  const [notes, setNotes] = useState(existing?.notes || '')
  const [lastCal, setLastCal] = useState(existing?.lastCal || '')
  const [nextCal, setNextCal] = useState(existing?.nextCal || '')
  const [customPoints, setCustomPoints] = useState('')
  const [setpoint, setSetpoint] = useState(String(existing?.setpoint ?? ''))
  const [resetPoint, setResetPoint] = useState(String(existing?.resetPoint ?? ''))
  const [asFoundSwitch, setAsFoundSwitch] = useState(existing?.asFoundSwitch || {})
  const [asLeftSwitch, setAsLeftSwitch] = useState(existing?.asLeftSwitch || {})
  const [asFound, setAsFound] = useState(existing?.asFound || [])
  const [asLeft, setAsLeft] = useState(existing?.asLeft || [])

  const type = getType(typeId)
  const tolVal = parseFloat(tol) || 2
  const effectiveUnit = unit.trim() || type.defaultInputUnit || ''

  const getPoints = () => {
    if (customPoints.trim()) {
      return customPoints.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
    }
    return type.defaultPoints || PCT_POINTS_5
  }

  const buildRows = () => {
    const pts = getPoints()
    const loN = parseFloat(lo), hiN = parseFloat(hi)
    const span = hiN - loN
    return pts.map(pt => {
      // pt = % of span (0–100). Calculate the actual engineering value at that %
      const inputVal = (loN + (pt / 100) * span).toFixed(3)
      if (type.outputMode === 'mA') {
        // Expected mA output for this % of span
        const expectedMa = (4 + (pt / 100) * 16).toFixed(3)
        return { input: inputVal, expected: expectedMa, measured: '' }
      } else {
        // Direct: instrument should read same value as reference
        return { input: inputVal, expected: inputVal, measured: '' }
      }
    })
  }

  const goToAsFound = () => { if (!type.isSwitch) setAsFound(buildRows()); setStep(1) }
  const goToAsLeft = () => {
    if (!type.isSwitch) {
      const rows = buildRows().map((r, i) => ({ ...r, measured: asFound[i]?.measured || '' }))
      setAsLeft(rows)
    }
    setStep(2)
  }

  const updateRow = (setter, idx, field, val) =>
    setter(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))

  const checkRowsPass = (rows) => {
    const span = getSpan(lo, hi)
    const outputSpan = type.outputMode === 'mA' ? 16 : span
    return rows.every(r => {
      const e = calcError(r.measured, r.expected)
      return isPass(e, tolVal, tolMode, outputSpan) !== false
    })
  }

  const checkSwitchPass = (sw) => {
    const sp = parseFloat(setpoint), rp = parseFloat(resetPoint)
    const span = Math.abs(sp - rp) || 1
    const expected = { tripUp: sp, resetUp: rp, tripDown: sp, resetDown: rp }
    return Object.entries(expected).every(([k, exp]) => {
      const err = sw[k] ? parseFloat(sw[k]) - exp : null
      return err === null || isPass(err, tolVal, tolMode, span) !== false
    })
  }

  const finish = () => {
    onSave({
      id: existing?.id || Date.now(),
      typeId,
      tag: tag.trim() || 'Untagged',
      tech: tech.trim(),
      location: location.trim(),
      lo: parseFloat(lo),
      hi: parseFloat(hi),
      unit: effectiveUnit,
      tol: tolVal,
      tolMode,
      notes,
      lastCal,
      nextCal,
      setpoint: parseFloat(setpoint),
      resetPoint: parseFloat(resetPoint),
      asFound: type.isSwitch ? [] : asFound,
      asLeft: type.isSwitch ? [] : asLeft,
      asFoundSwitch: type.isSwitch ? asFoundSwitch : {},
      asLeftSwitch: type.isSwitch ? asLeftSwitch : {},
      asFoundPass: type.isSwitch ? checkSwitchPass(asFoundSwitch) : checkRowsPass(asFound),
      asLeftPass: type.isSwitch ? checkSwitchPass(asLeftSwitch) : checkRowsPass(asLeft),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  const iS = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl = (t) => <label style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '4px' }}>{t}</label>

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-light)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', maxHeight: '94vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{isEdit ? 'Edit Calibration' : 'New Calibration'}</h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-faint)' }}>
              {step === 0 ? 'Step 1/3 — Setup' : step === 1 ? 'Step 2/3 — As-Found' : 'Step 3/3 — As-Left'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: '18px' }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ flexShrink: 0, display: 'flex', padding: '8px 16px', gap: '6px' }}>
          {[0,1,2].map(s => <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= step ? 'var(--amber)' : 'var(--border)' }} />)}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* ── Step 0: Setup ── */}
          {step === 0 && <>

            {/* Instrument type */}
            <div>
              {lbl('Instrument Type')}
              <select value={typeId} onChange={e => { setTypeId(e.target.value); setUnit('') }} style={iS}>
                {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'var(--text-faint)' }}>{type.desc}</p>
            </div>

            {/* Tag + Location */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                {lbl('Tag / ID')}
                <input value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. PT-101" style={iS} />
              </div>
              <div style={{ flex: 1 }}>
                {lbl('Location')}
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Unit 3" style={iS} />
              </div>
            </div>

            {/* Technician */}
            <div>
              {lbl('Technician')}
              <input value={tech} onChange={e => setTech(e.target.value)} placeholder="Your name" style={iS} />
            </div>

            {/* Engineering unit — free text with datalist suggestions */}
            <div>
              {lbl('Engineering Unit')}
              <input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder={type.defaultInputUnit}
                list={`unit-list-${typeId}`}
                style={iS}
              />
              <datalist id={`unit-list-${typeId}`}>
                {(type.inputUnitSuggestions || []).map(u => <option key={u} value={u} />)}
              </datalist>
              <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'var(--text-faint)' }}>
                Suggestions: {type.inputUnitSuggestions?.join(', ')}. Type anything you need.
              </p>
            </div>

            {/* Range (not for switch) */}
            {!type.isSwitch && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  {lbl(`Lower Range (${effectiveUnit})`)}
                  <input value={lo} onChange={e => setLo(e.target.value)} type="number" style={iS} />
                </div>
                <div style={{ flex: 1 }}>
                  {lbl(`Upper Range (${effectiveUnit})`)}
                  <input value={hi} onChange={e => setHi(e.target.value)} type="number" style={iS} />
                </div>
              </div>
            )}

            {/* Switch setpoints */}
            {type.isSwitch && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  {lbl(`Setpoint (${effectiveUnit})`)}
                  <input value={setpoint} onChange={e => setSetpoint(e.target.value)} type="number" style={iS} />
                </div>
                <div style={{ flex: 1 }}>
                  {lbl(`Reset Point (${effectiveUnit})`)}
                  <input value={resetPoint} onChange={e => setResetPoint(e.target.value)} type="number" style={iS} />
                </div>
              </div>
            )}

            {/* Tolerance */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                {lbl('Tolerance')}
                <input value={tol} onChange={e => setTol(e.target.value)} type="number" step="0.1" style={iS} />
              </div>
              <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                {['pct', 'abs'].map(m => (
                  <button key={m} onClick={() => setTolMode(m)}
                          style={{ padding: '9px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: tolMode === m ? 'var(--amber)' : 'var(--bg-mid)', color: tolMode === m ? 'var(--bg)' : 'var(--text-muted)' }}>
                    {m === 'pct' ? '%' : effectiveUnit || 'abs'}
                  </button>
                ))}
              </div>
            </div>
            <p style={{ margin: '-6px 0 0', fontSize: '10px', color: 'var(--text-faint)' }}>
              {tolMode === 'pct' ? `±${tol}% of output span` : `±${tol} ${effectiveUnit} absolute`}
            </p>

            {/* Cal dates */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                {lbl('Last Cal. Date')}
                <input value={lastCal} onChange={e => setLastCal(e.target.value)} type="date" style={iS} />
              </div>
              <div style={{ flex: 1 }}>
                {lbl('Next Cal. Date')}
                <input value={nextCal} onChange={e => setNextCal(e.target.value)} type="date" style={iS} />
              </div>
            </div>

            {/* Custom test points */}
            {!type.isSwitch && (
              <div>
                {lbl('Custom test points % (comma-separated, optional)')}
                <input value={customPoints} onChange={e => setCustomPoints(e.target.value)} placeholder="Default: 0, 25, 50, 75, 100" style={iS} />
              </div>
            )}

            {/* Notes */}
            <div>
              {lbl('Notes')}
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                        placeholder="Ambient conditions, equipment serial numbers, reference instrument…"
                        style={{ ...iS, resize: 'none', fontFamily: "'Barlow', sans-serif" }} />
            </div>
          </>}

          {/* ── Step 1: As-Found ── */}
          {step === 1 && <>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Record readings <strong style={{ color: 'var(--text)' }}>before</strong> any adjustment.
            </p>
            {type.isSwitch
              ? <SwitchTable data={asFoundSwitch} onChange={(k, v) => setAsFoundSwitch(p => ({ ...p, [k]: v }))}
                             unit={effectiveUnit} setpoint={setpoint} reset={resetPoint} tol={tolVal} tolMode={tolMode} />
              : <ReadingTable rows={asFound} onChange={(i, f, v) => updateRow(setAsFound, i, f, v)}
                              tol={tolVal} tolMode={tolMode} lo={lo} hi={hi}
                              type={{ ...type, selectedUnit: effectiveUnit }} />
            }
            <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-faint)' }}>
              Tolerance: ±{tol}{tolMode === 'pct' ? '% of output span' : ` ${effectiveUnit}`}
            </p>
          </>}

          {/* ── Step 2: As-Left ── */}
          {step === 2 && <>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Record readings <strong style={{ color: 'var(--text)' }}>after</strong> adjustment.
            </p>
            {type.isSwitch
              ? <SwitchTable data={asLeftSwitch} onChange={(k, v) => setAsLeftSwitch(p => ({ ...p, [k]: v }))}
                             unit={effectiveUnit} setpoint={setpoint} reset={resetPoint} tol={tolVal} tolMode={tolMode} />
              : <ReadingTable rows={asLeft} onChange={(i, f, v) => updateRow(setAsLeft, i, f, v)}
                              tol={tolVal} tolMode={tolMode} lo={lo} hi={hi}
                              type={{ ...type, selectedUnit: effectiveUnit }} />
            }
            <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-faint)' }}>
              Tolerance: ±{tol}{tolMode === 'pct' ? '% of output span' : ` ${effectiveUnit}`}
            </p>
          </>}
        </div>

        {/* Footer buttons */}
        <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
                    style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-mid)', color: 'var(--text)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              Back
            </button>
          )}
          {step < 2
            ? <button onClick={step === 0 ? goToAsFound : goToAsLeft}
                      style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--amber)', color: 'var(--bg)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                Next →
              </button>
            : <button onClick={finish}
                      style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--amber)', color: 'var(--bg)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                {isEdit ? 'Save Changes' : 'Save Record'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}

// ── Text report builder ───────────────────────────────────────────
function buildTextReport(r) {
  const type = getType(r.typeId)
  const outputMode = type.outputMode
  const span = getSpan(r.lo, r.hi)
  const outputSpan = outputMode === 'mA' ? 16 : span
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'

  const rowLine = (row) => {
    const err = calcError(row.measured, row.expected)
    const pct = calcPctError(err, outputSpan)
    const errStr = pct !== null ? (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%' : '—'
    return `  ${row.input} ${r.unit}\t${row.expected}\t${row.measured || '—'}\t${errStr}`
  }

  const afErr = !type.isSwitch ? calcOverallError(r.asFound || [], r.tol, r.tolMode, r.lo, r.hi, outputMode) : null
  const alErr = !type.isSwitch ? calcOverallError(r.asLeft || [], r.tol, r.tolMode, r.lo, r.hi, outputMode) : null

  const hdr = outputMode === 'mA'
    ? `  Input (${r.unit})\tExp. mA\tMeas. mA\tErr%`
    : `  Input (${r.unit})\tExpected\tMeasured\tErr%`

  return [
    `CALIBRATION RECORD`, `==================`,
    `Tag:          ${r.tag}`,
    `Type:         ${type.label}`,
    `Location:     ${r.location || 'N/A'}`,
    `Technician:   ${r.tech || 'N/A'}`,
    `Cal. Date:    ${fmtDate(r.createdAt)}`,
    `Last Cal.:    ${r.lastCal || 'N/A'}`,
    `Next Cal.:    ${r.nextCal || 'N/A'}`,
    `Range:        ${r.lo} – ${r.hi} ${r.unit}`,
    `Tolerance:    ±${r.tol}${r.tolMode === 'pct' ? '% of output span' : ` ${r.unit}`}`,
    r.notes ? `Notes:        ${r.notes}` : null,
    ``,
    `AS-FOUND — ${r.asFoundPass ? 'PASS' : 'FAIL'}`,
    afErr ? `Max Error:    ${afErr.maxPctErr}%` : null,
    !type.isSwitch ? hdr : null,
    ...(r.asFound || []).map(rowLine),
    type.isSwitch ? `  Trip↑: ${r.asFoundSwitch?.tripUp || '—'}  Reset↑: ${r.asFoundSwitch?.resetUp || '—'}  Trip↓: ${r.asFoundSwitch?.tripDown || '—'}  Reset↓: ${r.asFoundSwitch?.resetDown || '—'}` : null,
    ``,
    `AS-LEFT — ${r.asLeftPass ? 'PASS' : 'FAIL'}`,
    alErr ? `Max Error:    ${alErr.maxPctErr}%` : null,
    !type.isSwitch ? hdr : null,
    ...(r.asLeft || []).map(rowLine),
    type.isSwitch ? `  Trip↑: ${r.asLeftSwitch?.tripUp || '—'}  Reset↑: ${r.asLeftSwitch?.resetUp || '—'}  Trip↓: ${r.asLeftSwitch?.tripDown || '—'}  Reset↓: ${r.asLeftSwitch?.resetDown || '—'}` : null,
  ].filter(l => l !== null).join('\n')
}

// ── CSV export ────────────────────────────────────────────────────
function exportCSV(r) {
  const type = getType(r.typeId)
  const outputMode = type.outputMode
  const span = getSpan(r.lo, r.hi)
  const outputSpan = outputMode === 'mA' ? 16 : span

  const header = outputMode === 'mA'
    ? `Phase,Input (${r.unit}),Expected mA,Measured mA,Error%,Pass`
    : `Phase,Input (${r.unit}),Expected,Measured,Error%,Pass`

  const rowCSV = (phase, row) => {
    const err = calcError(row.measured, row.expected)
    const pct = calcPctError(err, outputSpan)
    const pass = isPass(err, r.tol, r.tolMode, outputSpan)
    return `${phase},${row.input},${row.expected},${row.measured || ''},${pct !== null ? pct.toFixed(3) : ''},${pass === null ? '' : pass ? 'PASS' : 'FAIL'}`
  }

  const lines = [
    `Tag,${r.tag}`, `Type,${type.label}`, `Technician,${r.tech || ''}`,
    `Location,${r.location || ''}`, `Date,${r.createdAt}`,
    `Last Cal,${r.lastCal || ''}`, `Next Cal,${r.nextCal || ''}`,
    `Range,${r.lo} - ${r.hi} ${r.unit}`,
    `Tolerance,${r.tol}${r.tolMode === 'pct' ? '% of output span' : ` ${r.unit}`}`,
    ``, header,
    ...(r.asFound || []).map(row => rowCSV('As-Found', row)),
    ...(r.asLeft || []).map(row => rowCSV('As-Left', row)),
  ].join('\n')

  const blob = new Blob([lines], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cal_${r.tag}_${r.createdAt?.slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF export ────────────────────────────────────────────────────
function exportPDF(r) {
  const type = getType(r.typeId)
  const outputMode = type.outputMode
  const span = getSpan(r.lo, r.hi)
  const outputSpan = outputMode === 'mA' ? 16 : span
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, M = 14
  let y = 20

  const txt = (text, size = 10, bold = false, color = [30,30,30]) => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setTextColor(...color)
    doc.text(text, M, y); y += size * 0.45
  }
  const gap = (n = 4) => { y += n }
  const hline = () => { doc.setDrawColor(200,200,200); doc.line(M, y, W-M, y); gap(3) }

  // Dark header bar
  doc.setFillColor(15,23,42); doc.rect(0,0,W,16,'F')
  doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(245,158,11)
  doc.text('CALIBRATION RECORD', M, 10)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(148,163,184)
  doc.text('CIE Field Assistant', W-M, 10, { align: 'right' })
  y = 24

  txt(`${r.tag}  —  ${type.label}`, 14, true, [15,23,42]); gap(2)

  // Meta table
  const meta = [
    ['Location',   r.location || 'N/A'],
    ['Technician', r.tech || 'N/A'],
    ['Cal. Date',  r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : 'N/A'],
    ['Last Cal.',  r.lastCal || 'N/A'],
    ['Next Cal.',  r.nextCal || 'N/A'],
    ['Range',      `${r.lo} – ${r.hi} ${r.unit}`],
    ['Tolerance',  `±${r.tol}${r.tolMode === 'pct' ? '% of output span' : ` ${r.unit}`}`],
  ]
  meta.forEach(([k, v]) => {
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(100,116,139)
    doc.text(k + ':', M, y)
    doc.setFont('helvetica','normal'); doc.setTextColor(30,30,30)
    doc.text(v, M+28, y); y += 5
  })
  if (r.notes) { gap(1); txt(`Notes: ${r.notes}`, 9, false, [100,116,139]) }
  gap(3); hline()

  const drawTable = (title, rows, pass, overallErr) => {
    const pc = pass ? [34,197,94] : [239,68,68]
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...pc)
    doc.text(`${title}  —  ${pass ? 'PASS' : 'FAIL'}`, M, y); gap(1)
    if (overallErr) {
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139)
      doc.text(`Max error: ${overallErr.maxPctErr}%`, M, y); gap(5)
    } else { gap(4) }

    const cols = outputMode === 'mA'
      ? [['Input', 32], ['Exp. mA', 30], ['Meas. mA', 30], ['Err%', 28], ['', 16]]
      : [['Input', 38], ['Expected', 34], ['Measured', 34], ['Err%', 28], ['', 16]]

    let x = M
    doc.setFillColor(241,245,249); doc.rect(M, y-3, W-M*2, 6, 'F')
    cols.forEach(([h,w]) => {
      doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(71,85,105)
      doc.text(h, x+1, y); x += w
    })
    y += 4

    rows.forEach(row => {
      const err = calcError(row.measured, row.expected)
      const pct = calcPctError(err, outputSpan)
      const rowPass = isPass(err, r.tol, r.tolMode, outputSpan)
      const pctStr = pct !== null ? (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%' : '—'
      const ec = rowPass === null ? [100,116,139] : rowPass ? [34,197,94] : [239,68,68]
      const vals = [row.input, row.expected, row.measured || '—', pctStr, rowPass === null ? '' : rowPass ? '✓' : '✗']
      let x = M
      cols.forEach(([,w], ci) => {
        doc.setFontSize(8); doc.setFont('helvetica','normal')
        doc.setTextColor(...(ci >= 3 ? ec : [30,30,30]))
        doc.text(String(vals[ci]), x+1, y); x += w
      })
      y += 5
      if (y > 270) { doc.addPage(); y = 20 }
    })
    gap(4); hline()
  }

  const afErr = !type.isSwitch ? calcOverallError(r.asFound || [], r.tol, r.tolMode, r.lo, r.hi, outputMode) : null
  const alErr = !type.isSwitch ? calcOverallError(r.asLeft || [], r.tol, r.tolMode, r.lo, r.hi, outputMode) : null

  if (!type.isSwitch) {
    drawTable('AS-FOUND', r.asFound || [], r.asFoundPass, afErr)
    drawTable('AS-LEFT',  r.asLeft  || [], r.asLeftPass,  alErr)
  } else {
    const drawSwitch = (title, sw, pass) => {
      const pc = pass ? [34,197,94] : [239,68,68]
      doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...pc)
      doc.text(`${title}  —  ${pass ? 'PASS' : 'FAIL'}`, M, y); gap(5)
      const items = [['Trip ↑', sw?.tripUp], ['Reset ↑', sw?.resetUp], ['Trip ↓', sw?.tripDown], ['Reset ↓', sw?.resetDown]]
      items.forEach(([k, v]) => {
        doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(100,116,139)
        doc.text(`${k}:`, M, y)
        doc.setFont('helvetica','normal'); doc.setTextColor(30,30,30)
        doc.text(`${v || '—'} ${r.unit}`, M+22, y); y += 5
      })
      gap(3); hline()
    }
    drawSwitch('AS-FOUND', r.asFoundSwitch, r.asFoundPass)
    drawSwitch('AS-LEFT',  r.asLeftSwitch,  r.asLeftPass)
  }

  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(148,163,184)
  doc.text(`Generated by CIE Field Assistant — ${new Date().toLocaleDateString('en-GB')}`, M, 290)
  doc.save(`cal_${r.tag}_${r.createdAt?.slice(0,10) || 'record'}.pdf`)
}

// ── Record detail view ────────────────────────────────────────────
function CalibRecord({ record: r, onBack, onDelete, onEdit }) {
  const type = getType(r.typeId)
  const outputMode = type.outputMode
  const [copied, setCopied] = useState(false)
  const afErr = !type.isSwitch ? calcOverallError(r.asFound || [], r.tol, r.tolMode, r.lo, r.hi, outputMode) : null
  const alErr = !type.isSwitch ? calcOverallError(r.asLeft || [], r.tol, r.tolMode, r.lo, r.hi, outputMode) : null

  const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
  const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null

  const copyText = async () => {
    try { await navigator.clipboard.writeText(buildTextReport(r)); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  const metaRow = (label, value) => value ? (
    <div style={{ display: 'flex', gap: '6px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-faint)', minWidth: '80px' }}>{label}</span>
      <span style={{ fontSize: '11px', color: 'var(--text)' }}>{value}</span>
    </div>
  ) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '2px' }}><ChevronLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{r.tag}</p>
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-faint)' }}>{type.label} · {fmtDateTime(r.updatedAt || r.createdAt)}</p>
        </div>
        <button onClick={() => onEdit(r)} title="Edit"     style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--text-faint)' }}><Pencil   size={14} /></button>
        <button onClick={copyText}        title="Copy text" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: copied ? 'var(--amber)' : 'var(--text-faint)' }}><Copy     size={14} /></button>
        <button onClick={() => exportCSV(r)} title="CSV"  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--text-faint)' }}><Download size={14} /></button>
        <button onClick={() => exportPDF(r)} title="PDF"  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--text-faint)' }}><FileText size={14} /></button>
        <button onClick={() => onDelete(r.id)}            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: '#ef4444' }}><Trash2   size={14} /></button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Overall result cards */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[{ label: 'As-Found', pass: r.asFoundPass, err: afErr }, { label: 'As-Left', pass: r.asLeftPass, err: alErr }].map(({ label, pass, err }) => (
            <div key={label} style={{ flex: 1, background: 'var(--bg-light)', border: `1px solid ${pass ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`, borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase' }}>{label}</p>
              <PassBadge pass={pass} />
              {err && <p style={{ margin: '5px 0 0', fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'monospace' }}>Max: {err.maxPctErr}%</p>}
            </div>
          ))}
          <div style={{ flex: 1, background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase' }}>Tolerance</p>
            <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>±{r.tol}{r.tolMode === 'pct' ? '%' : ` ${r.unit}`}</span>
          </div>
        </div>

        {/* Meta */}
        <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {metaRow('Range',     `${r.lo} – ${r.hi} ${r.unit}`)}
          {metaRow('Location',  r.location)}
          {metaRow('Tech',      r.tech)}
          {metaRow('Last Cal.', fmtDate(r.lastCal))}
          {metaRow('Next Cal.', fmtDate(r.nextCal))}
          {metaRow('Notes',     r.notes)}
        </div>

        {/* As-Found */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase' }}>As-Found</p>
            <PassBadge pass={r.asFoundPass} />
          </div>
          {type.isSwitch
            ? <SwitchTable data={r.asFoundSwitch} readOnly unit={r.unit} setpoint={r.setpoint} reset={r.resetPoint} tol={r.tol} tolMode={r.tolMode} />
            : <ReadingTable rows={r.asFound || []} readOnly tol={r.tol} tolMode={r.tolMode} lo={r.lo} hi={r.hi} type={{ ...type, selectedUnit: r.unit }} />
          }
        </div>

        {/* As-Left */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase' }}>As-Left</p>
            <PassBadge pass={r.asLeftPass} />
          </div>
          {type.isSwitch
            ? <SwitchTable data={r.asLeftSwitch} readOnly unit={r.unit} setpoint={r.setpoint} reset={r.resetPoint} tol={r.tol} tolMode={r.tolMode} />
            : <ReadingTable rows={r.asLeft || []} readOnly tol={r.tol} tolMode={r.tolMode} lo={r.lo} hi={r.hi} type={{ ...type, selectedUnit: r.unit }} />
          }
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export function CalibrationPage() {
  const [records, setRecords] = useState(load)
  const [showNew, setShowNew] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [activeId, setActiveId] = useState(null)

  useEffect(() => save(records), [records])

  const saveRecord = (r) => {
    setRecords(prev => {
      const exists = prev.find(x => x.id === r.id)
      return exists ? prev.map(x => x.id === r.id ? r : x) : [r, ...prev]
    })
    setShowNew(false)
    setEditRecord(null)
  }

  const deleteRecord = (id) => { setRecords(prev => prev.filter(r => r.id !== id)); setActiveId(null) }

  const active = records.find(r => r.id === activeId)
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  if (active && !editRecord) return (
    <CalibRecord record={active} onBack={() => setActiveId(null)} onDelete={deleteRecord}
                 onEdit={(r) => { setEditRecord(r); setActiveId(null) }} />
  )

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
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-faint)' }}>{type.label} · {r.unit}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                  <PassBadge pass={overallPass} />
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{fmtDate(r.updatedAt || r.createdAt)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '5px' }}>
                {r.tech    && <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>Tech: {r.tech}</span>}
                {r.nextCal && <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>Next: {r.nextCal}</span>}
              </div>
            </button>
          )
        })}
      </div>

      {(showNew || editRecord) && (
        <CalibWizard onSave={saveRecord} onClose={() => { setShowNew(false); setEditRecord(null) }} existing={editRecord} />
      )}
    </div>
  )
}
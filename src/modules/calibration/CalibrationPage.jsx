import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, Trash2, Copy, CheckCircle, XCircle, Pencil, FileText, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'

const STORAGE_KEY = 'cie_calibrations_v1'
function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] } }
function save(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) }

const PRESSURE_UNITS = ['kPa', 'bar', 'MPa', 'psi', 'inH2O', 'mmHg']
const MA_POINTS_5 = [4, 8, 12, 16, 20]
const PCT_POINTS_5 = [0, 25, 50, 75, 100]

const TYPES = [
  {
    id: '4-20ma',
    label: '4-20 mA Transmitter',
    inputUnit: 'mA',
    outputLabel: 'Output (mA)',
    unitOptions: null,
    defaultPoints: MA_POINTS_5,
    defaultTol: 2,
    defaultTolMode: 'pct',
    hasDisplay: false,
    isSwitch: false,
    calcExpected: (pt) => pt,
  },
  {
    id: 'pressure-tx',
    label: 'Pressure Transmitter',
    inputUnit: null,
    outputLabel: 'Output (mA)',
    unitOptions: PRESSURE_UNITS,
    defaultUnit: 'kPa',
    defaultPoints: PCT_POINTS_5,
    defaultTol: 2,
    defaultTolMode: 'pct',
    hasDisplay: true,
    isSwitch: false,
    calcExpectedMa: (pct) => 4 + (pct / 100) * 16,
    calcExpectedPv: (pct, lo, hi) => lo + (pct / 100) * (hi - lo),
  },
  {
    id: 'pressure-gauge',
    label: 'Pressure Gauge',
    inputUnit: null,
    outputLabel: 'Indicated',
    unitOptions: PRESSURE_UNITS,
    defaultUnit: 'kPa',
    defaultPoints: PCT_POINTS_5,
    defaultTol: 2,
    defaultTolMode: 'pct',
    hasDisplay: false,
    isSwitch: false,
    calcExpected: (pct, lo, hi) => lo + (pct / 100) * (hi - lo),
  },
  {
    id: 'pressure-switch',
    label: 'Pressure Switch',
    inputUnit: null,
    unitOptions: PRESSURE_UNITS,
    defaultUnit: 'kPa',
    defaultTol: 2,
    defaultTolMode: 'pct',
    hasDisplay: false,
    isSwitch: true,
  },
  {
    id: 'temperature',
    label: 'Temperature (RTD/TC)',
    inputUnit: '°C',
    outputLabel: 'Indicated (°C)',
    unitOptions: null,
    defaultPoints: PCT_POINTS_5,
    defaultTol: 2,
    defaultTolMode: 'pct',
    hasDisplay: false,
    isSwitch: false,
    calcExpected: (pct, lo, hi) => lo + (pct / 100) * (hi - lo),
  },
  {
    id: 'flow',
    label: 'Flow Meter',
    inputUnit: '%',
    outputLabel: 'Output (mA)',
    unitOptions: null,
    defaultPoints: PCT_POINTS_5,
    defaultTol: 2,
    defaultTolMode: 'pct',
    hasDisplay: false,
    isSwitch: false,
    calcExpected: (pct) => 4 + (pct / 100) * 16,
  },
  {
    id: 'positioner',
    label: 'Valve Positioner',
    inputUnit: 'mA',
    outputLabel: 'Position (%)',
    unitOptions: null,
    defaultPoints: MA_POINTS_5,
    defaultTol: 2,
    defaultTolMode: 'pct',
    hasDisplay: false,
    isSwitch: false,
    calcExpected: (mA) => ((mA - 4) / 16) * 100,
  },
]

function getType(id) { return TYPES.find(t => t.id === id) || TYPES[0] }

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

function PassBadge({ pass }) {
  if (pass === null || pass === undefined) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, background: pass ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: pass ? '#4ade80' : '#f87171' }}>
      {pass ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {pass ? 'PASS' : 'FAIL'}
    </span>
  )
}

function ReadingTable({ rows, onChange, tol, tolMode, lo, hi, type, readOnly = false }) {
  const span = getSpan(lo, hi)
  const isPressureTx = type?.id === 'pressure-tx'
  const unit = type?.selectedUnit || type?.defaultUnit || type?.inputUnit || ''

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-faint)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>Input ({unit || 'mA'})</th>
            <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-faint)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>Expected</th>
            <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-faint)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{isPressureTx ? 'mA' : 'Measured'}</th>
            {isPressureTx && <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-faint)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>Display ({unit})</th>}
            <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-faint)', fontFamily: 'monospace' }}>Err%</th>
            <th style={{ padding: '5px 4px' }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const errMa = calcError(row.measured, row.expected)
            const pctErrMa = calcPctError(errMa, span || 16)
            const passMa = isPass(errMa, tol, tolMode, span || 16)
            const errDisplay = isPressureTx ? calcError(row.measuredDisplay, row.expectedDisplay) : null
            const pctErrDisplay = isPressureTx ? calcPctError(errDisplay, span) : null
            const passDisplay = isPressureTx ? isPass(errDisplay, tol, tolMode, span) : null
            const overallPass = isPressureTx ? (passMa !== false && passDisplay !== false) : passMa

            return (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '4px 6px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{row.input}</td>
                <td style={{ padding: '4px 6px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{row.expected}</td>
                <td style={{ padding: '3px 4px' }}>
                  {readOnly
                    ? <span style={{ color: 'var(--text)', fontWeight: 500 }}>{row.measured || '—'}</span>
                    : <input value={row.measured} onChange={e => onChange(i, 'measured', e.target.value)}
                             type="number" inputMode="decimal" placeholder="—"
                             style={{ width: '62px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '5px', padding: '4px 6px', fontSize: '11px', outline: 'none' }} />
                  }
                </td>
                {isPressureTx && (
                  <td style={{ padding: '3px 4px' }}>
                    {readOnly
                      ? <span style={{ color: 'var(--text)', fontWeight: 500 }}>{row.measuredDisplay || '—'}</span>
                      : <input value={row.measuredDisplay || ''} onChange={e => onChange(i, 'measuredDisplay', e.target.value)}
                               type="number" inputMode="decimal" placeholder="—"
                               style={{ width: '62px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '5px', padding: '4px 6px', fontSize: '11px', outline: 'none' }} />
                    }
                  </td>
                )}
                <td style={{ padding: '4px 6px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  <div style={{ color: passMa !== null ? (passMa ? '#4ade80' : '#f87171') : 'var(--text-faint)', fontSize: '10px' }}>
                    {pctErrMa !== null ? (pctErrMa >= 0 ? '+' : '') + pctErrMa.toFixed(2) + '%' : '—'}
                  </div>
                  {isPressureTx && (
                    <div style={{ color: passDisplay !== null ? (passDisplay ? '#4ade80' : '#f87171') : 'var(--text-faint)', fontSize: '10px' }}>
                      {pctErrDisplay !== null ? (pctErrDisplay >= 0 ? '+' : '') + pctErrDisplay.toFixed(2) + '%' : '—'}
                    </div>
                  )}
                </td>
                <td style={{ padding: '4px 3px' }}><PassBadge pass={overallPass} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SwitchTable({ data, onChange, readOnly, unit, setpoint, reset, tol, tolMode }) {
  const fields = [
    { key: 'tripUp',   label: 'Trip (↑)',  desc: 'Increasing pressure trip point' },
    { key: 'resetUp',  label: 'Reset (↑)', desc: 'Reset after trip on increasing' },
    { key: 'tripDown', label: 'Trip (↓)',  desc: 'Decreasing pressure trip point' },
    { key: 'resetDown',label: 'Reset (↓)', desc: 'Reset after trip on decreasing' },
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

function calcOverallError(rows, tol, tolMode, lo, hi, isPressureTx) {
  const span = getSpan(lo, hi)
  let maxAbsErr = 0, maxPctErr = 0, allPass = true
  rows.forEach(row => {
    const err = calcError(row.measured, row.expected)
    if (err !== null) {
      const abs = Math.abs(err)
      const pct = Math.abs(calcPctError(err, span || 16))
      if (abs > maxAbsErr) maxAbsErr = abs
      if (pct > maxPctErr) maxPctErr = pct
      if (!isPass(err, tol, tolMode, span || 16)) allPass = false
    }
    if (isPressureTx) {
      const errD = calcError(row.measuredDisplay, row.expectedDisplay)
      if (errD !== null) {
        const abs = Math.abs(errD)
        const pct = Math.abs(calcPctError(errD, span))
        if (abs > maxAbsErr) maxAbsErr = abs
        if (pct > maxPctErr) maxPctErr = pct
        if (!isPass(errD, tol, tolMode, span)) allPass = false
      }
    }
  })
  return { maxAbsErr: maxAbsErr.toFixed(4), maxPctErr: maxPctErr.toFixed(2), allPass }
}

function CalibWizard({ onSave, onClose, existing = null }) {
  const isEdit = !!existing
  const [step, setStep] = useState(0)
  const [typeId, setTypeId] = useState(existing?.typeId || '4-20ma')
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
  const effectiveUnit = unit || type.defaultUnit || type.inputUnit || ''

  const getPoints = () => {
    if (customPoints.trim()) {
      return customPoints.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
    }
    return type.defaultPoints || PCT_POINTS_5
  }

  const buildRows = () => {
    const pts = getPoints()
    const loN = parseFloat(lo), hiN = parseFloat(hi)
    return pts.map(pt => {
      if (type.id === 'pressure-tx') {
        const expected = (4 + (pt / 100) * 16).toFixed(3)
        const expectedDisplay = (loN + (pt / 100) * (hiN - loN)).toFixed(3)
        return { input: (loN + (pt / 100) * (hiN - loN)).toFixed(3), expected, expectedDisplay, measured: '', measuredDisplay: '' }
      } else if (type.id === 'pressure-gauge' || type.id === 'temperature') {
        const expected = (loN + (pt / 100) * (hiN - loN)).toFixed(3)
        return { input: expected, expected, measured: '' }
      } else if (type.id === 'flow') {
        return { input: String(pt), expected: (4 + (pt / 100) * 16).toFixed(3), measured: '' }
      } else if (type.id === 'positioner') {
        return { input: String(pt), expected: (((pt - 4) / 16) * 100).toFixed(2), measured: '' }
      } else {
        return { input: String(pt), expected: String(pt), measured: '' }
      }
    })
  }

  const goToAsFound = () => { if (!type.isSwitch) setAsFound(buildRows()); setStep(1) }
  const goToAsLeft = () => {
    if (!type.isSwitch) {
      const rows = buildRows().map((r, i) => ({ ...r, measured: asFound[i]?.measured || '', measuredDisplay: asFound[i]?.measuredDisplay || '' }))
      setAsLeft(rows)
    }
    setStep(2)
  }

  const updateRow = (setter, idx, field, val) =>
    setter(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))

  const checkRowsPass = (rows) => {
    const span = getSpan(lo, hi)
    return rows.every(r => {
      const e = calcError(r.measured, r.expected)
      if (isPass(e, tolVal, tolMode, span || 16) === false) return false
      if (type.id === 'pressure-tx') {
        const eD = calcError(r.measuredDisplay, r.expectedDisplay)
        if (isPass(eD, tolVal, tolMode, span) === false) return false
      }
      return true
    })
  }

  const checkSwitchPass = (sw) => {
    const sp = parseFloat(setpoint), rp = parseFloat(resetPoint)
    const span = Math.abs(sp - rp) || 1
    const fields = { tripUp: sp, resetUp: rp, tripDown: sp, resetDown: rp }
    return Object.entries(fields).every(([k, exp]) => {
      const err = sw[k] ? parseFloat(sw[k]) - exp : null
      return err === null || isPass(err, tolVal, tolMode, span) !== false
    })
  }

  const finish = () => {
    onSave({
      id: existing?.id || Date.now(),
      typeId, tag: tag.trim() || 'Untagged', tech: tech.trim(), location: location.trim(),
      lo: parseFloat(lo), hi: parseFloat(hi), unit: effectiveUnit,
      tol: tolVal, tolMode, notes, lastCal, nextCal,
      setpoint: parseFloat(setpoint), resetPoint: parseFloat(resetPoint),
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

  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl = (t) => <label style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '4px' }}>{t}</label>

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-light)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', maxHeight: '94vh', overflow: 'hidden' }}>

        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{isEdit ? 'Edit Calibration' : 'New Calibration'}</h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-faint)' }}>
              {step === 0 ? 'Step 1/3 — Setup' : step === 1 ? 'Step 2/3 — As-Found' : 'Step 3/3 — As-Left'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: '18px' }}>✕</button>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', padding: '8px 16px', gap: '6px' }}>
          {[0,1,2].map(s => <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= step ? 'var(--amber)' : 'var(--border)' }} />)}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {step === 0 && <>
            <div>{lbl('Instrument Type')}
              <select value={typeId} onChange={e => { setTypeId(e.target.value); setUnit('') }} style={inputStyle}>
                {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>{lbl('Tag / ID')}<input value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. PT-101" style={inputStyle} /></div>
              <div style={{ flex: 1 }}>{lbl('Location')}<input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Unit 3" style={inputStyle} /></div>
            </div>

            <div>{lbl('Technician')}<input value={tech} onChange={e => setTech(e.target.value)} placeholder="Your name" style={inputStyle} /></div>

            {type.unitOptions && (
              <div>{lbl('Pressure Unit')}
                <select value={unit || type.defaultUnit} onChange={e => setUnit(e.target.value)} style={inputStyle}>
                  {type.unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            )}

            {!type.isSwitch && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>{lbl(`Lower Range (${effectiveUnit})`)}<input value={lo} onChange={e => setLo(e.target.value)} type="number" style={inputStyle} /></div>
                <div style={{ flex: 1 }}>{lbl(`Upper Range (${effectiveUnit})`)}<input value={hi} onChange={e => setHi(e.target.value)} type="number" style={inputStyle} /></div>
              </div>
            )}

            {type.isSwitch && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>{lbl(`Setpoint (${effectiveUnit})`)}<input value={setpoint} onChange={e => setSetpoint(e.target.value)} type="number" style={inputStyle} /></div>
                <div style={{ flex: 1 }}>{lbl(`Reset Point (${effectiveUnit})`)}<input value={resetPoint} onChange={e => setResetPoint(e.target.value)} type="number" style={inputStyle} /></div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>{lbl('Tolerance')}<input value={tol} onChange={e => setTol(e.target.value)} type="number" step="0.1" style={inputStyle} /></div>
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
              {tolMode === 'pct' ? `±${tol}% of span` : `±${tol} ${effectiveUnit} absolute`}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>{lbl('Last Cal. Date')}<input value={lastCal} onChange={e => setLastCal(e.target.value)} type="date" style={inputStyle} /></div>
              <div style={{ flex: 1 }}>{lbl('Next Cal. Date')}<input value={nextCal} onChange={e => setNextCal(e.target.value)} type="date" style={inputStyle} /></div>
            </div>

            {!type.isSwitch && (
              <div>{lbl('Custom test points (comma-separated, optional)')}
                <input value={customPoints} onChange={e => setCustomPoints(e.target.value)} placeholder={`Default: 5-point 0, 25, 50, 75, 100%`} style={inputStyle} />
              </div>
            )}

            <div>{lbl('Notes')}
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                        placeholder="Ambient conditions, equipment serial numbers…"
                        style={{ ...inputStyle, resize: 'none', fontFamily: "'Barlow', sans-serif" }} />
            </div>
          </>}

          {step === 1 && <>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Record readings <strong style={{ color: 'var(--text)' }}>before</strong> any adjustment.</p>
            {type.isSwitch
              ? <SwitchTable data={asFoundSwitch} onChange={(k, v) => setAsFoundSwitch(p => ({ ...p, [k]: v }))}
                             unit={effectiveUnit} setpoint={setpoint} reset={resetPoint} tol={tolVal} tolMode={tolMode} />
              : <ReadingTable rows={asFound} onChange={(i, f, v) => updateRow(setAsFound, i, f, v)}
                              tol={tolVal} tolMode={tolMode} lo={lo} hi={hi} type={{ ...type, selectedUnit: effectiveUnit }} />
            }
            <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-faint)' }}>Tolerance: ±{tol}{tolMode === 'pct' ? '%' : ` ${effectiveUnit}`}</p>
          </>}

          {step === 2 && <>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Record readings <strong style={{ color: 'var(--text)' }}>after</strong> adjustment.</p>
            {type.isSwitch
              ? <SwitchTable data={asLeftSwitch} onChange={(k, v) => setAsLeftSwitch(p => ({ ...p, [k]: v }))}
                             unit={effectiveUnit} setpoint={setpoint} reset={resetPoint} tol={tolVal} tolMode={tolMode} />
              : <ReadingTable rows={asLeft} onChange={(i, f, v) => updateRow(setAsLeft, i, f, v)}
                              tol={tolVal} tolMode={tolMode} lo={lo} hi={hi} type={{ ...type, selectedUnit: effectiveUnit }} />
            }
            <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-faint)' }}>Tolerance: ±{tol}{tolMode === 'pct' ? '%' : ` ${effectiveUnit}`}</p>
          </>}
        </div>

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

function buildTextReport(r) {
  const type = getType(r.typeId)
  const isPressureTx = r.typeId === 'pressure-tx'
  const span = getSpan(r.lo, r.hi)
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'

  const rowLine = (row) => {
    const err = calcError(row.measured, row.expected)
    const pct = calcPctError(err, span || 16)
    const errStr = pct !== null ? (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%' : '—'
    if (isPressureTx) {
      const errD = calcError(row.measuredDisplay, row.expectedDisplay)
      const pctD = calcPctError(errD, span)
      return `  ${row.input}\t${row.expected}\t${row.measured || '—'}\t${row.expectedDisplay}\t${row.measuredDisplay || '—'}\t${errStr} / ${pctD !== null ? (pctD >= 0 ? '+' : '') + pctD.toFixed(2) + '%' : '—'}`
    }
    return `  ${row.input}\t${row.expected}\t${row.measured || '—'}\t${errStr}`
  }

  const afErr = !type.isSwitch ? calcOverallError(r.asFound || [], r.tol, r.tolMode, r.lo, r.hi, isPressureTx) : null
  const alErr = !type.isSwitch ? calcOverallError(r.asLeft || [], r.tol, r.tolMode, r.lo, r.hi, isPressureTx) : null

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
    `Tolerance:    ±${r.tol}${r.tolMode === 'pct' ? '%' : ` ${r.unit}`}`,
    r.notes ? `Notes:        ${r.notes}` : null,
    ``,
    `AS-FOUND — ${r.asFoundPass ? 'PASS' : 'FAIL'}`,
    afErr ? `Max Error:    ${afErr.maxPctErr}% (${afErr.maxAbsErr} ${r.unit})` : null,
    isPressureTx ? `  Input\tExp mA\tMeas mA\tExp Disp\tMeas Disp\tErr%` : `  Input\tExpected\tMeasured\tErr%`,
    ...(r.asFound || []).map(rowLine),
    type.isSwitch ? `  Trip↑: ${r.asFoundSwitch?.tripUp || '—'}  Reset↑: ${r.asFoundSwitch?.resetUp || '—'}  Trip↓: ${r.asFoundSwitch?.tripDown || '—'}  Reset↓: ${r.asFoundSwitch?.resetDown || '—'}` : null,
    ``,
    `AS-LEFT — ${r.asLeftPass ? 'PASS' : 'FAIL'}`,
    alErr ? `Max Error:    ${alErr.maxPctErr}% (${alErr.maxAbsErr} ${r.unit})` : null,
    isPressureTx ? `  Input\tExp mA\tMeas mA\tExp Disp\tMeas Disp\tErr%` : `  Input\tExpected\tMeasured\tErr%`,
    ...(r.asLeft || []).map(rowLine),
    type.isSwitch ? `  Trip↑: ${r.asLeftSwitch?.tripUp || '—'}  Reset↑: ${r.asLeftSwitch?.resetUp || '—'}  Trip↓: ${r.asLeftSwitch?.tripDown || '—'}  Reset↓: ${r.asLeftSwitch?.resetDown || '—'}` : null,
  ].filter(l => l !== null).join('\n')
}

function exportCSV(r) {
  const type = getType(r.typeId)
  const isPressureTx = r.typeId === 'pressure-tx'
  const span = getSpan(r.lo, r.hi)
  const header = isPressureTx
    ? 'Phase,Input,Expected mA,Measured mA,Expected Display,Measured Display,Error% mA,Error% Display,Pass'
    : 'Phase,Input,Expected,Measured,Error%,Pass'

  const rowCSV = (phase, row) => {
    const err = calcError(row.measured, row.expected)
    const pct = calcPctError(err, span || 16)
    const pass = isPass(err, r.tol, r.tolMode, span || 16)
    if (isPressureTx) {
      const errD = calcError(row.measuredDisplay, row.expectedDisplay)
      const pctD = calcPctError(errD, span)
      const passD = isPass(errD, r.tol, r.tolMode, span)
      return `${phase},${row.input},${row.expected},${row.measured || ''},${row.expectedDisplay},${row.measuredDisplay || ''},${pct !== null ? pct.toFixed(3) : ''},${pctD !== null ? pctD.toFixed(3) : ''},${pass && passD ? 'PASS' : 'FAIL'}`
    }
    return `${phase},${row.input},${row.expected},${row.measured || ''},${pct !== null ? pct.toFixed(3) : ''},${pass ? 'PASS' : 'FAIL'}`
  }

  const lines = [
    `Tag,${r.tag}`, `Type,${type.label}`, `Technician,${r.tech || ''}`,
    `Location,${r.location || ''}`, `Date,${r.createdAt}`,
    `Last Cal,${r.lastCal || ''}`, `Next Cal,${r.nextCal || ''}`,
    `Range,${r.lo} - ${r.hi} ${r.unit}`,
    `Tolerance,${r.tol}${r.tolMode === 'pct' ? '%' : ` ${r.unit}`}`,
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

function exportPDF(r) {
  const type = getType(r.typeId)
  const isPressureTx = r.typeId === 'pressure-tx'
  const span = getSpan(r.lo, r.hi)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, margin = 14
  let y = 20

  const line = (text, size = 10, bold = false, color = [30, 30, 30]) => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setTextColor(...color)
    doc.text(text, margin, y); y += size * 0.45
  }
  const gap = (n = 4) => { y += n }
  const hline = () => { doc.setDrawColor(200, 200, 200); doc.line(margin, y, W - margin, y); gap(3) }

  doc.setFillColor(15, 23, 42); doc.rect(0, 0, W, 16, 'F')
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(245, 158, 11)
  doc.text('CALIBRATION RECORD', margin, 10)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184)
  doc.text('CIE Field Assistant', W - margin, 10, { align: 'right' })
  y = 24

  line(`${r.tag}  —  ${type.label}`, 14, true, [15, 23, 42]); gap(2)

  const meta = [
    ['Location', r.location || 'N/A'], ['Technician', r.tech || 'N/A'],
    ['Cal. Date', r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : 'N/A'],
    ['Last Cal.', r.lastCal || 'N/A'], ['Next Cal.', r.nextCal || 'N/A'],
    ['Range', `${r.lo} – ${r.hi} ${r.unit}`],
    ['Tolerance', `±${r.tol}${r.tolMode === 'pct' ? '%' : ` ${r.unit}`}`],
  ]
  meta.forEach(([k, v]) => {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
    doc.text(k + ':', margin, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30)
    doc.text(v, margin + 28, y); y += 5
  })
  if (r.notes) { gap(1); line(`Notes: ${r.notes}`, 9, false, [100, 116, 139]) }
  gap(3); hline()

  const drawTable = (title, rows, pass, overallErr) => {
    const passColor = pass ? [34, 197, 94] : [239, 68, 68]
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...passColor)
    doc.text(`${title}  —  ${pass ? 'PASS' : 'FAIL'}`, margin, y); gap(1)
    if (overallErr) {
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139)
      doc.text(`Max error: ${overallErr.maxPctErr}%  (${overallErr.maxAbsErr} ${r.unit})`, margin, y); gap(5)
    } else { gap(4) }

    const cols = isPressureTx
      ? [['Input', 22], ['Exp mA', 22], ['Meas mA', 24], ['Exp Disp', 24], ['Meas Disp', 24], ['Err%', 22], ['', 16]]
      : [['Input', 30], ['Expected', 32], ['Measured', 32], ['Err%', 28], ['', 20]]

    let x = margin
    doc.setFillColor(241, 245, 249); doc.rect(margin, y - 3, W - margin * 2, 6, 'F')
    cols.forEach(([h, w]) => {
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(71, 85, 105)
      doc.text(h, x + 1, y); x += w
    })
    y += 4

    rows.forEach(row => {
      const err = calcError(row.measured, row.expected)
      const pct = calcPctError(err, span || 16)
      const rowPass = isPass(err, r.tol, r.tolMode, span || 16)
      const pctStr = pct !== null ? (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%' : '—'
      const errColor = rowPass === null ? [100, 116, 139] : rowPass ? [34, 197, 94] : [239, 68, 68]
      let x = margin
      const vals = isPressureTx
        ? [row.input, row.expected, row.measured || '—', row.expectedDisplay, row.measuredDisplay || '—', pctStr, rowPass === null ? '' : rowPass ? '✓' : '✗']
        : [row.input, row.expected, row.measured || '—', pctStr, rowPass === null ? '' : rowPass ? '✓' : '✗']

      cols.forEach(([, w], ci) => {
        const isErrCol = isPressureTx ? ci === 5 : ci === 3
        const isResultCol = isPressureTx ? ci === 6 : ci === 4
        doc.setFontSize(8); doc.setFont('helvetica', 'normal')
        doc.setTextColor(...((isErrCol || isResultCol) ? errColor : [30, 30, 30]))
        doc.text(String(vals[ci]), x + 1, y); x += w
      })
      y += 5
      if (y > 270) { doc.addPage(); y = 20 }
    })
    gap(4); hline()
  }

  const afErr = !type.isSwitch ? calcOverallError(r.asFound || [], r.tol, r.tolMode, r.lo, r.hi, isPressureTx) : null
  const alErr = !type.isSwitch ? calcOverallError(r.asLeft || [], r.tol, r.tolMode, r.lo, r.hi, isPressureTx) : null

  if (!type.isSwitch) {
    drawTable('AS-FOUND', r.asFound || [], r.asFoundPass, afErr)
    drawTable('AS-LEFT', r.asLeft || [], r.asLeftPass, alErr)
  } else {
    const drawSwitch = (title, sw, pass) => {
      doc.setFontSize(11); doc.setFont('helvetica', 'bold')
      doc.setTextColor(pass ? 34 : 239, pass ? 197 : 68, pass ? 94 : 68)
      doc.text(`${title}  —  ${pass ? 'PASS' : 'FAIL'}`, margin, y); gap(5)
      const items = [['Trip ↑', sw?.tripUp], ['Reset ↑', sw?.resetUp], ['Trip ↓', sw?.tripDown], ['Reset ↓', sw?.resetDown]]
      items.forEach(([k, v]) => {
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
        doc.text(`${k}:`, margin, y)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30)
        doc.text(`${v || '—'} ${r.unit}`, margin + 20, y); y += 5
      })
      gap(3); hline()
    }
    drawSwitch('AS-FOUND', r.asFoundSwitch, r.asFoundPass)
    drawSwitch('AS-LEFT', r.asLeftSwitch, r.asLeftPass)
  }

  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184)
  doc.text(`Generated by CIE Field Assistant — ${new Date().toLocaleDateString('en-GB')}`, margin, 290)
  doc.save(`cal_${r.tag}_${r.createdAt?.slice(0,10) || 'record'}.pdf`)
}

function CalibRecord({ record: r, onBack, onDelete, onEdit }) {
  const type = getType(r.typeId)
  const isPressureTx = r.typeId === 'pressure-tx'
  const [copied, setCopied] = useState(false)
  const afErr = !type.isSwitch ? calcOverallError(r.asFound || [], r.tol, r.tolMode, r.lo, r.hi, isPressureTx) : null
  const alErr = !type.isSwitch ? calcOverallError(r.asLeft || [], r.tol, r.tolMode, r.lo, r.hi, isPressureTx) : null

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
  const fmtSimple = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null

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
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '2px' }}><ChevronLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{r.tag}</p>
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-faint)' }}>{type.label} · {fmtDate(r.updatedAt || r.createdAt)}</p>
        </div>
        <button onClick={() => onEdit(r)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--text-faint)' }}><Pencil size={14} /></button>
        <button onClick={copyText} title="Copy text" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: copied ? 'var(--amber)' : 'var(--text-faint)' }}><Copy size={14} /></button>
        <button onClick={() => exportCSV(r)} title="Export CSV" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--text-faint)' }}><Download size={14} /></button>
        <button onClick={() => exportPDF(r)} title="Export PDF" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--text-faint)' }}><FileText size={14} /></button>
        <button onClick={() => onDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: '#ef4444' }}><Trash2 size={14} /></button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

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

        <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {metaRow('Range', `${r.lo} – ${r.hi} ${r.unit}`)}
          {metaRow('Location', r.location)}
          {metaRow('Tech', r.tech)}
          {metaRow('Last Cal.', fmtSimple(r.lastCal))}
          {metaRow('Next Cal.', fmtSimple(r.nextCal))}
          {metaRow('Notes', r.notes)}
        </div>

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
                {r.tech && <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>Tech: {r.tech}</span>}
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
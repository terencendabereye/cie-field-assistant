import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'

// Linear interpolation: given two known points (x1,y1) and (x2,y2),
// find the output for any input using: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
function lerp(x1, y1, x2, y2, x) {
  if (x2 === x1) return null // avoid division by zero
  return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1)
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 uppercase tracking-wider mono">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mono text-sm px-3 py-2 rounded outline-none transition-colors"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--amber)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

export function InterpolationTool() {
  const [x1, setX1] = useState('')
  const [y1, setY1] = useState('')
  const [x2, setX2] = useState('')
  const [y2, setY2] = useState('')
  const [input, setInput] = useState('')
  // flipped: when true, user enters Y and we solve for X
  const [flipped, setFlipped] = useState(false)

  const vals = [x1, y1, x2, y2, input].map(Number)
  const allFilled = [x1, y1, x2, y2, input].every(v => v !== '')

  let result = null
  let error = null

  if (allFilled) {
    const [nx1, ny1, nx2, ny2, ni] = vals
    if (!flipped) {
      // Normal: input is X, output is Y
      const r = lerp(nx1, ny1, nx2, ny2, ni)
      if (r === null) error = 'X1 and X2 cannot be equal'
      else result = r
    } else {
      // Flipped: input is Y, output is X — swap roles
      const r = lerp(ny1, nx1, ny2, nx2, ni)
      if (r === null) error = 'Y1 and Y2 cannot be equal'
      else result = r
    }
  }

  const inputLabel = flipped ? 'Known Y (input)' : 'Known X (input)'
  const outputLabel = flipped ? 'Solved X' : 'Solved Y'

  return (
    <div className="p-4 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Linear Interpolation</h2>
          <p className="text-xs text-slate-500 mt-0.5">Enter two reference points and an input value</p>
        </div>
        {/* Flip button — swaps which axis is "input" vs "output" */}
        <button
          onClick={() => setFlipped(f => !f)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors
            ${flipped ? 'bg-amber-400 text-navy' : 'text-amber-400 border border-amber-400'}`}
          style={flipped ? { color: 'var(--bg)' } : {}}
          title="Flip: solve for X instead of Y"
        >
          <ArrowLeftRight size={13} />
          {flipped ? 'Solving for X' : 'Solving for Y'}
        </button>
      </div>

      {/* Reference points */}
      <div className="rounded-lg p-4 flex flex-col gap-4"
           style={{ background: 'var(--bg-light)', border: '1px solid var(--border)' }}>
        <p className="text-xs text-slate-500 uppercase tracking-wider mono">Reference Points</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="X1" value={x1} onChange={setX1} placeholder="0" />
          <Field label="Y1" value={y1} onChange={setY1} placeholder="0" />
          <Field label="X2" value={x2} onChange={setX2} placeholder="100" />
          <Field label="Y2" value={y2} onChange={setY2} placeholder="500" />
        </div>
      </div>

      {/* Input */}
      <div className="rounded-lg p-4" style={{ background: 'var(--bg-light)', border: '1px solid var(--border)' }}>
        <Field label={inputLabel} value={input} onChange={setInput} placeholder="Enter value" />
      </div>

      {/* Result */}
      <div className="rounded-lg p-4 text-center"
           style={{
             background: result !== null ? 'rgba(245,158,11,0.08)' : 'var(--bg-light)',
             border: `1px solid ${result !== null ? 'var(--amber)' : 'var(--border)'}`,
             transition: 'all 0.2s'
           }}>
        <p className="text-xs text-slate-500 uppercase tracking-wider mono mb-2">{outputLabel}</p>
        {error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : result !== null ? (
          <p className="mono text-3xl font-bold text-amber-400">{result.toFixed(4)}</p>
        ) : (
          <p className="text-slate-600 text-sm">Fill all fields to calculate</p>
        )}
      </div>

      {/* Formula reminder */}
      <div className="rounded p-3 text-xs text-slate-500 mono text-center"
           style={{ background: 'var(--bg)', border: '1px dashed var(--border)' }}>
        y = y1 + (x − x1) × (y2 − y1) / (x2 − x1)
      </div>
    </div>
  )
}

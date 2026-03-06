import { useState } from 'react'
import { unitCategories, toKelvin, fromKelvin } from '../../data/units'

function convert(value, fromUnit, toUnit, category) {
  if (category.special === 'temperature') {
    const k = toKelvin(value, fromUnit.id)
    return fromKelvin(k, toUnit.id)
  }
  // Standard: value * fromFactor / toFactor
  return (value * fromUnit.factor) / toUnit.factor
}

export function UnitConverter() {
  const [catId, setCatId] = useState(unitCategories[0].id)
  const [value, setValue] = useState('')
  const [fromId, setFromId] = useState(unitCategories[0].units[0].id)
  const [toId, setToId] = useState(unitCategories[0].units[1].id)

  const category = unitCategories.find(c => c.id === catId)
  const fromUnit = category.units.find(u => u.id === fromId)
  const toUnit = category.units.find(u => u.id === toId)

  const numVal = parseFloat(value)
  const result = (!isNaN(numVal) && fromUnit && toUnit)
    ? convert(numVal, fromUnit, toUnit, category)
    : null

  const handleCatChange = (id) => {
    const cat = unitCategories.find(c => c.id === id)
    setCatId(id)
    setFromId(cat.units[0].id)
    setToId(cat.units[1].id)
    setValue('')
  }

  const swap = () => { setFromId(toId); setToId(fromId) }

  const selectStyle = {
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
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-100">Unit Converter</h2>
        <p className="text-xs text-slate-500 mt-0.5">Power plant & electrical engineering units</p>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {unitCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCatChange(cat.id)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              background: catId === cat.id ? 'var(--amber)' : 'var(--bg-light)',
              color: catId === cat.id ? 'var(--bg)' : 'var(--text-muted)',
              border: `1px solid ${catId === cat.id ? 'var(--amber)' : 'var(--border)'}`,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="rounded-lg p-4 flex flex-col gap-3"
           style={{ background: 'var(--bg-light)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 uppercase tracking-wider mono">Value</label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Enter value"
            className="mono text-sm px-3 py-2 rounded outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider mono">From</label>
            <select value={fromId} onChange={e => setFromId(e.target.value)} style={selectStyle}>
              {category.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>

          <button onClick={swap} className="mb-0.5 px-2 py-2 rounded text-amber-400 text-xs"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  title="Swap units">⇌</button>

          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider mono">To</label>
            <select value={toId} onChange={e => setToId(e.target.value)} style={selectStyle}>
              {category.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="rounded-lg p-4 text-center"
           style={{
             background: result !== null ? 'rgba(245,158,11,0.08)' : 'var(--bg-light)',
             border: `1px solid ${result !== null ? 'var(--amber)' : 'var(--border)'}`,
           }}>
        {result !== null ? (
          <>
            <p className="mono text-3xl font-bold text-amber-400">
              {Math.abs(result) < 0.0001 || Math.abs(result) > 1e9
                ? result.toExponential(4)
                : parseFloat(result.toFixed(6)).toString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">{toUnit?.label}</p>
          </>
        ) : (
          <p className="text-slate-600 text-sm">Enter a value to convert</p>
        )}
      </div>
    </div>
  )
}

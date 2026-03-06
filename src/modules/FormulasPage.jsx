import { useState } from 'react'
import { Search } from 'lucide-react'
import { formulaCategories } from '../data/formulas'

export function FormulasPage() {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all')

  const q = search.toLowerCase()

  const filtered = formulaCategories
    .filter(cat => activeCat === 'all' || cat.id === activeCat)
    .map(cat => ({
      ...cat,
      formulas: cat.formulas.filter(f =>
        !q || f.title.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        f.vars.toLowerCase().includes(q)
      )
    }))
    .filter(cat => cat.formulas.length > 0)

  return (
    <div className="flex flex-col h-full">
      {/* Sticky search + filter header */}
      <div className="sticky top-0 z-10 p-3 flex flex-col gap-2"
           style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search formulas…"
            className="w-full text-sm pl-8 pr-3 py-2 rounded-lg outline-none"
            style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[{ id: 'all', label: 'All' }, ...formulaCategories].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                background: activeCat === cat.id ? 'var(--amber)' : 'var(--bg-light)',
                color: activeCat === cat.id ? 'var(--bg)' : 'var(--text-muted)',
                border: `1px solid ${activeCat === cat.id ? 'var(--amber)' : 'var(--border)'}`,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formula cards */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-500 text-sm mt-10">No formulas match your search</div>
        ) : (
          filtered.map(cat => (
            <div key={cat.id}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mono">{cat.label}</p>
              <div className="flex flex-col gap-2">
                {cat.formulas.map(f => (
                  <div key={f.id} className="rounded-lg p-3"
                       style={{ background: 'var(--bg-light)', border: '1px solid var(--border)' }}>
                    <p className="text-sm font-semibold text-slate-200 mb-1">{f.title}</p>
                    <p className="mono text-amber-400 text-sm mb-2 font-medium">{f.formula}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.vars}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

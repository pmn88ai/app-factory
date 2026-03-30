'use client'
import { useState, useEffect } from 'react'
import { dbGetApps } from '../lib/db'

export default function AppSelector({ value, onChange }) {
  const [apps, setApps] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    dbGetApps().then(setApps).catch(() => {})
  }, [])

  const selected = apps.find(a => a.id === value)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-forge-panel border border-forge-border rounded-xl px-4 py-3 text-sm transition-all hover:border-forge-accent/30 focus:outline-none focus:border-forge-accent"
      >
        <span className={selected ? 'text-forge-accent font-mono' : 'text-forge-muted'}>
          {selected ? `${selected.name} (${selected.slug})` : 'Chưa gắn app nào'}
        </span>
        <span className="text-forge-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-forge-card border border-forge-border rounded-xl overflow-hidden shadow-2xl animate-fade-in">
            {/* None option */}
            <button
              onClick={() => { onChange(null); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-forge-border ${
                !value ? 'text-forge-accent bg-forge-accent/5' : 'text-forge-muted hover:bg-forge-card'
              }`}
            >
              <span className="w-6 text-center">—</span>
              <span>Không gắn</span>
            </button>

            {apps.length === 0 ? (
              <div className="px-4 py-3 text-xs text-forge-muted">
                Chưa có app nào. <a href="/apps" className="text-forge-accent underline">Tạo app</a>
              </div>
            ) : (
              apps.map(app => (
                <button
                  key={app.id}
                  onClick={() => { onChange(app.id); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                    value === app.id ? 'text-forge-accent bg-forge-accent/5' : 'text-forge-text hover:bg-forge-panel'
                  }`}
                >
                  <span className="w-6 h-6 rounded bg-forge-accent/10 border border-forge-accent/20 flex items-center justify-center text-xs font-display font-bold text-forge-accent flex-shrink-0">
                    {app.slug.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{app.name}</p>
                    <p className="text-xs text-forge-muted font-mono">"{app.slug}"</p>
                  </div>
                  {value === app.id && <span className="ml-auto text-forge-accent">✓</span>}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { dbGetApps, dbCreateApp, dbDeleteApp } from '../../lib/db'
import { formatDate } from '../../lib/storage'

// Slug validation: chỉ lowercase, số, dấu gạch ngang
function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export default function AppsPage() {
  const router = useRouter()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { loadApps() }, [])

  async function loadApps() {
    setLoading(true)
    try {
      const data = await dbGetApps()
      setApps(data ?? [])
    } catch (err) {
      console.error(err)
      setApps([])
    } finally {
      setLoading(false)
    }
  }

  function handleNameChange(val) {
    setName(val)
    if (!slugManual) setSlug(toSlug(val))
  }

  function handleSlugChange(val) {
    setSlugManual(true)
    setSlug(toSlug(val))
  }

  async function handleCreate() {
    const n = name.trim()
    const s = slug.trim()
    if (!n || !s) return
    setError('')
    setCreating(true)
    try {
      const app = await dbCreateApp(n, s)
      setApps(prev => [app, ...prev])
      setShowCreate(false)
      setName(''); setSlug(''); setSlugManual(false)
    } catch (err) {
      setError(err.message?.includes('unique') ? 'Slug này đã tồn tại.' : err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(app) {
    try {
      await dbDeleteApp(app.id)
      setApps(prev => prev.filter(a => a.id !== app.id))
    } catch (err) {
      alert('Xóa thất bại: ' + err.message)
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <main className="min-h-screen bg-forge-bg">
      <header className="sticky top-0 z-20 bg-forge-bg/90 backdrop-blur-md border-b border-forge-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-8 h-8 flex items-center justify-center text-forge-muted hover:text-forge-text border border-forge-border rounded-lg text-sm"
            >←</button>
            <div>
              <h1 className="text-lg font-display font-bold text-forge-text">
                🗂 <span className="text-forge-accent">APP</span> REGISTRY
              </h1>
              <p className="text-xs text-forge-muted mt-0.5">Quản lý định danh các app</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Create button */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-4 bg-forge-accent text-forge-bg font-display font-bold text-sm rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>+</span><span>Tạo App Mới</span>
          </button>
        ) : (
          <div className="bg-forge-card border border-forge-accent/30 rounded-2xl p-4 space-y-3 animate-slide-up">
            <h2 className="text-sm font-display font-bold text-forge-accent">✦ App Mới</h2>

            <input
              type="text"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Tên app (vd: Karaoke App)"
              autoFocus
              className="w-full bg-forge-panel border border-forge-border rounded-xl px-4 py-3 text-sm text-forge-text font-mono placeholder-forge-muted focus:outline-none focus:border-forge-accent transition-colors"
            />

            {/* Slug field */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-forge-panel border border-forge-border rounded-xl overflow-hidden focus-within:border-forge-accent transition-colors">
                  <span className="text-xs text-forge-muted px-3 border-r border-forge-border py-3 font-mono">APP_ID</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="karaoke-app"
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-forge-accent font-mono focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-forge-muted px-1">
                Dùng trong code: <code className="text-forge-accent">const APP_ID = "{slug || 'slug'}"</code>
              </p>
            </div>

            {error && (
              <p className="text-xs text-forge-danger bg-forge-danger/10 border border-forge-danger/30 rounded-xl px-3 py-2">
                ❌ {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setShowCreate(false); setName(''); setSlug(''); setSlugManual(false); setError('') }}
                className="py-3 bg-forge-panel border border-forge-border text-forge-muted text-sm rounded-xl active:scale-95"
              >Hủy</button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !slug.trim() || creating}
                className="py-3 bg-forge-accent text-forge-bg font-display font-bold text-sm rounded-xl active:scale-95 disabled:opacity-50"
              >{creating ? '⟳ Đang tạo...' : '→ Tạo'}</button>
            </div>
          </div>
        )}

        {/* App list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs text-forge-muted font-mono uppercase tracking-widest">Danh Sách App</h2>
            <span className="text-xs text-forge-muted">{apps.length} apps</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-forge-card border border-forge-border rounded-2xl animate-pulse" />)}
            </div>
          ) : (apps || []).length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🗂</div>
              <p className="text-forge-muted text-sm">Chưa có app nào.</p>
            </div>
          ) : (
            (apps || []).map((app, idx) => (
              <div
                key={app?.id}
                className="bg-forge-card border border-forge-border rounded-2xl overflow-hidden animate-fade-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <button
                  onClick={() => router.push(`/apps/${app?.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-forge-accent/10 border border-forge-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-forge-accent text-sm font-display font-bold">
                      {(app?.slug || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-forge-text">{app?.name || 'Unknown'}</p>
                    <p className="text-xs text-forge-muted font-mono mt-0.5">APP_ID: "{app?.slug || 'no-slug'}"</p>
                  </div>
                  <span className="text-forge-muted">→</span>
                </button>
                <div className="px-4 pb-3 flex items-center justify-between">
                  <span className="text-xs text-forge-muted">{formatDate(app?.created_at)}</span>
                  <button
                    onClick={() => setDeleteTarget(app)}
                    className="text-xs text-forge-muted hover:text-forge-danger transition-colors"
                  >🗑 Xóa</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-forge-panel border border-forge-danger/30 rounded-2xl p-6 w-full max-w-sm animate-slide-up">
              <h3 className="font-display font-bold text-forge-text mb-2">⚠️ Xóa App?</h3>
              <p className="text-sm text-forge-textDim mb-1">
                App <strong className="text-forge-text">"{deleteTarget.name}"</strong> sẽ bị xóa.
              </p>
              <p className="text-xs text-forge-muted mb-6">
                Projects gắn với app này sẽ bị unlink (không xóa project).
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setDeleteTarget(null)} className="py-3 bg-forge-card border border-forge-border text-forge-muted text-sm rounded-xl">Hủy</button>
                <button onClick={() => handleDelete(deleteTarget)} className="py-3 bg-forge-danger/20 border border-forge-danger/40 text-forge-danger font-bold text-sm rounded-xl">Xóa</button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  )
}

'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { formatDate } from '../../../lib/storage'

export default function AppDetailPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [app, setApp] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => { loadApp() }, [id])

  async function loadApp() {
    setLoading(true)
    try {
      // Load app info
      const { data: appData, error: appErr } = await supabase
        .from('apps')
        .select('id, slug, name, created_at')
        .eq('id', id)
        .single()

      if (appErr || !appData) { router.push('/apps'); return }
      setApp(appData)

      // Load projects thuộc app này
      const { data: projData, error: projErr } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .eq('app_id', id)
        .eq('is_template', false)
        .order('created_at', { ascending: false })

      if (!projErr) setProjects(projData ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const snippet = `export const APP_ID = "${app?.slug}"

/**
 * Resolve UUID từ Supabase theo APP_ID
 * Dùng trong các app thuộc hệ RồngLeo
 */
export async function getAppId(supabase) {
  const { data } = await supabase
    .from('apps')
    .select('id')
    .eq('slug', APP_ID)
    .single()
  return data?.id
}`

  async function handleCopyId() {
    if (!app) return
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  if (loading) return (
    <main className="min-h-screen bg-forge-bg flex items-center justify-center">
      <p className="text-forge-muted animate-pulse font-mono">⟳ Đang tải...</p>
    </main>
  )

  if (!app) return null

  return (
    <main className="min-h-screen bg-forge-bg">
      <header className="sticky top-0 z-20 bg-forge-bg/90 backdrop-blur-md border-b border-forge-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/apps')}
              className="w-8 h-8 flex items-center justify-center text-forge-muted hover:text-forge-text border border-forge-border rounded-lg text-sm"
            >←</button>
            <div>
              <h1 className="text-base font-display font-bold text-forge-text">{app.name}</h1>
              <p className="text-xs text-forge-muted font-mono">APP_ID: "{app.slug}"</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* APP_ID copy card */}
        <div className="bg-forge-card border border-forge-accent/20 rounded-2xl p-4 space-y-3">
          <div className="space-y-3">
          <p className="text-xs text-forge-muted uppercase tracking-wider">Dùng trong code</p>
          <div className="bg-forge-panel border border-forge-border rounded-xl p-3 overflow-x-auto">
            <pre className="text-xs text-forge-accent font-mono whitespace-pre">{snippet}</pre>
          </div>
          <button
            onClick={handleCopyId}
            className="w-full py-2.5 bg-forge-accent text-forge-bg text-xs font-bold rounded-xl active:scale-95 transition-all"
          >
            {copied ? '✓ Đã copy snippet' : '📋 Copy code snippet'}
          </button>
        </div>
          <p className="text-xs text-forge-muted">
            UUID: <span className="font-mono text-forge-muted/70">{app.id}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-forge-card border border-forge-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-display font-bold text-forge-accent">{projects.length}</p>
            <p className="text-xs text-forge-muted mt-1">Projects</p>
          </div>
          <div className="bg-forge-card border border-forge-border rounded-2xl p-4 text-center">
            <p className="text-xs font-mono text-forge-accent font-bold">{app.slug}</p>
            <p className="text-xs text-forge-muted mt-1">Slug</p>
          </div>
        </div>

        {/* Projects list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs text-forge-muted font-mono uppercase tracking-widest">
              Projects thuộc app này
            </h2>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs text-forge-accent hover:underline"
            >
              + Thêm project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="py-10 text-center bg-forge-card border border-forge-border rounded-2xl">
              <p className="text-forge-muted text-sm">Chưa có project nào.</p>
              <p className="text-forge-muted/60 text-xs mt-1">
                Vào Dashboard → tạo project → chọn app này.
              </p>
            </div>
          ) : (
            projects.map((project, idx) => (
              <button
                key={project.id}
                onClick={() => router.push(`/project/${project.id}`)}
                className="w-full flex items-center gap-3 px-4 py-4 bg-forge-card border border-forge-border rounded-2xl text-left hover:border-forge-border/80 transition-all animate-fade-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="w-8 h-8 rounded-lg bg-forge-accent/10 border border-forge-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-forge-accent text-xs font-display font-bold">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-forge-text truncate">{project.name}</p>
                  <p className="text-xs text-forge-muted mt-0.5">{formatDate(project.created_at)}</p>
                </div>
                <span className="text-forge-muted">→</span>
              </button>
            ))
          )}
        </div>
      </div>
    </main>
  )
}

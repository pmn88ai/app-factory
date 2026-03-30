'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  dbGetProjectsWithApp, dbCreateProject, dbDeleteProject,
  dbRenameProject, dbDuplicateProject, dbSetTemplate,
  dbGetSteps, dbGetApps, dbSetProjectApp,
} from '../../lib/db'
import { lsGetProjects, lsSetProjects, lsDeleteProject, formatDate } from '../../lib/storage'
import { buildExportPayload, downloadJSON, buildExportFilename } from '../../lib/exportImport'
import ProjectMenu from '../../components/ProjectMenu'
import ImportModal from '../../components/ImportModal'
import AppSelector from '../../components/AppSelector'
import { supabase } from '../../lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAppId, setNewAppId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [menuTarget, setMenuTarget] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [appFilter, setAppFilter] = useState(null) // null = All
  const [isOnline, setIsOnline] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    // 👤 lấy user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    loadAll()

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      if (navigator.onLine) {
        const [projs, appList] = await Promise.all([
          dbGetProjectsWithApp(),
          dbGetApps(),
        ])
        setProjects(projs)
        setApps(appList)
        lsSetProjects(projs)
      } else {
        setProjects(lsGetProjects().filter(p => !p.is_template))
      }
    } catch (err) {
      setProjects(lsGetProjects().filter(p => !p.is_template))
    } finally {
      setLoading(false)
    }
  }

  // Filter: search + app
  const filteredProjects = useMemo(() => {
    let list = projects || []
    // App filter
    if (appFilter === 'none') {
      list = list.filter(p => !p?.app_id)
    } else if (appFilter) {
      list = list.filter(p => p?.app_id === appFilter)
    }
    // Search filter
    const q = searchQuery?.trim()?.toLowerCase()
    if (q) list = list.filter(p => (p?.name || '').toLowerCase().includes(q))
    return list
  }, [projects, searchQuery, appFilter])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    try {
      if (navigator.onLine) {
        const project = await dbCreateProject(name)
        // Gắn app nếu user chọn
        if (newAppId) await dbSetProjectApp(project.id, newAppId)
        router.push(`/project/${project.id}`)
      } else {
        const localId = 'local-' + Date.now()
        const localProject = { id: localId, name, created_at: new Date().toISOString(), is_template: false, app_id: null }
        lsSetProjects([localProject, ...lsGetProjects()])
        router.push(`/project/${localId}`)
      }
    } catch (err) {
      alert('Tạo project thất bại: ' + err.message)
      setCreating(false)
    }
  }

  async function handleDelete(project) {
    try {
      if (navigator.onLine && !project.id.startsWith('local-')) await dbDeleteProject(project.id)
      lsDeleteProject(project.id)
      setProjects(prev => prev.filter(p => p.id !== project.id))
    } catch (err) {
      alert('Xóa thất bại: ' + err.message)
    } finally {
      setDeleteTarget(null)
    }
  }

  async function handleRename(id, name) {
    try {
      await dbRenameProject(id, name)
      setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p))
    } catch (err) { alert('Đổi tên thất bại: ' + err.message) }
  }

  async function handleDuplicate(project) {
    try {
      const newProject = await dbDuplicateProject(project.id, `${project.name} (copy)`)
      setProjects(prev => [{ ...newProject, apps: project.apps }, ...prev])
    } catch (err) { alert('Nhân đôi thất bại: ' + err.message) }
  }

  async function handleSaveAsTemplate(id) {
    try {
      await dbSetTemplate(id, true)
      const project = projects.find(p => p.id === id)
      if (project && !project.name.includes('[Template]')) {
        await dbRenameProject(id, `[Template] ${project.name}`).catch(() => {})
      }
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (err) { alert('Lỗi: ' + err.message) }
  }

  async function handleExport(project) {
    try {
      const stepsMap = await dbGetSteps(project.id)
      downloadJSON(buildExportPayload(project.name, stepsMap), buildExportFilename(project.name))
    } catch (err) { alert('Export thất bại: ' + err.message) }
  }

  async function handleImport(name, stepsContentMap) {
    const project = await dbCreateProject(name)
    const { dbUpsertAllSteps } = await import('../../lib/db')
    const stepsMap = {}
    for (const [key, content] of Object.entries(stepsContentMap)) {
      stepsMap[key] = { content, versions: [] }
    }
    await dbUpsertAllSteps(project.id, stepsMap)
    router.push(`/project/${project.id}`)
  }

  return (
    <main className="min-h-screen bg-forge-bg">
      <header className="sticky top-0 z-20 bg-forge-bg/90 backdrop-blur-md border-b border-forge-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold text-forge-text">
                🏭 <span className="text-forge-accent">APP</span> FACTORY
              </h1>
              <p className="text-xs text-forge-muted mt-0.5">Xưởng sản xuất app bằng AI</p>
            </div>
            <div className="flex items-center gap-2">

              {/* 👤 email */}
              {user && (
                <span className="text-xs text-forge-muted font-mono hidden sm:inline">
                  {user.email}
                </span>
              )}

              {/* trạng thái online */}
              <span className={`text-xs px-2 py-1 rounded-full border font-mono ${
                isOnline
                  ? 'text-forge-accent border-forge-accent/30 bg-forge-accent/10'
                  : 'text-forge-warning border-forge-warning/30 bg-forge-warning/10'
              }`}>
                {isOnline ? '● Online' : '○ Offline'}
              </span>

              {/* logout */}
              <button
                onClick={handleLogout}
                className="text-xs px-2 py-1 rounded-full border border-forge-border text-forge-muted font-mono hover:border-red-500 hover:text-red-400 transition-all"
              >
                Logout
              </button>

            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              // Pre-fill app từ filter đang active
              if (appFilter && appFilter !== 'none') setNewAppId(appFilter)
              setShowCreate(true)
            }}
            className="col-span-2 py-4 bg-forge-accent text-forge-bg font-display font-bold text-sm rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>+</span><span>Project Mới</span>
          </button>
          <div className="grid grid-rows-3 gap-1">
            <button onClick={() => router.push('/apps')} className="py-1 bg-forge-card border border-forge-border text-forge-text text-xs rounded-xl active:scale-95 flex items-center justify-center gap-1 hover:border-forge-accent/30">
              🗂 Apps
            </button>
            <button onClick={() => router.push('/templates')} className="py-1 bg-forge-card border border-forge-border text-forge-text text-xs rounded-xl active:scale-95 flex items-center justify-center gap-1 hover:border-forge-accent/30">
              ⭐ Templates
            </button>
            <button onClick={() => setShowImport(true)} className="py-1 bg-forge-card border border-forge-border text-forge-text text-xs rounded-xl active:scale-95 flex items-center justify-center gap-1 hover:border-forge-accent/30">
              📥 Import
            </button>
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-forge-card border border-forge-accent/30 rounded-2xl p-4 space-y-3 animate-slide-up">
            <h2 className="text-sm font-display font-bold text-forge-accent">✦ Project Mới</h2>
            <input
              type="text" value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Tên project..." autoFocus
              className="w-full bg-forge-panel border border-forge-border rounded-xl px-4 py-3 text-sm text-forge-text font-mono placeholder-forge-muted focus:outline-none focus:border-forge-accent transition-colors"
            />
            {/* App selector */}
            <div className="space-y-1">
              <p className="text-xs text-forge-muted px-1">Thuộc app:</p>
              <AppSelector value={newAppId} onChange={setNewAppId} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setShowCreate(false); setNewName(''); setNewAppId(null) }}
                className="py-3 bg-forge-panel border border-forge-border text-forge-muted text-sm rounded-xl active:scale-95">Hủy</button>
              <button onClick={handleCreate} disabled={!newName.trim() || creating}
                className="py-3 bg-forge-accent text-forge-bg font-display font-bold text-sm rounded-xl active:scale-95 disabled:opacity-50">
                {creating ? '⟳ Đang tạo...' : '→ Tạo'}
              </button>
            </div>
          </div>
        )}

        {/* App filter tabs */}
        {apps.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setAppFilter(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                appFilter === null ? 'bg-forge-accent text-forge-bg font-bold' : 'bg-forge-card border border-forge-border text-forge-muted hover:text-forge-text'
              }`}
            >Tất cả</button>
            { (apps || []).map(app => (
              <button
                key={app?.id}
                onClick={() => setAppFilter(appFilter === app?.id ? null : app?.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  appFilter === app?.id ? 'bg-forge-accent text-forge-bg font-bold' : 'bg-forge-card border border-forge-border text-forge-muted hover:text-forge-text'
                }`}
              >{app?.name || 'Unknown'}</button>
            ))}
            <button
              onClick={() => setAppFilter('none')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                appFilter === 'none' ? 'bg-forge-warning/20 text-forge-warning border border-forge-warning/30' : 'bg-forge-card border border-forge-border text-forge-muted hover:text-forge-text'
              }`}
            >Chưa gắn</button>
          </div>
        )}

        {/* Search */}
        {projects.length > 3 && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-muted text-sm">🔍</span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm project..."
              className="w-full bg-forge-card border border-forge-border rounded-xl pl-9 pr-4 py-3 text-sm text-forge-text font-mono placeholder-forge-muted focus:outline-none focus:border-forge-accent transition-colors"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-muted text-xs">✕</button>}
          </div>
        )}

        {/* Project list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs text-forge-muted font-mono uppercase tracking-widest">Danh Sách Project</h2>
            <span className="text-xs text-forge-muted">{filteredProjects.length}{(searchQuery || appFilter) ? `/${projects.length}` : ''} projects</span>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-forge-card border border-forge-border rounded-2xl animate-pulse" />)}</div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">{searchQuery || appFilter ? '🔍' : '🏗️'}</div>
              <p className="text-forge-muted text-sm">{searchQuery ? `Không tìm thấy "${searchQuery}"` : appFilter ? 'Không có project nào trong filter này.' : 'Chưa có project nào.'}</p>
            </div>
          ) : (
            filteredProjects.map((project, idx) => (
              <div key={project.id}
                className="bg-forge-card border border-forge-border rounded-2xl overflow-hidden hover:border-forge-border/80 transition-all animate-fade-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center">
                  <button onClick={() => router.push(`/project/${project.id}`)}
                    className="flex-1 flex items-center gap-3 px-4 py-4 text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-forge-accent/10 border border-forge-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-forge-accent text-sm font-display font-bold">{(project?.name || '?').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-forge-text truncate">{project?.name || 'Chưa đặt tên'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-forge-muted">{formatDate(project?.created_at)}</p>
                        {project?.apps && (
                          <span className="text-xs text-forge-accent font-mono bg-forge-accent/10 px-1.5 py-0.5 rounded">
                            {project?.apps?.slug || 'no-slug'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setMenuTarget(project)} className="px-4 py-4 text-forge-muted hover:text-forge-text transition-colors text-lg">···</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {menuTarget && (
        <ProjectMenu
          project={menuTarget}
          onRename={handleRename}
          onDuplicate={handleDuplicate}
          onSaveAsTemplate={handleSaveAsTemplate}
          onRemoveTemplate={() => {}}
          onExport={handleExport}
          onShare={() => {}}
          onDelete={(p) => { setDeleteTarget(p); setMenuTarget(null) }}
          onClose={() => setMenuTarget(null)}
        />
      )}

      {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />}

      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-forge-panel border border-forge-danger/30 rounded-2xl p-6 w-full max-w-sm animate-slide-up">
              <h3 className="font-display font-bold text-forge-text mb-2">⚠️ Xóa Project?</h3>
              <p className="text-sm text-forge-textDim mb-6">Project <strong className="text-forge-text">"{deleteTarget.name}"</strong> sẽ bị xóa vĩnh viễn.</p>
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

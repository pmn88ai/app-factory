'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { dbGetTemplates, dbCreateFromTemplate, dbDeleteProject, dbSetTemplate } from '../../lib/db'
import { formatDate } from '../../lib/storage'

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(null) // templateId đang tạo
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [newNameFor, setNewNameFor] = useState(null) // templateId đang nhập tên
  const [inputName, setInputName] = useState('')

  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const data = await dbGetTemplates()
      setTemplates(data ?? [])
    } catch (err) {
      console.error('Load templates failed:', err)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  function handleStartCreate(template) {
    if (!template) return
    setNewNameFor(template?.id)
    setInputName(`${template?.name || 'Untitled'} (copy)`)
  }

  async function handleCreateFromTemplate(templateId) {
    if (!templateId) return
    const name = inputName?.trim()
    if (!name) return
    setCreating(templateId)
    try {
      const project = await dbCreateFromTemplate(templateId, name)
      router.push(`/project/${project?.id}`)
    } catch (err) {
      alert('Tạo từ template thất bại: ' + err.message)
      setCreating(null)
    }
  }

  async function handleDelete(template) {
    try {
      await dbDeleteProject(template.id)
      setTemplates(prev => prev.filter(t => t.id !== template.id))
    } catch (err) {
      alert('Xóa thất bại: ' + err.message)
    } finally {
      setDeleteTarget(null)
    }
  }

  async function handleRemoveTemplate(id) {
    try {
      await dbSetTemplate(id, false)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      alert('Lỗi: ' + err.message)
    }
  }

  return (
    <main className="min-h-screen bg-forge-bg">
      <header className="sticky top-0 z-20 bg-forge-bg/90 backdrop-blur-md border-b border-forge-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-8 h-8 flex items-center justify-center text-forge-muted hover:text-forge-text transition-colors rounded-lg border border-forge-border text-sm"
            >
              ←
            </button>
            <div>
              <h1 className="text-lg font-display font-bold text-forge-text">
                ⭐ <span className="text-forge-accent">TEMPLATES</span>
              </h1>
              <p className="text-xs text-forge-muted mt-0.5">Template cá nhân của mày</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-forge-card border border-forge-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (templates || []).length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">⭐</div>
            <p className="text-forge-muted text-sm">Chưa có template nào.</p>
            <p className="text-forge-muted/60 text-xs mt-1 leading-relaxed">
              Mở một project → menu (···) → "Lưu làm Template"
            </p>
          </div>
        ) : (
          (templates || []).map((template, idx) => (
            <div
              key={template?.id}
              className="bg-forge-card border border-forge-border rounded-2xl overflow-hidden animate-fade-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-forge-warning/10 border border-forge-warning/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">⭐</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-forge-text truncate">{template?.name || 'Chưa đặt tên'}</p>
                      <p className="text-xs text-forge-muted mt-0.5">{formatDate(template?.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRemoveTemplate(template?.id)}
                      className="text-xs text-forge-muted hover:text-forge-warning transition-colors px-2 py-1"
                    >
                      Bỏ template
                    </button>
                    <button
                      onClick={() => setDeleteTarget(template)}
                      className="text-xs text-forge-muted hover:text-forge-danger transition-colors px-2 py-1"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* Create from template */}
                {newNameFor === template?.id ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      autoFocus
                      value={inputName}
                      onChange={e => setInputName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreateFromTemplate(template?.id); if (e.key === 'Escape') setNewNameFor(null) }}
                      placeholder="Tên project mới..."
                      className="flex-1 bg-forge-panel border border-forge-accent/30 rounded-xl px-3 py-2 text-sm text-forge-text font-mono placeholder-forge-muted focus:outline-none focus:border-forge-accent"
                    />
                    <button
                      onClick={() => handleCreateFromTemplate(template?.id)}
                      disabled={!inputName?.trim() || creating === template?.id}
                      className="px-4 py-2 bg-forge-accent text-forge-bg text-sm font-bold rounded-xl active:scale-95 disabled:opacity-50"
                    >
                      {creating === template?.id ? '⟳' : '→'}
                    </button>
                    <button
                      onClick={() => setNewNameFor(null)}
                      className="px-3 py-2 bg-forge-panel border border-forge-border text-forge-muted text-sm rounded-xl"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartCreate(template)}
                    className="mt-3 w-full py-2.5 bg-forge-accent/10 border border-forge-accent/30 text-forge-accent text-sm font-display font-bold rounded-xl hover:bg-forge-accent/20 transition-all active:scale-95"
                  >
                    + Tạo project từ template này
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-forge-panel border border-forge-danger/30 rounded-2xl p-6 w-full max-w-sm animate-slide-up">
              <h3 className="font-display font-bold text-forge-text mb-2">🗑 Xóa Template?</h3>
              <p className="text-sm text-forge-textDim mb-5">
                Template <strong className="text-forge-text">"{deleteTarget.name}"</strong> sẽ bị xóa vĩnh viễn.
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

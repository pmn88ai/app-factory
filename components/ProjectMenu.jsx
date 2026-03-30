'use client'
import { useState } from 'react'

export default function ProjectMenu({ project, onRename, onDuplicate, onSaveAsTemplate, onRemoveTemplate, onExport, onShare, onDelete, onClose }) {
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(project.name)
  const [busy, setBusy] = useState(false)

  async function handleRename() {
    const name = newName.trim()
    if (!name || name === project.name) { setRenaming(false); return }
    setBusy(true)
    await onRename(project.id, name)
    setBusy(false)
    setRenaming(false)
    onClose()
  }

  const isTemplate = project.is_template

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-forge-panel border-t border-forge-border rounded-t-2xl animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-forge-border rounded-full" />
        </div>

        {/* Project name header */}
        <div className="px-4 py-3 border-b border-forge-border">
          {renaming ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false) }}
                className="flex-1 bg-forge-card border border-forge-accent/40 rounded-xl px-3 py-2 text-sm text-forge-text font-mono focus:outline-none"
              />
              <button
                onClick={handleRename}
                disabled={busy}
                className="px-4 py-2 bg-forge-accent text-forge-bg text-sm font-bold rounded-xl active:scale-95"
              >
                {busy ? '...' : '✓'}
              </button>
              <button
                onClick={() => { setRenaming(false); setNewName(project.name) }}
                className="px-3 py-2 bg-forge-card border border-forge-border text-forge-muted text-sm rounded-xl"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-forge-text truncate">{project.name}</p>
              {isTemplate && (
                <span className="text-xs bg-forge-warning/20 text-forge-warning px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                  template
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2">
          {/* Rename */}
          <MenuItem icon="✏️" label="Đổi tên" onClick={() => setRenaming(true)} />

          {/* Duplicate */}
          <MenuItem icon="📋" label="Nhân đôi project" onClick={() => { onDuplicate(project); onClose() }} />

          {/* Template toggle */}
          {isTemplate ? (
            <MenuItem
              icon="📁"
              label="Bỏ khỏi Template"
              onClick={() => { onRemoveTemplate(project.id); onClose() }}
              muted
            />
          ) : (
            <MenuItem
              icon="⭐"
              label="Lưu làm Template"
              onClick={() => { onSaveAsTemplate(project.id); onClose() }}
            />
          )}

          {/* Export */}
          <MenuItem icon="📤" label="Xuất JSON" onClick={() => { onExport(project); onClose() }} />

          {/* Share */}
          <MenuItem
            icon="🔗"
            label={project.is_public ? "Quản lý chia sẻ ●" : "Chia sẻ project"}
            onClick={() => { onShare(project); onClose() }}
          />

          <div className="h-px bg-forge-border my-1" />

          {/* Delete */}
          <MenuItem
            icon="🗑"
            label="Xóa project"
            onClick={() => { onDelete(project); onClose() }}
            danger
          />
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm text-forge-muted bg-forge-card border border-forge-border rounded-xl active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  )
}

function MenuItem({ icon, label, onClick, danger, muted }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all active:scale-95 ${
        danger
          ? 'text-forge-danger hover:bg-forge-danger/10 border border-transparent hover:border-forge-danger/20'
          : muted
          ? 'text-forge-muted hover:bg-forge-card border border-transparent'
          : 'text-forge-text hover:bg-forge-card border border-transparent hover:border-forge-border'
      }`}
    >
      <span className="text-base w-6 text-center">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

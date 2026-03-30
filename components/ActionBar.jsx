'use client'
import { useState } from 'react'

export default function ActionBar({ stepId, content, onPaste, onAIAssist, onSaveVersion, isLoading }) {
  const [copied, setCopied] = useState(false)
  const [pasteError, setPasteError] = useState(false)

  async function handleCopy() {
    if (!content.trim()) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select all in textarea
      const el = document.querySelector(`#textarea-${stepId}`)
      if (el) { el.select(); document.execCommand('copy') }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      onPaste(text)
    } catch {
      setPasteError(true)
      setTimeout(() => setPasteError(false), 3000)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {/* Copy */}
        <button
          onClick={handleCopy}
          disabled={!content.trim()}
          className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-mono font-medium transition-all active:scale-95
            ${content.trim()
              ? 'bg-forge-card border border-forge-border text-forge-text hover:border-forge-accent hover:text-forge-accent'
              : 'bg-forge-panel border border-forge-border text-forge-muted opacity-50 cursor-not-allowed'
            }`}
        >
          {copied ? (
            <><span>✓</span> <span>Đã Copy</span></>
          ) : (
            <><span>📋</span> <span>Copy</span></>
          )}
        </button>

        {/* Paste */}
        <button
          onClick={handlePaste}
          className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-mono font-medium bg-forge-card border border-forge-border text-forge-text hover:border-forge-accent hover:text-forge-accent transition-all active:scale-95"
        >
          <span>📥</span> <span>Paste</span>
        </button>
      </div>

      {/* Paste fallback warning */}
      {pasteError && (
        <div className="text-xs text-forge-warning bg-forge-warning/10 border border-forge-warning/30 rounded-lg px-3 py-2 animate-fade-in">
          ⚠️ Clipboard bị chặn. Hãy <strong>long-press → Paste</strong> vào ô bên trên.
        </div>
      )}

      {/* AI Assist + Save Version */}
      <div className="grid grid-cols-2 gap-2">
        <AIAssistDropdown
          stepId={stepId}
          content={content}
          onAIAssist={onAIAssist}
          isLoading={isLoading}
        />
        <button
          onClick={onSaveVersion}
          disabled={!content.trim()}
          className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-mono font-medium transition-all active:scale-95
            ${content.trim()
              ? 'bg-forge-card border border-forge-border text-forge-textDim hover:border-forge-muted'
              : 'opacity-40 cursor-not-allowed bg-forge-panel border border-forge-border'
            }`}
        >
          <span>💾</span> <span>Lưu v</span>
        </button>
      </div>
    </div>
  )
}

function AIAssistDropdown({ stepId, content, onAIAssist, isLoading }) {
  const [open, setOpen] = useState(false)

  const modes = [
    { id: 'summarize', label: '📝 Tóm tắt', desc: 'Rút gọn thành spec' },
    { id: 'improve', label: '✨ Cải thiện', desc: 'Nâng cấp production-ready' },
    { id: 'review', label: '🔍 Review', desc: 'Tìm lỗi và rủi ro' },
  ]

  function handleSelect(mode) {
    setOpen(false)
    onAIAssist(mode)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={!content.trim() || isLoading}
        className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-mono font-medium transition-all active:scale-95
          ${content.trim() && !isLoading
            ? 'bg-forge-accent/10 border border-forge-accent/40 text-forge-accent hover:bg-forge-accent/20'
            : 'opacity-40 cursor-not-allowed bg-forge-panel border border-forge-border text-forge-muted'
          }`}
      >
        {isLoading ? (
          <><span className="animate-spin">⟳</span> <span>AI...</span></>
        ) : (
          <><span>🤖</span> <span>AI Assist</span></>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 right-0 z-20 bg-forge-card border border-forge-border rounded-xl overflow-hidden shadow-2xl animate-slide-up">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelect(m.id)}
                className="w-full flex flex-col items-start px-4 py-3 hover:bg-forge-accent/10 hover:text-forge-accent transition-colors border-b border-forge-border last:border-0"
              >
                <span className="text-sm font-medium">{m.label}</span>
                <span className="text-xs text-forge-muted mt-0.5">{m.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

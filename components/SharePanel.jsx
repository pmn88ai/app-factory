'use client'
import { useState } from 'react'
import { dbEnableSharing, dbDisableSharing } from '../lib/share'

export default function SharePanel({ project, onClose }) {
  const [isPublic, setIsPublic] = useState(project.is_public ?? false)
  const [shareToken, setShareToken] = useState(project.share_token ?? null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`
    : null

  async function handleToggle() {
    setLoading(true)
    try {
      if (!isPublic) {
        // Bật sharing
        const token = await dbEnableSharing(project.id)
        setShareToken(token)
        setIsPublic(true)
      } else {
        // Tắt sharing
        await dbDisableSharing(project.id)
        setIsPublic(false)
      }
    } catch (err) {
      alert('Lỗi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-forge-panel border-t border-forge-border rounded-t-2xl animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-forge-border rounded-full" />
        </div>

        <div className="px-4 py-3 border-b border-forge-border">
          <h3 className="font-display font-bold text-forge-text">🔗 Chia Sẻ Project</h3>
          <p className="text-xs text-forge-muted mt-0.5">Tạo link public để chia sẻ pipeline</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between bg-forge-card border border-forge-border rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-forge-text">
                {isPublic ? '🌐 Đang public' : '🔒 Đang riêng tư'}
              </p>
              <p className="text-xs text-forge-muted mt-0.5">
                {isPublic ? 'Ai có link đều xem được' : 'Chỉ mày mới thấy'}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                isPublic ? 'bg-forge-accent' : 'bg-forge-border'
              } ${loading ? 'opacity-50' : ''}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                isPublic ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Share URL */}
          {isPublic && shareUrl && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-xs text-forge-muted">Link chia sẻ</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-forge-card border border-forge-border rounded-xl px-3 py-2.5 overflow-hidden">
                  <p className="text-xs text-forge-accent font-mono truncate">{shareUrl}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 bg-forge-accent text-forge-bg text-xs font-bold rounded-xl active:scale-95 transition-all flex-shrink-0"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
              <p className="text-xs text-forge-muted">
                Người xem có thể đọc và fork project về tài khoản của họ.
              </p>
            </div>
          )}

          {/* Warning khi tắt */}
          {!isPublic && shareToken && (
            <div className="bg-forge-warning/10 border border-forge-warning/30 rounded-xl px-4 py-3">
              <p className="text-xs text-forge-warning">
                ⚠️ Link cũ đã bị vô hiệu hóa. Bật lại sẽ tạo link mới.
              </p>
            </div>
          )}
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

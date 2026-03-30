'use client'
import { formatDate as formatVersionDate } from '../lib/storage'

export default function VersionDrawer({ versions, onRestore, onClose }) {
  if (!versions || versions.length === 0) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-forge-panel border-t border-forge-border rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-forge-border rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 border-b border-forge-border">
          <h3 className="font-display font-bold text-forge-text">
            📜 Lịch Sử Phiên Bản
          </h3>
          <span className="text-xs text-forge-muted bg-forge-card px-2 py-1 rounded-full">
            {versions.length}/10
          </span>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
          {versions.map((v, idx) => (
            <div
              key={v.id}
              className="bg-forge-card border border-forge-border rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-forge-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-forge-accent font-display">
                    v{versions.length - idx}
                  </span>
                  {idx === 0 && (
                    <span className="text-xs bg-forge-accent/20 text-forge-accent px-1.5 py-0.5 rounded">
                      mới nhất
                    </span>
                  )}
                </div>
                <span className="text-xs text-forge-muted">
                  {formatVersionDate(v.savedAt)}
                </span>
              </div>

              <div className="px-3 py-2">
                <p className="text-xs text-forge-textDim line-clamp-3 font-mono leading-relaxed">
                  {v.content || '(trống)'}
                </p>
              </div>

              <div className="px-3 pb-2">
                <button
                  onClick={() => { onRestore(v.content); onClose() }}
                  className="w-full py-2 text-xs font-medium text-forge-accent border border-forge-accent/30 rounded-lg hover:bg-forge-accent/10 transition-colors active:scale-95"
                >
                  ↩ Khôi phục phiên bản này
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-forge-border">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-medium text-forge-muted bg-forge-card rounded-xl active:scale-95 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  )
}

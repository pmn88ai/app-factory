'use client'

const modeLabels = {
  summarize: '📝 Kết Quả Tóm Tắt',
  improve: '✨ Đề Xuất Cải Thiện',
  review: '🔍 Kết Quả Review',
  finalCheck: '✅ Final Check',
}

export default function AIAssistPanel({ mode, result, onApply, onClose }) {
  if (!result) return null

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-forge-panel border-t border-forge-border rounded-t-2xl max-h-[75vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-forge-border rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 border-b border-forge-border">
          <h3 className="font-display font-bold text-forge-text">
            {modeLabels[mode] || '🤖 AI Assist'}
          </h3>
          <div className="w-2 h-2 rounded-full bg-forge-accent blink" />
        </div>

        {/* Result */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="bg-forge-card border border-forge-accent/20 rounded-xl p-4">
            <pre className="text-sm text-forge-text font-mono whitespace-pre-wrap leading-relaxed break-words">
              {result}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-forge-border flex gap-2">
          {mode !== 'finalCheck' && (
            <button
              onClick={() => { onApply(result); onClose() }}
              className="flex-1 py-3 text-sm font-medium bg-forge-accent text-forge-bg rounded-xl font-display font-bold active:scale-95 transition-all"
            >
              ✓ Áp dụng vào step
            </button>
          )}
          <button
            onClick={onClose}
            className={`py-3 text-sm font-medium bg-forge-card border border-forge-border text-forge-muted rounded-xl active:scale-95 transition-all ${mode === 'finalCheck' ? 'flex-1' : 'px-4'}`}
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  )
}

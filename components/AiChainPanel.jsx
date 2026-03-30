'use client'
import { AI_CHAIN_MAP } from '../hooks/useAIChain'
import { STEP_META } from '../lib/storage'

const MODE_LABELS = {
  improve: 'Cải thiện',
  review: 'Review',
}

export default function AiChainPanel({
  stepsMap,
  chainStatus,
  activeStepKey,
  completedSteps,
  errorStep,
  onRun,
  onCancel,
  onClose,
}) {
  const isRunning = chainStatus === 'running'
  const isDone = chainStatus === 'done'
  const isCancelled = chainStatus === 'cancelled'

  // Các bước sẽ chạy (đủ điều kiện)
  const eligibleSteps = Object.entries(AI_CHAIN_MAP).filter(
    ([key]) => stepsMap[key]?.content?.trim()
  )
  const skippedSteps = Object.entries(AI_CHAIN_MAP).filter(
    ([key]) => !stepsMap[key]?.content?.trim()
  )

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm" onClick={!isRunning ? onClose : undefined} />

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-forge-panel border-t border-forge-border rounded-t-2xl animate-slide-up max-h-[80vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-forge-border rounded-full" />
        </div>

        <div className="px-4 py-3 border-b border-forge-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-forge-text">⚡ Chạy Pipeline AI</h3>
              <p className="text-xs text-forge-muted mt-0.5">
                AI sẽ tự động xử lý {eligibleSteps.length} bước theo thứ tự
              </p>
            </div>
            {/* Status badge */}
            {isRunning && (
              <span className="text-xs text-forge-accent border border-forge-accent/30 bg-forge-accent/10 px-2 py-1 rounded-full font-mono animate-pulse">
                ⟳ Đang chạy
              </span>
            )}
            {isDone && (
              <span className="text-xs text-forge-accent border border-forge-accent/30 bg-forge-accent/10 px-2 py-1 rounded-full">
                ✓ Hoàn tất
              </span>
            )}
            {isCancelled && (
              <span className="text-xs text-forge-warning border border-forge-warning/30 bg-forge-warning/10 px-2 py-1 rounded-full">
                ✕ Đã dừng
              </span>
            )}
          </div>
        </div>

        {/* Step list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {eligibleSteps.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-forge-muted text-sm">Không có step nào đủ điều kiện.</p>
              <p className="text-forge-muted/60 text-xs mt-1">
                Cần có nội dung trong: Spec, Claude Review, GPT Fix, GPT Review Code
              </p>
            </div>
          ) : (
            eligibleSteps.map(([key, mode], idx) => {
              const isActive = activeStepKey === key
              const isDoneStep = completedSteps.includes(key)
              const isError = errorStep === key
              const isPending = !isActive && !isDoneStep && !isError

              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-forge-accent/10 border-forge-accent/40'
                      : isDoneStep
                      ? 'bg-forge-card border-forge-border/40 opacity-70'
                      : isError
                      ? 'bg-forge-danger/10 border-forge-danger/30'
                      : 'bg-forge-card border-forge-border'
                  }`}
                >
                  {/* Status icon */}
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {isActive && <span className="text-forge-accent animate-spin text-lg">⟳</span>}
                    {isDoneStep && <span className="text-forge-accent text-sm">✓</span>}
                    {isError && <span className="text-forge-danger text-sm">✕</span>}
                    {isPending && (
                      <span className="text-xs font-display font-bold text-forge-muted">{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isActive ? 'text-forge-accent' : isDoneStep ? 'text-forge-muted' : 'text-forge-text'
                    }`}>
                      {STEP_META[key]?.label ?? key}
                    </p>
                    <p className="text-xs text-forge-muted mt-0.5">
                      {isActive ? 'Đang xử lý...' : isDoneStep ? 'Đã xong' : isError ? 'Gặp lỗi' : `Sẽ: ${MODE_LABELS[mode]}`}
                    </p>
                  </div>

                  {isActive && (
                    <div className="w-1.5 h-8 bg-forge-accent/30 rounded-full overflow-hidden flex-shrink-0">
                      <div className="w-full bg-forge-accent rounded-full animate-pulse h-1/2" />
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Skipped steps */}
          {skippedSteps.length > 0 && (
            <div className="mt-2 pt-2 border-t border-forge-border">
              <p className="text-xs text-forge-muted mb-2">Bỏ qua (chưa có nội dung):</p>
              {skippedSteps.map(([key]) => (
                <p key={key} className="text-xs text-forge-muted/50 pl-2">
                  · {STEP_META[key]?.label ?? key}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 pt-3 border-t border-forge-border flex-shrink-0 flex gap-3">
          {chainStatus === 'idle' && (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-forge-card border border-forge-border text-forge-muted text-sm rounded-xl active:scale-95"
              >
                Đóng
              </button>
              <button
                onClick={onRun}
                disabled={eligibleSteps.length === 0}
                className="flex-1 py-3 bg-forge-accent text-forge-bg font-display font-bold text-sm rounded-xl active:scale-95 disabled:opacity-40"
              >
                ⚡ Chạy ngay
              </button>
            </>
          )}

          {isRunning && (
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-forge-danger/10 border border-forge-danger/30 text-forge-danger font-bold text-sm rounded-xl active:scale-95"
            >
              ✕ Dừng lại
            </button>
          )}

          {(isDone || isCancelled) && (
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-forge-card border border-forge-border text-forge-muted text-sm rounded-xl active:scale-95"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </>
  )
}

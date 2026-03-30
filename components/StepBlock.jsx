'use client'
import { useState } from 'react'
import ActionBar from './ActionBar'
import VersionDrawer from './VersionDrawer'
import AIAssistPanel from './AIAssistPanel'
import DeployKit from './DeployKit'
import { AI_CHAIN_MAP } from '../hooks/useAIChain'

export default function StepBlock({
  step, stepIndex, totalSteps,
  onChange, onSaveVersion,
  // AI Chain props
  isChainActive,    // bool: bước này đang chạy trong chain
  isChainDone,      // bool: bước này đã xong trong chain
  isChainError,     // bool: bước này lỗi trong chain
}) {
  const [showVersions, setShowVersions] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiMode, setAiMode] = useState(null)

  const isDeployStep = step.id === 'deploy'
  const isFinalCheckStep = step.id === 'final_check'
  const isChainStep = step.id in AI_CHAIN_MAP

  function handleContentChange(e) {
    onChange(step.id, 'content', e.target.value)
  }

  function handlePaste(text) {
    onChange(step.id, 'content', text)
  }

  function handleRestore(content) {
    onChange(step.id, 'content', content)
  }

  async function handleAIAssist(mode) {
    if (!step.content.trim()) return
    setAiLoading(true)
    setAiMode(mode)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, content: step.content, stepName: step.label }),
      })
      const data = await res.json()
      if (data.result) {
        setAiResult(data.result)
        onSaveVersion(step.id, step.content)
      } else {
        alert(data.error || 'AI gặp lỗi')
      }
    } catch {
      alert('Không kết nối được AI')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleFinalCheck() {
    if (!step.content.trim()) return
    setAiLoading(true)
    setAiMode('finalCheck')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'finalCheck', content: step.content }),
      })
      const data = await res.json()
      if (data.result) {
        setAiResult(data.result)
        onSaveVersion(step.id, step.content)
      } else {
        alert(data.error || 'AI gặp lỗi')
      }
    } catch {
      alert('Không kết nối được AI')
    } finally {
      setAiLoading(false)
    }
  }

  function handleApplyAI(result) {
    onChange(step.id, 'content', result)
    onSaveVersion(step.id, step.content)
  }

  function handleDeployGenerated(kit) {
    onChange(step.id, 'content', kit)
  }

  const stepNumber = stepIndex + 1
  const isLast = stepIndex === totalSteps - 1

  // Border style dựa trên chain state
  const borderClass = isChainActive
    ? 'border-forge-accent shadow-[0_0_0_1px_#00ff9444,0_0_16px_#00ff9422]'
    : isChainDone
    ? 'border-forge-accent/30'
    : isChainError
    ? 'border-forge-danger/40'
    : 'border-forge-border'

  return (
    <div id={`step-${step.id}`} className="relative">
      {!isLast && (
        <div className="absolute left-6 top-full w-0.5 h-6 bg-gradient-to-b from-forge-border to-forge-accent/20 z-10" />
      )}

      <div className={`bg-forge-card border rounded-2xl overflow-hidden transition-all ${borderClass}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b border-forge-border ${
          isChainActive ? 'bg-forge-accent/5' : 'bg-forge-panel/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
              isChainActive
                ? 'bg-forge-accent/20 border-forge-accent/50'
                : 'bg-forge-accent/10 border-forge-accent/30'
            }`}>
              {isChainActive ? (
                <span className="text-forge-accent animate-spin text-sm">⟳</span>
              ) : isChainDone ? (
                <span className="text-forge-accent text-xs">✓</span>
              ) : (
                <span className="text-xs font-display font-bold text-forge-accent">{stepNumber}</span>
              )}
            </div>
            <h2 className="text-sm font-display font-bold text-forge-text">{step.label}</h2>
            {isChainStep && (
              <span className="text-xs text-forge-muted border border-forge-border px-1.5 py-0.5 rounded font-mono">
                ⚡
              </span>
            )}
          </div>

          {step.versions.length > 0 && (
            <button
              onClick={() => setShowVersions(true)}
              className="flex items-center gap-1.5 text-xs text-forge-muted hover:text-forge-accent transition-colors bg-forge-card px-2 py-1 rounded-lg border border-forge-border hover:border-forge-accent/30"
            >
              <span>📜</span>
              <span>{step.versions.length}v</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <textarea
            id={`textarea-${step.id}`}
            value={step.content}
            onChange={handleContentChange}
            placeholder={step.hint}
            rows={isDeployStep ? 4 : 6}
            disabled={isChainActive}
            className={`w-full bg-forge-panel border border-forge-border rounded-xl px-4 py-3 text-sm text-forge-text font-mono placeholder-forge-muted leading-relaxed transition-all ${
              isChainActive ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          />

          {isFinalCheckStep && step.content.trim() && (
            <button
              onClick={handleFinalCheck}
              disabled={aiLoading || isChainActive}
              className="w-full py-3 bg-forge-accent/10 border border-forge-accent/30 text-forge-accent text-sm font-display font-bold rounded-xl hover:bg-forge-accent/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {aiLoading ? '⟳ Đang phân tích...' : '✅ Chạy Final Check AI'}
            </button>
          )}

          {isDeployStep && (
            <DeployKit content={step.content} onGenerated={handleDeployGenerated} />
          )}

          {!isDeployStep && (
            <ActionBar
              stepId={step.id}
              content={step.content}
              onPaste={handlePaste}
              onAIAssist={handleAIAssist}
              onSaveVersion={() => onSaveVersion(step.id, step.content)}
              isLoading={aiLoading || isChainActive}
            />
          )}
        </div>
      </div>

      {showVersions && (
        <VersionDrawer
          versions={step.versions}
          onRestore={handleRestore}
          onClose={() => setShowVersions(false)}
        />
      )}

      {aiResult && (
        <AIAssistPanel
          mode={aiMode}
          result={aiResult}
          onApply={handleApplyAI}
          onClose={() => setAiResult(null)}
        />
      )}
    </div>
  )
}

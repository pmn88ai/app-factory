'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { STEP_KEYS, STEP_META, formatDate } from '../../../lib/storage'
import { dbForkProject } from '../../../lib/share'

export default function SharePage({ params }) {
  const { token } = use(params)
  const router = useRouter()

  const [project, setProject] = useState(null)
  const [stepsMap, setStepsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [forking, setForking] = useState(false)
  const [forked, setForked] = useState(false)

  useEffect(() => {
    loadSharedProject()
  }, [token])

  async function loadSharedProject() {
    setLoading(true)
    try {
      const res = await fetch(`/api/share?token=${encodeURIComponent(token)}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Không tìm thấy project')
        return
      }

      setProject(data)

      // Convert steps array → map
      const map = {}
      for (const s of data.steps) {
        map[s.step_key] = { content: s.content ?? '' }
      }
      setStepsMap(map)
    } catch {
      setError('Không tải được project. Thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFork() {
    setForking(true)
    try {
      const newName = `${project.name} (fork)`
      const newProject = await dbForkProject(token, newName)
      setForked(true)
      setTimeout(() => router.push(`/project/${newProject.id}`), 1200)
    } catch (err) {
      alert('Fork thất bại: ' + err.message)
      setForking(false)
    }
  }

  const steps = STEP_KEYS.map(key => ({
    id: key,
    ...STEP_META[key],
    content: stepsMap[key]?.content ?? '',
  }))

  const filledCount = steps.filter(s => s.content.trim()).length
  const progress = Math.round((filledCount / steps.length) * 100)

  if (loading) {
    return (
      <main className="min-h-screen bg-forge-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-3xl animate-spin">⚙️</div>
          <p className="text-forge-muted text-sm font-mono">Đang tải project...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-forge-bg flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="font-display font-bold text-forge-text mb-2">Không tìm thấy</h1>
          <p className="text-forge-muted text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-forge-accent text-forge-bg text-sm font-display font-bold rounded-xl active:scale-95"
          >
            Về trang chủ
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-forge-bg noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-forge-bg/90 backdrop-blur-md border-b border-forge-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-forge-accent/10 text-forge-accent border border-forge-accent/30 px-2 py-0.5 rounded-full font-mono flex-shrink-0">
                  👁 Chỉ xem
                </span>
              </div>
              <h1 className="text-sm font-display font-bold text-forge-text mt-1 truncate">
                {project.name}
              </h1>
            </div>

            {/* Fork button */}
            <button
              onClick={handleFork}
              disabled={forking || forked}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-bold transition-all active:scale-95 flex-shrink-0 ${
                forked
                  ? 'bg-forge-accent/20 text-forge-accent border border-forge-accent/30'
                  : 'bg-forge-accent text-forge-bg hover:bg-forge-accentDim'
              }`}
            >
              {forked ? '✓ Đã fork!' : forking ? '⟳ Đang fork...' : '⑂ Fork'}
            </button>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-forge-muted">{filledCount}/{steps.length} steps</span>
              <span className="text-xs text-forge-accent font-bold font-display">{progress}%</span>
            </div>
            <div className="h-1 bg-forge-panel rounded-full overflow-hidden">
              <div
                className="h-full bg-forge-accent rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Read-only pipeline */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 space-y-6">
        {/* Step nav */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
              <a
                href={`#ro-step-${step.id}`}
                className={`text-xs px-2 py-1 rounded-md font-mono transition-all ${
                  step.content.trim()
                    ? 'bg-forge-accent/10 text-forge-accent border border-forge-accent/30'
                    : 'bg-forge-card text-forge-muted border border-forge-border'
                }`}
              >
                {idx + 1}
              </a>
              {idx < steps.length - 1 && (
                <span className="text-forge-border text-xs">→</span>
              )}
            </div>
          ))}
        </div>

        {steps.map((step, idx) => (
          <ReadOnlyStepBlock
            key={step.id}
            step={step}
            stepNumber={idx + 1}
            isLast={idx === steps.length - 1}
          />
        ))}

        {/* Fork CTA at bottom */}
        <div className="bg-forge-card border border-forge-accent/20 rounded-2xl p-5 text-center">
          <p className="text-sm text-forge-textDim mb-3">
            Thích project này? Fork về để chỉnh sửa theo ý mày.
          </p>
          <button
            onClick={handleFork}
            disabled={forking || forked}
            className="px-8 py-3 bg-forge-accent text-forge-bg font-display font-bold text-sm rounded-xl active:scale-95 transition-all disabled:opacity-60"
          >
            {forked ? '✓ Đã fork về dashboard!' : forking ? '⟳ Đang fork...' : '⑂ Fork Project Này'}
          </button>
        </div>

        <p className="text-center text-xs text-forge-muted">
          🏭 App Factory · <a href="/dashboard" className="hover:text-forge-accent transition-colors">Tạo project của mày</a>
        </p>
      </div>
    </main>
  )
}

function ReadOnlyStepBlock({ step, stepNumber, isLast }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!step.content.trim()) return
    try {
      await navigator.clipboard.writeText(step.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div id={`ro-step-${step.id}`} className="relative">
      {!isLast && (
        <div className="absolute left-6 top-full w-0.5 h-6 bg-gradient-to-b from-forge-border to-forge-accent/20 z-10" />
      )}

      <div className={`bg-forge-card border rounded-2xl overflow-hidden ${
        step.content.trim() ? 'border-forge-border' : 'border-forge-border/40 opacity-60'
      }`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-forge-border bg-forge-panel/50">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-forge-accent/10 border border-forge-accent/30 flex items-center justify-center">
              <span className="text-xs font-display font-bold text-forge-accent">{stepNumber}</span>
            </div>
            <h2 className="text-sm font-display font-bold text-forge-text">{step.label}</h2>
          </div>

          {step.content.trim() && (
            <button
              onClick={handleCopy}
              className="text-xs text-forge-muted hover:text-forge-accent transition-colors px-2 py-1 rounded-lg border border-forge-border hover:border-forge-accent/30"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          )}
        </div>

        <div className="p-4">
          {step.content.trim() ? (
            <pre className="text-sm text-forge-text font-mono whitespace-pre-wrap leading-relaxed break-words max-h-64 overflow-y-auto">
              {step.content}
            </pre>
          ) : (
            <p className="text-sm text-forge-muted italic">Chưa có nội dung</p>
          )}
        </div>
      </div>
    </div>
  )
}

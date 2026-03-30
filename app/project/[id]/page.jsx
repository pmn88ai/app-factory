'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '../../../hooks/useProject'
import { useAIChain } from '../../../hooks/useAIChain'
import Pipeline from '../../../components/Pipeline'
import ProjectMenu from '../../../components/ProjectMenu'
import SharePanel from '../../../components/SharePanel'
import AiChainPanel from '../../../components/AiChainPanel'
import { STEP_KEYS, STEP_META } from '../../../lib/storage'
import { buildExportPayload, downloadJSON, buildExportFilename } from '../../../lib/exportImport'
import { dbRenameProject, dbSetTemplate, dbDuplicateProject } from '../../../lib/db'

export default function ProjectPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const { stepsMap, status, isOnline, updateContent, saveVersion } = useProject(id)
  const [showMenu, setShowMenu] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showChain, setShowChain] = useState(false)
  const [projectMeta, setProjectMeta] = useState({ id, name: '...', is_template: false, is_public: false, share_token: null })

  // AI Chain hook
  const {
    chainStatus, activeStepKey, completedSteps, errorStep,
    runChain, cancelChain,
  } = useAIChain({
    stepsMap,
    onUpdateContent: updateContent,
    onSaveVersion: saveVersion,
  })

  // Load project meta once
  useEffect(() => {
    import('../../../lib/db').then(({ dbGetProjects, dbGetTemplates }) => {
      Promise.all([dbGetProjects(), dbGetTemplates()]).then(([projects, templates]) => {
        const found = [...projects, ...templates].find(p => p.id === id)
        if (found) setProjectMeta(found)
      }).catch(() => {})
    })
  }, [id])

  const steps = STEP_KEYS.map(key => ({
    id: key,
    ...STEP_META[key],
    content: stepsMap[key]?.content ?? '',
    versions: stepsMap[key]?.versions ?? [],
  }))

  const filledCount = steps.filter(s => s.content.trim()).length
  const progress = Math.round((filledCount / steps.length) * 100)

  // Count eligible chain steps
  const chainEligibleCount = steps.filter(s =>
    ['spec', 'claude_review', 'gpt_fix', 'gpt_review_code'].includes(s.id) && s.content.trim()
  ).length

  async function handleRename(pid, name) {
    try {
      await dbRenameProject(pid, name)
      setProjectMeta(prev => ({ ...prev, name }))
    } catch (err) { alert('Đổi tên thất bại: ' + err.message) }
  }

  async function handleDuplicate(project) {
    try {
      const newProject = await dbDuplicateProject(project.id, `${project.name} (copy)`)
      router.push(`/project/${newProject.id}`)
    } catch (err) { alert('Nhân đôi thất bại: ' + err.message) }
  }

  async function handleSaveAsTemplate(pid) {
    try {
      await dbSetTemplate(pid, true)
      setProjectMeta(prev => ({ ...prev, is_template: true }))
      alert('✅ Đã lưu làm template!')
    } catch (err) { alert('Lỗi: ' + err.message) }
  }

  async function handleRemoveTemplate(pid) {
    try {
      await dbSetTemplate(pid, false)
      setProjectMeta(prev => ({ ...prev, is_template: false }))
    } catch (err) { alert('Lỗi: ' + err.message) }
  }

  function handleExport(project) {
    const payload = buildExportPayload(project.name, stepsMap)
    downloadJSON(payload, buildExportFilename(project.name))
  }

  return (
    <main className="min-h-screen bg-forge-bg noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-forge-bg/90 backdrop-blur-md border-b border-forge-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-8 h-8 flex items-center justify-center text-forge-muted hover:text-forge-text transition-colors rounded-lg border border-forge-border flex-shrink-0 text-sm"
              >
                ←
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-display font-bold text-forge-text truncate">
                    {projectMeta.name}
                  </h1>
                  {projectMeta.is_template && (
                    <span className="text-xs bg-forge-warning/20 text-forge-warning px-1.5 py-0.5 rounded flex-shrink-0">template</span>
                  )}
                  {projectMeta.is_public && (
                    <span className="text-xs bg-forge-accent/10 text-forge-accent border border-forge-accent/20 px-1.5 py-0.5 rounded flex-shrink-0">🌐</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {status === 'saving' && (
                <span className="text-xs text-forge-accent animate-pulse font-mono">⟳</span>
              )}
              <span className={`text-xs px-2 py-1 rounded-full border font-mono ${
                isOnline
                  ? 'text-forge-accent border-forge-accent/30 bg-forge-accent/10'
                  : 'text-forge-warning border-forge-warning/30 bg-forge-warning/10'
              }`}>
                {isOnline ? '●' : '○'}
              </span>
              <button
                onClick={() => setShowMenu(true)}
                className="w-8 h-8 flex items-center justify-center text-forge-muted hover:text-forge-text border border-forge-border rounded-lg text-base"
              >
                ···
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-forge-muted">Tiến độ</span>
              <span className="text-xs text-forge-accent font-bold font-display">{progress}%</span>
            </div>
            <div className="h-1 bg-forge-panel rounded-full overflow-hidden border border-forge-border/50">
              <div
                className="h-full bg-forge-accent rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Pipeline */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Step nav + Run Pipeline button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4">
          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={`#step-${step.id}`}
                  className={`text-xs px-2 py-1 rounded-md font-mono transition-all ${
                    activeStepKey === step.id
                      ? 'bg-forge-accent text-forge-bg border border-forge-accent'
                      : step.content.trim()
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

          {/* Run Pipeline button */}
          <button
            onClick={() => setShowChain(true)}
            disabled={chainEligibleCount === 0}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-bold transition-all active:scale-95 ${
              chainStatus === 'running'
                ? 'bg-forge-accent text-forge-bg animate-pulse'
                : chainEligibleCount > 0
                ? 'bg-forge-accent/10 border border-forge-accent/30 text-forge-accent hover:bg-forge-accent/20'
                : 'bg-forge-card border border-forge-border text-forge-muted opacity-50 cursor-not-allowed'
            }`}
          >
            <span>⚡</span>
            <span>{chainStatus === 'running' ? 'Đang chạy' : `Run (${chainEligibleCount})`}</span>
          </button>
        </div>

        {status === 'loading' ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-forge-card border border-forge-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <Pipeline
            steps={steps}
            onChange={(stepId, _, value) => updateContent(stepId, value)}
            onSaveVersion={saveVersion}
            chainActiveKey={activeStepKey}
            chainCompletedSteps={completedSteps}
            chainErrorStep={errorStep}
          />
        )}

        <footer className="text-center py-8 text-xs text-forge-muted">
          App Factory · Phase 3B · RồngLeo Ecosystem
        </footer>
      </div>

      {/* Overlays */}
      {showMenu && (
        <ProjectMenu
          project={projectMeta}
          onRename={handleRename}
          onDuplicate={handleDuplicate}
          onSaveAsTemplate={handleSaveAsTemplate}
          onRemoveTemplate={handleRemoveTemplate}
          onExport={handleExport}
          onShare={(p) => { setProjectMeta(p); setShowShare(true) }}
          onDelete={() => {}}
          onClose={() => setShowMenu(false)}
        />
      )}

      {showShare && (
        <SharePanel
          project={projectMeta}
          onClose={() => setShowShare(false)}
        />
      )}

      {showChain && (
        <AiChainPanel
          stepsMap={stepsMap}
          chainStatus={chainStatus}
          activeStepKey={activeStepKey}
          completedSteps={completedSteps}
          errorStep={errorStep}
          onRun={runChain}
          onCancel={cancelChain}
          onClose={() => { if (chainStatus !== 'running') setShowChain(false) }}
        />
      )}
    </main>
  )
}

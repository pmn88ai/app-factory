export const STEP_KEYS = [
  'idea',
  'spec',
  'claude_review',
  'gpt_fix',
  'claude_code',
  'gpt_review_code',
  'final_check',
  'deploy',
]

export const STEP_META = {
  idea:           { label: '💡 Ý Tưởng',        hint: 'Mô tả ý tưởng app của mày...' },
  spec:           { label: '📋 Spec',            hint: 'Dán spec từ ChatGPT vào đây...' },
  claude_review:  { label: '🤖 Claude Review',   hint: 'Dán kết quả Claude review spec...' },
  gpt_fix:        { label: '🔧 GPT Fix',         hint: 'Dán spec đã fix từ ChatGPT...' },
  claude_code:    { label: '⚙️ Claude Code',     hint: 'Dán code Claude generate...' },
  gpt_review_code:{ label: '👁️ GPT Review Code', hint: 'Dán nhận xét review code từ GPT...' },
  final_check:    { label: '✅ Final Check',      hint: 'Dán toàn bộ code cuối để AI review...' },
  deploy:         { label: '🚀 Deploy Kit',       hint: 'Nhấn "Tạo Deploy Kit" để generate hướng dẫn...' },
}

export const MAX_VERSIONS = 10

// ─── localStorage helpers ────────────────────────────────────────────────────

const LS_PROJECTS_KEY = 'af2-projects'
const LS_STEPS_PREFIX = 'af2-steps-'

export function lsGetProjects() {
  try {
    return JSON.parse(localStorage.getItem(LS_PROJECTS_KEY) || '[]')
  } catch { return [] }
}

export function lsSetProjects(projects) {
  localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(projects))
}

export function lsGetSteps(projectId) {
  try {
    return JSON.parse(localStorage.getItem(LS_STEPS_PREFIX + projectId) || '{}')
  } catch { return {} }
}

export function lsSetSteps(projectId, stepsMap) {
  localStorage.setItem(LS_STEPS_PREFIX + projectId, JSON.stringify(stepsMap))
}

export function lsDeleteProject(projectId) {
  const projects = lsGetProjects().filter(p => p.id !== projectId)
  lsSetProjects(projects)
  localStorage.removeItem(LS_STEPS_PREFIX + projectId)
}

// ─── Version helpers ─────────────────────────────────────────────────────────

export function addVersion(versions = [], content) {
  if (!content?.trim()) return versions
  const next = [
    { id: Date.now(), content, savedAt: new Date().toISOString() },
    ...versions,
  ]
  return next.slice(0, MAX_VERSIONS)
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

// Build a blank steps map for a new project
export function buildInitialStepsMap() {
  const map = {}
  for (const key of STEP_KEYS) {
    map[key] = { content: '', versions: [] }
  }
  return map
}

import { STEP_KEYS } from './storage'

const EXPORT_VERSION = '1'
const MAX_PAYLOAD_BYTES = 100 * 1024  // 100KB

// ─── Export ──────────────────────────────────────────────────────────────────

export function buildExportPayload(projectName, stepsMap) {
  const steps = {}
  for (const key of STEP_KEYS) {
    steps[key] = stepsMap[key]?.content ?? ''
  }
  return {
    _appFactory: true,
    _version: EXPORT_VERSION,
    name: projectName,
    exportedAt: new Date().toISOString(),
    steps,
  }
}

export function downloadJSON(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Tạo tên file đẹp: app-factory-ten-project-timestamp.json
export function buildExportFilename(projectName) {
  const slug = projectName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // bỏ dấu tiếng Việt
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 40)
  return `app-factory-${slug || 'project'}-${Date.now()}.json`
}

// ─── Import / Validate (4 lớp) ────────────────────────────────────────────────

export function validateImport(raw, fileSizeBytes = 0) {
  // Lớp 1: Kiểm tra size payload
  if (fileSizeBytes > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: `File quá lớn (${(fileSizeBytes / 1024).toFixed(0)}KB). Tối đa 100KB.` }
  }

  // Lớp 2: Kiểm tra cấu trúc cơ bản
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'File không phải JSON object hợp lệ.' }
  }

  if (!raw._appFactory) {
    return { ok: false, error: 'File này không phải export từ App Factory.' }
  }

  if (typeof raw.name !== 'string' || !raw.name.trim()) {
    return { ok: false, error: 'Thiếu trường "name" hoặc name rỗng.' }
  }

  if (raw.name.length > 200) {
    return { ok: false, error: 'Tên project quá dài (tối đa 200 ký tự).' }
  }

  if (!raw.steps || typeof raw.steps !== 'object' || Array.isArray(raw.steps)) {
    return { ok: false, error: 'Thiếu trường "steps" hoặc sai định dạng.' }
  }

  // Lớp 3: Kiểm tra step keys hợp lệ
  const stepValues = Object.values(raw.steps)
  for (const val of stepValues) {
    if (typeof val !== 'string') {
      return { ok: false, error: 'Giá trị trong "steps" phải là chuỗi văn bản.' }
    }
  }

  // Lớp 4: Kiểm tra script injection trong tất cả content
  const allContent = [raw.name, ...stepValues].join(' ').toLowerCase()
  const dangerPatterns = ['<script', 'javascript:', 'onerror=', 'onload=', 'eval(']
  for (const pattern of dangerPatterns) {
    if (allContent.includes(pattern)) {
      return { ok: false, error: 'File chứa nội dung không hợp lệ.' }
    }
  }

  // Warnings về keys không nhận ra (không block)
  const unknownKeys = Object.keys(raw.steps).filter(k => !STEP_KEYS.includes(k))
  const warnings = unknownKeys.length > 0
    ? [`Bỏ qua ${unknownKeys.length} step không nhận ra: ${unknownKeys.join(', ')}`]
    : []

  return { ok: true, warnings }
}

export function parseImport(raw) {
  const stepsContentMap = {}
  for (const key of STEP_KEYS) {
    const val = raw.steps?.[key]
    stepsContentMap[key] = typeof val === 'string' ? val : ''
  }
  return {
    name: raw.name.trim(),
    stepsContentMap,
  }
}

// Đọc file → parse JSON, trả về { raw, sizeBytes }
export function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const raw = JSON.parse(e.target.result)
        resolve({ raw, sizeBytes: file.size })
      } catch {
        reject(new Error('File không phải JSON hợp lệ.'))
      }
    }
    reader.onerror = () => reject(new Error('Không đọc được file.'))
    reader.readAsText(file)
  })
}

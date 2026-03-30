'use client'
import { useState, useRef } from 'react'
import { readJSONFile, validateImport, parseImport } from '../lib/exportImport'

export default function ImportModal({ onImport, onClose }) {
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef()

  async function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError('')
    setParsed(null)
    setWarnings([])
    setLoading(true)

    try {
      // readJSONFile giờ trả { raw, sizeBytes }
      const { raw, sizeBytes } = await readJSONFile(f)
      const result = validateImport(raw, sizeBytes)   // truyền size vào lớp 1
      if (!result.ok) {
        setError(result.error)
        setLoading(false)
        return
      }
      setWarnings(result.warnings || [])
      setParsed(raw)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!parsed) return
    setLoading(true)
    try {
      const { name, stepsContentMap } = parseImport(parsed)
      await onImport(name, stepsContentMap)
      onClose()
    } catch (err) {
      setError('Import thất bại: ' + err.message)
      setLoading(false)
    }
  }

  const filledSteps = parsed
    ? Object.values(parsed.steps || {}).filter(v => typeof v === 'string' && v.trim()).length
    : 0

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div className="w-full max-w-md bg-forge-panel border border-forge-border rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
          <h3 className="font-display font-bold text-forge-text mb-1">📥 Import Project</h3>
          <p className="text-xs text-forge-muted mb-5">Chọn file JSON export từ App Factory (tối đa 100KB)</p>

          {/* File picker */}
          <div
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              file
                ? error
                  ? 'border-forge-danger/40 bg-forge-danger/5'
                  : 'border-forge-accent/40 bg-forge-accent/5'
                : 'border-forge-border hover:border-forge-accent/30'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div>
                <p className={`text-sm font-medium ${error ? 'text-forge-danger' : 'text-forge-accent'}`}>
                  {file.name}
                </p>
                <p className="text-xs text-forge-muted mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-2xl mb-2">📂</p>
                <p className="text-sm text-forge-muted">Nhấn để chọn file .json</p>
              </div>
            )}
          </div>

          {loading && (
            <p className="text-xs text-forge-accent mt-3 animate-pulse">⟳ Đang kiểm tra file...</p>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 bg-forge-danger/10 border border-forge-danger/30 rounded-xl px-4 py-3">
              <p className="text-xs text-forge-danger">❌ {error}</p>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mt-3 bg-forge-warning/10 border border-forge-warning/30 rounded-xl px-4 py-3 space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-forge-warning">⚠️ {w}</p>
              ))}
            </div>
          )}

          {/* Preview khi valid */}
          {parsed && !error && (
            <div className="mt-4 bg-forge-card border border-forge-accent/20 rounded-xl p-4 space-y-2">
              <p className="text-xs text-forge-muted uppercase tracking-wider">Xem trước</p>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-forge-accent">{parsed.name}</p>
                  <p className="text-xs text-forge-muted mt-1">
                    {filledSteps} / 8 steps có nội dung
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-forge-muted">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              {/* Step fill bar */}
              <div className="h-1.5 bg-forge-panel rounded-full overflow-hidden">
                <div
                  className="h-full bg-forge-accent rounded-full transition-all"
                  style={{ width: `${(filledSteps / 8) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={onClose}
              className="py-3 bg-forge-card border border-forge-border text-forge-muted text-sm rounded-xl active:scale-95"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={!parsed || !!error || loading}
              className="py-3 bg-forge-accent text-forge-bg font-display font-bold text-sm rounded-xl active:scale-95 disabled:opacity-40"
            >
              {loading ? '⟳ Đang import...' : '→ Import'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

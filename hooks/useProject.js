'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { buildInitialStepsMap, lsGetSteps, lsSetSteps, addVersion } from '../lib/storage'
import { dbGetSteps, dbUpsertStep, dbUpsertAllSteps } from '../lib/db'

const DEBOUNCE_MS = 1500

export function useProject(projectId) {
  const [stepsMap, setStepsMap] = useState(buildInitialStepsMap())
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'saving' | 'error'
  const [isOnline, setIsOnline] = useState(true)

  const debounceTimers = useRef({})
  const pendingSync = useRef(false)
  const isSyncing = useRef(false)       // guard: block saves during load
  const latestStepsRef = useRef({})     // in-memory mirror for sync-on-reconnect

  // ─── Online/offline detection ─────────────────────────────────────────────
  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true)
      if (pendingSync.current) {
        // Push the latest in-memory state (not stale localStorage) to Supabase
        await syncToSupabase(latestStepsRef.current)
        pendingSync.current = false
      }
    }
    const onOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [projectId])

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return
    loadSteps()
  }, [projectId])

  async function loadSteps() {
    setStatus('loading')
    isSyncing.current = true  // block debounced saves while loading
    try {
      if (navigator.onLine) {
        // Online: Supabase is source of truth
        const remote = await dbGetSteps(projectId)
        const merged = { ...buildInitialStepsMap(), ...remote }
        setStepsMap(merged)
        latestStepsRef.current = merged
        lsSetSteps(projectId, merged)
      } else {
        // Offline: localStorage is source of truth
        const local = lsGetSteps(projectId)
        const merged = { ...buildInitialStepsMap(), ...local }
        setStepsMap(merged)
        latestStepsRef.current = merged
        pendingSync.current = true
      }
      setStatus('ready')
    } catch (err) {
      console.error('Load steps failed, falling back to localStorage:', err)
      const local = lsGetSteps(projectId)
      const merged = { ...buildInitialStepsMap(), ...local }
      setStepsMap(merged)
      latestStepsRef.current = merged
      setStatus('ready')
    } finally {
      isSyncing.current = false  // unblock saves
    }
  }

  // ─── Sync in-memory state → Supabase (used on reconnect) ─────────────────
  async function syncToSupabase(stepsToSync) {
    if (!stepsToSync || Object.keys(stepsToSync).length === 0) return
    try {
      await dbUpsertAllSteps(projectId, stepsToSync)
    } catch (err) {
      console.error('Sync to Supabase failed:', err)
    }
  }

  // ─── Update content (debounced save) ─────────────────────────────────────
  const updateContent = useCallback((stepKey, content) => {
    setStepsMap(prev => {
      const updated = { ...prev, [stepKey]: { ...prev[stepKey], content } }
      latestStepsRef.current = updated   // keep mirror in sync
      lsSetSteps(projectId, updated)     // immediate local save

      // Debounce remote save — skip if still loading
      clearTimeout(debounceTimers.current[stepKey])
      debounceTimers.current[stepKey] = setTimeout(async () => {
        if (isSyncing.current) return    // load in progress, skip
        if (!navigator.onLine) { pendingSync.current = true; return }
        setStatus('saving')
        try {
          await dbUpsertStep(projectId, stepKey, content, updated[stepKey].versions)
        } catch (err) {
          console.error('Debounced save failed:', err)
        } finally {
          setStatus('ready')
        }
      }, DEBOUNCE_MS)

      return updated
    })
  }, [projectId])

  // ─── Save version (immediate) ─────────────────────────────────────────────
  const saveVersion = useCallback(async (stepKey, content) => {
    if (!content?.trim()) return

    setStepsMap(prev => {
      const newVersions = addVersion(prev[stepKey]?.versions ?? [], content)
      const updated = { ...prev, [stepKey]: { ...prev[stepKey], versions: newVersions } }
      latestStepsRef.current = updated
      lsSetSteps(projectId, updated)

      if (navigator.onLine && !isSyncing.current) {
        setStatus('saving')
        dbUpsertStep(projectId, stepKey, content, newVersions)
          .catch(err => console.error('Version save failed:', err))
          .finally(() => setStatus('ready'))
      } else {
        pendingSync.current = true
      }

      return updated
    })
  }, [projectId])

  return { stepsMap, status, isOnline, updateContent, saveVersion }
}

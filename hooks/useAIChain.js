'use client'
import { useState, useRef, useCallback } from 'react'

// Map bước → AI mode
export const AI_CHAIN_MAP = {
  spec:             'improve',
  claude_review:    'review',
  gpt_fix:          'improve',
  gpt_review_code:  'review',
}

const MAX_CHAIN_STEPS = 4

export function useAIChain({ stepsMap, onUpdateContent, onSaveVersion }) {
  const [chainStatus, setChainStatus] = useState('idle') // 'idle' | 'running' | 'done' | 'cancelled'
  const [activeStepKey, setActiveStepKey] = useState(null)
  const [completedSteps, setCompletedSteps] = useState([])
  const [errorStep, setErrorStep] = useState(null)

  const cancelRef = useRef(false)

  const runChain = useCallback(async () => {
    if (chainStatus === 'running') return // double-trigger guard

    cancelRef.current = false
    setChainStatus('running')
    setCompletedSteps([])
    setActiveStepKey(null)
    setErrorStep(null)

    // Lọc các bước đủ điều kiện: có trong AI_CHAIN_MAP và có content
    const eligibleKeys = Object.keys(AI_CHAIN_MAP).filter(
      key => stepsMap[key]?.content?.trim()
    )

    // Giới hạn max 4 bước
    const keysToRun = eligibleKeys.slice(0, MAX_CHAIN_STEPS)

    for (const stepKey of keysToRun) {
      // Kiểm tra cancel trước mỗi step
      if (cancelRef.current) break

      const mode = AI_CHAIN_MAP[stepKey]
      const content = stepsMap[stepKey]?.content ?? ''

      setActiveStepKey(stepKey)

      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, content }),
        })

        if (cancelRef.current) break

        const data = await res.json()

        if (!res.ok || data.error) {
          setErrorStep(stepKey)
          break
        }

        // Overwrite content + save version
        onSaveVersion(stepKey, content)          // lưu version cũ trước
        onUpdateContent(stepKey, data.result)     // ghi kết quả mới

        setCompletedSteps(prev => [...prev, stepKey])

        // Nhỏ delay giữa các bước để UX nhìn thấy progress
        await sleep(400)

      } catch {
        if (!cancelRef.current) setErrorStep(stepKey)
        break
      }
    }

    setActiveStepKey(null)
    setChainStatus(cancelRef.current ? 'cancelled' : 'done')

    // Reset về idle sau 3 giây
    setTimeout(() => {
      setChainStatus('idle')
      setCompletedSteps([])
      setErrorStep(null)
    }, 3000)

  }, [chainStatus, stepsMap, onUpdateContent, onSaveVersion])

  function cancelChain() {
    cancelRef.current = true
    setChainStatus('cancelled')
  }

  return {
    chainStatus,     // 'idle' | 'running' | 'done' | 'cancelled'
    activeStepKey,   // key của step đang chạy
    completedSteps,  // array các step đã xong
    errorStep,       // key của step bị lỗi (nếu có)
    runChain,
    cancelChain,
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

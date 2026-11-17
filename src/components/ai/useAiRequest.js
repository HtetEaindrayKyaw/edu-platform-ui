import { useCallback, useEffect, useRef, useState } from 'react'

// Cancels pending work on navigation and prevents stale responses overwriting a new task.
export default function useAiRequest() {
  const controller = useRef(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => () => controller.current?.abort(), [])
  const cancel = useCallback(() => {
    controller.current?.abort()
    controller.current = null
    setPending(false)
    setError('')
  }, [])
  const run = async (task, onSuccess) => {
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current
    setPending(true)
    setError('')
    try {
      const response = await task(current.signal)
      if (!current.signal.aborted) onSuccess(response)
    } catch {
      if (!current.signal.aborted) setError('We could not finish this request. Please try again. Your input is still here.')
    } finally {
      if (controller.current === current && !current.signal.aborted) setPending(false)
    }
  }
  return { pending, error, run, cancel }
}

import { useEffect, useState } from 'react'

export default function useLocalData(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key))
      if (saved === null) return initialValue
      return Array.isArray(initialValue) ? (Array.isArray(saved) ? saved : initialValue) : { ...initialValue, ...saved }
    } catch { return initialValue }
  })
  const [error, setError] = useState('')
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) }
    catch { queueMicrotask(() => setError('Browser storage is unavailable or full. Changes in this tab may not survive a reload.')) }
  }, [key, value])
  return [value, setValue, error]
}

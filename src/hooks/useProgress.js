import { useState, useCallback } from 'react'

const KEY = 'viet-progress'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
}

export function useProgress() {
  const [progress, setProgress] = useState(load)

  const mark = useCallback((wordId, status) => {
    setProgress(prev => {
      const next = { ...prev, [wordId]: status }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getStatus = (wordId) => progress[wordId] || 'new'

  const countFor = (words) => ({
    known:  words.filter(w => progress[w.id] === 'known').length,
    review: words.filter(w => progress[w.id] === 'review').length,
    total:  words.length,
  })

  return { mark, getStatus, countFor, progress }
}

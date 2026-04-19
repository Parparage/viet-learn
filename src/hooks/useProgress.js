import { useState, useCallback } from 'react'

const KEY = 'viet-progress'
const SRS_DAYS = 7 // un mot "su" revient en "à revoir" après 7 jours sans révision

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
}

function getRaw(progress, wordViet) {
  const entry = progress[wordViet]
  if (!entry) return { status: 'new', lastSeen: 0 }
  if (typeof entry === 'string') return { status: entry, lastSeen: 0 } // rétrocompat
  return entry
}

export function useProgress() {
  const [progress, setProgress] = useState(load)

  const mark = useCallback((wordViet, status) => {
    setProgress(prev => {
      const next = { ...prev, [wordViet]: { status, lastSeen: Date.now() } }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getStatus = useCallback((wordViet) => {
    const { status, lastSeen } = getRaw(progress, wordViet)
    if (status === 'known' && lastSeen) {
      const daysSince = (Date.now() - lastSeen) / 86400000
      if (daysSince > SRS_DAYS) return 'review' // décroissance SRS automatique
    }
    return status
  }, [progress])

  const countFor = useCallback((words) => {
    const known  = words.filter(w => getStatus(w.viet) === 'known').length
    const review = words.filter(w => getStatus(w.viet) === 'review').length
    return { known, review, total: words.length }
  }, [getStatus])

  return { mark, getStatus, countFor, progress }
}

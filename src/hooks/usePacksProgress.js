import { useState, useCallback } from 'react'

const KEY = 'pack-progress'
const SRS_DAYS = 7

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
}

function getRaw(packData, wordViet) {
  const entry = packData?.[wordViet]
  if (!entry) return { status: 'new', lastSeen: 0 }
  return entry
}

export function usePacksProgress() {
  const [allProgress, setAllProgress] = useState(load)

  const markInPack = useCallback((packId, wordViet, status) => {
    setAllProgress(prev => {
      const next = {
        ...prev,
        [packId]: {
          ...(prev[packId] || {}),
          [wordViet]: { status, lastSeen: Date.now() }
        }
      }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getStatusInPack = useCallback((packId, wordViet, currentProgress) => {
    const { status, lastSeen } = getRaw(currentProgress?.[packId], wordViet)
    if (status === 'known' && lastSeen) {
      const daysSince = (Date.now() - lastSeen) / 86400000
      if (daysSince > SRS_DAYS) return 'review'
    }
    return status
  }, [])

  const countFor = useCallback((packId, words) => {
    const packData = allProgress[packId] || {}
    const known  = words.filter(w => {
      const { status, lastSeen } = getRaw(packData, w.viet)
      if (status === 'known' && lastSeen) {
        return (Date.now() - lastSeen) / 86400000 <= SRS_DAYS
      }
      return status === 'known'
    }).length
    const review = words.filter(w => {
      const { status, lastSeen } = getRaw(packData, w.viet)
      if (status === 'known' && lastSeen) {
        return (Date.now() - lastSeen) / 86400000 > SRS_DAYS
      }
      return status === 'review'
    }).length
    return { known, review, total: words.length }
  }, [allProgress])

  // Retourne un objet progress compatible avec SessionScreen
  const getProgressFor = useCallback((packId) => {
    return {
      mark: (wordViet, status) => markInPack(packId, wordViet, status),
      getStatus: (wordViet) => {
        // Lecture directe du localStorage pour avoir la valeur fraîche
        try {
          const all = JSON.parse(localStorage.getItem(KEY) || '{}')
          return getStatusInPack(packId, wordViet, all)
        } catch {
          return 'new'
        }
      },
      countFor: (words) => countFor(packId, words),
    }
  }, [markInPack, getStatusInPack, countFor])

  return { getProgressFor, countFor, allProgress }
}

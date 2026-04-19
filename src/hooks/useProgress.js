import { useState, useCallback } from 'react'

const KEY = 'viet-progress'

// La clé de progression est le mot vietnamien (stable même si la liste change)
// word.id n'est utilisé que pour les fichiers audio

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
}

export function useProgress() {
  const [progress, setProgress] = useState(load)

  const mark = useCallback((wordViet, status) => {
    setProgress(prev => {
      const next = { ...prev, [wordViet]: status }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // Clé stable = texte vietnamien normalisé
  const getStatus = (wordViet) => progress[wordViet] || 'new'

  const countFor = (words) => ({
    known:  words.filter(w => progress[w.viet] === 'known').length,
    review: words.filter(w => progress[w.viet] === 'review').length,
    total:  words.length,
  })

  return { mark, getStatus, countFor, progress }
}

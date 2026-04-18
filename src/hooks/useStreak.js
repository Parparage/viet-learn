import { useState } from 'react'

const KEY = 'viet-streak'
const today = () => new Date().toISOString().slice(0, 10)
const yesterday = () => {
  const d = new Date(); d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{"streak":0,"last":"","best":0,"sessions":0,"week":[]}') }
  catch { return { streak: 0, last: '', best: 0, sessions: 0, week: [] } }
}

export function useStreak() {
  const [data, setData] = useState(load)

  const recordSession = () => {
    const t = today()
    setData(prev => {
      if (prev.last === t) return prev
      const streak = prev.last === yesterday() ? prev.streak + 1 : 1
      const week = [...(prev.week || []).filter(d => {
        const diff = (new Date(t) - new Date(d)) / 86400000
        return diff < 7
      }), t]
      const next = { streak, last: t, best: Math.max(prev.best, streak), sessions: (prev.sessions || 0) + 1, week }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  return {
    streak: data.streak,
    best: data.best,
    sessionsThisWeek: (data.week || []).length,
    recordSession,
  }
}

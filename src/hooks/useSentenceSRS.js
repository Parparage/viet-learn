/**
 * useSentenceSRS — SRS (répétition espacée) pour les phrases audio Assimil.
 *
 * Chaque phrase est identifiée par `${lessonNum}-${key}` (ex: "78-S01").
 * On ne track que les phrases S (dictée), pas les T (traduction passive).
 *
 * Algorithme :
 *   0 erreur  → avance d'une étape
 *   1+ erreur → recule d'une étape (minimum 0)
 *
 * Étapes (en jours avant la prochaine révision) :
 *   0 → 1j  |  1 → 2j  |  2 → 4j  |  3 → 8j  |  4 → 16j  |  5 → 30j
 */
import { useState } from 'react'

const SRS_KEY  = 'assimil-srs'
const DAY_MS   = 86_400_000
const STEPS    = [1, 2, 4, 8, 16, 30]  // jours par étape

function load() {
  try { return JSON.parse(localStorage.getItem(SRS_KEY) || '{}') }
  catch { return {} }
}

function persist(data) {
  localStorage.setItem(SRS_KEY, JSON.stringify(data))
}

export function useSentenceSRS() {
  const [data, setData] = useState(load)

  /** Enregistre le résultat d'une phrase après dictée. */
  function record(lessonNum, key, errCount) {
    const id  = `${lessonNum}-${key}`
    const now = Date.now()
    const cur = data[id] || { step: 0, nextReview: 0 }

    const newStep = errCount === 0
      ? Math.min(cur.step + 1, STEPS.length - 1)
      : Math.max(0, cur.step - 1)

    const updated = {
      ...data,
      [id]: {
        step:       newStep,
        nextReview: now + STEPS[newStep] * DAY_MS,
        lastSeen:   now,
        lastErrors: errCount,
      }
    }
    setData(updated)
    persist(updated)
  }

  /** Nombre total de phrases dues à réviser maintenant. */
  function getDueCount() {
    const now = Date.now()
    return Object.values(data).filter(s => s.nextReview <= now).length
  }

  /**
   * Liste des phrases dues, triées des plus en retard aux plus récentes.
   * Chaque élément : { lessonNum, key, step, nextReview, lastSeen, lastErrors }
   */
  function getDue() {
    const now = Date.now()
    return Object.entries(data)
      .filter(([, s]) => s.nextReview <= now)
      .map(([id, s]) => {
        const dash = id.indexOf('-')
        return { lessonNum: parseInt(id.slice(0, dash)), key: id.slice(dash + 1), ...s }
      })
      .sort((a, b) => a.nextReview - b.nextReview)
  }

  /** Nombre de phrases dues pour une leçon précise. */
  function getLessonDue(num) {
    const now    = Date.now()
    const prefix = `${num}-S`
    return Object.entries(data)
      .filter(([id, s]) => id.startsWith(prefix) && s.nextReview <= now)
      .length
  }

  return { record, getDueCount, getDue, getLessonDue }
}

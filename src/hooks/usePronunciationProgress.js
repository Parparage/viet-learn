/**
 * usePronunciationProgress — suivi des performances de prononciation.
 *
 * Chaque phrase est identifiée par son id (ex: "L3-07").
 * On stocke par phrase : { attempts, successes, bestScore, lastScore, lastAttempt }
 *
 * Seuil de réussite : 70 % des mots correctement reconnus.
 */
import { useState } from 'react'

const PRON_KEY           = 'pronunciation-progress'
const SUCCESS_THRESHOLD  = 0.7

function load() {
  try { return JSON.parse(localStorage.getItem(PRON_KEY) || '{}') }
  catch { return {} }
}

function persist(data) {
  localStorage.setItem(PRON_KEY, JSON.stringify(data))
}

export function usePronunciationProgress() {
  const [data, setData] = useState(load)

  /**
   * Enregistre le résultat d'un essai.
   * @returns {boolean} true si c'est un succès (score >= seuil)
   */
  function record(phraseId, score) {
    const now       = Date.now()
    const cur       = data[phraseId] || { attempts: 0, successes: 0, bestScore: 0 }
    const isSuccess = score >= SUCCESS_THRESHOLD

    const updated = {
      ...data,
      [phraseId]: {
        attempts:    cur.attempts + 1,
        successes:   cur.successes + (isSuccess ? 1 : 0),
        bestScore:   Math.max(cur.bestScore, score),
        lastScore:   score,
        lastAttempt: now,
      },
    }
    setData(updated)
    persist(updated)
    return isSuccess
  }

  /** Progression d'un niveau : { mastered, total }. */
  function getLevelProgress(phrases) {
    const mastered = phrases.filter(p => {
      const entry = data[p.id]
      return entry && entry.bestScore >= SUCCESS_THRESHOLD
    }).length
    return { mastered, total: phrases.length }
  }

  /** Données brutes d'une phrase (ou null). */
  function getPhraseData(phraseId) {
    return data[phraseId] || null
  }

  /**
   * Sélectionne `count` phrases pour une session.
   * Priorité : non maîtrisées d'abord, puis les plus anciennement pratiquées.
   */
  function selectSessionPhrases(phrases, count = 5) {
    const unmastered = phrases.filter(p => {
      const e = data[p.id]
      return !e || e.bestScore < SUCCESS_THRESHOLD
    })

    const mastered = phrases.filter(p => {
      const e = data[p.id]
      return e && e.bestScore >= SUCCESS_THRESHOLD
    }).sort((a, b) => {
      const ta = data[a.id]?.lastAttempt || 0
      const tb = data[b.id]?.lastAttempt || 0
      return ta - tb          // les plus anciennes d'abord
    })

    return [...unmastered, ...mastered].slice(0, count)
  }

  return { record, getLevelProgress, getPhraseData, selectSessionPhrases, SUCCESS_THRESHOLD }
}

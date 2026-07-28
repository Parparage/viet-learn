/**
 * useMissingAudio — repère les mots dont le MP3 n'existe pas encore.
 *
 * Un mot ajouté (ou dont l'orthographe a été corrigée) dans l'application reçoit
 * un ID dans la plage applicative (≥ APP_ID_BASE) et n'a donc aucun fichier
 * public/audio/{id}.mp3 : sa prononciation retombe sur la synthèse vocale du
 * navigateur, dont les tons vietnamiens sont peu fiables.
 *
 * Plutôt que de le déduire, on vérifie réellement la présence du fichier :
 * une fois les MP3 régénérés par generate_audio.py et redéployés, l'alerte
 * disparaît d'elle-même, sans intervention.
 *
 * Seuls les ID de la plage applicative sont testés — les mots du fichier Excel
 * et les paquets intégrés ont toujours leur audio livré avec l'application.
 *
 * Retourne un Set des ID sans MP3.
 */
import { useState, useEffect, useMemo } from 'react'
import { APP_ID_BASE } from '../utils/vocabStore'

export function useMissingAudio(vocabulary) {
  const [missing, setMissing] = useState(() => new Set())

  const candidates = useMemo(
    () => vocabulary.filter(w => w.id >= APP_ID_BASE).map(w => w.id),
    [vocabulary]
  )
  const key = candidates.join(',')

  useEffect(() => {
    if (candidates.length === 0) {
      setMissing(new Set())
      return
    }
    let cancelled = false

    Promise.all(candidates.map(async (id) => {
      try {
        const res = await fetch(`/audio/${id}.mp3`, { method: 'HEAD' })
        // Attention : un fichier absent ne renvoie PAS 404. La réécriture SPA
        // (vercel.json, et le serveur de développement Vite) sert index.html
        // avec un code 200. Le seul signal fiable est le type de contenu.
        const type = res.headers.get('content-type') || ''
        return (res.ok && type.startsWith('audio')) ? null : id
      } catch {
        return id // hors-ligne ou fichier absent : on considère l'audio indisponible
      }
    })).then(results => {
      if (!cancelled) setMissing(new Set(results.filter(id => id !== null)))
    })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return missing
}

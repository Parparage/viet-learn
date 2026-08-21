/**
 * useExitGuard — empêche la fermeture accidentelle de l'application.
 *
 * Sur Android, le bouton « retour » ferme la PWA dès qu'il n'y a plus d'entrée
 * d'historique à dépiler. On maintient donc en permanence une **entrée
 * sentinelle** : le premier appui la consomme au lieu de quitter l'application,
 * et l'on réagit dans `popstate`.
 *
 * `onBack` doit retourner `true` s'il a lui-même reculé (fermeture d'un écran
 * interne), `false` si l'on est déjà à l'accueil — auquel cas la confirmation
 * de sortie est proposée.
 */
import { useEffect, useRef, useState } from 'react'

const GUARD = { vietGuard: true }

export function useExitGuard(onBack) {
  const [askExit, setAskExit] = useState(false)
  const exitingRef = useRef(false)

  // Référence tenue à jour : le gestionnaire popstate n'est installé qu'une fois
  // mais doit toujours lire l'écran courant.
  const onBackRef = useRef(onBack)
  onBackRef.current = onBack

  useEffect(() => {
    history.pushState(GUARD, '')

    const onPop = () => {
      if (exitingRef.current) return          // sortie confirmée : on laisse passer
      const handled = onBackRef.current()     // un écran interne a-t-il reculé ?
      if (!handled) setAskExit(true)          // déjà à l'accueil → confirmation
      history.pushState(GUARD, '')            // on réarme la sentinelle
    }

    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const cancelExit = () => setAskExit(false)

  const confirmExit = () => {
    exitingRef.current = true
    setAskExit(false)
    // Repasser derrière la sentinelle ET l'entrée initiale pour sortir vraiment.
    history.go(-2)
    // Un navigateur peut refuser de fermer un onglet qu'il n'a pas ouvert :
    // dernier recours, sans garantie.
    setTimeout(() => { try { window.close() } catch { /* ignoré */ } }, 300)
    // Si l'on est toujours là, c'est que la sortie a été refusée : on réarme le
    // garde-fou, sans quoi l'application resterait définitivement sans protection.
    setTimeout(() => {
      exitingRef.current = false
      history.pushState(GUARD, '')
    }, 1000)
  }

  return { askExit, cancelExit, confirmExit }
}

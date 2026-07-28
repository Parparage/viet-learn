/**
 * AudioWarning — mention discrète signalant que la prononciation entendue
 * n'est pas fiable : le mot n'a pas encore de MP3 généré, l'application
 * utilise donc la synthèse vocale du navigateur (tons approximatifs).
 *
 * `tone="light"` pour un fond sombre (verso rouge de la flashcard).
 */
export default function AudioWarning({ tone = 'dark', className = '' }) {
  const color = tone === 'light' ? 'text-red-200' : 'text-amber-600'
  return (
    <p className={`text-[10px] leading-tight text-center ${color} ${className}`}>
      ⚠️ Audio non fidèle — régénération app. nécessaire
    </p>
  )
}

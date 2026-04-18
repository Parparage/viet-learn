import { useState, useRef } from 'react'
import Flashcard from './components/Flashcard'
import { vocabulary } from './data/words'

export default function App() {
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [known, setKnown] = useState(new Set())
  const [toReview, setToReview] = useState(new Set())
  const audioRef = useRef(null)

  const total = vocabulary.length
  const word = vocabulary[index]

  const goTo = (newIndex) => {
    setIsFlipped(false)
    setTimeout(() => setIndex((newIndex + total) % total), 80)
  }

  const markKnown = () => {
    setKnown(s => new Set([...s, word.id]))
    setToReview(s => { const n = new Set(s); n.delete(word.id); return n })
    goTo(index + 1)
  }

  const markReview = () => {
    setToReview(s => new Set([...s, word.id]))
    setKnown(s => { const n = new Set(s); n.delete(word.id); return n })
    goTo(index + 1)
  }

  const speak = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    const audio = new Audio(`/audio/${word.id}.mp3`)
    audioRef.current = audio
    audio.playbackRate = 0.85
    audio.play().catch(() => {
      // Fallback Web Speech API si le fichier est absent
      if (!window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(word.viet)
      u.lang = 'vi-VN'
      u.rate = 0.75
      window.speechSynthesis.speak(u)
    })
  }

  const progressPct = ((index + 1) / total) * 100
  const status = known.has(word.id) ? 'known' : toReview.has(word.id) ? 'review' : 'new'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">

      {/* En-tête */}
      <header className="bg-red-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-lg font-bold tracking-wide">VietLearn</h1>
          <p className="text-xs text-red-200">{word.theme}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{index + 1} / {total}</p>
          <p className="text-xs text-red-200">{known.size} sus · {toReview.size} à revoir</p>
        </div>
      </header>

      {/* Barre de progression */}
      <div className="h-1.5 bg-red-100">
        <div
          className="h-full bg-amber-400 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Indicateur de statut */}
      <div className="flex justify-center pt-4">
        {status === 'known' && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Déjà su</span>
        )}
        {status === 'review' && (
          <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">🔁 À revoir</span>
        )}
        {status === 'new' && (
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Nouveau</span>
        )}
      </div>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-5">

        {/* Carte */}
        <div className="w-full max-w-sm">
          <Flashcard
            word={word}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(f => !f)}
            onSpeak={speak}
          />
        </div>

        {/* Aide contextuelle */}
        {!isFlipped && (
          <p className="text-sm text-gray-400 text-center">
            Appuyez sur la carte pour voir la traduction
          </p>
        )}

        {/* Boutons de réponse */}
        {isFlipped && (
          <div className="flex gap-3 w-full max-w-sm">
            <button
              onClick={markReview}
              className="flex-1 py-3.5 rounded-xl bg-orange-100 text-orange-700 font-semibold text-sm active:scale-95 transition-transform"
            >
              🔁 À revoir
            </button>
            <button
              onClick={markKnown}
              className="flex-1 py-3.5 rounded-xl bg-green-100 text-green-700 font-semibold text-sm active:scale-95 transition-transform"
            >
              ✓ Je sais !
            </button>
          </div>
        )}

        {/* Navigation précédent / suivant */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => goTo(index - 1)}
            className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 text-2xl active:scale-95 transition-transform"
          >
            ‹
          </button>

          <span className="text-base font-bold text-gray-500 w-16 text-center">
            {index + 1} / {total}
          </span>

          <button
            onClick={() => goTo(index + 1)}
            className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 text-2xl active:scale-95 transition-transform"
          >
            ›
          </button>
        </div>
      </main>

      {/* Barre de stats en bas */}
      <footer className="bg-white border-t border-gray-100 px-6 py-3 flex justify-around text-center">
        <div>
          <p className="text-xl font-bold text-green-600">{known.size}</p>
          <p className="text-xs text-gray-400">Sus</p>
        </div>
        <div>
          <p className="text-xl font-bold text-orange-500">{toReview.size}</p>
          <p className="text-xs text-gray-400">À revoir</p>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-400">{total - known.size - toReview.size}</p>
          <p className="text-xs text-gray-400">Non vus</p>
        </div>
      </footer>

    </div>
  )
}

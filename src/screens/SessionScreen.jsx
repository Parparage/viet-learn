import { useState, useRef } from 'react'
import Flashcard from '../components/Flashcard'

const SESSION_SIZE = 20

export default function SessionScreen({ words, packName, progress, onBack, onComplete }) {
  const [chunk] = useState(() => words.slice(0, SESSION_SIZE))
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reverse, setReverse] = useState(false)
  const [done, setDone] = useState(false)
  const audioRef = useRef(null)

  const word = chunk[index]
  const total = chunk.length
  const status = progress.getStatus(word?.viet)

  const goTo = (i) => {
    setIsFlipped(false)
    if (i >= total) { setDone(true); return }
    setTimeout(() => setIndex(i), 80)
  }

  const mark = (s) => {
    progress.mark(word.viet, s)
    goTo(index + 1)
  }

  const speak = () => {
    if (!word) return
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    const audio = new Audio(`/audio/${word.id}.mp3`)
    audioRef.current = audio
    audio.playbackRate = 0.85
    audio.play().catch(() => {
      if (!window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(word.viet)
      u.lang = 'vi-VN'; u.rate = 0.75
      window.speechSynthesis.speak(u)
    })
  }

  const counts = progress.countFor(chunk)

  if (done) {
    const remaining = words.length - SESSION_SIZE
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
        <header className="bg-red-600 text-white px-4 py-3 shadow-md">
          <h1 className="text-lg font-bold">Session terminée !</h1>
          <p className="text-xs text-red-200">{packName}</p>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            {total} cartes passées en revue
          </h2>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-green-600">{counts.known}</p>
              <p className="text-sm text-gray-500">Sus</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-500">{counts.review}</p>
              <p className="text-sm text-gray-500">À revoir</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-400">{total - counts.known - counts.review}</p>
              <p className="text-sm text-gray-500">Non évalués</p>
            </div>
          </div>
          {remaining > 0 && (
            <button
              onClick={() => onComplete(words.slice(SESSION_SIZE))}
              className="w-full py-4 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
            >
              Continuer ({remaining} mots restants)
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl active:scale-95 transition-transform"
          >
            Retour à l'accueil
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">

      <header className="bg-red-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-red-200 active:text-white text-xl">‹</button>
          <div>
            <h1 className="text-base font-bold leading-tight">{packName}</h1>
            <p className="text-xs text-red-200">{index + 1} / {total}</p>
          </div>
        </div>
        <button
          onClick={() => setReverse(r => !r)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            reverse ? 'bg-amber-400 text-amber-900' : 'bg-red-500 text-red-100'
          }`}
        >
          {reverse ? 'FR → VN' : 'VN → FR'}
        </button>
      </header>

      <div className="h-1.5 bg-red-100">
        <div
          className="h-full bg-amber-400 transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div className="flex justify-center pt-4">
        {status === 'known' && <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Déjà su</span>}
        {status === 'review' && <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">🔁 À revoir</span>}
        {status === 'new' && <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Nouveau</span>}
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-5">
        <div className="w-full max-w-sm">
          <Flashcard
            word={word}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(f => !f)}
            onSpeak={speak}
            reverse={reverse}
          />
        </div>

        {!isFlipped && (
          <p className="text-sm text-gray-400 text-center">Appuyez sur la carte pour voir la traduction</p>
        )}

        {isFlipped && (
          <div className="flex gap-3 w-full max-w-sm">
            <button onClick={() => mark('review')} className="flex-1 py-3.5 rounded-xl bg-orange-100 text-orange-700 font-semibold text-sm active:scale-95 transition-transform">
              🔁 À revoir
            </button>
            <button onClick={() => mark('known')} className="flex-1 py-3.5 rounded-xl bg-green-100 text-green-700 font-semibold text-sm active:scale-95 transition-transform">
              ✓ Je sais !
            </button>
          </div>
        )}

        <div className="flex items-center gap-6">
          <button onClick={() => { if (index > 0) goTo(index - 1) }} className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 text-2xl active:scale-95 transition-transform disabled:opacity-30" disabled={index === 0}>
            ‹
          </button>
          <span className="text-base font-bold text-gray-500 w-16 text-center">{index + 1} / {total}</span>
          <button onClick={() => goTo(index + 1)} className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 text-2xl active:scale-95 transition-transform">
            ›
          </button>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 px-6 py-3 flex justify-around text-center">
        <div><p className="text-xl font-bold text-green-600">{counts.known}</p><p className="text-xs text-gray-400">Sus</p></div>
        <div><p className="text-xl font-bold text-orange-500">{counts.review}</p><p className="text-xs text-gray-400">À revoir</p></div>
        <div><p className="text-xl font-bold text-gray-400">{total - counts.known - counts.review}</p><p className="text-xs text-gray-400">Non vus</p></div>
      </footer>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'

function buildChoices(word, allWords) {
  const pool = allWords.filter(w => w.viet !== word.viet)
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3)
  return [...shuffled, word].sort(() => Math.random() - 0.5)
}

export default function ExerciseQCM({ word, allWords, onKnown, onReview, silent }) {
  const [choices] = useState(() => buildChoices(word, allWords))
  const [selected, setSelected] = useState(null)
  const [played, setPlayed] = useState(false)
  const audioRef = useRef(null)

  const speak = () => {
    if (silent) return
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    const audio = new Audio(`/audio/${word.id}.mp3`)
    audioRef.current = audio
    audio.playbackRate = 0.85
    audio.play().catch(() => {
      const u = new SpeechSynthesisUtterance(word.viet)
      u.lang = 'vi-VN'; u.rate = 0.75
      window.speechSynthesis.speak(u)
    })
    setPlayed(true)
  }

  // Lecture automatique à l'affichage
  useEffect(() => {
    if (!silent) {
      const t = setTimeout(speak, 300)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id])

  const handleChoice = (choice) => {
    if (selected) return
    setSelected(choice)
  }

  const isCorrect = selected?.viet === word.viet

  const getChoiceStyle = (choice) => {
    if (!selected) return 'bg-gray-50 text-gray-800 active:bg-gray-100'
    if (choice.viet === word.viet) return 'bg-green-100 text-green-800 border-2 border-green-400'
    if (choice.viet === selected.viet) return 'bg-red-100 text-red-800 border-2 border-red-300'
    return 'bg-gray-50 text-gray-400'
  }

  return (
    <div className="w-full flex flex-col gap-5">

      {/* Zone audio */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-widest">Quelle est la traduction ?</p>
        <button
          onClick={speak}
          disabled={silent}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-colors ${
            silent ? 'bg-gray-100 text-gray-300' : 'bg-red-50 text-red-600 active:bg-red-100'
          }`}
        >
          🔊
        </button>
        {silent && <p className="text-xs text-gray-400">Mode silencieux activé</p>}
        {!silent && !played && <p className="text-xs text-gray-400 animate-pulse">Lecture en cours…</p>}
        {!silent && played && <p className="text-xs text-gray-400">Appuyez pour réécouter</p>}
      </div>

      {/* Choix */}
      <div className="grid grid-cols-2 gap-3">
        {choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleChoice(choice)}
            className={`${getChoiceStyle(choice)} rounded-2xl p-4 text-center font-semibold text-sm transition-colors min-h-[64px] flex items-center justify-center`}
          >
            {choice.fr}
          </button>
        ))}
      </div>

      {/* Résultat + bouton suivant */}
      {selected && (
        <div className="flex flex-col gap-3">
          <div className={`rounded-2xl p-4 text-center ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            {isCorrect
              ? <p className="font-bold text-green-700">✓ Correct ! <span className="font-normal">{word.viet}</span></p>
              : <p className="font-bold text-red-700">✗ La réponse était : <span className="font-normal">{word.fr}</span> — <span className="text-red-600">{word.viet}</span></p>
            }
          </div>
          <button
            onClick={isCorrect ? onKnown : onReview}
            className="w-full py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm active:scale-95 transition-transform"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}

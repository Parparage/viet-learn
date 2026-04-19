import { useState, useEffect, useRef } from 'react'

const normalize = (s) => s.trim().toLowerCase()

export default function ExerciseDictee({ word, onKnown, onReview, silent }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null) // null | 'correct' | 'wrong'
  const [attempts, setAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef(null)
  const audioRef = useRef(null)

  const speak = (slow = false) => {
    if (silent) return
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    const audio = new Audio(`/audio/${word.id}.mp3`)
    audioRef.current = audio
    audio.playbackRate = slow ? 0.6 : 0.85
    audio.play().catch(() => {
      const u = new SpeechSynthesisUtterance(word.viet)
      u.lang = 'vi-VN'; u.rate = slow ? 0.5 : 0.75
      window.speechSynthesis.speak(u)
    })
  }

  useEffect(() => {
    if (!silent) setTimeout(speak, 300)
    setTimeout(() => inputRef.current?.focus(), 400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id])

  const verify = () => {
    if (!input.trim() || result) return
    const correct = normalize(input) === normalize(word.viet)
    setResult(correct ? 'correct' : 'wrong')
    setAttempts(a => a + 1)
    if (!correct && attempts + 1 >= 2) setShowHint(true)
  }

  const retry = () => {
    setInput('')
    setResult(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div className="w-full flex flex-col gap-4">

      {/* Indication + boutons audio */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-widest">
          Écrivez ce que vous entendez
        </p>
        <p className="text-sm text-gray-500">
          Traduction : <span className="font-semibold text-gray-700">{word.fr}</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => speak(false)}
            disabled={silent}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              silent ? 'bg-gray-100 text-gray-300' : 'bg-red-50 text-red-600 active:bg-red-100'
            }`}
          >
            🔊 Écouter
          </button>
          <button
            onClick={() => speak(true)}
            disabled={silent}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              silent ? 'bg-gray-100 text-gray-300' : 'bg-orange-50 text-orange-600 active:bg-orange-100'
            }`}
          >
            🐢 Lent
          </button>
        </div>
        {silent && <p className="text-xs text-gray-400">Mode silencieux — le mot est affiché ci-dessous</p>}
        {silent && <p className="text-2xl font-bold text-gray-700">{word.viet}</p>}
      </div>

      {/* Indice après 2 erreurs */}
      {showHint && !result && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 text-center">
          💡 Commence par : <span className="font-bold">{word.viet.slice(0, 2)}…</span>
        </div>
      )}

      {/* Zone de saisie */}
      {!result && (
        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verify()}
            placeholder="Écrivez le mot vietnamien…"
            className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-red-400 outline-none text-lg text-center font-medium"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <p className="text-xs text-gray-400 text-center">
            Utilisez le clavier vietnamien de votre téléphone (Telex ou VNI)
          </p>
          <button
            onClick={verify}
            disabled={!input.trim()}
            className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform"
          >
            Vérifier
          </button>
        </div>
      )}

      {/* Résultat */}
      {result && (
        <div className="flex flex-col gap-3">
          <div className={`rounded-2xl p-4 text-center ${result === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
            {result === 'correct'
              ? <p className="font-bold text-green-700 text-lg">✓ Parfait ! <span className="text-green-600">{word.viet}</span></p>
              : (
                <div>
                  <p className="font-bold text-red-700">✗ Votre réponse : <span className="line-through opacity-60">{input}</span></p>
                  <p className="text-red-600 font-bold mt-1">Correct : {word.viet}</p>
                </div>
              )
            }
          </div>

          {result === 'wrong' && (
            <button
              onClick={retry}
              className="w-full py-3 rounded-xl bg-orange-100 text-orange-700 font-semibold text-sm active:scale-95 transition-transform"
            >
              🔁 Réessayer
            </button>
          )}

          <button
            onClick={result === 'correct' ? onKnown : onReview}
            className="w-full py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm active:scale-95 transition-transform"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}

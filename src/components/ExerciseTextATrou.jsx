import { useState, useRef } from 'react'
import { sentences } from '../data/sentences'

const normalize = (s) => s.trim().toLowerCase()

// Découpe la phrase en [avant le trou, après le trou]
function splitSentence(template) {
  const parts = template.split('___')
  return { before: parts[0] || '', after: parts[1] || '' }
}

// TTS pour la phrase complète (Web Speech API — qualité suffisante pour une phrase)
function speakSentence(text, slow = false) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'vi-VN'
  u.rate = slow ? 0.6 : 0.82
  window.speechSynthesis.speak(u)
}

export default function ExerciseTextATrou({ word, onKnown, onReview }) {
  const sentence = sentences[word.id]
  const [input, setInput]   = useState('')
  const [result, setResult] = useState(null) // null | 'correct' | 'wrong'
  const [attempts, setAttempts] = useState(0)
  const inputRef = useRef(null)

  // Si aucune phrase disponible pour ce mot, passer directement
  if (!sentence) {
    return (
      <div className="w-full flex flex-col items-center gap-4">
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <p className="text-gray-500 text-sm">Pas de phrase disponible pour ce mot.</p>
          <p className="text-2xl font-bold mt-2">{word.viet}</p>
          <p className="text-gray-500">{word.fr}</p>
        </div>
        <button onClick={onKnown} className="w-full py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm active:scale-95 transition-transform">
          Suivant →
        </button>
      </div>
    )
  }

  const { before, after } = splitSentence(sentence.vi)
  const fullSentence = sentence.vi.replace('___', word.viet)

  const verify = () => {
    if (!input.trim() || result) return
    const correct = normalize(input) === normalize(word.viet)
    setResult(correct ? 'correct' : 'wrong')
    setAttempts(a => a + 1)
    if (correct) speakSentence(fullSentence)
  }

  const retry = () => {
    setInput('')
    setResult(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const showHint = attempts >= 2 && !result

  return (
    <div className="w-full flex flex-col gap-4">

      {/* Carte phrase */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-widest text-center">
          Complétez la phrase
        </p>

        {/* Phrase avec le trou */}
        <p className="text-xl font-medium text-gray-800 text-center leading-relaxed">
          <span>{before}</span>
          {result === 'correct'
            ? <span className="text-green-600 font-bold underline">{word.viet}</span>
            : result === 'wrong'
            ? <span className="text-red-500 font-bold">[{input}]</span>
            : <span className="inline-block border-b-2 border-red-400 min-w-[80px] mx-1 text-transparent select-none">___</span>
          }
          <span>{after}</span>
        </p>

        {/* Traduction */}
        <p className="text-sm text-gray-500 italic text-center">« {sentence.fr} »</p>

        {/* Boutons audio */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => speakSentence(fullSentence)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-50 text-red-600 active:bg-red-100"
          >
            🔊 Phrase complète
          </button>
          <button
            onClick={() => speakSentence(fullSentence, true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-orange-50 text-orange-600 active:bg-orange-100"
          >
            🐢 Lent
          </button>
        </div>

        {/* Thème */}
        <p className="text-xs text-gray-400 text-center">Thème : {word.theme}</p>
      </div>

      {/* Indice après 2 erreurs */}
      {showHint && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 text-center">
          💡 Commence par : <span className="font-bold">{word.viet.slice(0, 2)}…</span>
          {word.viet.length > 4 && <span className="ml-2 opacity-70">({word.viet.length} lettres)</span>}
        </div>
      )}

      {/* Saisie */}
      {!result && (
        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verify()}
            placeholder="Le mot manquant…"
            className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-red-400 outline-none text-lg text-center font-medium"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
          />
          <button
            onClick={verify}
            disabled={!input.trim()}
            className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold disabled:opacity-40 active:scale-95 transition-transform"
          >
            Vérifier
          </button>
        </div>
      )}

      {/* Résultat */}
      {result && (
        <div className="flex flex-col gap-3">
          <div className={`rounded-2xl p-4 ${result === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
            {result === 'correct'
              ? <p className="font-bold text-green-700 text-center">✓ Parfait ! La phrase est correcte.</p>
              : (
                <div className="text-center">
                  <p className="font-bold text-red-700">✗ Votre réponse : <span className="line-through opacity-60">{input}</span></p>
                  <p className="text-red-600 font-bold mt-1">Mot correct : {word.viet}</p>
                  <p className="text-sm text-red-500 mt-1">{fullSentence}</p>
                </div>
              )
            }
          </div>

          {result === 'wrong' && (
            <button onClick={retry} className="w-full py-3 rounded-xl bg-orange-100 text-orange-700 font-semibold text-sm active:scale-95 transition-transform">
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

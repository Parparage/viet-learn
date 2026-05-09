/**
 * ExpressionOraleScreen — exercice de prononciation avec reconnaissance vocale.
 *
 * Flux : LevelSelect → Session (5 phrases) → Summary → LevelSelect
 * Chaque phrase : affichage viet → enregistrement micro → comparaison mot à mot
 */
import { useState, useEffect, useRef } from 'react'
import { PRONUNCIATION_LEVELS } from '../data/pronunciation_phrases'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { usePronunciationProgress } from '../hooks/usePronunciationProgress'

// ─── Utilitaires de comparaison ──────────────────────────────────────

/** Normalise un texte pour comparaison : minuscules, sans ponctuation, espaces unifiés. */
function normalizeText(text) {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]{}‘’“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Compare le texte reconnu au texte attendu, mot par mot.
 * Retourne { words: [{type, word, expected?, got?}], score, correct, total }
 */
function compareWords(recognized, expected) {
  const recW = normalizeText(recognized).split(' ').filter(Boolean)
  const expW = normalizeText(expected).split(' ').filter(Boolean)

  // LCS pour aligner les mots
  const m = recW.length, n = expW.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = recW[i - 1] === expW[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])

  // Reconstruction : trouver les mots communs
  const matchSet = new Set()
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (recW[i - 1] === expW[j - 1]) {
      matchSet.add(`${i - 1}:${j - 1}`)
      i--; j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  // Construire le diff visuel (côté attendu)
  const words = []
  let ri = 0, ej = 0
  const recMatched = new Set()
  const expMatched = new Set()

  // D'abord, marquer les positions matchées
  for (const key of matchSet) {
    const [a, b] = key.split(':').map(Number)
    recMatched.add(a)
    expMatched.add(b)
  }

  // Résultat basé sur les mots attendus
  for (let k = 0; k < expW.length; k++) {
    if (expMatched.has(k)) {
      words.push({ type: 'correct', word: expW[k] })
    } else {
      // Chercher le mot reconnu le plus proche non matché
      const wrongRec = recW.find((w, idx) => !recMatched.has(idx) && idx >= 0)
      if (wrongRec !== undefined) {
        words.push({ type: 'wrong', expected: expW[k], got: wrongRec })
        // Marquer ce mot reconnu comme consommé
        const idx = recW.findIndex((w, idx2) => !recMatched.has(idx2) && w === wrongRec)
        if (idx >= 0) recMatched.add(idx)
      } else {
        words.push({ type: 'missing', word: expW[k] })
      }
    }
  }

  // Mots extra reconnus non matchés
  for (let k = 0; k < recW.length; k++) {
    if (!recMatched.has(k)) {
      words.push({ type: 'extra', word: recW[k] })
    }
  }

  const correct = words.filter(w => w.type === 'correct').length
  const score   = expW.length > 0 ? correct / expW.length : 0
  return { words, score, correct, total: expW.length }
}

/** Label et couleur selon le score. */
function scoreLabel(score) {
  if (score >= 0.9) return { text: 'Excellent !',     color: 'text-green-600',  bg: 'bg-green-100' }
  if (score >= 0.7) return { text: 'Bien !',          color: 'text-blue-600',   bg: 'bg-blue-100' }
  if (score >= 0.5) return { text: 'Presque !',       color: 'text-amber-600',  bg: 'bg-amber-100' }
  return                    { text: 'À retravailler',  color: 'text-red-600',    bg: 'bg-red-100' }
}

// ─── Sous-composants ─────────────────────────────────────────────────

/** Barre de progression simple. */
function ProgressBar({ value, max, className = '' }) {
  const pct = max > 0 ? Math.round(value / max * 100) : 0
  return (
    <div className={`h-1.5 bg-black/10 rounded-full overflow-hidden ${className}`}>
      <div className="h-full bg-current opacity-60 rounded-full transition-all duration-300"
           style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Points de progression de la session (●●○○○). */
function SessionDots({ current, total, results }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => {
        const done = i < results.length
        const active = i === current
        let color = 'bg-gray-300'
        if (done) {
          color = results[i].score >= 0.7 ? 'bg-green-500' : 'bg-red-400'
        } else if (active) {
          color = 'bg-indigo-500'
        }
        return (
          <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${color}`} />
        )
      })}
    </div>
  )
}

// ─── Vue : sélection de niveau ───────────────────────────────────────

function LevelSelectView({ progress, onSelect, onBack }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-indigo-600 text-white px-4 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-2xl leading-none">‹</button>
          <div>
            <h1 className="text-lg font-bold">Expression orale</h1>
            <p className="text-xs text-indigo-200">Prononciation guidée par niveau</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 overflow-y-auto">
        <p className="text-sm text-gray-500 mb-4">
          Lisez la phrase vietnamienne à voix haute. La reconnaissance vocale vérifie votre prononciation.
        </p>

        <div className="space-y-3">
          {PRONUNCIATION_LEVELS.map(level => {
            const { mastered, total } = progress.getLevelProgress(level.phrases)
            return (
              <button
                key={level.level}
                onClick={() => onSelect(level)}
                className={`w-full ${level.color} border rounded-2xl p-4 text-left
                           active:scale-[0.98] transition-transform`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{level.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold opacity-50">Niv. {level.level}</span>
                      <p className="font-bold text-sm">{level.name}</p>
                    </div>
                    <p className="text-xs opacity-70 mt-0.5">{level.description}</p>
                    <ProgressBar value={mastered} max={total} className="mt-2" />
                    <p className="text-xs opacity-50 mt-1">
                      {mastered}/{total} maîtrisées
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Info reconnaissance vocale */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-blue-700">
            <strong>Astuce :</strong> Utilisez Chrome pour la meilleure reconnaissance vocale en vietnamien.
            Une connexion internet est nécessaire.
          </p>
        </div>
      </main>
    </div>
  )
}

// ─── Vue : session d'exercice ────────────────────────────────────────

function SessionView({ level, phrases, progress, onEnd, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults]           = useState([])
  const [phase, setPhase]               = useState('ready') // ready | listening | result
  const [comparison, setComparison]     = useState(null)

  const speech = useSpeechRecognition()
  const prevListeningRef = useRef(false)

  const currentPhrase = phrases[currentIndex]

  // Détecte la fin de l'écoute (front descendant de isListening)
  useEffect(() => {
    if (prevListeningRef.current && !speech.isListening && phase === 'listening') {
      if (speech.transcript) {
        const comp = compareWords(speech.transcript, currentPhrase.vi)
        setComparison(comp)
        setPhase('result')
      } else {
        // Pas de résultat → retour à ready
        setPhase('ready')
      }
    }
    prevListeningRef.current = speech.isListening
  }, [speech.isListening, speech.transcript, phase, currentPhrase])

  const handleStart = () => {
    speech.reset()
    setComparison(null)
    setPhase('listening')
    speech.start()
  }

  const handleStop = () => {
    speech.stop()
  }

  const handleRetry = () => {
    speech.reset()
    setComparison(null)
    setPhase('ready')
  }

  const advance = (score, recognized) => {
    progress.record(currentPhrase.id, score)
    const newResults = [...results, { phrase: currentPhrase, score, recognized }]
    setResults(newResults)

    if (currentIndex < phrases.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setPhase('ready')
      setComparison(null)
      speech.reset()
    } else {
      onEnd(newResults)
    }
  }

  const handleNext = () => {
    advance(comparison?.score ?? 0, speech.transcript || '')
  }

  const handleManualSuccess = () => {
    advance(1.0, '(validé manuellement)')
  }

  // ── Rendu ──

  const label = comparison ? scoreLabel(comparison.score) : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-indigo-600 text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-2xl leading-none">‹</button>
            <div>
              <p className="font-bold text-sm">{level.emoji} {level.name}</p>
              <p className="text-xs text-indigo-200">
                Phrase {currentIndex + 1} / {phrases.length}
              </p>
            </div>
          </div>
          <SessionDots current={currentIndex} total={phrases.length} results={results} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">

        {/* Phrase vietnamienne */}
        <div className="w-full bg-white rounded-2xl shadow-md p-6 mb-6">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-2">
            Lisez à voix haute :
          </p>
          <p className="text-xl font-bold text-gray-800 leading-relaxed text-center">
            {currentPhrase.vi}
          </p>
          <p className="text-sm text-gray-400 text-center mt-3 italic">
            {currentPhrase.fr}
          </p>
        </div>

        {/* Bouton micro */}
        {phase === 'ready' && (
          <div className="flex flex-col items-center gap-4">
            {!speech.isSupported ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-700 text-sm font-semibold">
                  Reconnaissance vocale non disponible
                </p>
                <p className="text-red-500 text-xs mt-1">
                  Utilisez Google Chrome pour cette fonctionnalité.
                </p>
                {/* Fallback : validation manuelle */}
                <button
                  onClick={handleManualSuccess}
                  className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold"
                >
                  J'ai bien prononcé (validation manuelle)
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleStart}
                  className="w-20 h-20 rounded-full bg-indigo-600 text-white text-3xl
                             shadow-lg active:scale-90 transition-transform
                             flex items-center justify-center"
                  aria-label="Commencer l'enregistrement"
                >
                  🎙️
                </button>
                <p className="text-sm text-gray-400">Appuyez pour parler</p>
              </>
            )}

            {speech.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center max-w-xs">
                <p className="text-red-600 text-xs">{speech.error}</p>
              </div>
            )}
          </div>
        )}

        {/* État écoute */}
        {phase === 'listening' && (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleStop}
              className="w-20 h-20 rounded-full bg-red-500 text-white text-3xl
                         shadow-lg animate-pulse flex items-center justify-center"
              aria-label="Arrêter l'enregistrement"
            >
              ⏹️
            </button>
            <p className="text-sm text-red-500 font-semibold animate-pulse">
              Écoute en cours…
            </p>
            {speech.interim && (
              <p className="text-sm text-gray-500 italic bg-gray-100 rounded-lg px-3 py-2">
                {speech.interim}
              </p>
            )}
          </div>
        )}

        {/* Résultat */}
        {phase === 'result' && comparison && (
          <div className="w-full space-y-4">
            {/* Score */}
            <div className={`${label.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${label.color}`}>
                {Math.round(comparison.score * 100)} %
              </p>
              <p className={`text-sm font-semibold ${label.color}`}>{label.text}</p>
              {speech.confidence > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Confiance reconnaissance : {Math.round(speech.confidence * 100)}%
                </p>
              )}
            </div>

            {/* Reconnu vs Attendu */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Reconnu :</p>
                <p className="text-sm text-gray-700">{speech.transcript}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Attendu :</p>
                <div className="flex flex-wrap gap-1">
                  {comparison.words.map((w, i) => {
                    if (w.type === 'correct') {
                      return <span key={i} className="text-green-700 font-semibold">{w.word}</span>
                    }
                    if (w.type === 'wrong') {
                      return (
                        <span key={i} className="relative group">
                          <span className="text-red-600 font-semibold line-through">{w.got}</span>
                          <span className="text-green-700 font-semibold ml-0.5">→ {w.expected}</span>
                        </span>
                      )
                    }
                    if (w.type === 'missing') {
                      return (
                        <span key={i} className="text-orange-500 font-semibold underline">
                          [{w.word}]
                        </span>
                      )
                    }
                    // extra
                    return (
                      <span key={i} className="text-gray-400 line-through text-xs">
                        {w.word}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold
                           active:scale-95 transition-transform"
              >
                🔄 Réessayer
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold
                           active:scale-95 transition-transform"
              >
                {currentIndex < phrases.length - 1 ? '→ Suivant' : '✓ Terminer'}
              </button>
            </div>

            {/* Override manuel */}
            <button
              onClick={handleManualSuccess}
              className="w-full py-2 text-xs text-gray-400 underline"
            >
              J'ai bien prononcé (la reconnaissance s'est trompée)
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Vue : résumé de session ─────────────────────────────────────────

function SummaryView({ level, results, onBack }) {
  const successes = results.filter(r => r.score >= 0.7).length
  const total     = results.length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-indigo-600 text-white px-4 py-4 shadow-md text-center">
        <h1 className="text-lg font-bold">Session terminée !</h1>
        <p className="text-indigo-200 text-sm">{level.emoji} {level.name}</p>
      </header>

      <main className="flex-1 px-4 py-6 overflow-y-auto">
        {/* Score global */}
        <div className="bg-white rounded-2xl shadow-md p-6 text-center mb-6">
          <p className="text-5xl font-bold text-indigo-600">
            {successes}/{total}
          </p>
          <p className="text-gray-500 mt-2">
            {successes === total ? 'Parfait ! Toutes les phrases sont maîtrisées.' :
             successes >= total / 2 ? 'Bon travail ! Continuez à pratiquer.' :
             'Ne vous découragez pas, la prononciation vient avec la pratique !'}
          </p>
        </div>

        {/* Détail phrase par phrase */}
        <div className="space-y-2">
          {results.map((r, i) => {
            const ok = r.score >= 0.7
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <span className="text-lg">{ok ? '✓' : '✗'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {r.phrase.vi}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{r.phrase.fr}</p>
                </div>
                <span className={`text-sm font-bold ${ok ? 'text-green-600' : 'text-red-500'}`}>
                  {Math.round(r.score * 100)}%
                </span>
              </div>
            )
          })}
        </div>

        <button
          onClick={onBack}
          className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold
                     active:scale-95 transition-transform"
        >
          Retour aux niveaux
        </button>
      </main>
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────────

export default function ExpressionOraleScreen({ onBack }) {
  const [view, setView]               = useState('levels')   // levels | session | summary
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [sessionPhrases, setSessionPhrases] = useState([])
  const [sessionResults, setSessionResults] = useState([])

  const progress = usePronunciationProgress()

  const startSession = (level) => {
    const phrases = progress.selectSessionPhrases(level.phrases, 5)
    setSelectedLevel(level)
    setSessionPhrases(phrases)
    setSessionResults([])
    setView('session')
  }

  const endSession = (results) => {
    setSessionResults(results)
    setView('summary')
  }

  if (view === 'session' && selectedLevel) {
    return (
      <SessionView
        level={selectedLevel}
        phrases={sessionPhrases}
        progress={progress}
        onEnd={endSession}
        onBack={() => setView('levels')}
      />
    )
  }

  if (view === 'summary' && selectedLevel) {
    return (
      <SummaryView
        level={selectedLevel}
        results={sessionResults}
        onBack={() => setView('levels')}
      />
    )
  }

  return (
    <LevelSelectView
      progress={progress}
      onSelect={startSession}
      onBack={onBack}
    />
  )
}

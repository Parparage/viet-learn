import { useState, useRef, useEffect } from 'react'
import { assimilAudioUrl } from '../lib/supabase'
import lessonsRaw from '../data/lessons_raw.json'
import transcripts from '../data/assimil_transcripts.json'
import { useSentenceSRS } from '../hooks/useSentenceSRS'

const LESSON_KEY = 'assimil-progress'

function loadLessonProgress() {
  try { return JSON.parse(localStorage.getItem(LESSON_KEY) || '{}') }
  catch { return {} }
}

// ── Normalisation avant comparaison ─────────────────────────
function normalize(text) {
  return text
    .trim()
    .replace(/\s+([!?.,;:])/g, '$1')
    .replace(/\s+/g, ' ')
}

// ── Comparaison caractère par caractère (Unicode-safe) ───────
// ! en fin de phrase : facultatif — ? : obligatoire
function diffText(input, expected) {
  let inp = normalize(input)
  let exp = normalize(expected)
  if (exp.endsWith('!') && !inp.endsWith('!')) {
    exp = exp.slice(0, -1).trimEnd()
  }
  const ic = [...inp], ec = [...exp]
  const len = Math.max(ic.length, ec.length)
  const result = []
  for (let i = 0; i < len; i++) {
    if (ic[i] === undefined)       result.push({ type: 'missing', expected: ec[i] })
    else if (ec[i] === undefined)  result.push({ type: 'extra',   input: ic[i] })
    else if (ic[i] === ec[i])      result.push({ type: 'correct', char: ic[i] })
    else                           result.push({ type: 'wrong',   input: ic[i], expected: ec[i] })
  }
  return result
}

function errorsIn(diff) {
  return diff.filter(d => d.type !== 'correct').length
}

// ── Affichage du diff ────────────────────────────────────────
function DiffDisplay({ diff }) {
  return (
    <p className="text-xl font-semibold text-center leading-relaxed tracking-wide break-words">
      {diff.map((d, i) => {
        if (d.type === 'correct') return <span key={i} className="text-green-600">{d.char}</span>
        if (d.type === 'wrong')   return <span key={i} className="bg-red-100 text-red-600 rounded px-0.5">{d.input}</span>
        if (d.type === 'missing') return <span key={i} className="bg-orange-100 text-orange-400 rounded px-0.5">_</span>
        if (d.type === 'extra')   return <span key={i} className="bg-red-100 text-red-400 line-through rounded px-0.5">{d.input}</span>
        return null
      })}
    </p>
  )
}

// ── Lecteur audio ────────────────────────────────────────────
function AudioPlayer({ url, label, autoPlay = false, onEnded }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [loaded,  setLoaded]  = useState(false)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onPlay  = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnd   = () => { setPlaying(false); onEnded?.() }
    const onLoad  = () => { setLoaded(true); if (autoPlay) a.play() }
    a.addEventListener('playing', onPlay)
    a.addEventListener('pause',   onPause)
    a.addEventListener('ended',   onEnd)
    a.addEventListener('canplay', onLoad)
    return () => {
      a.removeEventListener('playing', onPlay)
      a.removeEventListener('pause',   onPause)
      a.removeEventListener('ended',   onEnd)
      a.removeEventListener('canplay', onLoad)
    }
  }, [autoPlay, onEnded])

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
      <audio ref={audioRef} src={url} preload="auto" />
      <button
        onClick={() => { const a = audioRef.current; if (!a) return; playing ? a.pause() : a.play() }}
        className={`w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-colors ${
          playing ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 active:bg-red-100'
        }`}
      >
        {playing ? '⏸' : '▶️'}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        {!loaded && <p className="text-xs text-gray-300">Chargement…</p>}
      </div>
    </div>
  )
}

// ── Machine d'états par phrase (partagée entre LessonView et ReviewView) ─
// Retourne le JSX des étapes 1-5 + les handlers
function useSentenceFlow({ entry, audioUrl, audioKey, onReveal, onNext, nextLabel }) {
  const [sentencePhase, setSentencePhase] = useState('listening')
  const [userInput,     setUserInput]     = useState('')
  const [diff,          setDiff]          = useState(null)
  const [firstErrCount, setFirstErrCount] = useState(null)

  function reset() {
    setSentencePhase('listening')
    setUserInput('')
    setDiff(null)
    setFirstErrCount(null)
  }

  function handleVerify() {
    if (!entry?.vi || !userInput.trim()) return
    const d = diffText(userInput, entry.vi)
    setDiff(d)
    setSentencePhase('checking')
    if (firstErrCount === null) setFirstErrCount(errorsIn(d))
  }

  function handleReveal() {
    if (firstErrCount !== null) onReveal(firstErrCount)
    setSentencePhase('revealed')
  }

  const errCount = diff ? errorsIn(diff) : 0

  const jsx = (
    <>
      {/* Audio — toujours visible */}
      <div className="w-full max-w-sm">
        <AudioPlayer
          key={audioKey}
          url={audioUrl}
          label={audioKey}
          autoPlay={sentencePhase === 'listening'}
        />
      </div>

      {/* Étape 1 : Écoute */}
      {sentencePhase === 'listening' && (
        <button
          onClick={() => setSentencePhase(entry?.vi ? 'writing' : 'revealed')}
          className="w-full max-w-sm py-4 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
        >
          ✍️ J'ai écouté — j'écris la phrase →
        </button>
      )}

      {/* Étape 2 : Écriture */}
      {sentencePhase === 'writing' && (
        <>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleVerify() } }}
            placeholder="Écrivez la phrase en vietnamien…"
            className="w-full max-w-sm rounded-2xl border border-gray-200 shadow-sm px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-white"
            rows={3}
            autoFocus
          />
          <div className="flex gap-3 w-full max-w-sm">
            <button
              onClick={() => setSentencePhase('revealed')}
              className="py-3 px-4 bg-gray-100 text-gray-500 font-semibold rounded-xl text-sm active:scale-95"
            >
              Passer
            </button>
            <button
              onClick={handleVerify}
              disabled={!userInput.trim()}
              className="flex-1 py-4 bg-red-600 text-white font-bold rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
            >
              Vérifier →
            </button>
          </div>
        </>
      )}

      {/* Étape 3 : Correction */}
      {sentencePhase === 'checking' && diff && (
        <>
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 space-y-3">
            <DiffDisplay diff={diff} />
            <p className="text-xs text-center font-semibold border-t border-gray-50 pt-2">
              {errCount === 0
                ? <span className="text-green-600">✓ Parfait !</span>
                : <span className="text-red-500">{errCount} erreur{errCount > 1 ? 's' : ''} — essayez de corriger !</span>
              }
            </p>
          </div>
          <div className="flex gap-3 w-full max-w-sm">
            {errCount > 0 && (
              <button
                onClick={() => setSentencePhase('writing')}
                className="flex-1 py-3 bg-orange-50 text-orange-700 font-semibold rounded-xl active:scale-95"
              >
                ✏️ Corriger
              </button>
            )}
            <button
              onClick={handleReveal}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl active:scale-95"
            >
              👁 Voir la phrase
            </button>
          </div>
        </>
      )}

      {/* Étape 4 : Transcription révélée */}
      {sentencePhase === 'revealed' && (
        <>
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-lg font-semibold text-gray-800 text-center leading-snug">
              {entry?.vi ?? '—'}
            </p>
          </div>
          <div className="flex gap-3 w-full max-w-sm">
            {entry?.fr && (
              <button
                onClick={() => setSentencePhase('translated')}
                className="py-3 px-4 bg-blue-50 text-blue-600 font-semibold rounded-xl text-sm active:scale-95"
              >
                🇫🇷 Traduction
              </button>
            )}
            <button
              onClick={() => { reset(); onNext() }}
              className="flex-1 py-4 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
            >
              {nextLabel}
            </button>
          </div>
        </>
      )}

      {/* Étape 5 : Traduction optionnelle */}
      {sentencePhase === 'translated' && (
        <>
          <div className="w-full max-w-sm bg-white rounded-2xl border border-blue-100 shadow-sm px-5 py-4 space-y-3">
            <p className="text-lg font-semibold text-gray-800 text-center leading-snug">{entry?.vi}</p>
            <div className="border-t border-blue-100 pt-3">
              <p className="text-sm text-blue-600 text-center leading-snug">{entry?.fr}</p>
            </div>
          </div>
          <button
            onClick={() => { reset(); onNext() }}
            className="w-full max-w-sm py-4 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
          >
            {nextLabel}
          </button>
        </>
      )}
    </>
  )

  return { jsx, reset }
}

// ── Vue Révision du jour ─────────────────────────────────────
function ReviewView({ sentences, onBack, onRecord }) {
  const [index,    setIndex]    = useState(0)
  const [results,  setResults]  = useState([])  // errCount par phrase
  const [isDone,   setIsDone]   = useState(false)

  const current = sentences[index]
  const entry   = current ? (transcripts[String(current.lessonNum)] || {})[current.key] : null
  const audioUrl = current ? assimilAudioUrl(current.lessonNum, `${current.key}.mp3`) : null
  const isLast   = index + 1 >= sentences.length

  const handleReveal = (errCount) => {
    onRecord(current.lessonNum, current.key, errCount)
    setResults(r => [...r, errCount])
  }

  const handleNext = () => {
    if (isLast) { setIsDone(true); return }
    setIndex(i => i + 1)
  }

  const { jsx } = useSentenceFlow({
    entry,
    audioUrl,
    audioKey: current ? `rev-${index}` : 'rev',
    onReveal: handleReveal,
    onNext:   handleNext,
    nextLabel: isLast ? 'Terminer →' : 'Suivante →',
  })

  if (isDone) {
    const perfect = results.filter(n => n === 0).length
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
        <header className="bg-amber-500 text-white px-4 py-3 flex items-center gap-3 shadow-md">
          <button onClick={onBack} className="text-amber-200 text-xl p-1">‹</button>
          <h1 className="font-bold text-base">Révision terminée</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-5">
          <div className="text-6xl">🎯</div>
          <h2 className="text-xl font-bold text-gray-800 text-center">Révision du jour terminée !</h2>
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Phrases révisées</span>
              <span className="font-bold text-gray-800">{results.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Parfaites (0 erreur)</span>
              <span className="font-bold text-green-600">{perfect}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Avec erreurs</span>
              <span className="font-bold text-orange-500">{results.length - perfect}</span>
            </div>
          </div>
          <button
            onClick={onBack}
            className="w-full max-w-sm py-4 bg-amber-500 text-white font-bold rounded-xl active:scale-95 transition-transform"
          >
            Retour aux leçons
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-amber-500 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={onBack} className="text-amber-200 text-xl p-1">‹</button>
        <div>
          <h1 className="font-bold text-base">Révision du jour</h1>
          <p className="text-xs text-amber-100">
            {index + 1} / {sentences.length} — Leçon {String(current?.lessonNum).padStart(3, '0')}
          </p>
        </div>
      </header>

      <div className="h-1.5 bg-amber-100">
        <div
          className="h-full bg-amber-400 transition-all duration-300"
          style={{ width: `${(index / sentences.length) * 100}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center px-4 py-6 gap-4">
        {/* Rappel de la dernière performance */}
        {current?.lastErrors !== undefined && (
          <p className="text-xs text-amber-600 text-center">
            Dernière fois : {current.lastErrors === 0
              ? '✓ parfait'
              : `${current.lastErrors} erreur${current.lastErrors > 1 ? 's' : ''}`}
          </p>
        )}
        {jsx}
      </main>
    </div>
  )
}

// ── Vue d'une leçon ─────────────────────────────────────────
function LessonView({ lesson, onBack, onMark, onSentenceDone }) {
  const [phase,  setPhase]  = useState('vn')
  const [sIndex, setSIndex] = useState(0)
  const [tIndex, setTIndex] = useState(0)

  const { s: sCount, t: tCount, num } = lesson
  const lessonTr     = transcripts[String(num)] || {}
  const sKey         = `S${String(sIndex + 1).padStart(2, '0')}`
  const tKey         = `T${String(tIndex + 1).padStart(2, '0')}`
  const currentEntry = phase === 'vn' ? lessonTr[sKey] : lessonTr[tKey]

  const sUrl = i => assimilAudioUrl(num, `S${String(i).padStart(2, '0')}.mp3`)
  const tUrl = i => assimilAudioUrl(num, `T${String(i).padStart(2, '0')}.mp3`)

  const isLastS = sIndex + 1 >= sCount

  const handleNextS = () => {
    if (isLastS) setPhase('fr')
    else setSIndex(i => i + 1)
  }

  const handleNextT = () => {
    if (tIndex + 1 >= tCount) setPhase('done')
    else setTIndex(i => i + 1)
  }

  const { jsx: sentenceJsx } = useSentenceFlow({
    entry:    currentEntry,
    audioUrl: sUrl(sIndex + 1),
    audioKey: `s-${sIndex}`,
    onReveal: (errCount) => onSentenceDone?.(num, sKey, errCount),
    onNext:   handleNextS,
    nextLabel: isLastS ? 'Phase traduction →' : 'Phrase suivante →',
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={onBack} className="text-red-200 text-xl p-1">‹</button>
        <div>
          <h1 className="font-bold text-base">Leçon {String(num).padStart(3, '0')}</h1>
          <p className="text-xs text-red-200">
            {phase === 'vn'   && `Phrase ${sIndex + 1} / ${sCount}`}
            {phase === 'fr'   && `Traduction ${tIndex + 1} / ${tCount}`}
            {phase === 'done' && 'Leçon terminée'}
          </p>
        </div>
      </header>

      <div className="h-1.5 bg-red-100">
        <div className="h-full bg-amber-400 transition-all duration-300" style={{
          width: phase === 'done' ? '100%'
               : phase === 'vn'  ? `${(sIndex / (sCount + tCount)) * 100}%`
               : `${((sCount + tIndex) / (sCount + tCount)) * 100}%`
        }} />
      </div>

      <main className="flex-1 flex flex-col items-center px-4 py-6 gap-4">

        {/* ── Phase VN (dictée) ── */}
        {phase === 'vn' && sentenceJsx}

        {/* ── Phase FR (traduction passive) ── */}
        {phase === 'fr' && tCount > 0 && (
          <>
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">🇫🇷</div>
            <p className="text-sm font-semibold text-gray-600 text-center">Traduction de la leçon</p>
            <div className="w-full max-w-sm">
              <AudioPlayer
                key={`t-${tIndex}`}
                url={tUrl(tIndex + 1)}
                label={`Traduction ${tIndex + 1} / ${tCount}`}
                autoPlay
              />
            </div>
            {lessonTr[tKey] && (
              <div className="w-full max-w-sm bg-white rounded-2xl border border-blue-100 shadow-sm px-5 py-4 space-y-2">
                {lessonTr[tKey].vi && (
                  <p className="text-sm text-gray-500 text-center leading-snug">{lessonTr[tKey].vi}</p>
                )}
                {lessonTr[tKey].fr && (
                  <div className="border-t border-blue-100 pt-2">
                    <p className="text-base font-semibold text-blue-700 text-center leading-snug">{lessonTr[tKey].fr}</p>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleNextT}
              className="w-full max-w-sm py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
            >
              {tIndex + 1 < tCount ? 'Traduction suivante →' : 'Terminer →'}
            </button>
          </>
        )}

        {phase === 'fr' && tCount === 0 && <>{setPhase('done')}</>}

        {/* ── Phase terminée ── */}
        {phase === 'done' && (
          <>
            <div className="text-6xl">✅</div>
            <h2 className="text-xl font-bold text-gray-800 text-center">
              Leçon {String(num).padStart(3, '0')} terminée
            </h2>
            <p className="text-sm text-gray-500 text-center">Comment s'est passée cette leçon ?</p>
            <div className="flex gap-3 w-full max-w-sm">
              <button
                onClick={() => onMark(num, 'review')}
                className="flex-1 py-4 bg-orange-100 text-orange-700 font-bold rounded-xl active:scale-95 transition-transform"
              >
                🔁 À revoir
              </button>
              <button
                onClick={() => onMark(num, 'done')}
                className="flex-1 py-4 bg-green-100 text-green-700 font-bold rounded-xl active:scale-95 transition-transform"
              >
                ✓ Compris !
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// ── Liste des leçons ─────────────────────────────────────────
export default function AssimilScreen({ online, onBack }) {
  const [progress,  setProgress]  = useState(loadLessonProgress)
  const [selected,  setSelected]  = useState(null)   // leçon ouverte
  const [reviewing, setReviewing] = useState(false)  // mode révision

  const srs = useSentenceSRS()

  const mark = (num, status) => {
    const next = { ...progress, [num]: { status, date: Date.now() } }
    setProgress(next)
    localStorage.setItem(LESSON_KEY, JSON.stringify(next))
    setSelected(null)
  }

  const dueCount = srs.getDueCount()

  // ── Mode révision ──
  if (reviewing) {
    return (
      <ReviewView
        sentences={srs.getDue()}
        onBack={() => setReviewing(false)}
        onRecord={srs.record}
      />
    )
  }

  // ── Vue leçon ──
  if (selected) {
    return (
      <LessonView
        lesson={selected}
        onBack={() => setSelected(null)}
        onMark={mark}
        onSentenceDone={srs.record}
      />
    )
  }

  // ── Liste des leçons ──
  const done   = Object.values(progress).filter(p => p.status === 'done').length
  const review = Object.values(progress).filter(p => p.status === 'review').length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={onBack} className="text-red-200 text-xl p-1">‹</button>
        <div className="flex-1">
          <h1 className="font-bold text-base">Compréhension orale</h1>
          <p className="text-xs text-red-200">{lessonsRaw.length} leçons · {done} terminées · {review} à revoir</p>
        </div>
        {!online && (
          <span className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded-lg">Hors-ligne</span>
        )}
      </header>

      {!online && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 text-sm text-orange-700 text-center">
          ⚠️ La compréhension orale nécessite une connexion internet
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Révision du jour */}
        {dueCount > 0 && online && (
          <button
            onClick={() => setReviewing(true)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-left bg-amber-50 border border-amber-300 shadow-sm active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-lg flex-shrink-0">
              🔁
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-800">Révision du jour</p>
              <p className="text-xs text-amber-600">{dueCount} phrase{dueCount > 1 ? 's' : ''} à réviser</p>
            </div>
            <span className="text-amber-400 text-xl">›</span>
          </button>
        )}

        {/* Liste des leçons */}
        <div className="flex flex-col gap-2">
          {lessonsRaw.map(lesson => {
            const p         = progress[lesson.num]
            const status    = p?.status || 'new'
            const lessonDue = srs.getLessonDue(lesson.num)
            return (
              <button
                key={lesson.num}
                onClick={() => online && setSelected(lesson)}
                disabled={!online}
                className={`flex items-center gap-4 p-4 rounded-2xl text-left active:scale-95 transition-transform ${
                  !online             ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                  : status === 'done'   ? 'bg-green-50 border border-green-200'
                  : status === 'review' ? 'bg-orange-50 border border-orange-200'
                  : 'bg-white border border-gray-100 shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  status === 'done'   ? 'bg-green-100 text-green-700'
                  : status === 'review' ? 'bg-orange-100 text-orange-600'
                  : 'bg-red-100 text-red-600'
                }`}>
                  {status === 'done' ? '✓' : status === 'review' ? '↺' : String(lesson.num).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">Leçon {String(lesson.num).padStart(3, '0')}</p>
                  <p className="text-xs text-gray-400">{lesson.s} phrases VN · {lesson.t} traductions FR</p>
                </div>
                {/* Badge de révision SRS */}
                {lessonDue > 0
                  ? <span className="bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {lessonDue}
                    </span>
                  : <span className="text-gray-300 text-xl">›</span>
                }
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}

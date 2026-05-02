import { useState, useRef, useEffect } from 'react'
import { assimilAudioUrl } from '../lib/supabase'
import lessonsRaw from '../data/lessons_raw.json'
import transcripts from '../data/assimil_transcripts.json'

const LESSON_KEY = 'assimil-progress'

function loadLessonProgress() {
  try { return JSON.parse(localStorage.getItem(LESSON_KEY) || '{}') }
  catch { return {} }
}

// ── Comparaison caractère par caractère (Unicode-safe) ──────
function diffText(input, expected) {
  const inp = [...input.trim()]
  const exp = [...expected.trim()]
  const len = Math.max(inp.length, exp.length)
  const result = []
  for (let i = 0; i < len; i++) {
    const ic = inp[i]
    const ec = exp[i]
    if (ic === undefined)      result.push({ type: 'missing',  expected: ec })
    else if (ec === undefined) result.push({ type: 'extra',    input: ic })
    else if (ic === ec)        result.push({ type: 'correct',  char: ic })
    else                       result.push({ type: 'wrong',    input: ic, expected: ec })
  }
  return result
}

function allCorrect(diff) {
  return diff.every(d => d.type === 'correct')
}

// ── Affichage du diff (input de l'utilisateur coloré) ───────
function DiffDisplay({ diff }) {
  return (
    <p className="text-xl font-semibold text-center leading-relaxed tracking-wide break-words">
      {diff.map((d, i) => {
        if (d.type === 'correct')
          return <span key={i} className="text-green-600">{d.char}</span>
        if (d.type === 'wrong')
          return <span key={i} className="bg-red-100 text-red-600 rounded px-0.5">{d.input}</span>
        if (d.type === 'missing')
          return <span key={i} className="bg-orange-100 text-orange-400 rounded px-0.5">_</span>
        if (d.type === 'extra')
          return <span key={i} className="bg-red-100 text-red-400 line-through rounded px-0.5">{d.input}</span>
        return null
      })}
    </p>
  )
}

// ── Lecteur audio avec contrôles ────────────────────────────
function AudioPlayer({ url, label, autoPlay = false, onEnded }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onPlay  = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnd   = () => { setPlaying(false); onEnded?.() }
    const onLoad  = () => { setLoaded(true); if (autoPlay) a.play() }
    a.addEventListener('playing',  onPlay)
    a.addEventListener('pause',    onPause)
    a.addEventListener('ended',    onEnd)
    a.addEventListener('canplay',  onLoad)
    return () => {
      a.removeEventListener('playing',  onPlay)
      a.removeEventListener('pause',    onPause)
      a.removeEventListener('ended',    onEnd)
      a.removeEventListener('canplay',  onLoad)
    }
  }, [autoPlay, onEnded])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    playing ? a.pause() : a.play()
  }

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
      <audio ref={audioRef} src={url} preload="auto" />
      <button
        onClick={toggle}
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

// ── Vue d'une leçon ─────────────────────────────────────────
// Machine d'états par phrase (sentencePhase) :
//   listening → writing → checking → revealed → translated
//                   ↑_________↑ (retry)
function LessonView({ lesson, onBack, onMark }) {
  const [phase, setPhase]                 = useState('vn')   // 'vn' | 'fr' | 'done'
  const [sIndex, setSIndex]               = useState(0)
  const [tIndex, setTIndex]               = useState(0)
  const [sentencePhase, setSentencePhase] = useState('listening')
  const [userInput, setUserInput]         = useState('')
  const [diff, setDiff]                   = useState(null)

  const { s: sCount, t: tCount, num } = lesson

  const lessonTr     = transcripts[String(num)] || {}
  const sKey         = `S${String(sIndex + 1).padStart(2, '0')}`
  const tKey         = `T${String(tIndex + 1).padStart(2, '0')}`
  const currentEntry = phase === 'vn' ? lessonTr[sKey] : lessonTr[tKey]

  const sUrl = i => assimilAudioUrl(num, `S${String(i).padStart(2, '0')}.mp3`)
  const tUrl = i => assimilAudioUrl(num, `T${String(i).padStart(2, '0')}.mp3`)

  // Réinitialise la machine d'états entre deux phrases
  const resetSentence = () => {
    setSentencePhase('listening')
    setUserInput('')
    setDiff(null)
  }

  const nextSentence = () => {
    resetSentence()
    if (sIndex + 1 < sCount) setSIndex(i => i + 1)
    else setPhase('fr')
  }

  const nextTranslation = () => {
    if (tIndex + 1 < tCount) setTIndex(i => i + 1)
    else setPhase('done')
  }

  const handleVerify = () => {
    if (!currentEntry?.vi || !userInput.trim()) return
    const d = diffText(userInput, currentEntry.vi)
    setDiff(d)
    setSentencePhase('checking')
  }

  const errCount = diff ? diff.filter(d => d.type !== 'correct').length : 0
  const isLastSentence = sIndex + 1 >= sCount
  const nextLabel = isLastSentence ? 'Phase traduction →' : 'Phrase suivante →'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">

      {/* En-tête */}
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

      {/* Barre de progression */}
      <div className="h-1.5 bg-red-100">
        <div className="h-full bg-amber-400 transition-all duration-300" style={{
          width: phase === 'done' ? '100%'
               : phase === 'vn'  ? `${(sIndex / (sCount + tCount)) * 100}%`
               : `${((sCount + tIndex) / (sCount + tCount)) * 100}%`
        }} />
      </div>

      <main className="flex-1 flex flex-col items-center px-4 py-6 gap-4">

        {/* ═══════════════════════════════════════════════════
            PHASE VN — dictée progressive phrase par phrase
            ═══════════════════════════════════════════════════ */}
        {phase === 'vn' && (
          <>
            {/* Lecteur audio — toujours visible, autoPlay seulement à l'écoute */}
            <div className="w-full max-w-sm">
              <AudioPlayer
                key={`s-${sIndex}`}
                url={sUrl(sIndex + 1)}
                label={`Phrase ${sIndex + 1} / ${sCount}`}
                autoPlay={sentencePhase === 'listening'}
              />
            </div>

            {/* ── Étape 1 : Écoute ── */}
            {sentencePhase === 'listening' && (
              <button
                onClick={() => setSentencePhase(currentEntry?.vi ? 'writing' : 'revealed')}
                className="w-full max-w-sm py-4 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
              >
                ✍️ J'ai écouté — j'écris la phrase →
              </button>
            )}

            {/* ── Étape 2 : Écriture ── */}
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

            {/* ── Étape 3 : Correction (diff coloré) ── */}
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
                    onClick={() => setSentencePhase('revealed')}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl active:scale-95"
                  >
                    👁 Voir la phrase
                  </button>
                </div>
              </>
            )}

            {/* ── Étape 4 : Transcription révélée ── */}
            {sentencePhase === 'revealed' && (
              <>
                <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                  <p className="text-lg font-semibold text-gray-800 text-center leading-snug">
                    {currentEntry?.vi ?? '—'}
                  </p>
                </div>
                <div className="flex gap-3 w-full max-w-sm">
                  {currentEntry?.fr && (
                    <button
                      onClick={() => setSentencePhase('translated')}
                      className="py-3 px-4 bg-blue-50 text-blue-600 font-semibold rounded-xl text-sm active:scale-95"
                    >
                      🇫🇷 Traduction
                    </button>
                  )}
                  <button
                    onClick={nextSentence}
                    className="flex-1 py-4 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
                  >
                    {nextLabel}
                  </button>
                </div>
              </>
            )}

            {/* ── Étape 5 : Traduction française (optionnelle) ── */}
            {sentencePhase === 'translated' && (
              <>
                <div className="w-full max-w-sm bg-white rounded-2xl border border-blue-100 shadow-sm px-5 py-4 space-y-3">
                  <p className="text-lg font-semibold text-gray-800 text-center leading-snug">
                    {currentEntry?.vi}
                  </p>
                  <div className="border-t border-blue-100 pt-3">
                    <p className="text-sm text-blue-600 text-center leading-snug">
                      {currentEntry?.fr}
                    </p>
                  </div>
                </div>
                <button
                  onClick={nextSentence}
                  className="w-full max-w-sm py-4 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
                >
                  {nextLabel}
                </button>
              </>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            PHASE FR — audio + textes affichés directement
            ═══════════════════════════════════════════════════ */}
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
            {currentEntry && (
              <div className="w-full max-w-sm bg-white rounded-2xl border border-blue-100 shadow-sm px-5 py-4 space-y-2">
                {currentEntry.vi && (
                  <p className="text-sm text-gray-500 text-center leading-snug">{currentEntry.vi}</p>
                )}
                {currentEntry.fr && (
                  <div className="border-t border-blue-100 pt-2">
                    <p className="text-base font-semibold text-blue-700 text-center leading-snug">{currentEntry.fr}</p>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={nextTranslation}
              className="w-full max-w-sm py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
            >
              {tIndex + 1 < tCount ? 'Traduction suivante →' : 'Terminer →'}
            </button>
          </>
        )}

        {phase === 'fr' && tCount === 0 && (
          <>{setPhase('done')}</>
        )}

        {/* ═══════════════════════════════════════════════════
            PHASE DONE
            ═══════════════════════════════════════════════════ */}
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

// ── Liste des leçons ────────────────────────────────────────
export default function AssimilScreen({ online, onBack }) {
  const [progress, setProgress] = useState(loadLessonProgress)
  const [selected, setSelected] = useState(null)

  const mark = (num, status) => {
    const next = { ...progress, [num]: { status, date: Date.now() } }
    setProgress(next)
    localStorage.setItem(LESSON_KEY, JSON.stringify(next))
    setSelected(null)
  }

  if (selected) {
    return <LessonView lesson={selected} onBack={() => setSelected(null)} onMark={mark} />
  }

  const done   = Object.values(progress).filter(p => p.status === 'done').length
  const review = Object.values(progress).filter(p => p.status === 'review').length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={onBack} className="text-red-200 text-xl p-1">‹</button>
        <div className="flex-1">
          <h1 className="font-bold text-base">Leçons Assimil</h1>
          <p className="text-xs text-red-200">{lessonsRaw.length} leçons · {done} terminées · {review} à revoir</p>
        </div>
        {!online && (
          <span className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded-lg">Hors-ligne</span>
        )}
      </header>

      {!online && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 text-sm text-orange-700 text-center">
          ⚠️ Les leçons Assimil nécessitent une connexion internet
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-2">
          {lessonsRaw.map(lesson => {
            const p = progress[lesson.num]
            const status = p?.status || 'new'
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
                <span className="text-gray-300 text-xl">›</span>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}

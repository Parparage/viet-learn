import { useState, useRef, useEffect } from 'react'
import { assimilAudioUrl, supabaseReady } from '../lib/supabase'
import lessonsRaw from '../data/lessons_raw.json'

const LESSON_KEY = 'assimil-progress'

function loadLessonProgress() {
  try { return JSON.parse(localStorage.getItem(LESSON_KEY) || '{}') }
  catch { return {} }
}

// ── Lecteur audio avec contrôles ───────────────────────────
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
function LessonView({ lesson, onBack, onMark }) {
  const [phase, setPhase]       = useState('vn')  // 'vn' | 'fr' | 'done'
  const [sIndex, setSIndex]     = useState(0)
  const [tIndex, setTIndex]     = useState(0)
  const [autoNext, setAutoNext] = useState(false)

  const sCount = lesson.s
  const tCount = lesson.t
  const num    = lesson.num

  const sUrl = (i) => assimilAudioUrl(num, `S${String(i).padStart(2,'0')}.mp3`)
  const tUrl = (i) => assimilAudioUrl(num, `T${String(i).padStart(2,'0')}.mp3`)

  const nextSentence = () => {
    if (sIndex + 1 < sCount) setSIndex(i => i + 1)
    else setPhase('fr')
  }

  const nextTranslation = () => {
    if (tIndex + 1 < tCount) setTIndex(i => i + 1)
    else setPhase('done')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={onBack} className="text-red-200 text-xl p-1">‹</button>
        <div>
          <h1 className="font-bold text-base">Leçon {String(num).padStart(3,'0')}</h1>
          <p className="text-xs text-red-200">
            {phase === 'vn'   && `Phrase ${sIndex + 1} / ${sCount} — Vietnamien`}
            {phase === 'fr'   && `Traduction ${tIndex + 1} / ${tCount} — Français`}
            {phase === 'done' && 'Leçon terminée'}
          </p>
        </div>
      </header>

      {/* Barre de progression */}
      <div className="h-1.5 bg-red-100">
        <div className="h-full bg-amber-400 transition-all duration-300" style={{
          width: phase === 'done' ? '100%'
               : phase === 'vn'  ? `${((sIndex) / (sCount + tCount)) * 100}%`
               : `${((sCount + tIndex) / (sCount + tCount)) * 100}%`
        }} />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-5">

        {/* Phase Vietnamien */}
        {phase === 'vn' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl">🇻🇳</div>
            <p className="text-sm font-semibold text-gray-600 text-center">Écoutez et comprenez</p>
            <div className="w-full max-w-sm">
              <AudioPlayer
                key={`s-${sIndex}`}
                url={sUrl(sIndex + 1)}
                label={`Phrase vietnamienne ${sIndex + 1}`}
                autoPlay
              />
            </div>
            <div className="flex gap-3 w-full max-w-sm">
              <button
                onClick={nextSentence}
                className="flex-1 py-4 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
              >
                {sIndex + 1 < sCount ? 'Phrase suivante →' : 'Voir les traductions →'}
              </button>
            </div>
          </>
        )}

        {/* Phase Français */}
        {phase === 'fr' && tCount > 0 && (
          <>
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">🇫🇷</div>
            <p className="text-sm font-semibold text-gray-600 text-center">Traduction de la leçon</p>
            <div className="w-full max-w-sm">
              <AudioPlayer
                key={`t-${tIndex}`}
                url={tUrl(tIndex + 1)}
                label={`Traduction ${tIndex + 1}`}
                autoPlay
              />
            </div>
            <div className="flex gap-3 w-full max-w-sm">
              <button
                onClick={nextTranslation}
                className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
              >
                {tIndex + 1 < tCount ? 'Traduction suivante →' : 'Terminer →'}
              </button>
            </div>
          </>
        )}

        {/* Phase Français sans fichiers T */}
        {phase === 'fr' && tCount === 0 && (
          <>{setPhase('done')}</>
        )}

        {/* Terminé */}
        {phase === 'done' && (
          <>
            <div className="text-6xl">✅</div>
            <h2 className="text-xl font-bold text-gray-800 text-center">Leçon {String(num).padStart(3,'0')} terminée</h2>
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
                className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-colors active:scale-95 transition-transform ${
                  !online        ? 'bg-gray-100 opacity-50 cursor-not-allowed'
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
                  {status === 'done' ? '✓' : status === 'review' ? '↺' : String(lesson.num).padStart(2,'0')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">Leçon {String(lesson.num).padStart(3,'0')}</p>
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

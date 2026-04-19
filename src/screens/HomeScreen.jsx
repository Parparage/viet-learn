import { useRef, useState } from 'react'
import { parseXlsm } from '../utils/importXlsm'
import ExercisePicker from '../components/ExercisePicker'

const THEME_COLORS = {
  'Nourriture':             'bg-orange-100 text-orange-700 border-orange-200',
  'Fruits':                 'bg-green-100 text-green-700 border-green-200',
  'Le corps':               'bg-purple-100 text-purple-700 border-purple-200',
  'Boissons':               'bg-blue-100 text-blue-700 border-blue-200',
  'Objets de cuisine':      'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Vêtements':              'bg-pink-100 text-pink-700 border-pink-200',
  'Verbes courants':        'bg-red-100 text-red-700 border-red-200',
  'Adjectifs':              'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Descripteurs personnes': 'bg-teal-100 text-teal-700 border-teal-200',
  'Quantifieurs':           'bg-gray-100 text-gray-600 border-gray-200',
  'Saveurs':                'bg-amber-100 text-amber-700 border-amber-200',
  'Connecteurs':            'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Autre':                  'bg-slate-100 text-slate-600 border-slate-200',
}

function ProgressBar({ known, total }) {
  const pct = total > 0 ? Math.round(known / total * 100) : 0
  return (
    <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
      <div className="h-full bg-current opacity-60 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function HomeScreen({ vocabulary, progress, streak, silent, onToggleSilent, onStartSession, onVocabUpdate }) {
  const fileRef = useRef(null)
  const [picker, setPicker] = useState(null) // { words, name } | null

  const themes = [...new Set(vocabulary.map(w => w.theme))]
  const globalCounts = progress.countFor(vocabulary)

  const openPicker = (words, name) => setPicker({ words, name })
  const closePicker = () => setPicker(null)
  const handleExercisePick = (exerciseType) => {
    onStartSession(picker.words, picker.name, exerciseType)
    setPicker(null)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const words = await parseXlsm(file, vocabulary)
      onVocabUpdate(words)
      alert(`✓ ${words.length} mots importés avec succès !`)
    } catch {
      alert("Erreur lors de la lecture du fichier. Vérifiez que c'est un fichier .xlsm valide.")
    }
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">

      {/* En-tête */}
      <header className="bg-red-600 text-white px-4 py-4 shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wide">VietLearn</h1>
            <p className="text-xs text-red-200 mt-0.5">Vietnamien du Nord</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode silencieux global */}
            <button
              onClick={onToggleSilent}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                silent ? 'bg-gray-700 text-white' : 'bg-red-500 text-red-100'
              }`}
              title={silent ? 'Mode silencieux activé' : 'Son activé'}
            >
              {silent ? '🔇 Silencieux' : '🔊 Son'}
            </button>
            <div className="text-right">
              <p className="text-2xl font-bold">🔥 {streak.streak}</p>
              <p className="text-xs text-red-200">{streak.sessionsThisWeek} / sem.</p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-4 text-sm">
          <span className="text-white font-semibold">{globalCounts.total} mots</span>
          <span className="text-green-300">✓ {globalCounts.known} sus</span>
          <span className="text-orange-300">🔁 {globalCounts.review} à revoir</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 overflow-y-auto">

        {/* Paquet complet */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Tout le vocabulaire</h2>
          <button
            onClick={() => openPicker(vocabulary, 'Tout le vocabulaire')}
            className="w-full bg-red-600 text-white rounded-2xl p-4 text-left shadow-md active:scale-95 transition-transform"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg">Tout le vocabulaire</p>
                <p className="text-red-200 text-sm">{vocabulary.length} mots · sessions de 20</p>
              </div>
              <span className="text-2xl">📚</span>
            </div>
            <div className="mt-2 h-1.5 bg-red-500 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${globalCounts.total > 0 ? Math.round(globalCounts.known / globalCounts.total * 100) : 0}%` }}
              />
            </div>
            <p className="text-xs text-red-200 mt-1">
              {globalCounts.total > 0 ? Math.round(globalCounts.known / globalCounts.total * 100) : 0}% maîtrisé
            </p>
          </button>
        </section>

        {/* Paquets par thème */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Par thème</h2>
          <div className="grid grid-cols-2 gap-3">
            {themes.map(theme => {
              const themeWords = vocabulary.filter(w => w.theme === theme)
              const counts = progress.countFor(themeWords)
              const color = THEME_COLORS[theme] || 'bg-gray-100 text-gray-600 border-gray-200'
              return (
                <button
                  key={theme}
                  onClick={() => openPicker(themeWords, theme)}
                  className={`${color} border rounded-2xl p-3 text-left active:scale-95 transition-transform`}
                >
                  <p className="font-bold text-sm leading-tight">{theme}</p>
                  <p className="text-xs opacity-70 mt-0.5">{themeWords.length} mots</p>
                  <ProgressBar known={counts.known} total={counts.total} />
                  <p className="text-xs opacity-60 mt-1">{counts.known}/{counts.total} sus</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Import */}
        <section className="mt-6">
          <input ref={fileRef} type="file" accept=".xlsm,.xlsx" className="hidden" onChange={handleImport} />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 text-sm font-medium active:bg-gray-100 transition-colors"
          >
            ↑ Mettre à jour le vocabulaire (.xlsm)
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            La progression existante est préservée
          </p>
        </section>

      </main>

      {/* Sélecteur d'exercice (bottom sheet) */}
      {picker && (
        <ExercisePicker
          pack={picker}
          onPick={handleExercisePick}
          onClose={closePicker}
        />
      )}
    </div>
  )
}

const EXERCISES = [
  { id: 'flashcard-vn-fr', icon: '🃏', label: 'Flashcards',       sub: 'Vietnamien → Français' },
  { id: 'flashcard-fr-vn', icon: '🔄', label: 'Flashcards',       sub: 'Français → Vietnamien' },
  { id: 'qcm',             icon: '🎧', label: 'QCM Écoute',       sub: 'Écouter et choisir' },
  { id: 'dictee',          icon: '✍️', label: 'Dictée',           sub: 'Écouter et écrire' },
  { id: 'random',          icon: '🎲', label: 'Mode aléatoire',   sub: 'Tous les exercices' },
  { id: 'random-silent',   icon: '🔇', label: 'Aléatoire silencieux', sub: 'Sans audio (transports)' },
]

export default function ExercisePicker({ pack, onPick, onClose }) {
  if (!pack) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl shadow-2xl p-5 max-w-lg mx-auto w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <h2 className="text-base font-bold text-gray-800 mb-1">{pack.name}</h2>
        <p className="text-xs text-gray-400 mb-4">{pack.words.length} mots · Choisissez un exercice</p>

        <div className="flex flex-col gap-2">
          {EXERCISES.map(ex => (
            <button
              key={ex.id}
              onClick={() => onPick(ex.id)}
              className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <span className="text-2xl w-9 text-center">{ex.icon}</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{ex.label}</p>
                <p className="text-xs text-gray-400">{ex.sub}</p>
              </div>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="w-full mt-4 py-3 text-sm text-gray-400 active:text-gray-600">
          Annuler
        </button>
      </div>
    </div>
  )
}

export default function Flashcard({ word, isFlipped, onFlip, onSpeak }) {
  return (
    <div className="card-scene w-full h-56 cursor-pointer select-none" onClick={onFlip}>
      <div className={`card-inner w-full h-full ${isFlipped ? 'flipped' : ''}`}>

        {/* Recto — Vietnamien */}
        <div className="card-face rounded-2xl bg-white shadow-lg border border-gray-100 flex flex-col items-center justify-center p-6 gap-3">
          <span className="text-xs font-semibold text-red-400 uppercase tracking-widest">
            Vietnamien
          </span>
          <p className="text-4xl font-bold text-gray-800 text-center leading-tight">
            {word.viet}
          </p>
          <button
            onClick={e => { e.stopPropagation(); onSpeak() }}
            className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-lg active:bg-red-100 transition-colors"
            aria-label="Écouter la prononciation"
          >
            🔊
          </button>
        </div>

        {/* Verso — Français */}
        <div className="card-face card-back rounded-2xl bg-red-600 shadow-lg flex flex-col items-center justify-center p-6 gap-3">
          <span className="text-xs font-semibold text-red-200 uppercase tracking-widest">
            Français
          </span>
          <p className="text-4xl font-bold text-white text-center leading-tight">
            {word.fr}
          </p>
          <p className="text-sm text-red-200 font-medium">{word.viet}</p>
        </div>

      </div>
    </div>
  )
}

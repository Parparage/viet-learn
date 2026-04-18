export default function Flashcard({ word, isFlipped, onFlip, onSpeak, reverse = false }) {
  const front = reverse
    ? { label: 'Français', text: word.fr, lang: null }
    : { label: 'Vietnamien', text: word.viet, lang: 'vi' }

  const back = reverse
    ? { label: 'Vietnamien', text: word.viet, sub: null }
    : { label: 'Français', text: word.fr, sub: word.viet }

  return (
    <div className="card-scene w-full h-56 cursor-pointer select-none" onClick={onFlip}>
      <div className={`card-inner w-full h-full ${isFlipped ? 'flipped' : ''}`}>

        {/* Recto */}
        <div className="card-face rounded-2xl bg-white shadow-lg border border-gray-100 flex flex-col items-center justify-center p-6 gap-3">
          <span className="text-xs font-semibold text-red-400 uppercase tracking-widest">
            {front.label}
          </span>
          <p className="text-4xl font-bold text-gray-800 text-center leading-tight">
            {front.text}
          </p>
          {front.lang && (
            <button
              onClick={e => { e.stopPropagation(); onSpeak() }}
              className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-lg active:bg-red-100 transition-colors"
              aria-label="Écouter"
            >
              🔊
            </button>
          )}
        </div>

        {/* Verso */}
        <div className="card-face card-back rounded-2xl bg-red-600 shadow-lg flex flex-col items-center justify-center p-6 gap-2">
          <span className="text-xs font-semibold text-red-200 uppercase tracking-widest">
            {back.label}
          </span>
          <p className="text-4xl font-bold text-white text-center leading-tight">
            {back.text}
          </p>
          {back.sub && <p className="text-sm text-red-200 font-medium">{back.sub}</p>}
          {reverse && (
            <button
              onClick={e => { e.stopPropagation(); onSpeak() }}
              className="mt-1 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-lg active:bg-red-400 transition-colors"
              aria-label="Écouter"
            >
              🔊
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

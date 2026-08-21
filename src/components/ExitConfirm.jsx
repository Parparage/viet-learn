/**
 * ExitConfirm — confirmation avant de quitter l'application.
 *
 * Sur Android, le bouton « retour » ferme la PWA d'un coup lorsqu'il n'y a plus
 * d'historique. Ce garde-fou intercepte ce geste (voir hooks/useExitGuard).
 */
export default function ExitConfirm({ onCancel, onQuit }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-4xl text-center">👋</p>
        <h2 className="text-lg font-bold text-gray-800 text-center mt-3">
          Quitter VietLearn ?
        </h2>
        <p className="text-sm text-gray-500 text-center mt-1.5 leading-relaxed">
          Votre progression est enregistrée automatiquement.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            autoFocus
            className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-700 font-semibold active:scale-95 transition-transform"
          >
            Annuler
          </button>
          <button
            onClick={onQuit}
            className="flex-1 py-3.5 rounded-xl bg-red-600 text-white font-bold active:scale-95 transition-transform"
          >
            Quitter
          </button>
        </div>
      </div>
    </div>
  )
}

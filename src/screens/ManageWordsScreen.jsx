/**
 * ManageWordsScreen — ajout, modification et suppression des mots personnels.
 *
 * Les mots créés ici sont marqués `source: 'app'` et fusionnent avec le
 * vocabulaire Excel : ils apparaissent donc dans « Mon vocabulaire — par thème »
 * et partagent la même progression. Ils survivent aux réimports .xlsm
 * (voir la fusion dans utils/importXlsm.js).
 *
 * Seuls les mots ajoutés ici sont modifiables : un mot venant de l'Excel doit
 * être corrigé dans le fichier source, sinon la correction serait perdue au
 * prochain import.
 */
import { useState, useMemo } from 'react'
import { nextAppId, themesOf, findDuplicate, isAppWord } from '../utils/vocabStore'

const NEW_THEME = '__new__'

export default function ManageWordsScreen({ vocabulary, onVocabUpdate, onBack }) {
  const themes  = useMemo(() => themesOf(vocabulary), [vocabulary])
  const myWords = useMemo(
    () => vocabulary.filter(isAppWord).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)),
    [vocabulary]
  )

  // Si aucun thème n'existe encore, on ouvre directement la saisie d'un nouveau thème.
  const [viet,      setViet]      = useState('')
  const [fr,        setFr]        = useState('')
  const [theme,     setTheme]     = useState(() => themes[0] ?? NEW_THEME)
  const [newTheme,  setNewTheme]  = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error,     setError]     = useState('')
  const [flash,     setFlash]     = useState('')

  const isCreatingTheme = theme === NEW_THEME

  const resetForm = () => {
    setViet(''); setFr(''); setNewTheme(''); setEditingId(null); setError('')
  }

  const notify = (msg) => {
    setFlash(msg)
    setTimeout(() => setFlash(''), 2500)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const v = viet.trim()
    const f = fr.trim()
    const t = (isCreatingTheme ? newTheme : theme).trim()

    if (!v)  return setError('Le mot vietnamien est obligatoire.')
    if (!f)  return setError('La traduction française est obligatoire.')
    if (!t)  return setError('Choisissez un thème ou créez-en un nouveau.')

    const clash = findDuplicate(vocabulary, v, editingId)
    if (clash) {
      return setError(
        `« ${clash.viet} » existe déjà dans le thème « ${clash.theme || 'sans thème'} ».`
      )
    }

    if (editingId !== null) {
      onVocabUpdate(
        vocabulary.map(w =>
          w.id === editingId ? { ...w, theme: t, viet: v, fr: f } : w
        )
      )
      notify('Mot modifié.')
    } else {
      onVocabUpdate([
        ...vocabulary,
        { id: nextAppId(vocabulary), theme: t, viet: v, fr: f, source: 'app', addedAt: Date.now() },
      ])
      notify('Mot ajouté — il est déjà révisable dans son thème.')
    }

    // On reste sur le thème courant pour enchaîner les saisies.
    setTheme(t)
    setViet(''); setFr(''); setNewTheme(''); setEditingId(null); setError('')
  }

  const handleEdit = (word) => {
    setEditingId(word.id)
    setViet(word.viet)
    setFr(word.fr)
    setTheme(word.theme)
    setNewTheme('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (word) => {
    if (!window.confirm(`Supprimer « ${word.viet} » ? La progression associée sera perdue.`)) return
    onVocabUpdate(vocabulary.filter(w => w.id !== word.id))
    if (editingId === word.id) resetForm()
    notify('Mot supprimé.')
  }

  /** Sauvegarde JSON — utile aussi pour générer les vrais MP3 côté script Python. */
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(myWords, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `mes-mots-viet-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Regroupement par thème pour l'affichage de la liste
  const byTheme = useMemo(() => {
    const map = new Map()
    for (const w of myWords) {
      if (!map.has(w.theme)) map.set(w.theme, [])
      map.get(w.theme).push(w)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'))
  }, [myWords])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">

      <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={onBack} className="text-red-200 active:text-white text-xl p-1">‹</button>
        <div className="flex-1">
          <h1 className="font-bold text-base">Mes mots</h1>
          <p className="text-xs text-red-200">
            {myWords.length} mot{myWords.length > 1 ? 's' : ''} ajouté{myWords.length > 1 ? 's' : ''}
            {' · '}{byTheme.length} thème{byTheme.length > 1 ? 's' : ''}
          </p>
        </div>
        {myWords.length > 0 && (
          <button
            onClick={handleExport}
            className="text-xs bg-red-500 text-red-100 px-3 py-1.5 rounded-lg font-semibold active:bg-red-400"
            title="Sauvegarder mes mots dans un fichier JSON"
          >
            ↓ Export
          </button>
        )}
      </header>

      <main className="flex-1 px-4 py-5 overflow-y-auto">

        {/* ── Formulaire ───────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {editingId !== null ? 'Modifier le mot' : 'Nouveau mot'}
          </p>

          <div>
            <label className="text-xs font-semibold text-gray-500">Vietnamien</label>
            <input
              value={viet}
              onChange={e => setViet(e.target.value)}
              placeholder="ví dụ : trời mưa"
              className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-lg"
              autoComplete="off" autoCorrect="off" spellCheck={false}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Français</label>
            <input
              value={fr}
              onChange={e => setFr(e.target.value)}
              placeholder="ex. : il pleut"
              className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Thème</label>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none bg-white"
            >
              {themes.map(t => <option key={t} value={t}>{t}</option>)}
              <option value={NEW_THEME}>＋ Créer un nouveau thème…</option>
            </select>
          </div>

          {isCreatingTheme && (
            <input
              value={newTheme}
              onChange={e => setNewTheme(e.target.value)}
              placeholder="Nom du nouveau thème (ex. : Météo)"
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-red-300 focus:border-red-400 outline-none"
              autoComplete="off"
              autoFocus
            />
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm active:scale-95 transition-transform"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm active:scale-95 transition-transform"
            >
              {editingId !== null ? '✓ Enregistrer' : '＋ Ajouter'}
            </button>
          </div>
        </form>

        {flash && (
          <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center">
            {flash}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          Les mots ajoutés rejoignent « Mon vocabulaire — par thème » sur l'accueil et sont
          révisables immédiatement. Ils sont conservés lors d'un futur import Excel.
          Leur prononciation utilise la synthèse vocale du navigateur, moins fidèle sur les
          tons que les audios générés — exportez-les pour produire de vrais MP3.
        </p>

        {/* ── Liste des mots ajoutés ────────────────────────────── */}
        {byTheme.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Mots que j'ai ajoutés
            </h2>
            <div className="space-y-4">
              {byTheme.map(([themeName, words]) => (
                <div key={themeName}>
                  <p className="text-sm font-bold text-gray-600 mb-2">
                    {themeName} <span className="font-normal text-gray-400">· {words.length}</span>
                  </p>
                  <div className="space-y-2">
                    {words.map(w => (
                      <div
                        key={w.id}
                        className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-3 ${
                          editingId === w.id ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{w.viet}</p>
                          <p className="text-xs text-gray-400 truncate">{w.fr}</p>
                        </div>
                        <button
                          onClick={() => handleEdit(w)}
                          className="w-9 h-9 rounded-lg bg-gray-50 text-gray-500 active:bg-gray-100 flex items-center justify-center"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(w)}
                          className="w-9 h-9 rounded-lg bg-red-50 text-red-500 active:bg-red-100 flex items-center justify-center"
                          title="Supprimer"
                        >
                          🗑
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {myWords.length === 0 && (
          <div className="mt-8 text-center text-gray-400">
            <p className="text-4xl mb-2">✏️</p>
            <p className="text-sm">Aucun mot ajouté pour l'instant.</p>
          </div>
        )}
      </main>
    </div>
  )
}

/**
 * ManageWordsScreen — gestion du vocabulaire personnel.
 *
 * Navigation : menu (3 actions) → ajouter | modifier | supprimer
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

/* ─── En-tête commun ────────────────────────────────────────── */
function Header({ title, subtitle, onBack, action }) {
  return (
    <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
      <button onClick={onBack} className="text-red-200 active:text-white text-xl p-1">‹</button>
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-base truncate">{title}</h1>
        {subtitle && <p className="text-xs text-red-200 truncate">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

/* ─── Formulaire partagé (ajout et modification) ─────────────── */
function WordForm({ vocabulary, word, onSave }) {
  const themes = useMemo(() => themesOf(vocabulary), [vocabulary])

  const [viet,     setViet]     = useState(word?.viet ?? '')
  const [fr,       setFr]       = useState(word?.fr ?? '')
  const [theme,    setTheme]    = useState(word?.theme ?? themes[0] ?? NEW_THEME)
  const [newTheme, setNewTheme] = useState('')
  const [error,    setError]    = useState('')

  const isCreatingTheme = theme === NEW_THEME
  const isEditing = Boolean(word)

  const submit = (e) => {
    e.preventDefault()
    const v = viet.trim()
    const f = fr.trim()
    const t = (isCreatingTheme ? newTheme : theme).trim()

    if (!v) return setError('Le mot vietnamien est obligatoire.')
    if (!f) return setError('La traduction française est obligatoire.')
    if (!t) return setError('Choisissez un thème ou créez-en un nouveau.')

    const clash = findDuplicate(vocabulary, v, word?.id ?? null)
    if (clash) {
      return setError(`« ${clash.viet} » existe déjà dans le thème « ${clash.theme || 'sans thème'} ».`)
    }

    onSave({ viet: v, fr: f, theme: t })
    setError('')

    // En ajout, on vide les champs pour enchaîner les saisies (le thème reste).
    if (!isEditing) {
      setViet(''); setFr(''); setNewTheme(''); setTheme(t)
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-500">Vietnamien</label>
        <input
          value={viet}
          onChange={e => setViet(e.target.value)}
          placeholder="ví dụ : trời mưa"
          className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-lg"
          autoComplete="off" autoCorrect="off" spellCheck={false}
          autoFocus={!isEditing}
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

      <button
        type="submit"
        className="w-full py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm active:scale-95 transition-transform"
      >
        {isEditing ? '✓ Enregistrer les modifications' : '＋ Ajouter'}
      </button>
    </form>
  )
}

/* ─── Liste des mots, groupés par thème ─────────────────────── */
function WordList({ words, mode, onPick }) {
  const byTheme = useMemo(() => {
    const map = new Map()
    for (const w of words) {
      if (!map.has(w.theme)) map.set(w.theme, [])
      map.get(w.theme).push(w)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'))
  }, [words])

  return (
    <div className="space-y-4">
      {byTheme.map(([themeName, list]) => (
        <div key={themeName}>
          <p className="text-sm font-bold text-gray-600 mb-2">
            {themeName} <span className="font-normal text-gray-400">· {list.length}</span>
          </p>
          <div className="space-y-2">
            {list.map(w => (
              <div
                key={w.id}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{w.viet}</p>
                  <p className="text-xs text-gray-400 truncate">{w.fr}</p>
                </div>
                <button
                  onClick={() => onPick(w)}
                  className={`px-3 h-9 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${
                    mode === 'delete'
                      ? 'bg-red-50 text-red-600 active:bg-red-100'
                      : 'bg-amber-50 text-amber-700 active:bg-amber-100'
                  }`}
                >
                  {mode === 'delete' ? '🗑' : '✏️'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Écran principal ───────────────────────────────────────── */
export default function ManageWordsScreen({ vocabulary, onVocabUpdate, onBack }) {
  const [view,        setView]        = useState('menu')  // menu | add | edit | delete
  const [editingWord, setEditingWord] = useState(null)
  const [flash,       setFlash]       = useState('')

  const myWords = useMemo(
    () => vocabulary.filter(isAppWord).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)),
    [vocabulary]
  )
  const themeCount = useMemo(() => new Set(myWords.map(w => w.theme)).size, [myWords])
  const isEmpty = myWords.length === 0

  const notify = (msg) => {
    setFlash(msg)
    setTimeout(() => setFlash(''), 2500)
  }

  const handleAdd = ({ viet, fr, theme }) => {
    onVocabUpdate([
      ...vocabulary,
      { id: nextAppId(vocabulary), theme, viet, fr, source: 'app', addedAt: Date.now() },
    ])
    notify('Mot ajouté — il est déjà révisable dans son thème.')
  }

  const handleEdit = ({ viet, fr, theme }) => {
    onVocabUpdate(
      vocabulary.map(w => (w.id === editingWord.id ? { ...w, viet, fr, theme } : w))
    )
    setEditingWord(null)
    setView('edit')
    notify('Mot modifié.')
  }

  const handleDelete = (word) => {
    if (!window.confirm(`Supprimer « ${word.viet} » ? La progression associée sera perdue.`)) return
    onVocabUpdate(vocabulary.filter(w => w.id !== word.id))
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

  // Élément (et non composant local) : un composant redéclaré à chaque rendu
  // serait démonté puis remonté par React à chaque frappe.
  const flashEl = flash ? (
    <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center">
      {flash}
    </p>
  ) : null

  /* ── Vue : ajouter ── */
  if (view === 'add') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
        <Header title="Ajouter un mot" subtitle="Le thème peut être créé à la volée" onBack={() => setView('menu')} />
        <main className="flex-1 px-4 py-5 overflow-y-auto">
          <WordForm vocabulary={vocabulary} onSave={handleAdd} />
          {flashEl}
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Le mot rejoint « Mon vocabulaire — par thème » sur l'accueil et est révisable
            immédiatement. Il est conservé lors d'un futur import Excel. Sa prononciation
            utilise la synthèse vocale du navigateur, moins fidèle sur les tons que les
            audios générés — exportez vos mots pour produire de vrais MP3.
          </p>
        </main>
      </div>
    )
  }

  /* ── Vue : modifier (choix du mot) ── */
  if (view === 'edit' && !editingWord) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
        <Header title="Modifier un mot" subtitle="Choisissez le mot à corriger" onBack={() => setView('menu')} />
        <main className="flex-1 px-4 py-5 overflow-y-auto">
          <WordList words={myWords} mode="edit" onPick={setEditingWord} />
          {flashEl}
        </main>
      </div>
    )
  }

  /* ── Vue : modifier (formulaire) ── */
  if (view === 'edit' && editingWord) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
        <Header
          title={editingWord.viet}
          subtitle="Modification"
          onBack={() => setEditingWord(null)}
        />
        <main className="flex-1 px-4 py-5 overflow-y-auto">
          {/* key : réinitialise le formulaire quand on change de mot */}
          <WordForm key={editingWord.id} vocabulary={vocabulary} word={editingWord} onSave={handleEdit} />
          <button
            onClick={() => setEditingWord(null)}
            className="w-full mt-3 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm active:scale-95 transition-transform"
          >
            Annuler
          </button>
        </main>
      </div>
    )
  }

  /* ── Vue : supprimer ── */
  if (view === 'delete') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
        <Header title="Supprimer un mot" subtitle="Une confirmation sera demandée" onBack={() => setView('menu')} />
        <main className="flex-1 px-4 py-5 overflow-y-auto">
          {isEmpty
            ? <p className="text-center text-gray-400 text-sm mt-8">Il n'y a plus aucun mot à supprimer.</p>
            : <WordList words={myWords} mode="delete" onPick={handleDelete} />
          }
          {flashEl}
        </main>
      </div>
    )
  }

  /* ── Vue : menu ── */
  const actions = [
    {
      key: 'add', emoji: '➕', label: 'Ajouter un mot',
      desc: 'Nouveau mot, nouveau thème possible',
      color: 'bg-green-100 text-green-700 border-green-200',
      disabled: false,
    },
    {
      key: 'edit', emoji: '✏️', label: 'Modifier un mot',
      desc: isEmpty ? 'Aucun mot à modifier' : 'Corriger l’orthographe, les tons ou le thème',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      disabled: isEmpty,
    },
    {
      key: 'delete', emoji: '🗑', label: 'Supprimer un mot',
      desc: isEmpty ? 'Aucun mot à supprimer' : 'Retirer définitivement un mot',
      color: 'bg-red-100 text-red-700 border-red-200',
      disabled: isEmpty,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <Header
        title="Mes mots"
        subtitle={`${myWords.length} mot${myWords.length > 1 ? 's' : ''} ajouté${myWords.length > 1 ? 's' : ''} · ${themeCount} thème${themeCount > 1 ? 's' : ''}`}
        onBack={onBack}
        action={!isEmpty && (
          <button
            onClick={handleExport}
            className="text-xs bg-red-500 text-red-100 px-3 py-1.5 rounded-lg font-semibold active:bg-red-400"
            title="Sauvegarder mes mots dans un fichier JSON"
          >
            ↓ Export
          </button>
        )}
      />

      <main className="flex-1 px-4 py-5 overflow-y-auto">
        <div className="space-y-3">
          {actions.map(a => (
            <button
              key={a.key}
              onClick={() => !a.disabled && setView(a.key)}
              disabled={a.disabled}
              className={`w-full ${a.color} border rounded-2xl p-4 text-left flex items-center gap-4 transition-transform ${
                a.disabled ? 'opacity-40' : 'active:scale-95'
              }`}
            >
              <span className="text-3xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold">{a.label}</p>
                <p className="text-xs opacity-70">{a.desc}</p>
              </div>
              {!a.disabled && <span className="opacity-40 text-xl">›</span>}
            </button>
          ))}
        </div>

        {flashEl}

        {isEmpty && (
          <div className="mt-8 text-center text-gray-400">
            <p className="text-4xl mb-2">✏️</p>
            <p className="text-sm">Aucun mot ajouté pour l'instant.</p>
            <p className="text-xs mt-1">Commencez par « Ajouter un mot ».</p>
          </div>
        )}
      </main>
    </div>
  )
}

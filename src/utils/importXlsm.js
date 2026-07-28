import { normalizeViet, isAppWord, loadDeleted, APP_ID_BASE } from './vocabStore'

/**
 * Lit un fichier .xlsm/.xlsx et retourne la liste de mots fusionnée.
 *
 * Principe : **ce qui a été fait dans l'application fait foi.** Le fichier Excel
 * apporte les mots, mais ne réécrit jamais par-dessus une action de l'utilisateur.
 *
 * Concrètement, une ligne du fichier est ignorée si le mot a été :
 *   - supprimé dans l'application  (pierre tombale, voir vocabStore)
 *   - corrigé dans l'application   (la version corrigée le remplace)
 *   - renommé dans l'application   (l'ancienne graphie ne revient pas)
 * Sinon la ligne est importée, en conservant l'ID audio si le mot est déjà connu.
 *
 * Ainsi, ni la progression, ni les corrections, ni les fichiers audio ne sont
 * cassés par un réimport.
 */
export async function parseXlsm(file, existingVocab = []) {
  const XLSX = await import('xlsx') // chargement différé — réduit le bundle principal
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  // Mots pris en main par l'utilisateur (créés ou corrigés dans l'application).
  const ownedWords = existingVocab.filter(isAppWord)

  const existingMap = new Map(existingVocab.map(w => [normalizeViet(w.viet), w.id]))

  // Les ID < APP_ID_BASE sont ceux du fichier Excel — y compris pour un mot
  // importé puis corrigé dans l'app, qui garde son ID (et donc son audio).
  const maxId = existingVocab
    .filter(w => w.id < APP_ID_BASE)
    .reduce((max, w) => Math.max(max, w.id), 0)
  let nextId = maxId + 1

  const deleted  = new Set(loadDeleted())
  const owned    = new Set(ownedWords.map(w => normalizeViet(w.viet)))
  // Graphie d'origine d'un mot importé puis corrigé : la ligne Excel correspondante
  // ne doit pas ressusciter à côté de la version corrigée.
  const replaced = new Set(
    ownedWords.filter(w => w.origViet).map(w => normalizeViet(w.origViet))
  )

  const words = []
  for (let i = 1; i < rows.length; i++) {
    const [theme, viet, fr] = rows[i]
    const v = String(viet || '').trim()
    const f = String(fr || '').trim()
    if (!v) continue

    const key = normalizeViet(v)
    if (deleted.has(key) || owned.has(key) || replaced.has(key)) continue

    words.push({
      id:     existingMap.get(key) ?? nextId++,  // conserve l'ID audio si déjà connu
      theme:  String(theme || '').trim(),
      viet:   v,
      fr:     f,
      source: 'xlsm',
    })
  }

  return [...words, ...ownedWords]
}

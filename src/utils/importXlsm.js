import { normalizeViet, isAppWord } from './vocabStore'

/**
 * Lit un fichier .xlsm/.xlsx et retourne la liste de mots fusionnée.
 *
 * - Les mots déjà importés (même texte vietnamien) conservent leur ID audio existant.
 * - Les nouveaux mots du fichier reçoivent un ID séquentiel après le dernier ID importé.
 * - Les mots ajoutés depuis l'application (source 'app') sont RÉINJECTÉS : un réimport
 *   Excel ne les efface donc jamais. Seule exception : si le fichier Excel contient
 *   désormais ce mot, c'est lui qui fait foi et le doublon ajouté à la main disparaît.
 *
 * Ainsi, ni la progression ni les fichiers audio ne sont cassés par un réimport.
 */
export async function parseXlsm(file, existingVocab = []) {
  const XLSX = await import('xlsx') // chargement différé — réduit le bundle principal
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  // On ne réutilise les ID que des mots issus d'imports précédents : les mots
  // ajoutés dans l'app vivent dans leur propre plage (≥ APP_ID_BASE).
  const importedVocab = existingVocab.filter(w => !isAppWord(w))
  const existingMap = new Map(
    importedVocab.map(w => [normalizeViet(w.viet), w.id])
  )
  const maxId = importedVocab.reduce((max, w) => Math.max(max, w.id), 0)
  let nextId = maxId + 1

  const words = []
  const inFile = new Set()
  for (let i = 1; i < rows.length; i++) {
    const [theme, viet, fr] = rows[i]
    const v = String(viet || '').trim()
    const f = String(fr || '').trim()
    if (!v) continue

    const key = normalizeViet(v)
    const existingId = existingMap.get(key)

    words.push({
      id:     existingId ?? nextId++,  // conserve l'ID audio si le mot existe déjà
      theme:  String(theme || '').trim(),
      viet:   v,
      fr:     f,
      source: 'xlsm',
    })
    inFile.add(key)
  }

  // Fusion : on conserve les mots ajoutés dans l'application que le fichier ne contient pas.
  const keptAppWords = existingVocab.filter(
    w => isAppWord(w) && !inFile.has(normalizeViet(w.viet))
  )

  return [...words, ...keptAppWords]
}

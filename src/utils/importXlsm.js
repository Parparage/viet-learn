/**
 * Lit un fichier .xlsm/.xlsx et retourne la liste de mots.
 * - Les mots déjà connus (même texte vietnamien) conservent leur ID audio existant.
 * - Les nouveaux mots reçoivent un ID séquentiel après le dernier ID existant.
 * Ainsi, ajouter des mots ne casse jamais la progression ni les fichiers audio.
 */
export async function parseXlsm(file, existingVocab = []) {
  const XLSX = await import('xlsx') // chargement différé — réduit le bundle principal
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  // Index des mots existants par texte vietnamien normalisé → id audio
  const existingMap = new Map(
    existingVocab.map(w => [w.viet.trim().toLowerCase(), w.id])
  )
  const maxId = existingVocab.reduce((max, w) => Math.max(max, w.id), 0)
  let nextId = maxId + 1

  const words = []
  for (let i = 1; i < rows.length; i++) {
    const [theme, viet, fr] = rows[i]
    const v = String(viet || '').trim()
    const f = String(fr || '').trim()
    if (!v) continue

    const key = v.toLowerCase()
    const existingId = existingMap.get(key)

    words.push({
      id:    existingId ?? nextId++,  // conserve l'ID audio si le mot existe déjà
      theme: String(theme || '').trim(),
      viet:  v,
      fr:    f,
    })
  }
  return words
}

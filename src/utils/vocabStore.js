/**
 * vocabStore — persistance et règles du vocabulaire personnel.
 *
 * Un mot a la forme : { id, theme, viet, fr, source?, addedAt? }
 *   - source 'app'  : ajouté depuis l'application (écran « Mes mots »)
 *   - source 'xlsm' : issu d'un import Excel (valeur par défaut si absente,
 *                     pour rester compatible avec les données déjà stockées)
 *
 * Plages d'ID (l'ID pilote le fichier audio public/audio/{id}.mp3) :
 *   1 – 999    mots du fichier Excel
 *   1001 – 1242 paquets intégrés de l'application (src/data/packs)
 *   5000 +     mots ajoutés depuis l'application  ← APP_ID_BASE
 * Ce cloisonnement garantit qu'un mot ajouté ne jouera jamais l'audio d'un autre.
 */

export const VOCAB_KEY   = 'viet-vocab'
export const APP_ID_BASE = 5000

/** Clé de comparaison d'un mot vietnamien (insensible à la casse et aux espaces). */
export function normalizeViet(viet) {
  return String(viet || '').trim().toLowerCase()
}

/** Vrai si le mot a été ajouté depuis l'application. */
export function isAppWord(word) {
  return word.source === 'app'
}

export function loadVocab(defaultVocab) {
  try {
    const saved = localStorage.getItem(VOCAB_KEY)
    return saved ? JSON.parse(saved) : defaultVocab
  } catch {
    return defaultVocab
  }
}

export function saveVocab(words) {
  localStorage.setItem(VOCAB_KEY, JSON.stringify(words))
}

/**
 * Prochain ID libre pour un mot ajouté dans l'application.
 * Toujours ≥ APP_ID_BASE : aucune collision possible avec l'Excel ni les paquets.
 */
export function nextAppId(vocabulary) {
  const maxAppId = vocabulary
    .filter(isAppWord)
    .reduce((max, w) => Math.max(max, w.id), APP_ID_BASE - 1)
  return maxAppId + 1
}

/**
 * Thèmes proposés dans la liste déroulante : ceux du vocabulaire Excel
 * et ceux créés par l'utilisateur. Les paquets intégrés de l'application
 * (Famille, Le corps humain…) en sont volontairement exclus — ils vivent
 * dans leur propre espace et ne doivent pas être alimentés à la main.
 */
export function themesOf(vocabulary) {
  return [...new Set(vocabulary.map(w => w.theme).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr'))
}

/**
 * Cherche un mot déjà présent avec le même texte vietnamien.
 * `excludeId` permet d'ignorer le mot en cours de modification.
 * Retourne le mot trouvé, ou undefined.
 */
export function findDuplicate(vocabulary, viet, excludeId = null) {
  const key = normalizeViet(viet)
  return vocabulary.find(w => normalizeViet(w.viet) === key && w.id !== excludeId)
}

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
export const DELETED_KEY = 'viet-vocab-deleted'
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

/* ── Mots supprimés volontairement (« pierres tombales ») ──────────────
 * Sans cette liste, un mot supprimé dans l'application réapparaîtrait au
 * prochain import du fichier Excel, qui le contient toujours.
 * Ajouter à nouveau le même mot lève automatiquement sa pierre tombale.
 */
export function loadDeleted() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]') }
  catch { return [] }
}

export function markDeleted(viet) {
  const key = normalizeViet(viet)
  const next = [...new Set([...loadDeleted(), key])]
  localStorage.setItem(DELETED_KEY, JSON.stringify(next))
}

export function unmarkDeleted(viet) {
  const key = normalizeViet(viet)
  localStorage.setItem(DELETED_KEY, JSON.stringify(loadDeleted().filter(k => k !== key)))
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
 *
 * La recherche est limitée au thème lorsqu'il est fourni : une même orthographe
 * peut légitimement exister dans plusieurs thèmes avec des sens différents
 * (« cao » = grand en Adjectifs, mais autre chose ailleurs). Seul un doublon
 * à l'intérieur d'un même thème est une vraie erreur de saisie.
 *
 * `excludeId` permet d'ignorer le mot en cours de modification.
 * Retourne le mot trouvé, ou undefined.
 */
export function findDuplicate(vocabulary, viet, excludeId = null, theme = null) {
  const key = normalizeViet(viet)
  return vocabulary.find(w =>
    normalizeViet(w.viet) === key &&
    w.id !== excludeId &&
    (theme === null || w.theme === theme)
  )
}

/**
 * Clé de recherche : minuscules, sans accents ni tons, « đ » ramené à « d ».
 *
 * Permet de retrouver « cơm » en tapant « com », ou « Đường » en tapant
 * « duong » — indispensable depuis un clavier français, où saisir les
 * diacritiques vietnamiens est laborieux.
 */
export function searchKey(text) {
  return String(text || '')
    .normalize('NFD')                 // sépare les lettres de leurs diacritiques
    .replace(/[\u0300-\u036f]/g, '')  // supprime accents et marques de ton
    .toLowerCase()
    .replace(/đ/g, 'd')               // « đ » est une lettre à part, non décomposable
    .trim()
}

/** Vrai si le caractère fait partie d'un mot (après normalisation : a-z et 0-9). */
function isWordChar(c) {
  return (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')
}

/**
 * Vrai si `text` contient la recherche **en début d'un de ses mots**.
 *
 * Taper « no » trouve « Nouilles » et « Noix de coco », mais plus
 * « Un peu (indénombrable) », où « no » était noyé au milieu du mot.
 * Une saisie de plusieurs mots reste possible : « noix de » trouve
 * « Noix de coco ».
 *
 * `q` doit déjà être passé par searchKey(). Comparé à une expression
 * régulière, ce parcours évite d'avoir à échapper la saisie de l'utilisateur.
 */
export function matchesSearch(q, text) {
  const key = searchKey(text)
  let i = key.indexOf(q)
  while (i !== -1) {
    // Début de chaîne, ou précédé d'un séparateur (espace, parenthèse, tiret…)
    if (i === 0 || !isWordChar(key[i - 1])) return true
    i = key.indexOf(q, i + 1)
  }
  return false
}

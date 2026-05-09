/**
 * Banque de phrases pour l'exercice d'expression orale.
 *
 * 6 niveaux de difficulté progressive calibrés pour un francophone :
 *   1 — Découverte : sons proches du français, tons simples
 *   2 — Intermédiaire : voyelles ư/ơ/â, consonnes aspirées kh/th
 *   3 — Avancé : nh vs ng, tr vs ch, tons hỏi vs ngã
 *   4 — Expert : diphtongues ươ/ưa/uê, finales non relâchées -c/-t/-p/-ch
 *   5 — Extrême : ng- initial + ư + ton nặng (le piège "ngựa")
 *   6 — Maître : virelangues, combinaisons maximales, enchaînements tonaux
 *
 * Chaque phrase : { id, vi, fr }
 * id = "L{niveau}-{index}" ex: "L3-07"
 */

export const PRONUNCIATION_LEVELS = [
  // ── Niveau 1 — Découverte ──────────────────────────────────────────
  {
    level: 1,
    name: 'Découverte',
    description: 'Sons familiers, tons simples',
    focus: [
      'Consonnes proches du français (b, d, l, m, n, t, v)',
      'Voyelles simples (a, e, ê, i, o, ô, u)',
      'Tons ngang (plat) et huyền (descendant)',
    ],
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    emoji: '🌱',
    phrases: [
      { id: 'L1-01', vi: 'Tôi là sinh viên.',           fr: 'Je suis étudiant(e).' },
      { id: 'L1-02', vi: 'Hôm nay trời đẹp lắm.',      fr: 'Il fait très beau aujourd\'hui.' },
      { id: 'L1-03', vi: 'Tôi ăn cơm mỗi ngày.',       fr: 'Je mange du riz tous les jours.' },
      { id: 'L1-04', vi: 'Anh ấy là bạn tôi.',          fr: 'Il est mon ami.' },
      { id: 'L1-05', vi: 'Tôi thích ăn phở.',           fr: 'J\'aime manger du phở.' },
      { id: 'L1-06', vi: 'Con mèo nằm trên bàn.',       fr: 'Le chat est allongé sur la table.' },
      { id: 'L1-07', vi: 'Tôi có hai anh em.',           fr: 'J\'ai deux frères et sœurs.' },
      { id: 'L1-08', vi: 'Hà Nội là thủ đô.',           fr: 'Hanoï est la capitale.' },
      { id: 'L1-09', vi: 'Tôi đi học mỗi sáng.',        fr: 'Je vais à l\'école chaque matin.' },
      { id: 'L1-10', vi: 'Cái này bao nhiêu tiền?',     fr: 'Combien ça coûte ?' },
    ],
  },

  // ── Niveau 2 — Intermédiaire ───────────────────────────────────────
  {
    level: 2,
    name: 'Intermédiaire',
    description: 'Voyelles ư/ơ/â, aspirées kh/th',
    focus: [
      'Voyelle ư (haute postérieure NON arrondie, inexistante en français)',
      'Voyelle ơ (mi-ouverte, un « eu » reculé)',
      'Consonnes aspirées kh, th (souffle absent en français)',
      'Enchaînements de tons sắc/huyền',
    ],
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    emoji: '📘',
    phrases: [
      { id: 'L2-01', vi: 'Cô ấy mua mũ mới.',               fr: 'Elle achète un nouveau chapeau.' },
      { id: 'L2-02', vi: 'Mùa thu Hà Nội rất đẹp.',          fr: 'L\'automne à Hanoï est très beau.' },
      { id: 'L2-03', vi: 'Tôi thức dậy từ sáu giờ sáng.',    fr: 'Je me réveille à six heures du matin.' },
      { id: 'L2-04', vi: 'Thư viện mở cửa lúc tám giờ.',     fr: 'La bibliothèque ouvre à huit heures.' },
      { id: 'L2-05', vi: 'Bố tôi thích uống trà nóng.',      fr: 'Mon père aime boire du thé chaud.' },
      { id: 'L2-06', vi: 'Tôi chưa bao giờ đến đó.',         fr: 'Je n\'y suis jamais allé(e).' },
      { id: 'L2-07', vi: 'Hà Nội mùa đông rất lạnh.',        fr: 'Hanoï en hiver est très froid.' },
      { id: 'L2-08', vi: 'Chợ mở cửa từ sáng sớm.',          fr: 'Le marché ouvre dès le matin.' },
      { id: 'L2-09', vi: 'Tôi thường đi bộ đến trường.',     fr: 'Je vais souvent à l\'école à pied.' },
      { id: 'L2-10', vi: 'Cơm này ngon quá!',                 fr: 'Ce riz est trop bon !' },
    ],
  },

  // ── Niveau 3 — Avancé ─────────────────────────────────────────────
  {
    level: 3,
    name: 'Avancé',
    description: 'nh vs ng, tr vs ch, tons hỏi/ngã',
    focus: [
      'nh (palatal, comme « gn ») vs ng (vélaire, « -ing » anglais en début de mot)',
      'tr vs ch (fusionnent à Hanoï, mais orthographe distincte)',
      'Ton hỏi (descendant-montant) vs ngã (avec coupure glottale)',
    ],
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    emoji: '🔥',
    phrases: [
      { id: 'L3-01', vi: 'Nhà hàng này ngon nhất.',                fr: 'Ce restaurant est le meilleur.' },
      { id: 'L3-02', vi: 'Nhà tôi ở trong ngõ nhỏ.',              fr: 'Ma maison est dans une petite ruelle.' },
      { id: 'L3-03', vi: 'Những người bạn cũ rất tốt.',           fr: 'Les vieux amis sont très gentils.' },
      { id: 'L3-04', vi: 'Anh ấy nghĩ khác mọi người.',          fr: 'Il pense différemment de tout le monde.' },
      { id: 'L3-05', vi: 'Nhớ mang theo nón nhé!',                 fr: 'N\'oublie pas d\'apporter le chapeau !' },
      { id: 'L3-06', vi: 'Chị ấy trẻ hơn tôi nghĩ.',             fr: 'Elle est plus jeune que je ne pensais.' },
      { id: 'L3-07', vi: 'Trời nóng nhưng gió mát.',              fr: 'Il fait chaud mais le vent est frais.' },
      { id: 'L3-08', vi: 'Anh trai tôi thích chơi nhạc.',         fr: 'Mon frère aime jouer de la musique.' },
      { id: 'L3-09', vi: 'Nhiều người thích uống trà xanh.',      fr: 'Beaucoup de gens aiment le thé vert.' },
      { id: 'L3-10', vi: 'Chúng tôi ăn trưa ở ngoài.',           fr: 'Nous déjeunons dehors.' },
    ],
  },

  // ── Niveau 4 — Expert ─────────────────────────────────────────────
  {
    level: 4,
    name: 'Expert',
    description: 'Diphtongues ươ/ưa/uê, finales -c/-t/-p',
    focus: [
      'Diphtongues ươ, ưa, uê, uô (glissements vocaliques complexes)',
      'Consonnes finales non relâchées -c, -t, -p, -ch (pas d\'explosion d\'air)',
      'Distinction finale -nh (palatal) vs -ng (vélaire)',
      'Séquences tonales sur 3+ syllabes',
    ],
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    emoji: '⚡',
    phrases: [
      { id: 'L4-01', vi: 'Vườn nhà tôi có nhiều hoa đẹp.',         fr: 'Mon jardin a beaucoup de belles fleurs.' },
      { id: 'L4-02', vi: 'Tường nhà cũ bị nứt rồi.',               fr: 'Le mur de la vieille maison est fissuré.' },
      { id: 'L4-03', vi: 'Gương trong phòng tắm bị vỡ.',           fr: 'Le miroir de la salle de bain est cassé.' },
      { id: 'L4-04', vi: 'Đường phố Hà Nội rất đông đúc.',         fr: 'Les rues de Hanoï sont très animées.' },
      { id: 'L4-05', vi: 'Mười người đi bộ dưới trời mưa.',        fr: 'Dix personnes marchent sous la pluie.' },
      { id: 'L4-06', vi: 'Muối và đường để trên bàn.',              fr: 'Le sel et le sucre sont sur la table.' },
      { id: 'L4-07', vi: 'Sách này rất đáng đọc.',                  fr: 'Ce livre vaut la peine d\'être lu.' },
      { id: 'L4-08', vi: 'Buổi tối chúng tôi ăn cùng nhau.',       fr: 'Le soir nous mangeons ensemble.' },
      { id: 'L4-09', vi: 'Bước chân cô ấy rất nhẹ nhàng.',         fr: 'Ses pas sont très légers.' },
      { id: 'L4-10', vi: 'Lược và gương để trên tủ.',               fr: 'Le peigne et le miroir sont sur l\'armoire.' },
    ],
  },

  // ── Niveau 5 — Extrême ────────────────────────────────────────────
  {
    level: 5,
    name: 'Extrême',
    description: 'ng- initial + ư + ton nặng : le piège « ngựa »',
    focus: [
      'ng- initial /ŋ/ (nasale vélaire en attaque, inexistante en français)',
      'Combinaison ng + ư + ton nặng (coup de glotte final)',
      'Mots « ngựa, người, ngừng, nước » — triple difficulté simultanée',
      'Le ton nặng : descente + coupure glottale brutale',
    ],
    color: 'bg-red-100 text-red-700 border-red-200',
    emoji: '🐴',
    phrases: [
      { id: 'L5-01', vi: 'Con ngựa này rất đẹp.',                   fr: 'Ce cheval est très beau.' },
      { id: 'L5-02', vi: 'Người ta ngừng lại ở đâu?',              fr: 'Où est-ce que les gens s\'arrêtent ?' },
      { id: 'L5-03', vi: 'Nghĩa của từ này là gì?',                fr: 'Quel est le sens de ce mot ?' },
      { id: 'L5-04', vi: 'Người già thường ngủ sớm.',               fr: 'Les personnes âgées dorment tôt en général.' },
      { id: 'L5-05', vi: 'Nước Việt Nam có nhiều người tốt.',       fr: 'Le Vietnam a beaucoup de gens bons.' },
      { id: 'L5-06', vi: 'Đừng nghĩ xấu về người khác.',           fr: 'Ne pense pas du mal des autres.' },
      { id: 'L5-07', vi: 'Con ngựa chạy nhanh hơn con bò.',        fr: 'Le cheval court plus vite que le bœuf.' },
      { id: 'L5-08', vi: 'Người nước ngoài thường thích phở.',      fr: 'Les étrangers aiment souvent le phở.' },
      { id: 'L5-09', vi: 'Ngừng nói và nghe tôi nói.',              fr: 'Arrête de parler et écoute-moi.' },
      { id: 'L5-10', vi: 'Ngôi nhà cũ nằm cuối ngõ.',              fr: 'La vieille maison est au fond de la ruelle.' },
    ],
  },

  // ── Niveau 6 — Maître ─────────────────────────────────────────────
  {
    level: 6,
    name: 'Maître',
    description: 'Virelangues et combinaisons maximales',
    focus: [
      'Virelangues (câu nói líu lưỡi) — saturation consonantique',
      'Enchaînements de 5-6 tons différents sur des syllabes similaires',
      'Triphtongues ươi, ưu, uyê dans des phrases longues',
      'Mots-pièges : ngưỡng, khuỷu, quyết, ngược, rượu',
    ],
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    emoji: '👑',
    phrases: [
      { id: 'L6-01', vi: 'Rượu nếp mới của ông ngoại rất ngon.',        fr: 'L\'alcool de riz du grand-père est délicieux.' },
      { id: 'L6-02', vi: 'Khuỷu tay trái của tôi bị đau.',              fr: 'Mon coude gauche me fait mal.' },
      { id: 'L6-03', vi: 'Người ta thường nghĩ trước khi quyết định.',   fr: 'On réfléchit généralement avant de décider.' },
      { id: 'L6-04', vi: 'Bốn người bạn bán bốn cái bàn bẩn.',          fr: 'Quatre amis vendent quatre tables sales.' },
      { id: 'L6-05', vi: 'Bà Ba béo bán bánh bèo bên bờ biển.',         fr: 'La dame Ba vend des galettes au bord de la mer.' },
      { id: 'L6-06', vi: 'Chuối chín muộn ngọt hơn chuối chín sớm.',    fr: 'Les bananes mûres tard sont plus sucrées.' },
      { id: 'L6-07', vi: 'Ông Nguyễn uống nước nguồn từ ngọn suối.',     fr: 'M. Nguyễn boit l\'eau de la source.' },
      { id: 'L6-08', vi: 'Thuở xưa người ta hay kể chuyện ngụ ngôn.',    fr: 'Autrefois on racontait souvent des fables.' },
      { id: 'L6-09', vi: 'Ngưỡng cửa nhà này bằng gỗ lim quý.',         fr: 'Le seuil de cette maison est en bois précieux.' },
      { id: 'L6-10', vi: 'Ngược chiều gió thổi nghe nguồn nước chảy.',   fr: 'Contre le vent, on entend la source couler.' },
    ],
  },
]

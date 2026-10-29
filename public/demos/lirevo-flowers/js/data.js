/* Каталог Lirevo. Цены в долларах США за размер «Стандарт». Тексты — {ru, uz, en}, выбираются по текущему языку. */
window.LIREVO_DATA = (() => {
  const L = window.I18N.pick;
  const loc = (list) => list.map((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, L(v)])));

  const CATEGORIES = loc([
    { id: 'all', name: { ru: 'Все букеты', uz: 'Barcha guldastalar', en: 'All bouquets' } },
    { id: 'roses', name: { ru: 'Розы', uz: 'Atirgullar', en: 'Roses' }, tint: '#F6DCE1' },
    { id: 'peonies', name: { ru: 'Пионы', uz: 'Pionlar', en: 'Peonies' }, tint: '#FBE4E7' },
    { id: 'tulips', name: { ru: 'Тюльпаны', uz: 'Lolalar', en: 'Tulips' }, tint: '#FDE3E0' },
    { id: 'field', name: { ru: 'Полевые', uz: 'Dala gullari', en: 'Wildflowers' }, tint: '#EEF0DA' },
    { id: 'exotic', name: { ru: 'Лилии', uz: 'Liliyalar', en: 'Lilies' }, tint: '#F2ECF4' },
    { id: 'boxes', name: { ru: 'В коробке', uz: 'Qutida', en: 'In a box' }, tint: '#E8EDF5' },
  ]);

  const SIZES = loc([
    { id: 's', name: { ru: 'Компакт', uz: 'Kompakt', en: 'Compact' }, note: { ru: 'для милого жеста', uz: 'yoqimli e’tibor uchun', en: 'for a sweet gesture' }, mult: 0.75, heads: 5 },
    { id: 'm', name: { ru: 'Стандарт', uz: 'Standart', en: 'Standard' }, note: { ru: 'как на фото', uz: 'rasmdagidek', en: 'as pictured' }, mult: 1, heads: 8 },
    { id: 'l', name: { ru: 'Роскошный', uz: 'Hashamatli', en: 'Deluxe' }, note: { ru: 'вау-эффект', uz: 'vau-effekt', en: 'wow effect' }, mult: 1.45, heads: 12 },
  ]);

  const P = {
    blush: ['#FBD6DD', '#EC93A6', '#A8354F'],
    scarlet: ['#F48A8F', '#C8263A', '#7A0F20'],
    cream: ['#FFF6EA', '#F2DDC2', '#C99A68'],
    peony: ['#FCE4E8', '#F3AEBB', '#CD627C'],
    coral: ['#FFD7C9', '#F59A7F', '#C75A43'],
    tulipPink: ['#FFD3DC', '#F06A86', '#B3203F'],
    tulipYellow: ['#FFF0A8', '#F7C83C', '#C98A0A'],
    tulipWhite: ['#FFFFFF', '#EEEDE4', '#B9BFA4'],
    tulipPurple: ['#E3CCF5', '#A77ED8', '#5E3A99'],
    blueHyd: ['#DCE6FF', '#9DB4F2', '#5F79CC'],
    pinkHyd: ['#FADDE8', '#EBA6C1', '#BB6990'],
    lily: ['#FFFFFF', '#F8E7EC', '#D9708C'],
    lilyPink: ['#FFE6EE', '#F59AB6', '#C2416B'],
  };

  // tag — идентификатор метки, подпись берётся из I18N ('tag.<id>')
  const PRODUCTS = loc([
    {
      id: 'rozovyj-rassvet', cat: 'roses', price: 49, old: 56, tag: 'hit',
      name: { ru: 'Розовый рассвет', uz: 'Pushti tong', en: 'Pink Dawn' },
      meta: { ru: '25 роз · 50 см', uz: '25 ta atirgul · 50 sm', en: '25 roses · 50 cm' },
      art: { style: 'paper', wrap: ['#F3E3D3', '#E8D2BC'], ribbon: '#C9607A', flowers: [{ t: 'rose', c: P.blush }], fillers: ['eucalyptus', 'gyps'] },
      desc: {
        ru: 'Нежные пудровые розы сорта «Пинк Флойд» в крафтовой упаковке с веточками эвкалипта. Букет, который подходит для любого повода — от первого свидания до юбилея.',
        uz: 'Kraft qog‘ozga o‘ralgan, evkalipt shoxchalari bilan bezatilgan nozik pudra rangli «Pink Floyd» atirgullari. Birinchi uchrashuvdan yubileygacha har qanday munosabatga mos guldasta.',
        en: 'Delicate powder-pink Pink Floyd roses in kraft paper with sprigs of eucalyptus. A bouquet for any occasion, from a first date to an anniversary.',
      },
      comp: {
        ru: ['Роза Pink Floyd — 25 шт', 'Эвкалипт цинерея', 'Гипсофила', 'Крафт-бумага, атласная лента'],
        uz: ['Pink Floyd atirguli — 25 dona', 'Evkalipt sinereya', 'Gipsofila', 'Kraft qog‘oz, atlas lenta'],
        en: ['Pink Floyd rose × 25', 'Eucalyptus cinerea', 'Gypsophila', 'Kraft paper, satin ribbon'],
      },
    },
    {
      id: 'alaya-klassika', cat: 'roses', price: 89, tag: 'premium',
      name: { ru: 'Алая классика', uz: 'Qizil klassika', en: 'Scarlet Classic' },
      meta: { ru: '51 роза · 60 см', uz: '51 ta atirgul · 60 sm', en: '51 roses · 60 cm' },
      art: { style: 'paper', wrap: ['#2A2A2A', '#1E1E1E'], ribbon: '#C8263A', flowers: [{ t: 'rose', c: P.scarlet }], fillers: ['leaves'] },
      desc: {
        ru: 'Классика, которая никогда не выходит из моды: 51 алая роза «Ред Наоми» в чёрной матовой упаковке. Говорит о чувствах громче любых слов.',
        uz: 'Hech qachon modadan chiqmaydigan klassika: qora mat qog‘ozdagi 51 ta qizil «Red Naomi» atirguli. His-tuyg‘ularni har qanday so‘zdan baland ifodalaydi.',
        en: 'A classic that never goes out of style: 51 scarlet Red Naomi roses in matte black wrapping. Says more than any words could.',
      },
      comp: {
        ru: ['Роза Red Naomi — 51 шт', 'Питтоспорум', 'Матовая плёнка, лента'],
        uz: ['Red Naomi atirguli — 51 dona', 'Pittosporum', 'Mat plyonka, lenta'],
        en: ['Red Naomi rose × 51', 'Pittosporum', 'Matte film, ribbon'],
      },
    },
    {
      id: 'vanilnoe-oblako', cat: 'roses', price: 53, tag: 'new',
      name: { ru: 'Ванильное облако', uz: 'Vanil buluti', en: 'Vanilla Cloud' },
      meta: { ru: '19 кустовых роз', uz: '19 ta buta atirgul', en: '19 spray roses' },
      art: { style: 'paper', wrap: ['#EEF1E8', '#DDE4D4'], ribbon: '#C99A68', flowers: [{ t: 'rose', c: P.cream }, { t: 'daisy' }], fillers: ['gyps', 'eucalyptus'] },
      desc: {
        ru: 'Кремовые кустовые розы с ромашковой хризантемой и облаком гипсофилы. Свежо, светло и очень по-летнему.',
        uz: 'Krem rangli buta atirgullar, moychechaksimon xrizantema va gipsofila buluti. Yangi, yorug‘ va juda yozgi.',
        en: 'Cream spray roses with daisy chrysanthemums and a cloud of gypsophila. Fresh, light and very summery.',
      },
      comp: {
        ru: ['Роза кустовая Bombastic — 19 шт', 'Хризантема ромашковая', 'Гипсофила', 'Эвкалипт'],
        uz: ['Bombastic buta atirguli — 19 dona', 'Moychechaksimon xrizantema', 'Gipsofila', 'Evkalipt'],
        en: ['Bombastic spray rose × 19', 'Daisy chrysanthemum', 'Gypsophila', 'Eucalyptus'],
      },
    },
    {
      id: 'pionovoe-oblako', cat: 'peonies', price: 64, old: 72, tag: 'hit',
      name: { ru: 'Пионовое облако', uz: 'Pion buluti', en: 'Peony Cloud' },
      meta: { ru: '15 пионов · сезонный', uz: '15 ta pion · mavsumiy', en: '15 peonies · seasonal' },
      art: { style: 'paper', wrap: ['#FFFFFF', '#F1ECE6'], ribbon: '#E8879C', flowers: [{ t: 'peony', c: P.peony }], fillers: ['eucalyptus'] },
      desc: {
        ru: 'Пышные пионы «Сара Бернар», раскрывающиеся прямо на глазах. Аромат, который наполняет всю комнату.',
        uz: 'Ko‘z oldingizda ochiladigan hashamatli «Sarah Bernhardt» pionlari. Butun xonani to‘ldiradigan xushbo‘y hid.',
        en: 'Lush Sarah Bernhardt peonies that open right before your eyes. A fragrance that fills the whole room.',
      },
      comp: {
        ru: ['Пион Sarah Bernhardt — 15 шт', 'Эвкалипт', 'Корейская плёнка'],
        uz: ['Sarah Bernhardt pioni — 15 dona', 'Evkalipt', 'Koreys plyonkasi'],
        en: ['Sarah Bernhardt peony × 15', 'Eucalyptus', 'Korean wrapping film'],
      },
    },
    {
      id: 'korallovyj-sharm', cat: 'peonies', price: 58,
      name: { ru: 'Коралловый шарм', uz: 'Marjon joziba', en: 'Coral Charm' },
      meta: { ru: '11 пионов «Корал Шарм»', uz: '11 ta «Coral Charm» pioni', en: '11 Coral Charm peonies' },
      art: { style: 'paper', wrap: ['#FCEADF', '#F5D8C5'], ribbon: '#C75A43', flowers: [{ t: 'peony', c: P.coral }, { t: 'rose', c: P.cream }], fillers: ['leaves', 'gyps'] },
      desc: {
        ru: 'Редкие коралловые пионы в компании кремовых роз. Тёплый, солнечный и очень фотогеничный букет.',
        uz: 'Krem rangli atirgullar bilan noyob marjon rangli pionlar. Iliq, quyoshli va juda fotogenik guldasta.',
        en: 'Rare coral peonies paired with cream roses. A warm, sunny and very photogenic bouquet.',
      },
      comp: {
        ru: ['Пион Coral Charm — 11 шт', 'Роза кремовая — 4 шт', 'Гипсофила', 'Зелень'],
        uz: ['Coral Charm pioni — 11 dona', 'Krem atirgul — 4 dona', 'Gipsofila', 'Ko‘katlar'],
        en: ['Coral Charm peony × 11', 'Cream rose × 4', 'Gypsophila', 'Greenery'],
      },
    },
    {
      id: 'vesennij-mix', cat: 'tulips', price: 35,
      name: { ru: 'Весенний микс', uz: 'Bahor miksi', en: 'Spring Mix' },
      meta: { ru: '35 тюльпанов', uz: '35 ta lola', en: '35 tulips' },
      art: { style: 'paper', wrap: ['#E9F0E4', '#D7E3CF'], ribbon: '#F7C83C', flowers: [{ t: 'tulip', c: P.tulipPink }, { t: 'tulip', c: P.tulipYellow }, { t: 'tulip', c: P.tulipPurple }], fillers: ['leaves'] },
      desc: {
        ru: 'Яркий микс голландских тюльпанов — розовые, жёлтые и сиреневые. Поднимает настроение лучше кофе.',
        uz: 'Gollandiya lolalarining yorqin miksi — pushti, sariq va binafsha. Kayfiyatni qahvadan ham yaxshiroq ko‘taradi.',
        en: 'A bright mix of Dutch tulips in pink, yellow and lilac. Lifts your mood better than coffee.',
      },
      comp: {
        ru: ['Тюльпаны микс — 35 шт', 'Упаковочная бумага', 'Лента'],
        uz: ['Lolalar miksi — 35 dona', 'O‘rash qog‘ozi', 'Lenta'],
        en: ['Mixed tulips × 35', 'Wrapping paper', 'Ribbon'],
      },
    },
    {
      id: 'belye-tyulpany', cat: 'tulips', price: 32,
      name: { ru: 'Белая нежность', uz: 'Oq nafosat', en: 'White Tenderness' },
      meta: { ru: '25 белых тюльпанов', uz: '25 ta oq lola', en: '25 white tulips' },
      art: { style: 'paper', wrap: ['#F3E3D3', '#E8D2BC'], ribbon: '#3F5E43', flowers: [{ t: 'tulip', c: P.tulipWhite }], fillers: ['eucalyptus'] },
      desc: {
        ru: 'Минималистичный букет белых тюльпанов в крафте. Для тех, кто ценит лаконичность и чистые линии.',
        uz: 'Kraft qog‘ozdagi oq lolalardan iborat minimalistik guldasta. Soddalik va toza chiziqlarni qadrlaydiganlar uchun.',
        en: 'A minimalist bouquet of white tulips in kraft paper. For those who love simplicity and clean lines.',
      },
      comp: {
        ru: ['Тюльпан белый — 25 шт', 'Эвкалипт', 'Крафт'],
        uz: ['Oq lola — 25 dona', 'Evkalipt', 'Kraft qog‘oz'],
        en: ['White tulip × 25', 'Eucalyptus', 'Kraft paper'],
      },
    },
    {
      id: 'polevoe-utro', cat: 'field', price: 29, tag: 'deal',
      name: { ru: 'Полевое утро', uz: 'Dala tongi', en: 'Meadow Morning' },
      meta: { ru: 'ромашки и лаванда', uz: 'moychechak va lavanda', en: 'daisies and lavender' },
      art: { style: 'paper', wrap: ['#F3E3D3', '#E8D2BC'], ribbon: '#9A7FD6', flowers: [{ t: 'daisy' }, { t: 'lavender' }], fillers: ['gyps', 'leaves'] },
      desc: {
        ru: 'Букет, будто собранный на летнем лугу: ромашки, лаванда и воздушная гипсофила.',
        uz: 'Go‘yo yozgi o‘tloqdan terilgan guldasta: moychechaklar, lavanda va havodor gipsofila.',
        en: 'A bouquet that looks freshly picked from a summer meadow: daisies, lavender and airy gypsophila.',
      },
      comp: {
        ru: ['Ромашка — 15 шт', 'Лаванда — 10 веток', 'Гипсофила', 'Крафт'],
        uz: ['Moychechak — 15 dona', 'Lavanda — 10 shoxcha', 'Gipsofila', 'Kraft qog‘oz'],
        en: ['Daisy × 15', 'Lavender × 10 sprigs', 'Gypsophila', 'Kraft paper'],
      },
    },
    {
      id: 'solnechnyj-den', cat: 'field', price: 34,
      name: { ru: 'Солнечный день', uz: 'Quyoshli kun', en: 'Sunny Day' },
      meta: { ru: '7 подсолнухов', uz: '7 ta kungaboqar', en: '7 sunflowers' },
      art: { style: 'paper', wrap: ['#EAF0F6', '#D6E1EC'], ribbon: '#F2A81D', flowers: [{ t: 'sunflower' }, { t: 'daisy' }], fillers: ['leaves'] },
      desc: {
        ru: 'Подсолнухи с ромашками — концентрат лета, который растопит любое сердце даже в ноябре.',
        uz: 'Kungaboqar va moychechaklar — noyabrda ham har qanday yurakni eritadigan yoz konsentrati.',
        en: 'Sunflowers with daisies — pure summer that will melt any heart, even in November.',
      },
      comp: {
        ru: ['Подсолнух — 7 шт', 'Ромашка — 6 шт', 'Зелень', 'Бумага'],
        uz: ['Kungaboqar — 7 dona', 'Moychechak — 6 dona', 'Ko‘katlar', 'Qog‘oz'],
        en: ['Sunflower × 7', 'Daisy × 6', 'Greenery', 'Paper'],
      },
    },
    {
      id: 'provans', cat: 'field', price: 42, tag: 'new',
      name: { ru: 'Прованс', uz: 'Provans', en: 'Provence' },
      meta: { ru: 'гортензия и лаванда', uz: 'gortenziya va lavanda', en: 'hydrangea and lavender' },
      art: { style: 'paper', wrap: ['#F1ECF7', '#E2D8EF'], ribbon: '#6A4FB0', flowers: [{ t: 'hydrangea', c: P.blueHyd }, { t: 'lavender' }], fillers: ['eucalyptus'] },
      desc: {
        ru: 'Небесно-голубая гортензия и ароматная лаванда — дыхание южной Франции.',
        uz: 'Osmon rangidagi gortenziya va xushbo‘y lavanda — janubiy Fransiya nafasi.',
        en: 'Sky-blue hydrangea and fragrant lavender — a breath of southern France.',
      },
      comp: {
        ru: ['Гортензия голубая — 3 шт', 'Лаванда — 15 веток', 'Эвкалипт'],
        uz: ['Havorang gortenziya — 3 dona', 'Lavanda — 15 shoxcha', 'Evkalipt'],
        en: ['Blue hydrangea × 3', 'Lavender × 15 sprigs', 'Eucalyptus'],
      },
    },
    {
      id: 'belaya-liliya', cat: 'exotic', price: 46,
      name: { ru: 'Белая лилия', uz: 'Oq liliya', en: 'White Lily' },
      meta: { ru: '9 лилий · 70 см', uz: '9 ta liliya · 70 sm', en: '9 lilies · 70 cm' },
      art: { style: 'paper', wrap: ['#E6EEE6', '#D2DECF'], ribbon: '#D9708C', flowers: [{ t: 'lily', c: P.lily }], fillers: ['leaves', 'gyps'] },
      desc: {
        ru: 'Благородные восточные лилии с изящными тычинками. Пыльца удалена — букет не испачкает одежду.',
        uz: 'Nafis changchilari bo‘lgan olijanob sharq liliyalari. Gulchang olib tashlangan — guldasta kiyimni bulg‘amaydi.',
        en: 'Elegant oriental lilies with graceful stamens. The pollen is removed, so the bouquet won’t stain clothes.',
      },
      comp: {
        ru: ['Лилия Siberia — 9 шт', 'Гипсофила', 'Аспидистра'],
        uz: ['Siberia liliyasi — 9 dona', 'Gipsofila', 'Aspidistra'],
        en: ['Siberia lily × 9', 'Gypsophila', 'Aspidistra'],
      },
    },
    {
      id: 'tropiki', cat: 'exotic', price: 51,
      name: { ru: 'Розовый фламинго', uz: 'Pushti flamingo', en: 'Pink Flamingo' },
      meta: { ru: 'лилии и розы', uz: 'liliya va atirgullar', en: 'lilies and roses' },
      art: { style: 'paper', wrap: ['#FFF0E6', '#FBDCCB'], ribbon: '#C2416B', flowers: [{ t: 'lily', c: P.lilyPink }, { t: 'rose', c: P.blush }], fillers: ['eucalyptus'] },
      desc: {
        ru: 'Розовые лилии и пудровые розы — смелое сочетание для ярких людей.',
        uz: 'Pushti liliyalar va pudra rangli atirgullar — yorqin insonlar uchun dadil uyg‘unlik.',
        en: 'Pink lilies and powder-pink roses — a bold combination for vibrant people.',
      },
      comp: {
        ru: ['Лилия розовая — 5 шт', 'Роза — 9 шт', 'Эвкалипт'],
        uz: ['Pushti liliya — 5 dona', 'Atirgul — 9 dona', 'Evkalipt'],
        en: ['Pink lily × 5', 'Rose × 9', 'Eucalyptus'],
      },
    },
    {
      id: 'mademuazel', cat: 'boxes', price: 79, old: 89, tag: 'hit',
      name: { ru: 'Мадемуазель', uz: 'Madmuazel', en: 'Mademoiselle' },
      meta: { ru: 'шляпная коробка Ø 25 см', uz: 'shlyapa qutisi Ø 25 sm', en: 'hatbox Ø 25 cm' },
      art: { style: 'box', box: '#F2E3E3', band: '#1F2A22', flowers: [{ t: 'peony', c: P.peony }, { t: 'rose', c: P.blush }, { t: 'rose', c: P.cream }], fillers: ['gyps'] },
      desc: {
        ru: 'Пионы и розы, плотно уложенные в шляпную коробку на флористической губке. Не нужна ваза — композиция стоит до 10 дней.',
        uz: 'Floristik gubkaga shlyapa qutisida zich joylashtirilgan pion va atirgullar. Vaza kerak emas — kompozitsiya 10 kungacha turadi.',
        en: 'Peonies and roses packed tightly into a hatbox on floral foam. No vase needed — the arrangement lasts up to 10 days.',
      },
      comp: {
        ru: ['Пион — 7 шт', 'Роза — 12 шт', 'Гипсофила', 'Шляпная коробка, оазис'],
        uz: ['Pion — 7 dona', 'Atirgul — 12 dona', 'Gipsofila', 'Shlyapa qutisi, floristik gubka'],
        en: ['Peony × 7', 'Rose × 12', 'Gypsophila', 'Hatbox, floral foam'],
      },
    },
    {
      id: 'golubaya-mechta', cat: 'boxes', price: 52,
      name: { ru: 'Голубая мечта', uz: 'Havorang orzu', en: 'Blue Dream' },
      meta: { ru: 'коробка Ø 20 см', uz: 'quti Ø 20 sm', en: 'box Ø 20 cm' },
      art: { style: 'box', box: '#E7ECF6', band: '#5F79CC', flowers: [{ t: 'hydrangea', c: P.blueHyd }, { t: 'hydrangea', c: P.pinkHyd }], fillers: [] },
      desc: {
        ru: 'Облако гортензий в двух оттенках в аккуратной коробке. Идеальный подарок коллеге или маме.',
        uz: 'Ozoda qutidagi ikki xil tusdagi gortenziyalar buluti. Hamkasbingiz yoki onangiz uchun ajoyib sovg‘a.',
        en: 'A cloud of hydrangeas in two shades in a neat box. A perfect gift for a colleague or your mom.',
      },
      comp: {
        ru: ['Гортензия голубая — 3 шт', 'Гортензия розовая — 2 шт', 'Коробка, оазис'],
        uz: ['Havorang gortenziya — 3 dona', 'Pushti gortenziya — 2 dona', 'Quti, floristik gubka'],
        en: ['Blue hydrangea × 3', 'Pink hydrangea × 2', 'Box, floral foam'],
      },
    },
    {
      id: 'tyulpany-v-korobke', cat: 'boxes', price: 44,
      name: { ru: 'Весна в коробке', uz: 'Qutidagi bahor', en: 'Spring in a Box' },
      meta: { ru: '29 тюльпанов', uz: '29 ta lola', en: '29 tulips' },
      art: { style: 'box', box: '#FFF5DA', band: '#C98A0A', flowers: [{ t: 'tulip', c: P.tulipYellow }, { t: 'tulip', c: P.tulipWhite }], fillers: [] },
      desc: {
        ru: 'Жёлтые и белые тюльпаны в шляпной коробке — весна в любое время года.',
        uz: 'Shlyapa qutisidagi sariq va oq lolalar — yilning istalgan faslida bahor.',
        en: 'Yellow and white tulips in a hatbox — spring at any time of year.',
      },
      comp: {
        ru: ['Тюльпан — 29 шт', 'Шляпная коробка'],
        uz: ['Lola — 29 dona', 'Shlyapa qutisi'],
        en: ['Tulip × 29', 'Hatbox'],
      },
    },
  ]);

  const EXTRAS = loc([
    { id: 'x-card', name: { ru: 'Авторская открытка', uz: 'Mualliflik otkritkasi', en: 'Designer greeting card' }, price: 3, icon: 'mail' },
    { id: 'x-sweets', name: { ru: 'Конфеты ручной работы', uz: 'Qo‘lda tayyorlangan konfetlar', en: 'Handmade chocolates' }, price: 9, icon: 'gift' },
    { id: 'x-balloon', name: { ru: 'Воздушный шар с гелием', uz: 'Geliyli havo shari', en: 'Helium balloon' }, price: 5, icon: 'balloon' },
    { id: 'x-vase', name: { ru: 'Стеклянная ваза', uz: 'Shisha vaza', en: 'Glass vase' }, price: 12, icon: 'vase' },
  ]);

  // фото букетов: img/<id>.jpg (Pexels, свободная лицензия)
  PRODUCTS.forEach((p) => { p.art.photo = `img/${p.id}.jpg`; });

  const PROMOS = { LIREVO10: 0.1, LOVE15: 0.15 };
  const FREE_SHIPPING = 50;
  const SHIPPING = 4;
  const EXPRESS = 5;

  return { CATEGORIES, SIZES, PRODUCTS, EXTRAS, PROMOS, FREE_SHIPPING, SHIPPING, EXPRESS };
})();

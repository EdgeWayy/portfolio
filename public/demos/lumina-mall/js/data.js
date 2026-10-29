/* =========================================================================
 * Lumina Mall — demo seed data (16 stores on 4 floors, 99 products, ru/uz/en)
 * -------------------------------------------------------------------------
 * Loaded on first visit and by "Reset to demo data" in the admin panel.
 *
 * Every user-facing text is a translation object { ru, uz, en } (Uzbek in
 * Latin script). `keywords` feed the multilingual search (js/search.js), so
 * "одежда", "kiyim" and "clothes" all find Velvet & Co.
 *
 * Layout: `floor` is 1–4, `slot` is the position from left to right on that
 * floor (1–6). The atrium renderer spreads the stores of a floor around the
 * central glass elevator.
 *
 * Photos: real photos from Pexels (free licence), downloaded into
 * assets/images/stores/ and assets/images/products/ (+ thumbs/). See
 * assets/CREDITS.md. `photoQuery` is the search used to pick each photo.
 * ========================================================================= */
(function (global) {
  'use strict';

  const T = (ru, uz, en) => ({ ru, uz, en });

  /* --------------------------------------------------------------- stores */
  const STORES = [
    /* ============================ FLOOR 1 (ground) ===================== */
    {
      id: 'aroma-cafe', floor: 1, slot: 1, color: '#8a5a3c', logo: '☕', hours: '08:00 – 23:00',
      name: T('Арома Кафе', 'Aroma Kafe', 'Aroma Café'),
      category: T('Кафе', 'Kafe', 'Café'),
      description: T(
        'Свежеобжаренный кофе, выпечка и десерты у фонтана в атриуме.',
        'Fontan yonida yangi qovurilgan qahva, pishiriqlar va desertlar.',
        'Freshly roasted coffee, pastries and desserts by the atrium fountain.'),
      keywords: T('кофе, кофейня, капучино, латте, выпечка, десерт, чай, круассан',
        'qahva, kofe, qahvaxona, kapuchino, latte, pishiriq, desert, choy, kruassan',
        'coffee, coffee shop, cappuccino, latte, pastry, dessert, tea, croissant, cafe'),
      photoQuery: 'coffee shop interior',
    },
    {
      id: 'vita-pharm', floor: 1, slot: 2, color: '#2f7fd0', logo: '💊', hours: '08:00 – 22:00',
      name: T('ВитаФарм', 'VitaFarm', 'VitaPharm'),
      category: T('Аптека', 'Dorixona', 'Pharmacy'),
      description: T(
        'Лекарства, витамины и средства ухода. Консультация фармацевта бесплатно.',
        'Dori-darmonlar, vitaminlar va parvarish vositalari. Farmatsevt maslahati bepul.',
        'Medicines, vitamins and personal care. Free pharmacist advice.'),
      keywords: T('аптека, лекарства, витамины, таблетки, здоровье, маска, термометр',
        'dorixona, dori, dori-darmon, vitamin, tabletka, sog\'liq, niqob, termometr',
        'pharmacy, drugstore, medicine, vitamins, pills, health, mask, thermometer'),
      photoQuery: 'pharmacy interior',
    },
    {
      id: 'parfum-lumiere', floor: 1, slot: 3, color: '#a46fc4', logo: '🌸', hours: '10:00 – 22:00',
      name: T('Парфюм Люмьер', 'Parfum Lumyer', 'Parfum Lumière'),
      category: T('Парфюмерия', 'Atir-upa', 'Perfume'),
      description: T(
        'Нишевые и классические ароматы, подбор парфюма с консультантом.',
        'Nish va klassik atirlar, maslahatchi bilan atir tanlash.',
        'Niche and classic fragrances, with a personal scent consultation.'),
      keywords: T('духи, парфюм, парфюмерия, аромат, туалетная вода, одеколон, свечи',
        'atir, atir-upa, parfyum, xushbo\'y, tualet suvi, odekolon, sham',
        'perfume, fragrance, scent, eau de toilette, cologne, candle'),
      photoQuery: 'perfume shop',
    },
    {
      id: 'aurum', floor: 1, slot: 4, color: '#c9a227', logo: '💍', hours: '10:00 – 22:00',
      name: T('Аурум', 'Aurum', 'Aurum Jewelry'),
      category: T('Ювелирные изделия', 'Zargarlik buyumlari', 'Jewelry'),
      description: T(
        'Золото, серебро и бриллианты. Гравировка и чистка украшений бесплатно.',
        'Oltin, kumush va olmoslar. Gravyura va tozalash bepul.',
        'Gold, silver and diamonds. Free engraving and cleaning.'),
      keywords: T('украшения, ювелирный, золото, серебро, кольцо, серьги, бриллиант, часы',
        'taqinchoq, zargarlik, oltin, kumush, uzuk, sirg\'a, olmos, soat',
        'jewelry, jewellery, gold, silver, ring, earrings, diamond, watch'),
      photoQuery: 'jewelry store',
    },

    /* =============================== FLOOR 2 =========================== */
    {
      id: 'velvet', floor: 2, slot: 1, color: '#c2547a', logo: '👗', hours: '10:00 – 22:00',
      name: T('Вельвет и Ко', 'Velvet & Co', 'Velvet & Co'),
      category: T('Одежда', 'Kiyim-kechak', 'Fashion'),
      description: T(
        'Современная женская одежда из натуральных тканей.',
        'Tabiiy matolardan zamonaviy ayollar kiyimi.',
        'Contemporary womenswear in natural fabrics.'),
      keywords: T('одежда, платье, мода, блузка, пальто, юбка, женская одежда',
        'kiyim, kiyim-kechak, ko\'ylak, moda, bluzka, palto, yubka, ayollar kiyimi',
        'clothes, clothing, dress, fashion, blouse, coat, skirt, apparel'),
      photoQuery: 'clothing store interior',
    },
    {
      id: 'step-up', floor: 2, slot: 2, color: '#2e4a7d', logo: '👟', hours: '10:00 – 22:00',
      name: T('Степ Ап', 'Step Up', 'Step Up'),
      category: T('Обувь', 'Poyabzal', 'Shoes'),
      description: T(
        'Кроссовки, туфли и ботинки для всей семьи, примерка с 3D-сканером стопы.',
        'Butun oila uchun krossovka, tufli va botinkalar, oyoqni 3D skaner bilan o\'lchash.',
        'Sneakers, heels and boots for the whole family, with a 3D foot scanner.'),
      keywords: T('обувь, кроссовки, туфли, ботинки, сандалии, кеды',
        'poyabzal, oyoq kiyim, krossovka, tufli, botinka, sandal, kedi',
        'shoes, footwear, sneakers, heels, boots, sandals, trainers'),
      photoQuery: 'shoe store',
    },
    {
      id: 'bloom-beauty', floor: 2, slot: 3, color: '#d9779a', logo: '💄', hours: '10:00 – 22:00',
      name: T('Блум Бьюти', 'Bloom Beauty', 'Bloom Beauty'),
      category: T('Косметика', 'Kosmetika', 'Cosmetics'),
      description: T(
        'Уходовая и декоративная косметика, бесплатная диагностика кожи по выходным.',
        'Parvarish va dekorativ kosmetika, dam olish kunlari teri tahlili bepul.',
        'Skincare and makeup, with free skin analysis at weekends.'),
      keywords: T('косметика, макияж, помада, крем, уход за кожей, сыворотка, тушь',
        'kosmetika, pardoz, lab bo\'yog\'i, krem, teri parvarishi, zardob, tush',
        'cosmetics, makeup, lipstick, cream, skincare, serum, mascara, beauty'),
      photoQuery: 'cosmetics store',
    },
    {
      id: 'vista-optics', floor: 2, slot: 4, color: '#4b5bb7', logo: '👓', hours: '10:00 – 21:00',
      name: T('Виста Оптика', 'Vista Optika', 'Vista Optics'),
      category: T('Оптика', 'Optika', 'Eyewear'),
      description: T(
        'Очки, линзы и бесплатная проверка зрения за 15 минут.',
        'Ko\'zoynaklar, linzalar va 15 daqiqada bepul ko\'rish tekshiruvi.',
        'Glasses, lenses and a free 15-minute eye test.'),
      keywords: T('очки, оптика, линзы, солнцезащитные очки, оправа, зрение',
        'ko\'zoynak, optika, linza, quyosh ko\'zoynagi, gardish, ko\'rish',
        'glasses, eyewear, optics, lenses, sunglasses, frames, eye test'),
      photoQuery: 'eyewear store',
    },

    /* =============================== FLOOR 3 =========================== */
    {
      id: 'pixel-hub', floor: 3, slot: 1, color: '#3b6fd8', logo: '💻', hours: '10:00 – 22:00',
      name: T('Пиксель Хаб', 'Pixel Hub', 'Pixel Hub'),
      category: T('Электроника', 'Elektronika', 'Electronics'),
      description: T(
        'Ноутбуки, смартфоны, гаджеты и настройка техники в день покупки.',
        'Noutbuklar, smartfonlar, gadjetlar va xarid kuni sozlash.',
        'Laptops, phones, gadgets and same-day setup.'),
      keywords: T('электроника, техника, ноутбук, смартфон, телефон, наушники, гаджеты, компьютер',
        'elektronika, texnika, noutbuk, smartfon, telefon, quloqchin, gadjet, kompyuter',
        'electronics, tech, laptop, smartphone, phone, headphones, gadgets, computer'),
      photoQuery: 'electronics store',
    },
    {
      id: 'page-turner', floor: 3, slot: 2, color: '#c98a2b', logo: '📚', hours: '09:00 – 21:00',
      name: T('Пейдж Тёрнер', 'Page Turner', 'Page Turner'),
      category: T('Книги', 'Kitoblar', 'Books'),
      description: T(
        'Независимый книжный магазин с читальным уголком и встречами с авторами.',
        'O\'qish burchagi va mualliflar bilan uchrashuvlar bo\'ladigan mustaqil kitob do\'koni.',
        'An independent bookshop with a reading nook and author evenings.'),
      keywords: T('книги, книга, книжный, литература, роман, учебник, канцтовары, ежедневник',
        'kitob, kitoblar, kitob do\'koni, adabiyot, roman, darslik, kanselyariya, kundalik',
        'books, book, bookstore, literature, novel, textbook, stationery, planner'),
      photoQuery: 'bookstore interior',
    },
    {
      id: 'stride-sports', floor: 3, slot: 3, color: '#e2574c', logo: '⚽', hours: '10:00 – 22:00',
      name: T('Страйд Спорт', 'Stride Sport', 'Stride Sports'),
      category: T('Спорт', 'Sport', 'Sports'),
      description: T(
        'Экипировка для бега, фитнеса, тенниса и командных видов спорта.',
        'Yugurish, fitnes, tennis va jamoaviy sport turlari uchun anjomlar.',
        'Gear for running, fitness, tennis and team sports.'),
      keywords: T('спорт, спорттовары, фитнес, мяч, тренировка, бег, гантели, йога',
        'sport, sport anjomlari, fitnes, to\'p, mashg\'ulot, yugurish, gantel, yoga',
        'sports, sporting goods, fitness, ball, training, running, dumbbells, yoga, gym'),
      photoQuery: 'sporting goods store',
    },
    {
      id: 'home-nest', floor: 3, slot: 4, color: '#c46a4a', logo: '🛋️', hours: '10:00 – 21:00',
      name: T('Хоум Нест', 'Home Nest', 'Home Nest'),
      category: T('Товары для дома', 'Uy jihozlari', 'Home & Decor'),
      description: T(
        'Мебель, текстиль и декор для уютного дома.',
        'Shinam uy uchun mebel, to\'qimachilik va dekor.',
        'Furniture, textiles and decor for a calm, cosy home.'),
      keywords: T('дом, мебель, декор, интерьер, подушка, лампа, ваза, посуда',
        'uy, mebel, dekor, interyer, yostiq, chiroq, vaza, idish-tovoq',
        'home, furniture, decor, interior, cushion, lamp, vase, tableware'),
      photoQuery: 'home decor store',
    },

    /* =============================== FLOOR 4 =========================== */
    {
      id: 'little-stars', floor: 4, slot: 1, color: '#5a9fe0', logo: '🧒', hours: '10:00 – 21:00',
      name: T('Литл Старс', 'Little Stars', 'Little Stars'),
      category: T('Детская одежда', 'Bolalar kiyimi', 'Kids\' Fashion'),
      description: T(
        'Удобная детская одежда от 0 до 12 лет и игровой уголок для малышей.',
        '0 yoshdan 12 yoshgacha qulay bolalar kiyimi va kichkintoylar uchun o\'yin burchagi.',
        'Comfy clothes for ages 0–12 and a play corner for little ones.'),
      keywords: T('дети, детская одежда, малыш, ребёнок, комбинезон, школьная форма',
        'bolalar, bolalar kiyimi, chaqaloq, bola, kombinezon, maktab formasi',
        'kids, children, baby, kidswear, children\'s clothes, romper, school uniform'),
      photoQuery: 'children clothing store',
    },
    {
      id: 'toy-planet', floor: 4, slot: 2, color: '#f08c2e', logo: '🧸', hours: '10:00 – 21:00',
      name: T('Той Планет', 'Toy Planet', 'Toy Planet'),
      category: T('Игрушки', 'O\'yinchoqlar', 'Toys'),
      description: T(
        'Конструкторы, настольные игры и игрушки для любознательных детей.',
        'Qiziquvchan bolalar uchun konstruktorlar, stol o\'yinlari va o\'yinchoqlar.',
        'Building sets, board games and toys for curious kids.'),
      keywords: T('игрушки, игрушка, конструктор, кукла, пазл, машинка, плюшевый мишка',
        'o\'yinchoq, o\'yinchoqlar, konstruktor, qo\'g\'irchoq, boshqotirma, mashinacha, ayiqcha',
        'toys, toy, building blocks, doll, puzzle, toy car, teddy bear'),
      photoQuery: 'toy store',
    },
    {
      id: 'tasty-terrace', floor: 4, slot: 3, color: '#e5483f', logo: '🍜', hours: '10:00 – 23:00',
      name: T('Тейсти Террас', 'Tasty Terrace', 'Tasty Terrace'),
      category: T('Фуд-корт', 'Fud-kort', 'Food Court'),
      description: T(
        'Семь кухонь под стеклянной крышей: от плова до рамена.',
        'Shisha tom ostida yetti xil oshxona: palovdan ramengacha.',
        'Seven kitchens under a glass roof, from plov to ramen.'),
      keywords: T('еда, фуд-корт, ресторан, плов, пицца, бургер, суши, обед',
        'ovqat, taom, fud-kort, restoran, palov, osh, pitsa, burger, sushi, tushlik',
        'food, food court, restaurant, plov, pizza, burger, sushi, lunch, eat'),
      photoQuery: 'food court restaurant',
    },
    {
      id: 'playverse', floor: 4, slot: 4, color: '#7a48d6', logo: '🎮', hours: '11:00 – 23:00',
      name: T('Плейверс', 'Playverse', 'Playverse'),
      category: T('Игры', 'O\'yinlar', 'Gaming'),
      description: T(
        'Консоли, VR и настольные игры, бесплатная игровая арена.',
        'Konsollar, VR va stol o\'yinlari, bepul o\'yin maydoni.',
        'Consoles, VR and board games, plus a free-to-play arena.'),
      keywords: T('игры, видеоигры, консоль, приставка, геймпад, vr, гейминг',
        'o\'yinlar, videoo\'yin, konsol, pristavka, geympad, vr, geyming',
        'games, gaming, video games, console, controller, gamepad, vr'),
      photoQuery: 'video game store',
    },
  ];

  /* ------------------------------------------------------------- products
   * [name, priceUZS, emoji, description, inStock, photoQuery]              */
  const PRODUCTS = {
    'aroma-cafe': [
      [T('Капучино', 'Kapuchino', 'Cappuccino'), 28000, '☕', T('Двойной эспрессо и бархатная молочная пена.', 'Qo\'sh espresso va mayin sut ko\'pigi.', 'Double espresso with velvety milk foam.'), true, 'cappuccino'],
      [T('Круассан с маслом', 'Sariyog\'li kruassan', 'Butter croissant'), 22000, '🥐', T('Слоёный и хрустящий, из печи каждое утро.', 'Qatlamli va qarsildoq, har tong pechdan.', 'Flaky and crisp, baked every morning.'), true, 'croissant'],
      [T('Чизкейк', 'Chizkeyk', 'Cheesecake'), 35000, '🍰', T('Нью-йоркский чизкейк с ягодным соусом.', 'Rezavor sousli Nyu-York chizkeyki.', 'New York cheesecake with berry sauce.'), true, 'cheesecake slice'],
      [T('Латте на овсяном молоке', 'Suli sutli latte', 'Oat milk latte'), 32000, '🥛', T('Мягкий латте на овсяном молоке.', 'Suli sutidagi yumshoq latte.', 'Smooth latte made with oat milk.'), true, 'latte art'],
      [T('Горячий шоколад', 'Issiq shokolad', 'Hot chocolate'), 30000, '🍫', T('Густой бельгийский шоколад со сливками.', 'Qaymoqli quyuq Belgiya shokoladi.', 'Rich Belgian chocolate with whipped cream.'), true, 'hot chocolate'],
      [T('Кофе в зёрнах 250 г', 'Qahva donalari 250 g', 'Coffee beans 250 g'), 95000, '🫘', T('Эфиопия, светлая обжарка, ягодные нотки.', 'Efiopiya, och qovurilgan, rezavor ta\'mi.', 'Ethiopia, light roast, berry notes.'), false, 'coffee beans'],
    ],
    'vita-pharm': [
      [T('Витамин C 1000 мг', 'C vitamini 1000 mg', 'Vitamin C 1000 mg'), 85000, '💊', T('60 шипучих таблеток с цинком.', 'Rux qo\'shilgan 60 ta eruvchan tabletka.', '60 effervescent tablets with zinc.'), true, 'vitamin pills'],
      [T('Электронный термометр', 'Elektron termometr', 'Digital thermometer'), 65000, '🌡️', T('Результат за 10 секунд, гибкий наконечник.', '10 soniyada natija, egiluvchan uchi.', 'Reading in 10 seconds, flexible tip.'), true, 'thermometer'],
      [T('Солнцезащитный крем SPF 50', 'Quyoshdan himoya kremi SPF 50', 'Sunscreen SPF 50'), 120000, '🧴', T('Лёгкая текстура для лица и тела.', 'Yuz va tana uchun yengil tekstura.', 'Light texture for face and body.'), true, 'sunscreen'],
      [T('Аптечка первой помощи', 'Birinchi yordam qutisi', 'First aid kit'), 150000, '🩹', T('Всё необходимое для дома и машины.', 'Uy va mashina uchun kerakli hamma narsa.', 'Everything you need at home or in the car.'), true, 'first aid kit'],
      [T('Тонометр', 'Qon bosimi o\'lchagich', 'Blood pressure monitor'), 420000, '🩺', T('Автоматический, память на 60 измерений.', 'Avtomatik, 60 ta o\'lchov xotirasi.', 'Automatic, stores 60 readings.'), true, 'blood pressure monitor'],
      [T('Медицинские маски (50 шт.)', 'Tibbiy niqoblar (50 dona)', 'Medical masks (50 pcs)'), 45000, '😷', T('Трёхслойные, с носовым фиксатором.', 'Uch qatlamli, burun qisqichi bilan.', 'Three-layer, with nose clip.'), false, 'face masks medical'],
    ],
    'parfum-lumiere': [
      [T('Rose Noir, парфюмерная вода 50 мл', 'Rose Noir, parfyum suvi 50 ml', 'Rose Noir eau de parfum 50 ml'), 1250000, '🌹', T('Роза, чёрный перец и уд.', 'Atirgul, qora murch va ud.', 'Rose, black pepper and oud.'), true, 'perfume bottle'],
      [T('Citrus Bloom, туалетная вода', 'Citrus Bloom, tualet suvi', 'Citrus Bloom eau de toilette'), 690000, '🍊', T('Свежий цитрус и белый чай.', 'Yangi sitrus va oq choy.', 'Fresh citrus and white tea.'), true, 'perfume citrus'],
      [T('Мужской аромат Cedar', 'Erkaklar atiri Cedar', 'Cedar men\'s cologne'), 890000, '🪵', T('Кедр, ветивер и бергамот.', 'Sadr, vetiver va bergamot.', 'Cedar, vetiver and bergamot.'), true, 'cologne bottle'],
      [T('Набор миниатюр', 'Miniatyuralar to\'plami', 'Discovery set'), 450000, '🎁', T('Пять ароматов по 5 мл.', 'Har biri 5 ml dan beshta atir.', 'Five fragrances, 5 ml each.'), true, 'perfume gift box'],
      [T('Ароматическая свеча', 'Xushbo\'y sham', 'Scented candle'), 320000, '🕯️', T('Сандал и ваниль, 45 часов горения.', 'Sandal va vanil, 45 soat yonadi.', 'Sandalwood and vanilla, 45-hour burn.'), true, 'scented candle'],
      [T('Аромадиффузор для дома', 'Uy uchun aroma diffuzor', 'Reed diffuser'), 380000, '🏺', T('Аромат инжира на 3 месяца.', '3 oyga yetadigan anjir hidi.', 'Fig scent that lasts 3 months.'), false, 'reed diffuser'],
    ],
    aurum: [
      [T('Золотое кольцо', 'Oltin uzuk', 'Gold ring'), 4900000, '💍', T('585 проба, классическая форма 3 мм.', '585 proba, 3 mm klassik shakl.', '14k gold, classic 3 mm band.'), true, 'gold ring'],
      [T('Серьги с бриллиантами', 'Olmosli sirg\'alar', 'Diamond earrings'), 9800000, '💎', T('Белое золото, 0,25 карата.', 'Oq oltin, 0,25 karat.', 'White gold, 0.25 carat.'), true, 'diamond earrings'],
      [T('Жемчужное ожерелье', 'Marvarid marjon', 'Pearl necklace'), 3200000, '📿', T('Пресноводный жемчуг, 45 см.', 'Chuchuk suv marvaridi, 45 sm.', 'Freshwater pearls, 45 cm.'), true, 'pearl necklace'],
      [T('Серебряный браслет', 'Kumush bilaguzuk', 'Silver bracelet'), 1100000, '✨', T('Серебро 925 пробы, три подвески.', '925 kumush, uchta osma bilan.', 'Sterling silver with three charms.'), true, 'silver bracelet'],
      [T('Классические часы', 'Klassik soat', 'Classic watch'), 3600000, '⌚', T('Сапфировое стекло, кожаный ремешок.', 'Safir oyna, charm tasma.', 'Sapphire glass, leather strap.'), true, 'luxury watch'],
      [T('Шкатулка для украшений', 'Taqinchoq qutisi', 'Jewelry box'), 450000, '🎁', T('Два яруса и зеркало.', 'Ikki qavatli, oynali.', 'Two tiers and a mirror.'), false, 'jewelry box'],
    ],
    velvet: [
      [T('Льняное платье', 'Zig\'ir ko\'ylak', 'Linen dress'), 890000, '👗', T('Свободный крой, карманы в боковых швах.', 'Erkin bichim, yon cho\'ntaklari bor.', 'Relaxed cut with side pockets.'), true, 'linen dress'],
      [T('Шерстяной жакет', 'Jun jaket', 'Wool blazer'), 1650000, '🧥', T('Однобортный, мягкая мериносовая шерсть.', 'Bir qatorli, yumshoq merinos juni.', 'Single-breasted, soft merino.'), true, 'women blazer'],
      [T('Шёлковый платок', 'Ipak ro\'mol', 'Silk scarf'), 420000, '🧣', T('Ручная подшивка, цветочный принт.', 'Qo\'lda tikilgan, gulli naqsh.', 'Hand-rolled edges, floral print.'), true, 'silk scarf'],
      [T('Джинсы прямого кроя', 'To\'g\'ri bichimli jinsi', 'Straight jeans'), 690000, '👖', T('Органический деним с высокой посадкой.', 'Baland belli organik jinsi.', 'High-rise organic denim.'), true, 'jeans'],
      [T('Кожаная сумка', 'Charm sumka', 'Leather tote'), 1450000, '👜', T('Натуральная кожа, вмещает ноутбук 14″.', 'Tabiiy charm, 14″ noutbuk sig\'adi.', 'Genuine leather, fits a 14″ laptop.'), true, 'leather handbag'],
      [T('Вязаный кардиган', 'To\'qilgan kardigan', 'Knit cardigan'), 640000, '🧶', T('Объёмная вязка из переработанной шерсти.', 'Qayta ishlangan jundan hajmli to\'qima.', 'Chunky knit in recycled wool.'), true, 'knit cardigan'],
      [T('Соломенная шляпа', 'Somon shlyapa', 'Straw hat'), 350000, '👒', T('Широкие поля, хлопковая лента.', 'Keng hoshiyali, paxta lentali.', 'Wide brim with a cotton band.'), false, 'straw hat'],
    ],
    'step-up': [
      [T('Белые кроссовки', 'Oq krossovkalar', 'White sneakers'), 990000, '👟', T('Натуральная кожа, лёгкая подошва.', 'Tabiiy charm, yengil taglik.', 'Genuine leather, lightweight sole.'), true, 'white sneakers'],
      [T('Классические туфли', 'Klassik tufli', 'Classic heels'), 1200000, '👠', T('Каблук 7 см, мягкая стелька.', '7 sm poshna, yumshoq ichki taglik.', '7 cm heel, cushioned insole.'), true, 'high heels'],
      [T('Кожаные ботинки', 'Charm botinkalar', 'Leather boots'), 1590000, '🥾', T('Тёплые и водоотталкивающие.', 'Issiq va suv o\'tkazmaydi.', 'Warm and water-repellent.'), true, 'leather boots'],
      [T('Мужские оксфорды', 'Erkaklar oksfordlari', 'Men\'s oxfords'), 1350000, '👞', T('Коричневая кожа, ручная работа.', 'Jigarrang charm, qo\'l mehnati.', 'Brown leather, handcrafted.'), true, 'oxford shoes'],
      [T('Летние сандалии', 'Yozgi sandallar', 'Summer sandals'), 450000, '🩴', T('Анатомическая стелька и ремешки.', 'Anatomik taglik va tasmalar.', 'Contoured footbed, adjustable straps.'), true, 'sandals'],
      [T('Балетки', 'Baletkalar', 'Ballet flats'), 520000, '🩰', T('Мягкая кожа, гибкая подошва.', 'Yumshoq charm, egiluvchan taglik.', 'Soft leather, flexible sole.'), false, 'ballet flats shoes'],
    ],
    'bloom-beauty': [
      [T('Увлажняющая сыворотка', 'Namlantiruvchi zardob', 'Hydrating serum'), 290000, '💧', T('Гиалуроновая кислота и пантенол.', 'Gialuron kislotasi va pantenol.', 'Hyaluronic acid and panthenol.'), true, 'serum bottle'],
      [T('Матовая помада', 'Mat lab bo\'yog\'i', 'Matte lipstick'), 180000, '💄', T('Стойкая, не сушит губы, 12 оттенков.', 'Chidamli, labni quritmaydi, 12 rang.', 'Long-wear, non-drying, 12 shades.'), true, 'lipstick'],
      [T('Крем с витамином C', 'C vitaminli krem', 'Vitamin C cream'), 340000, '🧴', T('Дневной крем для сияния кожи.', 'Teriga yorqinlik beruvchi kunduzgi krem.', 'Brightening day cream.'), true, 'face cream jar'],
      [T('Тушь для ресниц', 'Kiprik tushi', 'Mascara'), 160000, '👁️', T('Объём и подкручивание без комочков.', 'Hajm va burama, bo\'laksiz.', 'Volume and curl, no clumps.'), true, 'mascara'],
      [T('Палетка теней', 'Ko\'z soyasi palitrasi', 'Eyeshadow palette'), 380000, '🎨', T('12 тёплых оттенков.', '12 ta iliq rang.', '12 warm shades.'), true, 'eyeshadow palette'],
      [T('Набор кистей', 'Cho\'tkalar to\'plami', 'Brush set'), 260000, '🖌️', T('Пять мягких кистей для макияжа.', 'Pardoz uchun beshta yumshoq cho\'tka.', 'Five soft makeup brushes.'), false, 'makeup brushes'],
    ],
    'vista-optics': [
      [T('Солнцезащитные очки', 'Quyosh ko\'zoynagi', 'Sunglasses'), 650000, '🕶️', T('Поляризация, защита UV400.', 'Polarizatsiya, UV400 himoya.', 'Polarized, UV400 protection.'), true, 'sunglasses'],
      [T('Оправа «Классика»', '«Klassika» gardishi', 'Classic frames'), 790000, '👓', T('Ацетат с черепаховым узором.', 'Toshbaqa naqshli atsetat.', 'Acetate, tortoiseshell pattern.'), true, 'eyeglasses'],
      [T('Очки для компьютера', 'Kompyuter ko\'zoynagi', 'Blue-light glasses'), 420000, '💻', T('Фильтр синего света.', 'Ko\'k nur filtri.', 'Blue-light filter lenses.'), true, 'glasses laptop'],
      [T('Контактные линзы (30 шт.)', 'Kontakt linzalar (30 dona)', 'Daily lenses (30 pcs)'), 280000, '👁️', T('Однодневные, увлажняющие.', 'Bir kunlik, namlantiruvchi.', 'Daily, moisturizing.'), true, 'contact lens'],
      [T('Футляр для очков', 'Ko\'zoynak g\'ilofi', 'Glasses case'), 90000, '👝', T('Жёсткий футляр с салфеткой.', 'Salfetkali qattiq g\'ilof.', 'Hard case with cleaning cloth.'), true, 'glasses case'],
      [T('Спортивные очки', 'Sport ko\'zoynagi', 'Sports glasses'), 560000, '🚴', T('Лёгкие и не запотевают.', 'Yengil va terlamaydi.', 'Lightweight and anti-fog.'), false, 'cycling sunglasses'],
    ],
    'pixel-hub': [
      [T('Ноутбук Air 14″', 'Air 14″ noutbuki', 'Air 14″ laptop'), 14900000, '💻', T('16 ГБ памяти, 18 часов работы.', '16 GB xotira, 18 soat ishlaydi.', '16 GB RAM, 18-hour battery.'), true, 'laptop'],
      [T('Смартфон X 5G', 'X 5G smartfoni', 'Phone X 5G'), 8900000, '📱', T('Экран 120 Гц, тройная камера.', '120 Gts ekran, uchtalik kamera.', '120 Hz screen, triple camera.'), true, 'smartphone'],
      [T('Беспроводные наушники', 'Simsiz quloqchinlar', 'Wireless earbuds'), 1900000, '🎧', T('Шумоподавление, 30 часов с кейсом.', 'Shovqinni bostirish, g\'ilof bilan 30 soat.', 'Noise cancelling, 30 h with the case.'), true, 'wireless earbuds'],
      [T('Смарт-часы S2', 'S2 aqlli soati', 'Smartwatch S2'), 2900000, '⌚', T('GPS, пульс, сон, 7 дней работы.', 'GPS, puls, uyqu, 7 kun ishlaydi.', 'GPS, heart rate, sleep, 7-day battery.'), true, 'smartwatch'],
      [T('Механическая клавиатура', 'Mexanik klaviatura', 'Mechanical keyboard'), 1300000, '⌨️', T('Алюминиевый корпус, RGB-подсветка.', 'Alyumin korpus, RGB yoritgich.', 'Aluminium case, RGB backlight.'), true, 'mechanical keyboard'],
      [T('Экшн-камера 4K', '4K ekshn-kamera', '4K action camera'), 3500000, '📷', T('Водонепроницаемая до 10 м.', '10 m gacha suv o\'tkazmaydi.', 'Waterproof to 10 m.'), false, 'action camera'],
      [T('Беспроводная мышь', 'Simsiz sichqoncha', 'Wireless mouse'), 450000, '🖱️', T('Тихие клики, зарядка USB-C.', 'Ovozsiz bosish, USB-C quvvatlash.', 'Silent clicks, USB-C charging.'), true, 'computer mouse'],
    ],
    'page-turner': [
      [T('Роман «Полуночный атлас»', '«Yarim tun atlasi» romani', 'The Midnight Atlas (novel)'), 120000, '📘', T('Бестселлер о картах и памяти.', 'Xaritalar va xotira haqidagi bestseller.', 'A bestseller about maps and memory.'), true, 'novel book'],
      [T('Кулинарная книга', 'Pazandalik kitobi', 'World cookbook'), 250000, '📗', T('120 домашних рецептов из 40 стран.', '40 mamlakatdan 120 ta uy retsepti.', '120 home recipes from 40 countries.'), true, 'cookbook'],
      [T('Детская книжка', 'Bolalar kitobchasi', 'Picture book'), 75000, '📙', T('Сказка на ночь для детей 2–6 лет.', '2–6 yoshli bolalar uchun uyqu oldi ertagi.', 'A bedtime story for ages 2–6.'), true, 'children book reading'],
      [T('Ежедневник 2027', '2027 kundaligi', 'Planner 2027'), 95000, '📓', T('Недатированный, с трекером привычек.', 'Sanasiz, odat kuzatuvchisi bilan.', 'Undated, with a habit tracker.'), true, 'planner notebook'],
      [T('Сборник стихов', 'She\'rlar to\'plami', 'Poetry collection'), 140000, '📕', T('Современная поэзия в твёрдом переплёте.', 'Qattiq muqovali zamonaviy she\'riyat.', 'Hardcover modern poetry.'), true, 'poetry book'],
      [T('Набор закладок', 'Xatcho\'plar to\'plami', 'Bookmark set'), 35000, '🔖', T('Три кожаные закладки.', 'Uchta charm xatcho\'p.', 'Three leather bookmarks.'), false, 'bookmark'],
    ],
    'stride-sports': [
      [T('Беговые кроссовки', 'Yugurish krossovkalari', 'Running shoes'), 1290000, '👟', T('Амортизация и дышащая сетка.', 'Amortizatsiya va havo o\'tkazuvchi to\'r.', 'Cushioned, with breathable mesh.'), true, 'running shoes'],
      [T('Коврик для йоги', 'Yoga gilamchasi', 'Yoga mat'), 390000, '🧘', T('Натуральный каучук, 5 мм.', 'Tabiiy kauchuk, 5 mm.', 'Natural rubber, 5 mm.'), true, 'yoga mat'],
      [T('Футбольный мяч', 'Futbol to\'pi', 'Football'), 320000, '⚽', T('Матчевый мяч, размер 5.', 'O\'yin to\'pi, 5-o\'lcham.', 'Match ball, size 5.'), true, 'soccer ball'],
      [T('Теннисная ракетка', 'Tennis raketkasi', 'Tennis racket'), 1590000, '🎾', T('Графит, 285 г.', 'Grafit, 285 g.', 'Graphite, 285 g.'), true, 'tennis racket'],
      [T('Гантели 2 × 5 кг', 'Gantellar 2 × 5 kg', 'Dumbbells 2 × 5 kg'), 450000, '🏋️', T('Неопреновое покрытие.', 'Neopren qoplama.', 'Neoprene coated.'), true, 'dumbbells'],
      [T('Спортивная бутылка', 'Sport shishasi', 'Sports bottle'), 180000, '🥤', T('Термобутылка, 750 мл.', 'Termo shisha, 750 ml.', 'Insulated, 750 ml.'), false, 'water bottle gym'],
    ],
    'home-nest': [
      [T('Бархатное кресло', 'Baxmal kreslo', 'Velvet armchair'), 3900000, '🛋️', T('Глубокая посадка, дубовые ножки.', 'Chuqur o\'rindiq, eman oyoqlari.', 'Deep seat, oak legs.'), true, 'velvet armchair'],
      [T('Керамическая ваза', 'Keramik vaza', 'Ceramic vase'), 290000, '🏺', T('Ручная глазурь.', 'Qo\'lda sirlangan.', 'Hand-glazed stoneware.'), true, 'ceramic vase'],
      [T('Настольная лампа', 'Stol chirog\'i', 'Table lamp'), 620000, '💡', T('Тёплый свет, льняной абажур.', 'Iliq yorug\'lik, zig\'ir abajur.', 'Warm light, linen shade.'), true, 'table lamp'],
      [T('Льняное постельное бельё', 'Zig\'ir choyshab to\'plami', 'Linen bedding set'), 1350000, '🛏️', T('Пододеяльник и две наволочки.', 'Ko\'rpa jildi va ikki yostiq jildi.', 'Duvet cover and two pillowcases.'), true, 'linen bedding'],
      [T('Декоративные подушки', 'Bezak yostiqlari', 'Throw cushions'), 240000, '🧶', T('Набор из двух, съёмные чехлы.', 'Ikkitalik to\'plam, yechiladigan jildlar.', 'Set of two, removable covers.'), true, 'throw pillows'],
      [T('Набор посуды', 'Idish-tovoq to\'plami', 'Dinnerware set'), 890000, '🍽️', T('16 предметов из керамики.', 'Keramikadan 16 dona.', '16 pieces of stoneware.'), false, 'dinnerware plates'],
    ],
    'little-stars': [
      [T('Боди для малыша', 'Chaqaloq bodisi', 'Baby bodysuit'), 120000, '👶', T('100% органический хлопок.', '100% organik paxta.', '100% organic cotton.'), true, 'baby clothes'],
      [T('Детская куртка', 'Bolalar kurtkasi', 'Kids\' jacket'), 590000, '🧥', T('Лёгкая и непромокаемая.', 'Yengil va suv o\'tkazmaydi.', 'Light and waterproof.'), true, 'kids jacket'],
      [T('Резиновые сапоги', 'Rezina etiklar', 'Rain boots'), 260000, '🥾', T('Яркие и нескользящие.', 'Yorqin va sirpanmaydi.', 'Bright and non-slip.'), true, 'rain boots'],
      [T('Школьный рюкзак', 'Maktab ryukzagi', 'School backpack'), 420000, '🎒', T('Ортопедическая спинка.', 'Ortopedik orqa qism.', 'Ergonomic back panel.'), true, 'school backpack'],
      [T('Пижама «Звёзды»', '«Yulduzlar» pijamasi', 'Star pyjamas'), 210000, '🌙', T('Мягкий трикотаж.', 'Yumshoq trikotaj.', 'Soft jersey.'), true, 'kids pajamas'],
      [T('Вязаная шапка', 'To\'qilgan shapka', 'Knit hat'), 95000, '🧢', T('Тёплая, с помпоном.', 'Issiq, popukli.', 'Warm, with a pompom.'), false, 'knit beanie'],
    ],
    'toy-planet': [
      [T('Плюшевый мишка', 'Yumshoq ayiqcha', 'Teddy bear'), 250000, '🧸', T('Мягкий, можно стирать.', 'Yumshoq, yuvsa bo\'ladi.', 'Soft and machine-washable.'), true, 'teddy bear'],
      [T('Конструктор, 300 деталей', 'Konstruktor, 300 detal', 'Building blocks, 300 pcs'), 390000, '🧱', T('Совместим с популярными брендами.', 'Mashhur brendlar bilan mos.', 'Compatible with major brands.'), true, 'lego bricks'],
      [T('Деревянная железная дорога', 'Yog\'och temir yo\'l', 'Wooden train set'), 490000, '🚂', T('24 детали и магнитный поезд.', '24 detal va magnitli poyezd.', '24 pieces and a magnetic train.'), true, 'wooden toy train'],
      [T('Пазл, 500 деталей', 'Boshqotirma, 500 detal', 'Puzzle, 500 pcs'), 180000, '🧩', T('Карта мира, от 8 лет.', 'Dunyo xaritasi, 8 yoshdan.', 'World map, ages 8+.'), true, 'jigsaw puzzle'],
      [T('Машинка на пульте', 'Pultli mashina', 'RC car'), 590000, '🏎️', T('20 км/ч, аккумулятор.', '20 km/soat, akkumulyatorli.', '20 km/h, rechargeable.'), true, 'remote control car toy'],
      [T('Набор для рисования', 'Rasm chizish to\'plami', 'Art kit'), 220000, '🎨', T('Краски, мелки и наклейки.', 'Bo\'yoqlar, rangli qalamlar va stikerlar.', 'Paints, crayons and stickers.'), false, 'crayons'],
    ],
    'tasty-terrace': [
      [T('Ташкентский плов', 'Toshkent oshi', 'Tashkent plov'), 45000, '🍚', T('Рис девзира, баранина и морковь.', 'Devzira guruch, qo\'y go\'shti va sabzi.', 'Devzira rice, lamb and carrots.'), true, 'pilaf rice dish'],
      [T('Рамен тонкоцу', 'Tonkotsu ramen', 'Tonkotsu ramen'), 65000, '🍜', T('Насыщенный бульон и яйцо.', 'To\'yimli sho\'rva va tuxum.', 'Rich broth with a soft egg.'), true, 'ramen'],
      [T('Пицца «Маргарита»', '«Margarita» pitsasi', 'Margherita pizza'), 70000, '🍕', T('Из дровяной печи.', 'O\'tin pechidan.', 'Wood-fired.'), true, 'margherita pizza'],
      [T('Бургер', 'Burger', 'Smash burger'), 55000, '🍔', T('Двойная котлета и чеддер.', 'Ikki qavat kotlet va chedder.', 'Double patty and cheddar.'), true, 'burger'],
      [T('Сет суши', 'Sushi to\'plami', 'Sushi platter'), 120000, '🍣', T('12 кусочков от шефа.', 'Oshpazdan 12 bo\'lak.', '12 pieces, chef\'s choice.'), true, 'sushi'],
      [T('Самса', 'Somsa', 'Samsa'), 15000, '🥟', T('Слоёная, с говядиной, из тандыра.', 'Tandirdan, qatlamli, mol go\'shtli.', 'Flaky tandoor pastry with beef.'), true, 'samosa pastry'],
      [T('Бабл-ти', 'Babl-ti', 'Bubble tea'), 35000, '🧋', T('Молочный чай с тапиокой.', 'Tapiokali sutli choy.', 'Milk tea with tapioca.'), false, 'bubble tea'],
    ],
    playverse: [
      [T('Игровая консоль Pro', 'Pro o\'yin konsoli', 'Console Pro'), 6900000, '🎮', T('4K, 120 кадров/с, SSD 1 ТБ.', '4K, 120 kadr/s, 1 TB SSD.', '4K at 120 fps, 1 TB SSD.'), true, 'game console'],
      [T('Геймпад', 'Geympad', 'Wireless controller'), 850000, '🕹️', T('Вибрация, 40 часов работы.', 'Tebranish, 40 soat ishlaydi.', 'Haptics, 40-hour battery.'), true, 'game controller'],
      [T('VR-шлем', 'VR shlemi', 'VR headset'), 5200000, '🥽', T('Автономный, отслеживание рук.', 'Avtonom, qo\'l harakatini kuzatadi.', 'Standalone with hand tracking.'), false, 'vr headset'],
      [T('Игровое кресло', 'O\'yin kreslosi', 'Gaming chair'), 3200000, '💺', T('Поясничная поддержка, наклон 150°.', 'Bel tayanchi, 150° egiladi.', 'Lumbar support, 150° recline.'), true, 'gaming chair'],
      [T('Настольная игра', 'Stol o\'yini', 'Board game'), 390000, '🎲', T('Стратегия для 2–6 игроков.', '2–6 o\'yinchi uchun strategiya.', 'Strategy for 2–6 players.'), true, 'board game'],
      [T('Игровая гарнитура', 'O\'yin garniturasi', 'Gaming headset'), 990000, '🎧', T('Объёмный звук 7.1.', '7.1 hajmli ovoz.', '7.1 surround sound.'), true, 'gaming headset'],
    ],
  };

  /* Paths of the bundled photos (see assets/CREDITS.md). Stores missing from
   * PHOTOS fall back to a gradient; products missing fall back to the emoji. */
  const PHOTOS = global.MALL_PHOTOS || { stores: {}, products: {} };

  function build() {
    const now = Date.now();
    const stores = STORES.map(({ photoQuery, ...s }) => ({
      ...s,
      photo: PHOTOS.stores[s.id] ? `assets/images/stores/${s.id}.jpg` : '',
      cover: '',            // custom cover uploaded in admin (idb:...), overrides `photo`
      logoImage: '',        // custom logo image (idb:...), overrides the emoji
      createdAt: now,
      updatedAt: now,
    }));
    const products = [];
    for (const store of STORES) {
      (PRODUCTS[store.id] || []).forEach(([name, price, emoji, description, inStock], i) => {
        const id = `${store.id}-p${i + 1}`;
        products.push({
          id,
          storeId: store.id,
          name, price, emoji, description, inStock,
          keywords: T('', '', ''),
          images: PHOTOS.products[id] ? [`assets/images/products/${id}.jpg`] : [],
          createdAt: now,
          updatedAt: now - i * 60000,
        });
      });
    }
    return { version: 2, stores, products };
  }

  /** Raw lists for tooling (photo download script) and tests. */
  function sources() {
    return {
      stores: STORES.map((s) => ({ id: s.id, query: s.photoQuery })),
      products: STORES.flatMap((s) => (PRODUCTS[s.id] || []).map((p, i) => ({ id: `${s.id}-p${i + 1}`, query: p[5] }))),
    };
  }

  global.MALL_DEMO_DATA = { build, sources };
})(window);

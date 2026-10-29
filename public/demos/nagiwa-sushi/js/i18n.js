/*
 * Nagiwa — all site texts.
 *
 * I18N  — interface texts for each language (uz, ru, en).
 *         Keys match the data-i18n / data-i18n-alt / data-i18n-aria attributes in index.html.
 * MENU  — dishes: photo, price and the name/description in every language.
 *
 * "Nagiwa" is a brand name and is never translated.
 */

window.I18N = {
  uz: {
    meta: {
      title: 'Nagiwa — Yapon oshxonasi va sushi bar',
      description: 'Nagiwa — qo‘lda tayyorlangan sushi, rollar va sashimi. Yangi baliq, osoyishta muhit va tezkor yetkazib berish.'
    },
    a11y: {
      skip: 'Asosiy mazmunga o‘tish',
      lang: 'Tilni tanlash',
      menuOpen: 'Menyuni ochish',
      menuClose: 'Menyuni yopish',
      footerNav: 'Sayt bo‘limlari'
    },
    nav: {
      about: 'Biz haqimizda',
      menu: 'Menyu',
      why: 'Afzalliklar',
      gallery: 'Galereya',
      contacts: 'Aloqa'
    },
    hero: {
      eyebrow: 'Yapon oshxonasi · Sushi bar',
      tagline: 'Yangi baliq, iliq guruch va oshpaz pichog‘ining sokin mahorati.',
      cta: 'Menyu',
      cta2: 'Bog‘lanish',
      scroll: 'Pastga'
    },
    about: {
      eyebrow: 'Biz haqimizda',
      title: 'Qo‘lda, har bir bo‘lakni alohida tayyorlaymiz',
      p1: 'Nagiwa kichik bir peshtaxta va oddiy qoidadan boshlangan: faqat o‘zimiz ham mamnuniyat bilan yeydigan taomni tortamiz. Oshpazlarimiz baliqni ko‘z o‘ngingizda kesadi, guruchni qo‘lda tayyorlaydi va har bir bo‘lakni dasturxonga tortishdan sal oldin shakllantiradi.',
      p2: 'Zalimiz osoyishta, menyumiz esa ixcham — baliqning ta’mi o‘zi gapirsin. Tezkor tushlikka kiring yoki uzoq kechki ovqatga qoling: har qanday holda sizni qadrdon mehmondek kutib olamiz.'
    },
    menu: {
      eyebrow: 'Menyu',
      title: 'Mavsum ta’mi',
      note: 'Narxlar AQSh dollarida ko‘rsatilgan va namuna sifatida berilgan.',
      tabsLabel: 'Menyu bo‘limlari',
      pcs: 'dona',
      cats: {
        rolls: 'Rollar',
        nigiri: 'Nigiri',
        sashimi: 'Sashimi',
        sets: 'Setlar',
        drinks: 'Ichimliklar'
      }
    },
    why: {
      eyebrow: 'Nega aynan biz',
      title: 'Har bir mayda detalga e’tibor',
      items: [
        { title: 'Har kuni yangi baliq', text: 'Sovutilgan baliq har tong yetkaziladi — sashimi uchun hech qachon muzlatilganini ishlatmaymiz.' },
        { title: 'Tajribali oshpazlar', text: 'Oshpazlarimiz guruchdan tortib pichoqqacha klassik yapon uslubini o‘rgangan.' },
        { title: 'Tezkor yetkazib berish', text: 'Ehtiyotkorlik bilan qadoqlab, bir soat ichida eshigingizgacha yetkazamiz.' },
        { title: 'Osoyishta muhit', text: 'Yumshoq yorug‘lik, sokin musiqa va bemalol suhbat uchun joy.' }
      ]
    },
    gallery: {
      eyebrow: 'Galereya',
      title: 'Ichkariga bir nazar',
      dialog: 'Rasmni kattalashtirib ko‘rish',
      close: 'Yopish',
      prev: 'Oldingi rasm',
      next: 'Keyingi rasm'
    },
    contacts: {
      eyebrow: 'Aloqa',
      title: 'Biz bilan bog‘laning',
      lead: 'Stol band qilish, yetkazib berish haqida so‘rash yoki shunchaki salom yo‘llash — doim aloqadamiz.',
      phone: { label: 'Telefon', caption: 'Qo‘ng‘iroq qiling' },
      telegram: { caption: 'Telegramda yozing' },
      instagram: { caption: 'Bizni kuzating' },
      whatsapp: { caption: 'WhatsAppda yozing' },
      address: { label: 'Manzil', caption: 'Xaritada toping' },
      hours: { label: 'Ish vaqti', caption: 'Ish vaqtini bilish' }
    },
    footer: {
      tagline: 'Qo‘lda tayyorlangan yapon taomlari.',
      rights: 'Barcha huquqlar himoyalangan.'
    },
    alt: {
      hero: 'Qorong‘i fonda yog‘och taglikdagi rollar va losos nigiri',
      about: 'Oshpaz peshtaxtada sushi tayyorlamoqda',
      gallery: {
        salmonMaki: 'Losos sushi, maki rollar va qizil cho‘pchalar',
        chopsticksRoll: 'Qizil cho‘pchalarda turgan roll',
        izakaya: 'Fonarlar osilgan yapon izakayasi',
        chefHands: 'Oshpaz qo‘lda losos roll o‘ramoqda',
        handroll: 'Qora likopchadagi qo‘l roli (temaki)',
        crispyRolls: 'Souslar bilan qarsildoq rollar',
        sushiBar: 'Yapon sushi barining ichki ko‘rinishi',
        salmonDark: 'Soya sousi va cho‘pchalar bilan losos sushi',
        lanterns: 'Qog‘oz fonarlar bilan yoritilgan restoran zali'
      }
    }
  },

  ru: {
    meta: {
      title: 'Nagiwa — японская кухня и суши-бар',
      description: 'Nagiwa — суши, роллы и сашими ручной работы. Свежая рыба, спокойная атмосфера и быстрая доставка.'
    },
    a11y: {
      skip: 'Перейти к содержанию',
      lang: 'Выбор языка',
      menuOpen: 'Открыть меню',
      menuClose: 'Закрыть меню',
      footerNav: 'Разделы сайта'
    },
    nav: {
      about: 'О нас',
      menu: 'Меню',
      why: 'Почему мы',
      gallery: 'Галерея',
      contacts: 'Контакты'
    },
    hero: {
      eyebrow: 'Японская кухня · Суши-бар',
      tagline: 'Свежая рыба, тёплый рис и тихое мастерство поварского ножа.',
      cta: 'Меню',
      cta2: 'Связаться',
      scroll: 'Листайте'
    },
    about: {
      eyebrow: 'О нас',
      title: 'Ручная работа — кусочек за кусочком',
      p1: 'Nagiwa начинался с небольшой стойки и простого правила: подавать только то, что мы с удовольствием съели бы сами. Наши повара разделывают рыбу у вас на глазах, готовят рис вручную и формируют каждый кусочек прямо перед подачей.',
      p2: 'У нас спокойный зал и короткое меню — чтобы вкус рыбы говорил сам за себя. Заглядывайте на быстрый обед или оставайтесь на долгий ужин: в любом случае вас встретят как старого друга.'
    },
    menu: {
      eyebrow: 'Меню',
      title: 'Вкус сезона',
      note: 'Цены указаны в долларах США и приведены для примера.',
      tabsLabel: 'Разделы меню',
      pcs: 'шт.',
      cats: {
        rolls: 'Роллы',
        nigiri: 'Нигири',
        sashimi: 'Сашими',
        sets: 'Сеты',
        drinks: 'Напитки'
      }
    },
    why: {
      eyebrow: 'Почему мы',
      title: 'Мелочи, сделанные правильно',
      items: [
        { title: 'Свежая рыба каждый день', text: 'Охлаждённую рыбу привозят каждое утро — для сашими мы никогда не берём замороженную.' },
        { title: 'Повара с настоящей школой', text: 'Наши повара учились классической японской технике — от риса до ножа.' },
        { title: 'Быстрая доставка', text: 'Аккуратно упакуем и привезём к вашей двери в течение часа.' },
        { title: 'Спокойная атмосфера', text: 'Мягкий свет, негромкая музыка и место для неспешного разговора.' }
      ]
    },
    gallery: {
      eyebrow: 'Галерея',
      title: 'Загляните к нам',
      dialog: 'Просмотр фотографии',
      close: 'Закрыть',
      prev: 'Предыдущее фото',
      next: 'Следующее фото'
    },
    contacts: {
      eyebrow: 'Контакты',
      title: 'Как с нами связаться',
      lead: 'Забронировать стол, узнать о доставке или просто передать привет — мы всегда на связи.',
      phone: { label: 'Телефон', caption: 'Позвоните нам' },
      telegram: { caption: 'Напишите в Telegram' },
      instagram: { caption: 'Подпишитесь на нас' },
      whatsapp: { caption: 'Напишите в WhatsApp' },
      address: { label: 'Адрес', caption: 'Найдите нас на карте' },
      hours: { label: 'Часы работы', caption: 'Узнать часы работы' }
    },
    footer: {
      tagline: 'Японская кухня ручной работы.',
      rights: 'Все права защищены.'
    },
    alt: {
      hero: 'Роллы и нигири с лососем на деревянной подставке на тёмном фоне',
      about: 'Повар готовит суши за стойкой',
      gallery: {
        salmonMaki: 'Суши с лососем, маки и красные палочки',
        chopsticksRoll: 'Ролл, лежащий на красных палочках',
        izakaya: 'Японская идзакая с фонарями',
        chefHands: 'Повар вручную сворачивает ролл с лососем',
        handroll: 'Хэндролл (темаки) на чёрной тарелке',
        crispyRolls: 'Хрустящие роллы с соусами',
        sushiBar: 'Интерьер японского суши-бара',
        salmonDark: 'Суши с лососем, соевым соусом и палочками',
        lanterns: 'Зал ресторана с бумажными фонарями'
      }
    }
  },

  en: {
    meta: {
      title: 'Nagiwa — Japanese Cuisine & Sushi Bar',
      description: 'Nagiwa — handmade sushi, rolls and sashimi. Fresh fish, a calm room and fast delivery.'
    },
    a11y: {
      skip: 'Skip to content',
      lang: 'Choose language',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      footerNav: 'Site sections'
    },
    nav: {
      about: 'About',
      menu: 'Menu',
      why: 'Why us',
      gallery: 'Gallery',
      contacts: 'Contacts'
    },
    hero: {
      eyebrow: 'Japanese cuisine · Sushi bar',
      tagline: 'Fresh fish, warm rice and the quiet craft of the knife.',
      cta: 'Menu',
      cta2: 'Get in touch',
      scroll: 'Scroll'
    },
    about: {
      eyebrow: 'About us',
      title: 'Made by hand, one piece at a time',
      p1: 'Nagiwa began with a small counter and a simple rule: serve only what we would be proud to eat ourselves. Our chefs cut the fish in front of you, season the rice by hand and shape every piece just before it reaches your plate.',
      p2: 'We keep the room calm and the menu short, so the fish can speak for itself. Drop in for a quick lunch or stay for a long dinner — either way, you will be welcomed like a regular.'
    },
    menu: {
      eyebrow: 'Menu',
      title: 'A taste of the season',
      note: 'Prices are in US dollars and shown as examples.',
      tabsLabel: 'Menu categories',
      pcs: 'pcs',
      cats: {
        rolls: 'Rolls',
        nigiri: 'Nigiri',
        sashimi: 'Sashimi',
        sets: 'Sets',
        drinks: 'Drinks'
      }
    },
    why: {
      eyebrow: 'Why us',
      title: 'Small details, done right',
      items: [
        { title: 'Fresh fish, every day', text: 'Chilled fish arrives every morning — we never use frozen fish for sashimi.' },
        { title: 'Properly trained chefs', text: 'Our chefs learned classic Japanese technique, from the rice to the knife.' },
        { title: 'Fast delivery', text: 'Packed with care and at your door within the hour.' },
        { title: 'A calm room', text: 'Soft light, quiet music and space for an unhurried conversation.' }
      ]
    },
    gallery: {
      eyebrow: 'Gallery',
      title: 'A look inside',
      dialog: 'Photo viewer',
      close: 'Close',
      prev: 'Previous photo',
      next: 'Next photo'
    },
    contacts: {
      eyebrow: 'Contacts',
      title: 'How to reach us',
      lead: 'Book a table, ask about delivery or just say hello — we are always happy to hear from you.',
      phone: { label: 'Phone', caption: 'Call us' },
      telegram: { caption: 'Message us on Telegram' },
      instagram: { caption: 'Follow us' },
      whatsapp: { caption: 'Message us on WhatsApp' },
      address: { label: 'Address', caption: 'Find us on the map' },
      hours: { label: 'Opening hours', caption: 'See our opening hours' }
    },
    footer: {
      tagline: 'Japanese cuisine, made by hand.',
      rights: 'All rights reserved.'
    },
    alt: {
      hero: 'Sushi rolls and salmon nigiri on a wooden stand against a dark background',
      about: 'A chef preparing sushi at the counter',
      gallery: {
        salmonMaki: 'Salmon sushi, maki rolls and red chopsticks',
        chopsticksRoll: 'A sushi roll resting on red chopsticks',
        izakaya: 'A Japanese izakaya with paper lanterns',
        chefHands: 'A chef rolling a salmon roll by hand',
        handroll: 'A temaki hand roll on a black plate',
        crispyRolls: 'Crispy rolls with dipping sauces',
        sushiBar: 'Inside a Japanese sushi bar',
        salmonDark: 'Salmon sushi with soy sauce and chopsticks',
        lanterns: 'A restaurant room lit by paper lanterns'
      }
    }
  }
};

/*
 * Menu. Prices are example prices in US dollars.
 * img  — file in images/
 * pcs  — pieces per portion (leave out for drinks)
 */
window.MENU = {
  rolls: [
    { img: 'roll-philadelphia.jpg', price: 7.00, pcs: 8,
      uz: { name: 'Filadelfiya', desc: 'Losos, qaymoqli pishloq va bodring — teskari o‘ralgan klassik roll.' },
      ru: { name: 'Филадельфия', desc: 'Лосось, сливочный сыр и огурец — классический ролл наизнанку.' },
      en: { name: 'Philadelphia', desc: 'Salmon, cream cheese and cucumber in a classic inside-out roll.' } },
    { img: 'roll-dragon.jpg', price: 8.00, pcs: 8,
      uz: { name: 'Dragon', desc: 'Tempuradagi krevetka va avokado, ustida dudlangan ilonbaliq va unagi sousi.' },
      ru: { name: 'Дракон', desc: 'Креветка в темпуре и авокадо под копчёным угрём и соусом унаги.' },
      en: { name: 'Dragon', desc: 'Tempura shrimp and avocado under smoked eel and unagi sauce.' } },
    { img: 'roll-tempura.jpg', price: 6.50, pcs: 8,
      uz: { name: 'Issiq tempura roll', desc: 'Losos va qaymoqli pishloqli qarsildoq roll, iliq holda tortiladi.' },
      ru: { name: 'Тёплый темпура-ролл', desc: 'Хрустящий ролл с лососем и сливочным сыром, подаётся тёплым.' },
      en: { name: 'Hot Tempura Roll', desc: 'A crisp golden roll with salmon and cream cheese, served warm.' } },
    { img: 'roll-spicy-salmon.jpg', price: 6.00, pcs: 8,
      uz: { name: 'Achchiq losos', desc: 'Maydalangan losos, achchiq mayonez, bodring va qovurilgan kunjut.' },
      ru: { name: 'Спайси лосось', desc: 'Рубленый лосось с острым майонезом, огурцом и обжаренным кунжутом.' },
      en: { name: 'Spicy Salmon', desc: 'Chopped salmon with chilli mayo, cucumber and toasted sesame.' } },
    { img: 'roll-futomaki.jpg', price: 7.50, pcs: 8,
      uz: { name: 'Futomaki', desc: 'Qisqichbaqa, tamago omleti, bodring va qizil ikrali katta roll.' },
      ru: { name: 'Футомаки', desc: 'Большой ролл с крабом, омлетом тамаго, огурцом и красной икрой.' },
      en: { name: 'Futomaki', desc: 'A generous roll with crab, tamago omelette, cucumber and ikura.' } },
    { img: 'roll-sake-maki.jpg', price: 3.50, pcs: 6,
      uz: { name: 'Sake maki', desc: 'Yangi losos va nori bilan klassik ingichka roll.' },
      ru: { name: 'Сяке маки', desc: 'Классический тонкий ролл со свежим лососем и нори.' },
      en: { name: 'Sake Maki', desc: 'A classic thin roll with fresh salmon wrapped in nori.' } }
  ],
  nigiri: [
    { img: 'nigiri-classic.jpg', price: 3.00, pcs: 2,
      uz: { name: 'Lososli nigiri', desc: 'Qo‘lda shakllangan guruch ustida yangi losos va ko‘k piyoz.' },
      ru: { name: 'Нигири с лососем', desc: 'Свежий лосось на рисе ручной лепки с зелёным луком.' },
      en: { name: 'Sake Nigiri', desc: 'Fresh salmon over hand-pressed rice, finished with chives.' } },
    { img: 'nigiri-tuna.jpg', price: 4.00, pcs: 2,
      uz: { name: 'Tunetsli nigiri', desc: 'Yumshoq tunets va bir chimdim vasabi.' },
      ru: { name: 'Нигири с тунцом', desc: 'Нежный тунец и капля васаби.' },
      en: { name: 'Maguro Nigiri', desc: 'Lean, silky tuna with a touch of wasabi.' } },
    { img: 'nigiri-aburi.jpg', price: 3.50, pcs: 2,
      uz: { name: 'Aburi losos', desc: 'Olovda biroz kuydirilgan losos, qarsildoq piyoz va shirin soya sousi.' },
      ru: { name: 'Абури с лососем', desc: 'Лосось, опалённый на огне, с хрустящим луком и сладким соевым соусом.' },
      en: { name: 'Aburi Salmon', desc: 'Flame-seared salmon with crispy onion and sweet soy.' } },
    { img: 'nigiri-salmon.jpg', price: 3.50, pcs: 2,
      uz: { name: 'Losos va yuzu kremi', desc: 'Yuzu kremi va ko‘k piyoz bilan losos nigiri.' },
      ru: { name: 'Лосось с юдзу-кремом', desc: 'Нигири с лососем, кремом юдзу и зелёным луком.' },
      en: { name: 'Salmon & Yuzu Cream', desc: 'Salmon nigiri topped with yuzu cream and spring onion.' } },
    { img: 'nigiri-assorted.jpg', price: 9.00, pcs: 5,
      uz: { name: 'Oshpaz tanlovi', desc: 'Bugungi baliqdan oshpaz tanlagan besh xil nigiri.' },
      ru: { name: 'Нигири от шефа', desc: 'Пять нигири из сегодняшнего улова на выбор шефа.' },
      en: { name: 'Chef’s Selection', desc: 'Five nigiri chosen by the chef from today’s catch.' } }
  ],
  sashimi: [
    { img: 'sashimi-salmon.jpg', price: 6.50, pcs: 6,
      uz: { name: 'Losos sashimi', desc: 'Qalin kesilgan norveg lososi, daykon va shiso bargi bilan.' },
      ru: { name: 'Сашими из лосося', desc: 'Толсто нарезанный норвежский лосось с дайконом и листом сисо.' },
      en: { name: 'Salmon Sashimi', desc: 'Thick-cut Norwegian salmon with daikon and shiso.' } },
    { img: 'sashimi-assorted.jpg', price: 10.50, pcs: 9,
      uz: { name: 'Sashimi moriavase', desc: 'Tunets, losos, sibas va grebeshok — oshpazdan assorti.' },
      ru: { name: 'Сашими моривасэ', desc: 'Тунец, лосось, сибас и гребешок — ассорти от шефа.' },
      en: { name: 'Sashimi Moriawase', desc: 'Tuna, salmon, sea bass and scallop — the chef’s assortment.' } },
    { img: 'sashimi-garnish.jpg', price: 7.00, pcs: 6,
      uz: { name: 'Yuzuli aburi losos', desc: 'Biroz kuydirilgan losos, yuzu ponzu va ozgina qizil ikra.' },
      ru: { name: 'Опалённый лосось с юдзу', desc: 'Слегка обожжённый лосось, понзу с юдзу и немного икры.' },
      en: { name: 'Seared Salmon & Yuzu', desc: 'Lightly torched salmon with yuzu ponzu and a little ikura.' } },
    { img: 'sashimi-platter.jpg', price: 8.00, pcs: 6,
      uz: { name: 'Losos va ikra', desc: 'Qizil ikra bilan bezatilgan losos bo‘laklari, yog‘och patnisda.' },
      ru: { name: 'Лосось с икрой', desc: 'Ломтики лосося с красной икрой на деревянной доске.' },
      en: { name: 'Salmon & Ikura', desc: 'Salmon slices crowned with salmon roe, served on a wooden tray.' } }
  ],
  sets: [
    { img: 'set-premium.jpg', price: 31.00, pcs: 32,
      uz: { name: 'Nagiwa seti', desc: 'Bizning maxsus setimiz: sashimi, rollar va nigiri — 2–3 kishi uchun.' },
      ru: { name: 'Сет Nagiwa', desc: 'Фирменный сет: сашими, роллы и нигири — на 2–3 персоны.' },
      en: { name: 'Nagiwa Set', desc: 'Our signature board of sashimi, rolls and nigiri — for 2–3 guests.' } },
    { img: 'set-classic.jpg', price: 17.50, pcs: 24,
      uz: { name: 'Klassik set', desc: 'Filadelfiya, futomaki va sake maki — eng sevimli rollar bir joyda.' },
      ru: { name: 'Классический сет', desc: 'Филадельфия, футомаки и сяке маки — самые любимые роллы вместе.' },
      en: { name: 'Classic Set', desc: 'Philadelphia, futomaki and sake maki — the favourites together.' } },
    { img: 'set-duo.jpg', price: 20.50, pcs: 20,
      uz: { name: 'Ikki kishilik set', desc: 'Nigiri, losos rollari va ikkita miso sho‘rva — ikki kishi uchun.' },
      ru: { name: 'Сет на двоих', desc: 'Нигири, роллы с лососем и два мисо-супа — для романтического ужина.' },
      en: { name: 'Set for Two', desc: 'Nigiri, salmon rolls and two miso soups — made for sharing.' } },
    { img: 'set-stone.jpg', price: 12.00, pcs: 18,
      uz: { name: 'Maki set', desc: 'Uch xil ingichka roll: losos, bodring va avokado.' },
      ru: { name: 'Маки-сет', desc: 'Три тонких ролла: с лососем, огурцом и авокадо.' },
      en: { name: 'Maki Set', desc: 'Three thin rolls: salmon, cucumber and avocado.' } }
  ],
  drinks: [
    { img: 'drink-matcha.jpg', price: 3.50,
      uz: { name: 'Marosim matchasi', desc: 'Uji matchasi buyurtmangizdan so‘ng bambuk ko‘pirtirgichda tayyorlanadi.' },
      ru: { name: 'Церемониальный матча', desc: 'Матча из Удзи, взбиваем бамбуковым венчиком прямо при вас.' },
      en: { name: 'Ceremonial Matcha', desc: 'Uji matcha, whisked to order with a bamboo whisk.' } },
    { img: 'drink-sencha.jpg', price: 3.00,
      uz: { name: 'Sencha', desc: 'Sopol choynakda tortiladigan yapon ko‘k choyi.' },
      ru: { name: 'Сенча', desc: 'Японский зелёный чай в глиняном чайнике.' },
      en: { name: 'Sencha', desc: 'Japanese green tea, served in a clay teapot.' } },
    { img: 'drink-sake.jpg', price: 6.50,
      uz: { name: 'Junmai sake', desc: 'Yumshoq guruch sakesi, iliq yoki sovutilgan holda. 180 ml.' },
      ru: { name: 'Саке дзюнмай', desc: 'Мягкое рисовое саке, тёплое или охлаждённое. 180 мл.' },
      en: { name: 'Junmai Sake', desc: 'Smooth rice sake, served warm or chilled. 180 ml.' } },
    { img: 'drink-iced-matcha.jpg', price: 3.00,
      uz: { name: 'Muzli matcha latte', desc: 'Matcha, sut va muz — yengil shirinlik bilan.' },
      ru: { name: 'Айс матча латте', desc: 'Матча, молоко и лёд — слегка сладкий.' },
      en: { name: 'Iced Matcha Latte', desc: 'Matcha, milk and ice — lightly sweet.' } }
  ]
};

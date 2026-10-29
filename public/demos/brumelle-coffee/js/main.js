(() => {
  "use strict";

  /* ================= Content ================= */
  const I18N = {
    ru: {
      "meta.title": "Brumelle — кофейня в Ташкенте",
      "meta.desc": "Brumelle — уютная кофейня в Ташкенте. Спешелти кофе, чай, десерты.",
      "a11y.skip": "Перейти к содержимому", "a11y.prev": "Назад", "a11y.next": "Вперёд", "a11y.close": "Закрыть",
      "nav.signature": "Хиты", "nav.menu": "Меню", "nav.about": "О нас", "nav.contacts": "Контакты",
      "nav.toggle": "Открыть меню",
      "hero.eyebrow": "Кофейня в Ташкенте",
      "hero.slogan": "Кофе, ради которого стоит проснуться",
      "hero.text": "Обжариваем зерно небольшими партиями, варим с вниманием к каждой чашке и печём десерты каждое утро.",
      "hero.cta": "Смотреть меню", "hero.call": "Позвонить",
      "hero.hours": "Пн–Пт 08:00–23:00 · Сб–Вс 09:00–00:00", "hero.place": "ул. Амира Темура, 24",
      "marquee": ["Спешелти кофе", "Свежая обжарка", "Домашние десерты", "Уютная атмосфера", "Завтраки с 8:00"],
      "sig.eyebrow": "Выбор гостей", "sig.title": "Наши <em>хиты</em>",
      "menu.eyebrow": "Меню", "menu.title": "Что мы <em>готовим</em>",
      "menu.text": "Зерно из Эфиопии и Колумбии, свежее молоко и альтернативное на выбор.",
      "menu.note": "Альтернативное молоко (овсяное, миндальное, кокосовое) — +$0.50. Сироп — +$0.25.",
      "cat.coffee": "Кофе", "cat.tea": "Чай", "cat.cold": "Холодные", "cat.desserts": "Десерты",
      "about.eyebrow": "О кофейне", "about.title": "Место, где время <em>замедляется</em>",
      "about.p1": "Brumelle открылся в 2021 году как маленькая стойка на десять мест. Нам хотелось сделать место, куда заходят не за кофе навынос, а чтобы задержаться: с книгой, ноутбуком или старым другом.",
      "about.p2": "Наши бариста постоянно учатся и участвуют в чемпионатах. Десерты мы готовим сами, а в меню всегда есть сезонные напитки на местных фруктах и специях.",
      "about.s1": "сортов зерна в год", "about.s2": "посадочных мест", "about.s3": "чашек в день",
      "process.eyebrow": "Как мы работаем", "process.title": "От зерна <em>до чашки</em>",
      "process.s1t": "Отбор зерна", "process.s1d": "Работаем с фермами Эфиопии, Колумбии и Бразилии. Каждую партию пробуем на каппинге.",
      "process.s2t": "Свежая обжарка", "process.s2d": "Обжариваем небольшими партиями раз в неделю, чтобы зерно раскрывалось на пике вкуса.",
      "process.s3t": "Идеальная чашка", "process.s3d": "Бариста настраивают помол каждое утро и следят за температурой молока до градуса.",
      "gallery.eyebrow": "Атмосфера", "gallery.title": "Загляните <em>к нам</em>",
      "contacts.eyebrow": "Контакты", "contacts.title": "Заходите <em>в гости</em>",
      "contacts.address": "Адрес",
      "contacts.addressText": "г. Ташкент, Юнусабадский р-н, ул. Амира Темура, 24",
      "contacts.landmark": "Ориентир: напротив Tashkent City Mall",
      "contacts.yandex": "Яндекс Карты", "contacts.google": "Google Maps",
      "contacts.phone": "Телефон", "contacts.phoneText": "Бронь столика и заказы навынос",
      "contacts.hours": "Часы работы", "contacts.weekdays": "Пн–Пт", "contacts.weekend": "Сб–Вс",
      "contacts.open": "Сейчас открыто", "contacts.closed": "Сейчас закрыто",
      "footer.cta": "Ждём вас <em>на чашку</em>", "footer.book": "Забронировать столик",
      "footer.rights": "Все права защищены.", "footer.photos": "Фото:",
      "alt.barista": "Бариста готовит кофе через пуровер", "alt.interior": "Зал кофейни с деревянными столами",
      "alt.g1": "Светлый зал кофейни с растениями", "alt.g2": "Два капучино с латте-артом",
      "alt.g3": "Холдеры с молотым кофе и зерном", "alt.g4": "Барная стойка с кофемашиной",
      "alt.g5": "Обжаренные кофейные зёрна", "alt.g6": "Вывеска CAFE в зале"
    },
    uz: {
      "meta.title": "Brumelle — Toshkentdagi qahvaxona",
      "meta.desc": "Brumelle — Toshkentdagi shinam qahvaxona. Speshelti qahva, choy, desertlar.",
      "a11y.skip": "Asosiy qismga oʻtish", "a11y.prev": "Orqaga", "a11y.next": "Oldinga", "a11y.close": "Yopish",
      "nav.signature": "Xitlar", "nav.menu": "Menyu", "nav.about": "Biz haqimizda", "nav.contacts": "Aloqa",
      "nav.toggle": "Menyuni ochish",
      "hero.eyebrow": "Toshkentdagi qahvaxona",
      "hero.slogan": "Uygʻonishga arziydigan qahva",
      "hero.text": "Donni kichik partiyalarda qovuramiz, har bir finjonga eʼtibor bilan damlaymiz va har tong desert pishiramiz.",
      "hero.cta": "Menyuni koʻrish", "hero.call": "Qoʻngʻiroq qilish",
      "hero.hours": "Du–Ju 08:00–23:00 · Sh–Ya 09:00–00:00", "hero.place": "Amir Temur koʻchasi, 24",
      "marquee": ["Speshelti qahva", "Yangi qovurilgan don", "Uy desertlari", "Shinam muhit", "Nonushta 8:00 dan"],
      "sig.eyebrow": "Mehmonlar tanlovi", "sig.title": "Bizning <em>xitlar</em>",
      "menu.eyebrow": "Menyu", "menu.title": "Biz nima <em>tayyorlaymiz</em>",
      "menu.text": "Efiopiya va Kolumbiya donlari, yangi sut yoki tanlov boʻyicha oʻsimlik suti.",
      "menu.note": "Oʻsimlik suti (suli, bodom, kokos) — +$0.50. Sirop — +$0.25.",
      "cat.coffee": "Qahva", "cat.tea": "Choy", "cat.cold": "Sovuq", "cat.desserts": "Desertlar",
      "about.eyebrow": "Qahvaxona haqida", "about.title": "Vaqt <em>sekinlashadigan</em> joy",
      "about.p1": "Brumelle 2021-yilda oʻn oʻrinli kichik peshtaxta sifatida ochilgan. Biz olib ketish uchun emas, balki kitob, noutbuk yoki eski doʻst bilan uzoqroq oʻtirish uchun keladigan joy yaratmoqchi edik.",
      "about.p2": "Baristalarimiz doimo oʻqiydi va chempionatlarda qatnashadi. Desertlarni oʻzimiz tayyorlaymiz, menyuda esa doim mahalliy mevalar va ziravorlardan mavsumiy ichimliklar bor.",
      "about.s1": "yiliga don navi", "about.s2": "oʻrindiq", "about.s3": "kuniga finjon",
      "process.eyebrow": "Qanday ishlaymiz", "process.title": "Dondan <em>finjongacha</em>",
      "process.s1t": "Don tanlash", "process.s1d": "Efiopiya, Kolumbiya va Braziliya fermalari bilan ishlaymiz. Har bir partiyani kapping orqali tatib koʻramiz.",
      "process.s2t": "Yangi qovurish", "process.s2d": "Donni haftada bir marta kichik partiyalarda qovuramiz, shunda u taʼmining choʻqqisida ochiladi.",
      "process.s3t": "Mukammal finjon", "process.s3d": "Baristalar har tong maydalashni sozlaydi va sut haroratini aniq kuzatadi.",
      "gallery.eyebrow": "Muhit", "gallery.title": "Bizga <em>kirib keting</em>",
      "contacts.eyebrow": "Aloqa", "contacts.title": "Mehmonga <em>keling</em>",
      "contacts.address": "Manzil",
      "contacts.addressText": "Toshkent sh., Yunusobod tumani, Amir Temur koʻchasi, 24",
      "contacts.landmark": "Moʻljal: Tashkent City Mall qarshisida",
      "contacts.yandex": "Yandex Xaritalar", "contacts.google": "Google Maps",
      "contacts.phone": "Telefon", "contacts.phoneText": "Stol band qilish va olib ketish uchun buyurtma",
      "contacts.hours": "Ish vaqti", "contacts.weekdays": "Du–Ju", "contacts.weekend": "Sh–Ya",
      "contacts.open": "Hozir ochiq", "contacts.closed": "Hozir yopiq",
      "footer.cta": "Sizni bir finjon <em>qahvaga</em> kutamiz", "footer.book": "Stol band qilish",
      "footer.rights": "Barcha huquqlar himoyalangan.", "footer.photos": "Suratlar:",
      "alt.barista": "Barista pur-over usulida qahva damlamoqda", "alt.interior": "Yogʻoch stollar qoʻyilgan qahvaxona zali",
      "alt.g1": "Oʻsimliklar bilan yorugʻ qahvaxona zali", "alt.g2": "Latte-artli ikki kapuchino",
      "alt.g3": "Maydalangan qahva va don solingan xolderlar", "alt.g4": "Qahva mashinasi turgan bar peshtaxtasi",
      "alt.g5": "Qovurilgan qahva donlari", "alt.g6": "Zaldagi CAFE yozuvi"
    },
    en: {
      "meta.title": "Brumelle — coffee shop in Tashkent",
      "meta.desc": "Brumelle is a cozy coffee shop in Tashkent. Specialty coffee, tea and desserts.",
      "a11y.skip": "Skip to content", "a11y.prev": "Previous", "a11y.next": "Next", "a11y.close": "Close",
      "nav.signature": "Favourites", "nav.menu": "Menu", "nav.about": "About", "nav.contacts": "Contacts",
      "nav.toggle": "Open menu",
      "hero.eyebrow": "Coffee shop in Tashkent",
      "hero.slogan": "Coffee worth waking up for",
      "hero.text": "We roast in small batches, brew every cup with care and bake our desserts fresh each morning.",
      "hero.cta": "See the menu", "hero.call": "Call us",
      "hero.hours": "Mon–Fri 08:00–23:00 · Sat–Sun 09:00–00:00", "hero.place": "24 Amir Temur St.",
      "marquee": ["Specialty coffee", "Freshly roasted", "Homemade desserts", "Cozy atmosphere", "Breakfast from 8:00"],
      "sig.eyebrow": "Guest favourites", "sig.title": "Our <em>signatures</em>",
      "menu.eyebrow": "Menu", "menu.title": "What we <em>make</em>",
      "menu.text": "Beans from Ethiopia and Colombia, fresh dairy or plant-based milk of your choice.",
      "menu.note": "Plant-based milk (oat, almond, coconut) +$0.50. Syrup +$0.25.",
      "cat.coffee": "Coffee", "cat.tea": "Tea", "cat.cold": "Cold", "cat.desserts": "Desserts",
      "about.eyebrow": "About us", "about.title": "A place where time <em>slows down</em>",
      "about.p1": "Brumelle opened in 2021 as a tiny ten-seat bar. We wanted a place people come to stay, not just grab a coffee: with a book, a laptop or an old friend.",
      "about.p2": "Our baristas train constantly and compete in championships. We make our own desserts, and the menu always has seasonal drinks made with local fruit and spices.",
      "about.s1": "coffees a year", "about.s2": "seats", "about.s3": "cups a day",
      "process.eyebrow": "How we work", "process.title": "From bean <em>to cup</em>",
      "process.s1t": "Sourcing", "process.s1d": "We work with farms in Ethiopia, Colombia and Brazil, and cup every lot before it reaches the bar.",
      "process.s2t": "Fresh roasting", "process.s2d": "We roast small batches weekly so every bean is brewed at its peak.",
      "process.s3t": "The perfect cup", "process.s3d": "Our baristas dial in the grind every morning and steam milk to the exact degree.",
      "gallery.eyebrow": "Atmosphere", "gallery.title": "Take a <em>look inside</em>",
      "contacts.eyebrow": "Contacts", "contacts.title": "Come and <em>visit</em>",
      "contacts.address": "Address",
      "contacts.addressText": "24 Amir Temur St., Yunusabad district, Tashkent",
      "contacts.landmark": "Landmark: opposite Tashkent City Mall",
      "contacts.yandex": "Yandex Maps", "contacts.google": "Google Maps",
      "contacts.phone": "Phone", "contacts.phoneText": "Table bookings and takeaway orders",
      "contacts.hours": "Opening hours", "contacts.weekdays": "Mon–Fri", "contacts.weekend": "Sat–Sun",
      "contacts.open": "Open now", "contacts.closed": "Closed now",
      "footer.cta": "See you <em>for a cup</em>", "footer.book": "Book a table",
      "footer.rights": "All rights reserved.", "footer.photos": "Photos:",
      "alt.barista": "Barista brewing pour-over coffee", "alt.interior": "Coffee shop hall with wooden tables",
      "alt.g1": "Bright coffee shop hall with plants", "alt.g2": "Two cappuccinos with latte art",
      "alt.g3": "Portafilters with ground coffee and beans", "alt.g4": "Coffee bar with an espresso machine",
      "alt.g5": "Roasted coffee beans", "alt.g6": "CAFE sign inside the hall"
    }
  };

  // name/desc: [ru, uz, en]; img: Unsplash photo id
  const MENU = {
    coffee: {
      img: "1497935586351-b67a49e012bf",
      items: [
        { id: "espresso", price: 1.50, img: "1559496417-e7f25cb247f3", name: ["Эспрессо", "Espresso", "Espresso"],
          desc: ["Плотный и насыщенный, с нотами шоколада и ореха", "Quyuq va toʻyingan, shokolad va yongʻoq notalari bilan", "Rich and full-bodied, with notes of chocolate and nuts"] },
        { id: "americano", price: 2.00, img: "1504630083234-14187a9df0f5", name: ["Американо", "Amerikano", "Americano"],
          desc: ["Эспрессо с горячей водой, мягкий и чистый вкус", "Issiq suvli espresso, yumshoq va toza taʼm", "Espresso with hot water, smooth and clean"] },
        { id: "cappuccino", price: 2.50, img: "1572442388796-11668a67e53d", name: ["Капучино", "Kapuchino", "Cappuccino"],
          desc: ["Эспрессо и бархатная молочная пена", "Espresso va baxmal sut koʻpigi", "Espresso with velvety milk foam"] },
        { id: "latte", price: 2.75, img: "1541167760496-1628856ab772", name: ["Латте", "Latte", "Latte"],
          desc: ["Больше молока, нежный и сливочный", "Koʻproq sut, nozik va qaymoqli", "More milk, soft and creamy"] },
        { id: "raf", price: 3.00, img: "1509042239860-f550ce710b93", name: ["Раф", "Raf", "Raf"],
          desc: ["Эспрессо, взбитый со сливками и ванильным сахаром", "Qaymoq va vanil shakari bilan koʻpirtirilgan espresso", "Espresso whipped with cream and vanilla sugar"] },
        { id: "flatwhite", price: 3.00, img: "1507133750040-4a8f57021571", name: ["Флэт уайт", "Flet uayt", "Flat white"],
          desc: ["Двойной эспрессо и тонкий слой молока", "Ikki karra espresso va yupqa sut qatlami", "Double espresso with a thin layer of milk"] }
      ]
    },
    tea: {
      img: "1564890369478-c89ca6d9cde9",
      items: [
        { price: 1.50, img: "1564890369478-c89ca6d9cde9", name: ["Чёрный чай", "Qora choy", "Black tea"],
          desc: ["Цейлонский, чайник 500 мл", "Seylon choyi, 500 ml choynak", "Ceylon, 500 ml pot"] },
        { price: 1.50, img: "1564890369478-c89ca6d9cde9", name: ["Зелёный чай", "Koʻk choy", "Green tea"],
          desc: ["Классический, чайник 500 мл", "Klassik, 500 ml choynak", "Classic, 500 ml pot"] },
        { price: 2.25, img: "1556679343-c7306c1976bc", name: ["Имбирный чай", "Zanjabilli choy", "Ginger tea"],
          desc: ["Имбирь, лимон и мёд — согревает", "Zanjabil, limon va asal — isitadi", "Ginger, lemon and honey, warming"] },
        { price: 3.25, img: "1498804103079-a6351b050096", name: ["Матча латте", "Matcha latte", "Matcha latte"],
          desc: ["Японская матча на молоке", "Sutli yapon matchasi", "Japanese matcha with milk"] }
      ]
    },
    cold: {
      img: "1461023058943-07fcbe16d735",
      items: [
        { id: "icedlatte", price: 3.00, img: "1517701604599-bb29b565090c", name: ["Айс латте", "Ays latte", "Iced latte"],
          desc: ["Эспрессо, холодное молоко и лёд", "Espresso, sovuq sut va muz", "Espresso, cold milk and ice"] },
        { price: 2.75, img: "1461023058943-07fcbe16d735", name: ["Колд брю", "Kold bryu", "Cold brew"],
          desc: ["Кофе холодной экстракции 16 часов", "16 soat sovuq ekstraksiya qilingan qahva", "Coffee steeped cold for 16 hours"] },
        { price: 3.25, img: "1514432324607-a09d9b4aefdd", name: ["Фраппе", "Frappe", "Frappé"],
          desc: ["Кофе, молоко и лёд, взбитые в блендере", "Blenderda koʻpirtirilgan qahva, sut va muz", "Coffee, milk and ice blended smooth"] },
        { price: 2.50, img: "1556679343-c7306c1976bc", name: ["Лимонад", "Limonad", "Lemonade"],
          desc: ["Домашний: маракуйя или клубника-базилик", "Uy limonadi: marakuya yoki qulupnay-rayhon", "Homemade: passion fruit or strawberry-basil"] }
      ]
    },
    desserts: {
      img: "1571877227200-a0d98ea607e9",
      items: [
        { id: "cheesecake", price: 3.00, img: "1533134242443-d4fd215305ad", name: ["Чизкейк с черникой", "Qoraqatli chizkeyk", "Blueberry cheesecake"],
          desc: ["Нежный сливочный сыр на песочной основе", "Qumloq asosda nozik qaymoqli pishloq", "Creamy cheese on a shortbread base"] },
        { id: "tiramisu", price: 3.25, img: "1571877227200-a0d98ea607e9", name: ["Тирамису", "Tiramisu", "Tiramisu"],
          desc: ["Маскарпоне, савоярди и наш эспрессо", "Maskarpone, savoyardi va bizning espresso", "Mascarpone, savoiardi and our espresso"] },
        { price: 3.00, img: "1578985545062-69928b1d9587", name: ["Шоколадный торт", "Shokoladli tort", "Chocolate cake"],
          desc: ["Влажный бисквит и ганаш из бельгийского шоколада", "Nam biskvit va belgiya shokoladidan ganash", "Moist sponge with Belgian chocolate ganache"] },
        { id: "croissant", price: 1.75, img: "1555507036-ab1f4038808a", name: ["Круассан", "Kruassan", "Croissant"],
          desc: ["Сливочный, печём каждое утро", "Saryogʻli, har tong pishiramiz", "Buttery, baked every morning"] }
      ]
    }
  };

  const SIGNATURE = [
    ["coffee", "cappuccino"], ["coffee", "latte"], ["coffee", "raf"], ["cold", "icedlatte"],
    ["coffee", "flatwhite"], ["desserts", "tiramisu"], ["coffee", "espresso"], ["desserts", "cheesecake"], ["desserts", "croissant"]
  ];

  /* ================= Utils ================= */
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const LANGS = ["ru", "uz", "en"];
  const CATS = Object.keys(MENU);
  const STORAGE_KEY = "brumelle-lang";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let lang = "ru";
  let activeCat = "coffee";

  const unsplash = (id, w) => `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop`;
  const srcset = (id, widths = [320, 640, 960, 1400]) => widths.map((w) => `${unsplash(id, w)} ${w}w`).join(", ");
  const t = (key) => I18N[lang][key] ?? I18N.ru[key] ?? "";
  const formatPrice = (n) => "$" + n.toFixed(2);
  const findItem = (cat, id) => MENU[cat].items.find((it) => it.id === id);

  function markLoaded(img) {
    if (img.complete && img.naturalWidth) img.classList.add("loaded");
    else img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
  }

  function imgTag(id, { sizes, alt = "", w = 800, h = 1000, widths, eager = false } = {}) {
    return `<img src="${unsplash(id, 640)}" srcset="${srcset(id, widths)}" sizes="${sizes}" width="${w}" height="${h}" alt="${alt}" loading="${eager ? "eager" : "lazy"}" decoding="async">`;
  }

  /* ================= Language ================= */
  function detectLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (LANGS.includes(saved)) return saved;
    } catch (e) {}
    const nav = (navigator.language || "ru").slice(0, 2).toLowerCase();
    return LANGS.includes(nav) ? nav : "ru";
  }

  function moveLangPill() {
    const btn = $(`.lang button[data-lang="${lang}"]`);
    $(".lang-pill").style.transform = `translateX(${btn.offsetLeft - 4}px)`;
  }

  function setLang(next) {
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    $('meta[name="description"]').setAttribute("content", t("meta.desc"));
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$("[data-i18n-alt]").forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    moveLangPill();
    renderMarquee();
    renderSignature();
    renderTabs();
    renderPanel(false);
    updateOpenBadge();
  }

  /* ================= Marquee ================= */
  const beanSvg = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="12" cy="12" rx="6" ry="9" transform="rotate(30 12 12)"/><path d="M8.5 18c2.5-2.5 4.5-8 7-11.5" stroke="#D9A877" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;
  function renderMarquee() {
    // Repeat until one group is wider than the viewport, so the -50% loop is seamless
    const words = t("marquee");
    const html = words.concat(words).map((w) => `<span>${w}</span>${beanSvg}`).join("");
    $("#marqueeGroup").innerHTML = html;
    $("#marqueeGroup2").innerHTML = html;
  }

  /* ================= Signature carousel ================= */
  const carousel = $("#carousel");
  function renderSignature() {
    const i = LANGS.indexOf(lang);
    const first = !carousel.children.length;
    carousel.innerHTML = SIGNATURE.map(([cat, id]) => {
      const it = findItem(cat, id);
      return `<article class="sig-card">
        <div class="ph">${imgTag(it.img, { sizes: "(max-width: 760px) 78vw, 360px", alt: it.name[i], w: 720, h: 900, widths: [360, 540, 720] })}</div>
        <span class="price-chip">${formatPrice(it.price)}</span>
        <div class="info"><span class="tag">${t("cat." + cat)}</span><h3>${it.name[i]}</h3><p>${it.desc[i]}</p></div>
      </article>`;
    }).join("");
    $$("img", carousel).forEach(markLoaded);
    if (first) carousel.scrollLeft = 0;
    updateCarouselUi();
  }

  function cardStep() {
    const card = carousel.firstElementChild;
    return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(carousel).columnGap || 20) : 300;
  }

  function updateCarouselUi() {
    const max = carousel.scrollWidth - carousel.clientWidth;
    const p = max > 0 ? carousel.scrollLeft / max : 1;
    $("#sigPrev").disabled = carousel.scrollLeft <= 4;
    $("#sigNext").disabled = carousel.scrollLeft >= max - 4;
    const visible = Math.min(1, carousel.clientWidth / carousel.scrollWidth);
    $("#carouselBar").style.transform = `translateX(${p * (1 - visible) * 100 / visible}%) scaleX(1)`;
    $("#carouselBar").style.width = `${visible * 100}%`;
  }

  let carouselTick = false;
  carousel.addEventListener("scroll", () => {
    if (carouselTick) return;
    carouselTick = true;
    requestAnimationFrame(() => { updateCarouselUi(); carouselTick = false; });
  }, { passive: true });
  $("#sigPrev").addEventListener("click", () => carousel.scrollBy({ left: -cardStep(), behavior: reduceMotion.matches ? "auto" : "smooth" }));
  $("#sigNext").addEventListener("click", () => carousel.scrollBy({ left: cardStep(), behavior: reduceMotion.matches ? "auto" : "smooth" }));
  carousel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); $("#sigNext").click(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); $("#sigPrev").click(); }
  });

  // Mouse drag-to-scroll (touch already scrolls natively)
  (() => {
    let startX = 0, startLeft = 0, down = false, moved = false;
    carousel.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = carousel.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; carousel.classList.add("dragging"); }
      if (moved) carousel.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      const step = cardStep();
      const target = Math.round(carousel.scrollLeft / step) * step;
      carousel.classList.remove("dragging");
      carousel.scrollTo({ left: target, behavior: "smooth" });
    });
  })();

  /* ================= Menu ================= */
  const tabsEl = $("#tabs");
  const panel = $("#panel");
  const visual = $("#menuVisual");

  function buildVisual() {
    CATS.forEach((cat) => {
      const ph = document.createElement("div");
      ph.className = "ph";
      ph.dataset.cat = cat;
      ph.innerHTML = imgTag(MENU[cat].img, { sizes: "(max-width: 1024px) 90vw, 40vw", w: 1000, h: 1250, widths: [480, 800, 1100] });
      visual.insertBefore(ph, $("#menuVisualLabel"));
      markLoaded($("img", ph));
    });
  }

  function renderTabs() {
    $$(".tab", tabsEl).forEach((b) => b.remove());
    tabsEl.insertAdjacentHTML("beforeend", CATS.map((c) => `
      <button class="tab" role="tab" type="button" id="tab-${c}" aria-controls="panel" aria-selected="${c === activeCat}" tabindex="${c === activeCat ? 0 : -1}" data-cat="${c}">${t("cat." + c)}</button>
    `).join(""));
    requestAnimationFrame(moveTabPill);
  }

  function moveTabPill() {
    const active = $(`#tab-${activeCat}`);
    if (!active) return;
    const pill = $("#tabPill");
    pill.style.width = active.offsetWidth + "px";
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  function renderPanel(animate = true) {
    const i = LANGS.indexOf(lang);
    panel.setAttribute("aria-labelledby", "tab-" + activeCat);
    panel.innerHTML = `<div class="menu-list">${MENU[activeCat].items.map((it, n) => `
      <article class="menu-item" style="--i:${animate ? n : 0};${animate ? "" : "animation:none"}">
        <div class="ph">${imgTag(it.img, { sizes: "64px", w: 128, h: 128, widths: [128, 192] })}</div>
        <div><h3>${it.name[i]}</h3><p>${it.desc[i]}</p></div>
        <span class="price">${formatPrice(it.price)}</span>
      </article>`).join("")}</div>`;
    $$("img", panel).forEach(markLoaded);
    $$(".ph", visual).forEach((ph) => ph.classList.toggle("active", ph.dataset.cat === activeCat));
    $("#menuVisualLabel").textContent = t("cat." + activeCat);
  }

  function selectCat(cat, focus) {
    if (cat === activeCat) return;
    activeCat = cat;
    $$(".tab", tabsEl).forEach((b) => {
      const on = b.dataset.cat === cat;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    moveTabPill();
    renderPanel(true);
    if (focus) $(`#tab-${cat}`).focus();
    const tab = $(`#tab-${cat}`);
    tabsEl.scrollTo({ left: tab.offsetLeft - 20, behavior: "smooth" });
  }

  tabsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (b) selectCat(b.dataset.cat, false);
  });
  tabsEl.addEventListener("keydown", (e) => {
    const idx = CATS.indexOf(activeCat);
    const map = { ArrowRight: idx + 1, ArrowLeft: idx - 1, Home: 0, End: CATS.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    selectCat(CATS[(map[e.key] + CATS.length) % CATS.length], true);
  });

  /* ================= Opening hours (Tashkent, UTC+5) ================= */
  function updateOpenBadge() {
    const now = new Date(Date.now() + 5 * 3600000);
    const day = now.getUTCDay();
    const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
    const weekend = day === 0 || day === 6;
    const open = weekend ? mins >= 540 : mins >= 480 && mins < 1380;
    const badge = $("#openBadge");
    badge.textContent = t(open ? "contacts.open" : "contacts.closed");
    badge.classList.toggle("closed", !open);
    $("#hWeekdays").classList.toggle("today", !weekend);
    $("#hWeekend").classList.toggle("today", weekend);
  }

  /* ================= Lazy images with data-u ================= */
  $$("img[data-u]").forEach((img) => {
    img.loading = "lazy";
    img.decoding = "async";
    img.sizes = img.dataset.sizes || "50vw";
    img.srcset = srcset(img.dataset.u);
    img.src = unsplash(img.dataset.u, 800);
    markLoaded(img);
  });
  markLoaded($(".hero img"));

  /* ================= Reveal + counters ================= */
  function animateCount(el) {
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion.matches) { el.textContent = end + suffix; return; }
    const dur = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-count]", en.target).forEach(animateCount);
      revealIO.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.01 });
  $$(".reveal, .reveal-clip").forEach((el) => revealIO.observe(el));

  // Pause infinite decorative animations while offscreen
  const pauseIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.target.classList.toggle("paused", !en.isIntersecting));
  });
  [$("#marquee"), $("#aboutBadge")].forEach((el) => pauseIO.observe(el));

  /* ================= Scroll: one rAF loop for everything ================= */
  const header = $("#header");
  const progress = $("#progress");
  const fab = $("#fab");
  const heroEl = $(".hero");
  const parallaxEls = $$("[data-parallax]").map((el) => ({ el, speed: +el.dataset.parallax, visible: false }));
  const navLinks = $$(".nav a");
  const sections = navLinks.map((a) => $(a.getAttribute("href")));
  let lastY = window.scrollY;
  let ticking = false;
  let vh = window.innerHeight;
  let docH = document.documentElement.scrollHeight;

  const parallaxIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const p = parallaxEls.find((x) => x.el === en.target);
      if (p) p.visible = en.isIntersecting;
    });
  }, { rootMargin: "100px 0px" });
  parallaxEls.forEach((p) => parallaxIO.observe(p.el));

  function onFrame() {
    const y = window.scrollY;
    progress.style.transform = `scaleX(${Math.min(1, y / Math.max(1, docH - vh))})`;

    const pastHero = y > heroEl.offsetHeight - 120;
    header.classList.toggle("solid", y > 40);
    if (!header.classList.contains("menu-open")) {
      header.classList.toggle("hidden", y > lastY && y > vh * 0.6);
    }
    fab.classList.toggle("show", pastHero);

    if (!reduceMotion.matches) {
      for (const p of parallaxEls) {
        if (!p.visible) continue;
        const r = p.el.getBoundingClientRect();
        const offset = (r.top + r.height / 2 - vh / 2) * p.speed;
        p.el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
    }

    let current = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.4) current = i; });
    navLinks.forEach((a, i) => a.classList.toggle("active", i === current));

    lastY = y;
    ticking = false;
  }

  function requestFrame() {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  }
  window.addEventListener("scroll", requestFrame, { passive: true });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      vh = window.innerHeight;
      docH = document.documentElement.scrollHeight;
      moveTabPill();
      moveLangPill();
      updateCarouselUi();
      requestFrame();
    }, 120);
  }, { passive: true });
  new ResizeObserver(() => { docH = document.documentElement.scrollHeight; }).observe(document.body);

  // Smooth anchor scrolling that respects reduced motion
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href") === "#") return;
    const target = $(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    toggleNav(false);
    const top = a.getAttribute("href") === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY - (header.offsetHeight - 1);
    window.scrollTo({ top, behavior: reduceMotion.matches ? "auto" : "smooth" });
  });

  /* ================= Mobile nav ================= */
  const nav = $("#nav");
  const burger = $("#burger");
  function toggleNav(open) {
    nav.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", () => toggleNav(!nav.classList.contains("open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { toggleNav(false); burger.focus(); } });

  /* ================= Language switch ================= */
  $(".lang").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-lang]");
    if (b && b.dataset.lang !== lang) setLang(b.dataset.lang);
  });

  /* ================= Lightbox ================= */
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  $("#galleryGrid").addEventListener("click", (e) => {
    const btn = e.target.closest(".g-item");
    if (!btn || typeof lightbox.showModal !== "function") return;
    const img = $("img", btn);
    lightboxImg.src = unsplash(img.dataset.u, 1600);
    lightboxImg.alt = img.alt;
    lightbox.showModal();
  });
  $("#lightboxClose").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });

  /* ================= Magnetic buttons (desktop only) ================= */
  if (finePointer.matches && !reduceMotion.matches) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ================= Init ================= */
  $("#year").textContent = new Date().getFullYear();
  buildVisual();
  setLang(detectLang());
  onFrame();
  setInterval(updateOpenBadge, 60000);
  document.fonts?.ready.then(() => { moveTabPill(); moveLangPill(); });
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add("ready")));
})();

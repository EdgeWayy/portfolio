/* Case studies on the "Work" section. Order here = order on the page.
   To add a demo: copy the site into public/demos/<slug>/ (see README), add screenshots
   public/img/work/<slug>-720.webp, -1200.webp, -m.webp (npm run shots does it), then copy one object below.

   slug     folder name in public/demos/ and screenshot prefix
   accent   card color: "blush" | "mist" | "paper" | "sand"
   url      path to the demo, relative to the site root */
export const projects = [
  {
    slug: "lumina-mall",
    url: "demos/lumina-mall/index.html",
    title: "Lumina Mall",
    accent: "mist",
    kind: { ru: "Интерактивная карта ТЦ + админ-панель", en: "Interactive mall map + admin panel" },
    problem: {
      ru: "Посетитель не может быстро найти магазин, а владельцу ТЦ нечем самому обновлять витрины, товары и фото.",
      en: "Visitors can't find a store quickly, and the mall owner has no simple way to update storefronts, products and photos.",
    },
    solution: {
      ru: "Атриум на 4 этажа с лифтом и свайпом, поиск на трёх языках с транслитом и опечатками, страницы магазинов с корзиной и админ-панель.",
      en: "A 4-floor atrium with an elevator and swipe, search in three languages with transliteration and typos, store pages with a cart, and an admin panel.",
    },
    result: {
      ru: "Работает без сервера: данные и фото хранятся в браузере, есть экспорт и импорт. Облегчённый режим для слабых телефонов.",
      en: "Runs with no server: data and photos live in the browser, with export and import. A lite mode for weak phones.",
    },
    tech: ["JavaScript", "IndexedDB", "Search", "i18n", "Admin"],
    note: { ru: "Пароль админки в демо: admin123", en: "Demo admin password: admin123" },
  },
  {
    slug: "skynavoi-flights",
    url: "demos/skynavoi-flights/index.html",
    title: "SkyNavoi",
    accent: "blush",
    kind: { ru: "Бронирование авиабилетов", en: "Flight booking" },
    problem: {
      ru: "Региональной авиакомпании нужен понятный путь покупки билета с телефона — без звонков в кассу.",
      en: "A regional airline needs a clear way to buy a ticket on a phone, without calling the ticket office.",
    },
    solution: {
      ru: "Поиск рейсов, фильтры по цене, пересадкам и времени, выбор места на схеме салона, форма пассажира с проверкой и электронный билет.",
      en: "Flight search, filters by price, stops and time, seat selection on a cabin map, a validated passenger form and an e-ticket.",
    },
    result: {
      ru: "Полный сценарий из 5 шагов на тестовых данных. Видео в шапке не грузится на медленном интернете и в режиме экономии трафика.",
      en: "A full 5-step flow on mock data. The hero video is skipped on slow connections and in Data Saver mode.",
    },
    tech: ["JavaScript", "JSON data", "sessionStorage", "Video"],
  },
  {
    slug: "lirevo-flowers",
    url: "demos/lirevo-flowers/index.html",
    title: "Lirevo",
    accent: "paper",
    kind: { ru: "Интернет-магазин цветов", en: "Flower shop online store" },
    problem: {
      ru: "Заказы приходят в переписку, и каждый раз приходится вручную уточнять букет, адрес, время и текст открытки.",
      en: "Orders arrive in chat, and every time someone has to ask about the bouquet, address, time and card text by hand.",
    },
    solution: {
      ru: "Каталог с категориями, поиском, фильтром цены и сортировкой. Корзина с отменой удаления и оформление по шагам: слоты доставки и промокод.",
      en: "A catalog with categories, search, a price filter and sorting. A cart with undo and step-by-step checkout with delivery slots and a promo code.",
    },
    result: {
      ru: "Клиент собирает заказ сам, а владелец получает его уже со всеми деталями. Три языка.",
      en: "The customer builds the order alone, and the owner gets it with every detail filled in. Three languages.",
    },
    tech: ["JavaScript", "GSAP", "Cart", "Checkout", "i18n"],
  },
  {
    slug: "vortaq-fitness",
    url: "demos/vortaq-fitness/index.html",
    title: "Vortaq",
    accent: "sand",
    kind: { ru: "Сайт фитнес-клуба", en: "Fitness club website" },
    problem: {
      ru: "Клубу нужен сайт, который продаёт пробную тренировку и сразу передаёт заявку менеджеру.",
      en: "The club needs a site that sells a trial workout and passes the lead to a manager right away.",
    },
    solution: {
      ru: "Абонементы с расчётом выгоды, расписание по дням со свайпом, тренеры, галерея и форма заявки с защитой от спама.",
      en: "Membership plans with savings, a day-by-day schedule with swipe, coaches, a gallery and a lead form with spam protection.",
    },
    result: {
      ru: "В рабочей версии заявка уходит в Telegram менеджеру через серверную функцию. В демо форма работает в тестовом режиме.",
      en: "In production a serverless function sends each lead to the manager's Telegram. In the demo the form runs in test mode.",
    },
    tech: ["JavaScript", "Serverless", "Lead form", "i18n"],
  },
  {
    slug: "brumelle-coffee",
    url: "demos/brumelle-coffee/index.html",
    title: "Brumelle",
    accent: "blush",
    kind: { ru: "Сайт кофейни", en: "Coffee shop website" },
    problem: {
      ru: "Кофейне нужна быстрая визитка: меню, часы работы и кнопка звонка прямо на первом экране.",
      en: "A coffee shop needs a fast site: the menu, opening hours and a call button right on the first screen.",
    },
    solution: {
      ru: "Меню по категориям, карусель хитов, статус «открыто сейчас» по времени Ташкента, галерея с лайтбоксом и счётчики.",
      en: "A menu by category, a favourites carousel, a live open-now status in Tashkent time, a gallery with lightbox and counters.",
    },
    result: {
      ru: "Код сайта весит около 100 КБ, фото подгружаются по мере прокрутки: открывается почти мгновенно даже на мобильном интернете.",
      en: "The code weighs about 100 KB and photos load as you scroll, so it opens almost instantly, even on mobile data.",
    },
    tech: ["HTML", "CSS", "JavaScript", "i18n"],
  },
  {
    slug: "nagiwa-sushi",
    url: "demos/nagiwa-sushi/index.html",
    title: "Nagiwa",
    accent: "mist",
    kind: { ru: "Сайт японского ресторана", en: "Japanese restaurant website" },
    problem: {
      ru: "Ресторану нужен атмосферный сайт, который продаёт ужин ещё до визита.",
      en: "The restaurant needs an atmospheric site that sells the dinner before the guest arrives.",
    },
    solution: {
      ru: "Прелоадер и анимация первого экрана, меню с вкладками, галерея с лайтбоксом, кнопка Telegram и три языка.",
      en: "A preloader and hero animation, a tabbed menu, a gallery with lightbox, a Telegram button and three languages.",
    },
    result: {
      ru: "Тёмная премиальная подача и меню, которое удобно листать одной рукой.",
      en: "A dark premium look and a menu that is easy to browse with one hand.",
    },
    tech: ["HTML", "CSS", "GSAP", "i18n"],
  },
];

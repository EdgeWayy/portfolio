/* =========================================================================
 * Lumina Mall — internationalisation (ru · uz · en)
 * -------------------------------------------------------------------------
 * Every piece of interface text lives here. Each entry is
 *     key: [russian, uzbekLatin, english]
 * so the three translations always sit side by side.
 *
 * Plurals: an entry may hold plural objects instead of strings, e.g.
 *     { one: '{n} магазин', few: '{n} магазина', many: '{n} магазинов' }
 * The right form is picked with Intl.PluralRules for the active language.
 *
 * Usage
 *   Mall.t('cart.title')                  -> "Корзина"
 *   Mall.t('count.stores', { n: 5 })      -> "5 магазинов"
 *   Mall.L(store.name)                    -> the store name in the active language
 *   <span data-i18n="nav.atrium"></span>  -> filled by Mall.i18n.apply()
 *   <input data-i18n-attr="placeholder:search.placeholder;aria-label:search.label">
 *
 * Switching language (Mall.i18n.set('uz')) updates static text, fires the
 * 'mall:lang' event so pages re-render their dynamic parts, and plays a
 * short fade. No reload.
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = (global.Mall = global.Mall || {});
  const LANGS = ['ru', 'uz', 'en'];
  const DEFAULT = 'ru';
  const KEY = 'lumina:lang';
  const IDX = { ru: 0, uz: 1, en: 2 };
  const LOCALES = { ru: 'ru-RU', uz: 'uz-Latn-UZ', en: 'en-US' };

  /* eslint-disable max-len */
  const D = {
    /* ------------------------------------------------------------ general */
    'app.name': ['Lumina Mall', 'Lumina Mall', 'Lumina Mall'],
    'app.trial': ['Пробная версия', 'Sinov versiyasi', 'Trial version'],
    'app.trialData': ['Пробная версия · демо-данные', 'Sinov versiyasi · demo maʼlumotlar', 'Trial version · demo data'],
    'app.sub': ['ТЦ · демо', 'SM · demo', 'Mall · Trial'],
    'loader.loading': ['Загрузка…', 'Yuklanmoqda…', 'Loading…'],
    'skip.content': ['Перейти к содержимому', 'Asosiy qismga o‘tish', 'Skip to content'],
    'skip.atrium': ['Пропустить атриум', 'Atriumni o‘tkazib yuborish', 'Skip the atrium'],
    'skip.products': ['Перейти к товарам', 'Mahsulotlarga o‘tish', 'Skip to products'],
    'skip.stores': ['Перейти к магазинам', 'Do‘konlarga o‘tish', 'Skip to stores'],

    'nav.main': ['Главное меню', 'Asosiy menyu', 'Main'],
    'nav.home': ['Lumina Mall, на главную', 'Lumina Mall, bosh sahifa', 'Lumina Mall, home'],
    'nav.atrium': ['Атриум', 'Atrium', 'Atrium'],
    'nav.directory': ['Магазины', 'Do‘konlar', 'Directory'],
    'nav.about': ['О торговом центре', 'Savdo markazi haqida', 'About the mall'],
    'nav.contact': ['Контакты', 'Aloqa', 'Contact'],
    'nav.owner': ['Вход для владельца', 'Egasi uchun kirish', 'Owner login'],

    'action.close': ['Закрыть', 'Yopish', 'Close'],
    'action.cancel': ['Отмена', 'Bekor qilish', 'Cancel'],
    'action.save': ['Сохранить', 'Saqlash', 'Save'],
    'action.delete': ['Удалить', 'O‘chirish', 'Delete'],
    'action.edit': ['Изменить', 'Tahrirlash', 'Edit'],
    'action.clear': ['Очистить', 'Tozalash', 'Clear'],
    'action.dismiss': ['Скрыть уведомление', 'Bildirishnomani yopish', 'Dismiss notification'],
    'action.confirm': ['Подтвердить', 'Tasdiqlash', 'Confirm'],

    'theme.toDay': ['Включить дневной режим', 'Kunduzgi rejim', 'Switch to day mode'],
    'theme.toNight': ['Включить ночной режим', 'Tungi rejim', 'Switch to night mode'],
    'theme.day': ['День', 'Kun', 'Day'],
    'theme.night': ['Ночь', 'Tun', 'Night'],

    'lang.label': ['Язык', 'Til', 'Language'],
    'lang.ru': ['Русский', 'Ruscha', 'Russian'],
    'lang.uz': ['Узбекский', 'O‘zbekcha', 'Uzbek'],
    'lang.en': ['Английский', 'Inglizcha', 'English'],
    'lang.switched': ['Язык: русский', 'Til: o‘zbekcha', 'Language: English'],

    'lite.on': ['Лёгкий режим: вкл.', 'Yengil rejim: yoq.', 'Lite mode: on'],
    'lite.off': ['Лёгкий режим: выкл.', 'Yengil rejim: o‘ch.', 'Lite mode: off'],
    'lite.toastOn': ['Лёгкий режим включён: меньше анимаций, быстрее на старых телефонах.', 'Yengil rejim yoqildi: kamroq animatsiya, eski telefonlarda tezroq.', 'Lite mode on: fewer animations, faster on older phones.'],
    'lite.toastOff': ['Лёгкий режим выключен: все анимации.', 'Yengil rejim o‘chirildi: barcha animatsiyalar.', 'Lite mode off: full animations.'],

    'status.open': ['Открыто', 'Ochiq', 'Open'],
    'status.closed': ['Закрыто', 'Yopiq', 'Closed'],
    'status.openNow': ['Сейчас открыто', 'Hozir ochiq', 'Open now'],
    'status.closedNow': ['Сейчас закрыто', 'Hozir yopiq', 'Closed now'],

    'floor.n': ['{n} этаж', '{n}-qavat', 'Floor {n}'],
    'floor.ordinal': ['{n}-й этаж', '{n}-qavat', '{n} floor'],
    'floor.short': ['{n} эт.', '{n}-q.', 'F{n}'],

    'count.stores': [{ one: '{n} магазин', few: '{n} магазина', many: '{n} магазинов', other: '{n} магазина' }, { other: '{n} ta do‘kon' }, { one: '{n} store', other: '{n} stores' }],
    'count.products': [{ one: '{n} товар', few: '{n} товара', many: '{n} товаров', other: '{n} товара' }, { other: '{n} ta mahsulot' }, { one: '{n} product', other: '{n} products' }],
    'count.items': [{ one: '{n} товар', few: '{n} товара', many: '{n} товаров', other: '{n} товара' }, { other: '{n} ta mahsulot' }, { one: '{n} item', other: '{n} items' }],
    'count.photos': [{ one: '{n} фото', few: '{n} фото', many: '{n} фото', other: '{n} фото' }, { other: '{n} ta rasm' }, { one: '{n} photo', other: '{n} photos' }],
    'currency': ['сум', 'so‘m', 'UZS'],

    /* -------------------------------------------------------------- search */
    'search.label': ['Найти магазин или товар', 'Do‘kon yoki mahsulot qidirish', 'Find a store or product'],
    'search.placeholder': ['Найти магазин или товар…', 'Do‘kon yoki mahsulot…', 'Find a store or product…'],
    'search.clear': ['Очистить поиск', 'Qidiruvni tozalash', 'Clear search'],
    'search.results': ['Результаты поиска', 'Qidiruv natijalari', 'Search results'],
    'search.none': ['Ничего не найдено по запросу «{q}»', '«{q}» bo‘yicha hech narsa topilmadi', 'Nothing found for “{q}”'],
    'search.found': [{ one: 'Найден {n} магазин', few: 'Найдено {n} магазина', many: 'Найдено {n} магазинов', other: 'Найдено {n} магазина' }, { other: '{n} ta do‘kon topildi' }, { one: '{n} store found', other: '{n} stores found' }],
    'search.matchProduct': ['Товар: {text}', 'Mahsulot: {text}', 'Product: {text}'],
    'search.matchOther': ['Совпадение: {text}', 'Moslik: {text}', 'Match: {text}'],
    'search.hint': ['Ищите на русском, oʻzbekcha или English', 'Ruscha, o‘zbekcha yoki inglizcha qidiring', 'Search in Russian, Uzbek or English'],

    /* -------------------------------------------------------------- atrium */
    'atrium.label': ['Атриум торгового центра: 4 этажа', 'Savdo markazi atriumi: 4 qavat', 'Mall atrium with 4 floors'],
    'atrium.help': ['Выберите этаж кнопками лифта, колесом мыши или свайпом. Tab — переход между витринами, Enter — войти в магазин.', 'Qavatni lift tugmalari, sichqoncha g‘ildiragi yoki surish bilan tanlang. Tab — vitrinalar orasida, Enter — do‘konga kirish.', 'Choose a floor with the elevator buttons, the mouse wheel or a swipe. Tab moves between shop fronts, Enter opens a store.'],
    'elevator.label': ['Лифт: выбор этажа', 'Lift: qavat tanlash', 'Elevator: choose a floor'],
    'elevator.goto': ['Перейти на {n} этаж', '{n}-qavatga o‘tish', 'Go to floor {n}'],
    'elevator.up': ['Этаж выше', 'Yuqori qavat', 'Floor up'],
    'elevator.down': ['Этаж ниже', 'Pastki qavat', 'Floor down'],
    'tip.click': ['Нажмите, чтобы войти', 'Kirish uchun bosing', 'Click to enter'],
    'tip.enter': ['Войти в магазин', 'Do‘konga kirish', 'Enter store'],
    'hint.desktop': ['Колесо мыши или лифт — смена этажа · нажмите на витрину', 'Sichqoncha g‘ildiragi yoki lift — qavat · vitrinani bosing', 'Mouse wheel or elevator to change floors · click a shop front'],
    'hint.touch': ['Свайп вверх/вниз — смена этажа · коснитесь витрины', 'Yuqoriga/pastga suring — qavat · vitrinaga teging', 'Swipe up/down to change floors · tap a shop front'],
    'atrium.info': ['Информация', 'Ma’lumot', 'Information'],
    'atrium.welcome': ['Добро пожаловать', 'Xush kelibsiz', 'Welcome'],
    'atrium.entrance': ['Главный вход', 'Asosiy kirish', 'Main entrance'],
    'atrium.toAbout': ['О торговом центре', 'Markaz haqida', 'About the mall'],
    'atrium.storeAria': ['{name}, {category}, {floor}', '{name}, {category}, {floor}', '{name}, {category}, {floor}'],
    'atrium.empty': ['Свободное место', 'Bo‘sh joy', 'Available space'],

    /* --------------------------------------------------------------- about */
    'about.eyebrow': ['О торговом центре', 'Savdo markazi haqida', 'About the mall'],
    'about.title': ['Светлое место для покупок, еды и встреч', 'Xarid, taom va uchrashuvlar uchun yorug‘ maskan', 'A bright place to shop, eat and meet'],
    'about.lead': ['Lumina Mall объединяет моду, технику, красоту, книги, спорт и солнечный фуд-корт под одной стеклянной крышей. Четыре этажа вокруг атриума с фонтаном и панорамным лифтом.', 'Lumina Mall moda, texnika, go‘zallik, kitoblar, sport va quyoshli fud-kortni bitta shisha tom ostida birlashtiradi. Fontanli atrium va panoramali lift atrofida to‘rt qavat.', 'Lumina Mall brings fashion, tech, beauty, books, sport and a sunny food court together under one glass roof. Four floors around a fountain atrium and a panoramic glass elevator.'],
    'about.note': ['Это пробная версия сайта: магазины, товары и цены — демо-данные, их можно менять в панели администратора.', 'Bu saytning sinov versiyasi: do‘konlar, mahsulotlar va narxlar demo maʼlumotlar, ularni admin panelida o‘zgartirish mumkin.', 'This is a trial version of the website: stores, products and prices are demo data that the owner can change in the admin panel.'],
    'about.browse': ['Все магазины', 'Barcha do‘konlar', 'Browse all stores'],
    'about.plan': ['Спланировать визит', 'Tashrifni rejalash', 'Plan your visit'],
    /* phone home page (≤768px): static hero, "show more" toggles, bottom bar */
    'm.call': ['Позвонить', 'Qo‘ng‘iroq qilish', 'Call us'],
    'm.amenities': ['Удобства в ТЦ', 'Markazdagi qulayliklar', 'Mall amenities'],
    'm.quick': ['Быстрые ссылки', 'Tezkor havolalar', 'Quick links'],
    'stats.stores': ['Магазинов и кафе', 'Do‘kon va kafelar', 'Stores & cafés'],
    'stats.products': ['Товаров онлайн', 'Onlayn mahsulotlar', 'Products online'],
    'stats.parking': ['Бесплатных парковочных мест', 'Bepul avtoturargoh joylari', 'Free parking spaces'],
    'stats.visitors': ['Посетителей в день', 'Kunlik tashrif buyuruvchilar', 'Visitors a day'],
    'feature.parking.t': ['Бесплатная парковка', 'Bepul avtoturargoh', 'Free parking'],
    'feature.parking.d': ['Подземный паркинг на 640 мест, зарядки для электромобилей и семейные места у входа.', '640 o‘rinli yer osti avtoturargohi, elektromobil quvvatlash va kirish yonida oilaviy joylar.', 'Underground parking for 640 cars, EV chargers and family spaces by the doors.'],
    'feature.food.t': ['Фуд-корт', 'Fud-kort', 'Food court'],
    'feature.food.d': ['Семь кухонь на 4-м этаже, открыто до 23:00 каждый день.', '4-qavatda yetti xil oshxona, har kuni soat 23:00 gacha ochiq.', 'Seven kitchens on the 4th floor, open until 23:00 every day.'],
    'feature.family.t': ['Для всей семьи', 'Butun oila uchun', 'Family friendly'],
    'feature.family.d': ['Комната матери и ребёнка, игровой уголок и прокат колясок у стойки информации.', 'Ona va bola xonasi, o‘yin burchagi va ma’lumot peshtaxtasida aravacha ijarasi.', 'Baby care room, a play corner and stroller rental at the information desk.'],
    'feature.wifi.t': ['Бесплатный Wi-Fi', 'Bepul Wi-Fi', 'Free Wi-Fi'],
    'feature.wifi.d': ['Быстрый Wi-Fi на всех этажах, сеть «Lumina-Guest» без пароля.', 'Barcha qavatlarda tezkor Wi-Fi, «Lumina-Guest» tarmog‘i parolsiz.', 'Fast Wi-Fi on every floor. Join “Lumina-Guest”, no password needed.'],

    /* ------------------------------------------------------------- contact */
    'contact.eyebrow': ['Контакты', 'Aloqa', 'Contact'],
    'contact.title': ['Приходите в гости или напишите нам', 'Tashrif buyuring yoki bizga yozing', 'Visit us or say hello'],
    'contact.lead': ['Вопросы о магазине, мероприятии или аренде? Отвечаем в течение рабочего дня.', 'Do‘kon, tadbir yoki ijara haqida savollar? Bir ish kuni ichida javob beramiz.', 'Questions about a store, an event or renting a space? We reply within one working day.'],
    'contact.address': ['Адрес', 'Manzil', 'Address'],
    'contact.hours': ['Часы работы', 'Ish vaqti', 'Opening hours'],
    'contact.phone': ['Телефон', 'Telefon', 'Phone'],
    'contact.email': ['Эл. почта', 'Elektron pochta', 'Email'],
    'mall.address': ['Ташкент, Юнусабадский район, ул. Навруз, 128 (демо)', 'Toshkent, Yunusobod tumani, Navro‘z ko‘chasi, 128 (demo)', '128 Navruz Street, Yunusabad, Tashkent (demo)'],
    'mall.hours': ['Ежедневно 10:00 – 22:00 · фуд-корт до 23:00', 'Har kuni 10:00 – 22:00 · fud-kort 23:00 gacha', 'Every day 10:00 – 22:00 · food court until 23:00'],
    'mall.tagline': ['Четыре этажа покупок, еды и отдыха в одном светлом атриуме.', 'Bitta yorug‘ atriumda to‘rt qavat xarid, taom va dam olish.', 'Four floors of shopping, food and fun in one bright atrium.'],
    'form.title': ['Написать нам', 'Bizga yozing', 'Send a message'],
    'form.name': ['Ваше имя', 'Ismingiz', 'Your name'],
    'form.email': ['Эл. почта', 'Elektron pochta', 'Email'],
    'form.message': ['Сообщение', 'Xabar', 'Message'],
    'form.send': ['Отправить', 'Yuborish', 'Send message'],
    'form.demo': ['Демо-форма: ничего не отправляется и не сохраняется.', 'Demo shakl: hech narsa yuborilmaydi va saqlanmaydi.', 'Demo form: nothing is sent or stored.'],
    'form.err.name': ['Пожалуйста, укажите имя.', 'Iltimos, ismingizni kiriting.', 'Please tell us your name.'],
    'form.err.email': ['Введите корректный адрес почты.', 'To‘g‘ri elektron pochta manzilini kiriting.', 'Please enter a valid email address.'],
    'form.err.message': ['Сообщение должно быть не короче 10 символов.', 'Xabar kamida 10 belgidan iborat bo‘lsin.', 'Your message should be at least 10 characters.'],
    'form.wait': ['Подождите {s} с перед следующим сообщением.', 'Keyingi xabardan oldin {s} soniya kuting.', 'Please wait {s}s before sending another message.'],
    'form.sent': ['Спасибо, {name}! Это демо, сообщение не отправлено.', 'Rahmat, {name}! Bu demo, xabar yuborilmadi.', 'Thanks, {name}! This is a demo, so the message was not sent.'],

    /* -------------------------------------------------------------- footer */
    'footer.explore': ['Навигация', 'Bo‘limlar', 'Explore'],
    'footer.visit': ['Как нас найти', 'Bizni qanday topish mumkin', 'Visit'],
    'footer.rights': ['© {year} Lumina Mall. Демо-сайт: все магазины и товары вымышлены.', '© {year} Lumina Mall. Demo sayt: barcha do‘kon va mahsulotlar o‘ylab topilgan.', '© {year} Lumina Mall. Demo website, all stores and products are fictional.'],
    'footer.photos': ['Фото: Pexels', 'Rasmlar: Pexels', 'Photos: Pexels'],

    /* ----------------------------------------------------------- directory */
    'dir.eyebrow': ['Каталог магазинов', 'Do‘konlar katalogi', 'Store directory'],
    'dir.title': ['Всё под одной крышей', 'Hammasi bir tom ostida', 'Everything under one roof'],
    'dir.lead': ['Ищите магазины по категории или этажу. Нажмите на магазин, чтобы увидеть товары, или найдите его в атриуме.', 'Do‘konlarni toifa yoki qavat bo‘yicha qidiring. Mahsulotlarni ko‘rish uchun do‘konni bosing yoki uni atriumda toping.', 'Browse every store by category or floor. Tap a store to see its products, or jump to it in the atrium.'],
    'dir.stat.stores': ['магазинов', 'do‘kon', 'stores'],
    'dir.stat.floors': ['этажа', 'qavat', 'floors'],
    'dir.stat.products': ['товаров', 'mahsulot', 'products'],
    'dir.stat.open': ['открыто сейчас', 'hozir ochiq', 'open now'],
    'dir.search': ['Найти магазин…', 'Do‘kon qidirish…', 'Search stores…'],
    'dir.floorFilter': ['Фильтр по этажу', 'Qavat bo‘yicha saralash', 'Floor filter'],
    'dir.all': ['Все', 'Hammasi', 'All'],
    'dir.allCategories': ['Все категории', 'Barcha toifalar', 'All categories'],
    'dir.categoryFilter': ['Фильтр по категории', 'Toifa bo‘yicha saralash', 'Filter by category'],
    'dir.count': ['{n} из {total}', '{total} tadan {n} ta', '{n} of {total}'],
    'dir.emptyT': ['Магазины не найдены', 'Do‘konlar topilmadi', 'No stores match'],
    'dir.emptyD': ['Попробуйте другое слово, этаж или категорию.', 'Boshqa so‘z, qavat yoki toifani sinab ko‘ring.', 'Try a different word, floor or category.'],
    'dir.visit': ['В магазин', 'Do‘konga', 'Visit store'],
    'dir.onMap': ['В атриуме', 'Atriumda', 'In atrium'],
    'dir.onMapAria': ['Показать {name} в атриуме', '{name}ni atriumda ko‘rsatish', 'Show {name} in the atrium'],

    /* --------------------------------------------------------------- store */
    'store.back': ['Назад в атриум', 'Atriumga qaytish', 'Back to atrium'],
    'store.hours': ['Часы работы', 'Ish vaqti', 'Opening hours'],
    'store.location': ['Расположение', 'Joylashuv', 'Location'],
    'store.products': ['Товары', 'Mahsulotlar', 'Products'],
    'store.productsValue': ['{n} · в наличии {m}', '{n} · mavjud {m}', '{n} · {m} in stock'],
    'store.search': ['Поиск в этом магазине…', 'Shu do‘kondan qidirish…', 'Search in this store…'],
    'store.searchLabel': ['Поиск товаров', 'Mahsulot qidirish', 'Search products'],
    'store.sortLabel': ['Сортировка', 'Saralash', 'Sort products'],
    'sort.featured': ['Рекомендуемые', 'Tavsiya etilgan', 'Featured'],
    'sort.priceAsc': ['Сначала дешевле', 'Avval arzonlari', 'Price: low to high'],
    'sort.priceDesc': ['Сначала дороже', 'Avval qimmatlari', 'Price: high to low'],
    'sort.name': ['По названию', 'Nomi bo‘yicha', 'Name A–Z'],
    'store.inStockOnly': ['Только в наличии', 'Faqat mavjudlari', 'In stock only'],
    'store.resultCount': ['{n} из {total}', '{total} tadan {n} ta', '{n} of {total}'],
    'store.emptyT': ['Нет подходящих товаров', 'Mos mahsulotlar yo‘q', 'No products match'],
    'store.emptyD': ['Попробуйте другой запрос или отключите «Только в наличии».', 'Boshqa so‘rovni sinang yoki «Faqat mavjudlari»ni o‘chiring.', 'Try another search or switch off “In stock only”.'],
    'store.noneT': ['Товаров пока нет', 'Hozircha mahsulot yo‘q', 'No products yet'],
    'store.noneD': ['Магазин ещё не добавил товары. Загляните позже!', 'Do‘kon hali mahsulot qo‘shmagan. Keyinroq kiring!', 'This store has not added products yet. Check back soon!'],
    'store.notFoundT': ['Магазин не найден', 'Do‘kon topilmadi', 'We couldn’t find that store'],
    'store.notFoundD': ['Возможно, он переехал или закрылся. Загляните в атриум или каталог.', 'Ehtimol, u ko‘chgan yoki yopilgan. Atrium yoki katalogga qarang.', 'It may have moved or closed. Have a look at the atrium or the directory.'],
    'store.openAtrium': ['Открыть атриум', 'Atriumni ochish', 'Open the atrium'],

    'product.inStock': ['В наличии', 'Mavjud', 'In stock'],
    'product.outOfStock': ['Нет в наличии', 'Mavjud emas', 'Out of stock'],
    'product.add': ['В корзину', 'Savatga', 'Add'],
    'product.soldOut': ['Нет', 'Tugagan', 'Sold out'],
    'product.addAria': ['Добавить «{name}» в корзину', '«{name}»ni savatga qo‘shish', 'Add {name} to bag'],
    'product.outAria': ['«{name}» нет в наличии', '«{name}» mavjud emas', '{name} is out of stock'],
    'product.details': ['Подробнее: {name}', 'Batafsil: {name}', 'View details: {name}'],
    'product.addToBag': ['Добавить в корзину', 'Savatga qo‘shish', 'Add to bag'],
    'product.qty': ['Количество', 'Miqdor', 'Quantity'],
    'product.qtyDec': ['Уменьшить количество', 'Miqdorni kamaytirish', 'Decrease quantity'],
    'product.qtyInc': ['Увеличить количество', 'Miqdorni oshirish', 'Increase quantity'],
    'product.pickup': ['Самовывоз: {store}, {floor}', 'Olib ketish: {store}, {floor}', 'Pick up at {store}, {floor}'],
    'product.openHours': ['Открыто {hours}', 'Ish vaqti {hours}', 'Open {hours}'],
    'product.more': ['Ещё в этом магазине', 'Shu do‘kondagi boshqa mahsulotlar', 'More from this store'],
    'product.noDesc': ['Описание пока не добавлено.', 'Tavsif hali qo‘shilmagan.', 'No description yet.'],
    'product.added': ['«{name}» — в корзине', '«{name}» savatga qo‘shildi', '{name} added to your bag'],
    'product.addedQty': ['{qty} × «{name}» — в корзине', '{qty} × «{name}» savatga qo‘shildi', '{qty} × {name} added to your bag'],
    'gallery.prev': ['Предыдущее фото', 'Oldingi rasm', 'Previous photo'],
    'gallery.next': ['Следующее фото', 'Keyingi rasm', 'Next photo'],
    'gallery.photo': ['Фото {i} из {n}', '{n} tadan {i}-rasm', 'Photo {i} of {n}'],
    'gallery.zoom': ['Нажмите для увеличения', 'Kattalashtirish uchun bosing', 'Click to zoom'],
    'gallery.thumbs': ['Миниатюры', 'Kichik rasmlar', 'Thumbnails'],

    /* ---------------------------------------------------------------- cart */
    'cart.title': ['Корзина', 'Savat', 'Your bag'],
    'cart.open': ['Открыть корзину', 'Savatni ochish', 'Open cart'],
    'cart.openEmpty': ['Открыть корзину, пусто', 'Savatni ochish, bo‘sh', 'Open cart, empty'],
    'cart.openCount': [{ one: 'Открыть корзину, {n} товар', few: 'Открыть корзину, {n} товара', many: 'Открыть корзину, {n} товаров', other: 'Открыть корзину, {n} товара' }, { other: 'Savatni ochish, {n} ta mahsulot' }, { one: 'Open cart, {n} item', other: 'Open cart, {n} items' }],
    'cart.close': ['Закрыть корзину', 'Savatni yopish', 'Close cart'],
    'cart.emptyT': ['Корзина пуста', 'Savat bo‘sh', 'Your bag is empty'],
    'cart.emptyD': ['Выберите магазин в атриуме и добавьте что-нибудь.', 'Atriumdan do‘kon tanlang va biror narsa qo‘shing.', 'Pick a store in the atrium and add something you like.'],
    'cart.explore': ['Открыть атриум', 'Atriumni ochish', 'Explore the atrium'],
    'cart.outRemoved': ['Нет в наличии — уберём при оформлении', 'Mavjud emas — rasmiylashtirishda olib tashlanadi', 'Out of stock, removed at checkout'],
    'cart.subtotal': ['Итого', 'Jami', 'Subtotal'],
    'cart.note': ['Демо-оформление: оплата не списывается, доставка не выполняется.', 'Demo rasmiylashtirish: to‘lov olinmaydi, yetkazib berilmaydi.', 'Demo checkout: no payment is taken and nothing is shipped.'],
    'cart.checkout': ['Оформить', 'Rasmiylashtirish', 'Checkout'],
    'cart.clearT': ['Очистить корзину?', 'Savatni tozalaysizmi?', 'Empty your bag?'],
    'cart.clearD': ['Все товары будут удалены.', 'Barcha mahsulotlar olib tashlanadi.', 'All items will be removed.'],
    'cart.clearBtn': ['Очистить', 'Tozalash', 'Empty bag'],
    'cart.remove': ['Удалить «{name}»', '«{name}»ni olib tashlash', 'Remove {name}'],
    'cart.dec': ['Меньше: {name}', 'Kamaytirish: {name}', 'Decrease quantity of {name}'],
    'cart.inc': ['Больше: {name}', 'Ko‘paytirish: {name}', 'Increase quantity of {name}'],
    'order.title': ['Заказ оформлен!', 'Buyurtma rasmiylashtirildi!', 'Order placed!'],
    'order.thanks': ['Спасибо, что попробовали демо Lumina Mall.', 'Lumina Mall demosini sinab ko‘rganingiz uchun rahmat.', 'Thanks for trying the Lumina Mall demo.'],
    'order.number': ['Заказ', 'Buyurtma', 'Order'],
    'order.items': ['Товары', 'Mahsulotlar', 'Items'],
    'order.total': ['Сумма', 'Jami', 'Total'],
    'order.note': ['Это демо: оплата не списана. Самовывоз и доставку организует каждый магазин.', 'Bu demo: to‘lov olinmadi. Olib ketish va yetkazishni har bir do‘kon tashkil qiladi.', 'This is a demo: no payment was taken. Pick-up and delivery would be arranged by each store.'],
    'order.continue': ['Продолжить покупки', 'Xaridni davom ettirish', 'Continue shopping'],

    /* ======================================================== ADMIN PANEL */
    'login.title': ['Вход для владельца', 'Egasi uchun kirish', 'Owner login'],
    'login.sub': ['Панель администратора Lumina Mall · пробная версия', 'Lumina Mall admin paneli · sinov versiyasi', 'Lumina Mall admin panel · trial version'],
    'login.password': ['Пароль', 'Parol', 'Password'],
    'login.show': ['Показать пароль', 'Parolni ko‘rsatish', 'Show password'],
    'login.hide': ['Скрыть пароль', 'Parolni yashirish', 'Hide password'],
    'login.submit': ['Войти', 'Kirish', 'Sign in'],
    'login.note': ['Защита демо-уровня. Настоящим аккаунтам нужен сервер (см. README).', 'Demo darajadagi himoya. Haqiqiy hisoblar uchun server kerak (README’ga qarang).', 'Demo-level protection only. Real accounts need a server (see README).'],
    'login.back': ['← Вернуться на сайт', '← Saytga qaytish', '← Back to the site'],
    'login.wrong': [{ one: 'Неверный пароль. Осталась {n} попытка до блокировки.', few: 'Неверный пароль. Осталось {n} попытки до блокировки.', many: 'Неверный пароль. Осталось {n} попыток до блокировки.', other: 'Неверный пароль. Осталось {n} попытки.' }, { other: 'Parol noto‘g‘ri. Bloklanishgacha {n} ta urinish qoldi.' }, { one: 'Wrong password. {n} attempt left before a short lockout.', other: 'Wrong password. {n} attempts left before a short lockout.' }],
    'login.locked': ['Слишком много попыток. Повторите через {t}.', 'Juda ko‘p urinish. {t} dan keyin qayta urining.', 'Too many attempts. Try again in {t}.'],
    'login.expired': ['Сессия истекла. Войдите снова.', 'Sessiya tugadi. Qaytadan kiring.', 'Your session expired. Please sign in again.'],
    'login.please': ['Пожалуйста, войдите.', 'Iltimos, tizimga kiring.', 'Please sign in.'],
    'admin.welcome': ['С возвращением! Вы вошли в систему.', 'Xush kelibsiz! Tizimga kirdingiz.', 'Welcome back! You are signed in.'],
    'admin.defaultPw': ['Вы всё ещё используете пароль по умолчанию. Смените его в js/config.js (см. README).', 'Siz hali ham standart paroldan foydalanmoqdasiz. Uni js/config.js da o‘zgartiring (README).', 'You are still using the default password. Change it in js/config.js (see README).'],
    'admin.logout': ['Выйти', 'Chiqish', 'Log out'],
    'admin.loggedOut': ['Вы вышли из системы.', 'Tizimdan chiqdingiz.', 'You have been logged out.'],
    'admin.viewSite': ['Открыть сайт', 'Saytni ochish', 'View live site'],
    'admin.menu': ['Открыть меню', 'Menyuni ochish', 'Open navigation'],
    'admin.nav': ['Навигация админки', 'Admin navigatsiyasi', 'Admin navigation'],
    'admin.sub': ['Админ', 'Admin', 'Admin'],
    'nav.dashboard': ['Обзор', 'Umumiy ko‘rinish', 'Dashboard'],
    'nav.stores': ['Магазины', 'Do‘konlar', 'Stores'],
    'nav.products': ['Товары', 'Mahsulotlar', 'Products'],
    'nav.data': ['Данные и резервные копии', 'Maʼlumotlar va zaxira', 'Data & backup'],
    'admin.titleSuffix': ['Админка Lumina', 'Lumina admin', 'Lumina Admin'],

    'dash.subtitle': ['Обзор вашего торгового центра', 'Savdo markazingiz haqida umumiy ma’lumot', 'An overview of your mall'],
    'dash.newStore': ['Новый магазин', 'Yangi do‘kon', 'New store'],
    'kpi.stores': ['Магазины', 'Do‘konlar', 'Stores'],
    'kpi.products': ['Товары', 'Mahsulotlar', 'Products'],
    'kpi.inStock': ['В наличии', 'Mavjud', 'In stock'],
    'kpi.photos': ['Ваши фото', 'Sizning rasmlaringiz', 'Your photos'],
    'dash.byCategory': ['Магазины по категориям', 'Toifalar bo‘yicha do‘konlar', 'Stores by category'],
    'dash.floors': ['Этажи', 'Qavatlar', 'Floors'],
    'dash.storage': ['Хранилище браузера', 'Brauzer xotirasi', 'Browser storage'],
    'dash.storageText': ['Данные: {data} · фото: {photos}', 'Maʼlumotlar: {data} · rasmlar: {photos}', 'Data: {data} · photos: {photos}'],
    'dash.recent': ['Недавно изменённые товары', 'Yaqinda o‘zgartirilgan mahsulotlar', 'Recently updated products'],
    'dash.allProducts': ['Все товары', 'Barcha mahsulotlar', 'All products'],
    'dash.openProducts': ['Товары магазина {name}', '{name} mahsulotlari', 'Products of {name}'],

    'stores.subtitle': ['{n} на 4 этажах', '4 qavatda {n}', '{n} on 4 floors'],
    'stores.filter': ['Фильтр магазинов…', 'Do‘konlarni saralash…', 'Filter stores…'],
    'stores.none': ['Нет магазинов по этому фильтру.', 'Bu filtr bo‘yicha do‘kon yo‘q.', 'No stores match your filter.'],
    'stores.slot': ['{floor} · место {slot}', '{floor} · {slot}-joy', '{floor} · slot {slot}'],
    'stores.view': ['Посмотреть {name} на сайте', '{name}ni saytda ko‘rish', 'View {name} on the site'],
    'stores.edit': ['Изменить {name}', '{name}ni tahrirlash', 'Edit {name}'],
    'stores.delete': ['Удалить {name}', '{name}ni o‘chirish', 'Delete {name}'],
    'del.storeT': ['Удалить «{name}»?', '«{name}» o‘chirilsinmi?', 'Delete {name}?'],
    'del.storeD': ['Вместе с ним удалятся товары ({n}) и их фото. Это нельзя отменить — при сомнениях сначала сделайте экспорт.', 'U bilan birga mahsulotlar ({n}) va ularning rasmlari o‘chadi. Buni qaytarib bo‘lmaydi — avval eksport qiling.', 'This also deletes its {n} products and their photos. You can’t undo this (export a backup first if unsure).'],
    'del.storeBtn': ['Удалить магазин', 'Do‘konni o‘chirish', 'Delete store'],
    'del.done': ['«{name}» удалён.', '«{name}» o‘chirildi.', '{name} was deleted.'],
    'notFound.store': ['Такого магазина нет', 'Bunday do‘kon yo‘q', 'This store does not exist'],
    'notFound.back': ['К списку магазинов', 'Do‘konlar ro‘yxatiga', 'Back to stores'],

    'editor.newT': ['Новый магазин', 'Yangi do‘kon', 'New store'],
    'editor.editT': ['Изменить: {name}', 'Tahrirlash: {name}', 'Edit {name}'],
    'editor.newSub': ['Заполните данные и выберите место в атриуме', 'Maʼlumotlarni to‘ldiring va atriumda joy tanlang', 'Fill in the details and pick a place in the atrium'],
    'editor.idSub': ['ID магазина: {id}', 'Do‘kon ID: {id}', 'Store id: {id}'],
    'editor.create': ['Создать магазин', 'Do‘kon yaratish', 'Create store'],
    'editor.created': ['Магазин «{name}» создан.', '«{name}» do‘koni yaratildi.', '{name} was created.'],
    'editor.saved': ['Изменения в «{name}» сохранены.', '«{name}» o‘zgarishlari saqlandi.', '{name} was saved.'],
    'editor.sectionText': ['Название и описание', 'Nomi va tavsifi', 'Name & description'],
    'editor.sectionLook': ['Внешний вид', 'Tashqi ko‘rinish', 'Look'],
    'editor.sectionPlace': ['Место в атриуме', 'Atriumdagi joy', 'Place in the atrium'],
    'f.name': ['Название', 'Nomi', 'Name'],
    'f.category': ['Категория', 'Toifa', 'Category'],
    'f.description': ['Описание', 'Tavsif', 'Description'],
    'f.keywords': ['Ключевые слова для поиска', 'Qidiruv uchun kalit so‘zlar', 'Search keywords'],
    'f.keywordsHint': ['Через запятую: «одежда, платья»', 'Vergul bilan: «kiyim, ko‘ylak»', 'Comma separated: “clothes, dresses”'],
    'f.logo': ['Эмодзи-логотип', 'Emoji logotip', 'Logo emoji'],
    'f.logoImage': ['Логотип (картинка)', 'Logotip (rasm)', 'Logo image'],
    'f.logoHint': ['Необязательно. Заменяет эмодзи.', 'Ixtiyoriy. Emojini almashtiradi.', 'Optional. Replaces the emoji.'],
    'f.cover': ['Фото витрины и шапки', 'Vitrina va sarlavha rasmi', 'Shop front & header photo'],
    'f.coverHint': ['Без своего фото используется фото из интернета.', 'O‘z rasmingiz bo‘lmasa, internetdan olingan rasm ishlatiladi.', 'Without your own photo, the bundled internet photo is used.'],
    'f.color': ['Фирменный цвет', 'Brend rangi', 'Brand colour'],
    'f.colorPresets': ['Готовые цвета', 'Tayyor ranglar', 'Preset colours'],
    'f.hours': ['Часы работы', 'Ish vaqti', 'Working hours'],
    'f.openTime': ['Открытие', 'Ochilish', 'Opening time'],
    'f.closeTime': ['Закрытие', 'Yopilish', 'Closing time'],
    'f.floor': ['Этаж', 'Qavat', 'Floor'],
    'f.slot': ['Место на этаже (слева направо)', 'Qavatdagi joy (chapdan o‘ngga)', 'Position on the floor (left to right)'],
    'f.slotHint': ['Выберите свободное место или поменяйтесь с другим магазином. На этаже до 6 мест.', 'Bo‘sh joyni tanlang yoki boshqa do‘kon bilan almashing. Qavatda 6 tagacha joy.', 'Pick a free place or swap with another store. Up to 6 places per floor.'],
    'f.price': ['Цена ({cur})', 'Narx ({cur})', 'Price ({cur})'],
    'f.store': ['Магазин', 'Do‘kon', 'Store'],
    'f.stock': ['В наличии', 'Mavjud', 'In stock'],
    'f.emoji': ['Эмодзи-заглушка', 'Emoji o‘rinbosar', 'Placeholder emoji'],
    'f.emojiHint': ['Показывается, когда нет фото.', 'Rasm bo‘lmasa ko‘rsatiladi.', 'Shown when there is no photo.'],
    'f.photos': ['Фотографии', 'Rasmlar', 'Photos'],
    'f.photosHint': ['До {n} фото. Первое — обложка.', '{n} tagacha rasm. Birinchisi — muqova.', 'Up to {n} photos. The first one is the cover.'],
    'f.required': ['обязательно', 'majburiy', 'required'],
    'f.langTab': ['Язык перевода', 'Tarjima tili', 'Translation language'],
    'f.missingLang': ['Нет перевода', 'Tarjima yo‘q', 'Missing translation'],
    'copy.langs': ['Скопировать в пустые языки', 'Bo‘sh tillarga nusxalash', 'Copy to empty languages'],
    'copy.done': ['Текст скопирован в незаполненные языки.', 'Matn to‘ldirilmagan tillarga nusxalandi.', 'Copied into the languages that were empty.'],
    'copy.nothing': ['Сначала заполните текущий язык.', 'Avval joriy tilni to‘ldiring.', 'Fill in the current language first.'],
    'slot.free': ['Свободно', 'Bo‘sh', 'Free'],
    'slot.here': ['Этот магазин', 'Shu do‘kon', 'This store'],
    'slot.place': ['Место {n}', '{n}-joy', 'Place {n}'],
    'slot.swapWith': ['Поменяться с «{name}»', '«{name}» bilan almashish', 'Swap with {name}'],
    'slot.full': ['На этом этаже нет свободных мест.', 'Bu qavatda bo‘sh joy yo‘q.', 'This floor has no free places.'],
    'unsaved.leaveT': ['Уйти без сохранения?', 'Saqlamasdan chiqasizmi?', 'Leave without saving?'],
    'unsaved.leaveD': ['Изменения будут потеряны.', 'O‘zgarishlar yo‘qoladi.', 'Your changes to this item will be lost.'],
    'unsaved.leaveBtn': ['Уйти', 'Chiqish', 'Leave page'],
    'unsaved.logoutT': ['Отменить несохранённые изменения?', 'Saqlanmagan o‘zgarishlar bekor qilinsinmi?', 'Discard unsaved changes?'],
    'unsaved.logoutBtn': ['Отменить и выйти', 'Bekor qilib chiqish', 'Discard and log out'],

    'products.subtitle': ['{n} в магазине «{store}»', '«{store}» do‘konida {n}', '{n} in {store}'],
    'products.new': ['Новый товар', 'Yangi mahsulot', 'New product'],
    'products.filter': ['Фильтр товаров…', 'Mahsulotlarni saralash…', 'Filter products…'],
    'products.chooseStore': ['Выберите магазин', 'Do‘konni tanlang', 'Choose a store'],
    'products.editStore': ['Изменить магазин', 'Do‘konni tahrirlash', 'Edit store'],
    'products.noStoresT': ['Сначала создайте магазин', 'Avval do‘kon yarating', 'Create a store first'],
    'products.noStoresD': ['Товары всегда принадлежат магазину.', 'Mahsulotlar har doim do‘konga tegishli.', 'Products always belong to a store.'],
    'products.noneT': ['Товаров пока нет', 'Hozircha mahsulot yo‘q', 'No products yet'],
    'products.noMatch': ['Нет подходящих товаров', 'Mos mahsulot yo‘q', 'No products match'],
    'products.first': ['Добавить первый товар', 'Birinchi mahsulotni qo‘shish', 'Add the first product'],
    'products.stockAria': ['«{name}» в наличии', '«{name}» mavjud', '{name} in stock'],
    'products.stockOn': ['«{name}» теперь в наличии.', '«{name}» endi mavjud.', '{name} is now in stock.'],
    'products.stockOff': ['«{name}» теперь нет в наличии.', '«{name}» endi mavjud emas.', '{name} is now out of stock.'],
    'products.edit': ['Изменить «{name}»', '«{name}»ni tahrirlash', 'Edit {name}'],
    'products.delete': ['Удалить «{name}»', '«{name}»ni o‘chirish', 'Delete {name}'],
    'del.productT': ['Удалить «{name}»?', '«{name}» o‘chirilsinmi?', 'Delete {name}?'],
    'del.productD': ['Товар и его фото будут удалены. Это нельзя отменить.', 'Mahsulot va uning rasmlari o‘chiriladi. Buni qaytarib bo‘lmaydi.', 'The product and its photos will be deleted. This can’t be undone.'],
    'del.productBtn': ['Удалить товар', 'Mahsulotni o‘chirish', 'Delete product'],
    'pform.newT': ['Новый товар', 'Yangi mahsulot', 'New product'],
    'pform.editT': ['Изменить товар', 'Mahsulotni tahrirlash', 'Edit product'],
    'pform.add': ['Добавить товар', 'Mahsulot qo‘shish', 'Add product'],
    'pform.save': ['Сохранить товар', 'Mahsulotni saqlash', 'Save product'],
    'pform.added': ['Товар «{name}» добавлен.', '«{name}» mahsuloti qo‘shildi.', '{name} was added.'],
    'pform.saved': ['Товар «{name}» сохранён.', '«{name}» mahsuloti saqlandi.', '{name} was saved.'],

    /* image manager */
    'img.drop': ['Перетащите фото сюда, вставьте из буфера (Ctrl+V) или', 'Rasmni shu yerga torting, buferdan qo‘ying (Ctrl+V) yoki', 'Drop photos here, paste (Ctrl+V) or'],
    'img.choose': ['выберите файлы', 'fayllarni tanlang', 'choose files'],
    'img.chooseOne': ['выберите файл', 'faylni tanlang', 'choose a file'],
    'img.camera': ['Камера или галерея', 'Kamera yoki galereya', 'Camera or gallery'],
    'img.types': ['JPG, PNG или WebP, до {mb} МБ. Сжимаем до {px} px.', 'JPG, PNG yoki WebP, {mb} MB gacha. {px} px gacha siqiladi.', 'JPG, PNG or WebP, up to {mb} MB. Resized to {px} px.'],
    'img.url': ['Ссылка на изображение (https://)', 'Rasm havolasi (https://)', 'Image link (https://)'],
    'img.urlAdd': ['Добавить по ссылке', 'Havola orqali qo‘shish', 'Add from link'],
    'img.urlBad': ['Разрешены только ссылки https:// на изображения.', 'Faqat https:// rasm havolalariga ruxsat berilgan.', 'Only https:// image links are allowed.'],
    'img.cover': ['Обложка', 'Muqova', 'Cover'],
    'img.makeCover': ['Сделать обложкой', 'Muqova qilish', 'Make cover'],
    'img.left': ['Переместить влево', 'Chapga surish', 'Move left'],
    'img.right': ['Переместить вправо', 'O‘ngga surish', 'Move right'],
    'img.remove': ['Удалить фото', 'Rasmni o‘chirish', 'Remove photo'],
    'img.alt': ['Фото {i}', '{i}-rasm', 'Photo {i}'],
    'img.max': ['Можно добавить не больше {n} фото.', '{n} tadan ortiq rasm qo‘shib bo‘lmaydi.', 'You can add up to {n} photos.'],
    'img.badType': ['«{file}»: поддерживаются только JPG, PNG и WebP.', '«{file}»: faqat JPG, PNG va WebP qo‘llab-quvvatlanadi.', '“{file}”: only JPG, PNG and WebP are supported.'],
    'img.tooBig': ['«{file}» больше {mb} МБ.', '«{file}» {mb} MB dan katta.', '“{file}” is larger than {mb} MB.'],
    'img.readFail': ['«{file}» не удалось прочитать как изображение.', '«{file}»ni rasm sifatida o‘qib bo‘lmadi.', '“{file}” could not be read as an image.'],
    'img.processing': ['Обработка…', 'Ishlanmoqda…', 'Processing…'],
    'img.ready': [{ one: 'Добавлено {n} фото ({size}).', few: 'Добавлено {n} фото ({size}).', many: 'Добавлено {n} фото ({size}).', other: 'Добавлено {n} фото ({size}).' }, { other: '{n} ta rasm qo‘shildi ({size}).' }, { one: '{n} photo added ({size}).', other: '{n} photos added ({size}).' }],
    'img.loadFail': ['Не удалось загрузить изображение.', 'Rasmni yuklab bo‘lmadi.', 'This image could not be loaded.'],
    'img.idbOff': ['Хранилище фото (IndexedDB) недоступно в этом браузере: фото сохранятся только до перезагрузки.', 'Bu brauzerda rasm xotirasi (IndexedDB) mavjud emas: rasmlar faqat sahifa yangilanguncha saqlanadi.', 'Photo storage (IndexedDB) is not available in this browser: photos will only last until you reload.'],
    'img.quota': ['В хранилище браузера закончилось место. Удалите часть фото или сделайте экспорт и сброс.', 'Brauzer xotirasida joy qolmadi. Ba’zi rasmlarni o‘chiring yoki eksport qilib, qayta tiklang.', 'Browser storage is full. Remove some photos, or export your data and reset.'],
    'img.none': ['Нет фото', 'Rasm yo‘q', 'No photo'],
    'img.change': ['Заменить', 'Almashtirish', 'Replace'],

    /* data screen */
    'data.subtitle': ['Всё хранится в этом браузере (localStorage + IndexedDB)', 'Hammasi shu brauzerda saqlanadi (localStorage + IndexedDB)', 'Everything is saved in this browser (localStorage + IndexedDB)'],
    'data.exportT': ['Экспорт', 'Eksport', 'Export'],
    'data.exportD': ['Скачайте все магазины ({s}), товары ({p}) и ваши фото одним JSON-файлом. Это полная резервная копия.', 'Barcha do‘konlar ({s}), mahsulotlar ({p}) va rasmlaringizni bitta JSON faylga yuklab oling. Bu to‘liq zaxira nusxa.', 'Download all {s} stores, {p} products and your photos as one JSON file. It is a complete backup.'],
    'data.exportBtn': ['Экспорт (JSON)', 'Eksport (JSON)', 'Export data (JSON)'],
    'data.exportDone': ['Экспортировано: магазинов {s}, товаров {p}, фото {i}.', 'Eksport qilindi: {s} do‘kon, {p} mahsulot, {i} rasm.', 'Exported {s} stores, {p} products and {i} photos.'],
    'data.importT': ['Импорт', 'Import', 'Import'],
    'data.importD': ['Загрузите файл, экспортированный из этой панели. Каждая запись и фото проверяются перед сохранением.', 'Shu paneldan eksport qilingan faylni yuklang. Har bir yozuv va rasm saqlashdan oldin tekshiriladi.', 'Load a file exported from this panel. Every entry and photo is validated before it is saved.'],
    'data.importBtn': ['Выбрать JSON-файл…', 'JSON faylni tanlash…', 'Choose JSON file…'],
    'data.importT2': ['Заменить все данные?', 'Barcha maʼlumotlar almashtirilsinmi?', 'Replace all data?'],
    'data.importD2': ['В файле магазинов: {s}, товаров: {p}, фото: {i}{skipped}. Текущие данные и загруженные фото будут заменены.', 'Faylda {s} do‘kon, {p} mahsulot, {i} rasm bor{skipped}. Joriy maʼlumotlar va yuklangan rasmlar almashtiriladi.', 'The file has {s} stores, {p} products and {i} photos{skipped}. Your current data and uploaded photos will be replaced.'],
    'data.importSkipped': [' (пропустим неверных записей: {n})', ' ({n} ta noto‘g‘ri yozuv o‘tkazib yuboriladi)', ' ({n} invalid entries will be skipped)'],
    'data.importBtn2': ['Импортировать и заменить', 'Import qilib almashtirish', 'Import and replace'],
    'data.importDone': ['Импортировано: магазинов {s}, товаров {p}, фото {i}.', 'Import qilindi: {s} do‘kon, {p} mahsulot, {i} rasm.', 'Imported {s} stores, {p} products and {i} photos.'],
    'data.resetT': ['Сброс', 'Qayta tiklash', 'Reset'],
    'data.resetD': ['Вернуть 16 демо-магазинов с товарами и фото. Ваши загруженные фото будут удалены. Корзина не затрагивается.', '16 ta demo do‘konni mahsulot va rasmlari bilan qaytarish. Yuklagan rasmlaringiz o‘chiriladi. Savatga ta’sir qilmaydi.', 'Restore the original 16 demo stores with their products and photos. Your uploaded photos are deleted. The cart is not affected.'],
    'data.resetBtn': ['Сбросить к демо-данным', 'Demo maʼlumotlarga qaytarish', 'Reset to demo data'],
    'data.resetT2': ['Сбросить к демо-данным?', 'Demo maʼlumotlarga qaytarilsinmi?', 'Reset to demo data?'],
    'data.resetD2': ['Все добавленные и изменённые магазины, товары и загруженные фото будут заменены исходными демо-данными. Сначала сделайте экспорт, если хотите их сохранить.', 'Qo‘shilgan va o‘zgartirilgan barcha do‘konlar, mahsulotlar va yuklangan rasmlar asl demo maʼlumotlar bilan almashtiriladi. Saqlab qolmoqchi bo‘lsangiz, avval eksport qiling.', 'All stores and products you added or changed, and all uploaded photos, will be replaced by the original demo data. Export a backup first if you want to keep them.'],
    'data.resetBtn2': ['Сбросить всё', 'Hammasini tiklash', 'Reset everything'],
    'data.resetDone': ['Демо-данные восстановлены: магазинов {s}, товаров {p}.', 'Demo maʼlumotlar tiklandi: {s} do‘kon, {p} mahsulot.', 'Demo data restored: {s} stores, {p} products.'],
    'data.usageT': ['Использовано места', 'Ishlatilgan joy', 'Storage used'],
    'data.usageD': ['Текст хранится в localStorage (~5 МБ), фото — в IndexedDB (обычно сотни МБ). Фото автоматически сжимаются.', 'Matn localStorage’da (~5 MB), rasmlar IndexedDB’da (odatda yuzlab MB) saqlanadi. Rasmlar avtomatik siqiladi.', 'Text lives in localStorage (~5 MB), photos in IndexedDB (usually hundreds of MB). Photos are compressed automatically.'],
    'sec.title': ['О безопасности в этом демо', 'Ushbu demodagi xavfsizlik haqida', 'About security in this demo'],
    'sec.1': ['Пароль хранится только как хеш SHA-256 с солью (20 000 раундов). Смените его в js/config.js.', 'Parol faqat tuzli SHA-256 xeshi sifatida saqlanadi (20 000 marta). Uni js/config.js da o‘zgartiring.', 'The admin password is stored only as a salted, key-stretched SHA-256 hash (20 000 rounds). Change it in js/config.js.'],
    'sec.2': ['Вход ограничен: 5 попыток, затем блокировка с удвоением. Сессия истекает через 30 минут бездействия.', 'Kirish cheklangan: 5 urinish, keyin ikki baravar oshib boruvchi blok. 30 daqiqa harakatsizlikdan so‘ng sessiya tugaydi.', 'Logins are rate-limited (5 tries, then a lockout that doubles). Sessions expire after 30 idle minutes.'],
    'sec.3': ['Весь текст очищается при сохранении и выводится через textContent, поэтому не может внедрить код.', 'Barcha matn saqlashda tozalanadi va textContent orqali chiqariladi, shuning uchun kod kirita olmaydi.', 'All text is sanitised on save and rendered with textContent, so stored text cannot inject code.'],
    'sec.4': ['Строгая политика CSP блокирует встроенные и сторонние скрипты.', 'Qat’iy CSP siyosati ichki va uchinchi tomon skriptlarini bloklaydi.', 'A strict Content-Security-Policy blocks inline and third-party scripts.'],
    'sec.warn': ['Но без сервера любой с DevTools может обойти этот вход или изменить данные. Перед подключением реальных продавцов перенесите вход и данные в Supabase/Firebase (см. README).', 'Lekin serversiz DevTools bilan istalgan kishi bu kirishni chetlab o‘tishi yoki maʼlumotlarni o‘zgartirishi mumkin. Haqiqiy sotuvchilardan oldin kirish va maʼlumotlarni Supabase/Firebase’ga o‘tkazing (README).', 'Still: without a server, anyone with browser DevTools can bypass this login or edit the data. Before real sellers use it, move auth and data to Supabase/Firebase (see README).'],

    /* validation (keys returned by js/storage.js) */
    'err.fix': ['Исправьте отмеченные поля.', 'Belgilangan maydonlarni tuzating.', 'Please fix the highlighted fields.'],
    'err.name': ['Название — минимум 2 символа хотя бы на одном языке.', 'Nom kamida bitta tilda 2 belgidan iborat bo‘lsin.', 'Name must be at least 2 characters in at least one language.'],
    'err.category': ['Укажите категорию.', 'Toifani kiriting.', 'Please enter a category.'],
    'err.price': ['Введите цену 0 или больше.', '0 yoki undan katta narx kiriting.', 'Enter a price of 0 or more.'],
    'err.priceHigh': ['Цена слишком большая для демо.', 'Narx demo uchun juda katta.', 'That price looks too high for a demo.'],
    'err.store': ['Выберите магазин.', 'Do‘konni tanlang.', 'Choose a store.'],
    'err.storeGone': ['Этот магазин больше не существует.', 'Bu do‘kon endi mavjud emas.', 'That store no longer exists.'],
    'err.maxStores': ['В демо можно до {n} магазинов.', 'Demoda {n} tagacha do‘kon bo‘lishi mumkin.', 'The demo supports up to {n} stores.'],
    'err.maxProducts': ['В магазине может быть до {n} товаров.', 'Do‘konda {n} tagacha mahsulot bo‘lishi mumkin.', 'A store can have up to {n} products.'],
    'err.floorFull': ['На этом этаже уже 6 магазинов. Выберите другой этаж.', 'Bu qavatda allaqachon 6 ta do‘kon bor. Boshqa qavatni tanlang.', 'This floor already has 6 stores. Choose another floor.'],
    'err.quota': ['Хранилище браузера заполнено. Удалите часть фото или сделайте экспорт и сброс.', 'Brauzer xotirasi to‘ldi. Ba’zi rasmlarni o‘chiring yoki eksport qilib qayta tiklang.', 'Browser storage is full. Remove some photos, or export your data and reset.'],
    'err.importJson': ['Это не корректный JSON-файл.', 'Bu to‘g‘ri JSON fayl emas.', 'This is not a valid JSON file.'],
    'err.importShape': ['Неверный файл: ожидается { "stores": [...], "products": [...] }.', 'Noto‘g‘ri fayl: { "stores": [...], "products": [...] } kutilgan.', 'Invalid file: expected { "stores": [...], "products": [...] }.'],
    'err.importEmpty': ['В файле нет корректных магазинов.', 'Faylda to‘g‘ri do‘konlar yo‘q.', 'The file contains no valid stores.'],
    'err.importBig': ['Файл слишком большой (максимум {mb} МБ).', 'Fayl juda katta (maksimal {mb} MB).', 'This file is too large (max {mb} MB).'],
    'err.generic': ['Что-то пошло не так. Попробуйте ещё раз.', 'Nimadir noto‘g‘ri ketdi. Qayta urinib ko‘ring.', 'Something went wrong. Please try again.'],
  };
  /* eslint-enable max-len */

  /* ------------------------------------------------------------- engine */
  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  let lang = LANGS.includes(read()) ? read() : DEFAULT;
  const listeners = new Set();
  const pluralRules = {};
  const plural = (n) => (pluralRules[lang] || (pluralRules[lang] = new Intl.PluralRules(LOCALES[lang]))).select(n);

  function format(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
  }

  /** Translate a key. Missing keys fall back to English, then the key itself (and warn in DEBUG). */
  function t(key, vars) {
    const entry = D[key];
    if (!entry) {
      if (global.MALL_CONFIG && global.MALL_CONFIG.DEBUG) console.warn('[i18n] missing key', key);
      return key;
    }
    let v = entry[IDX[lang]];
    if (v == null || v === '') v = entry[2];
    if (typeof v === 'object') {
      const n = vars && Number(vars.n);
      v = v[plural(Number.isFinite(n) ? n : 0)] || v.other || v.many || Object.values(v)[0];
    }
    return format(v, vars);
  }

  /** Pick the active-language value of a translation object { ru, uz, en } with sensible fallbacks. */
  function L(obj, l = lang) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[l] || obj.ru || obj.en || obj.uz || '';
  }

  /** Fill [data-i18n] text and [data-i18n-attr] attributes inside root. */
  function apply(root = document) {
    for (const el of root.querySelectorAll('[data-i18n]')) {
      el.textContent = t(el.dataset.i18n, el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : undefined);
    }
    for (const el of root.querySelectorAll('[data-i18n-attr]')) {
      for (const pair of el.dataset.i18nAttr.split(';')) {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      }
    }
    document.documentElement.lang = lang === 'uz' ? 'uz-Latn' : lang;
  }

  /** Switch language: fade out, update everything, fade in. */
  function set(next) {
    if (!LANGS.includes(next) || next === lang) return;
    const root = document.documentElement;
    const reduced = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const swap = () => {
      lang = next;
      try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ }
      apply();
      listeners.forEach((fn) => { try { fn(lang); } catch (e) { console.error(e); } });
      document.dispatchEvent(new CustomEvent('mall:lang', { detail: { lang } }));
    };
    if (reduced) { swap(); return; }
    root.classList.add('lang-fading');
    setTimeout(() => {
      swap();
      requestAnimationFrame(() => root.classList.remove('lang-fading'));
    }, 160);
  }

  Mall.i18n = {
    LANGS,
    get lang() { return lang; },
    get locale() { return LOCALES[lang]; },
    t, L, apply, set,
    has: (key) => key in D,
    keys: () => Object.keys(D),
    entry: (key) => D[key],
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
  Mall.t = t;
  Mall.L = L;
})(window);

/* =========================================================
   TRANSLATIONS — every visible text on the site lives here.
   Languages: ru (default), uz (Latin), en.
   Keys are referenced from HTML via data-i18n="section.key".
   Placeholders in {curly} braces are filled in by main.js.
   Russian plural forms are arrays: [one, few, many].
   ========================================================= */
const TRANSLATIONS = {
  /* -------------------------------------------------------
     RUSSIAN (default)
     ------------------------------------------------------- */
  ru: {
    meta: {
      title: "Vortaq Fitness Club — тренажёрный зал и фитнес в Ташкенте",
      description: "Современный тренажёрный зал в Ташкенте: опытные тренеры, кроссфит, бокс, йога, душевые и бесплатная парковка. Запишитесь на бесплатную пробную тренировку!",
      ogLocale: "ru_RU"
    },
    a11y: {
      skip: "Перейти к содержанию",
      menuOpen: "Открыть меню",
      menuClose: "Закрыть меню",
      language: "Язык сайта",
      telegram: "Написать нам в Telegram",
      home: "Vortaq Fitness Club — на главную",
      close: "Закрыть",
      prev: "Предыдущее фото",
      next: "Следующее фото",
      openPhoto: "Открыть фото: {alt}"
    },
    nav: {
      about: "Преимущества",
      plans: "Абонементы",
      trainers: "Тренеры",
      schedule: "Расписание",
      gallery: "Галерея",
      faq: "Вопросы",
      contact: "Контакты",
      cta: "Пробная тренировка"
    },
    hero: {
      eyebrow: "Фитнес-клуб · Ташкент",
      title1: "Построй своё",
      title2: "лучшее тело",
      subtitle: "Современный зал, опытные тренеры и групповые программы — всё, чтобы вы видели результат быстрее и тренировались с удовольствием.",
      ctaTrial: "Бесплатная тренировка",
      ctaPlans: "Смотреть абонементы",
      statArea: "м² зала",
      statTrainers: ["тренер", "тренера", "тренеров"],
      statClasses: ["групповое занятие в неделю", "групповых занятия в неделю", "групповых занятий в неделю"]
    },
    about: {
      eyebrow: "Почему Vortaq",
      title: "Всё для результата — в одном клубе",
      equipment: { title: "Современное оборудование", text: "Тренажёры премиум-класса, гантели до 50 кг и отдельная функциональная зона." },
      trainers: { title: "Опытные тренеры", text: "Сертифицированные тренеры со стажем от 5 лет поставят технику и составят программу под вашу цель." },
      showers: { title: "Душевые и раздевалки", text: "Чистые просторные раздевалки, душевые с горячей водой и шкафчики с ключом." },
      late: { title: "Работаем допоздна", text: "Открыты с 6 утра до 23:00 — тренируйтесь до работы или после неё." },
      groups: { title: "Групповые занятия", text: "Кроссфит, бокс, йога, функциональный тренинг и стретчинг — {count} занятий каждую неделю." },
      parking: { title: "Бесплатная парковка", text: "Охраняемая парковка прямо у входа для всех членов клуба." }
    },
    plans: {
      eyebrow: "Абонементы",
      title: "Выберите свой абонемент",
      subtitle: "Прозрачные цены без скрытых платежей. Первая тренировка — бесплатно.",
      choose: "Выбрать",
      perMonthOnly: "в месяц",
      perMonth: "≈ {price} в месяц",
      perVisit: "за одно посещение",
      perPackage: "за пакет",
      save: "Экономия {n}%",
      badge: { popular: "Популярный", best: "Самый выгодный", addon: "Дополнительно" },
      names: {
        single: "Разовое посещение",
        m1: "1 месяц",
        m3: "3 месяца",
        m6: "6 месяцев",
        m12: "12 месяцев",
        pt8: "Персональный тренер · 8 тренировок",
        trial: "Бесплатная пробная тренировка"
      },
      taglines: {
        single: "Попробовать зал",
        m1: "Чтобы начать",
        m3: "Оптимальный старт",
        m6: "Для стабильного результата",
        m12: "Максимум выгоды",
        pt8: "Индивидуальный подход и быстрый результат. Можно добавить к любому абонементу."
      },
      features: {
        gymOnce: "Посещение зала в любое время",
        gymUnlimited: "Безлимитный доступ в зал",
        locker: "Раздевалка, душ и шкафчик",
        groups: "Все групповые занятия",
        ptIntro: "Вводная тренировка с тренером",
        freeze14: "Заморозка до 14 дней",
        freeze30: "Заморозка до 30 дней",
        freeze60: "Заморозка до 60 дней",
        guest2: "2 гостевых визита для друга",
        guest5: "5 гостевых визитов для друзей",
        towel: "Полотенце в каждый визит",
        pt8: "8 персональных тренировок по 60 минут",
        ptProgram: "Программа тренировок под вашу цель",
        ptNutrition: "Рекомендации по питанию",
        ptValid: "Действует 45 дней"
      }
    },
    trainers: {
      eyebrow: "Команда",
      title: "Тренеры, которые доводят до результата",
      years: ["год опыта", "года опыта", "лет опыта"],
      specialty: {
        bodybuilding: "Бодибилдинг",
        crossfit: "Кроссфит и функционал",
        boxing: "Бокс",
        yoga: "Йога и стретчинг"
      },
      t1: { name: "Рустам Каримов", bio: "КМС по бодибилдингу. Набор массы, рельеф и подготовка к соревнованиям." },
      t2: { name: "Камила Насырова", bio: "Тренер CrossFit L2. Выносливость, сила и отличная форма для повседневной жизни." },
      t3: { name: "Бекзод Турсунов", bio: "Мастер спорта по боксу. Техника, кардио и уверенность в себе с первой тренировки." },
      t4: { name: "Мадина Алиева", bio: "Инструктор хатха-йоги и стретчинга. Гибкость, осанка и восстановление после нагрузок." }
    },
    schedule: {
      eyebrow: "Расписание",
      title: "Групповые занятия на неделю",
      subtitle: "Все групповые занятия входят в абонементы от 1 месяца.",
      today: "Сегодня",
      min: "мин",
      empty: "Групповых занятий нет — зал открыт",
      swipe: "Листайте влево и вправо, чтобы сменить день",
      days: {
        short: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
        long: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]
      },
      classes: {
        crossfit: "Кроссфит",
        boxing: "Бокс",
        yoga: "Йога",
        functional: "Функциональный тренинг",
        stretching: "Стретчинг"
      }
    },
    gallery: {
      eyebrow: "Галерея",
      title: "Загляните к нам в зал",
      alts: {
        g1: "Стойки с гантелями в приглушённом свете зала",
        g2: "Ряды гантелей в тренажёрном зале",
        g3: "Спортсмен тренируется у боксёрских груш",
        g4: "Мужчина выполняет становую тягу со штангой",
        g5: "Групповая тренировка с гантелями",
        g6: "Групповое функциональное занятие в зале",
        g7: "Боксёр отрабатывает удары по груше",
        g8: "Атлет выполняет подъём штанги на бицепс"
      }
    },
    faq: {
      eyebrow: "Вопросы",
      title: "Частые вопросы",
      q1: { q: "Что взять с собой на тренировку?", a: "Спортивную форму, чистую сменную обувь, полотенце и бутылку воды. Замок для шкафчика не нужен — ключ выдадут на ресепшене." },
      q2: { q: "Как проходит бесплатная пробная тренировка?", a: "Оставьте заявку — мы перезвоним и подберём удобное время. Тренер покажет зал, оценит вашу подготовку и проведёт тренировку под ваш уровень. Это ни к чему не обязывает." },
      q3: { q: "Можно ли заморозить абонемент?", a: "Да. Абонементы на 3, 6 и 12 месяцев можно заморозить на 14, 30 и 60 дней соответственно — например, на время отпуска или болезни. Достаточно предупредить администратора." },
      q4: { q: "С какого возраста можно заниматься?", a: "В тренажёрном зале — с 16 лет, с 14 лет — под присмотром тренера и с согласия родителей. Верхнего возрастного ограничения нет: тренеры подберут нагрузку для любого возраста." },
      q5: { q: "Какие способы оплаты вы принимаете?", a: "Наличные, карты Uzcard и Humo, Visa и Mastercard, а также Click и Payme. Абонемент можно оформить в рассрочку — уточните у администратора." }
    },
    contact: {
      eyebrow: "Контакты",
      title: "Запишитесь на бесплатную тренировку",
      subtitle: "Оставьте номер — администратор перезвонит в течение 15 минут в рабочее время.",
      address: "Адрес",
      hours: "Часы работы",
      weekdays: "Пн–Пт",
      weekend: "Сб–Вс",
      phone: "Телефон",
      social: "Мы в соцсетях",
      mapTitle: "Карта: Vortaq Fitness Club в Ташкенте"
    },
    form: {
      title: "Заявка на тренировку",
      name: "Имя",
      namePh: "Как к вам обращаться?",
      phone: "Телефон",
      phonePh: "+998 (90) 123-45-67",
      plan: "Абонемент",
      planPh: "Выберите вариант",
      time: "Удобное время для звонка",
      timePh: "Выберите время",
      times: { morning: "Утро (06:00–12:00)", day: "День (12:00–17:00)", evening: "Вечер (17:00–23:00)" },
      submit: "Отправить заявку",
      sending: "Отправляем…",
      privacy: "Нажимая кнопку, вы соглашаетесь на обработку персональных данных.",
      errors: {
        name: "Введите имя — минимум 2 буквы",
        phone: "Введите номер полностью: +998 XX XXX-XX-XX",
        plan: "Выберите абонемент",
        time: "Выберите удобное время",
        submit: "Не удалось отправить заявку. Позвоните нам или напишите в Telegram.",
        rate: "Заявка уже отправлена. Подождите минуту перед следующей."
      },
      success: {
        title: "Спасибо! Мы скоро вам позвоним",
        text: "Заявка принята. Администратор свяжется с вами в ближайшее время, чтобы подобрать удобное время.",
        again: "Отправить ещё одну заявку"
      }
    },
    footer: {
      tagline: "Фитнес-клуб в Ташкенте. Тренируйтесь с нами — результат не заставит себя ждать.",
      links: "Разделы",
      contacts: "Контакты",
      language: "Язык",
      rights: "Все права защищены.",
      demo: "Демо-сайт: цены и данные указаны для примера."
    }
  },

  /* -------------------------------------------------------
     UZBEK (Latin)
     ------------------------------------------------------- */
  uz: {
    meta: {
      title: "Vortaq Fitness Club — Toshkentdagi sport zali va fitnes",
      description: "Toshkentdagi zamonaviy sport zali: tajribali murabbiylar, krossfit, boks, yoga, dush va bepul avtoturargoh. Bepul sinov mashgʻulotiga yoziling!",
      ogLocale: "uz_UZ"
    },
    a11y: {
      skip: "Asosiy kontentga oʻtish",
      menuOpen: "Menyuni ochish",
      menuClose: "Menyuni yopish",
      language: "Sayt tili",
      telegram: "Bizga Telegramda yozing",
      home: "Vortaq Fitness Club — bosh sahifa",
      close: "Yopish",
      prev: "Oldingi rasm",
      next: "Keyingi rasm",
      openPhoto: "Rasmni ochish: {alt}"
    },
    nav: {
      about: "Afzalliklar",
      plans: "Abonementlar",
      trainers: "Murabbiylar",
      schedule: "Jadval",
      gallery: "Galereya",
      faq: "Savollar",
      contact: "Aloqa",
      cta: "Sinov mashgʻuloti"
    },
    hero: {
      eyebrow: "Fitnes klub · Toshkent",
      title1: "Kuchli tanang",
      title2: "shu yerdan boshlanadi",
      subtitle: "Zamonaviy zal, tajribali murabbiylar va guruh mashgʻulotlari — natijaga tezroq va zavq bilan erishishingiz uchun hammasi bor.",
      ctaTrial: "Bepul sinov mashgʻuloti",
      ctaPlans: "Abonementlarni koʻrish",
      statArea: "m² zal maydoni",
      statTrainers: "murabbiy",
      statClasses: "haftalik guruh mashgʻuloti"
    },
    about: {
      eyebrow: "Nega aynan Vortaq",
      title: "Natija uchun hammasi — bitta klubda",
      equipment: { title: "Zamonaviy jihozlar", text: "Premium trenajyorlar, 50 kg gacha gantellar va alohida funksional zona." },
      trainers: { title: "Tajribali murabbiylar", text: "Kamida 5 yillik tajribaga ega sertifikatlangan murabbiylar texnikangizni toʻgʻrilab, maqsadingizga mos dastur tuzib berishadi." },
      showers: { title: "Dush va kiyinish xonalari", text: "Toza va keng kiyinish xonalari, issiq suvli dushlar va kalitli shkafchalar." },
      late: { title: "Kech soatgacha ochiqmiz", text: "Ertalab 6:00 dan kechki 23:00 gacha — ishdan oldin ham, keyin ham shugʻullaning." },
      groups: { title: "Guruh mashgʻulotlari", text: "Krossfit, boks, yoga, funksional trening va stretching — har hafta {count} ta mashgʻulot." },
      parking: { title: "Bepul avtoturargoh", text: "Klub aʼzolari uchun kirish yonida qoʻriqlanadigan avtoturargoh." }
    },
    plans: {
      eyebrow: "Abonementlar",
      title: "Oʻzingizga mos abonementni tanlang",
      subtitle: "Yashirin toʻlovlarsiz shaffof narxlar. Birinchi mashgʻulot — bepul.",
      choose: "Tanlash",
      perMonthOnly: "oyiga",
      perMonth: "≈ oyiga {price}",
      perVisit: "bir tashrif uchun",
      perPackage: "paket uchun",
      save: "{n}% tejaysiz",
      badge: { popular: "Ommabop", best: "Eng foydali", addon: "Qoʻshimcha" },
      names: {
        single: "Bir martalik tashrif",
        m1: "1 oy",
        m3: "3 oy",
        m6: "6 oy",
        m12: "12 oy",
        pt8: "Shaxsiy murabbiy · 8 ta mashgʻulot",
        trial: "Bepul sinov mashgʻuloti"
      },
      taglines: {
        single: "Zalni sinab koʻrish uchun",
        m1: "Boshlash uchun",
        m3: "Eng maqbul tanlov",
        m6: "Barqaror natija uchun",
        m12: "Eng katta tejamkorlik",
        pt8: "Individual yondashuv va tez natija. Istalgan abonementga qoʻshish mumkin."
      },
      features: {
        gymOnce: "Istalgan vaqtda zalga bir marta kirish",
        gymUnlimited: "Zalga cheklanmagan kirish",
        locker: "Kiyinish xonasi, dush va shkafcha",
        groups: "Barcha guruh mashgʻulotlari",
        ptIntro: "Murabbiy bilan tanishuv mashgʻuloti",
        freeze14: "14 kungacha muzlatish",
        freeze30: "30 kungacha muzlatish",
        freeze60: "60 kungacha muzlatish",
        guest2: "Doʻstingiz uchun 2 ta mehmon tashrifi",
        guest5: "Doʻstlaringiz uchun 5 ta mehmon tashrifi",
        towel: "Har tashrifda sochiq",
        pt8: "60 daqiqalik 8 ta shaxsiy mashgʻulot",
        ptProgram: "Maqsadingizga mos mashgʻulot dasturi",
        ptNutrition: "Ovqatlanish boʻyicha tavsiyalar",
        ptValid: "45 kun amal qiladi"
      }
    },
    trainers: {
      eyebrow: "Jamoa",
      title: "Natijaga olib boradigan murabbiylar",
      years: "yillik tajriba",
      specialty: {
        bodybuilding: "Bodibilding",
        crossfit: "Krossfit va funksional",
        boxing: "Boks",
        yoga: "Yoga va stretching"
      },
      t1: { name: "Rustam Karimov", bio: "Bodibilding boʻyicha sport ustaligiga nomzod. Massa yigʻish, relyef va musobaqalarga tayyorgarlik." },
      t2: { name: "Kamila Nasirova", bio: "CrossFit L2 murabbiyi. Chidamlilik, kuch va kundalik hayot uchun ajoyib forma." },
      t3: { name: "Bekzod Tursunov", bio: "Boks boʻyicha sport ustasi. Birinchi mashgʻulotdanoq texnika, kardio va oʻziga ishonch." },
      t4: { name: "Madina Aliyeva", bio: "Xatha-yoga va stretching instruktori. Egiluvchanlik, chiroyli qomat va mashgʻulotdan keyin tiklanish." }
    },
    schedule: {
      eyebrow: "Jadval",
      title: "Haftalik guruh mashgʻulotlari",
      subtitle: "Barcha guruh mashgʻulotlari 1 oylik va undan uzoq abonementlarga kiradi.",
      today: "Bugun",
      min: "daq",
      empty: "Guruh mashgʻulotlari yoʻq — zal ochiq",
      swipe: "Kunni almashtirish uchun chapga yoki oʻngga suring",
      days: {
        short: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"],
        long: ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]
      },
      classes: {
        crossfit: "Krossfit",
        boxing: "Boks",
        yoga: "Yoga",
        functional: "Funksional trening",
        stretching: "Stretching"
      }
    },
    gallery: {
      eyebrow: "Galereya",
      title: "Zalimizga bir nazar tashlang",
      alts: {
        g1: "Xira yorugʻlikdagi gantel stellajlari",
        g2: "Sport zalidagi gantellar qatori",
        g3: "Boks qoplari yonida mashq qilayotgan sportchi",
        g4: "Shtanga bilan stanovoy tortish mashqi",
        g5: "Gantellar bilan guruh mashgʻuloti",
        g6: "Zalda funksional guruh mashgʻuloti",
        g7: "Boksyor qopga zarbalarni mashq qilmoqda",
        g8: "Atlet shtangani bitseps uchun koʻtarmoqda"
      }
    },
    faq: {
      eyebrow: "Savollar",
      title: "Koʻp beriladigan savollar",
      q1: { q: "Mashgʻulotga nima olib kelish kerak?", a: "Sport kiyimi, toza almashtiriladigan poyabzal, sochiq va bir shisha suv. Shkafcha uchun qulf shart emas — kalitni resepshnda berishadi." },
      q2: { q: "Bepul sinov mashgʻuloti qanday oʻtadi?", a: "Ariza qoldiring — qoʻngʻiroq qilib, qulay vaqtni kelishib olamiz. Murabbiy zalni koʻrsatadi, tayyorgarligingizni baholaydi va darajangizga mos mashgʻulot oʻtkazadi. Hech qanday majburiyat yoʻq." },
      q3: { q: "Abonementni muzlatib qoʻysa boʻladimi?", a: "Ha. 3, 6 va 12 oylik abonementlarni mos ravishda 14, 30 va 60 kunga muzlatish mumkin — masalan, taʼtil yoki kasallik vaqtida. Administratorni oldindan ogohlantirsangiz kifoya." },
      q4: { q: "Necha yoshdan shugʻullanish mumkin?", a: "Trenajyor zaliga 16 yoshdan, 14 yoshdan esa murabbiy nazoratida va ota-ona roziligi bilan. Yuqori yosh chegarasi yoʻq — murabbiylar har qanday yoshga mos yuklama tanlab berishadi." },
      q5: { q: "Qanday toʻlov usullari bor?", a: "Naqd pul, Uzcard va Humo, Visa va Mastercard kartalari, shuningdek Click va Payme. Abonementni boʻlib toʻlash ham mumkin — administratordan soʻrang." }
    },
    contact: {
      eyebrow: "Aloqa",
      title: "Bepul sinov mashgʻulotiga yoziling",
      subtitle: "Raqamingizni qoldiring — administrator ish vaqtida 15 daqiqa ichida qoʻngʻiroq qiladi.",
      address: "Manzil",
      hours: "Ish vaqti",
      weekdays: "Du–Ju",
      weekend: "Sh–Ya",
      phone: "Telefon",
      social: "Ijtimoiy tarmoqlarda",
      mapTitle: "Xarita: Toshkentdagi Vortaq Fitness Club"
    },
    form: {
      title: "Mashgʻulotga ariza",
      name: "Ism",
      namePh: "Ismingiz",
      phone: "Telefon raqami",
      phonePh: "+998 (90) 123-45-67",
      plan: "Abonement",
      planPh: "Variantni tanlang",
      time: "Qoʻngʻiroq uchun qulay vaqt",
      timePh: "Vaqtni tanlang",
      times: { morning: "Ertalab (06:00–12:00)", day: "Kunduzi (12:00–17:00)", evening: "Kechqurun (17:00–23:00)" },
      submit: "Ariza yuborish",
      sending: "Yuborilmoqda…",
      privacy: "Tugmani bosish orqali shaxsiy maʼlumotlaringiz qayta ishlanishiga rozilik bildirasiz.",
      errors: {
        name: "Ismingizni kiriting — kamida 2 ta harf",
        phone: "Raqamni toʻliq kiriting: +998 XX XXX-XX-XX",
        plan: "Abonementni tanlang",
        time: "Qulay vaqtni tanlang",
        submit: "Arizani yuborib boʻlmadi. Bizga qoʻngʻiroq qiling yoki Telegramda yozing.",
        rate: "Ariza allaqachon yuborilgan. Keyingisidan oldin bir daqiqa kuting."
      },
      success: {
        title: "Rahmat! Tez orada qoʻngʻiroq qilamiz",
        text: "Arizangiz qabul qilindi. Administrator qulay vaqtni kelishish uchun tez orada siz bilan bogʻlanadi.",
        again: "Yana ariza yuborish"
      }
    },
    footer: {
      tagline: "Toshkentdagi fitnes klub. Biz bilan shugʻullaning — natija uzoq kuttirmaydi.",
      links: "Boʻlimlar",
      contacts: "Aloqa",
      language: "Til",
      rights: "Barcha huquqlar himoyalangan.",
      demo: "Demo sayt: narxlar va maʼlumotlar namuna sifatida berilgan."
    }
  },

  /* -------------------------------------------------------
     ENGLISH
     ------------------------------------------------------- */
  en: {
    meta: {
      title: "Vortaq Fitness Club — Gym & Fitness in Tashkent",
      description: "Modern gym in Tashkent: experienced coaches, CrossFit, boxing, yoga, showers and free parking. Book your free trial workout today!",
      ogLocale: "en_US"
    },
    a11y: {
      skip: "Skip to content",
      menuOpen: "Open menu",
      menuClose: "Close menu",
      language: "Site language",
      telegram: "Message us on Telegram",
      home: "Vortaq Fitness Club — home",
      close: "Close",
      prev: "Previous photo",
      next: "Next photo",
      openPhoto: "Open photo: {alt}"
    },
    nav: {
      about: "Why us",
      plans: "Memberships",
      trainers: "Coaches",
      schedule: "Schedule",
      gallery: "Gallery",
      faq: "FAQ",
      contact: "Contact",
      cta: "Free trial"
    },
    hero: {
      eyebrow: "Fitness club · Tashkent",
      title1: "Build your",
      title2: "best body",
      subtitle: "Modern equipment, experienced coaches and group classes — everything you need to see results faster and actually enjoy the process.",
      ctaTrial: "Free trial workout",
      ctaPlans: "View memberships",
      statArea: "m² of gym space",
      statTrainers: "coaches",
      statClasses: "group classes a week"
    },
    about: {
      eyebrow: "Why Vortaq",
      title: "Everything you need for results, under one roof",
      equipment: { title: "Modern equipment", text: "Premium machines, dumbbells up to 50 kg and a dedicated functional training zone." },
      trainers: { title: "Experienced coaches", text: "Certified coaches with 5+ years of experience will dial in your technique and build a plan around your goal." },
      showers: { title: "Showers & lockers", text: "Clean, spacious locker rooms, hot showers and lockers with keys." },
      late: { title: "Open late", text: "Open from 6 am to 11 pm — train before work or after it." },
      groups: { title: "Group classes", text: "CrossFit, boxing, yoga, functional training and stretching — {count} classes every week." },
      parking: { title: "Free parking", text: "Secure parking right by the entrance for all members." }
    },
    plans: {
      eyebrow: "Memberships",
      title: "Pick your membership",
      subtitle: "Clear pricing, no hidden fees. Your first workout is on us.",
      choose: "Choose",
      perMonthOnly: "per month",
      perMonth: "≈ {price} per month",
      perVisit: "per visit",
      perPackage: "per package",
      save: "Save {n}%",
      badge: { popular: "Popular", best: "Best value", addon: "Add-on" },
      names: {
        single: "Single visit",
        m1: "1 month",
        m3: "3 months",
        m6: "6 months",
        m12: "12 months",
        pt8: "Personal trainer · 8 sessions",
        trial: "Free trial workout"
      },
      taglines: {
        single: "Drop in and try us out",
        m1: "To get started",
        m3: "The sweet spot",
        m6: "For steady progress",
        m12: "Maximum savings",
        pt8: "One-on-one coaching for faster results. Can be added to any membership."
      },
      features: {
        gymOnce: "One gym visit, any time",
        gymUnlimited: "Unlimited gym access",
        locker: "Locker room, showers & locker",
        groups: "All group classes",
        ptIntro: "Intro session with a coach",
        freeze14: "Freeze for up to 14 days",
        freeze30: "Freeze for up to 30 days",
        freeze60: "Freeze for up to 60 days",
        guest2: "2 guest passes for a friend",
        guest5: "5 guest passes for friends",
        towel: "Fresh towel on every visit",
        pt8: "8 one-on-one sessions, 60 min each",
        ptProgram: "Training plan built around your goal",
        ptNutrition: "Nutrition guidance",
        ptValid: "Valid for 45 days"
      }
    },
    trainers: {
      eyebrow: "Our team",
      title: "Coaches who get you results",
      years: "years of experience",
      specialty: {
        bodybuilding: "Bodybuilding",
        crossfit: "CrossFit & functional",
        boxing: "Boxing",
        yoga: "Yoga & stretching"
      },
      t1: { name: "Rustam Karimov", bio: "Candidate Master of Sport in bodybuilding. Muscle gain, cutting and contest prep." },
      t2: { name: "Kamila Nasirova", bio: "CrossFit L2 trainer. Endurance, strength and fitness that carries over into everyday life." },
      t3: { name: "Bekzod Tursunov", bio: "Master of Sport in boxing. Technique, cardio and confidence from your very first session." },
      t4: { name: "Madina Aliyeva", bio: "Hatha yoga and stretching instructor. Flexibility, posture and recovery after hard training." }
    },
    schedule: {
      eyebrow: "Schedule",
      title: "Weekly group classes",
      subtitle: "All group classes are included in every membership from 1 month.",
      today: "Today",
      min: "min",
      empty: "No group classes — the gym is open",
      swipe: "Swipe left or right to change the day",
      days: {
        short: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        long: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      },
      classes: {
        crossfit: "CrossFit",
        boxing: "Boxing",
        yoga: "Yoga",
        functional: "Functional training",
        stretching: "Stretching"
      }
    },
    gallery: {
      eyebrow: "Gallery",
      title: "Take a look inside",
      alts: {
        g1: "Dumbbell racks in the dimly lit gym",
        g2: "Rows of dumbbells on the gym floor",
        g3: "Athlete training among heavy punching bags",
        g4: "Man performing a barbell deadlift",
        g5: "Group workout with dumbbells",
        g6: "Functional group class in the studio",
        g7: "Boxer working on the heavy bag",
        g8: "Athlete doing barbell bicep curls"
      }
    },
    faq: {
      eyebrow: "FAQ",
      title: "Frequently asked questions",
      q1: { q: "What should I bring?", a: "Sportswear, clean indoor trainers, a towel and a bottle of water. No need for a lock — you'll get a locker key at reception." },
      q2: { q: "How does the free trial workout work?", a: "Leave a request and we'll call you back to pick a time. A coach will show you around, check your fitness level and run a session tailored to you. No strings attached." },
      q3: { q: "Can I freeze my membership?", a: "Yes. 3, 6 and 12-month memberships can be frozen for 14, 30 and 60 days respectively — for a holiday or if you get sick. Just let the front desk know." },
      q4: { q: "Is there an age limit?", a: "The gym floor is open from age 16, or from 14 with a coach and parental consent. There's no upper age limit — our coaches will adjust the load for any age." },
      q5: { q: "Which payment methods do you accept?", a: "Cash, Uzcard and Humo, Visa and Mastercard, plus Click and Payme. Instalment plans are available too — just ask at the front desk." }
    },
    contact: {
      eyebrow: "Contact",
      title: "Book your free trial workout",
      subtitle: "Leave your number and our manager will call you back within 15 minutes during opening hours.",
      address: "Address",
      hours: "Opening hours",
      weekdays: "Mon–Fri",
      weekend: "Sat–Sun",
      phone: "Phone",
      social: "Follow us",
      mapTitle: "Map: Vortaq Fitness Club in Tashkent"
    },
    form: {
      title: "Workout request",
      name: "Name",
      namePh: "Your name",
      phone: "Phone",
      phonePh: "+998 (90) 123-45-67",
      plan: "Membership",
      planPh: "Choose an option",
      time: "Best time to call",
      timePh: "Choose a time",
      times: { morning: "Morning (06:00–12:00)", day: "Afternoon (12:00–17:00)", evening: "Evening (17:00–23:00)" },
      submit: "Send request",
      sending: "Sending…",
      privacy: "By submitting, you agree to the processing of your personal data.",
      errors: {
        name: "Please enter your name — at least 2 letters",
        phone: "Please enter the full number: +998 XX XXX-XX-XX",
        plan: "Please choose a membership",
        time: "Please choose a time",
        submit: "We couldn't send your request. Please call us or message us on Telegram.",
        rate: "Your request was already sent. Please wait a minute before sending another."
      },
      success: {
        title: "Thank you! We'll call you soon",
        text: "Your request has been received. Our manager will contact you shortly to arrange a time.",
        again: "Send another request"
      }
    },
    footer: {
      tagline: "Fitness club in Tashkent. Train with us — results won't keep you waiting.",
      links: "Explore",
      contacts: "Contact",
      language: "Language",
      rights: "All rights reserved.",
      demo: "Demo website: prices and details are for illustration only."
    }
  }
};

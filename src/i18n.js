/* RU lives in index.html (so the page works and indexes without JS).
   EN lives here. Elements carry data-i18n (innerHTML), data-i18n-aria, data-i18n-ph, data-i18n-alt. */
const en = {
  skip: "Skip to content",
  "nav.home": "akbar.usta — home",
  "nav.label": "Sections",
  "nav.work": "Work",
  "nav.services": "Services",
  "nav.process": "Process",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",
  "nav.lang": "Language",
  "nav.cta": "Message me",
  "nav.menu": "Menu",
  "hero.status": "Taking projects · November 2026",
  "hero.place": "Uzbekistan",
  "hero.tz": "Tashkent",
  "hero.name": "Akbar",
  "hero.sr": "Akbar, web developer.",
  "hero.line": "Websites that sell, for businesses in&nbsp;Uzbekistan",
  "hero.alt": "Portrait of Akbar made of eight-point stars",
  "hero.hint": "Hover for the master's loupe",
  "hero.lead": "I build fast websites, online stores and admin panels for cafes, clubs, restaurants and shops. Custom design, three languages, Click and Payme payments.",
  "hero.cta": "Discuss a project",
  "hero.cta2": "See the work",
  "hero.scroll": "Scroll down",
  "marquee.label": "What I do",
  "marquee.a": "<span>Business sites</span><i>✦</i><span>Online stores</span><i>✦</i><span>Admin panels</span><i>✦</i><span>Click · Payme · Uzum</span><i>✦</i><span>Telegram bots</span><i>✦</i><span>RU · UZ · EN</span><i>✦</i>",
  "about.title": "Who is usta",
  "about.altDots": "Portrait of Akbar made of stars",
  "about.cap": "3,427 stars · 0 photo pixels",
  "about.big": "<em>Usta</em> is Uzbek for master. The one who builds a pattern from a hundred precise pieces. That is how I build websites.",
  "about.p1": "I'm Akbar, a self-taught developer from Uzbekistan. I build websites for local businesses: coffee shops, fitness clubs, restaurants, stores.",
  "about.p2": "I work with AI as a partner: it handles the routine, and I check the design, logic and quality myself. So you get a well-thought-out site faster and cheaper than from an agency.",
  "stats.demos": "live demos right on this site",
  "stats.langs": "languages in every project: RU · UZ · EN",
  "stats.mobile": "mobile-first: the phone first, then the laptop",
  "stats.templates": "templates: every design from a blank page",
  "work.title": "Work you can open",
  "work.sub": "Every demo lives inside this site. Click and try the real interface, not a picture of it.",
  "services.title": "What I do and what it costs",
  "services.sub": "Prices are estimates. I name the exact amount after a short talk about the task, free and with no obligation.",
  "process.title": "How we'll work",
  "process.s1t": "Intro",
  "process.s1": "15 minutes on Telegram: your business, your customers, what the site must do. I name the price and the deadline.",
  "process.s2t": "First screen",
  "process.s2": "In 2–3 days I show the main screen design on your phone. We adjust until you like it.",
  "process.s3t": "Build",
  "process.s3": "I build the whole site and send a link to the working version. You see progress instead of waiting blind.",
  "process.s4t": "Launch",
  "process.s4": "Domain, hosting, map, analytics, payments. I check the speed and test on different phones.",
  "process.s5t": "Support",
  "process.s5": "After launch I stay in touch: small edits, new prices and photos. I show you how to change texts yourself.",
  "now.title": "Changelog",
  "now.live": "in progress now",
  "now.tagNow": "now",
  "now.l1": "This site: a WebGL portrait of eight-point stars, six demos inside",
  "now.l2": "Flight booking: search, cabin seat map, e-ticket",
  "now.l3": "4-floor atrium, search with transliteration and an admin panel",
  "now.l4": "Prices in USD, three languages, form security audit",
  "faq.title": "Frequent questions",
  "contact.title": "Tell me about the task, I'll reply on Telegram",
  "contact.need": "What you need",
  "contact.n1": "Business site",
  "contact.n2": "Online store",
  "contact.n3": "Admin panel",
  "contact.n4": "Click / Payme payments",
  "contact.n5": "Telegram bot",
  "contact.n6": "Redesign",
  "contact.budget": "Budget",
  "contact.b5": "Not sure yet",
  "contact.name": "Name and business",
  "contact.namePh": "e.g. Dilnoza, coffee shop in Navoi",
  "contact.msg": "A few words about the task",
  "contact.msgPh": "I need a site with a menu and an order button…",
  "contact.send": "Send via Telegram",
  "contact.copy": "Copy text",
  "contact.note": "A chat with @KrieWoo opens with the message ready. Nothing is sent without you.",
  "contact.direct": "Or directly",
  "contact.resp": "I usually reply the same day. Write in Russian, Uzbek or English.",
  "footer.made": "Made by hand (and a bit of AI) in Uzbekistan",
  "footer.egg": "Type “usta” on your keyboard",
  "footer.top": "Back to top ↑",
};

// Strings used only from JS
const ui = {
  ru: {
    title: "Акбар — сайты для бизнеса в Узбекистане",
    task: "Задача", solution: "Решение", result: "Результат", tech: "Технологии",
    open: "Открыть демо", demo: "Демо", copied: "Текст скопирован. Вставьте его в чат с @KrieWoo.",
    copyFail: "Не удалось скопировать. Выделите текст вручную.",
    msgHello: "Здравствуйте, Акбар!", msgNeed: "Нужно", msgBudget: "Бюджет", msgFrom: "Я", msgTask: "Задача",
    msgEmpty: "Хочу обсудить проект.",
    need: { site: "сайт-визитка", shop: "интернет-магазин", admin: "админ-панель", pay: "оплата Click / Payme", bot: "Telegram-бот", redesign: "редизайн" },
    budget: { b1: "до $200", b2: "$200–500", b3: "$500–1000", b4: "$1000+", b5: "пока не знаю" },
    from: "", eggOn: "Режим usta: звёзды повсюду ✦",
    hintTouch: "Коснитесь — лупа мастера",
  },
  en: {
    title: "Akbar — websites for businesses in Uzbekistan",
    task: "Task", solution: "Solution", result: "Result", tech: "Tech",
    open: "Open live demo", demo: "Demo", copied: "Text copied. Paste it into a chat with @KrieWoo.",
    copyFail: "Could not copy. Select the text by hand.",
    msgHello: "Hi Akbar!", msgNeed: "I need", msgBudget: "Budget", msgFrom: "I am", msgTask: "Task",
    msgEmpty: "I'd like to discuss a project.",
    need: { site: "business site", shop: "online store", admin: "admin panel", pay: "Click / Payme payments", bot: "Telegram bot", redesign: "redesign" },
    budget: { b1: "under $200", b2: "$200–500", b3: "$500–1000", b4: "$1000+", b5: "not sure yet" },
    eggOn: "Usta mode: stars everywhere ✦",
    hintTouch: "Touch for the master's loupe",
  },
};

const ru = {};
const listeners = [];
let lang = "ru";

function snapshot() {
  document.querySelectorAll("[data-i18n]").forEach((el) => { ru[el.dataset.i18n] ??= el.innerHTML; });
  for (const [attr, key] of [["aria-label", "i18nAria"], ["placeholder", "i18nPh"], ["alt", "i18nAlt"]]) {
    document.querySelectorAll(`[data-${key.replace("i18n", "i18n-").toLowerCase()}]`).forEach((el) => {
      ru[el.dataset[key]] ??= el.getAttribute(attr) || "";
    });
  }
}

export function t(key) { return ui[lang][key] ?? ui.ru[key]; }
export function getLang() { return lang; }
export function onLang(fn) { listeners.push(fn); }

export function setLang(next, { silent = false } = {}) {
  lang = next === "en" ? "en" : "ru";
  const dict = lang === "en" ? en : ru;
  document.documentElement.lang = lang;
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = dict[el.dataset.i18n];
    if (v != null && el.innerHTML !== v) el.innerHTML = v;
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { const v = dict[el.dataset.i18nAria]; if (v) el.setAttribute("aria-label", v); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { const v = dict[el.dataset.i18nPh]; if (v) el.setAttribute("placeholder", v); });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => { const v = dict[el.dataset.i18nAlt]; if (v) el.setAttribute("alt", v); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  try { localStorage.setItem("usta-lang", lang); } catch (e) {}
  if (!silent) listeners.forEach((fn) => fn(lang));
}

export function initI18n() {
  snapshot();
  // Russian by default (main audience), English only when chosen before
  let saved = "ru";
  try { saved = localStorage.getItem("usta-lang") || "ru"; } catch (e) {}
  setLang(saved, { silent: true });
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
}

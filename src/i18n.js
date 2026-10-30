/* RU lives in index.html (so the page works and indexes without JS).
   EN lives here. Elements carry data-i18n (innerHTML), data-i18n-aria, data-i18n-ph, data-i18n-alt. */
const en = {
  skip: "Skip to content",
  "nav.home": "akbar — home",
  "nav.label": "Sections",
  "nav.work": "Work",
  "nav.services": "Services",
  "nav.process": "Process",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",
  "nav.pay": "Payment",
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
  "about.title": "Hi, I'm Akbar",
  "about.big": "I build websites the way a <em>master</em> builds a pattern on a Samarkand wall: from a hundred precise pieces, each in its place.",
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
  "now.l1t": "Portfolio",
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
  "pay.title": "Paying for a project",
  "pay.sub": "We agree on the amount and the deadline on Telegram. Then pick a convenient way: the details and steps appear below.",
  "pay.method": "Payment method",
  "pay.groupUz": "In Uzbekistan",
  "pay.groupAbroad": "From abroad",
  "pay.amount": "Amount",
  "pay.amountPh": "e.g. 1,500,000",
  "pay.currency": "Currency",
  "pay.proof": "Proof of payment",
  "pay.txid": "Transaction ID or receipt number",
  "pay.txidPh": "e.g. 1234567890",
  "pay.attach": "Attach a payment screenshot",
  "pay.attachHint": "PNG or JPG up to 10 MB. The file isn't uploaded anywhere: it stays with you and goes only to Telegram.",
  "pay.remove": "Remove screenshot",
  "pay.name": "Name and project",
  "pay.namePh": "e.g. Dilnoza, coffee shop site",
  "pay.send": "Send proof",
  "pay.note": "A chat with @KrieWoo opens with the message ready. Attach the screenshot in the chat if your phone doesn't offer to send it.",
  "pay.howTitle": "How it works",
  "pay.how1": "We agree on the task, the amount and the deadline on Telegram.",
  "pay.how2": "You pay the agreed amount in a convenient way.",
  "pay.how3": "You send a screenshot or the transaction ID. I confirm receipt and start the work.",
  "pay.safe": "Payment details live only here and in the chat with @KrieWoo. If someone sends you other numbers in my name, don't pay and message me.",
  "footer.made": "Made by hand (and a bit of AI) in Uzbekistan",
  "footer.egg": "Type “akbar” on your keyboard",
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
    from: "", eggOn: "Звёзды повсюду ✦",
    hintTouch: "Коснитесь — лупа мастера",
    payPick: "Выберите способ оплаты выше — здесь появятся реквизиты и шаги.",
    payLink: "Ссылка на оплату", payOpen: "Оплатить в", payCard: "Номер карты", payHolder: "Получатель",
    payAmount: "Сумма", payAgree: "Согласуем в Telegram", paySteps: "Как оплатить",
    payMissing: "Реквизиты пришлю в Telegram: напишите @KrieWoo.",
    payCopy: "Копировать", payCopied: "Номер карты скопирован",
    kindLink: "Оплата по ссылке", kindCard: "Перевод на карту", kindAbroad: "Из-за рубежа",
    payErrMethod: "Выберите способ оплаты.", payErrProof: "Добавьте ID транзакции или скриншот оплаты.",
    payErrFile: "Нужна картинка (PNG или JPG) до 10 МБ.",
    payMsgHello: "Здравствуйте, Акбар! Я оплатил(а) проект.", payMsgMethod: "Способ", payMsgTx: "ID транзакции",
    payMsgShot: "Скриншот оплаты прикрепляю.",
    payNote: "Откроется чат с @KrieWoo с готовым сообщением. Скриншот прикрепите в чате, если телефон не предложит отправить его сам.",
    payAttach: "Чат открыт. Прикрепите скриншот в сообщении: сайт не может отправить файл сам.",
    payShared: "Готово. Выберите чат с @KrieWoo и отправьте.",
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
    eggOn: "Stars everywhere ✦",
    hintTouch: "Touch for the master's loupe",
    payPick: "Pick a payment method above: the details and steps appear here.",
    payLink: "Payment link", payOpen: "Pay with", payCard: "Card number", payHolder: "Recipient",
    payAmount: "Amount", payAgree: "We'll agree on Telegram", paySteps: "How to pay",
    payMissing: "I'll send the details on Telegram: message @KrieWoo.",
    payCopy: "Copy", payCopied: "Card number copied",
    kindLink: "Pay by link", kindCard: "Card transfer", kindAbroad: "From abroad",
    payErrMethod: "Pick a payment method.", payErrProof: "Add a transaction ID or a payment screenshot.",
    payErrFile: "It must be an image (PNG or JPG) up to 10 MB.",
    payMsgHello: "Hi Akbar! I've paid for the project.", payMsgMethod: "Method", payMsgTx: "Transaction ID",
    payMsgShot: "Attaching the payment screenshot.",
    payNote: "A chat with @KrieWoo opens with the message ready. Attach the screenshot in the chat if your phone doesn't offer to send it.",
    payAttach: "The chat is open. Attach the screenshot to the message: the site can't send files itself.",
    payShared: "Done. Pick the chat with @KrieWoo and send.",
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
  try { localStorage.setItem("akbar-lang", lang); } catch (e) {}
  if (!silent) listeners.forEach((fn) => fn(lang));
}

export function initI18n() {
  snapshot();
  // Russian by default (main audience), English only when chosen before
  let saved = "ru";
  try { saved = localStorage.getItem("akbar-lang") || "ru"; } catch (e) {}
  setLang(saved, { silent: true });
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
}

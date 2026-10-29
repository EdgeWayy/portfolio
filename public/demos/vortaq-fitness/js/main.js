/* =========================================================
   Vortaq Fitness Club — main script
   ---------------------------------------------------------
   1. CONFIG        ← edit all business data here
   2. sendLead()    ← posts the lead to your backend (api/lead.js)
   3. i18n helpers
   4. Rendering of sections
   5. UI behaviour (header, menu, schedule, lightbox, FAQ, form)
   All visible texts live in js/translations.js.
   ========================================================= */

/* =========================================================
   1. CONFIG — prices, contacts, hours, schedule, photos
   ========================================================= */
const CONFIG = {
  defaultLang: "ru",               // "ru" | "uz" | "en"
  languages: ["uz", "ru", "en"],

  // ---- Contacts ----
  phone: "+998 90 123 45 67",      // shown on the site
  phoneHref: "+998901234567",      // used for tel: links (no spaces)
  instagram: "https://instagram.com/vortaq_fitness_demo",
  telegram: "https://t.me/vortaq_fitness_demo",
  address: {
    ru: "Ташкент, Юнусабадский район, ул. Примерная, 1",
    uz: "Toshkent, Yunusobod tumani, Namuna koʻchasi, 1",
    en: "1 Example St, Yunusabad district, Tashkent"
  },
  // Google Maps embed. Easiest way to get the real one: Google Maps → Share → Embed a map → copy the src="..." URL.
  mapEmbedUrl: "https://www.google.com/maps?q=Tashkent,+Uzbekistan&z=12&output=embed",

  // ---- Working hours ----
  hours: {
    weekdays: "06:00 – 23:00",
    weekend: "08:00 – 22:00"
  },

  // ---- Hero numbers ----
  stats: {
    area: 1200,      // m²
    trainers: 12     // number of coaches
    // "group classes a week" is counted automatically from the schedule below
  },

  // ---- Memberships (prices in USD) ----
  // Order here = order on the page. Texts: TRANSLATIONS.*.plans.names / taglines / features.
  // badge: "popular" | "best" | null. months: used to show the monthly price and the saving vs. 1 month.
  plans: [
    { id: "m1",     price: 29,  months: 1,  badge: null,      features: ["gymUnlimited", "locker", "groups", "ptIntro"] },
    { id: "m3",     price: 75,  months: 3,  badge: "popular", features: ["gymUnlimited", "locker", "groups", "ptIntro", "freeze14"] },
    { id: "m6",     price: 129, months: 6,  badge: null,      features: ["gymUnlimited", "locker", "groups", "ptIntro", "freeze30", "guest2"] },
    { id: "m12",    price: 225, months: 12, badge: "best",    features: ["gymUnlimited", "locker", "groups", "ptIntro", "freeze60", "guest5", "towel"] },
    { id: "single", price: 3,   visits: 1,  badge: null,      features: ["gymOnce", "locker"] }
  ],
  // Optional add-on shown as a wide card under the plans
  addon: { id: "pt8", price: 99, features: ["pt8", "ptProgram", "ptNutrition", "ptValid"] },

  // ---- Coaches ---- (names & bios: TRANSLATIONS.*.trainers.t1 … t4)
  trainers: [
    { id: "t1", photo: "images/trainer-bodybuilding.jpg", specialty: "bodybuilding", years: 12 },
    { id: "t2", photo: "images/trainer-crossfit.jpg",     specialty: "crossfit",     years: 8 },
    { id: "t3", photo: "images/trainer-boxing.jpg",       specialty: "boxing",       years: 10 },
    { id: "t4", photo: "images/trainer-yoga.jpg",         specialty: "yoga",         years: 7 }
  ],

  // ---- Weekly group schedule ----
  // class: crossfit | boxing | yoga | functional | stretching. trainer: id from the list above.
  schedule: {
    mon: [
      { time: "07:00", class: "crossfit",   trainer: "t2", duration: 60 },
      { time: "09:00", class: "stretching", trainer: "t4", duration: 55 },
      { time: "18:00", class: "boxing",     trainer: "t3", duration: 60 },
      { time: "19:00", class: "functional", trainer: "t2", duration: 50 },
      { time: "20:00", class: "yoga",       trainer: "t4", duration: 60 }
    ],
    tue: [
      { time: "07:00", class: "functional", trainer: "t2", duration: 50 },
      { time: "10:00", class: "yoga",       trainer: "t4", duration: 60 },
      { time: "18:30", class: "crossfit",   trainer: "t2", duration: 60 },
      { time: "19:30", class: "boxing",     trainer: "t3", duration: 60 }
    ],
    wed: [
      { time: "07:00", class: "crossfit",   trainer: "t2", duration: 60 },
      { time: "09:00", class: "stretching", trainer: "t4", duration: 55 },
      { time: "18:00", class: "boxing",     trainer: "t3", duration: 60 },
      { time: "19:00", class: "functional", trainer: "t2", duration: 50 },
      { time: "20:00", class: "yoga",       trainer: "t4", duration: 60 }
    ],
    thu: [
      { time: "07:00", class: "functional", trainer: "t2", duration: 50 },
      { time: "10:00", class: "yoga",       trainer: "t4", duration: 60 },
      { time: "18:30", class: "crossfit",   trainer: "t2", duration: 60 },
      { time: "19:30", class: "boxing",     trainer: "t3", duration: 60 }
    ],
    fri: [
      { time: "07:00", class: "crossfit",   trainer: "t2", duration: 60 },
      { time: "09:00", class: "stretching", trainer: "t4", duration: 55 },
      { time: "18:00", class: "boxing",     trainer: "t3", duration: 60 },
      { time: "19:00", class: "functional", trainer: "t2", duration: 50 },
      { time: "20:00", class: "stretching", trainer: "t4", duration: 55 }
    ],
    sat: [
      { time: "10:00", class: "crossfit",   trainer: "t2", duration: 60 },
      { time: "11:30", class: "boxing",     trainer: "t3", duration: 60 },
      { time: "13:00", class: "yoga",       trainer: "t4", duration: 60 }
    ],
    sun: [
      { time: "10:00", class: "yoga",       trainer: "t4", duration: 60 },
      { time: "11:30", class: "stretching", trainer: "t4", duration: 55 }
    ]
  },

  // ---- Gallery ---- (alt texts: TRANSLATIONS.*.gallery.alts). size: "tall" | "wide" | undefined
  gallery: [
    { id: "g1", src: "images/gallery-1.jpg", w: 1000, h: 1500, size: "tall" },
    { id: "g2", src: "images/gallery-2.jpg", w: 1000, h: 667,  size: "wide" },
    { id: "g3", src: "images/gallery-3.jpg", w: 1000, h: 667 },
    { id: "g4", src: "images/gallery-4.jpg", w: 1000, h: 667 },
    { id: "g5", src: "images/gallery-5.jpg", w: 1000, h: 667 },
    { id: "g6", src: "images/gallery-6.jpg", w: 1000, h: 668, size: "wide" },
    { id: "g7", src: "images/gallery-7.jpg", w: 1000, h: 667 },
    { id: "g8", src: "images/gallery-8.jpg", w: 1000, h: 667,  size: "wide" }
  ],


  faq: ["q1", "q2", "q3", "q4", "q5"],

  // ---- "Why Vortaq" cards ---- (texts: TRANSLATIONS.*.about.<id>)
  features: [
    { id: "equipment", icon: "dumbbell" },
    { id: "trainers",  icon: "medal" },
    { id: "showers",   icon: "shower" },
    { id: "late",      icon: "moon" },
    { id: "groups",    icon: "users" },
    { id: "parking",   icon: "parking" }
  ]
};


/* =========================================================
   2. LEAD DELIVERY
   ---------------------------------------------------------
   The browser never talks to Telegram directly: a bot token in
   front-end code is public. Deploy api/lead.js (or any backend
   with the same contract), keep BOT_TOKEN / CHAT_ID in its .env,
   and put its URL in CONFIG_LEAD_ENDPOINT below.
   Empty endpoint = demo mode (the lead is only logged locally).
   ========================================================= */
const CONFIG_LEAD_ENDPOINT = "";   // e.g. "/api/lead"
const LEAD_COOLDOWN_MS = 60 * 1000; // client-side throttle; the server enforces its own limit

async function sendLead(lead) {
  if (!CONFIG_LEAD_ENDPOINT) {
    console.log("[Vortaq] Demo mode, lead not sent:", lead);
    await new Promise((resolve) => setTimeout(resolve, 700));
    return true;
  }
  const res = await fetch(CONFIG_LEAD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead)
  });
  if (res.status === 429) { const err = new Error("rate limited"); err.code = "rate"; throw err; }
  if (!res.ok) throw new Error(`Lead endpoint error: ${res.status}`);
  return true;
}


/* =========================================================
   3. i18n HELPERS
   ========================================================= */
const STORAGE_KEY = "vortaq-lang";
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
let currentLang = CONFIG.defaultLang;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Look up "a.b.c" in the current language, falling back to the default language. */
function t(key, lang = currentLang) {
  const find = (l) => key.split(".").reduce((obj, k) => (obj == null ? undefined : obj[k]), TRANSLATIONS[l]);
  const value = find(lang);
  return value !== undefined ? value : find(CONFIG.defaultLang) ?? key;
}

/** Replace {name} placeholders. */
function fill(str, vars) {
  return vars ? String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : str;
}

/** Russian plural: forms = [one, few, many]. Other languages use a plain string. */
function plural(n, forms) {
  if (!Array.isArray(forms)) return forms;
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
  return forms[2];
}

/** 350000 → "350 000" (non-breaking spaces so the price never wraps). */
function formatNumber(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
/** 29 → "$29.00": same price format in every language. */
function formatPrice(n) {
  return "$" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function countClasses() {
  return DAY_KEYS.reduce((sum, d) => sum + (CONFIG.schedule[d] || []).length, 0);
}
const STAT_VALUES = { area: CONFIG.stats.area, trainers: CONFIG.stats.trainers, classes: countClasses() };

/** Resolve the text for an element's i18n key, including plurals and {vars}. */
function resolveText(el, key) {
  let value = t(key);
  const countFrom = el.dataset.i18nCountFrom;
  const count = countFrom ? STAT_VALUES[countFrom] : Number(el.dataset.i18nCount);
  if (Array.isArray(value)) {
    value = el.dataset.i18nIndex !== undefined
      ? value[Number(el.dataset.i18nIndex)]                       // e.g. day names
      : plural(Number.isFinite(count) ? count : 0, value);        // Russian plurals
  }

  const vars = {};
  if (el.dataset.i18nVars) Object.assign(vars, JSON.parse(el.dataset.i18nVars));
  if (el.dataset.i18nKeyvars) {
    const keyVars = JSON.parse(el.dataset.i18nKeyvars);
    Object.keys(keyVars).forEach((k) => (vars[k] = t(keyVars[k])));
  }
  if (el.dataset.i18nPrice) vars.price = formatPrice(Number(el.dataset.i18nPrice));
  return fill(value, vars);
}

/** Apply the current language to every [data-i18n*] element on the page. */
function applyTranslations() {
  $$("[data-i18n]").forEach((el) => (el.textContent = resolveText(el, el.dataset.i18n)));
  $$("[data-i18n-placeholder]").forEach((el) => (el.placeholder = resolveText(el, el.dataset.i18nPlaceholder)));
  $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", resolveText(el, el.dataset.i18nAria)));
  $$("[data-i18n-title]").forEach((el) => (el.title = resolveText(el, el.dataset.i18nTitle)));
  $$("[data-i18n-alt]").forEach((el) => (el.alt = resolveText(el, el.dataset.i18nAlt)));
  $$("[data-i18n-content]").forEach((el) => el.setAttribute("content", resolveText(el, el.dataset.i18nContent)));
  $$("[data-i18n-initials]").forEach((el) => {
    el.textContent = String(t(el.dataset.i18nInitials)).split(/\s+/).map((w) => w[0]).join("").slice(0, 2);
  });
  $$("[data-price]").forEach((el) => (el.textContent = formatPrice(Number(el.dataset.price))));
  $$('[data-config="address"]').forEach((el) => (el.textContent = CONFIG.address[currentLang] || CONFIG.address.ru));
  $$("[data-error-key]").forEach((el) => (el.textContent = t(el.dataset.errorKey)));
}

function setLanguage(lang, { save = true } = {}) {
  if (!TRANSLATIONS[lang]) lang = CONFIG.defaultLang;
  currentLang = lang;
  document.documentElement.lang = lang;
  if (save) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage blocked — ignore */ }
  }
  $$(".lang__btn").forEach((btn) => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
  applyTranslations();
  updateBurgerLabel();
  updateMap();
}

function getInitialLanguage() {
  const fromUrl = new URLSearchParams(location.search).get("lang"); // e.g. index.html?lang=uz for sharing
  if (fromUrl && TRANSLATIONS[fromUrl]) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TRANSLATIONS[saved]) return saved;
  } catch (e) { /* storage blocked — ignore */ }
  return CONFIG.defaultLang;
}


/* =========================================================
   4. RENDERING
   ========================================================= */
const ICONS = {
  dumbbell: '<path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12"/>',
  medal: '<circle cx="12" cy="9" r="5.5"/><path d="M8.6 13.4 7 21.5l5-2.8 5 2.8-1.6-8.1"/><path d="m10 9 1.5 1.5L14.5 7.5"/>',
  shower: '<path d="M4 21V8a4 4 0 0 1 7.5-2"/><path d="M9 7.5h7a3 3 0 0 0-7 0z"/><path d="M10.5 12v1.2M14.5 12v1.2M12.5 15v1.2M10.5 18v1.2M14.5 18v1.2"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/><path d="M17 3v3M15.5 4.5h3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20.5a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14a5 5 0 0 1 5 5.5"/>',
  parking: '<rect x="3" y="3" width="18" height="18" rx="4.5"/><path d="M9.5 17V7.5h3.6a3 3 0 0 1 0 6H9.5"/>',
  check: '<path d="M5 12.5 10 17l9-10"/>'
};
const icon = (name, cls = "icon") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

/** Images: show a dark gradient placeholder instead of a broken image. */
function guardImage(img) {
  const fail = () => {
    const box = img.closest(".media");
    if (box) box.classList.add("media--fallback");
  };
  img.addEventListener("error", fail, { once: true });
  if (img.complete && img.currentSrc && img.naturalWidth === 0) fail();
}

/** Reveal-on-scroll stagger index for grid children. */
const delay = (i) => `style="--d:${Math.min(i, 6) * 80}ms"`;

function renderFeatures() {
  $("#features-list").innerHTML = CONFIG.features.map((f, i) => `
    <li class="card feature" data-reveal ${delay(i)}>
      <span class="feature__icon">${icon(f.icon)}</span>
      <h3 class="feature__title" data-i18n="about.${f.id}.title"></h3>
      <p class="feature__text" data-i18n="about.${f.id}.text"${f.id === "groups" ? ` data-i18n-vars='{"count":${STAT_VALUES.classes}}'` : ""}></p>
    </li>`).join("");
}

function planNote(plan) {
  if (plan.months === 1) return `<p class="plan__note" data-i18n="plans.perMonthOnly"></p>`;
  if (plan.months > 1) return `<p class="plan__note" data-i18n="plans.perMonth" data-i18n-price="${Math.round((plan.price / plan.months) * 100) / 100}"></p>`;
  if (plan.visits) return `<p class="plan__note" data-i18n="plans.perVisit"></p>`;
  return `<p class="plan__note" data-i18n="plans.perPackage"></p>`;
}

function planSaving(plan) {
  const base = CONFIG.plans.find((p) => p.months === 1);
  if (!base || !(plan.months > 1)) return "";
  const pct = Math.round((1 - plan.price / (base.price * plan.months)) * 100);
  return pct > 0 ? `<span class="plan__save" data-i18n="plans.save" data-i18n-vars='{"n":${pct}}'></span>` : "";
}

function planFeatures(list) {
  return `<ul class="plan__features">${list.map((f) => `<li>${icon("check")}<span data-i18n="plans.features.${f}"></span></li>`).join("")}</ul>`;
}

function planCard(p, i) {
  return `
    <article class="card plan${p.badge ? ` plan--${p.badge}` : ""}" data-reveal ${delay(i)}>
      ${p.badge ? `<span class="plan__badge" data-i18n="plans.badge.${p.badge}"></span>` : ""}
      <h3 class="plan__name" data-i18n="plans.names.${p.id}"></h3>
      <p class="plan__tagline" data-i18n="plans.taglines.${p.id}"></p>
      <p class="plan__price"><span class="plan__amount" data-price="${p.price}"></span></p>
      <div class="plan__meta">${planNote(p)}${planSaving(p)}</div>
      ${planFeatures(p.features)}
      <a class="btn ${p.badge === "popular" ? "btn--primary" : "btn--outline"} btn--block plan__btn" href="#contact" data-plan="${p.id}" data-i18n="plans.choose"></a>
    </article>`;
}

/** Wide card for single visits and the personal-trainer add-on. */
function extraCard(p, badge) {
  return `
    <article class="card extra" data-reveal>
      <div>
        ${badge ? `<span class="plan__badge plan__badge--wood" data-i18n="plans.badge.${badge}"></span>` : ""}
        <h3 class="plan__name" data-i18n="plans.names.${p.id}"></h3>
        <p class="plan__tagline" data-i18n="plans.taglines.${p.id}"></p>
      </div>
      ${planFeatures(p.features)}
      <div class="extra__buy">
        <p class="plan__price"><span class="plan__amount" data-price="${p.price}"></span></p>
        ${planNote(p)}
        <a class="btn btn--outline btn--block" href="#contact" data-plan="${p.id}" data-i18n="plans.choose"></a>
      </div>
    </article>`;
}

function renderPlans() {
  // Plans with "months" go into the main grid; single visits and the add-on go below as wide cards.
  const main = CONFIG.plans.filter((p) => p.months);
  const extras = CONFIG.plans.filter((p) => !p.months);
  $("#plans-list").innerHTML = main.map(planCard).join("");
  $("#extras-list").innerHTML =
    extras.map((p) => extraCard(p, p.badge)).join("") +
    (CONFIG.addon ? extraCard(CONFIG.addon, "addon") : "");
}

function renderTrainers() {
  $("#trainers-list").innerHTML = CONFIG.trainers.map((tr, i) => `
    <li class="card trainer" data-reveal ${delay(i)}>
      <div class="trainer__photo media">
        <img data-src="${tr.photo}" width="700" height="875" loading="lazy" decoding="async" data-i18n-alt="trainers.${tr.id}.name">
        <span class="trainer__years"><strong>${tr.years}</strong> <span data-i18n="trainers.years" data-i18n-count="${tr.years}"></span></span>
      </div>
      <div class="trainer__body">
        <p class="trainer__specialty" data-i18n="trainers.specialty.${tr.specialty}"></p>
        <h3 class="trainer__name" data-i18n="trainers.${tr.id}.name"></h3>
        <p class="trainer__bio" data-i18n="trainers.${tr.id}.bio"></p>
      </div>
    </li>`).join("");
}

const CLASS_KEYS = ["crossfit", "boxing", "yoga", "functional", "stretching"];
let activeDay = (new Date().getDay() + 6) % 7; // 0 = Monday
const todayIndex = activeDay;

function renderSchedule() {
  $("#schedule-tabs").innerHTML = DAY_KEYS.map((d, i) => `
    <button class="schedule__tab" type="button" role="tab" id="tab-${d}" aria-controls="day-${d}" data-day="${i}">
      <span data-i18n="schedule.days.short" data-i18n-index="${i}"></span>
      ${i === todayIndex ? '<span class="schedule__dot" aria-hidden="true"></span>' : ""}
    </button>`).join("");

  $("#schedule-grid").innerHTML = DAY_KEYS.map((d, i) => {
    const items = CONFIG.schedule[d] || [];
    return `
    <div class="day${i === todayIndex ? " day--today" : ""}" role="tabpanel" id="day-${d}" aria-labelledby="tab-${d}" data-day="${i}">
      <h3 class="day__name">
        <span data-i18n="schedule.days.long" data-i18n-index="${i}"></span>
        ${i === todayIndex ? '<span class="day__today" data-i18n="schedule.today"></span>' : ""}
      </h3>
      ${items.length ? `<ul class="day__list">${items.map((c) => `
        <li class="class class--${c.class}">
          <time class="class__time">${c.time}</time>
          <p class="class__name" data-i18n="schedule.classes.${c.class}"></p>
          <p class="class__meta"><span data-i18n="trainers.${c.trainer}.name"></span> · ${c.duration} <span data-i18n="schedule.min"></span></p>
        </li>`).join("")}</ul>` : '<p class="day__empty" data-i18n="schedule.empty"></p>'}
    </div>`;
  }).join("");

  $("#schedule-legend").innerHTML = CLASS_KEYS.map((c) => `<li class="legend legend--${c}" data-i18n="schedule.classes.${c}"></li>`).join("");
  selectDay(activeDay, false);
}

function renderGallery() {
  $("#gallery-list").innerHTML = CONFIG.gallery.map((g, i) => `
    <li class="gallery__cell${g.size ? ` gallery__cell--${g.size}` : ""}" data-reveal ${delay(i % 4)}>
      <button class="gallery__item media" type="button" data-index="${i}" data-i18n-aria="a11y.openPhoto" data-i18n-keyvars='{"alt":"gallery.alts.${g.id}"}'>
        <img data-src="${g.src}" width="${g.w}" height="${g.h}" loading="lazy" decoding="async" data-i18n-alt="gallery.alts.${g.id}">
        <span class="gallery__zoom" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5"/></svg></span>
      </button>
    </li>`).join("");
}


function renderFaq() {
  $("#faq-list").innerHTML = CONFIG.faq.map((q, i) => `
    <div class="faq__item" data-reveal ${delay(i)}>
      <h3 class="faq__heading">
        <button class="faq__q" type="button" id="faq-q-${q}" aria-expanded="false" aria-controls="faq-a-${q}">
          <span data-i18n="faq.${q}.q"></span>
          <span class="faq__plus" aria-hidden="true"></span>
        </button>
      </h3>
      <div class="faq__a" id="faq-a-${q}" role="region" aria-labelledby="faq-q-${q}">
        <div class="faq__inner"><p data-i18n="faq.${q}.a"></p></div>
      </div>
    </div>`).join("");
}

function renderFormOptions() {
  const ids = ["trial", ...CONFIG.plans.map((p) => p.id), ...(CONFIG.addon ? [CONFIG.addon.id] : [])];
  $("#f-plan").innerHTML = `<option value="" data-i18n="form.planPh"></option>` +
    ids.map((id) => `<option value="${id}" data-i18n="plans.names.${id}"></option>`).join("");
}

function renderConfigValues() {
  $$('[data-config="phone"]').forEach((el) => { el.textContent = CONFIG.phone; el.href = `tel:${CONFIG.phoneHref}`; });
  $$('[data-config="instagram"]').forEach((el) => (el.href = CONFIG.instagram));
  $$('[data-config="telegram"]').forEach((el) => (el.href = CONFIG.telegram));
  $$('[data-config="hoursWeekdays"]').forEach((el) => (el.textContent = CONFIG.hours.weekdays));
  $$('[data-config="hoursWeekend"]').forEach((el) => (el.textContent = CONFIG.hours.weekend));
  $$("[data-stat]").forEach((el) => (el.textContent = formatNumber(STAT_VALUES[el.dataset.stat])));
  $("#year").textContent = new Date().getFullYear();
}

/** Lazy images rendered from JS: attach the fallback guard before setting src. */
function activateImages() {
  $$("img[data-src]").forEach((img) => {
    guardImage(img);
    img.src = img.dataset.src;
    img.removeAttribute("data-src");
  });
}

let mapLang = null;
function updateMap() {
  const frame = $("#map-frame");
  if (!frame || mapLang === currentLang) return;
  mapLang = currentLang;
  const url = new URL(CONFIG.mapEmbedUrl);
  url.searchParams.set("hl", currentLang);
  frame.src = url.toString();
}


/* =========================================================
   5. UI BEHAVIOUR
   ========================================================= */

/* ---- Logo: use images/logo.png if it exists, otherwise keep the text logo ---- */
function initLogos() {
  $$(".logo__img").forEach((img) => {
    const logo = img.closest(".logo");
    const ok = () => { if (img.naturalWidth > 0) logo.classList.add("logo--has-img"); };
    if (img.complete) ok();
    else img.addEventListener("load", ok, { once: true });
  });
}

/* ---- Sticky header + mobile menu + active link ---- */
const header = $("#header");
const burger = $(".burger");

function updateBurgerLabel() {
  const open = document.body.classList.contains("menu-open");
  burger.setAttribute("aria-label", t(open ? "a11y.menuClose" : "a11y.menuOpen"));
}

function setMenu(open) {
  document.body.classList.toggle("menu-open", open);
  burger.setAttribute("aria-expanded", String(open));
  updateBurgerLabel();
}

function initHeader() {
  const onScroll = () => header.classList.toggle("header--scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  burger.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$(".nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) { setMenu(false); burger.focus(); }
  });
  window.addEventListener("resize", () => { if (window.innerWidth >= 1100) setMenu(false); });

  // Highlight the nav link of the section currently on screen
  const links = $$(".nav__link");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => spy.observe(s));
}

/* ---- Language switchers ---- */
function initLanguageSwitch() {
  $$(".lang__btn").forEach((btn) => btn.addEventListener("click", () => {
    setLanguage(btn.dataset.lang);
  }));
}

/* ---- Scroll reveal ---- */
function initReveal() {
  const items = $$("[data-reveal]");
  if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-visible")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  items.forEach((el) => io.observe(el));
}

/* ---- Schedule: tabs + swipe on mobile ---- */
function selectDay(index, focus) {
  activeDay = (index + 7) % 7;
  $$(".schedule__tab").forEach((tab, i) => {
    const on = i === activeDay;
    tab.classList.toggle("is-active", on);
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
    if (on) {
      // Center the active tab horizontally without scrolling the page
      const bar = tab.parentElement;
      bar.scrollTo({ left: tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2, behavior: focus ? "smooth" : "auto" });
    }
  });
  $$(".day").forEach((day, i) => day.classList.toggle("is-active", i === activeDay));
}

function initSchedule() {
  const tabs = $("#schedule-tabs");
  tabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".schedule__tab");
    if (tab) selectDay(Number(tab.dataset.day), false);
  });
  tabs.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) { e.preventDefault(); selectDay(activeDay + step, true); }
    if (e.key === "Home") { e.preventDefault(); selectDay(0, true); }
    if (e.key === "End") { e.preventDefault(); selectDay(6, true); }
  });

  // Swipe left/right on the day view (mobile)
  const grid = $("#schedule-grid");
  let startX = 0, startY = 0;
  grid.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
  grid.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      selectDay(activeDay + (dx < 0 ? 1 : -1), false);
      grid.classList.remove("swipe-left", "swipe-right");
      void grid.offsetWidth; // restart the animation
      grid.classList.add(dx < 0 ? "swipe-left" : "swipe-right");
    }
  }, { passive: true });
}

/* ---- FAQ accordion ---- */
function initFaq() {
  $("#faq-list").addEventListener("click", (e) => {
    const btn = e.target.closest(".faq__q");
    if (!btn) return;
    const open = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(open));
    btn.closest(".faq__item").classList.toggle("is-open", open);
  });
}

/* ---- Gallery lightbox ---- */
function initLightbox() {
  const dialog = $("#lightbox");
  const img = $("#lightbox-img");
  const caption = $("#lightbox-caption");
  let index = 0;
  let opener = null;

  const show = (i) => {
    index = (i + CONFIG.gallery.length) % CONFIG.gallery.length;
    const item = CONFIG.gallery[index];
    img.src = item.src;
    img.alt = t(`gallery.alts.${item.id}`);
    caption.textContent = `${img.alt} · ${index + 1} / ${CONFIG.gallery.length}`;
  };

  $("#gallery-list").addEventListener("click", (e) => {
    const btn = e.target.closest(".gallery__item");
    if (!btn) return;
    opener = btn;
    show(Number(btn.dataset.index));
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.body.classList.add("no-scroll");
  });

  dialog.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "close" || e.target === dialog) dialog.close();
    if (action === "prev") show(index - 1);
    if (action === "next") show(index + 1);
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("no-scroll");
    if (opener) opener.focus();
  });

  let startX = 0;
  dialog.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  dialog.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
}

/* ---- "Choose" / "Free trial" buttons → pre-select the plan in the form ---- */
function initPlanButtons() {
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-plan]");
    if (!trigger) return;
    e.preventDefault();
    setMenu(false);
    const select = $("#f-plan");
    select.value = trigger.dataset.plan;
    touched.add("plan");
    validateField("plan");
    showForm();
    $("#contact").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => $("#f-name").focus({ preventScroll: true }), 650);
    $(".form-card").classList.remove("is-highlighted");
    void $(".form-card").offsetWidth;
    $(".form-card").classList.add("is-highlighted");
  });
}

/* ---- Lead form: phone mask, validation, submit ---- */
const form = $("#lead-form");
let phoneDigits = "";

/** Up to 9 local digits → "+998 (90) 123-45-67" */
function formatPhone(d) {
  let out = "+998 ";
  if (!d.length) return out;
  out += `(${d.slice(0, 2)}`;
  if (d.length >= 2) out += ")";
  if (d.length > 2) out += ` ${d.slice(2, 5)}`;
  if (d.length > 5) out += `-${d.slice(5, 7)}`;
  if (d.length > 7) out += `-${d.slice(7, 9)}`;
  return out;
}

function toLocalDigits(value) {
  let d = value.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  return d.slice(0, 9);
}

function initPhoneMask() {
  const input = $("#f-phone");
  input.addEventListener("focus", () => { if (!input.value) input.value = formatPhone(""); });
  input.addEventListener("blur", () => { if (!phoneDigits) input.value = ""; });
  input.addEventListener("input", (e) => {
    let d = toLocalDigits(input.value);
    // Deleting a formatting character (")", "-", " ") should delete the digit before it
    if (e.inputType && e.inputType.startsWith("delete") && d === phoneDigits && d.length) d = d.slice(0, -1);
    phoneDigits = d;
    input.value = formatPhone(d);
  });
}

const VALIDATORS = {
  name: () => { const v = $("#f-name").value.trim(); return v.length >= 2 && /\p{L}/u.test(v); },
  phone: () => phoneDigits.length === 9,
  plan: () => $("#f-plan").value !== "",
  time: () => $("#f-time").value !== ""
};
const FIELD_IDS = { name: "f-name", phone: "f-phone", plan: "f-plan", time: "f-time" };
const touched = new Set();

function validateField(name, force = false) {
  if (!force && !touched.has(name)) return true;
  const valid = VALIDATORS[name]();
  const input = $(`#${FIELD_IDS[name]}`);
  const error = $(`#${FIELD_IDS[name]}-err`);
  input.setAttribute("aria-invalid", String(!valid));
  input.closest(".field").classList.toggle("field--error", !valid);
  if (valid) { error.textContent = ""; delete error.dataset.errorKey; }
  else { error.dataset.errorKey = `form.errors.${name}`; error.textContent = t(error.dataset.errorKey); }
  return valid;
}

function showForm() {
  form.hidden = false;
  $("#form-success").hidden = true;
}

function initForm() {
  Object.keys(FIELD_IDS).forEach((name) => {
    const input = $(`#${FIELD_IDS[name]}`);
    // Validate on blur only once something was typed: an "empty field" error appearing on blur
    // shifts the layout and makes the tap on the submit button miss.
    input.addEventListener("blur", () => {
      const filled = name === "phone" ? phoneDigits.length > 0 : input.value.trim() !== "";
      if (filled) touched.add(name);
      validateField(name);
    });
    input.addEventListener(input.tagName === "SELECT" ? "change" : "input", () => {
      if (input.tagName === "SELECT") touched.add(name);
      validateField(name);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formError = $("#form-error");
    formError.textContent = "";
    delete formError.dataset.errorKey;

    // Bots fill the hidden honeypot field: pretend success, send nothing
    if ($("#f-website").value) { form.hidden = true; $("#form-success").hidden = false; return; }
    let last = 0;
    try { last = Number(localStorage.getItem("vortaq-lead-at")) || 0; } catch (err) {}
    if (Date.now() - last < LEAD_COOLDOWN_MS) {
      formError.dataset.errorKey = "form.errors.rate";
      formError.textContent = t("form.errors.rate");
      return;
    }

    const names = Object.keys(FIELD_IDS);
    names.forEach((n) => touched.add(n));
    const invalid = names.filter((n) => !validateField(n, true));
    if (invalid.length) { $(`#${FIELD_IDS[invalid[0]]}`).focus(); return; }

    const submit = $(".form__submit", form);
    const label = $("span", submit);
    submit.disabled = true;
    label.dataset.i18n = "form.sending";
    label.textContent = t("form.sending");

    const plan = $("#f-plan").value;
    const time = $("#f-time").value;
    const lead = {
      name: $("#f-name").value.trim(),
      phone: `+998${phoneDigits}`,
      plan,
      planLabel: t(`plans.names.${plan}`, "ru"),   // Russian labels for the manager
      time,
      timeLabel: t(`form.times.${time}`, "ru"),
      lang: currentLang,
      page: location.href,
      createdAt: new Date().toISOString()
    };

    try {
      await sendLead(lead);
      try { localStorage.setItem("vortaq-lead-at", String(Date.now())); } catch (err) {}
      form.reset();
      phoneDigits = "";
      touched.clear();
      $$(".field", form).forEach((f) => f.classList.remove("field--error"));
      $$(".field__input", form).forEach((i) => i.removeAttribute("aria-invalid"));
      form.hidden = true;
      const success = $("#form-success");
      success.hidden = false;
      success.focus();
    } catch (err) {
      console.error("[Vortaq] Lead was not sent:", err);
      formError.dataset.errorKey = err.code === "rate" ? "form.errors.rate" : "form.errors.submit";
      formError.textContent = t(formError.dataset.errorKey);
    } finally {
      submit.disabled = false;
      label.dataset.i18n = "form.submit";
      label.textContent = t("form.submit");
    }
  });

  $("#form-again").addEventListener("click", () => { showForm(); $("#f-name").focus(); });
}


/* =========================================================
   INIT
   ========================================================= */
function init() {
  renderFeatures();
  renderPlans();
  renderTrainers();
  renderSchedule();
  renderGallery();
  renderFaq();
  renderFormOptions();
  renderConfigValues();

  setLanguage(getInitialLanguage(), { save: false });

  activateImages();
  $$(".hero__bg img").forEach(guardImage);
  initLogos();
  initHeader();
  initLanguageSwitch();
  initReveal();
  initSchedule();
  initFaq();
  initLightbox();
  initPlanButtons();
  initPhoneMask();
  initForm();
}

init();

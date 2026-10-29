import { icons } from './icons.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Data ---------- */

let dataPromise;
export function loadData() {
  dataPromise ??= fetch('data/flights.json').then((res) => {
    if (!res.ok) throw new Error(`flights.json: ${res.status}`);
    return res.json();
  });
  return dataPromise;
}

export const airportBy = (data, code) => data.airports.find((a) => a.code === code);

// Deterministic randomness so the same search always shows the same flights.
export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const fromMin = (total) => {
  const m = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export function findRoute(data, from, to) {
  return data.routes.find((r) => (r.a === from && r.b === to) || (r.a === to && r.b === from));
}

export function generateFlights(data, { from, to, date, cabin = 'economy' }) {
  const route = findRoute(data, from, to);
  if (!route) return [];
  const rand = rng(hashStr(`${from}${to}${date}${cabin}`));
  const cabinInfo = data.cabins[cabin] ?? data.cabins.economy;
  const shortHaul = route.minutes < 120;

  return data.schedule
    .filter((slot) => !(shortHaul && slot.stops > 0))
    .map((slot, i) => {
      const hubs = data.hubs.filter((h) => h !== from && h !== to);
      const stops = Math.min(slot.stops, hubs.length);
      const via = hubs.slice(0, stops);
      const extraFlying = stops * 35 + Math.round(rand() * 20);
      const duration = route.minutes + (slot.layover ?? 0) + extraFlying + Math.round(rand() * 10);
      const depMin = toMin(slot.dep);
      const arrAbs = depMin + duration;
      const swing = 0.92 + rand() * 0.17;
      const price = Math.round((route.price * slot.factor * cabinInfo.factor * swing) / 1000) * 1000;
      const number = `${data.airline.code} ${100 + ((hashStr(from + to) + i * 37) % 800)}`;
      return {
        id: `${from}${to}-${date}-${slot.dep.replace(':', '')}`,
        number,
        from,
        to,
        date,
        cabin,
        dep: slot.dep,
        arr: fromMin(arrAbs),
        nextDay: Math.floor(arrAbs / 1440),
        depMinutes: depMin,
        duration,
        stops,
        via,
        price,
        aircraft: data.aircraft[(hashStr(number) >>> 3) % data.aircraft.length],
        seatsLeft: 2 + Math.floor(rand() * 9),
      };
    });
}

/* ---------- Formatting ---------- */

const priceFmt = new Intl.NumberFormat('ru-RU');
export const fmtPrice = (n) => `${priceFmt.format(n)} сум`;

export function fmtDuration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} мин`;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

export function fmtDate(iso, opts = { day: 'numeric', month: 'long', weekday: 'short' }) {
  if (!iso) return '';
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('ru-RU', opts);
}

export function plural(n, [one, few, many]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export const stopsLabel = (n) => (n === 0 ? 'Без пересадок' : `${n} ${plural(n, ['пересадка', 'пересадки', 'пересадок'])}`);

export function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- Booking state (sessionStorage, memory fallback) ---------- */

const KEY = 'skynavoi.booking';
let memory = {};
export const store = {
  get() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY)) ?? memory;
    } catch {
      return memory;
    }
  },
  set(patch) {
    memory = { ...store.get(), ...patch };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(memory));
    } catch {
      /* private mode: keep it in memory for this page */
    }
    return memory;
  },
};

/* ---------- Shared markup ---------- */

// Dashed route line with a plane flying along it.
export function routeTrack({ loop = false, label = '' } = {}) {
  return `<span class="track${loop ? ' track--loop' : ''}" ${label ? `role="img" aria-label="${escapeHtml(label)}"` : 'aria-hidden="true"'}>
    <span class="track__line"></span>
    <span class="track__runner"><span class="track__plane">${icons.plane(18)}</span></span>
  </span>`;
}

const NAV = [
  { id: 'flights', href: 'index.html#search', label: 'Рейсы' },
  { id: 'destinations', href: 'index.html#destinations', label: 'Направления' },
  { id: 'how', href: 'index.html#how', label: 'Как это работает' },
  { id: 'faq', href: 'index.html#faq', label: 'Помощь' },
];

const logo = `<a class="logo" href="index.html" aria-label="SkyNavoi, на главную">
  <span class="logo__mark">${icons.plane(16)}</span><span class="logo__word">SkyNavoi</span></a>`;

const langSwitch = (id) => `<div class="lang" role="group" aria-label="Язык сайта">
  <button type="button" class="lang__btn" aria-pressed="true" data-lang="ru">RU</button>
  <button type="button" class="lang__btn" aria-pressed="false" data-lang="uz" aria-describedby="${id}">UZ</button>
  <button type="button" class="lang__btn" aria-pressed="false" data-lang="en" aria-describedby="${id}">EN</button>
</div>`;

function headerHtml(current) {
  const links = NAV.map(
    (l) => `<li><a class="nav__link" href="${l.href}"${l.id === current ? ' aria-current="page"' : ''}>${l.label}</a></li>`
  ).join('');
  return `<nav class="nav glass" aria-label="Основная навигация">
    ${logo}
    <ul class="nav__links" role="list">${links}</ul>
    <div class="nav__end">
      ${langSwitch('lang-note')}
      <a class="btn btn--accent btn--sm nav__cta" href="index.html#search">Найти билет</a>
      <button type="button" class="nav__toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="Открыть меню">
        <span class="nav__toggle-bar"></span><span class="nav__toggle-bar"></span>
      </button>
    </div>
  </nav>
  <p class="lang-note" id="lang-note" role="status" aria-live="polite"></p>
  <div class="menu" id="mobile-menu" hidden>
    <ul class="menu__links" role="list">
      ${NAV.map((l, i) => `<li style="--i:${i}"><a class="menu__link" href="${l.href}"${l.id === current ? ' aria-current="page"' : ''}>${l.label}</a></li>`).join('')}
      <li style="--i:${NAV.length}"><a class="btn btn--accent menu__cta" href="index.html#search">Найти билет</a></li>
      <li style="--i:${NAV.length + 1}" class="menu__lang">${langSwitch('lang-note')}</li>
    </ul>
  </div>`;
}

function footerHtml() {
  return `<div class="footer__inner">
    <div class="footer__brand">
      ${logo}
      <p class="footer__text">Авиакомпания из Навои. Летаем по Узбекистану, в Турцию, ОАЭ и Россию.</p>
      <p class="footer__demo"><strong>Демо проект.</strong> Рейсы, цены и бронирования вымышлены. Оплата не проводится, билеты недействительны.</p>
    </div>
    <nav class="footer__col" aria-label="Пассажирам">
      <h2 class="footer__title">Пассажирам</h2>
      <ul role="list">
        <li><a href="index.html#search">Поиск рейсов</a></li>
        <li><a href="index.html#destinations">Направления</a></li>
        <li><a href="index.html#faq">Багаж и возврат</a></li>
      </ul>
    </nav>
    <nav class="footer__col" aria-label="Документы">
      <h2 class="footer__title">Документы</h2>
      <ul role="list">
        <li><a href="legal.html#privacy">Политика конфиденциальности</a></li>
        <li><a href="legal.html#terms">Условия перевозки</a></li>
      </ul>
    </nav>
    <div class="footer__col">
      <h2 class="footer__title">Контакты</h2>
      <ul role="list">
        <li><a href="tel:+998901234567">+998 90 123 45 67</a></li>
        <li><a href="mailto:help@skynavoi.example">help@skynavoi.example</a></li>
      </ul>
    </div>
  </div>
  <div class="footer__bottom">
    <p>© 2026 SkyNavoi. Вымышленная авиакомпания.</p>
    <p>Видео на главной: <a href="https://www.pexels.com/video/smooth-airplane-landing-at-busy-airport-runway-37243529/" rel="noopener" target="_blank">cnrdmroglu, Pexels</a></p>
  </div>`;
}

export function mountChrome(current = 'flights') {
  const header = $('#site-header');
  const footer = $('#site-footer');
  if (header) header.innerHTML = headerHtml(current);
  if (footer) footer.innerHTML = footerHtml();
  initNav();
  initLang();
  initReveal();
}

function initNav() {
  const toggle = $('.nav__toggle');
  const menu = $('#mobile-menu');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      const done = () => {
        if (!menu.classList.contains('is-open')) menu.hidden = true;
      };
      reduceMotion() ? done() : setTimeout(done, 300);
    }
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  matchMedia('(min-width: 960px)').addEventListener('change', (e) => e.matches && setOpen(false));
}

function initLang() {
  const note = $('#lang-note');
  const names = { uz: 'Узбекская версия сайта появится позже.', en: 'English version is coming later.' };
  let timer;
  $$('.lang__btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (lang === 'ru' || !note) return;
      note.textContent = names[lang];
      note.classList.add('is-visible');
      clearTimeout(timer);
      timer = setTimeout(() => note.classList.remove('is-visible'), 3200);
    })
  );
}

// Reveal once on enter. [data-stagger] children get a per item delay.
export function initReveal(root = document) {
  $$('[data-stagger]', root).forEach((group) =>
    [...group.children].forEach((child, i) => {
      child.classList.add('reveal');
      child.style.setProperty('--i', i);
    })
  );
  const items = $$('.reveal:not(.is-in)', root);
  if (!('IntersectionObserver' in window) || reduceMotion()) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }),
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
}

// Booking step indicator for inner pages.
export function stepsHtml(active) {
  const steps = ['Рейс', 'Место', 'Пассажиры', 'Готово'];
  return `<ol class="steps" role="list" aria-label="Шаги бронирования">${steps
    .map((s, i) => {
      const n = i + 1;
      const state = n < active ? 'done' : n === active ? 'current' : 'todo';
      return `<li class="steps__item steps__item--${state}"${n === active ? ' aria-current="step"' : ''}>
        <span class="steps__num">${n < active ? icons.check(14) : n}</span><span class="steps__label">${s}</span></li>`;
    })
    .join('')}</ol>`;
}

// Composed empty state used when booking state is missing.
export function emptyStateHtml(title, text) {
  return `<div class="empty glass">
    <span class="empty__icon">${icons.plane(28)}</span>
    <h2 class="empty__title">${title}</h2>
    <p class="empty__text">${text}</p>
    <a class="btn btn--accent" href="index.html#search">Найти рейс</a>
  </div>`;
}

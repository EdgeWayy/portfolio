/* =========================================================================
 * Lumina Mall — shared utilities
 * DOM builders, icons, sanitising, formatting, motion, toasts, modals, hashing.
 *
 * SECURITY NOTE: the UI never builds HTML from strings. Every piece of
 * user/admin-provided text goes through h()/s() below, which create real
 * DOM nodes and set text with textContent, so stored text can never be
 * interpreted as markup (no XSS through store names, product text, etc.).
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = (global.Mall = global.Mall || {});
  const CFG = global.MALL_CONFIG;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------------------------------------------------------------- log */
  Mall.log = function (...args) {
    if (CFG && CFG.DEBUG) console.log('[Lumina]', ...args);
  };

  /* ---------------------------------------------------------------- DOM */
  function applyAttrs(el, attrs) {
    if (!attrs) return;
    for (const key of Object.keys(attrs)) {
      const val = attrs[key];
      if (val == null || val === false) continue;
      if (key === 'class') {
        el.setAttribute('class', Array.isArray(val) ? val.filter(Boolean).join(' ') : val);
      } else if (key === 'style') {
        // CSSOM only: works under a strict Content-Security-Policy (no inline style attributes).
        for (const prop of Object.keys(val)) {
          if (prop.startsWith('--')) el.style.setProperty(prop, val[prop]);
          else el.style[prop] = val[prop];
        }
      } else if (key === 'dataset') {
        Object.assign(el.dataset, val);
      } else if (key === 'text') {
        el.textContent = val;
      } else if (key.startsWith('on')) {
        // Only real functions become listeners. Strings are never turned into handlers.
        if (typeof val === 'function') el.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key === 'value' && 'value' in el) {
        el.value = val;
      } else if (key === 'checked' && 'checked' in el) {
        el.checked = !!val;
      } else if (val === true) {
        el.setAttribute(key, '');
      } else {
        el.setAttribute(key, String(val));
      }
    }
  }

  function appendChildren(el, children) {
    for (const child of children.flat(Infinity)) {
      if (child == null || child === false) continue;
      el.appendChild(
        typeof child === 'string' || typeof child === 'number'
          ? document.createTextNode(String(child))
          : child
      );
    }
    return el;
  }

  /** Create an HTML element: h('button', { class: 'btn', onclick }, 'Label') */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    applyAttrs(el, attrs);
    return appendChildren(el, children);
  }

  /** Create an SVG element. */
  function s(tag, attrs, ...children) {
    const el = document.createElementNS(SVG_NS, tag);
    applyAttrs(el, attrs);
    return appendChildren(el, children);
  }

  Mall.dom = {
    h,
    s,
    $: (sel, root = document) => root.querySelector(sel),
    $$: (sel, root = document) => Array.from(root.querySelectorAll(sel)),
    clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; },
    append: appendChildren,
  };

  Mall.escapeHTML = function (str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };

  /* -------------------------------------------------------------- icons
   * Hand-made Lucide-style stroke icons (24x24). Used instead of emoji for UI controls. */
  const ICONS = {
    search: [['circle', { cx: 11, cy: 11, r: 8 }], ['path', { d: 'm21 21-4.3-4.3' }]],
    x: [['path', { d: 'M18 6 6 18' }], ['path', { d: 'm6 6 12 12' }]],
    plus: [['path', { d: 'M5 12h14' }], ['path', { d: 'M12 5v14' }]],
    minus: [['path', { d: 'M5 12h14' }]],
    'arrow-left': [['path', { d: 'm12 19-7-7 7-7' }], ['path', { d: 'M19 12H5' }]],
    'arrow-right': [['path', { d: 'M5 12h14' }], ['path', { d: 'm12 5 7 7-7 7' }]],
    'arrow-down': [['path', { d: 'M12 5v14' }], ['path', { d: 'm19 12-7 7-7-7' }]],
    'chevron-down': [['path', { d: 'm6 9 6 6 6-6' }]],
    'chevron-right': [['path', { d: 'm9 18 6-6-6-6' }]],
    sun: [
      ['circle', { cx: 12, cy: 12, r: 4 }],
      ['path', { d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41' }],
    ],
    moon: [['path', { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' }]],
    bag: [
      ['path', { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z' }],
      ['path', { d: 'M3 6h18' }],
      ['path', { d: 'M16 10a4 4 0 0 1-8 0' }],
    ],
    trash: [
      ['path', { d: 'M3 6h18' }],
      ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }],
      ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
    ],
    edit: [['path', { d: 'M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' }], ['path', { d: 'm15 5 4 4' }]],
    download: [['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }], ['path', { d: 'm7 10 5 5 5-5' }], ['path', { d: 'M12 15V3' }]],
    upload: [['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }], ['path', { d: 'm17 8-5-5-5 5' }], ['path', { d: 'M12 3v12' }]],
    refresh: [['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }], ['path', { d: 'M3 3v5h5' }]],
    lock: [['rect', { x: 3, y: 11, width: 18, height: 11, rx: 2 }], ['path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' }]],
    logout: [['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }], ['path', { d: 'm16 17 5-5-5-5' }], ['path', { d: 'M21 12H9' }]],
    store: [['path', { d: 'M3 9 4.5 4h15L21 9' }], ['path', { d: 'M4 9v11h16V9' }], ['path', { d: 'M9 20v-6h6v6' }], ['path', { d: 'M3 9h18' }]],
    package: [
      ['path', { d: 'M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8Z' }],
      ['path', { d: 'M3.3 7 12 12l8.7-5' }],
      ['path', { d: 'M12 22V12' }],
    ],
    check: [['path', { d: 'M20 6 9 17l-5-5' }]],
    clock: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 6v6l4 2' }]],
    pin: [['path', { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' }], ['circle', { cx: 12, cy: 10, r: 3 }]],
    phone: [['path', { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z' }]],
    mail: [['rect', { x: 2, y: 4, width: 20, height: 16, rx: 2 }], ['path', { d: 'm22 7-10 5L2 7' }]],
    'zoom-in': [['circle', { cx: 11, cy: 11, r: 8 }], ['path', { d: 'm21 21-4.3-4.3M11 8v6M8 11h6' }]],
    'zoom-out': [['circle', { cx: 11, cy: 11, r: 8 }], ['path', { d: 'm21 21-4.3-4.3M8 11h6' }]],
    fit: [['path', { d: 'M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3' }]],
    layers: [['path', { d: 'm12 2 10 5-10 5L2 7Z' }], ['path', { d: 'm2 17 10 5 10-5' }], ['path', { d: 'm2 12 10 5 10-5' }]],
    grid: [
      ['rect', { x: 3, y: 3, width: 7, height: 7, rx: 1.5 }],
      ['rect', { x: 14, y: 3, width: 7, height: 7, rx: 1.5 }],
      ['rect', { x: 14, y: 14, width: 7, height: 7, rx: 1.5 }],
      ['rect', { x: 3, y: 14, width: 7, height: 7, rx: 1.5 }],
    ],
    map: [['path', { d: 'M14.1 6 9.9 4 3 7v13l6.9-3 4.2 2 6.9-3V3Z' }], ['path', { d: 'M9.9 4v13M14.1 6v13' }]],
    image: [['rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }], ['circle', { cx: 9, cy: 9, r: 2 }], ['path', { d: 'm21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21' }]],
    eye: [['path', { d: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' }], ['circle', { cx: 12, cy: 12, r: 3 }]],
    'eye-off': [['path', { d: 'M9.88 9.88a3 3 0 1 0 4.24 4.24' }], ['path', { d: 'M10.73 5.08A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68' }], ['path', { d: 'M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.39-1.61' }], ['path', { d: 'm2 2 20 20' }]],
    menu: [['path', { d: 'M4 6h16M4 12h16M4 18h16' }]],
    info: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 16v-4M12 8h.01' }]],
    alert: [['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z' }], ['path', { d: 'M12 9v4M12 17h.01' }]],
    tag: [['path', { d: 'M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42Z' }], ['circle', { cx: 7.5, cy: 7.5, r: 1 }]],
    dashboard: [['path', { d: 'M3 13h8V3H3ZM13 21h8V11h-8ZM3 21h8v-6H3ZM13 3v6h8V3Z' }]],
    database: [['ellipse', { cx: 12, cy: 5, rx: 9, ry: 3 }], ['path', { d: 'M3 5v14a9 3 0 0 0 18 0V5' }], ['path', { d: 'M3 12a9 3 0 0 0 18 0' }]],
    shield: [['path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z' }]],
    wifi: [['path', { d: 'M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.86a10 10 0 0 1 14 0M8.5 16.43a5 5 0 0 1 7 0' }]],
    car: [['path', { d: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.6A2 2 0 0 0 13.7 6H7.3a2 2 0 0 0-1.6.8L3 10.5 2.1 11A2 2 0 0 0 1 12.8V16c0 .6.4 1 1 1h2' }], ['circle', { cx: 7, cy: 17, r: 2 }], ['path', { d: 'M9 17h6' }], ['circle', { cx: 17, cy: 17, r: 2 }]],
    baby: [['path', { d: 'M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5' }], ['path', { d: 'M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1' }]],
    utensils: [['path', { d: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20' }], ['path', { d: 'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7' }]],
    sparkles: [['path', { d: 'M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0Z' }]],
    send: [['path', { d: 'm22 2-7 20-4-9-9-4Z' }], ['path', { d: 'M22 2 11 13' }]],
    move: [['path', { d: 'M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20' }]],
    external: [['path', { d: 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }]],
    globe: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20' }]],
    camera: [['path', { d: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z' }], ['circle', { cx: 12, cy: 13, r: 3 }]],
    star: [['path', { d: 'm12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z' }]],
    'chevron-left': [['path', { d: 'm15 18-6-6 6-6' }]],
    'chevron-up': [['path', { d: 'm18 15-6-6-6 6' }]],
    link: [['path', { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' }], ['path', { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' }]],
    copy: [['rect', { x: 9, y: 9, width: 13, height: 13, rx: 2 }], ['path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }]],
    grip: [['circle', { cx: 9, cy: 6, r: 1 }], ['circle', { cx: 15, cy: 6, r: 1 }], ['circle', { cx: 9, cy: 12, r: 1 }], ['circle', { cx: 15, cy: 12, r: 1 }], ['circle', { cx: 9, cy: 18, r: 1 }], ['circle', { cx: 15, cy: 18, r: 1 }]],
    feather: [['path', { d: 'M12.67 19a2 2 0 0 0 1.42-.59l6.24-6.24a6 6 0 0 0-8.49-8.49L5.6 9.92A2 2 0 0 0 5 11.33V19Z' }], ['path', { d: 'M16 8 2 22M17.5 15H9' }]],
  };

  Mall.icon = function (name, opts = {}) {
    const parts = ICONS[name] || ICONS.info;
    const svgEl = s('svg', {
      class: ['icon', opts.class],
      viewBox: '0 0 24 24',
      width: opts.size || 20,
      height: opts.size || 20,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': opts.stroke || 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    });
    for (const [tag, attrs] of parts) svgEl.appendChild(s(tag, attrs));
    return svgEl;
  };

  /** Replace every <span data-icon="name"> placeholder in static HTML with a real SVG icon. */
  Mall.hydrateIcons = function (root = document) {
    for (const el of root.querySelectorAll('[data-icon]')) {
      if (el.firstChild) continue;
      el.appendChild(Mall.icon(el.dataset.icon, { size: Number(el.dataset.size) || 20 }));
    }
  };

  /* ----------------------------------------------------- small helpers */
  Mall.clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  Mall.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  Mall.debounce = function (fn, wait = 150) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  };
  Mall.uid = function (prefix = 'id') {
    const rand = new Uint32Array(2);
    (global.crypto || {}).getRandomValues ? crypto.getRandomValues(rand) : (rand[0] = Math.random() * 1e9);
    return `${prefix}-${Date.now().toString(36)}${rand[0].toString(36)}`.slice(0, 40);
  };
  Mall.slugify = function (str) {
    let s0 = String(str).toLowerCase();
    // Cyrillic names ("Тестовое платье") become readable Latin ids ("testovoe-plate").
    if (Mall.search && /[Ѐ-ӿ]/.test(s0)) s0 = Mall.search.translit(s0.replace(/ё/g, 'е'));
    return s0
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
  };
  Mall.param = (name) => new URLSearchParams(location.search).get(name);

  /* Numbers follow the active interface language. Prices are whole so'm (UZS):
     "1 250 000 сум" (ru), "1 250 000 so‘m" (uz), "UZS 1,250,000" (en). */
  const fmtCache = {};
  const numFmt = () => {
    const loc = (Mall.i18n && Mall.i18n.locale) || CFG.LOCALE;
    return fmtCache[loc] || (fmtCache[loc] = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }));
  };
  Mall.formatNumber = (n) => numFmt().format(Math.round(Number(n) || 0)).replace(/ | /g, ' ');
  Mall.formatPrice = (n) => {
    const num = Mall.formatNumber(n);
    const cur = Mall.t ? Mall.t('currency') : CFG.CURRENCY;
    return Mall.i18n && Mall.i18n.lang === 'en' ? `${cur} ${num}` : `${num} ${cur}`;
  };
  Mall.formatBytes = function (bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  /** Parse "10:00 – 22:00" and tell whether the store is open right now. */
  Mall.parseHours = function (hours) {
    const m = /(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/.exec(hours || '');
    if (!m) return null;
    return { open: +m[1] * 60 + +m[2], close: +m[3] * 60 + +m[4], openText: `${m[1].padStart(2, '0')}:${m[2]}`, closeText: `${m[3].padStart(2, '0')}:${m[4]}` };
  };
  Mall.isOpenNow = function (hours, date = new Date()) {
    const p = Mall.parseHours(hours);
    if (!p) return null;
    const now = date.getHours() * 60 + date.getMinutes();
    return p.close > p.open ? now >= p.open && now < p.close : now >= p.open || now < p.close;
  };

  /* ------------------------------------------------------------- colors */
  Mall.color = {
    hexToRgb(hex) {
      const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
      const n = m ? parseInt(m[1], 16) : 0x777777;
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    },
    rgbToHex({ r, g, b }) {
      return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    },
    /** Mix colour a with colour b; amount 0 = a, 1 = b. */
    mix(a, b, amount) {
      const A = this.hexToRgb(a), B = this.hexToRgb(b);
      return this.rgbToHex({ r: A.r + (B.r - A.r) * amount, g: A.g + (B.g - A.g) * amount, b: A.b + (B.b - A.b) * amount });
    },
    luminance(hex) {
      const { r, g, b } = this.hexToRgb(hex);
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    },
    /** Black or white, whichever reads better on the given background. */
    readableOn(hex) {
      const L = this.luminance(hex);
      const onWhite = 1.05 / (L + 0.05);
      const onDark = (L + 0.05) / 0.0575;   // #111a17 has luminance ~0.0075
      return onDark >= onWhite ? '#111a17' : '#ffffff';
    },
  };

  /* ------------------------------------------------------------- motion */
  const reducedQuery = global.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  Mall.motion = {
    get reduced() { return reducedQuery.matches; },
    get lite() { return document.documentElement.classList.contains('lite'); },
    /** Web Animations API wrapper that degrades to an instant jump. */
    animate(el, keyframes, options) {
      if (!el || !el.animate || Mall.motion.reduced) {
        const last = keyframes[keyframes.length - 1];
        if (last && options && options.fill && options.fill !== 'none') Object.assign(el.style, last);
        return { finished: Promise.resolve(), cancel() {} };
      }
      return el.animate(keyframes, options);
    },
    ease: {
      out: 'cubic-bezier(.22,1,.36,1)',
      inOut: 'cubic-bezier(.65,0,.35,1)',
      spring: 'cubic-bezier(.34,1.56,.64,1)',
    },
  };

  /* -------------------------------------------------------- page leave */
  /** Navigate with a short fade so pages feel connected. */
  Mall.go = function (url) {
    if (Mall.motion.reduced) { location.href = url; return; }
    document.documentElement.classList.add('is-leaving');
    setTimeout(() => { location.href = url; }, 230);
  };
  // Coming back via the back button restores the page from bfcache. Undo the fade.
  global.addEventListener('pageshow', (e) => {
    if (e.persisted) document.documentElement.classList.remove('is-leaving');
  });

  /* -------------------------------------------------------------- toast */
  let toastRegion = null;
  Mall.toast = function (message, type = 'info', opts = {}) {
    if (!toastRegion) {
      toastRegion = h('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(toastRegion);
    }
    const iconName = { success: 'check', error: 'alert', warning: 'alert', info: 'info' }[type] || 'info';
    const close = h('button', { class: 'toast-close', type: 'button', 'aria-label': Mall.t ? Mall.t('action.dismiss') : 'Dismiss' }, Mall.icon('x', { size: 16 }));
    const el = h('div', { class: `toast toast-${type}` },
      h('span', { class: 'toast-icon' }, Mall.icon(iconName, { size: 18 })),
      h('span', { class: 'toast-msg' }, message),
      close
    );
    toastRegion.appendChild(el);
    while (toastRegion.children.length > 4) toastRegion.firstChild.remove();
    Mall.motion.animate(el, [
      { opacity: 0, transform: 'translateY(16px) scale(.96)' },
      { opacity: 1, transform: 'none' },
    ], { duration: 320, easing: Mall.motion.ease.spring });

    let done = false;
    const dismiss = () => {
      if (done) return;
      done = true;
      const a = Mall.motion.animate(el, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px) scale(.97)' }], { duration: 180, easing: 'ease-in' });
      a.finished.then(() => el.remove());
    };
    close.addEventListener('click', dismiss);
    setTimeout(dismiss, opts.duration || (type === 'error' ? 5200 : 3200));
    return dismiss;
  };

  /* -------------------------------------------------------------- modal
   * Accessible modal/drawer: focus trap, Esc, backdrop click, scroll lock,
   * enter/exit animations, optional "grow from" origin rect (product cards). */
  const modalStack = [];
  let scrollLockCount = 0;

  function lockScroll(lock) {
    scrollLockCount += lock ? 1 : -1;
    const root = document.documentElement;
    if (lock && scrollLockCount === 1) {
      const sw = global.innerWidth - root.clientWidth;
      root.style.setProperty('--scrollbar-comp', `${sw}px`);
      root.classList.add('scroll-locked');
    } else if (!lock && scrollLockCount === 0) {
      root.classList.remove('scroll-locked');
    }
  }

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  Mall.openModal = function ({ content, label, labelledBy, variant = 'dialog', className, origin, onClose, initialFocus } = {}) {
    const previouslyFocused = document.activeElement;
    const backdrop = h('div', { class: 'modal-backdrop' });
    const panel = h('div', {
      class: ['modal-panel', `modal-${variant}`, className],
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': labelledBy ? null : label,
      'aria-labelledby': labelledBy || null,
      tabindex: '-1',
    }, content);
    const root = h('div', { class: ['modal-root', `modal-root-${variant}`] }, backdrop, panel);
    document.body.appendChild(root);
    lockScroll(true);

    const api = { el: panel, root, closed: false, close };
    modalStack.push(api);

    const ease = Mall.motion.ease;
    Mall.motion.animate(backdrop, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    if (variant === 'drawer') {
      Mall.motion.animate(panel, [{ transform: 'translateX(104%)' }, { transform: 'none' }], { duration: 420, easing: ease.out });
    } else if (origin && !Mall.motion.reduced) {
      // FLIP: grow from the clicked card.
      const end = panel.getBoundingClientRect();
      const dx = origin.left + origin.width / 2 - (end.left + end.width / 2);
      const dy = origin.top + origin.height / 2 - (end.top + end.height / 2);
      const sc = Math.max(0.2, Math.min(1, origin.width / end.width));
      panel.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${sc})`, opacity: 0.2, borderRadius: '24px' },
        { transform: 'none', opacity: 1 },
      ], { duration: 460, easing: ease.out });
      api.origin = origin;
    } else {
      Mall.motion.animate(panel, [{ opacity: 0, transform: 'translateY(18px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: ease.spring });
    }

    function onKey(e) {
      if (modalStack[modalStack.length - 1] !== api) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') {
        const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (!items.length) { e.preventDefault(); panel.focus(); return; }
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
    backdrop.addEventListener('click', () => close());

    requestAnimationFrame(() => {
      const target = (initialFocus && panel.querySelector(initialFocus)) || panel.querySelector('[data-autofocus]') || panel;
      target.focus({ preventScroll: true });
    });

    function close(result) {
      if (api.closed) return Promise.resolve();
      api.closed = true;
      document.removeEventListener('keydown', onKey);
      const i = modalStack.indexOf(api);
      if (i >= 0) modalStack.splice(i, 1);
      let anim;
      if (variant === 'drawer') {
        anim = Mall.motion.animate(panel, [{ transform: 'none' }, { transform: 'translateX(104%)' }], { duration: 260, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
      } else {
        anim = Mall.motion.animate(panel, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.97)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
      }
      Mall.motion.animate(backdrop, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
      return anim.finished.then(() => {
        root.remove();
        lockScroll(false);
        if (previouslyFocused && previouslyFocused.focus && document.contains(previouslyFocused)) previouslyFocused.focus({ preventScroll: true });
        if (onClose) onClose(result);
      });
    }
    return api;
  };

  /** Promise-based confirm dialog (replaces window.confirm, which blocks the page). */
  Mall.confirm = function ({ title, message, confirmLabel = Mall.t('action.confirm'), cancelLabel = Mall.t('action.cancel'), danger = false } = {}) {
    return new Promise((resolve) => {
      let answered = false;
      const titleId = Mall.uid('dlg');
      const ok = h('button', { class: ['btn', danger ? 'btn-danger' : 'btn-primary'], type: 'button', 'data-autofocus': true }, confirmLabel);
      const cancel = h('button', { class: 'btn btn-ghost', type: 'button' }, cancelLabel);
      const content = h('div', { class: 'confirm' },
        h('div', { class: ['confirm-icon', danger && 'is-danger'] }, Mall.icon(danger ? 'alert' : 'info', { size: 24 })),
        h('h2', { class: 'confirm-title', id: titleId }, title),
        message ? h('p', { class: 'confirm-msg' }, message) : null,
        h('div', { class: 'confirm-actions' }, cancel, ok)
      );
      const modal = Mall.openModal({ content, labelledBy: titleId, className: 'modal-sm', onClose: () => { if (!answered) resolve(false); } });
      ok.addEventListener('click', () => { answered = true; resolve(true); modal.close(); });
      cancel.addEventListener('click', () => { answered = true; resolve(false); modal.close(); });
    });
  };

  /* -------------------------------------------------- animated counters */
  Mall.animateCounter = function (el, to, { duration = 1400, prefix = '', suffix = '' } = {}) {
    const target = Number(to) || 0;
    if (Mall.motion.reduced) { el.textContent = prefix + Mall.formatNumber(target) + suffix; return; }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Mall.formatNumber(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /** Count up every [data-count] element once it scrolls into view. */
  Mall.initCounters = function (root = document) {
    const els = Array.from(root.querySelectorAll('[data-count]'));
    if (!els.length) return;
    const run = (el) => Mall.animateCounter(el, el.dataset.count, { prefix: el.dataset.prefix || '', suffix: el.dataset.suffix || '' });
    if (!('IntersectionObserver' in global)) { els.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      }
    }, { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  };

  /* ------------------------------------------------ reveal on scroll */
  let revealObserver = null;
  Mall.reveal = function (elements, { stagger = 60 } = {}) {
    const list = Array.from(elements);
    list.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--i', String(i % 12));
      el.style.setProperty('--stagger', `${stagger}ms`);
    });
    if (!('IntersectionObserver' in global) || Mall.motion.reduced) {
      list.forEach((el) => el.classList.add('is-in'));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    list.forEach((el) => revealObserver.observe(el));
  };

  /* ------------------------------------------------------------ SHA-256
   * Small pure-JS SHA-256, so hashing also works when the site is opened
   * straight from disk (file://), where crypto.subtle may be unavailable. */
  Mall.sha256 = (function () {
    const K = [];
    const H0 = [];
    (function init() {
      const isPrime = (n) => { for (let f = 2; f * f <= n; f++) if (n % f === 0) return false; return true; };
      let n = 2, i = 0;
      while (i < 64) {
        if (isPrime(n)) {
          if (i < 8) H0[i] = (((Math.sqrt(n) % 1) * 4294967296) | 0);
          K[i] = (((Math.cbrt(n) % 1) * 4294967296) | 0);
          i++;
        }
        n++;
      }
    })();
    const ror = (x, n) => (x >>> n) | (x << (32 - n));

    return function sha256(message) {
      const bytes = new TextEncoder().encode(String(message));
      const len = bytes.length;
      const total = ((len + 9 + 63) >> 6) << 6;
      const buf = new Uint8Array(total);
      buf.set(bytes);
      buf[len] = 0x80;
      const view = new DataView(buf.buffer);
      const bits = len * 8;
      view.setUint32(total - 8, Math.floor(bits / 4294967296));
      view.setUint32(total - 4, bits >>> 0);

      const H = H0.slice();
      const W = new Int32Array(64);
      for (let off = 0; off < total; off += 64) {
        for (let i = 0; i < 16; i++) W[i] = view.getInt32(off + i * 4);
        for (let i = 16; i < 64; i++) {
          const a = W[i - 15], b = W[i - 2];
          const s0 = ror(a, 7) ^ ror(a, 18) ^ (a >>> 3);
          const s1 = ror(b, 17) ^ ror(b, 19) ^ (b >>> 10);
          W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
        }
        let [a, b, c, d, e, f, g, hh] = H;
        for (let i = 0; i < 64; i++) {
          const S1 = ror(e, 6) ^ ror(e, 11) ^ ror(e, 25);
          const ch = (e & f) ^ (~e & g);
          const t1 = (hh + S1 + ch + K[i] + W[i]) | 0;
          const S0 = ror(a, 2) ^ ror(a, 13) ^ ror(a, 22);
          const maj = (a & b) ^ (a & c) ^ (b & c);
          const t2 = (S0 + maj) | 0;
          hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + hh) | 0;
      }
      return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
    };
  })();

  /** Compare two strings without an early exit (habit from server code; harmless here). */
  Mall.safeEqual = function (a, b) {
    a = String(a); b = String(b);
    let diff = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return diff === 0;
  };
})(window);

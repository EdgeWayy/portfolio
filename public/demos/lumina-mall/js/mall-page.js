/* =========================================================================
 * Lumina Mall — main screen (index.html)
 * Wires the atrium (js/atrium.js) to the page: elevator floor panel,
 * multilingual search with live suggestions, zoom-into-store hand-over,
 * deep links (?store=… / ?floor=…), About stats and the contact form.
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = global.Mall;
  const CFG = global.MALL_CONFIG;
  const S = Mall.storage;
  const { h, $, $$ } = Mall.dom;
  const t = Mall.t;
  const L = Mall.L;

  const coarse = matchMedia('(pointer: coarse)').matches;
  // Phones and small tablets: a light static hero replaces the 3D atrium
  // (see the "phone home page" block in css/atrium.css).
  const simple = matchMedia('(max-width: 768px)').matches;
  const INTRO_KEY = CFG.STORAGE_PREFIX + 'intro-seen';

  let atrium;
  let stores = [];
  let products = [];
  let index = [];

  async function loadData() {
    [stores, products] = await Promise.all([S.getStores(), S.getAllProducts()]);
    index = Mall.search.buildIndex(stores, products);
  }

  /* ============================================================ boot */
  async function boot() {
    await loadData();
    let firstVisit = true;
    try { firstVisit = !sessionStorage.getItem(INTRO_KEY); sessionStorage.setItem(INTRO_KEY, '1'); } catch (e) { /* ignore */ }

    atrium = simple ? staticAtrium() : Mall.Atrium.create($('#atriumStage'), {
      onFloor: updateElevator,
      onEnter: handOver,
      onPastBottom: () => $('#about').scrollIntoView({ behavior: Mall.motion.reduced ? 'auto' : 'smooth' }),
    });
    atrium.setStores(stores);
    buildElevator();
    wireSearch();
    wireContactForm();
    await fillStats();

    Mall.i18n.onChange(() => {
      atrium.rebuild();
      buildElevator();
      runSearch($('#mallSearch').value, { keepOpen: false });
    });
    S.onChange(async (type) => {
      if (type !== 'data') return;
      await loadData();
      atrium.setStores(stores);
      runSearch($('#mallSearch').value, { keepOpen: false });
      fillStats();
    });
    document.addEventListener('mall:lite', () => location.reload());

    await Mall.page.init({ loaderMinTime: simple ? 0 : firstVisit ? 1200 : 200 });
    statsReady = true;

    const focusId = Mall.param('store');
    const startFloor = Number(Mall.param('floor'));
    await atrium.playIntro({ speed: firstVisit ? 1 : 0.4 });
    if (focusId && stores.some((s) => s.id === focusId)) atrium.focusStore(focusId);
    else if (startFloor >= 1 && startFloor <= 4) atrium.setFloor(startFloor);
    else if (firstVisit && !simple) showHint();
  }

  /** Stand-in for the atrium on phones: same methods, no drawing, no animation. */
  function staticAtrium() {
    const noop = () => {};
    return { floor: 1, setStores: noop, setSearch: noop, rebuild: noop, reset: noop, setFloor: noop, focusStore: noop, playIntro: () => Promise.resolve() };
  }

  /* ======================================================== elevator */
  function buildElevator() {
    const panel = $('#elevator');
    Mall.dom.clear(panel);
    panel.setAttribute('aria-label', t('elevator.label'));
    const display = h('div', { class: 'elev-display', 'aria-hidden': 'true' },
      h('span', { class: 'elev-arrow' }, Mall.icon('chevron-up', { size: 14 })),
      h('span', { class: 'elev-num' }, String(atrium.floor)));
    const list = h('div', { class: 'elev-buttons', role: 'radiogroup', 'aria-label': t('elevator.label') });
    for (let f = 4; f >= 1; f--) {
      const count = stores.filter((s) => s.floor === f).length;
      const btn = h('button', {
        type: 'button', role: 'radio', class: 'elev-btn', 'data-floor': String(f),
        'aria-label': `${t('elevator.goto', { n: f })} · ${t('count.stores', { n: count })}`,
        title: t('floor.n', { n: f }),
      }, h('span', { class: 'elev-btn-n' }, String(f)), h('span', { class: 'elev-badge', hidden: true }));
      btn.addEventListener('click', () => atrium.setFloor(f));
      list.appendChild(btn);
    }
    list.addEventListener('keydown', (e) => {
      const map = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 };
      if (!map[e.key]) return;
      e.preventDefault();
      const next = Mall.clamp(atrium.floor + map[e.key], 1, 4);
      atrium.setFloor(next);
      requestAnimationFrame(() => { const b = list.querySelector(`[data-floor="${next}"]`); if (b) b.focus(); });
    });
    panel.append(display, list);
    updateElevator(atrium.floor, '');
    applyBadges();
  }

  function updateElevator(f, dir) {
    const panel = $('#elevator');
    if (!panel) return;
    for (const b of $$('.elev-btn', panel)) {
      const on = Number(b.dataset.floor) === f;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    const num = $('.elev-num', panel);
    if (num) num.textContent = String(f);
    panel.classList.remove('is-up', 'is-down');
    if (dir) {
      void panel.offsetWidth;
      panel.classList.add(dir === 'up' ? 'is-up' : 'is-down');
      clearTimeout(updateElevator.t);
      updateElevator.t = setTimeout(() => panel.classList.remove('is-up', 'is-down'), 1100);
    }
    const label = $('#floorLabel');
    if (label) {
      const count = stores.filter((s) => s.floor === f).length;
      label.textContent = `${t('floor.n', { n: f })} · ${t('count.stores', { n: count })}`;
    }
  }

  /* ========================================================== search */
  let results = [];
  let cursor = -1;
  let badgeCounts = null;

  /** Render text segments with <mark> for matches (DOM nodes, never innerHTML). */
  function highlighted(text, q) {
    return Mall.search.highlight(text, q).map((seg) => (seg.hit ? h('mark', null, seg.text) : seg.text));
  }

  function runSearch(raw, { keepOpen = true } = {}) {
    const q = Mall.validate.text(raw, 60);
    const list = $('#searchResults');
    const input = $('#mallSearch');
    $('.search-clear').hidden = !q;
    Mall.dom.clear(list);
    cursor = -1;
    if (!q.trim()) {
      results = [];
      atrium.setSearch(null);
      badgeCounts = null;
      applyBadges();
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      announce('');
      return;
    }
    results = Mall.search.query(index, q, { limit: 12 });
    atrium.setSearch(new Set(results.map((r) => r.store.id)));
    badgeCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    results.forEach((r) => { badgeCounts[r.store.floor]++; });
    applyBadges();

    if (!results.length) {
      list.appendChild(h('li', { class: 'search-empty', role: 'presentation' }, t('search.none', { q: q.slice(0, 40) })));
      list.appendChild(h('li', { class: 'search-tip', role: 'presentation' }, t('search.hint')));
    }
    results.forEach((r, i) => {
      const st = r.store;
      const name = L(st.name);
      // Explain why it matched when the match is not visible in the current-language name.
      let why = null;
      const lang = Mall.i18n.lang;
      if (!r.match && r.products[0]) {
        // A product matched best: show it (plus the matched translation if it is another language).
        const pm = r.products[0];
        const shown = L(pm.product.name);
        why = h('span', { class: 'si-why' }, Mall.icon('tag', { size: 12 }), ' ',
          t('search.matchProduct', { text: '' }), ...highlighted(pm.lang === lang || pm.text === shown ? shown : `${shown} (${pm.text})`, q));
      } else if (r.match && !(r.match.lang === lang && (r.match.kind === 'name' || r.match.kind === 'category'))) {
        // Matched a keyword, a description or another language: show the matching text.
        if (!(r.match.kind === 'name' && r.match.text === name)) {
          why = h('span', { class: 'si-why' }, Mall.icon('search', { size: 12 }), ' ', ...highlighted(r.match.text, q));
        }
      }
      list.appendChild(h('li', {
        id: `sr-${i}`, role: 'option', class: 'search-item', 'aria-selected': 'false', 'data-id': st.id,
        style: { '--c': st.color },
        onpointerdown: (e) => e.preventDefault(),     // keep focus in the input
        onclick: () => pick(st.id),
      },
      h('span', { class: 'si-logo', 'aria-hidden': 'true' }, st.logo),
      h('span', { class: 'si-text' },
        h('strong', null, ...highlighted(name, q)),
        h('span', { class: 'si-meta' }, ...highlighted(L(st.category), q), ` · ${t('floor.n', { n: st.floor })}`),
        why),
      h('span', { class: 'si-floor', 'aria-hidden': 'true' }, String(st.floor))));
    });
    list.hidden = !keepOpen && document.activeElement !== input;
    input.setAttribute('aria-expanded', String(!list.hidden));
    announce(results.length ? t('search.found', { n: results.length }) : t('search.none', { q: q.slice(0, 40) }));
  }

  function applyBadges() {
    for (const b of $$('#elevator .elev-btn')) {
      const badge = $('.elev-badge', b);
      const n = badgeCounts ? badgeCounts[b.dataset.floor] : 0;
      badge.textContent = String(n);
      badge.hidden = !n;
    }
  }

  function pick(id) {
    $('#searchResults').hidden = true;
    $('#mallSearch').setAttribute('aria-expanded', 'false');
    if (simple) { location.href = `store.html?id=${encodeURIComponent(id)}`; return; }
    atrium.focusStore(id, { pulse: true });
  }

  function moveCursor(delta) {
    const items = $$('#searchResults .search-item');
    if (!items.length) return;
    cursor = (cursor + delta + items.length) % items.length;
    items.forEach((el, i) => el.setAttribute('aria-selected', String(i === cursor)));
    $('#mallSearch').setAttribute('aria-activedescendant', items[cursor].id);
    items[cursor].scrollIntoView({ block: 'nearest' });
  }

  function announce(text) {
    const live = $('#searchLive');
    if (live) live.textContent = text;
  }

  function wireSearch() {
    const input = $('#mallSearch');
    const list = $('#searchResults');
    input.addEventListener('input', Mall.debounce(() => runSearch(input.value), 110));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) runSearch(input.value); moveCursor(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveCursor(-1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const items = $$('#searchResults .search-item');
        const chosen = items[Math.max(0, cursor)];
        if (chosen) pick(chosen.dataset.id);
      } else if (e.key === 'Escape') {
        if (input.value) { input.value = ''; runSearch(''); } else input.blur();
      }
    });
    input.addEventListener('focus', () => { if (input.value) runSearch(input.value); });
    input.addEventListener('blur', () => setTimeout(() => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); }, 120));
    $('.search-clear').addEventListener('click', () => { input.value = ''; runSearch(''); input.focus(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
    });
  }

  /* ===================================================== hand-over */
  /** Called by the atrium when a store is entered: colour veil, then navigate. */
  function handOver(st, delay) {
    const url = `store.html?id=${encodeURIComponent(st.id)}`;
    try { sessionStorage.setItem(CFG.STORAGE_PREFIX + 'zoom-from', st.id); } catch (e) { /* ignore */ }
    if (!delay) { location.href = url; return; }
    const veil = $('#zoomVeil');
    veil.style.setProperty('--c', st.color);
    $('.zoom-veil-emoji', veil).textContent = st.logo;
    setTimeout(() => {
      veil.classList.add('is-on');
      veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 340, easing: 'ease-in', fill: 'forwards' });
      $('.zoom-veil-emoji', veil).animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, easing: Mall.motion.ease.spring, fill: 'forwards' });
    }, delay * 0.5);
    setTimeout(() => { location.href = url; }, delay + 260);
  }

  // Back button (bfcache): undo the zoom and the veil.
  global.addEventListener('pageshow', (e) => {
    if (!e.persisted || !atrium) return;
    const veil = $('#zoomVeil');
    veil.classList.remove('is-on');
    veil.getAnimations().forEach((a) => a.cancel());
    $('.zoom-veil-emoji', veil).getAnimations().forEach((a) => a.cancel());
    atrium.reset();
  });

  /* ============================================================ hint */
  function showHint() {
    const hint = $('#atriumHint');
    hint.textContent = t(coarse ? 'hint.touch' : 'hint.desktop');
    hint.hidden = false;
    requestAnimationFrame(() => hint.classList.add('is-in'));
    setTimeout(() => { hint.classList.remove('is-in'); setTimeout(() => { hint.hidden = true; }, 300); }, 4200);
  }

  /* =========================================================== stats */
  let statsReady = false;
  async function fillStats() {
    const stats = await S.getStats();
    const set = (key, value) => {
      const el = $(`[data-stat="${key}"]`);
      if (!el) return;
      el.dataset.count = String(value);
      if (statsReady) el.textContent = Mall.formatNumber(value) + (el.dataset.suffix || '');
    };
    set('stores', stats.stores);
    set('products', stats.products);
    set('parking', CFG.MALL.parkingSpaces);
    set('visitors', CFG.MALL.visitorsPerDay);
  }

  /* ==================================================== contact form */
  function wireContactForm() {
    const form = $('#contactForm');
    if (!form) return;
    const RATE_KEY = CFG.STORAGE_PREFIX + 'contact-last';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        name: Mall.validate.text(form.elements.name.value, 60),
        email: Mall.validate.text(form.elements.email.value, 120),
        message: Mall.validate.text(form.elements.message.value, 1000, { multiline: true }),
      };
      if (form.elements.website && form.elements.website.value) return;   // honeypot: bots fill hidden fields
      const errors = {};
      if (data.name.length < 2) errors.name = 'form.err.name';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.email = 'form.err.email';
      if (data.message.length < 10) errors.message = 'form.err.message';
      for (const field of ['name', 'email', 'message']) {
        const input = form.elements[field];
        const err = form.querySelector(`[data-error-for="${field}"]`);
        input.setAttribute('aria-invalid', String(!!errors[field]));
        if (err) err.textContent = errors[field] ? t(errors[field]) : '';
      }
      const firstBad = Object.keys(errors)[0];
      if (firstBad) { form.elements[firstBad].focus(); return; }

      // Client-side rate limit (1 message / 30 s). A real backend must rate-limit on the server.
      let last = 0;
      try { last = Number(localStorage.getItem(RATE_KEY)) || 0; } catch (err) { /* ignore */ }
      const wait = Math.ceil((last + 30000 - Date.now()) / 1000);
      if (wait > 0) { Mall.toast(t('form.wait', { s: wait }), 'warning'); return; }
      try { localStorage.setItem(RATE_KEY, String(Date.now())); } catch (err) { /* ignore */ }

      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.classList.add('is-loading');
      setTimeout(() => {
        btn.disabled = false;
        btn.classList.remove('is-loading');
        form.reset();
        Mall.toast(t('form.sent', { name: data.name }), 'success');
      }, 700);
    });
  }

  // On phones the amenities and the contact form start collapsed behind "show more".
  // Stats show their final numbers at once (no count-up animation).
  if (simple) {
    $$('details.m-more').forEach((d) => { d.open = false; });
    Mall.initCounters = (root = document) => {
      for (const el of root.querySelectorAll('[data-count]')) el.textContent = (el.dataset.prefix || '') + Mall.formatNumber(el.dataset.count) + (el.dataset.suffix || '');
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);

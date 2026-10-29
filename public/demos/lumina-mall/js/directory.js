/* =========================================================================
 * Lumina Mall — store directory (mall.html)
 * Multilingual search (js/search.js), floor and category filters, store
 * cards with photos and a live "open now" status.
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = global.Mall;
  const S = Mall.storage;
  const { h, $, $$ } = Mall.dom;
  const t = Mall.t;
  const L = Mall.L;

  const state = { q: '', floor: 'all', category: 'all' };
  let stores = [];
  let products = [];
  let counts = {};
  let index = [];

  async function load() {
    [stores, products] = await Promise.all([S.getStores(), S.getAllProducts()]);
    stores.sort((a, b) => a.floor - b.floor || a.slot - b.slot);
    counts = {};
    for (const p of products) counts[p.storeId] = (counts[p.storeId] || 0) + 1;
    index = Mall.search.buildIndex(stores, products);
    const set = (key, v) => { const el = $(`[data-stat="${key}"]`); if (el) el.dataset.count = String(v); };
    set('stores', stores.length);
    set('products', products.length);
    set('open', stores.filter((s) => Mall.isOpenNow(s.hours)).length);
  }

  async function boot() {
    await load();
    renderChips();
    renderFloors();
    wireFilters();
    render();
    S.onChange(async (type) => { if (type === 'data') { await load(); renderChips(); render(); } });
    Mall.i18n.onChange(() => { renderChips(); renderFloors(); render(); });
    await Mall.page.init();
  }

  /** Category key: the category in the active language (stores share translations). */
  const catOf = (st) => L(st.category);

  function renderChips() {
    const host = Mall.dom.clear($('#categoryChips'));
    host.setAttribute('aria-label', t('dir.categoryFilter'));
    const cats = Array.from(new Set(stores.map(catOf))).sort((a, b) => a.localeCompare(b, Mall.i18n.locale));
    if (state.category !== 'all' && !cats.includes(state.category)) state.category = 'all';
    for (const cat of ['all', ...cats]) {
      host.appendChild(h('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(state.category === cat),
        onclick: () => { state.category = cat; renderChips(); render(); },
      }, cat === 'all' ? t('dir.allCategories') : cat));
    }
  }

  function renderFloors() {
    const seg = $('.dir-floor');
    Mall.dom.clear(seg);
    seg.setAttribute('aria-label', t('dir.floorFilter'));
    seg.appendChild(h('span', { class: 'segmented-thumb', 'aria-hidden': 'true' }));
    const values = ['all', '1', '2', '3', '4'];
    values.forEach((v, i) => {
      const btn = h('button', { type: 'button', role: 'radio', 'data-floor': v, 'aria-checked': String(state.floor === v) },
        v === 'all' ? t('dir.all') : t('floor.short', { n: v }));
      btn.addEventListener('click', () => {
        state.floor = v;
        seg.style.setProperty('--idx', String(i));
        $$('[data-floor]', seg).forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
        render();
      });
      seg.appendChild(btn);
    });
    seg.style.setProperty('--count', String(values.length));
    seg.style.setProperty('--idx', String(values.indexOf(state.floor)));
  }

  function wireFilters() {
    $('#dirSearch').addEventListener('input', Mall.debounce((e) => { state.q = Mall.validate.text(e.target.value, 60); render(); }, 120));
  }

  function storeCard(st, why) {
    const open = Mall.isOpenNow(st.hours);
    const n = counts[st.id] || 0;
    const name = L(st.name);
    const url = `store.html?id=${encodeURIComponent(st.id)}`;
    const top = h('div', { class: 'sc-top img-box' });
    const photo = st.cover || st.photo;
    if (photo) { const img = h('img', { alt: '', decoding: 'async' }); top.appendChild(img); Mall.images.bind(img, photo, 'sm'); }
    top.append(h('span', { class: 'sc-floor' }, t('floor.n', { n: st.floor })));
    const logo = h('span', { class: 'sc-logo img-box', 'aria-hidden': 'true' }, st.logo);
    if (st.logoImage) { const li = h('img', { alt: '' }); logo.appendChild(li); Mall.images.bind(li, st.logoImage, 'thumb'); }
    return h('article', { class: 'store-card', style: { '--c': st.color, '--c-soft': Mall.color.mix(st.color, '#fffaf2', 0.85), '--c-dark': Mall.color.mix(st.color, '#0e1120', 0.75), '--c-ink': Mall.color.readableOn(st.color) } },
      top,
      logo,
      h('div', { class: 'sc-body' },
        h('h2', { class: 'sc-name' }, h('a', { href: url, 'data-transition': true, class: 'sc-link' }, ...hl(name))),
        h('span', { class: 'sc-cat' }, ...hl(L(st.category))),
        why ? h('span', { class: 'sc-why' }, Mall.icon('tag', { size: 12 }), ' ', ...hl(why)) : null,
        h('p', { class: 'sc-desc' }, L(st.description)),
        h('div', { class: 'sc-meta' },
          open == null ? null : h('span', { class: ['dot-status', open ? 'is-open' : 'is-closed'] }, t(open ? 'status.open' : 'status.closed')),
          h('span', null, Mall.icon('clock', { size: 14 }), st.hours),
          h('span', null, Mall.icon('package', { size: 14 }), t('count.products', { n }))
        )
      ),
      h('div', { class: 'sc-actions' },
        h('a', { class: 'btn btn-sm sc-enter', href: url, 'data-transition': true, tabindex: '-1', 'aria-hidden': 'true' }, t('dir.visit'), Mall.icon('arrow-right', { size: 16 })),
        h('a', { class: 'btn btn-sm btn-ghost sc-map', href: `index.html?store=${encodeURIComponent(st.id)}`, 'data-transition': true, 'aria-label': t('dir.onMapAria', { name }) }, Mall.icon('pin', { size: 16 }), t('dir.onMap'))
      )
    );
  }

  const hl = (text) => (state.q ? Mall.search.highlight(text, state.q).map((s) => (s.hit ? h('mark', null, s.text) : s.text)) : [text]);

  function render() {
    const grid = Mall.dom.clear($('#storeGrid'));
    let list;
    const whys = new Map();
    if (state.q.trim()) {
      const res = Mall.search.query(index, state.q, { limit: 100 });
      list = res.map((r) => r.store);
      res.forEach((r) => {
        if (!r.match && r.products[0]) whys.set(r.store.id, L(r.products[0].product.name));
        else if (r.match && r.match.lang !== Mall.i18n.lang) whys.set(r.store.id, r.match.text);
      });
    } else list = stores.slice();
    list = list.filter((s) => (state.floor === 'all' || String(s.floor) === state.floor) && (state.category === 'all' || catOf(s) === state.category));
    $('#dirCount').textContent = t('dir.count', { n: list.length, total: stores.length });
    if (!list.length) {
      grid.appendChild(h('div', { class: 'empty-state grid-empty' },
        h('div', { class: 'empty-art', 'aria-hidden': 'true' }, Mall.icon('search', { size: 38, stroke: 1.6 })),
        h('h3', null, t('dir.emptyT')),
        h('p', null, t('dir.emptyD'))));
      return;
    }
    const cards = list.map((st) => storeCard(st, whys.get(st.id)));
    grid.append(...cards);
    Mall.reveal(cards, { stagger: 50 });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);

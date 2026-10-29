/* =========================================================================
 * Lumina Mall — store page (store.html?id=...)
 * Store header (photo + dark overlay), product grid with filters and lazy
 * photos, product modal with a swipe/zoom gallery, cart.
 *
 * Hover note: card tilt only writes CSS variables from a rAF-throttled
 * pointermove; nothing is re-created and no animation is restarted there.
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = global.Mall;
  const CFG = global.MALL_CONFIG;
  const S = Mall.storage;
  const { h, $ } = Mall.dom;
  const C = Mall.color;
  const t = Mall.t;
  const L = Mall.L;

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let store = null;
  let products = [];

  async function boot() {
    const id = String(Mall.param('id') || '').toLowerCase().slice(0, 48);
    store = id ? await S.getStore(id) : null;

    if (!store) {
      renderNotFound();
      await Mall.page.init();
      return;
    }

    applyStoreTheme(store);
    products = await S.getProducts(store.id);
    renderHero();
    wireToolbar();
    renderGrid();
    $('#backToMap').href = `index.html?store=${encodeURIComponent(store.id)}`;

    // Arrived via the atrium's zoom-into-the-door transition? Fade out of the store's colour.
    let fromZoom = false;
    try {
      fromZoom = sessionStorage.getItem(CFG.STORAGE_PREFIX + 'zoom-from') === store.id;
      sessionStorage.removeItem(CFG.STORAGE_PREFIX + 'zoom-from');
    } catch (e) { /* ignore */ }

    if (fromZoom && !Mall.motion.reduced) {
      const veil = $('#enterVeil');
      $('.enter-veil-emoji', veil).textContent = store.logo;
      veil.classList.add('is-on');
      if ($('#loader')) $('#loader').remove();
      await Mall.page.init({ loaderMinTime: 0 });
      await Mall.sleep(120);
      veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, easing: 'ease-out', fill: 'forwards' }).finished.then(() => veil.remove());
      $('.enter-veil-emoji', veil).animate([{ transform: 'scale(1)' }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 480, easing: 'ease-in', fill: 'forwards' });
    } else {
      $('#enterVeil').remove();
      await Mall.page.init();
    }
    heroEntrance();

    // Language switch: re-render the translated parts (no reload).
    Mall.i18n.onChange(() => { applyStoreTheme(store); renderHero(); renderGrid(); });
    // Changes made in the admin panel (another tab) show up live.
    S.onChange(async (type) => {
      if (type !== 'data') return;
      const fresh = await S.getStore(store.id);
      if (!fresh) { location.href = 'index.html'; return; }
      store = fresh;
      applyStoreTheme(store);
      products = await S.getProducts(store.id);
      renderHero();
      renderGrid();
    });
  }

  /* ---------------------------------------------------------- theme */
  function applyStoreTheme(st) {
    const root = document.documentElement;
    root.style.setProperty('--c', st.color);
    root.style.setProperty('--c-soft', C.mix(st.color, '#fffaf2', 0.86));
    root.style.setProperty('--c-soft-dark', C.mix(st.color, '#0e1120', 0.78));
    root.style.setProperty('--c-deep', C.mix(st.color, '#000000', 0.28));
    root.style.setProperty('--c-ink', C.readableOn(st.color));
    root.style.setProperty('--c-light', C.mix(st.color, '#ffffff', 0.35));
    document.title = `${L(st.name)} · Lumina Mall`;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', st.color);
  }

  /* ----------------------------------------------------------- hero */
  function renderHero() {
    // Logo: custom image or emoji.
    const logo = Mall.dom.clear($('#storeLogo'));
    logo.classList.toggle('has-image', !!store.logoImage);
    if (store.logoImage) {
      logo.classList.add('img-box');
      const img = h('img', { alt: '', decoding: 'async' });
      logo.appendChild(img);
      Mall.images.bind(img, store.logoImage, 'thumb', { eager: true });
    } else logo.textContent = store.logo;

    // Header photo: custom cover → bundled photo → gradient.
    const bg = $('#heroPhoto');
    const photoRef = store.cover || store.photo;
    bg.classList.toggle('has-photo', !!photoRef);
    if (photoRef) {
      const img = $('img', bg) || bg.appendChild(h('img', { alt: '', decoding: 'async' }));
      Mall.images.bind(img, photoRef, 'full', { eager: true });
    }

    $('#storeName').textContent = L(store.name);
    $('#storeDesc').textContent = L(store.description);

    const open = Mall.isOpenNow(store.hours);
    const tags = Mall.dom.clear($('#storeTags'));
    tags.append(
      h('span', { class: 'pill pill-store' }, Mall.icon('tag', { size: 14 }), L(store.category)),
      open == null ? null : h('span', { class: ['pill', open ? 'pill-ok' : 'pill-closed'] }, h('span', { class: ['dot-status', open ? 'is-open' : 'is-closed'] }, t(open ? 'status.openNow' : 'status.closedNow')))
    );

    const inStock = products.filter((p) => p.inStock).length;
    const facts = Mall.dom.clear($('#storeFacts'));
    const fact = (icon, label, value) => h('div', { class: 'fact' },
      h('span', { class: 'fact-icon' }, Mall.icon(icon, { size: 18 })),
      h('div', null, h('dt', null, label), h('dd', null, value)));
    facts.append(
      fact('clock', t('store.hours'), store.hours),
      fact('layers', t('store.location'), t('floor.n', { n: store.floor })),
      fact('package', t('store.products'), t('store.productsValue', { n: products.length, m: inStock }))
    );
  }

  function heroEntrance() {
    if (Mall.motion.reduced) return;
    const e = Mall.motion.ease;
    $('#storeLogo').animate([{ transform: 'scale(.5) rotate(-12deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, easing: e.spring, fill: 'backwards', delay: 80 });
    Array.from($('.hero-copy').children).forEach((el, i) => {
      el.animate([{ transform: 'translateY(16px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, delay: 160 + i * 80, easing: e.out, fill: 'backwards' });
    });
  }

  /* -------------------------------------------------------- toolbar */
  function wireToolbar() {
    const rerender = Mall.debounce(renderGrid, 120);
    $('#productSearch').addEventListener('input', rerender);
    $('#productSort').addEventListener('change', renderGrid);
    $('#inStockOnly').addEventListener('change', renderGrid);
  }

  function visibleProducts() {
    const q = $('#productSearch').value;
    const sort = $('#productSort').value;
    const onlyStock = $('#inStockOnly').checked;
    // Multilingual: a product matches if any translation of its name/description/keywords does.
    const texts = (p) => ['ru', 'uz', 'en'].flatMap((l) => [p.name[l], p.description[l], p.keywords && p.keywords[l]]).filter(Boolean);
    const list = products.filter((p) => (!onlyStock || p.inStock) && Mall.search.matches(q, texts(p)));
    const by = {
      featured: (a, b) => (b.inStock - a.inStock) || 0,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      name: (a, b) => L(a.name).localeCompare(L(b.name), Mall.i18n.locale),
    }[sort] || (() => 0);
    return list.slice().sort(by);
  }

  /* ----------------------------------------------------------- grid */
  /** Photo box with skeleton shimmer; the emoji placeholder shows when there is no photo or it fails. */
  function media(product, { variant = 'thumb', index = 0, large = false } = {}) {
    const ref = product.images && product.images[index];
    const el = h('div', { class: ['p-media', 'img-box', large && 'p-media-lg', !ref && 'is-error'] },
      h('span', { class: 'p-shape p-shape-1', 'aria-hidden': 'true' }),
      h('span', { class: 'p-shape p-shape-2', 'aria-hidden': 'true' }),
      h('span', { class: 'p-emoji', role: 'img', 'aria-label': L(product.name) }, product.emoji));
    if (ref) {
      const img = h('img', { alt: L(product.name), decoding: 'async', draggable: 'false' });
      el.appendChild(img);
      Mall.images.bind(img, ref, variant);
    }
    return el;
  }

  function stockBadge(product) {
    return product.inStock
      ? h('span', { class: 'p-badge is-in' }, Mall.icon('check', { size: 13, stroke: 3 }), t('product.inStock'))
      : h('span', { class: 'p-badge is-out' }, t('product.outOfStock'));
  }

  function card(product) {
    const name = L(product.name);
    const addBtn = h('button', {
      class: 'btn btn-sm p-add', type: 'button', disabled: !product.inStock,
      'aria-label': product.inStock ? t('product.addAria', { name }) : t('product.outAria', { name }),
    }, Mall.icon('plus', { size: 16 }), product.inStock ? t('product.add') : t('product.soldOut'));
    addBtn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(product, addBtn); });

    const open = h('button', { class: 'p-open', type: 'button', 'aria-label': t('product.details', { name }) });
    const count = product.images ? product.images.length : 0;
    const el = h('article', { class: ['p-card', !product.inStock && 'is-out'] },
      media(product),
      stockBadge(product),
      count > 1 ? h('span', { class: 'p-count', 'aria-hidden': 'true' }, Mall.icon('image', { size: 12 }), String(count)) : null,
      h('div', { class: 'p-body' },
        h('h3', { class: 'p-name' }, name),
        h('p', { class: 'p-desc' }, L(product.description)),
        h('div', { class: 'p-foot' }, h('span', { class: 'p-price' }, Mall.formatPrice(product.price)), addBtn)
      ),
      open
    );
    open.addEventListener('click', () => openDetail(product, el));
    if (finePointer && !Mall.motion.lite && !Mall.motion.reduced) attachTilt(el);
    return el;
  }

  /** 3D tilt that follows the pointer. rAF-throttled, only CSS variables change. */
  function attachTilt(el) {
    let raf = 0, px = 0, py = 0;
    const apply = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const x = (px - r.left) / r.width - 0.5;
      const y = (py - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
    };
    el.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(apply); });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf); raf = 0;
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  }

  function renderGrid() {
    const grid = Mall.dom.clear($('#productGrid'));
    const list = visibleProducts();
    $('#resultCount').textContent = t('store.resultCount', { n: list.length, total: products.length });
    if (!list.length) {
      grid.appendChild(h('div', { class: 'empty-state grid-empty' },
        h('div', { class: 'empty-art', 'aria-hidden': 'true' }, Mall.icon(products.length ? 'search' : 'package', { size: 38, stroke: 1.6 })),
        h('h3', null, t(products.length ? 'store.emptyT' : 'store.noneT')),
        h('p', null, t(products.length ? 'store.emptyD' : 'store.noneD'))
      ));
      return;
    }
    const cards = list.map(card);
    grid.append(...cards);
    Mall.reveal(cards, { stagger: 55 });
  }

  /* ------------------------------------------------------------ cart */
  function addToCart(product, fromEl) {
    if (!product.inStock) return;
    Mall.cart.add(product.id, 1);
    Mall.cart.flyToCart(fromEl);
    if (fromEl) {
      fromEl.classList.add('is-added');
      setTimeout(() => fromEl.classList.remove('is-added'), 900);
    }
    Mall.toast(t('product.added', { name: L(product.name) }), 'success');
  }

  /* ========================================================= gallery
   * Swipe (touch) or arrows/keys (desktop), thumbnail strip, click to zoom
   * (2.2x at the click point, drag to look around), pinch to zoom on phones. */
  function gallery(product) {
    const refs = (product.images || []).slice();
    const name = L(product.name);
    let index = 0;
    const track = h('div', { class: 'g-track' });
    const slides = refs.length ? refs.map((ref, i) => {
      const slide = h('div', { class: 'g-slide img-box', role: 'group', 'aria-roledescription': 'slide', 'aria-label': t('gallery.photo', { i: i + 1, n: refs.length }) },
        h('span', { class: 'p-emoji', 'aria-hidden': 'true' }, product.emoji));
      const img = h('img', { alt: `${name} · ${t('gallery.photo', { i: i + 1, n: refs.length })}`, draggable: 'false', decoding: 'async' });
      slide.appendChild(img);
      Mall.images.bind(img, ref, 'full', { eager: i === 0 });
      return slide;
    }) : [h('div', { class: 'g-slide img-box is-error' }, h('span', { class: 'p-emoji', role: 'img', 'aria-label': name }, product.emoji))];
    track.append(...slides);

    const prev = h('button', { class: 'g-nav g-prev', type: 'button', 'aria-label': t('gallery.prev') }, Mall.icon('chevron-left', { size: 22 }));
    const next = h('button', { class: 'g-nav g-next', type: 'button', 'aria-label': t('gallery.next') }, Mall.icon('chevron-right', { size: 22 }));
    const counter = h('span', { class: 'g-counter', 'aria-live': 'polite' });
    const thumbs = h('div', { class: 'g-thumbs', role: 'tablist', 'aria-label': t('gallery.thumbs') },
      refs.length > 1 ? refs.map((ref, i) => {
        const b = h('button', { class: 'g-thumb img-box', type: 'button', role: 'tab', 'aria-label': t('gallery.photo', { i: i + 1, n: refs.length }) });
        const img = h('img', { alt: '', draggable: 'false' });
        b.appendChild(img);
        Mall.images.bind(img, ref, 'thumb', { eager: true });
        b.addEventListener('click', () => go(i));
        return b;
      }) : null);
    const viewport = h('div', { class: 'g-viewport', tabindex: '0', 'aria-label': t('gallery.zoom') }, track);
    const root = h('div', { class: ['gallery', refs.length > 1 && 'has-many'] }, viewport, refs.length > 1 ? prev : null, refs.length > 1 ? next : null, refs.length > 1 ? counter : null, thumbs);

    function go(i, { instant = false } = {}) {
      index = Mall.clamp(i, 0, slides.length - 1);
      resetZoom();
      track.style.transition = instant || Mall.motion.reduced ? 'none' : '';
      track.style.transform = `translate3d(${-index * 100}%, 0, 0)`;
      counter.textContent = `${index + 1} / ${slides.length}`;
      thumbs.querySelectorAll('.g-thumb').forEach((b, k) => b.setAttribute('aria-selected', String(k === index)));
      prev.disabled = index === 0;
      next.disabled = index === slides.length - 1;
      // Pre-load the neighbour.
      const n = slides[index + 1] && slides[index + 1].querySelector('img');
      if (n && !n.src) Mall.images.bind(n, refs[index + 1], 'full', { eager: true });
      const cur = slides[index].querySelector('img');
      if (cur && !cur.src) Mall.images.bind(cur, refs[index], 'full', { eager: true });
    }
    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    });

    /* zoom state (on the current slide's image) */
    let z = 1, zx = 0, zy = 0;
    const curImg = () => slides[index].querySelector('img');
    function applyZoom() {
      const img = curImg();
      if (!img) return;
      img.style.transform = z > 1 ? `translate(${zx}px, ${zy}px) scale(${z})` : '';
      viewport.classList.toggle('is-zoomed', z > 1);
    }
    function resetZoom() { z = 1; zx = 0; zy = 0; slides.forEach((s) => { const im = s.querySelector('img'); if (im) im.style.transform = ''; }); viewport.classList.remove('is-zoomed'); }
    function clampPan() {
      const r = viewport.getBoundingClientRect();
      const mx = (r.width * (z - 1)) / 2, my = (r.height * (z - 1)) / 2;
      zx = Mall.clamp(zx, -mx, mx); zy = Mall.clamp(zy, -my, my);
    }

    /* pointer handling: swipe between slides, drag when zoomed, pinch */
    const pts = new Map();
    let start = null, pinch = null, moved = false;
    viewport.addEventListener('pointerdown', (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      if (pts.size === 1) start = { x: e.clientX, y: e.clientY, zx, zy, t: performance.now() };
      if (pts.size === 2) {
        const [a, b] = Array.from(pts.values());
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z };
      }
      try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinch) {
        const [a, b] = Array.from(pts.values());
        z = Mall.clamp(pinch.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d), 1, 4);
        clampPan(); applyZoom(); moved = true;
        return;
      }
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;
      if (z > 1) { zx = start.zx + dx; zy = start.zy + dy; clampPan(); applyZoom(); return; }
      if (slides.length > 1 && Math.abs(dx) > Math.abs(dy)) {
        track.style.transition = 'none';
        track.style.transform = `translate3d(calc(${-index * 100}% + ${dx}px), 0, 0)`;
      }
    });
    const up = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size || !start) return;
      const dx = e.clientX - start.x;
      const fast = Math.abs(dx) / Math.max(1, performance.now() - start.t) > 0.4;
      if (z === 1 && slides.length > 1 && moved && (Math.abs(dx) > 60 || fast)) go(index + (dx < 0 ? 1 : -1));
      else if (z === 1) go(index);
      if (!moved && e.pointerType === 'mouse') {
        // Click to zoom in at the click point, click again to zoom out.
        if (z > 1) resetZoom();
        else {
          const r = viewport.getBoundingClientRect();
          z = 2.2;
          zx = (r.width / 2 - (e.clientX - r.left)) * (z - 1);
          zy = (r.height / 2 - (e.clientY - r.top)) * (z - 1);
          clampPan(); applyZoom();
        }
      }
      start = null;
    };
    viewport.addEventListener('pointerup', up);
    viewport.addEventListener('pointercancel', up);
    viewport.addEventListener('dblclick', (e) => e.preventDefault());

    requestAnimationFrame(() => go(0, { instant: true }));
    return root;
  }

  /* ---------------------------------------------------------- detail */
  function openDetail(product, fromCard) {
    const titleId = 'pd-title';
    const name = L(product.name);
    let qty = 1;
    const qtyOut = h('output', { class: 'step-val', 'aria-live': 'polite' }, '1');
    const setQty = (n) => { qty = Mall.clamp(n, 1, 20); qtyOut.textContent = String(qty); };
    const addBtn = h('button', { class: 'btn btn-accent btn-lg pd-add', type: 'button', disabled: !product.inStock, 'data-autofocus': product.inStock ? true : null },
      Mall.icon('bag', { size: 18 }), product.inStock ? t('product.addToBag') : t('product.outOfStock'));
    const others = products.filter((p) => p.id !== product.id).slice(0, 3);

    const content = h('div', { class: 'pd' },
      h('button', { class: 'icon-btn modal-close', type: 'button', 'aria-label': t('action.close'), onclick: () => modal.close() }, Mall.icon('x')),
      h('div', { class: 'pd-media' }, gallery(product)),
      h('div', { class: 'pd-info' },
        h('span', { class: 'pd-store' }, `${store.logo} ${L(store.name)}`),
        h('h2', { class: 'pd-title', id: titleId }, name),
        h('div', { class: 'row' }, h('span', { class: 'pd-price' }, Mall.formatPrice(product.price)), stockBadge(product)),
        h('p', { class: 'pd-desc' }, L(product.description) || t('product.noDesc')),
        h('div', { class: 'pd-buy' },
          h('div', { class: 'stepper', role: 'group', 'aria-label': t('product.qty') },
            h('button', { class: 'step-btn', type: 'button', 'aria-label': t('product.qtyDec'), onclick: () => setQty(qty - 1), disabled: !product.inStock }, Mall.icon('minus', { size: 16 })),
            qtyOut,
            h('button', { class: 'step-btn', type: 'button', 'aria-label': t('product.qtyInc'), onclick: () => setQty(qty + 1), disabled: !product.inStock }, Mall.icon('plus', { size: 16 }))
          ),
          addBtn
        ),
        h('ul', { class: 'pd-perks' },
          h('li', null, Mall.icon('store', { size: 16 }), t('product.pickup', { store: L(store.name), floor: t('floor.n', { n: store.floor }) })),
          h('li', null, Mall.icon('clock', { size: 16 }), t('product.openHours', { hours: store.hours }))
        ),
        others.length ? h('div', { class: 'pd-more' },
          h('h3', null, t('product.more')),
          h('div', { class: 'pd-more-list' }, others.map((p) => {
            const thumb = h('span', { class: 'pd-more-thumb img-box' }, h('span', { 'aria-hidden': 'true' }, p.emoji));
            if (p.images && p.images[0]) { const im = h('img', { alt: '' }); thumb.appendChild(im); Mall.images.bind(im, p.images[0], 'thumb', { eager: true }); }
            return h('button', { class: 'pd-more-item', type: 'button', onclick: () => { modal.close().then(() => openDetail(p)); } },
              thumb, h('span', null, L(p.name)), h('strong', null, Mall.formatPrice(p.price)));
          }))
        ) : null
      )
    );
    addBtn.addEventListener('click', () => {
      Mall.cart.add(product.id, qty);
      Mall.cart.flyToCart(addBtn);
      Mall.toast(t('product.addedQty', { qty, name }), 'success');
      modal.close();
    });
    const modal = Mall.openModal({ content, labelledBy: titleId, className: 'modal-product', origin: fromCard ? fromCard.getBoundingClientRect() : null });
  }

  /* ------------------------------------------------------- not found */
  function renderNotFound() {
    document.title = `${t('store.notFoundT')} · Lumina Mall`;
    $('#storeHero').remove();
    const section = $('#products');
    Mall.dom.clear(section);
    section.appendChild(h('div', { class: 'container' },
      h('div', { class: 'empty-state not-found' },
        h('div', { class: 'empty-art', 'aria-hidden': 'true' }, Mall.icon('store', { size: 40, stroke: 1.6 })),
        h('h1', { class: 'h2' }, t('store.notFoundT')),
        h('p', null, t('store.notFoundD')),
        h('div', { class: 'row' },
          h('a', { class: 'btn btn-primary', href: 'index.html', 'data-transition': true }, Mall.icon('map', { size: 18 }), t('store.openAtrium')),
          h('a', { class: 'btn btn-outline', href: 'mall.html', 'data-transition': true }, Mall.icon('grid', { size: 18 }), t('nav.directory')))
      )));
    $('#enterVeil').remove();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);

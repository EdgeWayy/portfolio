/* =========================================================================
 * Lumina Mall — shopping cart
 * A mall-wide cart: items from any store, saved in localStorage through
 * Mall.storage.getCart/setCart. Checkout is a demo: no payment is taken.
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = global.Mall;
  const { h, s } = Mall.dom;
  const S = Mall.storage;
  const t = Mall.t;
  const L = Mall.L;

  let drawer = null;

  function count(items = S.getCart()) {
    return items.reduce((n, i) => n + i.qty, 0);
  }

  function add(productId, qty = 1) {
    const items = S.getCart();
    const found = items.find((i) => i.productId === productId);
    if (found) found.qty = Math.min(99, found.qty + qty);
    else items.push({ productId, qty: Math.min(99, qty) });
    S.setCart(items);   // notifies onChange('cart') → badges + drawer refresh
  }

  function setQty(productId, qty) {
    let items = S.getCart();
    if (qty <= 0) items = items.filter((i) => i.productId !== productId);
    else items.forEach((i) => { if (i.productId === productId) i.qty = Math.min(99, qty); });
    S.setCart(items);
  }

  const remove = (productId) => setQty(productId, 0);
  const clear = () => S.setCart([]);

  /** Resolve cart lines to products. Lines whose product was deleted are dropped. */
  async function lines() {
    const items = S.getCart();
    const [products, stores] = await Promise.all([S.getAllProducts(), S.getStores()]);
    const pMap = new Map(products.map((p) => [p.id, p]));
    const sMap = new Map(stores.map((st) => [st.id, st]));
    const result = [];
    for (const item of items) {
      const product = pMap.get(item.productId);
      if (!product) continue;
      result.push({ ...item, product, store: sMap.get(product.storeId) });
    }
    if (result.length !== items.length) S.setCart(result.map(({ productId, qty }) => ({ productId, qty })));
    return result;
  }

  /* --------------------------------------------------------- badge UI */
  let lastCount = null;
  function updateBadges(bounce) {
    const n = count();
    for (const badge of document.querySelectorAll('[data-cart-count]')) {
      badge.textContent = n > 99 ? '99+' : String(n);
      badge.hidden = n === 0;
      if (bounce && n !== lastCount && n > 0) {
        Mall.motion.animate(badge, [
          { transform: 'scale(1)' },
          { transform: 'scale(1.55)', offset: 0.35 },
          { transform: 'scale(.88)', offset: 0.65 },
          { transform: 'scale(1)' },
        ], { duration: 560, easing: 'ease-out' });
        const btn = badge.closest('button, a');
        if (btn) Mall.motion.animate(btn, [{ transform: 'rotate(0)' }, { transform: 'rotate(-9deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(0)' }], { duration: 480, easing: 'ease-out' });
      }
    }
    for (const btn of document.querySelectorAll('[data-cart-open]')) {
      btn.setAttribute('aria-label', n ? t('cart.openCount', { n }) : t('cart.openEmpty'));
    }
    lastCount = n;
  }

  /** Small "flying dot" from the add button to the cart icon. */
  function flyToCart(fromEl) {
    const target = document.querySelector('[data-cart-open]');
    if (!fromEl || !target || Mall.motion.reduced || Mall.motion.lite) return;
    const a = fromEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const dot = h('div', { class: 'fly-dot' });
    document.body.appendChild(dot);
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    dot.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 80}px) scale(1.2)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${x1}px, ${y1}px) scale(.4)`, opacity: 0.4 },
    ], { duration: 650, easing: 'cubic-bezier(.5,0,.3,1)' }).finished.then(() => dot.remove());
  }

  /* -------------------------------------------------------- drawer UI */
  function thumb(product, store) {
    const el = h('div', { class: 'cart-thumb', style: { '--c': (store && store.color) || '#c9a227' } },
      h('span', { class: 'cart-thumb-emoji', 'aria-hidden': 'true' }, product.emoji || '🛍️'));
    if (product.images && product.images[0]) {
      const img = h('img', { alt: '', decoding: 'async' });
      el.appendChild(img);
      Mall.images.bind(img, product.images[0], 'thumb', { eager: true });
    }
    return el;
  }

  function stepper(line) {
    const name = L(line.product.name);
    const dec = h('button', { class: 'step-btn', type: 'button', 'aria-label': t('cart.dec', { name }), onclick: () => setQty(line.productId, line.qty - 1) }, Mall.icon('minus', { size: 16 }));
    const inc = h('button', { class: 'step-btn', type: 'button', 'aria-label': t('cart.inc', { name }), onclick: () => setQty(line.productId, line.qty + 1), disabled: line.qty >= 99 }, Mall.icon('plus', { size: 16 }));
    return h('div', { class: 'stepper', role: 'group', 'aria-label': t('product.qty') }, dec, h('output', { class: 'step-val', 'aria-live': 'polite' }, String(line.qty)), inc);
  }

  async function renderDrawer() {
    if (!drawer) return;
    const body = drawer.el.querySelector('.cart-body');
    const foot = drawer.el.querySelector('.cart-foot');
    const all = await lines();
    Mall.dom.clear(body);
    Mall.dom.clear(foot);
    drawer.el.querySelector('#cart-title').textContent = t('cart.title');
    drawer.el.querySelector('.cart-close').setAttribute('aria-label', t('cart.close'));
    drawer.el.querySelector('.cart-count-label').textContent = all.length ? t('count.items', { n: count() }) : '';

    if (!all.length) {
      body.appendChild(h('div', { class: 'empty-state cart-empty' },
        h('div', { class: 'empty-art', 'aria-hidden': 'true' }, Mall.icon('bag', { size: 40, stroke: 1.6 })),
        h('h3', null, t('cart.emptyT')),
        h('p', null, t('cart.emptyD')),
        h('a', { class: 'btn btn-soft', href: 'index.html', 'data-transition': true }, Mall.icon('map', { size: 18 }), t('cart.explore'))
      ));
      return;
    }

    const list = h('ul', { class: 'cart-list' });
    for (const line of all) {
      const name = L(line.product.name);
      list.appendChild(h('li', { class: 'cart-line' },
        thumb(line.product, line.store),
        h('div', { class: 'cart-line-info' },
          h('span', { class: 'cart-line-name' }, name),
          h('span', { class: 'cart-line-store' }, line.store ? `${line.store.logo} ${L(line.store.name)}` : ''),
          !line.product.inStock ? h('span', { class: 'pill pill-warn' }, t('cart.outRemoved')) : null,
          stepper(line)
        ),
        h('div', { class: 'cart-line-side' },
          h('span', { class: 'cart-line-price' }, Mall.formatPrice(line.product.price * line.qty)),
          h('button', { class: 'icon-btn icon-btn-sm', type: 'button', 'aria-label': t('cart.remove', { name }), onclick: () => remove(line.productId) }, Mall.icon('trash', { size: 16 }))
        )
      ));
    }
    body.appendChild(list);

    const payable = all.filter((l) => l.product.inStock);
    const subtotal = payable.reduce((sum, l) => sum + l.product.price * l.qty, 0);
    foot.append(
      h('div', { class: 'cart-total' }, h('span', null, t('cart.subtotal')), h('strong', null, Mall.formatPrice(subtotal))),
      h('p', { class: 'cart-note' }, t('cart.note')),
      h('div', { class: 'cart-actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => {
          if (await Mall.confirm({ title: t('cart.clearT'), message: t('cart.clearD'), confirmLabel: t('cart.clearBtn'), danger: true })) clear();
        } }, t('action.clear')),
        h('button', { class: 'btn btn-accent btn-block', type: 'button', disabled: !payable.length, onclick: () => checkout(payable, subtotal) }, Mall.icon('check', { size: 18 }), t('cart.checkout'))
      )
    );
  }

  function open() {
    if (drawer && !drawer.closed) return;
    const content = h('div', { class: 'cart' },
      h('header', { class: 'cart-head' },
        h('div', null, h('h2', { id: 'cart-title' }, t('cart.title')), h('span', { class: 'cart-count-label' })),
        h('button', { class: 'icon-btn cart-close', type: 'button', 'aria-label': t('cart.close'), 'data-autofocus': true, onclick: () => drawer.close() }, Mall.icon('x'))
      ),
      h('div', { class: 'cart-body' }),
      h('footer', { class: 'cart-foot' })
    );
    drawer = Mall.openModal({ content, labelledBy: 'cart-title', variant: 'drawer', onClose: () => { drawer = null; } });
    renderDrawer();
  }

  function checkout(payable, total) {
    const orderNo = 'LM-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const ids = new Set(payable.map((l) => l.productId));
    S.setCart(S.getCart().filter((i) => !ids.has(i.productId)));
    const doClose = drawer ? drawer.close() : Promise.resolve();
    doClose.then(() => {
      const content = h('div', { class: 'order-done' },
        h('div', { class: 'order-check', 'aria-hidden': 'true' }, s('svg', { viewBox: '0 0 64 64', width: 72, height: 72 },
          s('circle', { class: 'oc-ring', cx: 32, cy: 32, r: 28, pathLength: 1 }),
          s('path', { class: 'oc-tick', d: 'M20 33l8 8 16-17', pathLength: 1 }))),
        h('h2', { id: 'order-title' }, t('order.title')),
        h('p', null, t('order.thanks')),
        h('dl', { class: 'order-meta' },
          h('div', null, h('dt', null, t('order.number')), h('dd', null, orderNo)),
          h('div', null, h('dt', null, t('order.items')), h('dd', null, String(payable.reduce((n, l) => n + l.qty, 0)))),
          h('div', null, h('dt', null, t('order.total')), h('dd', null, Mall.formatPrice(total)))
        ),
        h('p', { class: 'muted small' }, t('order.note')),
        h('button', { class: 'btn btn-primary btn-block', type: 'button', 'data-autofocus': true, onclick: () => modal.close() }, t('order.continue'))
      );
      const modal = Mall.openModal({ content, labelledBy: 'order-title', className: 'modal-sm' });
      if (!Mall.motion.reduced && !Mall.motion.lite) confetti(modal.el);
    });
  }

  /** A tiny confetti burst made of a few DOM nodes (no canvas, cheap on phones). */
  function confetti(host) {
    const colors = ['#c9a227', '#d9806f', '#1f2a4d', '#b76e79', '#f0c98a', '#7a48d6'];
    const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    host.appendChild(box);
    for (let i = 0; i < 26; i++) {
      const piece = h('i', { style: { background: colors[i % colors.length] } });
      box.appendChild(piece);
      const angle = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
      const dist = 90 + Math.random() * 110;
      piece.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + 60}px) rotate(${Math.random() * 540}deg)`, opacity: 0 },
      ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
    }
    setTimeout(() => box.remove(), 1800);
  }

  /* ----------------------------------------------------------- wiring */
  function init() {
    updateBadges(false);
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cart-open]');
      if (btn) { e.preventDefault(); open(); }
    });
    // setCart() notifies here, so this one listener keeps badges and the open drawer fresh
    // (including changes made in another tab).
    S.onChange((type) => {
      if (type === 'cart' || type === 'data') {
        updateBadges(type === 'cart');
        if (drawer) renderDrawer();
      }
    });
  }

  /** Re-render translated parts (called on language change). */
  function refresh() {
    updateBadges(false);
    if (drawer) renderDrawer();
  }

  Mall.cart = { add, setQty, remove, clear, count, lines, open, init, refresh, flyToCart };
})(window);

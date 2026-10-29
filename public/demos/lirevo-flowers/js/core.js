/* Общий слой: состояние корзины, шапка/подвал, дровер, тосты, анимации. */
(() => {
  const D = window.LIREVO_DATA;
  const { t } = window.I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt = (n) => money.format(Math.round(n * 100) / 100);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* приватный режим */ } },
  };

  /* ---------------- icons (Lucide-style, 24px, stroke) ---------------- */
  const P = {
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    arrowL: '<path d="M19 12H5M11 19l-7-7 7-7"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 8.38A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    pin: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
    cash: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    balloon: '<path d="M12 16c3.3 0 6-3.13 6-7A6 6 0 0 0 6 9c0 3.87 2.7 7 6 7Z"/><path d="M12 16v2c0 1.5-2 2-2 4"/><path d="m11 16 1 1 1-1"/>',
    vase: '<path d="M9 2h6M10 2v3c0 1-3 3-3 7s2 8 5 10c3-2 5-6 5-10s-3-6-3-7V2"/>',
    sparkle: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"/>',
    insta: '<rect width="20" height="20" x="2" y="2" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
  };
  const icon = (name, cls = '') => `<svg class="i-${name} ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name]}</svg>`;
  const logoMark = '<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><g fill="currentColor">' +
    [0, 72, 144, 216, 288].map((r) => `<ellipse cx="20" cy="11" rx="6" ry="9" transform="rotate(${r} 20 20)" opacity=".85"/>`).join('') +
    '</g><circle cx="20" cy="20" r="4.5" fill="#FBF8F3"/><circle cx="20" cy="20" r="2.2" fill="#A16207"/></svg>';

  /* ---------------- catalog helpers ---------------- */
  const byId = (id) => D.PRODUCTS.find((p) => p.id === id) || D.EXTRAS.find((e) => e.id === id);
  const sizeOf = (id) => D.SIZES.find((s) => s.id === id) || D.SIZES[1];
  const isExtra = (id) => id.startsWith('x-');
  const unitPrice = (id, size) => {
    const p = byId(id);
    if (!p) return 0;
    return isExtra(id) ? p.price : Math.round(p.price * sizeOf(size).mult);
  };
  const catName = (id) => (D.CATEGORIES.find((c) => c.id === id) || {}).name || '';

  /* ---------------- cart ---------------- */
  // данные из localStorage попадают в разметку — пропускаем только известные товары, размеры и целые количества
  const cleanItems = (list) => (Array.isArray(list) ? list : [])
    .filter((i) => i && typeof i.id === 'string' && byId(i.id) && (i.size === 'one' || D.SIZES.some((s) => s.id === i.size)))
    .map((i) => ({ id: i.id, size: i.size, qty: Math.min(99, Math.max(1, Math.floor(+i.qty) || 1)) }));
  const Cart = {
    items: cleanItems(store.get('lirevo.cart', [])),
    save() { store.set('lirevo.cart', this.items); document.dispatchEvent(new CustomEvent('cart:change')); },
    find(id, size) { return this.items.find((i) => i.id === id && i.size === size); },
    add(id, size = 'm', qty = 1) {
      if (isExtra(id)) size = 'one';
      const it = this.find(id, size);
      if (it) it.qty = Math.min(99, it.qty + qty); else this.items.push({ id, size, qty });
      this.save();
    },
    setQty(id, size, qty) {
      const it = this.find(id, size);
      if (!it) return;
      if (qty <= 0) return this.remove(id, size);
      it.qty = Math.min(99, qty);
      this.save();
    },
    remove(id, size) { this.items = this.items.filter((i) => !(i.id === id && i.size === size)); this.save(); },
    clear() { this.items = []; this.save(); },
    count() { return this.items.reduce((a, i) => a + i.qty, 0); },
    lines() {
      return this.items.map((i) => {
        const p = byId(i.id), unit = unitPrice(i.id, i.size);
        return { ...i, p, unit, total: unit * i.qty, extra: isExtra(i.id) };
      });
    },
    subtotal() { return this.lines().reduce((a, l) => a + l.total, 0); },
  };

  const Promo = {
    get() { const c = store.get('lirevo.promo', ''); return D.PROMOS[c] ? c : ''; },
    set(code) { store.set('lirevo.promo', code); },
  };

  function totals({ express = false } = {}) {
    const sub = Cart.subtotal();
    const code = Promo.get();
    const rate = D.PROMOS[code] || 0;
    const discount = Math.round(sub * rate * 100) / 100;
    const shipping = sub === 0 || sub - discount >= D.FREE_SHIPPING ? 0 : D.SHIPPING;
    const exp = express ? D.EXPRESS : 0;
    return { sub, discount, code: rate ? code : '', shipping, express: exp, total: sub - discount + shipping + exp };
  }

  /* ---------------- thumbs ---------------- */
  const extraArt = (name) => `<div style="width:100%;height:100%;display:grid;place-items:center;color:var(--accent)">${icon(name)}</div>`;
  function thumb(line, count = 6) {
    if (line.extra) return extraArt(line.p.icon);
    return LirevoArt.bouquet(line.p.art, { count, seed: line.p.id, cls: 'is-in' });
  }

  /* ---------------- layout injection ---------------- */
  const page = document.body.dataset.page || '';
  const NAV = [
    { href: 'index.html', label: t('nav.home'), id: 'home' },
    { href: 'catalog.html', label: t('nav.catalog'), id: 'catalog' },
    { href: 'index.html#delivery', label: t('nav.delivery'), id: 'delivery' },
    { href: '#contacts', label: t('nav.contacts'), id: 'contacts' },
  ];

  function renderHeader() {
    const host = $('#site-header');
    if (!host) return;
    host.className = 'site-header';
    host.innerHTML = `
      <div class="container header-inner">
        <a class="logo" href="index.html" aria-label="${t('logo.home')}">${logoMark}<span class="logo-text"><b>Lirevo</b><small>${t('brand.tag')}</small></span></a>
        <nav class="main-nav" aria-label="${t('nav.main')}"><ul>
          ${NAV.map((n) => `<li><a href="${n.href}" ${n.id === page ? 'aria-current="page"' : ''}>${n.label}</a></li>`).join('')}
        </ul></nav>
        <div class="header-actions">
          ${window.I18N.switcher('lang-switch--header')}
          <a class="icon-btn" href="catalog.html#search" aria-label="${t('search.aria')}">${icon('search')}</a>
          <button class="icon-btn" type="button" data-open-cart aria-label="${t('cart.open')}" aria-haspopup="dialog">${icon('bag')}<span class="cart-badge" aria-hidden="true">0</span></button>
          <button class="icon-btn burger" type="button" data-open-menu aria-label="${t('menu.open')}" aria-expanded="false" aria-controls="mobile-menu">${icon('menu')}</button>
        </div>
      </div>`;

    const menu = document.createElement('div');
    menu.className = 'mobile-menu';
    menu.id = 'mobile-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', t('menu'));
    menu.innerHTML = `
      <div class="mobile-menu-top">
        <a class="logo" href="index.html">${logoMark}<span class="logo-text"><b>Lirevo</b><small>${t('brand.tag')}</small></span></a>
        <button class="icon-btn" type="button" data-close-menu aria-label="${t('menu.close')}">${icon('x')}</button>
      </div>
      <nav aria-label="${t('nav.mobile')}"><ul>${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}</ul></nav>
      <div class="mobile-menu-foot"><a href="tel:+74950000000">+7 (495) 000-00-00</a><span>${t('hours')}</span>${window.I18N.switcher()}</div>`;
    document.body.appendChild(menu);

    const burger = $('[data-open-menu]', host);
    const openMenu = (open) => {
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) setTimeout(() => $('[data-close-menu]', menu).focus(), 300); else burger.focus();
    };
    burger.addEventListener('click', () => openMenu(true));
    $('[data-close-menu]', menu).addEventListener('click', () => openMenu(false));
    $$('nav a', menu).forEach((a) => a.addEventListener('click', () => openMenu(false)));
    menu.addEventListener('keydown', (e) => { if (e.key === 'Escape') openMenu(false); });

    // шапка: стекло после скролла, прячется при скролле вниз
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      host.classList.toggle('is-scrolled', y > 10);
      host.classList.toggle('is-hidden', y > 400 && y > lastY + 4 && !document.body.classList.contains('no-hide-header'));
      if (y < lastY - 4) host.classList.remove('is-hidden');
      lastY = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function renderFooter() {
    const host = $('#site-footer');
    if (!host) return;
    host.className = 'site-footer';
    host.id = 'contacts';
    host.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="logo" href="index.html">${logoMark}<span class="logo-text"><b>Lirevo</b><small>${t('brand.tag')}</small></span></a>
            <p>${t('footer.about')}</p>
            <div class="socials">
              <a href="#" aria-label="Instagram">${icon('insta')}</a>
              <a href="#" aria-label="Telegram">${icon('send')}</a>
              <a href="tel:+74950000000" aria-label="${t('footer.call')}">${icon('phone')}</a>
            </div>
          </div>
          <div><h4>${t('footer.shop')}</h4><ul><li><a href="catalog.html">${t('footer.all')}</a></li><li><a href="catalog.html?cat=roses">${catName('roses')}</a></li><li><a href="catalog.html?cat=peonies">${catName('peonies')}</a></li><li><a href="catalog.html?cat=boxes">${t('footer.boxes')}</a></li></ul></div>
          <div><h4>${t('footer.customers')}</h4><ul><li><a href="index.html#delivery">${t('footer.deliveryPay')}</a></li><li><a href="cart.html">${t('footer.cart')}</a></li><li><a href="#">${t('footer.care')}</a></li><li><a href="#">${t('footer.corp')}</a></li></ul></div>
          <div><h4>${t('footer.contacts')}</h4><ul><li><a href="tel:+74950000000">+7 (495) 000-00-00</a></li><li><a href="mailto:hello@lirevo.example">hello@lirevo.example</a></li><li>${t('footer.address')}</li><li>${t('hours')}</li></ul></div>
        </div>
        <div class="footer-big" aria-hidden="true">Lirevo</div>
        <div class="footer-bottom"><span>${t('footer.copy', { y: new Date().getFullYear() })}</span><span>${t('footer.love')}</span></div>
      </div>`;
  }

  /* ---------------- toasts ---------------- */
  let toastHost;
  function toast(msg, action) {
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.className = 'toasts';
      toastHost.setAttribute('role', 'status');
      toastHost.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastHost);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${icon('checkCircle')}<p>${esc(msg)}</p>`;
    if (action) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = action.label;
      b.addEventListener('click', () => { action.run(); close(); });
      t.appendChild(b);
    }
    toastHost.appendChild(t);
    while (toastHost.children.length > 3) toastHost.firstChild.remove();
    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      t.classList.add('out');
      setTimeout(() => t.remove(), 300);
    }
    setTimeout(close, action ? 5000 : 3200);
  }

  /* ---------------- cart drawer ---------------- */
  let drawer, overlay, lastFocus;
  function buildDrawer() {
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'drawer-title');
    drawer.innerHTML = `
      <div class="drawer-head"><h2 id="drawer-title">${t('drawer.title')}</h2><button class="icon-btn" type="button" data-close-cart aria-label="${t('drawer.close')}">${icon('x')}</button></div>
      <div class="drawer-body"></div>
      <div class="drawer-foot"></div>`;
    document.body.append(overlay, drawer);
    overlay.addEventListener('click', closeDrawer);
    $('[data-close-cart]', drawer).addEventListener('click', closeDrawer);
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
      if (e.key === 'Tab') trapFocus(e, drawer);
    });
    drawer.addEventListener('click', onLineAction);
  }

  function trapFocus(e, root) {
    const f = $$('a[href], button:not([disabled]), input, select, textarea', root).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function freeShipHTML(sub) {
    const left = D.FREE_SHIPPING - sub;
    const pct = Math.min(1, sub / D.FREE_SHIPPING);
    return `<div class="free-ship">${left > 0 ? `<span>${t('free.left', { sum: fmt(left) })}</span>` : `<span>${t('free.done')}</span>`}<div class="progress" aria-hidden="true"><span style="transform:scaleX(${pct})"></span></div></div>`;
  }

  function renderDrawer() {
    if (!drawer) return;
    const body = $('.drawer-body', drawer), foot = $('.drawer-foot', drawer);
    const lines = Cart.lines();
    if (!lines.length) {
      body.innerHTML = `<div class="empty">${LirevoArt.bouquet(D.PRODUCTS[7].art, { count: 5, seed: 'empty', cls: 'is-in' })}<h3>${t('empty.title')}</h3><p>${t('empty.text')}</p><a class="btn btn--sm" href="catalog.html">${t('empty.cta')} ${icon('arrow')}</a></div>`;
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = lines.map((l) => `
      <div class="mini-line" data-id="${l.id}" data-size="${l.size}">
        <div class="mini-thumb">${thumb(l, 5)}</div>
        <div><h3>${esc(l.p.name)}</h3><p>${l.extra ? t('line.extra') : sizeOf(l.size).name}</p>
          <div class="qty" role="group" aria-label="${t('qty')}">
            <button type="button" data-act="dec" aria-label="${t('dec')}">${icon('minus')}</button><span aria-live="polite">${l.qty}</span><button type="button" data-act="inc" aria-label="${t('inc')}">${icon('plus')}</button>
          </div></div>
        <div class="price-col">${fmt(l.total)}<button class="remove-btn" type="button" data-act="rm">${t('remove')}</button></div>
      </div>`).join('');
    const sub = Cart.subtotal();
    foot.innerHTML = `${freeShipHTML(sub)}<div class="drawer-total"><span>${t('subtotal')}</span><b>${fmt(sub)}</b></div>
      <a class="btn btn--accent btn--block" href="checkout.html"><span class="btn-label">${t('checkout')}</span> ${icon('arrow')}</a>
      <a class="btn btn--ghost btn--block btn--sm" href="cart.html">${t('toCart')}</a>`;
  }

  function onLineAction(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const row = btn.closest('[data-id]');
    const { id, size } = row.dataset;
    const it = Cart.find(id, size);
    if (!it) return;
    if (btn.dataset.act === 'inc') Cart.setQty(id, size, it.qty + 1);
    if (btn.dataset.act === 'dec') Cart.setQty(id, size, it.qty - 1);
    if (btn.dataset.act === 'rm') {
      const snapshot = { ...it };
      Cart.remove(id, size);
      toast(t('toast.removed', { name: byId(id).name }), { label: t('undo'), run: () => Cart.add(snapshot.id, snapshot.size, snapshot.qty) });
    }
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    renderDrawer();
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('[data-close-cart]', drawer).focus(), 50);
  }
  function closeDrawer() {
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  function updateBadge(bump) {
    const n = Cart.count();
    $$('.cart-badge').forEach((b) => {
      b.textContent = n > 99 ? '99+' : n;
      b.classList.toggle('has-items', n > 0);
      if (bump && n > 0) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    });
    $$('[data-open-cart]').forEach((b) => b.setAttribute('aria-label', n ? t('cart.openN', { n }) : t('cart.open')));
  }

  /* ---------------- fly-to-cart ---------------- */
  function flyToCart(fromEl, art, seed) {
    const target = $('[data-open-cart]');
    if (!fromEl || !target || reduceMotion) return Promise.resolve();
    const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    const sx = a.left + a.width / 2 - 32, sy = a.top + a.height / 2 - 32;
    const ex = b.left + b.width / 2 - 32, ey = b.top + b.height / 2 - 32;
    const outer = document.createElement('div');
    outer.className = 'fly';
    outer.innerHTML = `<div class="fly-y"><div class="fly-inner">${art ? LirevoArt.bouquet(art, { count: 5, seed, cls: 'is-in' }) : icon('gift')}</div></div>`;
    document.body.appendChild(outer);
    const inner = outer.firstElementChild;
    const dur = 850;
    // X — линейно, Y — с ускорением: вместе получается дуга
    outer.animate([{ transform: `translateX(${sx}px)` }, { transform: `translateX(${ex}px)` }], { duration: dur, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'forwards' });
    const anim = inner.animate([
      { transform: `translateY(${sy}px) scale(1)`, opacity: 1 },
      { transform: `translateY(${Math.min(sy, ey) - 120}px) scale(.9)`, opacity: 1, offset: 0.35 },
      { transform: `translateY(${ey}px) scale(.3)`, opacity: 0.6 },
    ], { duration: dur, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    return anim.finished.then(() => outer.remove()).catch(() => outer.remove());
  }

  function addToCart(id, size, qty, sourceEl) {
    const p = byId(id);
    Cart.add(id, size, qty);
    flyToCart(sourceEl, isExtra(id) ? null : p.art, id).then(() => updateBadge(true));
    toast(t('toast.added', { name: p.name }), { label: t('open'), run: openDrawer });
  }

  /* ---------------- product card ---------------- */
  const wishes = new Set(store.get('lirevo.wish', []));
  function card(p, opts = {}) {
    const tagCls = p.old ? 'card-tag--sale' : p.tag === 'new' ? 'card-tag--new' : '';
    const tag = p.old ? `−${Math.round((1 - p.price / p.old) * 100)}%` : p.tag ? t(`tag.${p.tag}`) : '';
    const wished = wishes.has(p.id);
    return `
      <article class="card tilt" data-id="${p.id}" data-flip-id="${p.id}" ${opts.reveal ? 'data-reveal' : ''}>
        <div class="card-media" style="--card-tint:${LirevoArt.tint(p.art)}">
          ${tag ? `<span class="card-tag ${tagCls}">${esc(tag)}</span>` : ''}
          ${LirevoArt.bouquet(p.art, { count: 8, seed: p.id })}
        </div>
        <button class="wish ${wished ? '' : ''}" type="button" data-wish aria-pressed="${wished}" aria-label="${wished ? t('wish.remove') : t('wish.add')}: ${esc(p.name)}">${icon('heart')}</button>
        <div class="card-body">
          <p class="card-cat">${catName(p.cat)}</p>
          <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
          <p class="card-meta">${esc(p.meta)}</p>
          <div class="card-foot">
            <div class="price"><b>${fmt(p.price)}</b>${p.old ? `<s>${fmt(p.old)}</s>` : ''}</div>
            <button class="btn-add" type="button" data-quick-add aria-label="${esc(t('card.add', { name: p.name }))}">${icon('plus')}</button>
          </div>
        </div>
      </article>`;
  }

  // делегирование для карточек на любой странице
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-quick-add]');
    if (add) {
      const c = add.closest('[data-id]');
      addToCart(c.dataset.id, c.dataset.size || 'm', 1, c.querySelector('.bouquet') || add);
      add.classList.add('is-done');
      add.innerHTML = icon('check');
      setTimeout(() => { add.classList.remove('is-done'); add.innerHTML = icon('plus'); }, 1400);
      return;
    }
    const w = e.target.closest('[data-wish]');
    if (w) {
      const id = w.closest('[data-id]').dataset.id;
      const on = !wishes.has(id);
      on ? wishes.add(id) : wishes.delete(id);
      store.set('lirevo.wish', [...wishes]);
      w.setAttribute('aria-pressed', String(on));
      w.setAttribute('aria-label', `${on ? t('wish.remove') : t('wish.add')}: ${byId(id).name}`);
      w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop');
      if (on) toast(t('wish.toast'));
      return;
    }
    if (e.target.closest('[data-open-cart]')) { e.preventDefault(); openDrawer(); }
  });

  /* ---------------- motion ---------------- */
  const revealIO = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add(en.target.hasAttribute('data-split') ? 'is-split-in' : 'is-revealed');
      revealIO.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }) : null;

  function splitText(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            outer.className = 'split-word';
            outer.setAttribute('aria-hidden', 'true');
            outer.innerHTML = `<span style="--i:${i++}">${esc(w)}</span>`;
            frag.appendChild(outer);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          n.setAttribute('aria-hidden', 'true');
          walk(n);
        }
      });
    };
    walk(el);
  }

  function reveal(root = document) {
    $$('[data-split]', root).forEach((el) => { splitText(el); revealIO ? revealIO.observe(el) : el.classList.add('is-split-in'); });
    $$('[data-reveal-stagger]', root).forEach((group) => {
      [...group.children].forEach((c, i) => { if (!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal', ''); c.style.setProperty('--rd', `${(i % 8) * 70}ms`); });
    });
    $$('[data-reveal]:not(.is-revealed)', root).forEach((el) => (revealIO ? revealIO.observe(el) : el.classList.add('is-revealed')));
    LirevoArt.observe(root);
    if (finePointer && !reduceMotion) bindTilt(root);
  }

  function bindTilt(root) {
    $$('.tilt:not([data-tilt])', root).forEach((el) => {
      el.dataset.tilt = '1';
      let raf = 0;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => { el.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`; });
      });
      el.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); el.style.transform = ''; });
    });
  }

  function magnetic() {
    if (!finePointer || reduceMotion) return;
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  function counters() {
    $$('[data-count]').forEach((el) => {
      const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
      const suffix = el.dataset.suffix || '';
      const fmtN = (v) => new Intl.NumberFormat(window.I18N.locale, { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v) + suffix;
      if (reduceMotion || !revealIO) { el.textContent = fmtN(to); return; }
      el.textContent = fmtN(0);
      const io = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now(), dur = 1600;
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
          el.textContent = fmtN(to * e);
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      io.observe(el);
    });
  }

  /* ---------------- page transitions ---------------- */
  function curtain() {
    const c = document.createElement('div');
    c.className = 'curtain';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = logoMark.replace('class="logo-mark"', '');
    document.body.appendChild(c);
    if (reduceMotion) return;
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || /^(tel|mailto):/.test(a.getAttribute('href'))) return;
      if (url.pathname === location.pathname && url.hash) return; // якорь на той же странице
      if (url.href === location.href) return;
      e.preventDefault();
      c.classList.add('is-leaving');
      setTimeout(() => { location.href = url.href; }, 520);
    });
    addEventListener('pageshow', (e) => { if (e.persisted) c.classList.remove('is-leaving'); });
  }

  /* ---------------- boot ---------------- */
  document.documentElement.classList.add('js');
  if (!reduceMotion) document.documentElement.classList.add('motion');

  renderHeader();
  renderFooter();
  buildDrawer();
  curtain();
  updateBadge(false);
  document.addEventListener('cart:change', () => { updateBadge(false); if (drawer.classList.contains('is-open')) renderDrawer(); });
  addEventListener('storage', (e) => { if (e.key === 'lirevo.cart') { Cart.items = cleanItems(store.get('lirevo.cart', [])); updateBadge(false); renderDrawer(); } });

  window.Lirevo = {
    D, t, $, $$, fmt, esc, icon, store, Cart, Promo, totals, byId, sizeOf, unitPrice, catName, isExtra,
    card, thumb, toast, addToCart, openDrawer, reveal, magnetic, counters, freeShipHTML, reduceMotion, finePointer,
  };

  // страничные скрипты подключаются после core и вызывают свою инициализацию; общая анимация — после них
  addEventListener('DOMContentLoaded', () => { reveal(); magnetic(); counters(); });
})();

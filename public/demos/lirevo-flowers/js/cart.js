/* Страница корзины: позиции, допродажи, промокод, итог. */
(() => {
  const { D, t, $, $$, fmt, esc, icon, Cart, Promo, totals, sizeOf, thumb, toast, byId, freeShipHTML, addToCart } = window.Lirevo;
  const root = $('#cart-root');

  function summaryHTML() {
    const tt = totals();
    return `
      <aside class="summary" aria-labelledby="sum-title">
        <h2 id="sum-title">${t('sum.title')}</h2>
        ${freeShipHTML(tt.sub - tt.discount)}
        <div class="sum-row"><span>${t('sum.items', { n: Cart.count() })}</span><b>${fmt(tt.sub)}</b></div>
        ${tt.discount ? `<div class="sum-row discount"><span>${t('sum.discount', { code: esc(tt.code) })}</span><b>−${fmt(tt.discount)}</b></div>` : ''}
        <div class="sum-row"><span>${t('sum.delivery')}</span><b>${tt.shipping ? fmt(tt.shipping) : t('free')}</b></div>
        <form class="promo-form" id="promo-form" novalidate>
          <label class="sr-only" for="promo">${t('promo')}</label>
          <input class="input" id="promo" name="promo" placeholder="${t('promo')}" value="${esc(tt.code)}" autocomplete="off" aria-describedby="promo-msg">
          <button class="btn btn--ghost btn--sm" type="submit">${t('apply')}</button>
        </form>
        <p class="promo-msg ${tt.code ? 'ok' : ''}" id="promo-msg" aria-live="polite">${tt.code ? t('promo.ok', { code: esc(tt.code) }) : t('promo.try', { code: 'LIREVO10' })}</p>
        <div class="sum-total"><span>${t('topay')}</span><b>${fmt(tt.total)}</b></div>
        <a class="btn btn--accent btn--block" href="checkout.html" data-magnetic><span class="btn-label">${t('checkout')}</span> ${icon('arrow')}</a>
        <p class="secure">${icon('lock')} ${t('secure')}</p>
      </aside>`;
  }

  function render() {
    const lines = Cart.lines();
    if (!lines.length) {
      root.innerHTML = `<div class="empty">${LirevoArt.bouquet(D.PRODUCTS[5].art, { count: 6, seed: 'empty-cart' })}<h2>${t('cart.empty')}</h2><p>${t('cart.emptyText')}</p><a class="btn" href="catalog.html">${t('cart.toCatalog')} ${icon('arrow')}</a></div>`;
      LirevoArt.observe(root);
      return;
    }
    root.innerHTML = `
      <div class="cart-layout">
        <div>
          <div class="cart-lines" id="lines">
            ${lines.map((l) => `
              <article class="cart-line" data-id="${l.id}" data-size="${l.size}">
                ${l.extra ? `<div class="thumb">${thumb(l)}</div>` : `<a class="thumb" href="product.html?id=${l.id}" aria-label="${esc(l.p.name)}">${thumb(l, 7)}</a>`}
                <div>
                  <h3>${l.extra ? esc(l.p.name) : `<a href="product.html?id=${l.id}">${esc(l.p.name)}</a>`}</h3>
                  <p class="meta">${l.extra ? t('line.extraFull') : `${sizeOf(l.size).name} · ${esc(l.p.meta)}`} · ${t('perUnit', { sum: fmt(l.unit) })}</p>
                  <div class="qty" role="group" aria-label="${esc(t('qtyOf', { name: l.p.name }))}">
                    <button type="button" data-act="dec" aria-label="${t('dec')}">${icon('minus')}</button><span aria-live="polite">${l.qty}</span><button type="button" data-act="inc" aria-label="${t('inc')}">${icon('plus')}</button>
                  </div>
                </div>
                <div class="line-total"><b>${fmt(l.total)}</b><button class="remove-btn" type="button" data-act="rm">${t('remove')}</button></div>
              </article>`).join('')}
          </div>
          <section class="extras" aria-labelledby="ex-title">
            <h2 id="ex-title">${t('extras.title')}</h2>
            <div class="extras-grid">
              ${D.EXTRAS.map((x) => `<div class="extra" data-id="${x.id}"><span class="ic">${icon(x.icon)}</span><div><b>${esc(x.name)}</b>${fmt(x.price)}</div><button class="btn-add" type="button" data-add-extra aria-label="${esc(t('addExtra', { name: x.name }))}">${icon('plus')}</button></div>`).join('')}
            </div>
          </section>
        </div>
        ${summaryHTML()}
      </div>`;
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b) {
      const row = b.closest('[data-id]');
      const { id, size } = row.dataset;
      const it = Cart.find(id, size);
      if (!it) return;
      if (b.dataset.act === 'inc') Cart.setQty(id, size, it.qty + 1);
      if (b.dataset.act === 'dec' && it.qty > 1) Cart.setQty(id, size, it.qty - 1);
      if (b.dataset.act === 'rm' || (b.dataset.act === 'dec' && it.qty === 1)) {
        const snap = { ...it };
        row.classList.add('is-removing');
        setTimeout(() => {
          Cart.remove(id, size);
          toast(t('toast.removed', { name: byId(id).name }), { label: t('undo'), run: () => Cart.add(snap.id, snap.size, snap.qty) });
        }, 380);
      }
    }
    const x = e.target.closest('[data-add-extra]');
    if (x) addToCart(x.closest('[data-id]').dataset.id, 'one', 1, x);
  });

  root.addEventListener('submit', (e) => {
    if (e.target.id !== 'promo-form') return;
    e.preventDefault();
    const code = $('#promo').value.trim().toUpperCase();
    if (!code) { Promo.set(''); render(); return; }
    if (D.PROMOS[code]) {
      Promo.set(code);
      render();
      toast(t('toast.discount', { p: Math.round(D.PROMOS[code] * 100) }));
    } else {
      const msg = $('#promo-msg');
      msg.textContent = t('promo.bad');
      msg.className = 'promo-msg err';
      $('#promo').setAttribute('aria-invalid', 'true');
    }
  });

  // перерисовка не должна терять фокус клавиатуры на кнопках количества
  function rerender() {
    const a = document.activeElement;
    const row = a && a.closest && a.closest('.cart-line');
    const key = row && a.dataset.act ? [row.dataset.id, row.dataset.size, a.dataset.act] : null;
    render();
    if (key) {
      const el = $(`.cart-line[data-id="${key[0]}"][data-size="${key[1]}"] [data-act="${key[2]}"]`, root);
      (el || $('h1')).focus?.();
    }
  }

  document.addEventListener('cart:change', rerender);
  render();
})();

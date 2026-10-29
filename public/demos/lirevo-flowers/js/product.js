/* Карточка товара: выбор размера перерисовывает букет, зум, аккордеон, «купить в 1 клик». */
(() => {
  const { D, t, $, $$, fmt, esc, icon, card, unitPrice, catName, addToCart, Cart } = window.Lirevo;
  const root = $('#pdp-root');
  const id = new URLSearchParams(location.search).get('id');
  const p = D.PRODUCTS.find((x) => x.id === id);

  if (!p) {
    root.innerHTML = `<div class="empty" style="padding-top:var(--s-8)"><h1 class="h-2">${t('nf.title')}</h1><p>${t('nf.text')}</p><a class="btn" href="catalog.html">${t('empty.cta')} ${icon('arrow')}</a></div>`;
    $('#related-wrap').hidden = true;
    return;
  }

  document.title = t('pdp.titleN', { name: p.name });
  let size = 'm', qty = 1;
  const tint = LirevoArt.tint(p.art);
  const tagCls = p.old ? 'card-tag--sale' : p.tag === 'new' ? 'card-tag--new' : '';
  const care = t('care');

  root.innerHTML = `
    <nav aria-label="${t('crumbs')}"><ol class="crumbs"><li><a href="index.html">${t('nav.home')}</a></li><li><a href="catalog.html">${t('nav.catalog')}</a></li><li><a href="catalog.html?cat=${p.cat}">${catName(p.cat)}</a></li><li aria-current="page">${esc(p.name)}</li></ol></nav>
    <div class="pdp">
      <div class="pdp-gallery" data-reveal="scale">
        <div class="pdp-stage" id="stage" style="--tint:${tint}" role="button" tabindex="0" aria-label="${t('zoom')}" aria-pressed="false">
          ${p.tag || p.old ? `<span class="card-tag ${tagCls}">${p.old ? `−${Math.round((1 - p.price / p.old) * 100)}%` : esc(t(`tag.${p.tag}`))}</span>` : ''}
          <div id="stage-art"></div>
        </div>
        <div class="pdp-thumbs" id="thumbs" role="group" aria-label="${t('thumbs')}">
          ${D.SIZES.map((s) => `<button type="button" data-size="${s.id}" aria-pressed="${s.id === size}" aria-label="${esc(t('showSize', { s: s.name }))}" style="background:radial-gradient(circle at 50% 30%, ${tint}, var(--bg-2))">${LirevoArt.bouquet(p.art, { count: s.heads, seed: p.id, cls: 'is-in' })}</button>`).join('')}
        </div>
      </div>

      <div class="pdp-info">
        <div style="display:grid;gap:12px">
          <span class="eyebrow" data-reveal>${catName(p.cat)}</span>
          <h1 data-split>${esc(p.name)}</h1>
        </div>
        <div class="pdp-price" data-reveal aria-live="polite"><b class="price-flip" id="price">${fmt(p.price)}</b>${p.old ? `<s id="old">${fmt(p.old)}</s><span class="save">${t('save', { sum: fmt(p.old - p.price) })}</span>` : ''}</div>
        <p class="lead" data-reveal>${esc(p.desc)}</p>

        <div class="field" data-reveal>
          <span class="label" id="size-label">${t('size.label')}</span>
          <div class="sizes" role="radiogroup" aria-labelledby="size-label" id="sizes">
            ${D.SIZES.map((s) => `<button type="button" class="size-opt" role="radio" data-size="${s.id}" aria-checked="${s.id === size}" tabindex="${s.id === size ? 0 : -1}"><b>${s.name}</b><span>${s.note}</span><em>${fmt(unitPrice(p.id, s.id))}</em></button>`).join('')}
          </div>
        </div>

        <div class="buy-row" data-reveal>
          <div class="qty qty--lg" role="group" aria-label="${t('qty')}">
            <button type="button" data-q="-1" aria-label="${t('dec')}">${icon('minus')}</button>
            <output id="qty" aria-live="polite">1</output>
            <button type="button" data-q="1" aria-label="${t('inc')}">${icon('plus')}</button>
          </div>
          <button class="btn btn--accent" type="button" id="add" data-magnetic><span class="btn-label">${t('addBtn')}<span id="add-sum">${fmt(p.price)}</span></span></button>
          <button class="btn btn--ghost" type="button" id="buy-now">${t('buyNow')}</button>
        </div>

        <div class="perks" data-reveal>
          <div class="perk">${icon('truck')}<span>${t('perk.today', { free: fmt(D.FREE_SHIPPING) })}</span></div>
          <div class="perk">${icon('camera')}<span>${t('perk.photo')}</span></div>
          <div class="perk">${icon('mail')}<span>${t('perk.card')}</span></div>
        </div>

        <div class="accordion" data-reveal>
          ${[
            [t('acc.comp'), `<ul>${p.comp.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`, true],
            [t('acc.care'), `<ul>${care.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`],
            [t('acc.delivery'), `<p>${t('acc.deliveryText')}</p>`],
          ].map(([t, body, open], i) => `
            <div class="acc-item">
              <h3><button class="acc-btn" type="button" aria-expanded="${!!open}" aria-controls="acc-${i}" id="acc-b-${i}">${t}${icon('plus')}</button></h3>
              <div class="acc-panel ${open ? 'is-open' : ''}" id="acc-${i}" role="region" aria-labelledby="acc-b-${i}"><div><div class="inner">${body}</div></div></div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  const stage = $('#stage'), stageArt = $('#stage-art'), priceEl = $('#price'), addSum = $('#add-sum');
  const headsFor = (s) => D.SIZES.find((x) => x.id === s).heads + 2;

  function drawStage() {
    stageArt.innerHTML = LirevoArt.bouquet(p.art, { count: headsFor(size), seed: p.id, label: t('stageLabel', { name: p.name, s: D.SIZES.find((x) => x.id === size).name }) });
    requestAnimationFrame(() => LirevoArt.replay($('.bouquet', stageArt)));
  }

  function updatePrice() {
    const unit = unitPrice(p.id, size);
    priceEl.textContent = fmt(unit);
    priceEl.classList.remove('flip'); void priceEl.offsetWidth; priceEl.classList.add('flip');
    addSum.textContent = fmt(unit * qty);
    const old = $('#old');
    if (old) old.textContent = fmt(Math.round(p.old * D.SIZES.find((x) => x.id === size).mult));
  }

  function setSize(s, focus) {
    if (s === size) return;
    size = s;
    $$('#sizes [role="radio"]').forEach((b) => {
      const on = b.dataset.size === s;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    $$('#thumbs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === s)));
    drawStage();
    updatePrice();
  }

  $('#sizes').addEventListener('click', (e) => { const b = e.target.closest('[data-size]'); if (b) setSize(b.dataset.size); });
  $('#sizes').addEventListener('keydown', (e) => {
    const order = D.SIZES.map((s) => s.id);
    const i = order.indexOf(size);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setSize(order[(i + 1) % order.length], true); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setSize(order[(i - 1 + order.length) % order.length], true); }
  });
  $('#thumbs').addEventListener('click', (e) => { const b = e.target.closest('[data-size]'); if (b) setSize(b.dataset.size); });

  root.addEventListener('click', (e) => {
    const qb = e.target.closest('[data-q]');
    if (qb) {
      qty = Math.max(1, Math.min(99, qty + +qb.dataset.q));
      $('#qty').textContent = qty;
      addSum.textContent = fmt(unitPrice(p.id, size) * qty);
    }
    const acc = e.target.closest('.acc-btn');
    if (acc) {
      const open = acc.getAttribute('aria-expanded') !== 'true';
      acc.setAttribute('aria-expanded', String(open));
      $(`#${acc.getAttribute('aria-controls')}`).classList.toggle('is-open', open);
    }
  });

  $('#add').addEventListener('click', () => addToCart(p.id, size, qty, $('.bouquet', stageArt)));
  $('#buy-now').addEventListener('click', () => { Cart.add(p.id, size, qty); location.href = 'checkout.html'; });

  // зум: клик переключает, курсор задаёт точку увеличения
  const setOrigin = (e) => {
    const r = stage.getBoundingClientRect();
    stage.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    stage.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const toggleZoom = () => {
    const on = !stage.classList.contains('is-zoom');
    stage.classList.toggle('is-zoom', on);
    stage.setAttribute('aria-pressed', String(on));
    stage.style.cursor = on ? 'zoom-out' : 'zoom-in';
  };
  stage.addEventListener('click', (e) => { setOrigin(e); toggleZoom(); });
  stage.addEventListener('pointermove', (e) => { if (stage.classList.contains('is-zoom')) setOrigin(e); });
  stage.addEventListener('pointerleave', () => { if (stage.classList.contains('is-zoom')) toggleZoom(); });
  stage.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleZoom(); } });

  drawStage();

  const related = [...D.PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id), ...D.PRODUCTS.filter((x) => x.cat !== p.cat)].slice(0, 4);
  $('#related').innerHTML = related.map((x) => card(x)).join('');
})();

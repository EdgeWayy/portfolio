/* Каталог: фильтры, поиск, сортировка; перестановка карточек анимируется через GSAP Flip. */
(() => {
  const { D, t, $, $$, card, fmt, esc, reduceMotion } = window.Lirevo;
  const grid = $('#grid'), tabs = $('#tabs'), pill = $('.pill', tabs);
  const q = $('#q'), price = $('#price'), priceOut = $('#price-out'), sort = $('#sort');
  const meta = $('#meta'), empty = $('#empty');
  const useFlip = window.gsap && window.Flip && !reduceMotion;
  if (useFlip) gsap.registerPlugin(Flip);

  const params = new URLSearchParams(location.search);
  const state = {
    cat: D.CATEGORIES.some((c) => c.id === params.get('cat')) ? params.get('cat') : 'all',
    q: params.get('q') || '',
    max: +price.max,
    sort: 'popular',
  };

  // карточки рендерим один раз — дальше только показываем/прячем и переставляем
  grid.innerHTML = D.PRODUCTS.map((p) => card(p)).join('');
  const cards = new Map($$('.card', grid).map((el) => [el.dataset.id, el]));

  tabs.insertAdjacentHTML('beforeend', D.CATEGORIES.map((c) => `<button type="button" data-cat="${c.id}" aria-pressed="${c.id === state.cat}">${esc(c.name)}</button>`).join(''));
  q.value = state.q;

  const movePill = () => {
    const b = $(`[data-cat="${state.cat}"]`, tabs);
    if (!b) return;
    pill.style.width = `${b.offsetWidth}px`;
    pill.style.transform = `translateX(${b.offsetLeft}px)`;
  };

  const norm = (s) => s.toLowerCase().replace(/ё/g, 'е');
  // «популярные» — порядок витрины в data.js
  const rank = new Map(D.PRODUCTS.map((p, i) => [p.id, i]));
  const sorters = {
    popular: (a, b) => rank.get(a.id) - rank.get(b.id),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
  };

  function apply(animate = true) {
    const needle = norm(state.q.trim());
    const list = D.PRODUCTS
      .filter((p) => state.cat === 'all' || p.cat === state.cat)
      .filter((p) => p.price <= state.max)
      .filter((p) => !needle || norm(`${p.name} ${p.meta} ${p.desc} ${p.comp.join(' ')}`).includes(needle))
      .sort(sorters[state.sort]);
    const visible = new Set(list.map((p) => p.id));

    const flipState = animate && useFlip ? Flip.getState($$('.card', grid)) : null;
    cards.forEach((el, id) => { el.hidden = !visible.has(id); });
    list.forEach((p) => grid.appendChild(cards.get(p.id)));

    if (flipState) {
      Flip.from(flipState, {
        duration: 0.6, ease: 'power3.inOut', absolute: true, nested: true, prune: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.15, stagger: 0.04, ease: 'back.out(1.4)' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.3 }),
      });
    }

    meta.textContent = list.length ? t('found', { n: list.length }) : '';
    empty.hidden = list.length > 0;
    priceOut.textContent = fmt(state.max);
    price.style.setProperty('--p', `${((state.max - price.min) / (price.max - price.min)) * 100}%`);
    $$('[data-cat]', tabs).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === state.cat)));
    movePill();

    const u = new URLSearchParams();
    if (state.cat !== 'all') u.set('cat', state.cat);
    if (state.q) u.set('q', state.q);
    history.replaceState(null, '', `${location.pathname}${u.toString() ? `?${u}` : ''}${location.hash}`);
  }

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b || b.dataset.cat === state.cat) return;
    state.cat = b.dataset.cat;
    b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    apply();
  });
  let qt;
  q.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => { state.q = q.value; apply(); }, 220); });
  price.addEventListener('input', () => { state.max = +price.value; apply(); });
  sort.addEventListener('change', () => { state.sort = sort.value; apply(); });
  $('#reset').addEventListener('click', () => {
    Object.assign(state, { cat: 'all', q: '', max: +price.max, sort: 'popular' });
    q.value = ''; price.value = price.max; sort.value = 'popular';
    apply();
  });
  addEventListener('resize', movePill);
  if (document.fonts) document.fonts.ready.then(movePill);

  apply(false);
  if (location.hash === '#search') setTimeout(() => q.focus(), 400);
})();

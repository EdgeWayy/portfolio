/* Главная: hero с падающими лепестками, горизонтальная коллекция, шаги, таймер. */
(() => {
  const { D, t, $, $$, icon, card, esc, fmt, reduceMotion, finePointer } = window.Lirevo;
  const P = D.PRODUCTS;
  const get = (id) => P.find((p) => p.id === id);

  /* ---------- hero bouquet ---------- */
  const heroArt = {
    style: 'paper', wrap: ['#F6E9DC', '#EBD6C1'], ribbon: '#B4475F',
    flowers: [
      { t: 'peony', c: ['#FCE4E8', '#F3AEBB', '#CD627C'] },
      { t: 'rose', c: ['#FFF6EA', '#F2DDC2', '#C99A68'] },
      { t: 'rose', c: ['#FBD6DD', '#EC93A6', '#A8354F'] },
      { t: 'hydrangea', c: ['#F3E6F6', '#D9B8E3', '#9B6AAE'] },
    ],
    fillers: ['eucalyptus', 'gyps'],
    photo: 'img/hero.jpg',
  };
  $('#hero-bouquet').innerHTML = LirevoArt.bouquet(heroArt, { count: 15, seed: 'hero-v2', label: t('hero.art') });

  /* ---------- falling petals ---------- */
  (function petals() {
    const cv = $('.hero-canvas');
    if (!cv || reduceMotion) return;
    const ctx = cv.getContext('2d');
    const colors = ['#F3AEBB', '#EC93A6', '#F9D0D7', '#E8879C', '#FBE1E4', '#F2DDC2'];
    let w = 0, h = 0, dpr = 1, items = [], running = false, raf = 0;
    const make = (initial) => ({
      x: Math.random() * w, y: initial ? Math.random() * h : -20 - Math.random() * 80,
      s: 6 + Math.random() * 9, r: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.04,
      vy: 0.35 + Math.random() * 0.7, sway: Math.random() * Math.PI * 2, sw: 0.4 + Math.random() * 0.8,
      flip: Math.random() * Math.PI * 2, c: colors[(Math.random() * colors.length) | 0], a: 0.45 + Math.random() * 0.45,
    });
    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 700 ? 14 : 30;
      items = Array.from({ length: n }, () => make(true));
    };
    let mx = 0;
    addEventListener('pointermove', (e) => { mx = (e.clientX / innerWidth - 0.5) * 0.8; }, { passive: true });
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of items) {
        p.sway += 0.012; p.flip += 0.03; p.r += p.vr;
        p.y += p.vy; p.x += Math.sin(p.sway) * p.sw + mx;
        if (p.y > h + 20 || p.x < -40 || p.x > w + 40) Object.assign(p, make(false));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.scale(1, Math.cos(p.flip) * 0.6 + 0.4);
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.moveTo(0, -p.s);
        ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.6, p.s * 0.7, p.s * 0.7, 0, p.s);
        ctx.bezierCurveTo(-p.s * 0.7, p.s * 0.7, -p.s * 0.9, -p.s * 0.6, 0, -p.s);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(draw); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    resize();
    addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(cv);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  })();

  /* ---------- hero pointer parallax ---------- */
  if (finePointer && !reduceMotion) {
    const hero = $('.hero');
    const layers = $$('[data-parallax]', hero);
    hero.addEventListener('pointermove', (e) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      layers.forEach((l) => { const k = +l.dataset.parallax; l.style.transform = `translate(${x * k}px, ${y * k}px)`; });
    });
    hero.addEventListener('pointerleave', () => layers.forEach((l) => { l.style.transform = ''; }));
  }

  /* ---------- marquee ---------- */
  const words = t('marquee');
  const chunk = words.map((w) => `<span class="marquee-item">${esc(w)} ${icon('sparkle')}</span>`).join('');
  $('#marquee').innerHTML = chunk + chunk;

  /* ---------- bestsellers ---------- */
  const best = ['rozovyj-rassvet', 'pionovoe-oblako', 'mademuazel', 'vesennij-mix'].map(get);
  $('#best-grid').innerHTML = best.map((p) => card(p)).join('');

  /* ---------- categories ---------- */
  const catArt = { roses: 'alaya-klassika', peonies: 'pionovoe-oblako', tulips: 'vesennij-mix', field: 'solnechnyj-den', exotic: 'belaya-liliya', boxes: 'mademuazel' };
  $('#cats').innerHTML = D.CATEGORIES.filter((c) => c.id !== 'all').map((c) => {
    const p = get(catArt[c.id]);
    const n = P.filter((x) => x.cat === c.id).length;
    return `<a class="cat" href="catalog.html?cat=${c.id}" style="--c:${c.tint}">${LirevoArt.bouquet(p.art, { count: 7, seed: `cat-${c.id}` })}<h3>${esc(c.name)}</h3><p>${t('n.bouquets', { n })} ${icon('arrow')}</p></a>`;
  }).join('');

  /* ---------- horizontal collection ---------- */
  const season = ['korallovyj-sharm', 'provans', 'vanilnoe-oblako', 'tropiki', 'golubaya-mechta', 'solnechnyj-den'].map(get);
  $('#hscroll-track').innerHTML = season.map((p, i) => `
    <article class="hscroll-card" data-id="${p.id}">
      <a class="media" href="product.html?id=${p.id}" style="--tint:${LirevoArt.tint(p.art)}" aria-label="${esc(p.name)}">${LirevoArt.bouquet(p.art, { count: 10, seed: `s-${p.id}` })}</a>
      <div class="info">
        <div><span class="num">№ ${String(i + 1).padStart(2, '0')}</span><h3>${esc(p.name)}</h3><div class="price"><b>${fmt(p.price)}</b></div></div>
        <button class="btn-add" type="button" data-quick-add aria-label="${esc(t('card.add', { name: p.name }))}">${icon('plus')}</button>
      </div>
    </article>`).join('');

  /* ---------- features ---------- */
  const feats = ['leaf', 'camera', 'truck', 'shield'].map((ic, i) => [ic, ...t('feats')[i]]);
  $('#features').innerHTML = feats.map(([ic, t, d]) => `<article class="feature"><span class="ic">${icon(ic)}</span><h3>${t}</h3><p>${d}</p></article>`).join('');

  /* ---------- steps ---------- */
  const steps = ['bag', 'scissors', 'camera', 'gift'].map((ic, i) => [ic, ...t('steps')[i]]);
  $('#steps-lead').textContent = t('steps.lead', { free: fmt(D.FREE_SHIPPING), exp: fmt(D.EXPRESS) });
  $('#steps').innerHTML = steps.map(([ic, t, d], i) => `<li class="step" data-reveal style="--rd:${i * 90}ms"><span class="step-ic">${icon(ic)}</span><h3>${t}</h3><p>${d}</p></li>`).join('');

  /* ---------- promo ---------- */
  $('#promo-art').innerHTML = LirevoArt.bouquet(get('alaya-klassika').art, { count: 12, seed: 'promo' });
  (function countdown() {
    const el = $('#countdown');
    const H = $('[data-h]', el), M = $('[data-m]', el), S = $('[data-s]', el);
    const lead = $('#promo-lead');
    const tick = () => {
      const now = new Date();
      const cutoff = new Date(now); cutoff.setHours(20, 0, 0, 0);
      const today = now < cutoff;
      if (!today) cutoff.setDate(cutoff.getDate() + 1);
      lead.firstChild.textContent = t(today ? 'promo.today' : 'promo.tomorrow');
      let d = Math.max(0, Math.floor((cutoff - now) / 1000));
      const h = Math.floor(d / 3600); d %= 3600;
      H.textContent = String(h).padStart(2, '0');
      M.textContent = String(Math.floor(d / 60)).padStart(2, '0');
      S.textContent = String(d % 60).padStart(2, '0');
    };
    tick();
    setInterval(tick, 1000);
  })();

  /* ---------- GSAP: pinned horizontal scroll + scrubbed steps ---------- */
  const stepEls = () => $$('.step');
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const track = $('#hscroll-track');
      const dist = () => track.scrollWidth - innerWidth;
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '#hscroll', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true,
          onUpdate: (st) => gsap.set('#hscroll-bar', { scaleX: st.progress }),
        },
      });
      $$('.hscroll-card .bouquet').forEach((b) => b.classList.add('is-in'));
    });
    gsap.fromTo('#steps-line', { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: {
        trigger: '#steps', start: 'top 75%', end: 'bottom 55%', scrub: 0.6,
        onUpdate: (st) => stepEls().forEach((s, i) => s.classList.toggle('is-active', st.progress >= i / (steps.length - 1) - 0.02)),
      },
    });
    gsap.to('#hero-scroll', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-copy', { yPercent: -10, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center top', end: 'bottom top', scrub: true } });
  } else {
    stepEls().forEach((s) => s.classList.add('is-active'));
    const line = $('#steps-line');
    if (line) line.style.transform = 'scaleX(1)';
  }
})();

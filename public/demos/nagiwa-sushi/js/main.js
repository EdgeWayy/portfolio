/* Nagiwa — interactions. Texts live in js/i18n.js. */
(function () {
  'use strict';

  var I18N = window.I18N;
  var MENU = window.MENU;
  var LANGS = ['uz', 'ru', 'en'];
  var STORAGE_KEY = 'nagiwa-lang';

  var root = document.documentElement;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  var state = {
    lang: 'uz',
    category: 'rolls'
  };

  /* ---------- Helpers ---------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function lookup(dict, key) {
    return key.split('.').reduce(function (obj, part) {
      return obj != null ? obj[part] : undefined;
    }, dict);
  }

  function t(key) {
    var value = lookup(I18N[state.lang], key);
    if (value == null) value = lookup(I18N.en, key);
    return value == null ? '' : value;
  }

  function formatPrice(n) {
    return '$' + Number(n).toFixed(2);
  }

  function motionOK() {
    return hasGsap && !reducedMotion.matches;
  }

  function storageGet() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function storageSet(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* storage blocked: keep in memory only */ }
  }

  function detectLang() {
    var saved = storageGet();
    if (LANGS.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || '').slice(0, 2).toLowerCase();
    return LANGS.indexOf(nav) !== -1 ? nav : 'uz';
  }

  /* ---------- i18n ---------- */

  function applyTranslations() {
    root.lang = state.lang;

    document.title = t('meta.title');
    var desc = t('meta.description');
    $('meta[name="description"]').setAttribute('content', desc);
    $('meta[property="og:title"]').setAttribute('content', t('meta.title'));
    $('meta[property="og:description"]').setAttribute('content', desc);

    $$('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    $$('[data-i18n-alt]').forEach(function (el) {
      el.setAttribute('alt', t(el.getAttribute('data-i18n-alt')));
    });
    $$('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });

    $$('.lang__btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === state.lang));
    });

    updateBurgerLabel();
  }

  function setLang(lang) {
    if (LANGS.indexOf(lang) === -1) return;
    state.lang = lang;
    storageSet(lang);
    applyTranslations();
    renderMenu(false);
    updateLightboxCaption();
    if (hasScrollTrigger) ScrollTrigger.refresh();
  }

  $$('.lang__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setLang(btn.getAttribute('data-lang'));
    });
  });

  /* ---------- Header & mobile nav ---------- */

  var header = $('#header');
  var nav = $('#nav');
  var burger = $('#burger');

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function updateBurgerLabel() {
    var open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-label', t(open ? 'a11y.menuClose' : 'a11y.menuOpen'));
  }

  function setNav(open) {
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    header.classList.toggle('is-nav-open', open);
    updateBurgerLabel();
  }

  burger.addEventListener('click', function () {
    setNav(burger.getAttribute('aria-expanded') !== 'true');
  });

  $$('.nav__link').forEach(function (link) {
    link.addEventListener('click', function () { setNav(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setNav(false);
      burger.focus();
    }
  });

  window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
    if (mq.matches) setNav(false);
  });

  /* ---------- Menu ---------- */

  var menuPanel = $('#menu-panel');
  var tabs = $$('.tabs__btn');

  function dishCard(dish) {
    var text = dish[state.lang] || dish.en;

    var li = document.createElement('article');
    li.className = 'dish';

    var media = document.createElement('div');
    media.className = 'dish__media';
    var img = document.createElement('img');
    img.src = 'images/' + dish.img;
    img.alt = text.name;
    img.width = 900;
    img.height = 600;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.appendChild(img);

    if (dish.pcs) {
      var pcs = document.createElement('span');
      pcs.className = 'dish__pcs';
      pcs.textContent = dish.pcs + ' ' + t('menu.pcs');
      media.appendChild(pcs);
    }

    var body = document.createElement('div');
    body.className = 'dish__body';

    var head = document.createElement('div');
    head.className = 'dish__head';
    var name = document.createElement('h3');
    name.className = 'dish__name';
    name.textContent = text.name;
    var dots = document.createElement('span');
    dots.className = 'dish__dots';
    dots.setAttribute('aria-hidden', 'true');
    var price = document.createElement('p');
    price.className = 'dish__price';
    price.textContent = formatPrice(dish.price);
    head.appendChild(name);
    head.appendChild(dots);
    head.appendChild(price);

    var desc = document.createElement('p');
    desc.className = 'dish__desc';
    desc.textContent = text.desc;

    body.appendChild(head);
    body.appendChild(desc);
    li.appendChild(media);
    li.appendChild(body);
    return li;
  }

  function renderMenu(animate) {
    var items = MENU[state.category] || [];
    var frag = document.createDocumentFragment();
    items.forEach(function (dish) { frag.appendChild(dishCard(dish)); });
    menuPanel.replaceChildren(frag);

    if (animate && motionOK()) {
      gsap.fromTo(menuPanel.children,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
    }
  }

  function selectTab(tab, focus) {
    tabs.forEach(function (btn) {
      var selected = btn === tab;
      btn.setAttribute('aria-selected', String(selected));
      btn.tabIndex = selected ? 0 : -1;
    });
    menuPanel.setAttribute('aria-labelledby', tab.id);
    state.category = tab.getAttribute('data-cat');
    renderMenu(true);
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    if (hasScrollTrigger) ScrollTrigger.refresh();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      if (tab.getAttribute('aria-selected') !== 'true') selectTab(tab, false);
    });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        selectTab(next, true);
      }
    });
  });

  /* ---------- Gallery lightbox ---------- */

  var lightbox = $('#lightbox');
  var lbImg = $('#lb-img');
  var lbCaption = $('#lb-caption');
  var galleryBtns = $$('.gallery__btn');
  var lbIndex = 0;
  var lbReturnFocus = null;

  function showImage(index) {
    lbIndex = (index + galleryBtns.length) % galleryBtns.length;
    var btn = galleryBtns[lbIndex];
    lbImg.src = btn.getAttribute('data-full');
    updateLightboxCaption();
  }

  function updateLightboxCaption() {
    if (lightbox.hidden) return;
    var alt = $('img', galleryBtns[lbIndex]).getAttribute('alt') || '';
    lbImg.alt = alt;
    lbCaption.textContent = alt;
  }

  function openLightbox(index) {
    lbReturnFocus = document.activeElement;
    lightbox.hidden = false;
    showImage(index);
    document.body.classList.add('is-locked');
    requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
    $('#lb-close').focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    window.setTimeout(function () {
      lightbox.hidden = true;
      lbImg.removeAttribute('src');
    }, reducedMotion.matches ? 0 : 300);
    if (lbReturnFocus) lbReturnFocus.focus();
  }

  galleryBtns.forEach(function (btn, i) {
    btn.addEventListener('click', function () { openLightbox(i); });
  });

  $('#lb-close').addEventListener('click', closeLightbox);
  $('#lb-prev').addEventListener('click', function () { showImage(lbIndex - 1); });
  $('#lb-next').addEventListener('click', function () { showImage(lbIndex + 1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  lightbox.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') showImage(lbIndex - 1);
    else if (e.key === 'ArrowRight') showImage(lbIndex + 1);
    else if (e.key === 'Tab') {
      // keep focus inside the dialog
      var focusables = $$('button', lightbox);
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Animations ---------- */

  var heroIntro = null;

  function setupAnimations() {
    if (!hasGsap) return;

    var mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', function () {
      // Hero intro (played when the preloader leaves)
      heroIntro = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } })
        .from('.hero__img', { scale: 1.12, duration: 2.2, ease: 'power2.out' }, 0)
        .from('.hero__title .line__inner', { yPercent: 115, duration: 1.3, stagger: 0.12 }, 0.1)
        .from('.hero__eyebrow', { autoAlpha: 0, y: 16, duration: 0.9 }, 0.35)
        .from('.hero__tagline', { autoAlpha: 0, y: 20, duration: 0.9 }, 0.5)
        .from('.hero__cta > *', { autoAlpha: 0, y: 20, duration: 0.9, stagger: 0.08 }, 0.6)
        .from('.hero__kanji, .hero__scroll', { autoAlpha: 0, duration: 1.2 }, 0.8);

      if (!hasScrollTrigger) return;

      // Light parallax on the hero photo
      gsap.to('.hero__media', {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });

      // Section reveals: fade + slide up
      gsap.set('[data-reveal]', { autoAlpha: 0, y: 48 });
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: function (els) {
          gsap.fromTo(els,
            { autoAlpha: 0, y: 48 },
            { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out', overwrite: true });
        }
      });

      // Dish cards on first view
      ScrollTrigger.create({
        trigger: menuPanel,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.fromTo(menuPanel.children,
            { autoAlpha: 0, y: 32 },
            { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
        }
      });

      return function () { heroIntro = null; };
    });
  }

  /* ---------- Preloader ---------- */

  function hidePreloader() {
    var pre = $('#preloader');
    if (!pre || pre.classList.contains('is-done')) return;
    pre.classList.add('is-done');
    document.body.classList.remove('is-loading');
    if (heroIntro) heroIntro.play();
    window.setTimeout(function () { pre.remove(); }, 800);
  }

  function initPreloader() {
    var minTime = reducedMotion.matches ? 0 : 900;
    var started = Date.now();
    var done = function () {
      window.setTimeout(hidePreloader, Math.max(0, minTime - (Date.now() - started)));
    };
    if (document.readyState === 'complete') done();
    else window.addEventListener('load', done);
    window.setTimeout(hidePreloader, 3500); // safety net for slow networks
  }

  /* ---------- Init ---------- */

  $('#year').textContent = String(new Date().getFullYear());
  state.lang = detectLang();
  applyTranslations();
  renderMenu(false);
  setupAnimations();
  initPreloader();
})();

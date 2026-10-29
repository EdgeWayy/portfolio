/* =========================================================================
 * Lumina Mall — behaviour shared by every page
 * Loader, theme toggle, language switcher, icons, page transitions, footer,
 * button micro-interactions, header state, lite-mode switch.
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = global.Mall;
  const CFG = global.MALL_CONFIG;
  const { h, s, $, $$ } = Mall.dom;
  const t = Mall.t;
  const root = document.documentElement;

  /* ------------------------------------------------------------ theme */
  function setTheme(theme, { save = true } = {}) {
    root.classList.add('theme-anim');
    root.setAttribute('data-theme', theme);
    if (save) { try { localStorage.setItem(CFG.STORAGE_PREFIX + 'theme', theme); } catch (e) { /* ignore */ } }
    syncThemeButtons();
    document.dispatchEvent(new CustomEvent('mall:theme', { detail: { theme } }));
    clearTimeout(setTheme.t);
    setTheme.t = setTimeout(() => root.classList.remove('theme-anim'), 900);
  }

  function syncThemeButtons() {
    const night = root.getAttribute('data-theme') === 'dark';
    for (const btn of $$('[data-theme-toggle]')) {
      btn.setAttribute('aria-pressed', String(night));
      btn.setAttribute('aria-label', night ? t('theme.toDay') : t('theme.toNight'));
      btn.title = night ? t('theme.toDay') : t('theme.toNight');
    }
  }

  function buildThemeButton(btn) {
    if (btn.dataset.ready) return;
    btn.dataset.ready = '1';
    btn.classList.add('theme-toggle');
    btn.append(
      h('span', { class: 'theme-icons', 'aria-hidden': 'true' },
        h('span', { class: 'ti ti-sun' }, Mall.icon('sun', { size: 18 })),
        h('span', { class: 'ti ti-moon' }, Mall.icon('moon', { size: 18 }))
      )
    );
    btn.addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
  }

  /* -------------------------------------------------- language switch
   * A three-button pill (RU · UZ · EN) with a sliding thumb. */
  function buildLangSwitch(host) {
    if (host.dataset.ready) return;
    host.dataset.ready = '1';
    host.classList.add('lang-switch');
    host.setAttribute('role', 'radiogroup');
    const thumb = h('span', { class: 'lang-thumb', 'aria-hidden': 'true' });
    host.appendChild(thumb);
    Mall.i18n.LANGS.forEach((lang) => {
      const b = h('button', { type: 'button', role: 'radio', 'data-lang': lang, lang: lang === 'uz' ? 'uz-Latn' : lang }, lang.toUpperCase());
      b.addEventListener('click', () => Mall.i18n.set(lang));
      host.appendChild(b);
    });
    host.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const L = Mall.i18n.LANGS;
      const next = L[(L.indexOf(Mall.i18n.lang) + (e.key === 'ArrowRight' ? 1 : L.length - 1)) % L.length];
      Mall.i18n.set(next);
      requestAnimationFrame(() => { const b = host.querySelector(`[data-lang="${next}"]`); if (b) b.focus(); });
    });
    syncLangSwitches();
  }

  function syncLangSwitches() {
    const lang = Mall.i18n.lang;
    for (const host of $$('[data-lang-switch]')) {
      host.setAttribute('aria-label', t('lang.label'));
      host.style.setProperty('--idx', String(Mall.i18n.LANGS.indexOf(lang)));
      for (const b of $$('[data-lang]', host)) {
        const on = b.dataset.lang === lang;
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
        b.title = t('lang.' + b.dataset.lang);
      }
    }
  }

  /* ----------------------------------------------------------- loader */
  function hideLoader({ minTime = 0 } = {}) {
    const loader = $('#loader');
    if (!loader) return Promise.resolve();
    const started = global.__loaderStart || performance.now();
    const wait = Math.max(0, minTime - (performance.now() - started));
    return new Promise((resolve) => {
      setTimeout(() => {
        loader.classList.add('is-done');
        const finish = () => { loader.remove(); resolve(); };
        if (Mall.motion.reduced) finish();
        else setTimeout(finish, 520);
      }, wait);
    });
  }

  /* ----------------------------------------------- page transitions */
  function wireLinks() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-transition]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
      const url = a.getAttribute('href');
      if (!url || url.startsWith('#')) return;
      e.preventDefault();
      Mall.go(url);
    });
  }

  /* -------------------------------------------- button micro-interaction
   * Buttons get a soft highlight that follows the pointer. This only writes two
   * CSS variables (no class toggling, no animation restart), so it is safe to
   * run on every pointermove (see the hover rules in js/atrium.js). */
  function wireButtonGlow() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let raf = 0, lastEvent = null;
    document.addEventListener('pointermove', (e) => {
      lastEvent = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const btn = lastEvent.target.closest && lastEvent.target.closest('.btn');
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', `${lastEvent.clientX - r.left}px`);
        btn.style.setProperty('--my', `${lastEvent.clientY - r.top}px`);
      });
    }, { passive: true });
  }

  /* ----------------------------------------------------- header state */
  function wireHeader() {
    const bar = $('.topbar');
    if (!bar) return;
    let ticking = false;
    const update = () => { bar.classList.toggle('is-scrolled', global.scrollY > 8); ticking = false; };
    global.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ----------------------------------------------------------- footer */
  function brandMark() {
    return s('svg', { class: 'brand-mark', viewBox: '0 0 40 40', 'aria-hidden': 'true' },
      s('rect', { class: 'bm-bg', x: 1, y: 1, width: 38, height: 38, rx: 12 }),
      s('path', { class: 'bm-arch', d: 'M12 30V20a8 8 0 0 1 16 0v10' }),
      s('path', { class: 'bm-floor', d: 'M9 30h22' }),
      s('circle', { class: 'bm-sun', cx: 20, cy: 10.5, r: 2.6 })
    );
  }
  Mall.brandMark = brandMark;

  function renderFooter() {
    const host = $('#site-footer');
    if (!host) return;
    const M = CFG.MALL;
    Mall.dom.clear(host);
    const liteOn = root.classList.contains('lite');
    const liteBtn = h('button', { class: 'link-btn', type: 'button', 'aria-pressed': String(liteOn) }, t(liteOn ? 'lite.on' : 'lite.off'));
    liteBtn.addEventListener('click', () => {
      const next = !root.classList.contains('lite');
      root.classList.toggle('lite', next);
      try { localStorage.setItem(CFG.STORAGE_PREFIX + 'lite', next ? '1' : '0'); } catch (e) { /* ignore */ }
      liteBtn.textContent = t(next ? 'lite.on' : 'lite.off');
      liteBtn.setAttribute('aria-pressed', String(next));
      Mall.toast(t(next ? 'lite.toastOn' : 'lite.toastOff'), 'info');
      document.dispatchEvent(new CustomEvent('mall:lite', { detail: { lite: next } }));
    });

    host.classList.add('footer');
    host.append(
      h('div', { class: 'container footer-grid' },
        h('div', { class: 'footer-brand' },
          h('a', { class: 'brand', href: 'index.html', 'data-transition': true, 'aria-label': t('nav.home') }, brandMark(), h('span', { class: 'brand-text' }, h('span', { class: 'brand-name' }, 'Lumina'), h('span', { class: 'brand-sub' }, t('app.sub')))),
          h('p', null, t('mall.tagline')),
          h('span', { class: 'pill pill-trial' }, Mall.icon('sparkles', { size: 14 }), t('app.trialData'))
        ),
        h('nav', { class: 'footer-col', 'aria-label': t('footer.explore') },
          h('h3', null, t('footer.explore')),
          h('a', { href: 'index.html', 'data-transition': true }, t('nav.atrium')),
          h('a', { href: 'mall.html', 'data-transition': true }, t('nav.directory')),
          h('a', { href: 'index.html#about' }, t('nav.about')),
          h('a', { href: 'index.html#contact' }, t('nav.contact'))
        ),
        h('div', { class: 'footer-col' },
          h('h3', null, t('footer.visit')),
          h('span', { class: 'footer-line' }, Mall.icon('pin', { size: 16 }), t('mall.address')),
          h('span', { class: 'footer-line' }, Mall.icon('clock', { size: 16 }), t('mall.hours')),
          h('a', { class: 'footer-line', href: `tel:${M.phone.replace(/[^+\d]/g, '')}` }, Mall.icon('phone', { size: 16 }), M.phone),
          h('a', { class: 'footer-line', href: `mailto:${M.email}` }, Mall.icon('mail', { size: 16 }), M.email)
        )
      ),
      h('div', { class: 'container footer-bottom' },
        h('span', null, t('footer.rights', { year: M.year }), ' · ', h('a', { href: 'assets/CREDITS.md', class: 'footer-credit' }, t('footer.photos'))),
        h('span', { class: 'footer-bottom-links' }, liteBtn, h('a', { href: 'admin.html', rel: 'nofollow' }, t('nav.owner')))
      )
    );
  }

  /* ------------------------------------------------------------- boot */
  function init({ loaderMinTime = 260 } = {}) {
    Mall.i18n.apply();
    Mall.hydrateIcons();
    $$('[data-theme-toggle]').forEach(buildThemeButton);
    $$('[data-lang-switch]').forEach(buildLangSwitch);
    syncThemeButtons();
    wireLinks();
    wireButtonGlow();
    wireHeader();
    renderFooter();
    if (Mall.cart) Mall.cart.init();
    Mall.reveal($$('[data-reveal]'));
    Mall.initCounters();
    // Language change: shared parts re-render here, pages listen to 'mall:lang' for theirs.
    Mall.i18n.onChange(() => {
      syncThemeButtons();
      syncLangSwitches();
      renderFooter();
      if (Mall.cart) Mall.cart.refresh();
      for (const el of $$('[data-count]')) if (el.dataset.count) el.textContent = (el.dataset.prefix || '') + Mall.formatNumber(el.dataset.count) + (el.dataset.suffix || '');
    });
    return hideLoader({ minTime: loaderMinTime });
  }

  Mall.page = { init, setTheme, hideLoader };
})(window);

/* =========================================================================
 * Lumina Mall — admin panel (admin.html)
 * Login, dashboard, store editor (3 languages, floor + slot, cover & logo
 * photos), product manager (3 languages, up to 6 photos with cover and
 * reordering), export / import / reset. All texts go through Mall.t().
 *
 * Routes (hash based, so deep links work when opened from disk):
 *   #/dashboard   #/stores   #/stores/new   #/stores/<id>
 *   #/products    #/products/<storeId>      #/data
 *
 * BACKEND / SELLER ACCOUNTS: with real auth, a seller would only see
 * #/stores/<their id> and #/products/<their id>. Filter the lists by the
 * logged-in user's store (and rely on RLS on the server to enforce it).
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = global.Mall;
  const CFG = global.MALL_CONFIG;
  const S = Mall.storage;
  const { h, $, $$ } = Mall.dom;
  const t = Mall.t;
  const L = Mall.L;
  const LANGS = Mall.i18n.LANGS;
  const IMG = Mall.images;

  const EMOJIS = ['🛍️', '👗', '👟', '👜', '💻', '📱', '🎧', '💄', '💍', '🌸', '📚', '🧸', '🎮', '⚽', '🍜', '☕', '🍕', '💊', '🛋️', '👓', '🧴', '🎁'];
  const COLORS = ['#c2547a', '#d9779a', '#b76e79', '#e5483f', '#e88b73', '#f08c2e', '#c9a227', '#8a5a3c', '#c46a4a', '#a46fc4', '#7a48d6', '#4b5bb7', '#3b6fd8', '#2e4a7d', '#1f2a4d', '#5a9fe0'];

  const state = {
    dirty: false,
    ignoreNextHash: false,
    currentHash: '',
    cleanup: [],          // functions to run when leaving a view
    editor: null,         // store editor draft, kept across language re-renders
    editorKeep: false,    // true while re-rendering for a language change
  };

  /** Translate an error coming from storage/imageStore (they carry an i18n key). */
  const errText = (e) => (e && e.i18nKey ? t(e.i18nKey, e.vars) : (e && e.message) || t('err.generic'));

  /* ================================================================ boot */
  function boot() {
    Mall.page.init();
    if (Mall.auth.isAuthenticated()) showApp();
    else showLogin();
    Mall.i18n.onChange(() => {
      if (!$('#appView').hidden) rerenderForLanguage();
      else if (loginMsgKey) $('#loginMsg').textContent = t(loginMsgKey.key, loginMsgKey.vars);
    });
  }

  /* =============================================================== login */
  let loginMsgKey = null;
  function setLoginMsg(key, vars) {
    loginMsgKey = key ? { key, vars } : null;
    $('#loginMsg').textContent = key ? t(key, vars) : '';
  }

  function showLogin(messageKey) {
    $('#appView').hidden = true;
    const view = $('#loginView');
    view.hidden = false;
    const form = $('#loginForm');
    const input = $('#password');
    const btn = $('#loginBtn');
    setLoginMsg(messageKey || null);
    input.value = '';
    setTimeout(() => input.focus(), 60);

    let timer = 0;
    const showLock = () => {
      clearInterval(timer);
      const tick = () => {
        const left = Mall.auth.lockRemaining();
        if (left <= 0) { clearInterval(timer); btn.disabled = false; input.disabled = false; setLoginMsg(null); return; }
        btn.disabled = true;
        input.disabled = true;
        const m = Math.floor(left / 60), sec = left % 60;
        setLoginMsg('login.locked', { t: `${m ? `${m}:` : ''}${m ? String(sec).padStart(2, '0') : sec}${m ? '' : ' s'}` });
      };
      tick();
      timer = setInterval(tick, 1000);
    };
    if (Mall.auth.lockRemaining() > 0) showLock();

    if (!form.dataset.wired) {
      form.dataset.wired = '1';
      $('#togglePw').addEventListener('click', (e) => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        const b = e.currentTarget;
        b.setAttribute('aria-pressed', String(show));
        b.setAttribute('aria-label', t(show ? 'login.hide' : 'login.show'));
        Mall.dom.clear(b).appendChild(Mall.icon(show ? 'eye-off' : 'eye', { size: 18 }));
      });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (btn.disabled) return;
        btn.classList.add('is-loading');
        btn.disabled = true;
        const res = await Mall.auth.login(input.value);
        btn.classList.remove('is-loading');
        btn.disabled = false;
        if (res.ok) { setLoginMsg(null); view.hidden = true; showApp(true); return; }
        input.setAttribute('aria-invalid', 'true');
        Mall.motion.animate($('.login-card'), [
          { transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(9px)' },
          { transform: 'translateX(-6px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' },
        ], { duration: 420, easing: 'ease-out' });
        if (res.reason === 'locked') showLock();
        else setLoginMsg('login.wrong', { n: res.left });
        input.select();
      });
      input.addEventListener('input', () => input.removeAttribute('aria-invalid'));
    }
  }

  /* ================================================================= app */
  let appWired = false;
  function showApp(justLoggedIn) {
    $('#loginView').hidden = true;
    $('#appView').hidden = false;
    if (!appWired) { appWired = true; wireShell(); }
    if (!location.hash || location.hash === '#') location.replace('#/dashboard');
    route();
    if (justLoggedIn) {
      Mall.toast(t('admin.welcome'), 'success');
      if (Mall.auth.usesDefaultPassword()) setTimeout(() => Mall.toast(t('admin.defaultPw'), 'warning', { duration: 8000 }), 600);
      Mall.imageStore.isPersistent().then((ok) => { if (!ok) Mall.toast(t('img.idbOff'), 'warning', { duration: 8000 }); });
    }
  }

  function wireShell() {
    global.addEventListener('hashchange', onHashChange);
    $('#logoutBtn').addEventListener('click', async () => {
      if (state.dirty && !(await Mall.confirm({ title: t('unsaved.logoutT'), message: t('unsaved.leaveD'), confirmLabel: t('unsaved.logoutBtn'), danger: true }))) return;
      state.dirty = false;
      state.editor = null;
      Mall.auth.logout();
      runCleanup();
      Mall.toast(t('admin.loggedOut'), 'info');
      showLogin();
    });

    const sidebar = $('#sidebar'), scrim = $('#sidebarScrim'), menuBtn = $('#menuBtn');
    const setMenu = (open) => {
      sidebar.classList.toggle('is-open', open);
      scrim.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', () => setMenu(!sidebar.classList.contains('is-open')));
    scrim.addEventListener('click', () => setMenu(false));
    sidebar.addEventListener('click', (e) => { if (e.target.closest('a[data-nav]')) setMenu(false); });

    ['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, () => Mall.auth.touch(), { passive: true }));
    setInterval(() => {
      if (!$('#appView').hidden && !Mall.auth.isAuthenticated()) {
        state.dirty = false;
        state.editor = null;
        runCleanup();
        showLogin('login.expired');
      }
    }, 20000);
    global.addEventListener('beforeunload', (e) => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });
    // Another tab changed the data: refresh lists (never clobber an open form).
    S.onChange((type) => { if (type === 'data' && !state.dirty) route({ quiet: true }); });
  }

  async function onHashChange() {
    if (state.ignoreNextHash) { state.ignoreNextHash = false; return; }
    if (state.dirty) {
      const ok = await Mall.confirm({ title: t('unsaved.leaveT'), message: t('unsaved.leaveD'), confirmLabel: t('unsaved.leaveBtn'), danger: true });
      if (!ok) { state.ignoreNextHash = true; location.hash = state.currentHash; return; }
      state.dirty = false;
    }
    state.editor = null;
    route();
  }

  function runCleanup() {
    state.cleanup.forEach((fn) => { try { fn(); } catch (e) { Mall.log(e); } });
    state.cleanup = [];
  }

  /** Language changed: re-render the current view, keeping any unsaved store draft. */
  function rerenderForLanguage() {
    const keepDirty = state.dirty;
    // This re-render must not roll back photos uploaded in an open store editor.
    state.editorKeep = true;
    route({ quiet: true, keepEditor: true }).finally(() => { state.editorKeep = false; state.dirty = keepDirty; });
    state.dirty = keepDirty;
    if (openProductForm.current) openProductForm.current.relabel();
  }

  async function route({ quiet = false, keepEditor = false } = {}) {
    if (!Mall.auth.isAuthenticated()) { showLogin('login.please'); return; }
    runCleanup();
    if (!keepEditor) state.editor = null;
    state.currentHash = location.hash;
    const [, section = 'dashboard', param] = (location.hash.replace(/^#\/?/, '') || 'dashboard').match(/^([a-z]+)(?:\/([a-z0-9-]+))?/) || [];
    const views = { dashboard: viewDashboard, stores: viewStores, products: viewProducts, data: viewData };
    const fn = views[section] || viewDashboard;
    $$('.side-nav a').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === section));
    const host = Mall.dom.clear($('#view'));
    await fn(host, param);
    if (!quiet) {
      $('#view').focus({ preventScroll: true });
      global.scrollTo(0, 0);
      Mall.motion.animate(host, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: Mall.motion.ease.out });
    }
  }

  function setTitle(text) {
    $('#viewTitle').textContent = text;
    document.title = `${text} · ${t('admin.titleSuffix')}`;
  }

  function viewHead(title, subtitle, ...actions) {
    setTitle(title);
    return h('div', { class: 'view-head' },
      h('div', null, h('h2', { class: 'view-title' }, title), subtitle ? h('p', { class: 'muted' }, subtitle) : null),
      h('div', { class: 'row' }, actions));
  }

  function thumb(ref, emoji, color) {
    const el = h('span', { class: 'thumb img-box', style: { '--c': color || '#c9a227' } }, h('span', { 'aria-hidden': 'true' }, emoji || '🛍️'));
    if (ref) { const img = h('img', { alt: '', decoding: 'async' }); el.appendChild(img); IMG.bind(img, ref, 'thumb'); }
    return el;
  }

  /* ========================================================== DASHBOARD */
  async function viewDashboard(host) {
    const [stats, stores, products, photoStats] = await Promise.all([S.getStats(), S.getStores(), S.getAllProducts(), Mall.imageStore.stats()]);
    const usage = S.usage();
    const pctStock = stats.products ? Math.round((stats.inStock / stats.products) * 100) : 0;
    const kpi = (icon, label, value, suffix, tone) => h('div', { class: ['card', 'kpi', tone && `kpi-${tone}`] },
      h('span', { class: 'kpi-icon' }, Mall.icon(icon, { size: 20 })),
      h('span', { class: 'kpi-label' }, label),
      h('strong', { class: 'kpi-value', 'data-count': String(value), 'data-suffix': suffix || '' }, '0'));

    const catEntries = Object.entries(stats.categories).sort((a, b) => b[1] - a[1]);
    const maxCat = Math.max(1, ...catEntries.map((c) => c[1]));
    const recent = products.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
    const storeById = new Map(stores.map((st) => [st.id, st]));

    host.append(
      viewHead(t('nav.dashboard'), t('dash.subtitle'), h('a', { class: 'btn btn-primary', href: '#/stores/new' }, Mall.icon('plus', { size: 18 }), t('dash.newStore'))),
      h('div', { class: 'kpis' },
        kpi('store', t('kpi.stores'), stats.stores),
        kpi('package', t('kpi.products'), stats.products),
        kpi('check', t('kpi.inStock'), pctStock, '%', 'ok'),
        kpi('image', t('kpi.photos'), photoStats.count)
      ),
      h('div', { class: 'dash-grid' },
        h('section', { class: 'card panel' },
          h('h3', { class: 'panel-title' }, t('dash.byCategory')),
          h('ul', { class: 'bars' }, catEntries.map(([cat, n], i) => h('li', null,
            h('span', { class: 'bar-label' }, cat),
            h('span', { class: 'bar-track' }, h('span', { class: 'bar-fill', style: { '--w': `${(n / maxCat) * 100}%`, '--i': String(i) } })),
            h('span', { class: 'bar-num' }, String(n)))))
        ),
        h('section', { class: 'card panel' },
          h('h3', { class: 'panel-title' }, t('dash.floors')),
          h('div', { class: 'floors' }, [4, 3, 2, 1].map((f) => h('a', { class: 'floor-card', href: '#/stores' },
            h('strong', null, t('floor.n', { n: f })),
            h('span', { class: 'floor-num' }, String(stats.floors[f])),
            h('span', { class: 'muted small' }, t('count.stores', { n: stats.floors[f] }).replace(/^\d+\s*/, '')),
            h('div', { class: 'floor-dots' }, stores.filter((st) => st.floor === f).sort((a, b) => a.slot - b.slot).map((st) => h('span', { title: L(st.name), style: { background: st.color } })))
          ))),
          h('h3', { class: 'panel-title mt' }, t('dash.storage')),
          storageMeter(usage, photoStats)
        ),
        h('section', { class: 'card panel panel-wide' },
          h('div', { class: 'row' }, h('h3', { class: 'panel-title' }, t('dash.recent')), h('span', { class: 'spacer' }), h('a', { class: 'btn btn-ghost btn-sm', href: '#/products' }, t('dash.allProducts'), Mall.icon('arrow-right', { size: 16 }))),
          h('ul', { class: 'recent' }, recent.map((p) => {
            const st = storeById.get(p.storeId);
            return h('li', null,
              thumb(p.images[0], p.emoji, st && st.color),
              h('div', { class: 'recent-info' }, h('strong', null, L(p.name)), h('span', { class: 'muted small' }, st ? `${st.logo} ${L(st.name)}` : '')),
              h('span', { class: 'recent-price' }, Mall.formatPrice(p.price)),
              h('a', { class: 'icon-btn icon-btn-sm', href: `#/products/${p.storeId}`, 'aria-label': t('dash.openProducts', { name: st ? L(st.name) : '' }) }, Mall.icon('chevron-right', { size: 16 })));
          }))
        )
      )
    );
    Mall.initCounters(host);
  }

  function storageMeter(usage, photos) {
    const pct = Math.min(100, (usage.bytes / usage.quota) * 100);
    return h('div', { class: 'meter-wrap' },
      h('div', { class: ['meter', pct > 80 && 'is-high'], role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': pct.toFixed(0), 'aria-label': t('dash.storage') },
        h('span', { style: { '--w': `${pct.toFixed(1)}%` } })),
      h('span', { class: 'muted small' }, t('dash.storageText', { data: `${Mall.formatBytes(usage.bytes)} / ~5 MB`, photos: `${t('count.photos', { n: photos.count })}, ${Mall.formatBytes(photos.bytes)}` })));
  }

  /* ============================================================= STORES */
  async function viewStores(host, param) {
    if (param) return viewStoreEditor(host, param);
    const [stores, products] = await Promise.all([S.getStores(), S.getAllProducts()]);
    const counts = {};
    products.forEach((p) => { counts[p.storeId] = (counts[p.storeId] || 0) + 1; });

    const search = h('input', { class: 'input', type: 'search', placeholder: t('stores.filter'), maxlength: '40', 'aria-label': t('stores.filter') });
    const list = h('div', { class: 'store-rows' });
    const render = () => {
      Mall.dom.clear(list);
      const rows = stores
        .filter((st) => Mall.search.matches(search.value, ['ru', 'uz', 'en'].flatMap((l) => [st.name[l], st.category[l]])))
        .sort((a, b) => b.floor - a.floor || a.slot - b.slot);
      if (!rows.length) list.appendChild(h('p', { class: 'muted empty-row' }, t('stores.none')));
      let lastFloor = null;
      rows.forEach((st) => {
        if (st.floor !== lastFloor) { lastFloor = st.floor; list.appendChild(h('h3', { class: 'floor-heading' }, t('floor.n', { n: st.floor }))); }
        const name = L(st.name);
        list.appendChild(h('article', { class: 'card store-row', style: { '--c': st.color } },
          h('span', { class: 'sr-logo img-box', 'aria-hidden': 'true' }, st.logo, st.logoImage ? (() => { const i = h('img', { alt: '' }); IMG.bind(i, st.logoImage, 'thumb'); return i; })() : null),
          h('div', { class: 'sr-info' },
            h('strong', null, name),
            h('span', { class: 'muted small' }, `${L(st.category)} · ${t('stores.slot', { floor: t('floor.n', { n: st.floor }), slot: st.slot })} · ${st.hours}`),
            missingLangs(st.name, st.category)),
          h('span', { class: 'pill' }, t('count.products', { n: counts[st.id] || 0 })),
          h('div', { class: 'sr-actions' },
            h('a', { class: 'btn btn-ghost btn-sm', href: `#/products/${st.id}` }, Mall.icon('package', { size: 16 }), h('span', { class: 'hide-sm' }, t('nav.products'))),
            h('a', { class: 'icon-btn icon-btn-sm', href: `store.html?id=${encodeURIComponent(st.id)}`, target: '_blank', rel: 'noopener', 'aria-label': t('stores.view', { name }) }, Mall.icon('eye', { size: 16 })),
            h('a', { class: 'icon-btn icon-btn-sm', href: `#/stores/${st.id}`, 'aria-label': t('stores.edit', { name }) }, Mall.icon('edit', { size: 16 })),
            h('button', { class: 'icon-btn icon-btn-sm is-danger', type: 'button', 'aria-label': t('stores.delete', { name }), onclick: () => removeStore(st, counts[st.id] || 0) }, Mall.icon('trash', { size: 16 })))
        ));
      });
    };
    search.addEventListener('input', Mall.debounce(render, 100));
    host.append(
      viewHead(t('nav.stores'), t('stores.subtitle', { n: t('count.stores', { n: stores.length }) }), h('a', { class: 'btn btn-primary', href: '#/stores/new' }, Mall.icon('plus', { size: 18 }), t('dash.newStore'))),
      h('div', { class: 'list-tools' }, h('div', { class: 'toolbar-search' }, h('span', { class: 'search-icon' }, Mall.icon('search', { size: 18 })), search)),
      list
    );
    render();
  }

  /** Little "missing translation" chips for a list row. */
  function missingLangs(...objs) {
    const missing = LANGS.filter((l) => objs.some((o) => o && !o[l]));
    if (!missing.length) return null;
    return h('span', { class: 'missing-langs', title: t('f.missingLang') }, Mall.icon('globe', { size: 12 }), ' ', missing.map((l) => l.toUpperCase()).join(' · '));
  }

  async function removeStore(st, productCount) {
    const ok = await Mall.confirm({ title: t('del.storeT', { name: L(st.name) }), message: t('del.storeD', { n: productCount }), confirmLabel: t('del.storeBtn'), danger: true });
    if (!ok) return;
    try {
      await S.deleteStore(st.id);
      state.dirty = false;
      state.editor = null;
      Mall.toast(t('del.done', { name: L(st.name) }), 'success');
      if (location.hash !== '#/stores') location.hash = '#/stores';
      else route({ quiet: true });
    } catch (e) { Mall.toast(errText(e), 'error'); }
  }

  /* --------------------------------------------- multilingual text block
   * One RU/UZ/EN tab bar controls several translated fields at once.
   * Each tab shows a dot when one of its fields is still empty. */
  function LangFields(fields, { onInput } = {}) {
    let active = Mall.i18n.lang;
    const values = {};
    fields.forEach((f) => { values[f.key] = Object.assign({ ru: '', uz: '', en: '' }, f.value || {}); });

    const tabs = h('div', { class: 'lang-tabs', role: 'tablist', 'aria-label': t('f.langTab') });
    const panels = h('div', { class: 'lang-panels' });
    const copyBtn = h('button', { class: 'btn btn-ghost btn-sm copy-langs', type: 'button' }, Mall.icon('copy', { size: 15 }), t('copy.langs'));
    const inputs = {};

    for (const f of fields) {
      inputs[f.key] = {};
      const wrap = h('div', { class: 'field', 'data-field': f.key });
      const label = h('label', { class: 'label', for: `lf-${f.key}` }, t(f.labelKey), f.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, '*') : null, h('span', { class: 'lang-badge' }, active.toUpperCase()));
      wrap.appendChild(label);
      for (const lang of LANGS) {
        const attrs = { class: f.multiline ? 'textarea' : 'input', 'data-lang': lang, maxlength: String(f.max), lang: lang === 'uz' ? 'uz-Latn' : lang, autocomplete: 'off', id: lang === active ? `lf-${f.key}` : null };
        const el = f.multiline ? h('textarea', attrs, values[f.key][lang]) : h('input', Object.assign(attrs, { value: values[f.key][lang] }));
        el.hidden = lang !== active;
        el.addEventListener('input', () => { values[f.key][lang] = el.value; syncDots(); if (onInput) onInput(); });
        inputs[f.key][lang] = el;
        wrap.appendChild(el);
      }
      if (f.hintKey) wrap.appendChild(h('span', { class: 'hint' }, t(f.hintKey)));
      wrap.appendChild(h('span', { class: 'error-msg' }));
      panels.appendChild(wrap);
    }

    for (const lang of LANGS) {
      const b = h('button', { type: 'button', role: 'tab', class: 'lang-tab', 'data-lang': lang, 'aria-selected': String(lang === active) }, lang.toUpperCase(), h('span', { class: 'lang-dot', 'aria-hidden': 'true' }));
      b.addEventListener('click', () => select(lang));
      tabs.appendChild(b);
    }
    tabs.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const next = LANGS[(LANGS.indexOf(active) + (e.key === 'ArrowRight' ? 1 : 2)) % 3];
      select(next);
      tabs.querySelector(`[data-lang="${next}"]`).focus();
    });

    copyBtn.addEventListener('click', () => {
      let copied = false;
      for (const f of fields) {
        const src = values[f.key][active];
        if (!src) continue;
        for (const lang of LANGS) {
          if (lang !== active && !values[f.key][lang]) { values[f.key][lang] = src; inputs[f.key][lang].value = src; copied = true; }
        }
      }
      if (copied) { syncDots(); if (onInput) onInput(); }
      Mall.toast(t(copied ? 'copy.done' : 'copy.nothing'), copied ? 'success' : 'info');
    });

    function select(lang) {
      active = lang;
      for (const b of $$('.lang-tab', tabs)) b.setAttribute('aria-selected', String(b.dataset.lang === lang));
      for (const f of fields) {
        for (const l of LANGS) {
          const el = inputs[f.key][l];
          el.hidden = l !== lang;
          el.id = l === lang ? `lf-${f.key}` : '';
        }
        const badge = panels.querySelector(`[data-field="${f.key}"] .lang-badge`);
        if (badge) badge.textContent = lang.toUpperCase();
      }
    }

    function syncDots() {
      for (const lang of LANGS) {
        const empty = fields.some((f) => f.required !== false && !values[f.key][lang] && f.dot !== false);
        const tab = tabs.querySelector(`[data-lang="${lang}"]`);
        tab.classList.toggle('is-missing', empty);
        tab.title = empty ? t('f.missingLang') : '';
      }
    }
    syncDots();

    const el = h('div', { class: 'lang-fields' }, h('div', { class: 'lang-bar' }, tabs, copyBtn), panels);
    return {
      el,
      values: () => JSON.parse(JSON.stringify(values)),
      setErrors(errors) {
        for (const f of fields) {
          const wrap = panels.querySelector(`[data-field="${f.key}"]`);
          const msg = errors[f.key];
          wrap.querySelector('.error-msg').textContent = msg ? t(msg) : '';
          LANGS.forEach((l) => inputs[f.key][l].toggleAttribute('aria-invalid', !!msg));
        }
        const firstBad = fields.find((f) => errors[f.key]);
        if (firstBad) {
          // Jump to a language where the field is empty, if any.
          const emptyLang = LANGS.find((l) => !values[firstBad.key][l]) || active;
          select(emptyLang);
          inputs[firstBad.key][emptyLang].focus();
        }
      },
    };
  }

  /* --------------------------------------------------- image manager
   * Reusable photo picker: file picker (gallery/camera), drag & drop, paste,
   * image URL. Thumbnails with progress, remove, make-cover, reorder (drag on
   * desktop, arrow buttons everywhere). Photos are compressed and saved to
   * IndexedDB right away; if the form is cancelled, rollback() deletes the
   * ones added in this session (photos removed from a saved item are deleted
   * by storage.js after the save succeeds). */
  function ImageManager({ refs = [], max = IMG.LIMITS.maxPerProduct, single = false, fallbackRef = '', onChange } = {}) {
    const items = refs.filter(Boolean).map((ref) => ({ ref, busy: false }));
    const added = new Set();
    let committed = false;

    const grid = h('div', { class: ['im-grid', single && 'is-single'], role: 'list' });
    const fileInput = h('input', { type: 'file', accept: 'image/*', multiple: !single, class: 'file-input', tabindex: '-1' });
    const pick = h('button', { class: 'im-drop', type: 'button' },
      Mall.icon('upload', { size: 22 }),
      h('span', { class: 'im-drop-text' }),
      h('span', { class: 'im-drop-sub muted small' }));
    const urlInput = h('input', { class: 'input', type: 'url', inputmode: 'url', placeholder: 'https://…' });
    const urlBtn = h('button', { class: 'btn btn-outline btn-sm', type: 'button' }, Mall.icon('link', { size: 15 }));
    const urlRow = h('div', { class: 'im-url' }, urlInput, urlBtn);
    const msg = h('p', { class: 'error-msg', role: 'alert' });
    const root = h('div', { class: 'im' }, grid, pick, fileInput, urlRow, msg);

    function relabel() {
      // Phones have no drag & drop or Ctrl+V: offer the camera / gallery picker instead.
      const touch = matchMedia('(pointer: coarse)').matches;
      pick.querySelector('.im-drop-text').textContent = touch ? t('img.camera') : `${t('img.drop')} ${t(single ? 'img.chooseOne' : 'img.choose')}`;
      pick.querySelector('.im-drop-sub').textContent = t('img.types', { mb: IMG.LIMITS.maxFileMB, px: IMG.LIMITS.fullPx });
      urlInput.setAttribute('aria-label', t('img.url'));
      urlBtn.setAttribute('aria-label', t('img.urlAdd'));
      urlBtn.title = t('img.urlAdd');
      render();
    }

    const changed = () => { render(); if (onChange) onChange(); };

    function render() {
      Mall.dom.clear(grid);
      if (!items.length && fallbackRef) {
        const tile = h('div', { class: 'im-tile is-fallback img-box', role: 'listitem' });
        const img = h('img', { alt: '' });
        tile.appendChild(img);
        IMG.bind(img, fallbackRef, 'sm', { eager: true });
        tile.appendChild(h('span', { class: 'im-tag' }, Mall.icon('globe', { size: 12 }), ' Pexels'));
        grid.appendChild(tile);
      }
      items.forEach((it, i) => {
        const tile = h('div', { class: ['im-tile', 'img-box', it.busy && 'is-busy'], role: 'listitem', draggable: !it.busy && !single ? 'true' : null, 'data-index': String(i), 'aria-label': t('img.alt', { i: i + 1 }) });
        if (it.busy) {
          tile.append(h('span', { class: 'im-progress', style: { '--p': String(it.progress || 0) } }), h('span', { class: 'im-busy-text' }, t('img.processing')));
        } else {
          const img = h('img', { alt: t('img.alt', { i: i + 1 }), draggable: 'false' });
          tile.appendChild(img);
          IMG.bind(img, it.ref, 'thumb', { eager: true });
          if (i === 0 && !single) tile.appendChild(h('span', { class: 'im-tag is-cover' }, Mall.icon('star', { size: 12 }), ' ', t('img.cover')));
          const tools = h('div', { class: 'im-tools' });
          if (!single && i > 0) tools.appendChild(toolBtn('star', t('img.makeCover'), () => { items.unshift(items.splice(i, 1)[0]); changed(); }));
          if (!single && i > 0) tools.appendChild(toolBtn('chevron-left', t('img.left'), () => { [items[i - 1], items[i]] = [items[i], items[i - 1]]; changed(); }));
          if (!single && i < items.length - 1) tools.appendChild(toolBtn('chevron-right', t('img.right'), () => { [items[i + 1], items[i]] = [items[i], items[i + 1]]; changed(); }));
          tools.appendChild(toolBtn('trash', t('img.remove'), () => removeAt(i), 'is-danger'));
          tile.appendChild(tools);
          // Desktop drag & drop reordering
          tile.addEventListener('dragstart', (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/x-im-index', String(i)); tile.classList.add('is-dragging'); });
          tile.addEventListener('dragend', () => tile.classList.remove('is-dragging'));
          tile.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('text/x-im-index')) { e.preventDefault(); tile.classList.add('is-over'); } });
          tile.addEventListener('dragleave', () => tile.classList.remove('is-over'));
          tile.addEventListener('drop', (e) => {
            const from = Number(e.dataTransfer.getData('text/x-im-index'));
            tile.classList.remove('is-over');
            if (!Number.isFinite(from) || from === i || !e.dataTransfer.types.includes('text/x-im-index')) return;
            e.preventDefault();
            e.stopPropagation();
            const [moved] = items.splice(from, 1);
            items.splice(i, 0, moved);
            changed();
          });
        }
        grid.appendChild(tile);
      });
      const full = items.length >= (single ? 1 : max);
      pick.hidden = full && !single;
      urlRow.hidden = full && !single;
      root.classList.toggle('is-full', full && !single);
    }

    function toolBtn(icon, label, fn, cls) {
      return h('button', { class: ['im-tool', cls], type: 'button', 'aria-label': label, title: label, onclick: (e) => { e.stopPropagation(); fn(); } }, Mall.icon(icon, { size: 14 }));
    }

    function removeAt(i) {
      const [it] = items.splice(i, 1);
      // A photo added in this session and removed again is deleted right away.
      if (it && added.has(it.ref)) { added.delete(it.ref); Mall.imageStore.delete(IMG.idOf(it.ref)); }
      changed();
    }

    async function addFiles(fileList) {
      msg.textContent = '';
      const files = Array.from(fileList || []).filter(Boolean);
      if (!files.length) return;
      let room = single ? 1 : max - items.length;
      if (single && items.length) { removeAt(0); room = 1; }
      if (files.length > room) Mall.toast(t('img.max', { n: max }), 'warning');
      let ok = 0, bytes = 0;
      for (const file of files.slice(0, room)) {
        const it = { ref: '', busy: true, progress: 0.05 };
        items.push(it);
        render();
        const tile = () => grid.querySelector(`[data-index="${items.indexOf(it)}"] .im-progress`);
        try {
          const out = await IMG.process(file, (p) => { it.progress = p; const bar = tile(); if (bar) bar.style.setProperty('--p', String(p)); });
          const id = await Mall.imageStore.save(out);
          it.ref = IMG.toRef(id);
          it.busy = false;
          added.add(it.ref);
          ok++;
          bytes += out.full.size + out.thumb.size;
        } catch (e) {
          items.splice(items.indexOf(it), 1);
          const text = e.code === 'QUOTA' ? t('img.quota') : errText(e);
          msg.textContent = text;
          Mall.toast(text, 'error');
        }
        render();
      }
      if (ok) { Mall.toast(t('img.ready', { n: ok, size: Mall.formatBytes(bytes) }), 'success'); if (onChange) onChange(); }
    }

    function addUrl() {
      const clean = Mall.validate.image(urlInput.value);
      if (!clean || IMG.isIdb(clean) || clean.startsWith('assets/')) { msg.textContent = t('img.urlBad'); urlInput.focus(); return; }
      msg.textContent = '';
      if (single) items.splice(0, items.length);
      if (items.length >= max) { Mall.toast(t('img.max', { n: max }), 'warning'); return; }
      items.push({ ref: clean, busy: false });
      urlInput.value = '';
      changed();
    }

    pick.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
    urlBtn.addEventListener('click', addUrl);
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } });
    // Drop files anywhere on the component
    root.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); root.classList.add('is-drop'); } });
    root.addEventListener('dragleave', (e) => { if (!root.contains(e.relatedTarget)) root.classList.remove('is-drop'); });
    root.addEventListener('drop', (e) => {
      root.classList.remove('is-drop');
      if (!e.dataTransfer.files.length) return;
      e.preventDefault();
      addFiles(e.dataTransfer.files);
    });

    relabel();
    return {
      el: root,
      relabel,
      /** Paste handler: the form owning this manager forwards clipboard images. */
      paste(e) {
        const files = Array.from((e.clipboardData && e.clipboardData.items) || []).filter((i) => i.kind === 'file' && i.type.startsWith('image/')).map((i) => i.getAsFile());
        if (files.length) { e.preventDefault(); addFiles(files); return true; }
        return false;
      },
      busy: () => items.some((i) => i.busy),
      refs: () => items.filter((i) => !i.busy && i.ref).map((i) => i.ref),
      commit() { committed = true; },
      /** Delete photos uploaded in this session that never got saved. */
      rollback() { if (committed) return; const ids = Array.from(added).map(IMG.idOf); added.clear(); Mall.imageStore.deleteMany(ids); },
    };
  }

  /* ------------------------------------------------------ store editor */
  async function viewStoreEditor(host, id) {
    const isNew = id === 'new';
    const all = await S.getStores();
    const existing = isNew ? null : all.find((st) => st.id === id);
    if (!isNew && !existing) {
      setTitle(t('notFound.store'));
      host.appendChild(h('div', { class: 'empty-state pad' }, h('h3', null, t('notFound.store')), h('a', { class: 'btn btn-primary', href: '#/stores' }, t('notFound.back'))));
      return;
    }
    const others = all.filter((st) => !existing || st.id !== existing.id);

    // Draft survives language switches (state.editor).
    if (!state.editor || state.editor.id !== (existing ? existing.id : 'new')) {
      const firstFree = () => {
        for (let f = 1; f <= 4; f++) for (let s = 1; s <= 6; s++) if (!others.some((o) => o.floor === f && o.slot === s)) return { floor: f, slot: s };
        return { floor: 1, slot: 1 };
      };
      const base = existing ? JSON.parse(JSON.stringify(existing)) : {
        id: '', name: {}, category: {}, description: {}, keywords: {},
        color: COLORS[Math.floor(Math.random() * COLORS.length)], logo: '🛍️', hours: '10:00 – 22:00',
        cover: '', logoImage: '', photo: '', ...firstFree(),
      };
      state.editor = { id: existing ? existing.id : 'new', draft: base, managers: null };
    }
    const draft = state.editor.draft;
    const markDirty = () => { state.dirty = true; };

    /* text block (3 languages) */
    const texts = LangFields([
      { key: 'name', labelKey: 'f.name', value: draft.name, max: Mall.LIMITS.storeName, required: true },
      { key: 'category', labelKey: 'f.category', value: draft.category, max: Mall.LIMITS.category, required: true },
      { key: 'description', labelKey: 'f.description', value: draft.description, max: Mall.LIMITS.description, multiline: true, required: false, dot: false },
      { key: 'keywords', labelKey: 'f.keywords', value: draft.keywords, max: Mall.LIMITS.keywords, hintKey: 'f.keywordsHint', required: false, dot: false },
    ], { onInput: () => { Object.assign(draft, texts.values()); markDirty(); refreshSlots(); } });

    /* look: emoji, logo image, cover photo, colour */
    const inLogo = h('input', { class: 'input emoji-input', id: 'f-logo', value: draft.logo, maxlength: '8', autocomplete: 'off' });
    inLogo.addEventListener('input', () => { draft.logo = inLogo.value; markDirty(); refreshSlots(); });
    const emojiRow = h('div', { class: 'emoji-row', role: 'group', 'aria-label': t('f.logo') }, EMOJIS.map((em) => h('button', { type: 'button', class: 'emoji-btn', 'aria-label': em, onclick: () => { inLogo.value = em; draft.logo = em; markDirty(); refreshSlots(); } }, em)));
    const inColor = h('input', { class: 'color-input', id: 'f-color', type: 'color', value: draft.color });
    inColor.addEventListener('input', () => { draft.color = inColor.value; markDirty(); refreshSlots(); });
    const swatches = h('div', { class: 'swatches', role: 'group', 'aria-label': t('f.colorPresets') }, COLORS.map((c) => h('button', { type: 'button', class: 'swatch', style: { background: c }, 'aria-label': c, onclick: () => { inColor.value = c; draft.color = c; markDirty(); refreshSlots(); } })));

    if (!state.editor.managers) {
      state.editor.managers = {
        cover: ImageManager({ refs: [draft.cover], single: true, fallbackRef: draft.photo, onChange: markDirty }),
        logo: ImageManager({ refs: [draft.logoImage], single: true, onChange: markDirty }),
      };
    } else {
      state.editor.managers.cover.relabel();
      state.editor.managers.logo.relabel();
    }
    const { cover: coverMgr, logo: logoMgr } = state.editor.managers;
    const onPaste = (e) => { if (document.activeElement && document.activeElement.closest('.im-logo')) logoMgr.paste(e); else coverMgr.paste(e); };
    document.addEventListener('paste', onPaste);
    state.cleanup.push(() => document.removeEventListener('paste', onPaste));

    /* hours */
    const hours = Mall.parseHours(draft.hours) || { openText: '10:00', closeText: '22:00' };
    const inOpen = h('input', { class: 'input', id: 'f-hours', type: 'time', value: hours.openText, 'aria-label': t('f.openTime') });
    const inClose = h('input', { class: 'input', type: 'time', value: hours.closeText, 'aria-label': t('f.closeTime') });
    const syncHours = () => { draft.hours = `${inOpen.value || '10:00'} – ${inClose.value || '22:00'}`; markDirty(); };
    inOpen.addEventListener('input', syncHours);
    inClose.addEventListener('input', syncHours);

    /* place: floor (elevator buttons) + slot picker */
    const floorRow = h('div', { class: 'floor-pick', role: 'radiogroup', 'aria-label': t('f.floor') });
    for (let f = 1; f <= 4; f++) {
      const b = h('button', { type: 'button', role: 'radio', class: 'floor-pick-btn', 'data-floor': String(f), 'aria-checked': String(draft.floor === f) }, String(f));
      b.addEventListener('click', () => { draft.floor = f; markDirty(); refreshSlots(); });
      floorRow.appendChild(b);
    }
    const slotRow = h('div', { class: 'slot-row', role: 'radiogroup', 'aria-label': t('f.slot') });
    const slotMsg = h('p', { class: 'slot-msg', role: 'status' });
    function refreshSlots() {
      $$('.floor-pick-btn', floorRow).forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.floor) === draft.floor)));
      Mall.dom.clear(slotRow);
      for (let sNo = 1; sNo <= 6; sNo++) {
        const occ = others.find((o) => o.floor === draft.floor && o.slot === sNo);
        const mine = draft.slot === sNo;
        const b = h('button', {
          type: 'button', role: 'radio', class: ['slot', mine && 'is-mine', occ && !mine && 'is-taken'], 'aria-checked': String(mine),
          style: { '--c': mine ? draft.color : occ ? occ.color : 'transparent' },
          'aria-label': `${t('slot.place', { n: sNo })}: ${mine ? t('slot.here') : occ ? L(occ.name) : t('slot.free')}`,
        },
        h('span', { class: 'slot-n' }, String(sNo)),
        h('span', { class: 'slot-logo', 'aria-hidden': 'true' }, mine ? draft.logo : occ ? occ.logo : '＋'),
        h('span', { class: 'slot-name' }, mine ? (L(draft.name) || t('slot.here')) : occ ? L(occ.name) : t('slot.free')));
        b.addEventListener('click', () => { draft.slot = sNo; markDirty(); refreshSlots(); });
        slotRow.appendChild(b);
      }
      const occ = others.find((o) => o.floor === draft.floor && o.slot === draft.slot);
      const full = others.filter((o) => o.floor === draft.floor).length >= 6;
      slotMsg.textContent = full && isNew ? t('slot.full') : occ ? t('slot.swapWith', { name: L(occ.name) }) : '';
      slotMsg.classList.toggle('is-warn', !!occ || (full && isNew));
    }
    refreshSlots();

    const saveBtn = h('button', { class: 'btn btn-primary', type: 'submit' }, Mall.icon('check', { size: 18 }), isNew ? t('editor.create') : t('action.save'));
    const form = h('form', { class: 'editor', novalidate: true },
      h('section', { class: 'card editor-card' },
        h('h3', { class: 'panel-title' }, t('editor.sectionText')),
        texts.el),
      h('section', { class: 'card editor-card' },
        h('h3', { class: 'panel-title' }, t('editor.sectionPlace')),
        h('div', { class: 'field' }, h('span', { class: 'label' }, t('f.floor')), floorRow),
        h('div', { class: 'field' }, h('span', { class: 'label' }, t('f.slot')), slotRow, slotMsg, h('span', { class: 'hint' }, t('f.slotHint'))),
        h('div', { class: 'field' }, h('label', { class: 'label', for: 'f-hours' }, t('f.hours')), h('div', { class: 'hours-row' }, inOpen, h('span', { 'aria-hidden': 'true' }, '–'), inClose))),
      h('section', { class: 'card editor-card editor-look' },
        h('h3', { class: 'panel-title' }, t('editor.sectionLook')),
        h('div', { class: 'field' }, h('span', { class: 'label' }, t('f.cover')), coverMgr.el, h('span', { class: 'hint' }, t('f.coverHint'))),
        h('div', { class: 'two' },
          h('div', { class: 'field' }, h('label', { class: 'label', for: 'f-logo' }, t('f.logo')), inLogo, emojiRow),
          h('div', { class: 'field im-logo' }, h('span', { class: 'label' }, t('f.logoImage')), logoMgr.el, h('span', { class: 'hint' }, t('f.logoHint')))),
        h('div', { class: 'field' }, h('label', { class: 'label', for: 'f-color' }, t('f.color')), h('div', { class: 'color-row' }, inColor, swatches))),
      h('div', { class: 'form-actions card' },
        !isNew ? h('button', { class: 'btn btn-ghost danger-text', type: 'button', onclick: async () => removeStore(existing, (await S.getProducts(existing.id)).length) }, Mall.icon('trash', { size: 16 }), t('action.delete')) : null,
        h('span', { class: 'spacer' }),
        h('a', { class: 'btn btn-outline', href: '#/stores' }, t('action.cancel')),
        saveBtn)
    );

    host.append(
      viewHead(isNew ? t('editor.newT') : t('editor.editT', { name: L(existing.name) }), isNew ? t('editor.newSub') : t('editor.idSub', { id: existing.id }),
        !isNew ? h('a', { class: 'btn btn-ghost', href: `#/products/${existing.id}` }, Mall.icon('package', { size: 18 }), t('nav.products')) : null),
      form
    );

    // Leaving the editor without saving deletes photos uploaded in it.
    state.cleanup.push(() => {
      if (state.editor && state.editor.managers && !state.editorKeep) {
        state.editor.managers.cover.rollback();
        state.editor.managers.logo.rollback();
      }
      state.editorKeep = false;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (coverMgr.busy() || logoMgr.busy()) { Mall.toast(t('img.processing'), 'info'); return; }
      Object.assign(draft, texts.values());
      const payload = { ...draft, cover: coverMgr.refs()[0] || '', logoImage: logoMgr.refs()[0] || '', logo: inLogo.value, color: inColor.value };
      if (isNew) delete payload.id;
      texts.setErrors({});
      saveBtn.classList.add('is-loading');
      try {
        await Mall.sleep(200);
        const saved = await S.saveStore(payload);
        coverMgr.commit(); logoMgr.commit();
        state.dirty = false;
        state.editor = null;
        Mall.toast(t(isNew ? 'editor.created' : 'editor.saved', { name: L(saved.name) }), 'success');
        if (isNew) location.hash = `#/stores/${saved.id}`;
        else route({ quiet: true });
      } catch (err) {
        if (err.fields) {
          texts.setErrors(err.fields);
          if (err.fields.slot) slotMsg.textContent = t(err.fields.slot);
        }
        Mall.toast(errText(err), 'error');
      } finally {
        saveBtn.classList.remove('is-loading');
      }
    });
  }

  /* =========================================================== PRODUCTS */
  async function viewProducts(host, storeId) {
    const stores = (await S.getStores()).sort((a, b) => L(a.name).localeCompare(L(b.name), Mall.i18n.locale));
    if (!stores.length) {
      setTitle(t('nav.products'));
      host.appendChild(h('div', { class: 'empty-state pad' }, h('h3', null, t('products.noStoresT')), h('p', null, t('products.noStoresD')), h('a', { class: 'btn btn-primary', href: '#/stores/new' }, t('dash.newStore'))));
      return;
    }
    const store = stores.find((st) => st.id === storeId) || stores[0];
    if (store.id !== storeId) { state.ignoreNextHash = true; location.replace(`#/products/${store.id}`); state.currentHash = location.hash; }
    const products = await S.getProducts(store.id);

    const select = h('select', { class: 'select', 'aria-label': t('products.chooseStore') }, stores.map((st) => h('option', { value: st.id }, `${st.logo}  ${L(st.name)}`)));
    select.value = store.id;
    select.addEventListener('change', () => { location.hash = `#/products/${select.value}`; });
    const search = h('input', { class: 'input', type: 'search', placeholder: t('products.filter'), maxlength: '40', 'aria-label': t('products.filter') });
    const list = h('div', { class: 'product-rows' });

    const render = () => {
      Mall.dom.clear(list);
      const rows = products.filter((p) => Mall.search.matches(search.value, ['ru', 'uz', 'en'].map((l) => p.name[l])));
      if (!rows.length) {
        list.appendChild(h('div', { class: 'empty-state pad' },
          h('div', { class: 'empty-art', 'aria-hidden': 'true' }, Mall.icon('package', { size: 36, stroke: 1.6 })),
          h('h3', null, t(products.length ? 'products.noMatch' : 'products.noneT')),
          products.length ? null : h('button', { class: 'btn btn-primary', type: 'button', onclick: () => openProductForm(null, store, stores) }, Mall.icon('plus', { size: 18 }), t('products.first'))));
        return;
      }
      rows.forEach((p) => {
        const name = L(p.name);
        const toggle = h('input', { type: 'checkbox', checked: p.inStock, 'aria-label': t('products.stockAria', { name }) });
        toggle.addEventListener('change', async () => {
          try {
            await S.saveProduct({ ...p, inStock: toggle.checked });
            p.inStock = toggle.checked;
            Mall.toast(t(toggle.checked ? 'products.stockOn' : 'products.stockOff', { name }), 'success');
          } catch (e) { toggle.checked = !toggle.checked; Mall.toast(errText(e), 'error'); }
        });
        list.appendChild(h('article', { class: 'card product-row' },
          thumb(p.images[0], p.emoji, store.color),
          h('div', { class: 'pr-info' },
            h('strong', null, name),
            h('span', { class: 'muted small pr-desc' }, p.images.length ? `${t('count.photos', { n: p.images.length })} · ${L(p.description) || ''}` : L(p.description) || t('product.noDesc')),
            missingLangs(p.name)),
          h('span', { class: 'pr-price' }, Mall.formatPrice(p.price)),
          h('label', { class: 'switch pr-stock' }, toggle, h('span', { class: 'switch-track', 'aria-hidden': 'true' }), h('span', { class: 'small hide-sm' }, t('f.stock'))),
          h('div', { class: 'sr-actions' },
            h('button', { class: 'icon-btn icon-btn-sm', type: 'button', 'aria-label': t('products.edit', { name }), onclick: () => openProductForm(p, store, stores) }, Mall.icon('edit', { size: 16 })),
            h('button', { class: 'icon-btn icon-btn-sm is-danger', type: 'button', 'aria-label': t('products.delete', { name }), onclick: () => removeProduct(p) }, Mall.icon('trash', { size: 16 })))
        ));
      });
    };
    search.addEventListener('input', Mall.debounce(render, 100));

    host.append(
      viewHead(t('nav.products'), t('products.subtitle', { n: t('count.products', { n: products.length }), store: L(store.name) }),
        h('button', { class: 'btn btn-primary', type: 'button', onclick: () => openProductForm(null, store, stores) }, Mall.icon('plus', { size: 18 }), t('products.new'))),
      h('div', { class: 'list-tools' },
        h('div', { class: 'store-picker', style: { '--c': store.color } }, select),
        h('div', { class: 'toolbar-search' }, h('span', { class: 'search-icon' }, Mall.icon('search', { size: 18 })), search),
        h('a', { class: 'btn btn-ghost btn-sm', href: `#/stores/${store.id}` }, Mall.icon('edit', { size: 16 }), t('products.editStore'))),
      list
    );
    render();
  }

  async function removeProduct(p) {
    if (!(await Mall.confirm({ title: t('del.productT', { name: L(p.name) }), message: t('del.productD'), confirmLabel: t('del.productBtn'), danger: true }))) return;
    try {
      await S.deleteProduct(p.id);
      Mall.toast(t('del.done', { name: L(p.name) }), 'success');
      route({ quiet: true });
    } catch (e) { Mall.toast(errText(e), 'error'); }
  }

  /** Product form in a modal. Re-renders its labels when the language changes, keeping all values. */
  function openProductForm(product, store, stores) {
    const isNew = !product;
    const p = product ? JSON.parse(JSON.stringify(product)) : { id: '', storeId: store.id, name: {}, description: {}, keywords: {}, price: '', emoji: '🛍️', images: [], inStock: true };
    const titleId = 'pf-title';
    let saved = false;
    const images = ImageManager({ refs: p.images, max: IMG.LIMITS.maxPerProduct });
    const vals = { price: String(p.price), storeId: p.storeId, emoji: p.emoji, inStock: p.inStock };
    let texts = null;
    let modal = null;

    function build() {
      const prevTexts = texts ? texts.values() : { name: p.name, description: p.description, keywords: p.keywords };
      texts = LangFields([
        { key: 'name', labelKey: 'f.name', value: prevTexts.name, max: Mall.LIMITS.productName, required: true },
        { key: 'description', labelKey: 'f.description', value: prevTexts.description, max: Mall.LIMITS.productDescription, multiline: true, required: false, dot: false },
        { key: 'keywords', labelKey: 'f.keywords', value: prevTexts.keywords, max: Mall.LIMITS.keywords, hintKey: 'f.keywordsHint', required: false, dot: false },
      ]);
      const field = (name, labelKey, control, vars) => h('div', { class: 'field', 'data-field': name },
        h('label', { class: 'label', for: `pf-${name}` }, t(labelKey, vars)), control, h('span', { class: 'error-msg' }));
      const inPrice = h('input', { class: 'input', id: 'pf-price', type: 'number', inputmode: 'numeric', min: '0', step: '1000', value: vals.price });
      inPrice.addEventListener('input', () => { vals.price = inPrice.value; });
      const inStore = h('select', { class: 'select', id: 'pf-storeId' }, stores.map((st) => h('option', { value: st.id }, `${st.logo}  ${L(st.name)}`)));
      inStore.value = vals.storeId;
      inStore.addEventListener('change', () => { vals.storeId = inStore.value; });
      const inEmoji = h('input', { class: 'input emoji-input', id: 'pf-emoji', value: vals.emoji, maxlength: '8', autocomplete: 'off' });
      inEmoji.addEventListener('input', () => { vals.emoji = inEmoji.value; });
      const inStock = h('input', { type: 'checkbox', checked: vals.inStock });
      inStock.addEventListener('change', () => { vals.inStock = inStock.checked; });
      const saveBtn = h('button', { class: 'btn btn-primary', type: 'submit' }, Mall.icon('check', { size: 18 }), t(isNew ? 'pform.add' : 'pform.save'));
      images.relabel();

      const form = h('form', { class: 'pform', novalidate: true },
        h('header', { class: 'pform-head' }, h('h2', { id: titleId }, t(isNew ? 'pform.newT' : 'pform.editT')),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('action.close'), onclick: () => modal.close() }, Mall.icon('x'))),
        h('div', { class: 'pform-body' },
          h('div', { class: 'pform-media' },
            h('span', { class: 'label' }, t('f.photos')),
            images.el,
            h('span', { class: 'hint' }, t('f.photosHint', { n: IMG.LIMITS.maxPerProduct })),
            field('emoji', 'f.emoji', inEmoji),
            h('span', { class: 'hint' }, t('f.emojiHint'))),
          h('div', { class: 'pform-fields' },
            texts.el,
            h('div', { class: 'two' }, field('price', 'f.price', inPrice, { cur: t('currency') }), field('storeId', 'f.store', inStore)),
            h('label', { class: 'switch' }, inStock, h('span', { class: 'switch-track', 'aria-hidden': 'true' }), h('span', null, t('f.stock'))))
        ),
        h('footer', { class: 'pform-foot' }, h('button', { class: 'btn btn-outline', type: 'button', onclick: () => modal.close() }, t('action.cancel')), saveBtn)
      );

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (images.busy()) { Mall.toast(t('img.processing'), 'info'); return; }
        $$('.field[data-field] > .error-msg', form).forEach((m) => { m.textContent = ''; });
        texts.setErrors({});
        saveBtn.classList.add('is-loading');
        try {
          await Mall.sleep(150);
          const out = await S.saveProduct({ ...p, ...texts.values(), price: vals.price, storeId: vals.storeId, emoji: vals.emoji, inStock: vals.inStock, images: images.refs() });
          saved = true;
          images.commit();
          Mall.toast(t(isNew ? 'pform.added' : 'pform.saved', { name: L(out.name) }), 'success');
          await modal.close();
          if (out.storeId !== store.id) location.hash = `#/products/${out.storeId}`;
          else route({ quiet: true });
        } catch (err) {
          if (err.fields) {
            texts.setErrors(err.fields);
            for (const [name, key] of Object.entries(err.fields)) {
              const f = form.querySelector(`.field[data-field="${name}"]:not(.lang-panels .field) > .error-msg`);
              if (f) f.textContent = t(key);
            }
          }
          Mall.toast(errText(err), 'error');
        } finally {
          saveBtn.classList.remove('is-loading');
        }
      });
      return form;
    }

    const onPaste = (e) => images.paste(e);
    modal = Mall.openModal({
      content: build(), labelledBy: titleId, className: 'modal-form', initialFocus: '#lf-name',
      onClose: () => {
        document.removeEventListener('paste', onPaste);
        openProductForm.current = null;
        if (!saved) images.rollback();
      },
    });
    document.addEventListener('paste', onPaste);
    openProductForm.current = {
      relabel() {
        const panel = modal.el;
        const scroll = panel.querySelector('.pform-body') ? panel.querySelector('.pform-body').scrollTop : 0;
        Mall.dom.clear(panel).appendChild(build());
        const body = panel.querySelector('.pform-body');
        if (body) body.scrollTop = scroll;
      },
    };
  }
  openProductForm.current = null;

  /* =============================================================== DATA */
  async function viewData(host) {
    const usage = S.usage();
    const [stats, photoStats] = await Promise.all([S.getStats(), Mall.imageStore.stats()]);
    const fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'file-input', id: 'importFile' });

    const exportBtn = h('button', { class: 'btn btn-primary', type: 'button' }, Mall.icon('download', { size: 18 }), t('data.exportBtn'));
    exportBtn.addEventListener('click', async () => {
      exportBtn.classList.add('is-loading');
      try {
        const data = await S.exportData();
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = h('a', { href: url, download: `lumina-mall-backup-${new Date().toISOString().slice(0, 10)}.json` });
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        Mall.toast(t('data.exportDone', { s: data.stores.length, p: data.products.length, i: Object.keys(data.images).length }), 'success');
      } catch (e) { Mall.toast(errText(e), 'error'); }
      finally { exportBtn.classList.remove('is-loading'); }
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      if (file.size > Mall.LIMITS.importMB * 1024 * 1024) { Mall.toast(t('err.importBig', { mb: Mall.LIMITS.importMB }), 'error'); return; }
      try {
        const text = await file.text();
        const pv = S.previewImport(text);
        const ok = await Mall.confirm({
          title: t('data.importT2'),
          message: t('data.importD2', { s: pv.stores, p: pv.products, i: pv.images, skipped: pv.skipped ? t('data.importSkipped', { n: pv.skipped }) : '' }),
          confirmLabel: t('data.importBtn2'), danger: true,
        });
        if (!ok) return;
        const res = await S.importData(text);
        Mall.toast(t('data.importDone', { s: res.stores, p: res.products, i: res.images }), 'success');
        route({ quiet: true });
      } catch (e) { Mall.toast(errText(e), 'error'); }
    });

    const resetBtn = h('button', { class: 'btn btn-danger', type: 'button' }, Mall.icon('refresh', { size: 18 }), t('data.resetBtn'));
    resetBtn.addEventListener('click', async () => {
      if (!(await Mall.confirm({ title: t('data.resetT2'), message: t('data.resetD2'), confirmLabel: t('data.resetBtn2'), danger: true }))) return;
      try {
        const res = await S.resetToDemo();
        Mall.toast(t('data.resetDone', { s: res.stores, p: res.products }), 'success');
        route({ quiet: true });
      } catch (e) { Mall.toast(errText(e), 'error'); }
    });

    host.append(
      viewHead(t('nav.data'), t('data.subtitle')),
      h('div', { class: 'data-grid' },
        h('section', { class: 'card panel' },
          h('span', { class: 'kpi-icon' }, Mall.icon('download', { size: 20 })),
          h('h3', { class: 'panel-title' }, t('data.exportT')),
          h('p', { class: 'muted' }, t('data.exportD', { s: stats.stores, p: stats.products })),
          exportBtn),
        h('section', { class: 'card panel' },
          h('span', { class: 'kpi-icon' }, Mall.icon('upload', { size: 20 })),
          h('h3', { class: 'panel-title' }, t('data.importT')),
          h('p', { class: 'muted' }, t('data.importD')),
          h('label', { class: 'btn btn-outline', for: 'importFile' }, Mall.icon('upload', { size: 18 }), t('data.importBtn')), fileInput),
        h('section', { class: 'card panel' },
          h('span', { class: 'kpi-icon kpi-danger' }, Mall.icon('refresh', { size: 20 })),
          h('h3', { class: 'panel-title' }, t('data.resetT')),
          h('p', { class: 'muted' }, t('data.resetD')),
          resetBtn),
        h('section', { class: 'card panel' },
          h('span', { class: 'kpi-icon' }, Mall.icon('database', { size: 20 })),
          h('h3', { class: 'panel-title' }, t('data.usageT')),
          storageMeter(usage, photoStats),
          h('p', { class: 'muted small' }, t('data.usageD'))),
        h('section', { class: 'card panel panel-wide security-note' },
          h('div', { class: 'row' }, h('span', { class: 'kpi-icon' }, Mall.icon('shield', { size: 20 })), h('h3', { class: 'panel-title' }, t('sec.title'))),
          h('ul', { class: 'checklist' },
            h('li', null, t('sec.1')), h('li', null, t('sec.2')), h('li', null, t('sec.3')), h('li', null, t('sec.4')),
            h('li', { class: 'warn' }, t('sec.warn'))))
      )
    );
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);

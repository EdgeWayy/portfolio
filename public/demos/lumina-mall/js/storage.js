/* =========================================================================
 * Lumina Mall — DATA LAYER
 * -------------------------------------------------------------------------
 * This is the ONLY file that knows where data lives. Every page reads and
 * writes stores, products and the cart through Mall.storage.* below.
 *
 * Text data (stores, products) lives in localStorage. Photos live in
 * IndexedDB (js/imageStore.js); the data keeps only image references
 * ("idb:<id>", "assets/…" or "https://…").
 *
 * All data functions are async (they return Promises) even though
 * localStorage is synchronous. A real backend (Supabase, Firebase, your own
 * API) is async, so when you swap the implementation, no page code changes.
 *
 * DATA FORMAT (version 2)
 *   store   { id, floor 1–4, slot 1–6, color, logo (emoji), hours,
 *             name{ru,uz,en}, category{…}, description{…}, keywords{…},
 *             photo (bundled asset), cover (uploaded ref), logoImage (uploaded ref) }
 *   product { id, storeId, price (UZS), emoji, inStock, images [refs, first = cover],
 *             name{ru,uz,en}, description{…}, keywords{…} }
 *
 * ----------------------- BACKEND MIGRATION GUIDE -------------------------
 * Look for the "BACKEND:" markers. A typical Supabase migration:
 *
 *   1. Tables (SQL in README.md). Translation objects map nicely to jsonb:
 *        stores   (id text pk, floor int, slot int, color, logo, hours,
 *                  name jsonb, category jsonb, description jsonb, keywords jsonb,
 *                  photo, cover, logo_image, owner_id uuid, created_at, updated_at)
 *        products (id text pk, store_id text fk -> stores.id on delete cascade,
 *                  price numeric, emoji, in_stock bool, images text[],
 *                  name jsonb, description jsonb, keywords jsonb, …)
 *   2. const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 *      The anon key is public by design. NEVER put the service_role key in
 *      front-end code.
 *   3. Replace each function body, e.g. getStores():
 *        const { data, error } = await supabase.from('stores').select('*');
 *        if (error) throw error;
 *        return data.map(fromRow);
 *   4. SELLER ACCOUNTS (each seller manages only their own store):
 *        - Supabase Auth for login (replaces js/auth.js entirely).
 *        - stores.owner_id = auth.uid() of the seller.
 *        - Row Level Security is what enforces this, NOT the UI:
 *            alter table stores enable row level security;
 *            create policy "public read stores" on stores for select using (true);
 *            create policy "owner writes store" on stores for update using (owner_id = auth.uid());
 *            create policy "owner writes products" on products for all
 *              using (store_id in (select id from stores where owner_id = auth.uid()));
 *   5. Photos: see the BACKEND note at the top of js/imageStore.js.
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = (global.Mall = global.Mall || {});
  const CFG = global.MALL_CONFIG;
  const PREFIX = CFG.STORAGE_PREFIX;
  const DATA_KEY = PREFIX + 'data';
  const CART_KEY = PREFIX + 'cart';
  const SCHEMA_VERSION = 2;
  const LANGS = ['ru', 'uz', 'en'];

  const FLOORS = 4;
  const SLOTS_PER_FLOOR = 6;
  Mall.LAYOUT = Object.freeze({ FLOORS, SLOTS_PER_FLOOR });

  const LIMITS = Object.freeze({
    storeName: 40, category: 30, description: 400, keywords: 300, hours: 40, logo: 8,
    productName: 70, productDescription: 500, maxPrice: 1e10,
    maxStores: FLOORS * SLOTS_PER_FLOOR, maxProductsPerStore: 80,
    maxImages: 6,
    importMB: 300,
  });
  Mall.LIMITS = LIMITS;

  /** An Error whose message is an i18n key (the UI translates it). */
  function fail(key, vars, fields) {
    const err = new Error(Mall.t ? Mall.t(key, vars) : key);
    err.i18nKey = key;
    err.vars = vars;
    if (fields) err.fields = fields;
    return err;
  }

  /* ===================================================== sanitising ===== */

  /** Trim, drop control/bidi characters, collapse whitespace, cap length. */
  function cleanText(value, max, { multiline = false } = {}) {
    let str = value == null ? '' : String(value);
    str = str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '');
    str = multiline ? str.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : str.replace(/\s+/g, ' ');
    str = str.trim();
    return Array.from(str).slice(0, max).join('');
  }

  /** Clean a translation object { ru, uz, en }. A plain string is used for all languages. */
  function cleanLocalized(value, max, opts) {
    const out = {};
    if (value == null || typeof value !== 'object') {
      const v = cleanText(value, max, opts);
      LANGS.forEach((l) => { out[l] = v; });
      return out;
    }
    LANGS.forEach((l) => { out[l] = cleanText(value[l], max, opts); });
    return out;
  }
  const anyText = (loc) => LANGS.some((l) => loc[l]);
  const longest = (loc) => Math.max(...LANGS.map((l) => Array.from(loc[l] || '').length));

  function cleanColor(value, fallback = '#c9a227') {
    const v = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : fallback;
  }

  function cleanEmoji(value, fallback) {
    const out = Array.from(cleanText(value, 16)).slice(0, 4).join('');   // flags & ZWJ emoji use several code points
    return out || fallback;
  }

  function cleanNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  /**
   * Image references: uploaded ("idb:<id>"), bundled ("assets/images/…") or
   * external ("https://…"). Anything else (javascript:, data:, http:) is rejected.
   */
  function cleanImageRef(value) {
    const v = String(value || '').trim();
    if (!v) return '';
    if (/^idb:[a-z0-9-]{4,64}$/i.test(v)) return v;
    if (/^assets\/[\w\-./]+\.(png|jpe?g|webp|gif|svg)$/i.test(v) && !v.includes('..')) return v;
    try {
      const url = new URL(v);
      if (url.protocol === 'https:' && v.length <= 2000) return url.href;
    } catch (e) { /* invalid URL */ }
    return '';
  }

  function cleanId(value) {
    const v = String(value || '').toLowerCase().trim();
    return /^[a-z0-9][a-z0-9-]{0,47}$/.test(v) ? v : '';
  }

  function cleanHours(value) {
    const text = cleanText(value, LIMITS.hours);
    const p = Mall.parseHours ? Mall.parseHours(text) : null;
    if (!p) return text || '10:00 – 22:00';
    const fmt = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    return `${fmt(p.open)} – ${fmt(p.close)}`;
  }

  /** Validate + normalise a store. Returns { value, errors, ok }; errors are i18n keys. */
  function validateStore(input) {
    const errors = {};
    const name = cleanLocalized(input.name, LIMITS.storeName);
    if (longest(name) < 2) errors.name = 'err.name';
    const category = cleanLocalized(input.category, LIMITS.category);
    if (!anyText(category)) errors.category = 'err.category';

    const value = {
      id: cleanId(input.id),
      name,
      category,
      description: cleanLocalized(input.description, LIMITS.description, { multiline: true }),
      keywords: cleanLocalized(input.keywords, LIMITS.keywords),
      color: cleanColor(input.color),
      floor: Math.round(cleanNumber(input.floor, 1, FLOORS, 1)),
      slot: Math.round(cleanNumber(input.slot, 1, SLOTS_PER_FLOOR, 1)),
      logo: cleanEmoji(input.logo, '🛍️'),
      logoImage: cleanImageRef(input.logoImage),
      cover: cleanImageRef(input.cover),
      photo: cleanImageRef(input.photo),
      hours: cleanHours(input.hours),
      createdAt: Number(input.createdAt) || Date.now(),
      updatedAt: Number(input.updatedAt) || Date.now(),
      // BACKEND: ownerId: input.ownerId  (the seller who owns this store)
    };
    return { value, errors, ok: Object.keys(errors).length === 0 };
  }

  function validateProduct(input) {
    const errors = {};
    const name = cleanLocalized(input.name, LIMITS.productName);
    if (longest(name) < 2) errors.name = 'err.name';
    const rawPrice = typeof input.price === 'string' ? input.price.replace(/\s/g, '').replace(',', '.') : input.price;
    const priceNum = Number(rawPrice);
    if (rawPrice === '' || rawPrice == null || !Number.isFinite(priceNum) || priceNum < 0) errors.price = 'err.price';
    else if (priceNum > LIMITS.maxPrice) errors.price = 'err.priceHigh';
    const storeId = cleanId(input.storeId);
    if (!storeId) errors.storeId = 'err.store';

    const images = Array.from(new Set((Array.isArray(input.images) ? input.images : []).map(cleanImageRef).filter(Boolean))).slice(0, LIMITS.maxImages);

    const value = {
      id: cleanId(input.id),
      storeId,
      name,
      description: cleanLocalized(input.description, LIMITS.productDescription, { multiline: true }),
      keywords: cleanLocalized(input.keywords, LIMITS.keywords),
      price: Math.round(cleanNumber(priceNum, 0, LIMITS.maxPrice, 0) * 100) / 100,
      emoji: cleanEmoji(input.emoji, '🛍️'),
      images,
      inStock: input.inStock !== false && input.inStock !== 'false',
      createdAt: Number(input.createdAt) || Date.now(),
      updatedAt: Number(input.updatedAt) || Date.now(),
    };
    return { value, errors, ok: Object.keys(errors).length === 0 };
  }

  /** Clean a whole dataset (imports and anything read back from localStorage). */
  function sanitizeDataset(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.stores) || !Array.isArray(raw.products)) throw fail('err.importShape');
    const stores = [];
    const storeIds = new Set();
    const taken = new Set();   // "floor:slot"
    for (const s of raw.stores.slice(0, LIMITS.maxStores)) {
      if (!s || typeof s !== 'object') continue;
      const { value, ok } = validateStore(s);
      if (!value.id || storeIds.has(value.id) || !ok) continue;
      // Resolve duplicate slots by moving the later store to the next free slot on its floor.
      let key = `${value.floor}:${value.slot}`;
      if (taken.has(key)) {
        const free = freeSlot(value.floor, taken);
        if (!free) continue;
        value.slot = free;
        key = `${value.floor}:${free}`;
      }
      taken.add(key);
      storeIds.add(value.id);
      stores.push(value);
    }
    const products = [];
    const productIds = new Set();
    const perStore = {};
    for (const p of raw.products) {
      if (!p || typeof p !== 'object') continue;
      const { value, ok } = validateProduct(p);
      if (!value.id || productIds.has(value.id) || !storeIds.has(value.storeId) || !ok) continue;
      perStore[value.storeId] = (perStore[value.storeId] || 0) + 1;
      if (perStore[value.storeId] > LIMITS.maxProductsPerStore) continue;
      productIds.add(value.id);
      products.push(value);
    }
    return { version: SCHEMA_VERSION, stores, products };
  }

  function freeSlot(floor, takenSet) {
    for (let s = 1; s <= SLOTS_PER_FLOOR; s++) if (!takenSet.has(`${floor}:${s}`)) return s;
    return 0;
  }

  /* ======================================================= persistence == */
  // BACKEND: everything in this section disappears. The cache becomes a
  // simple in-memory cache of the last API response (or is removed).

  let cache = null;
  const listeners = new Set();

  function readKey(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function load() {
    if (cache) return cache;
    let parsed = null;
    try { parsed = JSON.parse(readKey(DATA_KEY) || 'null'); } catch (e) { parsed = null; }
    if (parsed && parsed.version === SCHEMA_VERSION) {
      try { cache = sanitizeDataset(parsed); } catch (e) { cache = null; }
    }
    // Version 1 data (the old single-language, top-down-map format) is replaced
    // by the new demo data. See README → "Upgrading from the first version".
    if (!cache) {
      cache = global.MALL_DEMO_DATA.build();
      persist();
    }
    return cache;
  }

  function persist() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(cache));
    } catch (e) {
      const err = fail('err.quota');
      err.code = 'QUOTA';
      throw err;
    }
  }

  function notify(type) {
    for (const fn of listeners) {
      try { fn(type); } catch (e) { Mall.log(e); }
    }
  }

  // Keep tabs in sync: editing in admin.html updates an open index.html.
  global.addEventListener('storage', (e) => {
    if (e.key === DATA_KEY) { cache = null; notify('data'); }
    if (e.key === CART_KEY) notify('cart');
  });

  const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));

  function uniqueId(base, taken) {
    let id = cleanId(base) || 'item';
    if (!taken.has(id)) return id;
    let i = 2;
    while (taken.has(`${id}-${i}`)) i++;
    return `${id}-${i}`;
  }

  /** Delete uploaded photos that are no longer referenced (best effort, never throws). */
  async function dropImages(refs) {
    const ids = refs.filter((r) => Mall.images && Mall.images.isIdb(r)).map((r) => Mall.images.idOf(r));
    if (!ids.length || !Mall.imageStore) return;
    // Keep any photo still used by another store/product (e.g. after a copy).
    const still = new Set(Mall.images.collectIds(load()));
    try { await Mall.imageStore.deleteMany(ids.filter((id) => !still.has(id))); } catch (e) { Mall.log(e); }
  }

  /* ============================================================ STORES == */

  async function getStores() {
    // BACKEND: supabase.from('stores').select('*')
    return clone(load().stores);
  }

  async function getStore(id) {
    // BACKEND: supabase.from('stores').select('*').eq('id', id).single()
    const s = load().stores.find((x) => x.id === id);
    return s ? clone(s) : null;
  }

  /**
   * Create or update. If the chosen floor/slot is taken by another store, the
   * two stores swap places (the other store moves to this store's old place,
   * or to the first free slot when this store is new).
   */
  async function saveStore(input) {
    // BACKEND: upsert into 'stores'. With seller accounts, RLS rejects
    // updates to stores the current user does not own.
    const data = load();
    const { value, errors, ok } = validateStore(input);
    if (!ok) throw fail('err.fix', null, errors);

    const existing = value.id ? data.stores.find((s) => s.id === value.id) : null;
    const others = data.stores.filter((s) => s !== existing);
    const occupant = others.find((s) => s.floor === value.floor && s.slot === value.slot);
    if (occupant) {
      if (existing) {
        occupant.floor = existing.floor;
        occupant.slot = existing.slot;
      } else {
        const taken = new Set(others.map((s) => `${s.floor}:${s.slot}`));
        const free = freeSlot(value.floor, taken);
        if (!free) throw fail('err.floorFull', null, { slot: 'err.floorFull' });
        value.slot = free;
      }
      occupant.updatedAt = Date.now();
    }

    const before = JSON.stringify(data.stores);
    const replacedRefs = [];
    if (existing) {
      if (existing.cover && existing.cover !== value.cover) replacedRefs.push(existing.cover);
      if (existing.logoImage && existing.logoImage !== value.logoImage) replacedRefs.push(existing.logoImage);
      Object.assign(existing, value, { createdAt: existing.createdAt, updatedAt: Date.now() });
    } else {
      if (data.stores.length >= LIMITS.maxStores) throw fail('err.maxStores', { n: LIMITS.maxStores });
      const base = Mall.slugify(value.name.en || value.name.uz || value.name.ru) || 'store';
      value.id = uniqueId(base, new Set(data.stores.map((s) => s.id)));
      value.createdAt = value.updatedAt = Date.now();
      data.stores.push(value);
    }
    try { persist(); } catch (e) { data.stores = JSON.parse(before); cache = data; throw e; }
    notify('data');
    dropImages(replacedRefs);
    return clone(existing || value);
  }

  /** Deletes the store, all of its products and all of their uploaded photos. */
  async function deleteStore(id) {
    // BACKEND: delete from 'stores' (products cascade via the foreign key),
    // then remove the photos from object storage.
    const data = load();
    const store = data.stores.find((s) => s.id === id);
    if (!store) return false;
    const refs = [store.cover, store.logoImage];
    for (const p of data.products) if (p.storeId === id) refs.push(...p.images);
    data.stores = data.stores.filter((s) => s.id !== id);
    data.products = data.products.filter((p) => p.storeId !== id);
    persist();
    notify('data');
    await dropImages(refs);
    return true;
  }

  /* ========================================================== PRODUCTS == */

  async function getProducts(storeId) {
    // BACKEND: supabase.from('products').select('*').eq('store_id', storeId)
    return clone(load().products.filter((p) => p.storeId === storeId));
  }

  async function getAllProducts() {
    return clone(load().products);
  }

  async function getProduct(id) {
    const p = load().products.find((x) => x.id === id);
    return p ? clone(p) : null;
  }

  /**
   * Create or update a product. Photos that were removed from the product are
   * deleted from IndexedDB after the save succeeds.
   */
  async function saveProduct(input) {
    // BACKEND: upsert into 'products'. RLS checks the product's store belongs to the seller.
    const data = load();
    const { value, errors, ok } = validateProduct(input);
    if (!ok) throw fail('err.fix', null, errors);
    if (!data.stores.some((s) => s.id === value.storeId)) throw fail('err.storeGone');
    const existing = value.id ? data.products.find((p) => p.id === value.id) : null;
    const backup = JSON.stringify(data.products);
    let removed = [];
    if (existing) {
      removed = existing.images.filter((r) => !value.images.includes(r));
      Object.assign(existing, value, { createdAt: existing.createdAt, updatedAt: Date.now() });
    } else {
      const count = data.products.filter((p) => p.storeId === value.storeId).length;
      if (count >= LIMITS.maxProductsPerStore) throw fail('err.maxProducts', { n: LIMITS.maxProductsPerStore });
      const base = `${value.storeId}-${Mall.slugify(value.name.en || value.name.uz || value.name.ru) || 'item'}`;
      value.id = uniqueId(base, new Set(data.products.map((p) => p.id)));
      value.createdAt = value.updatedAt = Date.now();
      data.products.push(value);
    }
    try {
      persist();
    } catch (e) {
      data.products = JSON.parse(backup);   // roll back the in-memory change
      throw e;
    }
    notify('data');
    dropImages(removed);
    return clone(existing || value);
  }

  async function deleteProduct(id) {
    const data = load();
    const product = data.products.find((p) => p.id === id);
    if (!product) return false;
    data.products = data.products.filter((p) => p.id !== id);
    persist();
    notify('data');
    await dropImages(product.images);
    return true;
  }

  /* ================================================= import / export == */

  /** Full backup: data plus every uploaded photo as base64. */
  async function exportData() {
    const data = load();
    const ids = Mall.images ? Mall.images.collectIds(data) : [];
    const images = Mall.images ? await Mall.images.exportImages(ids) : {};
    return {
      app: 'lumina-mall',
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      stores: clone(data.stores),
      products: clone(data.products),
      images,
    };
  }

  function parseBackup(text) {
    if (text.length > LIMITS.importMB * 1024 * 1024) throw fail('err.importBig', { mb: LIMITS.importMB });
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { throw fail('err.importJson'); }
    const clean = sanitizeDataset(parsed);
    const imgs = Mall.images ? Mall.images.parseImages(parsed.images) : { records: [], skipped: 0 };
    // Drop references to photos that are not in the file.
    const have = new Set(imgs.records.map((r) => r.id));
    const keep = (ref) => !Mall.images || !Mall.images.isIdb(ref) || have.has(Mall.images.idOf(ref));
    clean.stores.forEach((s) => { if (!keep(s.cover)) s.cover = ''; if (!keep(s.logoImage)) s.logoImage = ''; });
    clean.products.forEach((p) => { p.images = p.images.filter(keep); });
    return { parsed, clean, imgs };
  }

  /** Preview an import without saving (for the confirmation dialog). */
  function previewImport(text) {
    const { parsed, clean, imgs } = parseBackup(text);
    return {
      stores: clean.stores.length,
      products: clean.products.length,
      images: imgs.records.length,
      skipped: (parsed.stores.length - clean.stores.length) + (parsed.products.length - clean.products.length) + imgs.skipped,
    };
  }

  /** Replace everything with an imported backup. Photos go back into IndexedDB with their ids. */
  async function importData(text) {
    const { clean, imgs } = parseBackup(text);
    if (!clean.stores.length) throw fail('err.importEmpty');
    if (Mall.imageStore) {
      await Mall.imageStore.clear();
      for (const r of imgs.records) await Mall.imageStore.save(r);
    }
    const previous = cache;
    cache = clean;
    try { persist(); } catch (e) { cache = previous; throw e; }
    notify('data');
    return { stores: clean.stores.length, products: clean.products.length, images: imgs.records.length };
  }

  /** Restore demo data and delete every uploaded photo. */
  async function resetToDemo() {
    if (Mall.imageStore) await Mall.imageStore.clear();
    cache = global.MALL_DEMO_DATA.build();
    persist();
    notify('data');
    return { stores: cache.stores.length, products: cache.products.length };
  }

  async function getStats() {
    const { stores, products } = load();
    const categories = {};
    for (const s of stores) {
      const c = Mall.L ? Mall.L(s.category) : s.category.en;
      categories[c] = (categories[c] || 0) + 1;
    }
    const floors = {};
    for (let f = 1; f <= FLOORS; f++) floors[f] = stores.filter((s) => s.floor === f).length;
    return { stores: stores.length, products: products.length, inStock: products.filter((p) => p.inStock).length, categories, floors };
  }

  /** Approximate localStorage usage of this site (photos are counted separately). */
  function usage() {
    let bytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) bytes += (k.length + (localStorage.getItem(k) || '').length) * 2;
      }
    } catch (e) { /* ignore */ }
    return { bytes, quota: 5 * 1024 * 1024 };
  }

  /* ============================================================== CART ==
   * The cart stays in the visitor's browser even with a real backend
   * (like most shops do for guests). With accounts, sync it to a `carts` table. */

  function getCart() {
    try {
      const raw = JSON.parse(readKey(CART_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((i) => i && cleanId(i.productId))
        .map((i) => ({ productId: cleanId(i.productId), qty: Math.round(cleanNumber(i.qty, 1, 99, 1)) }))
        .slice(0, 100);
    } catch (e) {
      return [];
    }
  }

  function setCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) { /* storage full or disabled: the cart just won't persist */ }
    notify('cart');
  }

  /* ========================================================== exports == */
  Mall.storage = {
    getStores, getStore, saveStore, deleteStore,
    getProducts, getAllProducts, getProduct, saveProduct, deleteProduct,
    exportData, importData, previewImport, resetToDemo, getStats, usage,
    getCart, setCart,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
  Mall.validate = { store: validateStore, product: validateProduct, image: cleanImageRef, text: cleanText, localized: cleanLocalized };
})(window);

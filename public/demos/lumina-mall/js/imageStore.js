/* =========================================================================
 * Lumina Mall — image storage & processing
 * -------------------------------------------------------------------------
 * localStorage holds only ~5 MB of *text*, far too small for photos. So:
 *   - product/store DATA (text) stays in localStorage (js/storage.js)
 *   - uploaded PHOTOS live here, in IndexedDB, as compressed Blobs
 *   - the data only keeps image references:
 *       "idb:<id>"                  an uploaded photo stored in IndexedDB
 *       "assets/images/…"           a photo bundled with the site
 *       "https://…"                 an external image link
 *
 * Every uploaded photo is stored twice: a "full" version (max 1200 px) and a
 * small "thumb" (max 400 px) for fast product grids.
 *
 * Public interface (small on purpose so a backend can replace it):
 *   Mall.imageStore.save({ full, thumb, width, height }) -> id
 *   Mall.imageStore.get(id)       -> record | null
 *   Mall.imageStore.delete(id) / deleteMany(ids) / clear()
 *   Mall.images.process(file)     -> { full, thumb, width, height }   (client compression)
 *   Mall.images.url(ref, variant) -> URL usable in <img src>         (variant: 'full' | 'thumb' | 'sm')
 *   Mall.images.bind(img, ref, variant)  lazy-load into an <img> with skeleton + fallback
 *
 * BACKEND: to move photos to Supabase Storage / Firebase Storage / S3:
 *   save()   -> upload `full` and `thumb` (e.g. supabase.storage.from('images').upload(path, blob))
 *               and return a public URL instead of "idb:<id>" (store that URL in the data)
 *   get()    -> not needed any more (the browser loads the public URL directly)
 *   delete() -> supabase.storage.from('images').remove([path])
 *   url()    -> already handles https:// refs, so nothing changes in the pages.
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = (global.Mall = global.Mall || {});
  const DB_NAME = 'lumina-images';
  const STORE = 'images';
  const VERSION = 1;

  const LIMITS = Object.freeze({
    maxFileMB: 10,            // checked before compression
    fullPx: 1200,             // longest side of the stored photo
    thumbPx: 400,             // longest side of the thumbnail
    quality: 0.8,
    thumbQuality: 0.72,
    maxPerProduct: 6,
    types: ['image/jpeg', 'image/png', 'image/webp'],
  });

  /* ================================================== IndexedDB layer */
  let dbPromise = null;
  let memory = null;   // fallback Map when IndexedDB is unavailable (private mode, old browsers)

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      if (!('indexedDB' in global)) { memory = new Map(); resolve(null); return; }
      let req;
      try { req = indexedDB.open(DB_NAME, VERSION); } catch (e) { memory = new Map(); resolve(null); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { memory = new Map(); resolve(null); };
      req.onblocked = () => { memory = new Map(); resolve(null); };
    });
    return dbPromise;
  }

  /** Run one transaction and resolve with the request result. */
  async function tx(mode, fn) {
    const db = await open();
    if (!db) return fn(null);
    return new Promise((resolve, reject) => {
      let result;
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      const req = fn(store);
      if (req) req.onsuccess = () => { result = req.result; };
      t.oncomplete = () => resolve(result);
      t.onabort = t.onerror = () => {
        const err = t.error || (req && req.error) || new Error('IndexedDB error');
        if (err && (err.name === 'QuotaExceededError' || /quota/i.test(err.message))) err.code = 'QUOTA';
        reject(err);
      };
    });
  }

  const newId = () => {
    const r = new Uint32Array(2);
    crypto.getRandomValues(r);
    return `${Date.now().toString(36)}-${r[0].toString(36)}${r[1].toString(36)}`;
  };

  const imageStore = {
    /** true when photos persist across reloads (IndexedDB works). */
    async isPersistent() { return !!(await open()); },

    async save({ full, thumb, width, height, id }) {
      const rec = { id: id || newId(), full, thumb: thumb || full, type: full.type, width, height, size: full.size + (thumb ? thumb.size : 0), createdAt: Date.now() };
      const db = await open();
      if (!db) { memory.set(rec.id, rec); return rec.id; }
      await tx('readwrite', (s) => s.put(rec));
      return rec.id;
    },

    async get(id) {
      const db = await open();
      if (!db) return memory.get(id) || null;
      return (await tx('readonly', (s) => s.get(id))) || null;
    },

    async delete(id) {
      if (!id) return;
      revoke(id);
      const db = await open();
      if (!db) { memory.delete(id); return; }
      await tx('readwrite', (s) => s.delete(id));
    },

    async deleteMany(ids) {
      const list = Array.from(new Set(ids || [])).filter(Boolean);
      if (!list.length) return;
      list.forEach(revoke);
      const db = await open();
      if (!db) { list.forEach((id) => memory.delete(id)); return; }
      await tx('readwrite', (s) => { list.forEach((id) => s.delete(id)); return null; });
    },

    async clear() {
      for (const id of Array.from(urlCache.keys())) revoke(id.split('|')[0]);
      const db = await open();
      if (!db) { memory.clear(); return; }
      await tx('readwrite', (s) => s.clear());
    },

    async listIds() {
      const db = await open();
      if (!db) return Array.from(memory.keys());
      return (await tx('readonly', (s) => s.getAllKeys())) || [];
    },

    /** Count and total bytes of stored photos (for the admin storage meter). */
    async stats() {
      const db = await open();
      const all = db ? (await tx('readonly', (s) => s.getAll())) || [] : Array.from(memory.values());
      return { count: all.length, bytes: all.reduce((n, r) => n + (r.size || 0), 0) };
    },
  };

  /* ============================================ object URL cache (LRU)
   * Object URLs keep their Blob alive until revoked. We cache them per
   * id+variant, cap the cache, and revoke what falls out or gets deleted. */
  const urlCache = new Map();   // "id|variant" -> objectURL (Map keeps insertion order = LRU)
  const MAX_URLS = 160;

  function revoke(id) {
    for (const variant of ['full', 'thumb']) {
      const key = `${id}|${variant}`;
      const url = urlCache.get(key);
      if (url) { URL.revokeObjectURL(url); urlCache.delete(key); }
    }
  }

  async function idbUrl(id, variant) {
    const key = `${id}|${variant}`;
    if (urlCache.has(key)) {
      const url = urlCache.get(key);
      urlCache.delete(key);
      urlCache.set(key, url);     // mark as recently used
      return url;
    }
    const rec = await imageStore.get(id);
    if (!rec) return null;
    const url = URL.createObjectURL(variant === 'thumb' ? rec.thumb || rec.full : rec.full);
    urlCache.set(key, url);
    while (urlCache.size > MAX_URLS) {
      const [oldKey, oldUrl] = urlCache.entries().next().value;
      URL.revokeObjectURL(oldUrl);
      urlCache.delete(oldKey);
    }
    return url;
  }
  global.addEventListener('pagehide', () => { for (const url of urlCache.values()) URL.revokeObjectURL(url); urlCache.clear(); });

  /* ======================================================= references */
  const isIdb = (ref) => typeof ref === 'string' && ref.startsWith('idb:');
  const idOf = (ref) => (isIdb(ref) ? ref.slice(4) : '');
  const toRef = (id) => `idb:${id}`;

  /** Bundled asset paths have smaller variants on disk. */
  function assetVariant(ref, variant) {
    if (variant === 'thumb' && /^assets\/images\/products\/[^/]+\.jpg$/.test(ref)) return ref.replace('products/', 'products/thumbs/');
    if ((variant === 'sm' || variant === 'thumb') && /^assets\/images\/stores\/[^/]+\.jpg$/.test(ref) && !ref.endsWith('-sm.jpg')) return ref.replace(/\.jpg$/, '-sm.jpg');
    return ref;
  }

  /** Resolve any image ref to a URL usable in <img src>. Returns null for empty/missing refs. */
  async function url(ref, variant = 'full') {
    if (!ref) return null;
    if (isIdb(ref)) return idbUrl(idOf(ref), variant === 'full' ? 'full' : 'thumb');
    return assetVariant(ref, variant);
  }

  /* ======================================================= lazy binding */
  let io = null;
  const pending = new WeakMap();
  function observer() {
    if (io || !('IntersectionObserver' in global)) return io;
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const job = pending.get(e.target);
        if (job) { pending.delete(e.target); job(); }
      }
    }, { rootMargin: '240px 0px' });
    return io;
  }

  /**
   * Load `ref` into an <img> lazily. The img's parent gets `is-loading` (skeleton
   * shimmer), then `is-loaded`, or `is-error` (CSS shows the fallback).
   * Calling bind() again on the same img with another ref is safe (latest wins).
   */
  function bind(img, ref, variant = 'thumb', { eager = false } = {}) {
    const box = img.parentElement;
    img.dataset.ref = ref || '';
    if (box) { box.classList.add('is-loading'); box.classList.remove('is-loaded', 'is-error'); }
    const done = (ok) => { if (box) { box.classList.remove('is-loading'); box.classList.add(ok ? 'is-loaded' : 'is-error'); } };
    if (!ref) { done(false); return; }
    const run = async () => {
      try {
        const src = await url(ref, variant);
        if (img.dataset.ref !== (ref || '')) return;      // a newer bind() replaced this one
        if (!src) { done(false); return; }
        img.onload = () => done(true);
        img.onerror = () => done(false);
        img.src = src;
        if (img.complete && img.naturalWidth) done(true);
      } catch (e) { done(false); }
    };
    const obs = !eager && observer();
    if (obs) { pending.set(img, run); obs.observe(img); }
    else run();
  }

  /* ======================================================= processing */
  let webpOk = null;
  function canEncodeWebP() {
    if (webpOk == null) {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 2;
        webpOk = c.toDataURL('image/webp').startsWith('data:image/webp');
      } catch (e) { webpOk = false; }
    }
    return webpOk;
  }

  /** Read the EXIF orientation (1–8) of a JPEG. Only used for browsers that do not auto-rotate. */
  function readOrientation(buf) {
    const v = new DataView(buf);
    if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return 1;
    let off = 2;
    while (off + 4 < v.byteLength) {
      const marker = v.getUint16(off);
      const len = v.getUint16(off + 2);
      if (marker === 0xffe1 && v.getUint32(off + 4) === 0x45786966) {   // "Exif"
        const tiff = off + 10;
        const little = v.getUint16(tiff) === 0x4949;
        const ifd = tiff + v.getUint32(tiff + 4, little);
        const n = v.getUint16(ifd, little);
        for (let i = 0; i < n; i++) {
          const entry = ifd + 2 + i * 12;
          if (v.getUint16(entry, little) === 0x0112) return v.getUint16(entry + 8, little) || 1;
        }
        return 1;
      }
      if ((marker & 0xff00) !== 0xff00) break;
      off += 2 + len;
    }
    return 1;
  }

  /**
   * Decode a file with its EXIF orientation applied. Modern browsers do this
   * in createImageBitmap(…, { imageOrientation: 'from-image' }); older ones get
   * a manual transform from the parsed EXIF tag.
   */
  async function decode(file) {
    if ('createImageBitmap' in global) {
      try {
        const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
        return { source: bmp, width: bmp.width, height: bmp.height, orientation: 1, close: () => bmp.close && bmp.close() };
      } catch (e) { /* fall through to <img> */ }
    }
    const autoRotates = global.CSS && CSS.supports && CSS.supports('image-orientation', 'from-image');
    const orientation = autoRotates ? 1 : readOrientation(await file.arrayBuffer());
    const objUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('decode'));
        i.src = objUrl;
      });
      const swap = orientation >= 5;
      return { source: img, width: swap ? img.naturalHeight : img.naturalWidth, height: swap ? img.naturalWidth : img.naturalHeight, orientation, close() {} };
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  }

  /** Draw the decoded image into a canvas no larger than `max` px, applying the orientation. */
  function draw(dec, max) {
    const scale = Math.min(1, max / Math.max(dec.width, dec.height));
    const w = Math.max(1, Math.round(dec.width * scale));
    const h = Math.max(1, Math.round(dec.height * scale));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    const o = dec.orientation;
    if (o > 1) {
      // Manual EXIF transform (fallback path only).
      const t = { 2: [-1, 0, 0, 1, w, 0], 3: [-1, 0, 0, -1, w, h], 4: [1, 0, 0, -1, 0, h], 5: [0, 1, 1, 0, 0, 0], 6: [0, 1, -1, 0, w, 0], 7: [0, -1, -1, 0, w, h], 8: [0, -1, 1, 0, 0, h] }[o];
      if (t) ctx.setTransform(...t);
    }
    const dw = o >= 5 ? h : w, dh = o >= 5 ? w : h;
    ctx.drawImage(dec.source, 0, 0, dw, dh);
    return c;
  }

  function toBlob(canvas, quality) {
    const type = canEncodeWebP() ? 'image/webp' : 'image/jpeg';
    return new Promise((resolve, reject) => {
      if (type === 'image/jpeg') {
        // JPEG has no transparency: flatten on white so transparent PNGs don't turn black.
        const flat = document.createElement('canvas');
        flat.width = canvas.width; flat.height = canvas.height;
        const fx = flat.getContext('2d');
        fx.fillStyle = '#ffffff';
        fx.fillRect(0, 0, flat.width, flat.height);
        fx.drawImage(canvas, 0, 0);
        canvas = flat;
      }
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), type, quality);
    });
  }

  /** Make an Error that carries an i18n key and variables for a friendly message. */
  function friendly(key, vars) {
    const e = new Error(Mall.t ? Mall.t(key, vars) : key);
    e.i18nKey = key;
    e.vars = vars;
    return e;
  }

  /**
   * Validate + compress an image file. `onProgress(0..1)` reports the stages.
   * Resolves { full: Blob, thumb: Blob, width, height }.
   */
  async function process(file, onProgress = () => {}) {
    const name = (file && file.name) || 'image';
    if (!file || !LIMITS.types.includes(file.type)) throw friendly('img.badType', { file: name });
    if (file.size > LIMITS.maxFileMB * 1024 * 1024) throw friendly('img.tooBig', { file: name, mb: LIMITS.maxFileMB });
    onProgress(0.15);
    let dec;
    try { dec = await decode(file); } catch (e) { throw friendly('img.readFail', { file: name }); }
    onProgress(0.45);
    try {
      const fullCanvas = draw(dec, LIMITS.fullPx);
      const full = await toBlob(fullCanvas, LIMITS.quality);
      onProgress(0.75);
      const thumb = await toBlob(draw({ source: fullCanvas, width: fullCanvas.width, height: fullCanvas.height, orientation: 1 }, LIMITS.thumbPx), LIMITS.thumbQuality);
      onProgress(0.9);
      return { full, thumb, width: fullCanvas.width, height: fullCanvas.height };
    } finally {
      dec.close();
    }
  }

  /* ====================================================== export/import */
  const blobToDataURL = (blob) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

  function dataURLToBlob(dataUrl) {
    const m = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
    if (!m) return null;
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: m[1] });
  }

  /** Every "idb:" reference used by a dataset. */
  function collectIds(data) {
    const ids = new Set();
    const add = (ref) => { if (isIdb(ref)) ids.add(idOf(ref)); };
    for (const s of data.stores || []) { add(s.cover); add(s.logoImage); }
    for (const p of data.products || []) (p.images || []).forEach(add);
    return Array.from(ids);
  }

  /** { id: { full, thumb, width, height } } with base64 data URLs, for the JSON backup. */
  async function exportImages(ids) {
    const out = {};
    for (const id of ids) {
      const rec = await imageStore.get(id);
      if (!rec) continue;
      out[id] = { full: await blobToDataURL(rec.full), thumb: await blobToDataURL(rec.thumb || rec.full), width: rec.width, height: rec.height };
    }
    return out;
  }

  /** Validate and decode an images map from a backup. Returns { records, skipped }. */
  function parseImages(map) {
    const records = [];
    let skipped = 0;
    if (!map || typeof map !== 'object') return { records, skipped };
    for (const [id, v] of Object.entries(map)) {
      if (!/^[a-z0-9-]{4,64}$/i.test(id) || !v) { skipped++; continue; }
      const full = dataURLToBlob(v.full);
      const thumb = dataURLToBlob(v.thumb) || full;
      if (!full || full.size > 8 * 1024 * 1024) { skipped++; continue; }
      records.push({ id, full, thumb, width: Number(v.width) || 0, height: Number(v.height) || 0 });
    }
    return { records, skipped };
  }

  Mall.imageStore = imageStore;
  Mall.images = { LIMITS, process, url, bind, isIdb, idOf, toRef, collectIds, exportImages, parseImages, blobToDataURL, readOrientation };
})(window);

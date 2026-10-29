/* =========================================================================
 * Lumina Mall — smart multilingual search
 * -------------------------------------------------------------------------
 * One search box, three languages at once. Typing "одежда", "kiyim" or
 * "clothes" finds the same store whatever the interface language is,
 * because every store/product is indexed in ru + uz + en simultaneously.
 *
 * Pipeline
 *   1. normalize()   lowercase, ё→е, Uzbek apostrophes (o' o` oʻ ʻ ’) unified
 *                    and dropped, punctuation stripped, spaces collapsed
 *   2. translit()    Cyrillic → Latin (Uzbek rules: ў→o', қ→q, ғ→g', ҳ→h…),
 *                    so "дўкон" and "do'kon" become the same "dokon", and a
 *                    Latin query like "kofe" also hits Russian "кофе"
 *   3. tokenize()    every text gives both its normalized and transliterated tokens
 *   4. matchToken()  exact > prefix (live typing) > substring > fuzzy
 *                    (Levenshtein ≤1 for words of 5+ letters, ≤2 for 8+)
 *   5. query()       all query words must match (AND); scores are weighted by
 *                    field (name > category > keywords > product > description)
 *
 * The functions are pure (no DOM), so they are easy to test or reuse on a
 * server later.
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = (global.Mall = global.Mall || {});
  const LANGS = ['ru', 'uz', 'en'];

  /* ---------------------------------------------------------- normalize */
  // All the ways people type the Uzbek apostrophe (o‘, g‘ and the tutuq belgisi ʼ).
  const APOSTROPHES = /['`´ʹʻʼʽˈ‘’‛′]/g;

  /** Lowercase, unify letters and apostrophes, strip punctuation, collapse spaces. */
  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFKC')
      .replace(/ё/g, 'е')
      .replace(APOSTROPHES, '')          // o'zbek / oʻzbek / o`zbek → ozbek
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* -------------------------------------------------------- translit */
  // Uzbek Cyrillic → Latin (official 1995 alphabet). Russian letters map to
  // their usual Latin form, which makes cross-script matching work for both.
  const CYR = {
    а: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ж: 'j', з: 'z', и: 'i', й: 'y',
    к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ў: 'o', ф: 'f', х: 'x', ҳ: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '',
    э: 'e', ю: 'yu', я: 'ya',
  };

  /** Transliterate Cyrillic to Latin. Input should already be normalized (lowercase, ё→е). */
  function translit(text) {
    let out = '';
    const s = String(text);
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      // Word-initial "е" is "ye" in Uzbek Latin (ер → yer); elsewhere "e".
      if (ch === 'е' && (i === 0 || s[i - 1] === ' ')) { out += 'ye'; continue; }
      out += ch in CYR ? CYR[ch] : ch;
    }
    return out;
  }

  /** Latin spelling variants that should count as the same word. */
  function foldLatin(word) {
    return word
      .replace(/ye/g, 'e')     // yer/er, ye/e at the start of words
      .replace(/kh/g, 'x')     // khalq → xalq
      .replace(/ts/g, 's');
  }

  /** Tokens of a text, in both scripts (deduplicated). */
  function tokenize(text) {
    const n = normalize(text);
    if (!n) return [];
    const set = new Set();
    for (const w of n.split(' ')) {
      if (!w) continue;
      set.add(w);
      const lat = translit(w);
      set.add(lat);
      set.add(foldLatin(lat));
    }
    return Array.from(set);
  }

  /* ------------------------------------------------------- levenshtein */
  /** Edit distance with an early exit once it exceeds `max`. */
  function levenshtein(a, b, max = 2) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let rowMin = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (cur[j] < rowMin) rowMin = cur[j];
      }
      if (rowMin > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  /** How many typos we forgive for a word of this length. */
  const allowedTypos = (len) => (len >= 8 ? 2 : len >= 5 ? 1 : 0);

  /**
   * Score one query token against one indexed token.
   *   3   exact
   *   2.2 prefix (the user is still typing)
   *   1.4 substring (3+ letters)
   *   1   fuzzy match, or fuzzy prefix while typing
   *   0   no match
   */
  function matchToken(q, t) {
    if (q === t) return 3;
    if (q.length >= 2 && t.startsWith(q)) return 2.2;
    if (q.length >= 3 && t.includes(q)) return 1.4;
    const typos = allowedTypos(q.length);
    if (!typos) return 0;
    if (levenshtein(q, t, typos) <= typos) return 1;
    // Typing a long word with a typo: compare with the same-length start of the token.
    if (t.length > q.length && levenshtein(q, t.slice(0, q.length), 1) <= 1) return 0.8;
    return 0;
  }

  /** Best score of a query token against a list of tokens. */
  function bestScore(qTokenForms, tokens) {
    let best = 0;
    for (const q of qTokenForms) {
      for (const t of tokens) {
        const s = matchToken(q, t);
        if (s > best) { best = s; if (best === 3) return best; }
      }
    }
    return best;
  }

  /* ------------------------------------------------------------ index */
  const WEIGHT = { name: 5, category: 4, keywords: 3, product: 2.6, description: 1 };

  /** Split comma-separated keyword strings into separate phrases. */
  const phrases = (v) => String(v || '').split(/[,;]+/).map((s) => s.trim()).filter(Boolean);

  /**
   * Build a search index from stores and products.
   * Each entry: { store, fields: [{ kind, lang, text, tokens }], products: [{ product, fields }] }
   */
  function buildIndex(stores, products) {
    const byStore = new Map();
    for (const p of products) {
      if (!byStore.has(p.storeId)) byStore.set(p.storeId, []);
      byStore.get(p.storeId).push(p);
    }
    return stores.map((store) => {
      const fields = [];
      for (const lang of LANGS) {
        const add = (kind, text) => { if (text) fields.push({ kind, lang, text, tokens: tokenize(text) }); };
        add('name', store.name && store.name[lang]);
        add('category', store.category && store.category[lang]);
        add('description', store.description && store.description[lang]);
        for (const kw of phrases(store.keywords && store.keywords[lang])) add('keywords', kw);
      }
      const prods = (byStore.get(store.id) || []).map((product) => {
        const pf = [];
        for (const lang of LANGS) {
          const add = (text) => { if (text) pf.push({ kind: 'product', lang, text, tokens: tokenize(text) }); };
          add(product.name && product.name[lang]);
          for (const kw of phrases(product.keywords && product.keywords[lang])) add(kw);
        }
        return { product, fields: pf };
      });
      return { store, fields, products: prods };
    });
  }

  /**
   * Search the index.
   * Returns [{ store, score, match: { kind, lang, text } | null, products: [{ product, text, lang }] }]
   * sorted by score. Every query word has to match somewhere in the store or
   * one of its products (AND), but different words may match different fields.
   */
  function query(index, raw, { limit = 20 } = {}) {
    const words = normalize(raw).split(' ').filter(Boolean);
    if (!words.length) return [];
    const qForms = words.map((w) => {
      const lat = translit(w);
      return Array.from(new Set([w, lat, foldLatin(lat)]));
    });

    const results = [];
    for (const entry of index) {
      let total = 0;
      let bestField = null, bestFieldScore = 0;
      let allMatched = true;
      const productHits = new Map();

      for (const forms of qForms) {
        let wordBest = 0;
        for (const f of entry.fields) {
          const s = bestScore(forms, f.tokens) * WEIGHT[f.kind];
          if (s > wordBest) wordBest = s;
          if (s > bestFieldScore) { bestFieldScore = s; bestField = f; }
        }
        for (const pe of entry.products) {
          for (const f of pe.fields) {
            const s = bestScore(forms, f.tokens) * WEIGHT.product;
            if (s > 0) {
              const prev = productHits.get(pe.product.id);
              if (!prev || s > prev.score) productHits.set(pe.product.id, { product: pe.product, text: f.text, lang: f.lang, score: s });
              if (s > wordBest) wordBest = s;
            }
          }
        }
        if (!wordBest) { allMatched = false; break; }
        total += wordBest;
      }
      if (!allMatched) continue;

      const prods = Array.from(productHits.values()).sort((a, b) => b.score - a.score).slice(0, 3);
      results.push({
        store: entry.store,
        score: total,
        match: bestField && bestFieldScore >= (prods[0] ? prods[0].score : 0) ? { kind: bestField.kind, lang: bestField.lang, text: bestField.text } : null,
        products: prods,
      });
    }
    return results.sort((a, b) => b.score - a.score || Mall.L(a.store.name).localeCompare(Mall.L(b.store.name))).slice(0, limit);
  }

  /** Does a single text (in any language) match the query? Used by small filters. */
  function matches(raw, texts) {
    const words = normalize(raw).split(' ').filter(Boolean);
    if (!words.length) return true;
    const tokens = texts.flatMap((t) => tokenize(t));
    return words.every((w) => {
      const lat = translit(w);
      return bestScore([w, lat, foldLatin(lat)], tokens) > 0;
    });
  }

  /* --------------------------------------------------------- highlight */
  /**
   * Split `text` into segments [{ text, hit }] where `hit` marks the parts that
   * match the query. Works on the original string by normalizing it character
   * by character and keeping a map back to the original positions.
   */
  function highlight(text, raw) {
    const words = normalize(raw).split(' ').filter((w) => w.length >= 1);
    const src = String(text || '');
    if (!words.length || !src) return [{ text: src, hit: false }];

    // Build normalized string + index map (one normalized char → original index).
    let norm = '';
    const map = [];
    for (let i = 0; i < src.length; i++) {
      let ch = src[i].toLowerCase();
      if (ch === 'ё') ch = 'е';
      if (APOSTROPHES.test(src[i])) { APOSTROPHES.lastIndex = 0; continue; }
      APOSTROPHES.lastIndex = 0;
      norm += ch;
      map.push(i);
    }
    const marks = new Array(src.length).fill(false);
    const variants = new Set();
    for (const w of words) { variants.add(w); }
    // Also try matching the Latin form of the text against the query (cross-script highlight).
    for (const w of variants) {
      let from = 0;
      while (w && (from = norm.indexOf(w, from)) !== -1) {
        for (let k = from; k < from + w.length; k++) marks[map[k]] = true;
        from += w.length;
      }
    }
    if (!marks.includes(true)) {
      // Fuzzy fallback: mark whole words of the text that fuzzy-match a query word.
      const re = /[\p{L}\p{N}'’ʻ`]+/gu;
      let m;
      while ((m = re.exec(src))) {
        const wTokens = tokenize(m[0]);
        if (words.some((w) => bestScore([w, translit(w), foldLatin(translit(w))], wTokens) > 0)) {
          for (let k = m.index; k < m.index + m[0].length; k++) marks[k] = true;
        }
      }
    }
    // Apostrophes were skipped above; join them to the highlight when both neighbours are hits (Oʻyinch…).
    for (let i = 1; i < src.length - 1; i++) {
      APOSTROPHES.lastIndex = 0;
      if (!marks[i] && marks[i - 1] && marks[i + 1] && APOSTROPHES.test(src[i])) marks[i] = true;
    }
    APOSTROPHES.lastIndex = 0;
    const out = [];
    for (let i = 0; i < src.length; i++) {
      const last = out[out.length - 1];
      if (last && last.hit === marks[i]) last.text += src[i];
      else out.push({ text: src[i], hit: marks[i] });
    }
    return out;
  }

  Mall.search = { normalize, translit, tokenize, levenshtein, matchToken, buildIndex, query, matches, highlight };
})(window);

/* =========================================================================
 * Lumina Mall — admin authentication (DEMO-LEVEL ONLY)
 * -------------------------------------------------------------------------
 * HONEST DISCLAIMER: this is NOT real security. It runs entirely in the
 * browser with no server, so a person with DevTools can read this code,
 * set the session flag by hand or edit localStorage directly. It keeps
 * casual visitors out of the admin screen during a demo, nothing more.
 *
 * What it does do properly:
 *   - the password is never stored in plain text (salted SHA-256 in config.js)
 *   - failed logins are rate-limited (lockout that doubles each time)
 *   - every attempt has a small fixed delay (slows down guessing in the UI)
 *   - sessions expire after inactivity and live in sessionStorage
 *     (closing the tab logs you out)
 *
 * BACKEND: replace this whole file with Supabase Auth / Firebase Auth:
 *   const { error } = await supabase.auth.signInWithPassword({ email, password });
 * Then authorisation is enforced by Row Level Security on the server, and
 * rate limiting by the auth provider. See js/storage.js and README.md.
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = global.Mall;
  const CFG = global.MALL_CONFIG;
  const A = CFG.ADMIN;
  const SESSION_KEY = CFG.STORAGE_PREFIX + 'admin-session';
  const LIMIT_KEY = CFG.STORAGE_PREFIX + 'auth-limit';
  const MAX_LOCK_SECONDS = 15 * 60;

  /**
   * Key stretching: SHA-256 applied PASSWORD_ITERATIONS times. The hash is public
   * (it ships in config.js), so a single fast hash could be brute-forced offline in
   * seconds; 20 000 rounds makes every guess ~20 000x more expensive. Still: pick a
   * long, unique password.
   */
  function hash(password) {
    let h = Mall.sha256(A.PASSWORD_SALT + String(password));
    for (let i = 1; i < A.PASSWORD_ITERATIONS; i++) h = Mall.sha256(h + A.PASSWORD_SALT);
    return h;
  }

  /* ------------------------------------------------------ rate limit */
  function readLimit() {
    try {
      const v = JSON.parse(localStorage.getItem(LIMIT_KEY) || 'null');
      if (v && typeof v === 'object') return { fails: v.fails | 0, lockedUntil: Number(v.lockedUntil) || 0, lockouts: v.lockouts | 0 };
    } catch (e) { /* ignore */ }
    return { fails: 0, lockedUntil: 0, lockouts: 0 };
  }
  function writeLimit(v) {
    try { localStorage.setItem(LIMIT_KEY, JSON.stringify(v)); } catch (e) { /* ignore */ }
  }

  /** Seconds left in the current lockout (0 when not locked). */
  function lockRemaining() {
    const { lockedUntil } = readLimit();
    return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
  }

  /* --------------------------------------------------------- session */
  function readSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return s && typeof s === 'object' ? s : null;
    } catch (e) { return null; }
  }
  function writeSession(s) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }

  function isAuthenticated() {
    const s = readSession();
    return !!(s && s.exp > Date.now() && s.v === A.PASSWORD_HASH.slice(0, 12));
  }

  let lastTouch = 0;
  /** Extend the idle timeout on activity (throttled to once every 15 s). */
  function touch() {
    const now = Date.now();
    if (now - lastTouch < 15000) return;
    lastTouch = now;
    const s = readSession();
    if (s && s.exp > now) writeSession({ ...s, exp: now + A.SESSION_MINUTES * 60000 });
  }

  function logout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  /**
   * Try a password. Resolves { ok } or { ok: false, reason: 'locked' | 'wrong', wait, left }.
   */
  async function login(password) {
    const locked = lockRemaining();
    if (locked > 0) return { ok: false, reason: 'locked', wait: locked };

    await Mall.sleep(450);   // constant delay on every attempt

    const pw = String(password || '').slice(0, 200);
    const ok = pw.length > 0 && Mall.safeEqual(hash(pw), A.PASSWORD_HASH);
    const limit = readLimit();

    if (ok) {
      writeLimit({ fails: 0, lockedUntil: 0, lockouts: 0 });
      const token = Mall.uid('s');
      // `v` ties the session to the current password: changing PASSWORD_HASH logs everyone out.
      writeSession({ token, exp: Date.now() + A.SESSION_MINUTES * 60000, v: A.PASSWORD_HASH.slice(0, 12) });
      return { ok: true };
    }

    limit.fails += 1;
    if (limit.fails >= A.MAX_ATTEMPTS) {
      const seconds = Math.min(MAX_LOCK_SECONDS, A.LOCKOUT_SECONDS * Math.pow(2, limit.lockouts));
      limit.lockedUntil = Date.now() + seconds * 1000;
      limit.lockouts += 1;
      limit.fails = 0;
      writeLimit(limit);
      return { ok: false, reason: 'locked', wait: seconds };
    }
    writeLimit(limit);
    return { ok: false, reason: 'wrong', left: A.MAX_ATTEMPTS - limit.fails };
  }

  /** Helper for changing the password: run Mall.auth.makeHash('new password') in the console. */
  function makeHash(password) {
    const value = hash(password);
    console.info('Paste this into PASSWORD_HASH in js/config.js:\n' + value);
    return value;
  }

  /** True while config.js still holds the hash of the shipped default password "admin123". */
  const DEFAULT_HASH = 'ffa4e102db48f3f724ffd771e81cb014571933fb7678f9a2c6b70bf53af5737f';
  const usesDefaultPassword = () => A.PASSWORD_HASH === DEFAULT_HASH;

  Mall.auth = { login, logout, isAuthenticated, touch, lockRemaining, makeHash, usesDefaultPassword };
})(window);

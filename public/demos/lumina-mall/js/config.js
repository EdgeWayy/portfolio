/* =========================================================================
 * Lumina Mall — site configuration
 * -------------------------------------------------------------------------
 * Everything you are likely to tweak lives here: mall info, currency,
 * the admin password hash and the login rate-limit settings.
 * This file must be loaded first on every page.
 * ========================================================================= */
(function (global) {
  'use strict';

  global.MALL_CONFIG = Object.freeze({
    /* Keep false in production. When true, Mall.log() prints to the console. */
    DEBUG: false,

    /* Mall facts. Translated texts (address, hours, tagline) live in js/i18n.js
       under "mall.*" so they follow the interface language. */
    MALL: Object.freeze({
      name: 'Lumina Mall',
      phone: '+998 90 123-45-67',
      email: 'hello@lumina-mall.example',
      parkingSpaces: 640,
      visitorsPerDay: 12000,
      year: 2026,
    }),

    /* Prices are whole Uzbek so'm (UZS). Number formatting follows the active
       language (js/utils.js → Mall.formatPrice); the currency word comes from i18n. */
    CURRENCY: 'UZS',
    LOCALE: 'ru-RU',

    /* Prefix for every localStorage / sessionStorage key used by the site. */
    STORAGE_PREFIX: 'lumina:',

    /* ---------------------------------------------------------------------
     * ADMIN PASSWORD (default password: "admin123")
     *
     *   >>> CHANGE THIS BEFORE SHOWING THE SITE TO ANYONE. <<<
     *
     * The password itself is NOT stored here, only a salted, key-stretched
     * hash (SHA-256 repeated PASSWORD_ITERATIONS times, see js/auth.js).
     * To set a new password:
     *   1. Open admin.html, press F12 and in the Console run:
     *        Mall.auth.makeHash('your-new-password')
     *   2. Paste the printed hash into PASSWORD_HASH below and save.
     *   (No browser handy? The README has a one-line Node.js command.)
     * Use a long password you don't use anywhere else.
     *
     * IMPORTANT, AN HONEST WARNING: this is demo-level protection, NOT real
     * security. The site has no server, so everything (this hash, the
     * session flag, the data in localStorage) lives in the visitor's own
     * browser and anyone with DevTools can bypass it. Hashing only stops
     * the password from being readable in plain text in the source code.
     * Real protection needs server-side auth (Supabase Auth, Firebase Auth,
     * your own backend). See README.md, "Roadmap".
     * ------------------------------------------------------------------- */
    ADMIN: Object.freeze({
      PASSWORD_SALT: 'lumina-mall::v2',
      PASSWORD_ITERATIONS: 20000,
      PASSWORD_HASH: 'ffa4e102db48f3f724ffd771e81cb014571933fb7678f9a2c6b70bf53af5737f',
      SESSION_MINUTES: 30,      // idle timeout of an admin session
      MAX_ATTEMPTS: 5,          // failed logins before a lockout
      LOCKOUT_SECONDS: 30,      // first lockout; doubles each time (capped at 15 min)
    }),

    /* Upload limits for product images (they are resized and stored as base64). */
    IMAGES: Object.freeze({
      MAX_FILE_MB: 5,
      MAX_DIMENSION: 640,
      JPEG_QUALITY: 0.82,
    }),
  });
})(window);

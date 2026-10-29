# Security review

Date: 2026-10-30. Scope: the portfolio (`index.html`, `src/`, `public/404.html`), the six demo copies in
`public/demos/`, the build tooling in `tools/`, and the full git history.

## How this site is built (and why some checks do not apply)

The site is **100% static**: HTML, CSS, JS and images on GitHub Pages. There is no server, database, API,
login backend or stored user data on any server. So:

- **No server-side passwords, sessions or admin routes exist.** Nothing on a server can be broken into.
- **Server rate limiting and CORS** have nothing to protect. GitHub Pages serves public files with
  `Access-Control-Allow-Origin: *`, which is correct for public, credential-free static content.
- **"Debug mode"** has no server to switch off. The build checks are below.

## Findings and fixes

| # | Check | Result | Action |
|---|---|---|---|
| 1 | API keys, bot tokens, private keys in files | None in the working tree | `tools/check-secrets.mjs` runs before every build (`npm run build`) |
| 2 | Same, in **every commit** of git history | None | Scanned all blobs with the same patterns |
| 3 | `.env`, `.db`, keys ever committed | Never | `.gitignore` has `.env` and `.env.*`; demo copier skips `.env*`, `api/`, `*.db` |
| 4 | Real photo / personal images in history | Removed earlier (history rewritten, objects purged) | — |
| 5 | Dependencies (`npm audit`) | 0 vulnerabilities | — |
| 6 | Content-Security-Policy on the portfolio | **Missing** | **Fixed.** Strict CSP added at build time (`vite.config.js`): only same-origin code, the one inline script and style allowed by SHA-256 hash, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'` |
| 7 | CSP on `404.html` | **Missing** | **Fixed.** Same policy, hashes computed after the build |
| 8 | CSP on SkyNavoi demo (7 pages) | **Missing** | **Fixed.** `tools/copy-demos.mjs` adds a CSP to any demo page without one; its inline module scripts are allowed by hash. Other demos already had their own CSP |
| 9 | Referrer policy | **Missing** | **Fixed.** `strict-origin-when-cross-origin` on every page |
| 10 | Clickjacking, `nosniff`, HSTS, Permissions-Policy | GitHub Pages cannot send custom headers | **Prepared:** `public/_headers` sets them on hosts that support it (Netlify, Cloudflare Pages). GitHub Pages already forces HTTPS |
| 11 | Reflected XSS via URL parameters (`?id=`, `?q=`, `?from=`, `?lang=`, `?store=`) | Not exploitable: values are matched against known data, escaped, or written with `.value`/`textContent` | Hardened Vortaq `?lang=`: prototype keys like `constructor` no longer pass the check |
| 12 | Stored / self XSS from form fields (checkout, passenger, admin content) | All re-rendered text goes through an HTML-escape helper | — |
| 13 | Portfolio quote form | Never sent anywhere by the site: it builds a message and opens Telegram with it URL-encoded | Added hard length caps and control-character stripping that work even if `maxlength` is removed in DevTools |
| 14 | `eval`, `new Function`, `document.write`, string `setTimeout` | None | — |
| 15 | Links that open new tabs | All external ones have `rel="noopener"` | — |
| 16 | Debug output in the build | No source maps (`sourcemap: false`), no `debugger`, Lumina `DEBUG: false` | Two intentional logs remain: the console greeting and Vortaq's "demo mode, lead not sent" (local to the visitor) |
| 17 | Third-party code at runtime | Demo GSAP and Unsplash photos were loaded from CDNs | Fixed earlier: vendored locally. Only Google Fonts CSS stays external in some demos |
| 18 | Local preview server path traversal (`tools/serve.mjs`) | Prefix check could match a sibling folder like `dist-old` | **Fixed** (dev tool only, never deployed) |

## Lumina Mall admin (demo)

The only "login" on the site. It is a **client-side demo**: everything it edits lives in the visitor's own browser
(`localStorage` / IndexedDB), so there is no shared data to steal or change.

- Password is stored only as a **salted hash**, SHA-256 stretched 20,000 times. The plain password is never in the code.
- Failed logins: lockout after 5 tries, doubling up to 15 minutes. Sessions expire after inactivity.
- `admin.html` has `noindex, nofollow`.
- Limitation, stated honestly: any client-side gate can be skipped in DevTools. That is acceptable here because
  each visitor can only reach their own local copy. **For a real client**, the admin must move behind a server
  with real authentication (for example Supabase Auth). `js/auth.js` notes where to swap it in.
- The demo password `admin123` is shown on the case-study card on purpose so visitors can try the panel.

## Vortaq lead form (demo)

In the demo the form does not send anything. The production design (`api/lead.js` in the original project,
not copied here) keeps the Telegram bot token on the server. It validates input, has a honeypot field,
and rate-limits by IP. If you deploy it for a client, set `BOT_TOKEN`, `CHAT_ID` and `ALLOWED_ORIGINS` as
**server environment variables**, never in front-end code.

## Re-run the checks

```bash
npm run check     # secret scan
npm audit
npm run build     # secret scan + CSP injection
npm run test      # every page loads with no console errors (CSP violations count as errors)
```

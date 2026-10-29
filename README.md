# Akbar: portfolio

Portfolio of **Akbar**, a web developer from Uzbekistan ([@KrieWoo](https://t.me/KrieWoo)).

The site is built around the eight-point star (khatam) from
Samarkand tilework. The hero portrait is a live WebGL grid of stars, and the cursor works as a lens that
turns into a "master's loupe" with finer saffron stars. No real photo is published, only star renderings. Six real demo sites live inside this repo and open from the portfolio.

- Static site: Vite + vanilla JS + GSAP + Lenis + raw WebGL. No backend.
- Russian by default, with an English toggle. Mobile first. Respects reduced motion.
- Works on GitHub Pages under any repo name (relative base path).

## Run it

You need Node.js 20.19 or newer.

```bash
npm install
npm run dev          # http://localhost:5173 with live reload
```

Build and check the production version the way GitHub Pages will serve it:

```bash
npm run build        # checks for secrets, then builds into dist/
npm run preview      # http://localhost:4173/akbar-portfolio/ (same subpath setup as GitHub Pages)
```

Tests (Chromium via Playwright; run `npx playwright install chromium` once):

```bash
npm run test         # every demo page under a subpath + portfolio links, demos and back, 404, EN toggle, reduced motion
```

## Edit your info

| What | Where |
|---|---|
| Texts in Russian (hero, about, process, contact, footer) | `index.html`. Every translatable element has a `data-i18n` key. |
| Texts in English | `src/i18n.js`, the `en` object (same keys). Strings used from JS are in `ui`. |
| Case studies (Work section) | `src/data/projects.js` |
| Services and prices | `src/data/services.js` |
| FAQ | `src/data/faq.js` |
| Changelog ("Журнал изменений") | `index.html`, section `#now` |
| Telegram username | `index.html` (search `KrieWoo`), `src/ui.js` (`const TG`), `public/404.html` is generic |
| Colors and fonts | `src/styles/main.css`, the `:root` tokens at the top |
| Social preview image | `npm run og` re-renders `public/og.jpg` from `tools/og.mjs` |

Prices, process promises ("first screen in 2–3 days") and the "Принимаю заказы · ноябрь 2026"
status are sensible defaults. Change them to what you actually offer.

### Your photo

The original `my-photo.png` stays in the project root and is **not** committed (see `.gitignore`).
The site uses processed copies in `public/img/`:

| File | Used for |
|---|---|
| `portrait-tone.webp` | 96×120 mosaic with 8 gray levels that the WebGL shader turns into stars |
| `portrait-halftone-*.webp` | static star halftone (hero fallback: no WebGL, weak phone, reduced motion; OG image) |
| `portrait-dots-*.webp` | ink stars on saffron, About section |

The real photo is not published anywhere on the site.

To rebuild them from a new photo (Python 3 with Pillow, numpy, and `rembg` for the background mask):

```bash
python tools/photo/cutout.py my-photo.png              # crop + background mask -> tools/_work/
PYTHONPATH=tools/photo python tools/photo/stylize.py   # optional: 5 style variants + contact sheet
PYTHONPATH=tools/photo python tools/photo/export.py    # final WebP files -> public/img/
```

`cutout.py` crops a 4:5 head-and-shoulders frame. Adjust the crop box in it for a different photo.

## Demo sites

Demos are **copies**. The originals in `C:\Users\kriew\portfolio-new\...` and `C:\Users\kriew\new-site-with-skill`
are never changed. `npm run demos` re-copies all of them into `public/demos/<slug>/` and:

- skips `.git`, `.env*`, `api/`, backups, test dumps, `README.md`, `_headers`, `vercel.json`
- replaces phone numbers that could belong to real businesses with `+998 90 123 45 67`
- downloads GSAP from cdnjs and the Unsplash photos once, so the demos make no runtime requests to those services
- injects a "← Akbar's portfolio · Demo version" bar into every page (`public/demos/_shared/demo-bar.js`)

| Demo | Local link (after `npm run dev`) |
|---|---|
| Lumina Mall: interactive mall map + admin (password `admin123`) | http://localhost:5173/demos/lumina-mall/index.html |
| SkyNavoi: flight booking | http://localhost:5173/demos/skynavoi-flights/index.html |
| Lirevo: flower shop with cart and checkout | http://localhost:5173/demos/lirevo-flowers/index.html |
| Vortaq: fitness club (lead form in demo mode) | http://localhost:5173/demos/vortaq-fitness/index.html |
| Brumelle: coffee shop | http://localhost:5173/demos/brumelle-coffee/index.html |
| Nagiwa: sushi restaurant | http://localhost:5173/demos/nagiwa-sushi/index.html |

### Add a new demo

1. Make sure the demo is a static site with **relative** paths (`css/style.css`, not `/css/style.css`).
   If it needs a build step (Vite, React), build it with a relative base first (`vite build --base=./`)
   and use its `dist/` folder as the source.
2. If it talks to a backend, payments, Telegram or an API key, switch that part to mock data first.
   Never copy `.env` files or tokens. `npm run check` scans the repo for secrets before every build.
3. Add it to the `DEMOS` list in `tools/copy-demos.mjs`:
   ```js
   { slug: "my-barbershop", src: "portfolio-new/barbershop", name: "Barber Co" },
   ```
   `src` is relative to your user folder.
4. Run `npm run demos -- my-barbershop`.
5. Add its pages to `PAGES` in `tools/shots.mjs`, then run `npm run shots`. This tests the pages under a
   subpath and writes the screenshots to `public/img/work/my-barbershop-*.webp`.
6. Add a case study object to `src/data/projects.js` with `slug: "my-barbershop"` and
   `url: "demos/my-barbershop/index.html"`.
7. `npm run test`, then commit.

## Deploy to GitHub Pages

The build uses a relative base path (`./`), so it works at `https://<user>.github.io/<any-repo-name>/` without
any configuration. Two ways to publish. Pick one.

### A. GitHub Actions (recommended)

The workflow is already in `.github/workflows/deploy.yml`.

1. Create an empty repository on GitHub, for example `portfolio`.
2. Push this folder:
   ```bash
   git remote add origin https://github.com/<your-user>/portfolio.git
   git branch -M main
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and wait for "Deploy to GitHub Pages" to finish (about 1 minute).
5. The site is live at `https://<your-user>.github.io/portfolio/`. Every push to `main` redeploys it.

### B. Upload `dist/` by hand (gh-pages branch)

```bash
npm run build
npx gh-pages -d dist --dotfiles     # pushes dist/ to a gh-pages branch
```

Then in **Settings → Pages**, set **Source** to "Deploy from a branch", branch `gh-pages`, folder `/ (root)`.

### Base path notes

- Default: `base: "./"` in `vite.config.js`. Relative URLs work under any repo name.
- If you prefer absolute URLs, build with `BASE_PATH=/portfolio/ npm run build`
  (PowerShell: `$env:BASE_PATH="/portfolio/"; npm run build`).
- For a user site (`<user>.github.io` repository) or a custom domain, nothing changes. Relative paths still work.
- `public/404.html` is self-contained. GitHub Pages serves it for any missing URL, and its "Home" link
  detects the `/<repo>/` prefix on `github.io`.
- `public/.nojekyll` stops GitHub from running Jekyll on the files.

### After the first deploy

Social networks need an absolute image URL for the link preview. In `index.html`, change
`<meta property="og:image" content="og.jpg">` to `https://<your-user>.github.io/<repo>/og.jpg`
and add `<meta property="og:url" content="https://<your-user>.github.io/<repo>/">`.

## Project structure

```
index.html              page markup + Russian texts
src/main.js             boot: loader, fitting the giant name, WebGL start
src/hero-gl.js          WebGL star-halftone portrait (lazy loaded, ~3 KB gzipped)
src/motion.js           Lenis smooth scroll, GSAP reveals, marquee, counters, stacked cards
src/ui.js               nav, menu, compare slider, quote form, clock, demo page wipe, easter egg
src/cursor.js           custom cursor + magnetic buttons (desktop only)
src/render.js           builds Work / Services / FAQ from src/data/
src/i18n.js             RU <-> EN
public/demos/           the six demo sites (copies)
public/img/             portrait + case-study screenshots
tools/                  copy-demos, shots, e2e, og, serve, check-secrets, photo/
```

## Easter eggs

- Type `akbar` (or `акбар`, or the Konami code) anywhere on the page.
- Open the browser console.
- Visit any missing page: one tile in the 404 pattern is missing.

## Credits

See [CREDITS.md](CREDITS.md).

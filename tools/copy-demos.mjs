// Copies demo sites (read-only sources) into public/demos/<slug>/ and injects the
// "Demo · back to portfolio" bar into every HTML page.
// Usage: npm run demos            (all)
//        npm run demos -- lirevo  (only slugs that contain "lirevo")
// Sources are never modified. Secrets, VCS folders, backups and server code are skipped.
import fs from "node:fs";
import path from "node:path";
import { inlineScriptHashes, withCsp } from "./csp.mjs";

const HOME = process.env.USERPROFILE || process.env.HOME;
const ROOT = path.resolve(import.meta.dirname, "..");
const DEST = path.join(ROOT, "public", "demos");

export const DEMOS = [
  { slug: "brumelle-coffee", src: "portfolio-new/leon-coffee", name: "Brumelle" },
  { slug: "vortaq-fitness", src: "portfolio-new/profit-fitnessclub", name: "Vortaq" },
  { slug: "nagiwa-sushi", src: "portfolio-new/sushi-house-rest", name: "Nagiwa" },
  { slug: "lirevo-flowers", src: "portfolio-new/flower-shop", name: "Lirevo" },
  { slug: "lumina-mall", src: "portfolio-new/lumina-mall/lumina-mall", name: "Lumina Mall", note: "admin: admin123" },
  { slug: "skynavoi-flights", src: "new-site-with-skill", name: "SkyNavoi" },
];

// Anything matching is never copied.
const SKIP = [
  /^\.git$/, /^\.gitignore$/, /^\.env/, /^\.claude$/, /^\.impeccable$/, /^\.playwright-mcp$/,
  /^\.backup/, /^node_modules$/, /^api$/, /^_headers$/, /^vercel\.json$/, /^netlify\.toml$/,
  /^README\.md$/i, /^PROGRESS\.md$/i, /\.db(-shm|-wal)?$/, /\.log$/, /\.bak$/, /^Thumbs\.db$/,
];

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.some((re) => re.test(entry.name))) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Phone numbers in the copies are replaced with an obvious placeholder (could belong to a real business).
const REPLACE = [
  [/\+998712002626/g, "+998901234567"], [/\+998 71 200-26-26/g, "+998 90 123-45-67"],
  [/\+998791230047/g, "+998901234567"], [/\+998 79 123 00 47/g, "+998 90 123 45 67"],
  // Vortaq: ?lang=constructor must not pass the language check (prototype keys)
  [/if \(fromUrl && TRANSLATIONS\[fromUrl\]\)/g, "if (fromUrl && Object.prototype.hasOwnProperty.call(TRANSLATIONS, fromUrl))"],
  [/if \(saved && TRANSLATIONS\[saved\]\)/g, "if (saved && Object.prototype.hasOwnProperty.call(TRANSLATIONS, saved))"],
  // Vortaq: optional logo image that does not exist (the text logo is the real one) -> avoid a 404
  [/<img class="logo__img" src="images\/logo\.png"[^>]*>\s*/g, ""],
  // Vortaq: demo mode must not print the visitor's name and phone to the console
  [/console\.log\("\[Vortaq\] Demo mode, lead not sent:", lead\);/g, 'console.info("[Vortaq] Demo mode: the form works, nothing is sent.");'],
];

function scrub(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { scrub(p); continue; }
    if (!/\.(html|js|json|css)$/.test(e.name)) continue;
    const text = fs.readFileSync(p, "utf8");
    const out = REPLACE.reduce((t, [re, to]) => t.replace(re, to), text);
    if (out !== text) fs.writeFileSync(p, out);
  }
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : e.name.endsWith(".html") ? [p] : [];
  });
}

function inject(file, demo, demoRoot) {
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("data-akbar-demo-bar")) return;
  // relative path from this page back to /demos/_shared/ and to the portfolio root
  const depth = path.relative(demoRoot, path.dirname(file)).split(path.sep).filter(Boolean).length;
  const up = "../".repeat(depth);
  const tag = `<script src="${up}../_shared/demo-bar.js" data-akbar-demo-bar data-home="${up}../../" data-name="${demo.name}"${demo.note ? ` data-note="${demo.note}"` : ""} defer></script>`;
  html = html.includes("</body>") ? html.replace("</body>", `${tag}\n</body>`) : html + tag;
  fs.writeFileSync(file, html);
}

// ---------- vendoring: no runtime requests to third-party CDNs from the demos ----------
const CACHE = path.join(ROOT, "tools", "_work", "cache");
fs.mkdirSync(CACHE, { recursive: true });

async function download(url, file) {
  const cached = path.join(CACHE, file.replace(/[\/:]/g, "_"));
  if (!fs.existsSync(cached)) {
    const res = await fetch(url, { headers: { accept: "image/webp,*/*" } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    fs.writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
  }
  return cached;
}

function textFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? textFiles(p) : /\.(html|js|css)$/.test(e.name) ? [p] : [];
  });
}

// cdnjs GSAP -> vendor/gsap/<file> next to the page
async function vendorGsap(dst) {
  const re = /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/([\d.]+)\/([\w.]+\.js)/g;
  for (const f of textFiles(dst)) {
    let text = fs.readFileSync(f, "utf8");
    const found = [...text.matchAll(re)];
    if (!found.length && !text.includes("cdnjs.cloudflare.com")) continue;
    const rel = path.relative(path.dirname(f), path.join(dst, "vendor", "gsap")).split(path.sep).join("/");
    for (const [url, ver, name] of found) {
      fs.mkdirSync(path.join(dst, "vendor", "gsap"), { recursive: true });
      fs.copyFileSync(await download(url, `gsap-${ver}-${name}`), path.join(dst, "vendor", "gsap", name));
      text = text.replace(url, `${rel}/${name}`);
    }
    // the CSP no longer needs the CDN
    text = text.replace(/ https:\/\/cdnjs\.cloudflare\.com/g, "").replace(/<link rel="(preconnect|dns-prefetch)" href="https:\/\/cdnjs\.cloudflare\.com"[^>]*>\s*/g, "");
    fs.writeFileSync(f, text);
  }
}

// Unsplash hotlinks (Brumelle) -> img/u/<id>-<w>.webp, three sizes per photo
const U_SIZES = [320, 640, 1100];
const uSize = (w) => (w <= 360 ? 320 : w <= 720 ? 640 : 1100);
async function vendorUnsplash(dst) {
  const ids = new Set();
  for (const f of textFiles(dst)) {
    let text = fs.readFileSync(f, "utf8");
    if (!text.includes("unsplash")) continue;
    for (const m of text.matchAll(/["'`](\d{9,13}-[0-9a-f]{10,12})["'`]/g)) ids.add(m[1]);
    text = text.replace(/https:\/\/images\.unsplash\.com\/photo-(\d{9,13}-[0-9a-f]{10,12})\?w=(\d+)[^"'\s,]*/g, (_, id, w) => { ids.add(id); return `img/u/${id}-${uSize(Number(w))}.webp`; });
    // the JS helper that builds the URLs
    text = text.replace(/const unsplash = \(id, w\) => `https:\/\/images\.unsplash\.com\/photo-\$\{id\}\?w=\$\{w\}[^`]*`;/,
      "const unsplash = (id, w) => `img/u/${id}-${w <= 360 ? 320 : w <= 720 ? 640 : 1100}.webp`; // local copies (tools/copy-demos.mjs)");
    text = text.replace(/<link rel="preconnect" href="https:\/\/images\.unsplash\.com"[^>]*>\s*/g, "").replace(/ https:\/\/images\.unsplash\.com/g, "");
    fs.writeFileSync(f, text);
  }
  if (!ids.size) return;
  fs.mkdirSync(path.join(dst, "img", "u"), { recursive: true });
  for (const id of ids) {
    for (const w of U_SIZES) {
      const url = `https://images.unsplash.com/photo-${id}?w=${w}&q=68&fm=webp&fit=crop`;
      fs.copyFileSync(await download(url, `unsplash-${id}-${w}.webp`), path.join(dst, "img", "u", `${id}-${w}.webp`));
    }
  }
  console.log(`  localized ${ids.size} Unsplash photos`);
}

// Pages without their own CSP get one (inline scripts allowed by hash); every page gets a referrer policy.
function secure(file) {
  let html = fs.readFileSync(file, "utf8");
  if (!/http-equiv="Content-Security-Policy"/i.test(html)) {
    html = withCsp(html, {
      "default-src": "'self'",
      "script-src": ["'self'", ...inlineScriptHashes(html)],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "blob:"],
      "media-src": "'self'",
      "connect-src": "'self'",
      "object-src": "'none'",
      "base-uri": "'self'",
      "form-action": "'self'",
    });
  } else if (!/name=["']referrer["']/i.test(html)) {
    html = html.replace(/<meta charset=["']?utf-8["']?\s*\/?>/i, (m) => `${m}
  <meta name="referrer" content="strict-origin-when-cross-origin">`);
  }
  fs.writeFileSync(file, html);
}

const filter = process.argv[2];
for (const demo of DEMOS.filter((d) => !filter || d.slug.includes(filter))) {
  const src = path.join(HOME, demo.src);
  const dst = path.join(DEST, demo.slug);
  if (!fs.existsSync(src)) { console.warn(`skip ${demo.slug}: ${src} not found`); continue; }
  fs.rmSync(dst, { recursive: true, force: true });
  copyDir(src, dst);
  scrub(dst);
  await vendorGsap(dst);
  await vendorUnsplash(dst);
  for (const f of htmlFiles(dst)) { inject(f, demo, dst); secure(f); }
  console.log(`copied ${demo.slug} <- ${demo.src}`);
}

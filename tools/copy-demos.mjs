// Copies demo sites (read-only sources) into public/demos/<slug>/ and injects the
// "Demo · back to portfolio" bar into every HTML page.
// Usage: npm run demos            (all)
//        npm run demos -- lirevo  (only slugs that contain "lirevo")
// Sources are never modified. Secrets, VCS folders, backups and server code are skipped.
import fs from "node:fs";
import path from "node:path";

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
  // Vortaq: optional logo image that does not exist (the text logo is the real one) -> avoid a 404
  [/<img class="logo__img" src="images\/logo\.png"[^>]*>\s*/g, ""],
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
  if (html.includes("data-usta-demo-bar")) return;
  // relative path from this page back to /demos/_shared/ and to the portfolio root
  const depth = path.relative(demoRoot, path.dirname(file)).split(path.sep).filter(Boolean).length;
  const up = "../".repeat(depth);
  const tag = `<script src="${up}../_shared/demo-bar.js" data-usta-demo-bar data-home="${up}../../" data-name="${demo.name}"${demo.note ? ` data-note="${demo.note}"` : ""} defer></script>`;
  html = html.includes("</body>") ? html.replace("</body>", `${tag}\n</body>`) : html + tag;
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
  for (const f of htmlFiles(dst)) inject(f, demo, dst);
  console.log(`copied ${demo.slug} <- ${demo.src}`);
}

// End-to-end check of the BUILT site under a GitHub Pages subpath.
// npm run build && node tools/e2e.mjs
import { spawn } from "node:child_process";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const PREFIX = "/akbar-portfolio/";
const BASE = `http://localhost:4181${PREFIX}`;
const server = spawn(process.execPath, ["tools/serve.mjs", "dist", PREFIX, "4181"], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch({ args: ["--use-gl=angle", "--ignore-gpu-blocklist"] });
const fails = [];
const check = (ok, msg) => { console.log(`${ok ? "✓" : "✗"} ${msg}`); if (!ok) fails.push(msg); };

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

  await p.goto(BASE, { waitUntil: "load" });
  await p.waitForTimeout(3500);
  check(errors.length === 0, `portfolio loads without console errors ${errors.join(" | ")}`);
  check(await p.evaluate(() => document.documentElement.classList.contains("gl-ready")), "WebGL portrait running");

  // every page: loads clean, its nav link is marked active, every internal link and image answers 200
  const PAGES = { "": "index", "projects.html": "projects", "services.html": "services", "about.html": "about", "faq.html": "faq", "contact.html": "contact" };
  const checked = new Set();
  for (const [file, id] of Object.entries(PAGES)) {
    errors.length = 0;
    await p.goto(BASE + file, { waitUntil: "load" });
    await p.waitForTimeout(1200);
    const info = await p.evaluate(() => ({
      title: document.title,
      active: [...document.querySelectorAll('[aria-current="page"]')].map((a) => a.dataset.nav),
      nav: [...document.querySelectorAll(".nav__links a")].length,
      footer: !!document.querySelector(".footer__big"),
      over: document.documentElement.scrollWidth - innerWidth,
    }));
    const activeOk = id === "index" ? info.active.every((n) => n === "index") : info.active.length >= 1 && info.active.every((n) => n === id);
    check(errors.length === 0 && activeOk && info.nav === 5 && info.footer && info.over === 0,
      `${file || "index"}: "${info.title}", active=${info.active.join(",")} ${errors.join(" | ")}`);
    const hrefs = await p.evaluate(() => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.href.split("#")[0]))]);
    for (const h of hrefs.filter((h) => h.startsWith("http://localhost") && !checked.has(h))) {
      checked.add(h);
      const res = await p.request.get(h);
      check(res.status() === 200, `link ${h.replace(BASE, "") || "./"} -> ${res.status()}`);
    }
    const imgs = await p.evaluate(() => [...document.querySelectorAll("img")].map((i) => i.currentSrc || i.src));
    for (const src of imgs.filter((x) => !checked.has(x))) { checked.add(src); const r = await p.request.get(src); check(r.status() === 200, `img ${src.replace(BASE, "")}`); }
  }

  // language toggle (home hero, then the projects page keeps EN)
  await p.goto(BASE, { waitUntil: "load" });
  await p.waitForTimeout(2500);
  await p.click('[data-lang="en"]');
  await p.waitForTimeout(400);
  const h = await p.evaluate(() => document.querySelector(".hero__line").textContent);
  await p.goto(BASE + "projects.html", { waitUntil: "load" });
  await p.waitForTimeout(1200);
  const en = await p.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, open: document.querySelector(".case .btn span").textContent }));
  check(en.lang === "en" && /Websites/.test(h) && /Open/.test(en.open) && /^Work/.test(en.title), `EN toggle: "${h.slice(0, 30)}…" / "${en.open}" / "${en.title}"`);
  await p.click('[data-lang="ru"]');

  // portfolio -> every demo -> back
  const demos = await p.evaluate(() => [...document.querySelectorAll(".case .btn--case")].map((a) => a.getAttribute("href")));
  for (const href of demos) {
    const d = await ctx.newPage();
    const derr = [];
    d.on("pageerror", (e) => derr.push(e.message));
    d.on("response", (r) => r.status() >= 400 && derr.push(`${r.status()} ${r.url()}`));
    await d.goto(BASE + href, { waitUntil: "load" });
    await d.waitForTimeout(1200);
    const back = await d.evaluate(() => document.querySelector("[data-akbar-demo]")?.shadowRoot?.querySelector("a")?.href);
    check(!!back && derr.length === 0, `${href} opens, demo bar present ${derr.join(" | ")}`);
    await d.evaluate(() => document.querySelector("[data-akbar-demo]").shadowRoot.querySelector("a").click());
    await d.waitForURL(/projects\.html$/, { timeout: 5000 }).catch(() => {});
    check(d.url() === BASE + "projects.html", `back link returns to ${d.url().replace("http://localhost:4181", "")}`);
    await d.close();
  }

  // 404 page with a working home link at any depth
  const n = await ctx.newPage();
  const r404 = await n.goto(BASE + "some/deep/missing/page", { waitUntil: "load" });
  const home = await n.evaluate(() => document.getElementById("home")?.href);
  check(r404.status() === 404 && home === BASE, `404 page, home link -> ${home}`);
  await n.close();

  // mobile + reduced motion: static portrait, no WebGL, content visible
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const mp = await m.newPage();
  await mp.goto(BASE, { waitUntil: "load" });
  await mp.waitForTimeout(1500);
  const still = await mp.evaluate(() => ({
    gl: document.documentElement.classList.contains("gl-ready"),
    img: getComputedStyle(document.querySelector(".hero__img")).opacity,
    loader: getComputedStyle(document.getElementById("loader")).display,
    overflow: document.documentElement.scrollWidth - innerWidth,
  }));
  check(!still.gl && still.img === "1" && still.loader === "none" && still.overflow === 0, `reduced motion mobile: ${JSON.stringify(still)}`);
  await m.close();
} finally {
  await browser.close();
  server.kill();
}
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASSED");
process.exit(fails.length ? 1 : 0);

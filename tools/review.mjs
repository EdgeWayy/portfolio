// Screenshot review: node tools/review.mjs [url] [tag]
// Saves tools/_work/review/<tag>-<device>-<section>.png and prints console errors.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:5173/";
const tag = process.argv[3] || "r";
const OUT = path.resolve(import.meta.dirname, "_work", "review");
fs.mkdirSync(OUT, { recursive: true });
const SECTIONS = ["about", "work", "services", "process", "now", "faq", "contact"];
const DEVICES = {
  desk: { viewport: { width: 1440, height: 900 } },
  mob: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const only = process.argv[4];

const browser = await chromium.launch({ args: ["--use-gl=angle", "--enable-webgl", "--ignore-gpu-blocklist"] });
for (const [name, opts] of Object.entries(DEVICES)) {
  if (only && only !== name) continue;
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(() => { try { sessionStorage.setItem("akbar-intro-seen", "1"); } catch (e) {} }); // skip the gate + intro
  const p = await ctx.newPage();
  const errs = [];
  p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(`${m.type()}: ${m.text()}`));
  p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  p.on("response", (r) => r.status() >= 400 && errs.push(`${r.status()} ${r.url()}`));
  await p.goto(url, { waitUntil: "load" });
  await p.waitForTimeout(3200);
  await p.screenshot({ path: path.join(OUT, `${tag}-${name}-hero.png`) });
  const gl = await p.evaluate(() => document.documentElement.classList.contains("gl-ready"));
  for (const id of SECTIONS) {
    await p.evaluate((id) => { const el = document.getElementById(id); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 70); }, id);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(OUT, `${tag}-${name}-${id}.png`) });
  }
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(1300);
  await p.screenshot({ path: path.join(OUT, `${tag}-${name}-footer.png`) });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(`[${name}] gl-ready=${gl} horizontal-overflow=${overflow}px`);
  errs.forEach((e) => console.log("   " + e));
  await ctx.close();
}
await browser.close();

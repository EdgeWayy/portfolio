// Serves public/ under a GitHub-Pages-like subpath, opens every demo page,
// reports console errors + failed requests, and saves screenshots for the case-study cards.
// node tools/shots.mjs [--no-shots]
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "tools", "_work", "shots");
const PREFIX = "/akbar-portfolio/";
const BASE = `http://localhost:4180${PREFIX}`;
const noShots = process.argv.includes("--no-shots");
fs.mkdirSync(OUT, { recursive: true });

const PAGES = {
  "brumelle-coffee": ["index.html"],
  "vortaq-fitness": ["index.html"],
  "nagiwa-sushi": ["index.html"],
  "lirevo-flowers": ["index.html", "catalog.html", "product.html", "cart.html", "checkout.html"],
  "lumina-mall": ["index.html", "mall.html", "store.html", "admin.html"],
  "skynavoi-flights": ["index.html", "results.html", "seats.html", "passenger.html", "confirm.html", "legal.html"],
};

const server = spawn(process.execPath, ["tools/serve.mjs", "public", PREFIX, "4180"], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch();
let problems = 0;
try {
  for (const [slug, pages] of Object.entries(PAGES)) {
    for (const page of pages) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      const errors = [];
      p.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
      p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
      p.on("requestfailed", (r) => errors.push("failed: " + r.url()));
      p.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()}: ${r.url()}`));
      await p.goto(`${BASE}demos/${slug}/${page}`, { waitUntil: "load" });
      await p.waitForTimeout(2200);
      const bar = await p.locator("[data-usta-demo]").count();
      if (!bar) errors.push("demo bar missing");
      // the back link must point at the portfolio root
      const home = await p.evaluate(() => {
        const host = document.querySelector("[data-usta-demo]");
        return host?.shadowRoot?.querySelector("a")?.href || "";
      });
      if (!home.endsWith(`${PREFIX}#work`)) errors.push("bad back link: " + home);
      console.log(`${errors.length ? "✗" : "✓"} ${slug}/${page}`);
      for (const e of errors) console.log("    " + e);
      problems += errors.length;
      if (!noShots && page === "index.html") {
        await p.evaluate(() => document.querySelector("[data-usta-demo]")?.remove());
        await p.screenshot({ path: path.join(OUT, `${slug}-desktop.png`) });
        await p.setViewportSize({ width: 390, height: 844 });
        await p.reload({ waitUntil: "load" });
        await p.waitForTimeout(2200);
        await p.evaluate(() => document.querySelector("[data-usta-demo]")?.remove());
        await p.screenshot({ path: path.join(OUT, `${slug}-mobile.png`) });
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(problems ? `${problems} problem(s)` : "all demo pages clean");
process.exit(problems ? 1 : 0);

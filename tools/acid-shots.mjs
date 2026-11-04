// Walks the ACID flow on the built site and saves what it sees, for looking at with your own eyes.
//   npm run build && node tools/acid-shots.mjs <out-dir> [finale|intro|slime|all] [width] [height] [dpr]
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.resolve(process.argv[2] || "shots-acid");
const WHAT = process.argv[3] || "all";
const W = +(process.argv[4] || 1440), H = +(process.argv[5] || 900), DPR = +(process.argv[6] || 1);
const TOUCH = W < 640;
fs.mkdirSync(OUT, { recursive: true });
const PREFIX = "/akbar-portfolio/";
const PORT = 4240 + Math.floor(Math.random() * 50);
const BASE = `http://localhost:${PORT}${PREFIX}`;
const server = spawn(process.execPath, ["tools/serve.mjs", "dist", PREFIX, String(PORT)], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 700));
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] });
const tag = `${W}x${H}@${DPR}`;
const opts = { viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: TOUCH, hasTouch: TOUCH };
const shoot = async (p, name) => p.screenshot({ path: path.join(OUT, `${name}-${tag}.png`), timeout: 15000 }).catch((e) => console.log("shot failed", name, e.message));
const watch = (p, errs) => {
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" || (m.type() === "warning" && /finale|slime|boot|rescue|skull|acid/.test(m.text()))) errs.push(m.text()); });
};

try {
  if (WHAT === "finale" || WHAT === "all") {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(() => { try { sessionStorage.setItem("akbar-theme", "acid"); } catch (e) {} });
    const p = await ctx.newPage();
    const errs = [];
    watch(p, errs);
    await p.goto(BASE, { waitUntil: "load" });
    await p.waitForSelector(".ak-gate__btn");
    await p.waitForTimeout(1000);
    const b = await p.locator(".ak-gate__btn").boundingBox();
    if (TOUCH) {
      const cdp = await ctx.newCDPSession(p);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
    } else {
      await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await p.mouse.down();
    }
    await p.waitForTimeout(1100);
    await shoot(p, "potion-half");
    await p.waitForTimeout(650);
    await shoot(p, "potion-high");
    await p.waitForSelector(".ak-finale", { timeout: 8000 });
    const t0 = Date.now();
    if (!TOUCH) await p.mouse.up();
    for (let i = 0; i < 110; i++) {
      const ms = Date.now() - t0;
      await shoot(p, `finale-${String(i).padStart(2, "0")}-${String(ms).padStart(4, "0")}ms`);
      if (!(await p.$(".ak-finale"))) break;
    }
    console.log("finale gone after", Date.now() - t0, "ms; errors:", errs);
    await p.waitForTimeout(300);
    await shoot(p, "after-a");
    await p.waitForTimeout(1200);
    await shoot(p, "after-b");
    await p.waitForTimeout(3500);
    await shoot(p, "after-c");
    console.log("state", await p.evaluate(() => ({ path: document.documentElement.dataset.slime, cl: document.documentElement.className, finale: !!document.querySelector(".ak-finale"), gate: !!document.querySelector(".ak-gate") })));
    await ctx.close();
  }

  if (WHAT === "intro" || WHAT === "all") {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(() => { try { sessionStorage.setItem("akbar-theme", "acid"); sessionStorage.setItem("akbar-intro-seen", "1"); sessionStorage.setItem("akbar-seen", "1"); } catch (e) {} });
    const p = await ctx.newPage();
    const errs = [];
    watch(p, errs);
    const t0 = Date.now();
    await p.goto(BASE, { waitUntil: "commit" });
    for (let i = 0; i < 14; i++) {
      await shoot(p, `intro-${String(i).padStart(2, "0")}-${String(Date.now() - t0).padStart(4, "0")}ms`);
      await p.waitForTimeout(220);
    }
    await p.waitForTimeout(2500);
    await shoot(p, "intro-settled");
    console.log("intro errors:", errs, await p.evaluate(() => document.documentElement.className));
    await ctx.close();
  }

  if (WHAT === "slime" || WHAT === "all") {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(() => { try { sessionStorage.setItem("akbar-theme", "acid"); sessionStorage.setItem("akbar-intro-seen", "1"); sessionStorage.setItem("akbar-seen", "1"); sessionStorage.setItem("akbar-acid-intro", "1"); } catch (e) {} });
    const p = await ctx.newPage();
    await p.goto(BASE, { waitUntil: "load" });
    await p.waitForTimeout(3500);
    await shoot(p, "slime-settled");
    console.log("path:", await p.evaluate(() => document.documentElement.dataset.slime));
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}

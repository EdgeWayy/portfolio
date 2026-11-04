// Checks of the ACID effects that tools/e2e.mjs does not cover, on the built site.
//   npm run build && node tools/acid-verify.mjs [dir-for-screenshots]
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.resolve(process.argv[2] || "shots-acid");
fs.mkdirSync(OUT, { recursive: true });
const PREFIX = "/akbar-portfolio/";
const PORT = 4300 + Math.floor(Math.random() * 50);
const BASE = `http://localhost:${PORT}${PREFIX}`;
const server = spawn(process.execPath, ["tools/serve.mjs", "dist", PREFIX, String(PORT)], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 700));
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] });
const fails = [];
const check = (ok, msg) => { console.log(`${ok ? "✓" : "✗"} ${msg}`); if (!ok) fails.push(msg); };
const acidSeen = () => { try { sessionStorage.setItem("akbar-theme", "acid"); sessionStorage.setItem("akbar-intro-seen", "1"); sessionStorage.setItem("akbar-seen", "1"); } catch (e) {} };
const acidGate = () => { try { sessionStorage.setItem("akbar-theme", "acid"); } catch (e) {} };
const noWebgl2 = () => {
  const get = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, o) { return t === "webgl2" ? null : get.call(this, t, o); };
};
const hold = async (p) => {
  await p.waitForSelector(".ak-gate__btn");
  await p.waitForTimeout(700);
  const b = await p.locator(".ak-gate__btn").boundingBox();
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await p.mouse.down(); await p.waitForTimeout(2350); await p.mouse.up();
  await p.waitForSelector(".ak-finale", { timeout: 8000 });
};

try {
  // ---------- phone: a swipe on the portrait still scrolls the page, and the blob answers a touch ----------
  {
    const c = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await c.addInitScript(acidSeen);
    const p = await c.newPage();
    await p.goto(BASE, { waitUntil: "load" });
    await p.waitForFunction(() => document.documentElement.classList.contains("gl-ready"), null, { timeout: 15000 });
    await p.waitForTimeout(3000);
    const box = await p.locator("#portrait").boundingBox();
    const cdp = await c.newCDPSession(p);
    const x = box.x + box.width / 2, y0 = box.y + box.height * 0.7;
    const before = await p.evaluate(() => scrollY);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 - i * 22 }] });
      await p.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await p.waitForTimeout(700);
    const after = await p.evaluate(() => scrollY);
    check(after - before > 60, `touch swipe over the portrait scrolls the page (${before} -> ${after})`);
    await c.close();
  }

  // ---------- desktop: holding the star hides the blob ----------
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await c.addInitScript(() => {
      const names = new WeakMap(); window.__hover = 0;
      const P = WebGLRenderingContext.prototype, g = P.getUniformLocation, u = P.uniform1f;
      P.getUniformLocation = function (p, n) { const l = g.call(this, p, n); if (l) names.set(l, n); return l; };
      P.uniform1f = function (l, v) { if (l && names.get(l) === "uHover") window.__hover = v; return u.call(this, l, v); };
    });
    await c.addInitScript(acidSeen);
    const p = await c.newPage();
    await p.goto(BASE, { waitUntil: "load" });
    await p.waitForFunction(() => document.documentElement.classList.contains("gl-ready"), null, { timeout: 15000 });
    await p.waitForTimeout(2500);
    const box = await p.locator("#portrait").boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2);
    await p.waitForTimeout(700);
    const shown = await p.evaluate(() => window.__hover);
    // holding with the keyboard: the pointer can stay over the portrait, the worst case for this check
    await p.focus(".nav__logo");
    await p.keyboard.down(" ");
    await p.waitForTimeout(900);
    const during = await p.evaluate(() => window.__hover);
    await p.keyboard.up(" ");
    await p.waitForTimeout(1200);
    const back = await p.evaluate(() => window.__hover);
    check(shown > 0.9 && during < 0.05 && back > 0.9, `blob: on ${shown.toFixed(2)}, hidden during a hold ${during.toFixed(3)}, back after ${back.toFixed(2)}`);
    await c.close();
  }

  // ---------- the custom cursor during the finale: lime on black, black on the pale blob ----------
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await c.addInitScript(acidGate);
    const p = await c.newPage();
    await p.goto(BASE, { waitUntil: "load" });
    await hold(p);
    await p.mouse.move(100, 450);
    await p.waitForTimeout(900);
    const onBlack = await p.evaluate(() => ({ light: document.querySelector(".cursor").classList.contains("on-light"), hidden: document.querySelector(".cursor").classList.contains("is-hidden"), z: getComputedStyle(document.querySelector(".cursor")).zIndex }));
    await p.mouse.move(720, 250);
    await p.waitForTimeout(250);
    const onPale = await p.evaluate(() => document.querySelector(".cursor").classList.contains("on-light"));
    check(!onBlack.light && !onBlack.hidden && onPale && +onBlack.z > 450, `cursor in the finale: lime on black, black on the blob, above everything ${JSON.stringify({ ...onBlack, onPale })}`);
    await c.close();
  }

  // ---------- reduced motion: no shake, no glitch, a quick clamp and a fade; slime fades in at its place ----------
  {
    const c = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
    await c.addInitScript(acidGate);
    const p = await c.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(BASE, { waitUntil: "load" });
    await hold(p);
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(OUT, "reduced-finale.png") });
    const st = await p.evaluate(() => ({ layers: document.querySelectorAll(".ak-finale canvas").length, shake: document.querySelector(".ak-finale__shake").style.transform }));
    await p.waitForFunction(() => !document.querySelector(".ak-finale"), null, { timeout: 8000 });
    await p.waitForTimeout(1800);
    const end = await p.evaluate(() => ({ slime: !!document.querySelector(".slime"), band: document.documentElement.classList.contains("acid-band") }));
    await p.screenshot({ path: path.join(OUT, "reduced-page.png") });
    check(st.layers === 1 && !st.shake && end.slime && errs.length === 0, `reduced motion: skull only, no shake, slime at its place ${JSON.stringify({ ...st, ...end })} ${errs.join(" | ")}`);
    await c.close();
  }

  // ---------- no WebGL2: the same flow in canvas 2D ----------
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await c.addInitScript(noWebgl2);
    await c.addInitScript(acidGate);
    const p = await c.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));
    p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    await p.goto(BASE, { waitUntil: "load" });
    await p.waitForSelector(".ak-gate__btn");
    await p.waitForTimeout(700);
    const b = await p.locator(".ak-gate__btn").boundingBox();
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await p.mouse.down(); await p.waitForTimeout(1300);
    await p.screenshot({ path: path.join(OUT, "fallback-potion.png") });
    await p.waitForTimeout(1050); await p.mouse.up();
    await p.waitForSelector(".ak-finale", { timeout: 8000 });
    await p.waitForTimeout(2900);
    await p.screenshot({ path: path.join(OUT, "fallback-finale.png") });
    await p.waitForFunction(() => !document.querySelector(".ak-finale"), null, { timeout: 15000 });
    await p.waitForTimeout(6500);
    await p.screenshot({ path: path.join(OUT, "fallback-page.png") });
    const path2 = await p.evaluate(() => document.documentElement.dataset.slime);
    check(path2 === "canvas2d" && errs.length === 0, `fallback runs the whole flow: ${path2} ${errs.join(" | ")}`);
    await c.close();
  }

  // ---------- sizes: the slime is sharp, nothing overflows, the skull fits ----------
  for (const [w, h, dpr, mobile, name] of [[1440, 900, 2, false, "retina"], [760, 900, 1, false, "narrow"], [390, 844, 3, true, "phone3x"], [844, 390, 2, true, "landscape"]]) {
    const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
    await c.addInitScript(acidSeen);
    const p = await c.newPage();
    await p.goto(BASE, { waitUntil: "load" });
    await p.waitForSelector(".slime", { timeout: 9000 });
    await p.waitForTimeout(5500);
    const info = await p.evaluate(() => {
      const cv = document.querySelector(".slime");
      return { buffer: cv.width, css: cv.clientWidth, ratio: +(cv.width / cv.clientWidth).toFixed(2), over: document.documentElement.scrollWidth - innerWidth, path: document.documentElement.dataset.slime };
    });
    await p.screenshot({ path: path.join(OUT, `size-${name}.png`) });
    const cap = mobile ? 1.5 : 2;
    check(info.over === 0 && info.ratio <= cap + 0.01 && info.ratio >= Math.min(dpr, cap) * 0.45, `${name} ${w}x${h}@${dpr}: ${JSON.stringify(info)}`);
    await c.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASSED");
process.exit(fails.length ? 1 : 0);

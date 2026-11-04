// Frame-time and glitch measurements for the ACID effects, on any built site.
//   node tools/bench-acid.mjs [dir=dist] [label] [gpu|software]
// "software" renders with SwiftShader on the CPU: a stress test that makes differences visible on a fast graphics card.
// It only listens: WebGL uniform calls are recorded from outside, so the same script measures any version of the code.
// Reported per scenario: frame times (avg, p95, worst, share over 20 ms), layout reads per pointer event,
// the blob's largest jump in one frame, how far its stretch axis turned in one frame, how often it blinked off.
import { spawn } from "node:child_process";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = process.argv[2] || "dist";
const LABEL = process.argv[3] || DIR;
const SOFTWARE = process.argv[4] === "software";
const PREFIX = "/akbar-portfolio/";
const PORT = 4190 + Math.floor(Math.random() * 50);
const BASE = `http://localhost:${PORT}${PREFIX}`;
const server = spawn(process.execPath, ["tools/serve.mjs", DIR, PREFIX, String(PORT)], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 700));

const spy = () => {
  const names = new WeakMap();
  const log = { mouse: [], hover: [], stretch: [], frames: [], rects: 0, moves: 0 };
  window.__log = log;
  for (const P of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype]) {
    if (!P) continue;
    const gul = P.getUniformLocation;
    P.getUniformLocation = function (p, n) { const l = gul.call(this, p, n); if (l) names.set(l, n); return l; };
    const u2 = P.uniform2f;
    P.uniform2f = function (l, a, b) { if (l && names.get(l) === "uMouse") log.mouse.push([a, b, this.canvas.width / this.canvas.clientWidth]); return u2.call(this, l, a, b); };
    const u1 = P.uniform1f;
    P.uniform1f = function (l, a) { if (l && names.get(l) === "uHover") log.hover.push(a); return u1.call(this, l, a); };
    const um = P.uniformMatrix2fv;
    P.uniformMatrix2fv = function (l, t, v) { if (l && names.get(l) === "uStretch") log.stretch.push([v[0], v[1], v[3]]); return um.call(this, l, t, v); };
  }
  const gbcr = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function () { if (window.__inMove) log.rects++; return gbcr.call(this); };
  const add = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (t, fn, o) {
    if (t !== "pointermove" || typeof fn !== "function") return add.call(this, t, fn, o);
    return add.call(this, t, function (e) { window.__inMove = true; try { return fn.call(this, e); } finally { window.__inMove = false; } }, o);
  };
  addEventListener("pointermove", () => { log.moves++; }, true);
  let last = 0;
  const tick = (now) => { if (last) log.frames.push(now - last); last = now; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
};

const stats = (a) => {
  if (!a.length) return { n: 0 };
  const s = [...a].sort((x, y) => x - y);
  const avg = a.reduce((x, y) => x + y, 0) / a.length;
  return { n: a.length, avg: +avg.toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), worst: +s[s.length - 1].toFixed(1), over20: `${((a.filter((v) => v > 20).length / a.length) * 100).toFixed(1)}%` };
};

const reset = (p) => p.evaluate(() => { const l = window.__log; l.mouse.length = l.hover.length = l.stretch.length = l.frames.length = 0; l.rects = l.moves = 0; });
const read = (p) => p.evaluate(() => {
  const l = window.__log;
  let jump = 0, axis = 0;
  for (let i = 1; i < l.mouse.length; i++) jump = Math.max(jump, Math.hypot(l.mouse[i][0] - l.mouse[i - 1][0], l.mouse[i][1] - l.mouse[i - 1][1]) / (l.mouse[i][2] || 1));
  // the stretch axis from the matrix [m0 m1; m1 m2]; only counted while the stretch is visible
  const ang = ([a, b, c]) => 0.5 * Math.atan2(2 * b, a - c);
  for (let i = 1; i < l.stretch.length; i++) {
    const s = l.stretch[i], q = l.stretch[i - 1];
    if (Math.abs(s[0] - s[2]) + Math.abs(s[1]) < 0.08) continue;
    let d = Math.abs(ang(s) - ang(q)); if (d > Math.PI / 2) d = Math.PI - d;
    axis = Math.max(axis, d);
  }
  let off = 0, low = 9;
  for (let i = 1; i < l.hover.length; i++) { if (l.hover[i] < 0.02 && l.hover[i - 1] >= 0.02) off++; if (l.hover[i] < low) low = l.hover[i]; }
  return { frames: l.frames.slice(), jumpPx: +jump.toFixed(0), axisDeg: +((axis * 180) / Math.PI).toFixed(0), blinks: off, hoverMin: +low.toFixed(2), rectsPerMove: +(l.rects / Math.max(1, l.moves)).toFixed(2), moves: l.moves };
});

const browser = await chromium.launch({ args: ["--use-gl=angle", SOFTWARE ? "--use-angle=swiftshader" : "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--enable-gpu-rasterization"] });
const out = { label: LABEL };
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(spy);
  await ctx.addInitScript(() => { try { sessionStorage.setItem("akbar-intro-seen", "1"); sessionStorage.setItem("akbar-seen", "1"); sessionStorage.setItem("akbar-theme", "acid"); } catch (e) {} });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "load" });
  // the page's arrival: from the load until the slime has settled
  await p.waitForTimeout(6000);
  out.pour = stats((await read(p)).frames);
  await p.waitForFunction(() => document.documentElement.classList.contains("gl-ready"), null, { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(1500);
  out.gpu = await p.evaluate(() => {
    const g = document.createElement("canvas").getContext("webgl");
    const e = g?.getExtension("WEBGL_debug_renderer_info");
    return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : "unknown";
  });
  out.path = await p.evaluate(() => document.documentElement.dataset.slime || "canvas2d (old code)");

  const r = await p.locator("#portrait").boundingBox();
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const scenario = async (name, fn) => {
    await p.mouse.move(cx, cy);
    await p.waitForTimeout(300);
    await reset(p);
    await fn();
    const m = await read(p);
    const { frames, ...rest } = m;
    out[name] = { ...stats(frames), ...rest };
  };

  await reset(p);
  await p.waitForTimeout(3000);
  out.idle = stats((await read(p)).frames);

  // a burst of raw pointer moves in one go is what a fast mouse does between two frames
  const burst = (pts) => p.evaluate(async (pts) => {
    const el = document.elementFromPoint(pts[0][0], pts[0][1]);
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      const t = document.elementFromPoint(x, y) || document.documentElement;
      t.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true, pointerType: "mouse", composed: true }));
      if (i % 3 === 2) await new Promise(requestAnimationFrame);
    }
    return !!el;
  }, pts);

  const W = r.width * 0.46, H = r.height * 0.46;
  await scenario("zigzag", () => {
    const pts = [];
    for (let i = 0; i < 720; i++) pts.push([cx + ((i % 18 < 9 ? i % 9 : 9 - (i % 9)) / 9 - 0.5) * 2 * W, cy + Math.sin(i * 0.05) * H]);
    return burst(pts);
  });
  await scenario("circles", () => {
    const pts = [];
    for (let i = 0; i < 720; i++) pts.push([cx + Math.cos(i * 0.32) * W * 0.9, cy + Math.sin(i * 0.32) * H * 0.9]);
    return burst(pts);
  });
  await scenario("drag", () => {
    const pts = [];
    for (let i = 0; i < 480; i++) { const t = i / 480; pts.push([cx - W + t * 2 * W, cy - H + t * 2 * H]); }
    return burst(pts);
  });
  await scenario("edgeCross", async () => {
    // over the edge and back, quicker than the eye: real mouse moves, so the browser sends real enter and leave events
    for (let i = 0; i < 40; i++) {
      await p.mouse.move(r.x + r.width + 30, cy + (i % 5) * 8);
      await p.waitForTimeout(24);
      await p.mouse.move(r.x + r.width - 30, cy - (i % 5) * 8);
      await p.waitForTimeout(24);
    }
  });
  await scenario("leaveReenter", async () => {
    // far out and back in at another spot, long enough for the blob to shrink: it must not jump there at full size
    for (let i = 0; i < 12; i++) {
      await p.mouse.move(r.x - 80, cy);
      await p.waitForTimeout(90);
      await p.mouse.move(r.x + r.width - 20, r.y + 30 + i * 40);
      await p.waitForTimeout(90);
    }
  });
  // the gate's potion and the finale, in a visit of its own
  const fc = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await fc.addInitScript(spy);
  await fc.addInitScript(() => { try { sessionStorage.setItem("akbar-theme", "acid"); } catch (e) {} });
  const q = await fc.newPage();
  await q.goto(BASE, { waitUntil: "load" });
  await q.waitForSelector(".ak-gate__btn");
  await q.waitForTimeout(1500);
  const b = await q.locator(".ak-gate__btn").boundingBox();
  await q.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await reset(q);
  await q.mouse.down();
  await q.waitForTimeout(2100);
  out.potion = stats((await read(q)).frames);
  await q.waitForSelector(".ak-finale", { timeout: 8000 });
  await q.mouse.up();
  await reset(q);
  const t0 = Date.now();
  await q.waitForFunction(() => !document.querySelector(".ak-finale"), null, { timeout: 60000 }).catch(() => {});
  out.finale = { ...stats((await read(q)).frames), seconds: +((Date.now() - t0) / 1000).toFixed(1) };
  await fc.close();
} finally {
  await browser.close();
  server.kill();
}
console.log(JSON.stringify(out, null, 1));

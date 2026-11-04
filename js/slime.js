/* ACID theme slime: what it does. How it looks is in js/slime-gl.js (WebGL2), with a canvas 2D version here as the fallback.
   A scene is one wavy mass plus a list of "prims". A prim is anything that hangs: a drip, a falling droplet, a splash.
   The simulation runs on the CPU with a small number of drips:
     a drip stretches slowly on a soft spring, its neck thins as it gets longer, some let go of a droplet, and then the
     stump recoils on a stiffer spring with a little overshoot and starts stretching again.
     pourSlime()   the page's puddle: swells at the top edge, then sags and pours down, and stays. Behind the page content.
     coverSlime()  the full-screen curtain used when the theme is switched off: floods down, then drains upward. */
import { addBackProbe, addProbe } from "./cursor-tone.js";
import { acquireRenderer, MAX_PRIMS, MAX_MOVING } from "./slime-gl.js";

/* ---------- timings of the puddle's arrival (seconds) ---------- */
export const POUR = {
  full: { swell: 0.5, pour: 3.1, dripsAfter: 0.35, dripsOver: 3.2 },  // first entry and reload
  short: { swell: 0.12, pour: 1.0, dripsAfter: 0.05, dripsOver: 1.0 }, // moving between pages of a visit
};
const FADE_IN_MS = 700;             // reduced motion: no flow, the slime fades in where it will stay
const IDLE_FPS_COARSE = 30;         // phones, once it has settled: it moves slowly, half the frames look the same

const LIME = "#B8FF00", RIM = "#86BE00", RIM_DEEP = "#527A00", SHINE = "#F4FFCF", UNDER = "#2C4700";
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t, p = 3) => 1 - Math.pow(1 - t, p);

/* ---------- a scene: one object per effect, reused every frame ---------- */
export function makeScene() {
  return {
    time: 0,
    massDir: 0, massBase: 0, massAmp: 1, thick: 13, waveX: 1, waveT: 1, meniscus: 0,
    prims: new Float32Array(MAX_PRIMS * 8), n: 0,
    moving: new Float32Array(MAX_MOVING * 4), nMoving: 0,
    bubbles: 0, glow: 0, deep: 0,
  };
}

/** Adds one prim: x, top and tip, sideways sway of the tip, radius at the top, at the neck and of the bulb, softness of its join. */
export function addPrim(s, x, y0, y1, sway, rTop, rNeck, rBulb, k) {
  if (s.n >= MAX_PRIMS) return;
  const o = s.n * 8, P = s.prims;
  P[o] = x; P[o + 1] = y0; P[o + 2] = y1; P[o + 3] = sway;
  P[o + 4] = rTop; P[o + 5] = rNeck; P[o + 6] = rBulb; P[o + 7] = k;
  s.n++;
}

/** The mass's edge. The same formula is in the field shader of js/slime-gl.js. */
export function massEdge(s, x) {
  const t = s.time, fx = s.waveX, ft = s.waveT;
  return s.massBase + s.massAmp * (Math.sin(x * 0.0058 * fx + t * 0.28 * ft + 1.1) * 15
    + Math.sin(x * 0.0163 * fx - t * 0.21 * ft) * 6 + Math.sin(x * 0.041 * fx + t * 0.36 * ft) * 1.8);
}

/** Is this point on the slime? For the custom cursor: no pixels are read back. */
export function sceneHit(s, x, y) {
  if (s.massDir > 0 && y < massEdge(s, x)) return true;
  if (s.massDir < 0 && y > massEdge(s, x)) return true;
  const P = s.prims;
  for (let i = 0; i < s.n; i++) {
    const o = i * 8;
    if (y < P[o + 1] - P[o + 6] || y > P[o + 2]) continue;
    if (Math.abs(x - P[o] - P[o + 3] * clamp((y - P[o + 1]) / Math.max(1, P[o + 2] - P[o + 1]))) < Math.max(P[o + 5], y > P[o + 2] - P[o + 6] * 2 ? P[o + 6] : 0) + 1) return true;
  }
  return false;
}

/* ---------- canvas 2D fallback: the same scene as one path, with a layered rim and highlights ---------- */
function paint2D(c, s, W, H) {
  const P = s.prims;
  c.clearRect(0, 0, W, H);
  const body = new Path2D(), shine = new Path2D();
  if (s.massDir) {
    const far = s.massDir > 0 ? -30 : H + 30;
    body.moveTo(-30, far);
    for (let x = -30; x <= W + 38; x += 8) body.lineTo(x, massEdge(s, x) - (s.massDir < 0 ? s.meniscus * Math.exp(-Math.min(x, W - x) / 11) : 0));
    body.lineTo(W + 38, far);
    body.closePath();
  }
  for (let i = 0; i < s.n; i++) {
    const o = i * 8, x = P[o], y0 = P[o + 1], y1 = P[o + 2], sw = P[o + 3], rt = P[o + 4], rn = P[o + 5], rb = P[o + 6], k = P[o + 7];
    const tip = y1 - rb, flare = rt + k * 0.75, tx = x + sw;
    if (tip <= y0 + 1) { body.moveTo(tx + rb, tip); body.arc(tx, tip, rb, 0, 6.3); continue; } // a round splash
    const neckY = y0 + (tip - y0) * 0.42, shoulder = Math.max(neckY, tip - rb * 3.4);
    body.moveTo(x - flare, y0);
    body.bezierCurveTo(x - rt, y0 + (neckY - y0) * 0.25, x - rn, y0 + (neckY - y0) * 0.5, x - rn, neckY);
    if (shoulder > neckY) body.lineTo(x + sw * 0.6 - rn, shoulder);
    body.bezierCurveTo(tx - rn, shoulder + (tip - shoulder) * 0.5, tx - rb, shoulder + (tip - shoulder) * 0.5, tx - rb, tip);
    body.arc(tx, tip, rb, Math.PI, 0, true);
    body.bezierCurveTo(tx + rb, shoulder + (tip - shoulder) * 0.5, tx + rn, shoulder + (tip - shoulder) * 0.5, x + sw * 0.6 + rn, shoulder);
    if (shoulder > neckY) body.lineTo(x + rn, neckY);
    body.bezierCurveTo(x + rn, y0 + (neckY - y0) * 0.5, x + rt, y0 + (neckY - y0) * 0.25, x + flare, y0);
    body.closePath();
    if (tip - y0 > rb * 3) {
      const hx = x - rn * 0.45;
      shine.moveTo(hx, y0 + (tip - y0) * 0.2);
      shine.lineTo(tx - rb * 0.45, tip - rb * 0.6);
    }
    shine.moveTo(tx - rb * 0.2 + rb * 0.2, tip + rb * 0.55);
    shine.ellipse(tx - rb * 0.2, tip + rb * 0.55, rb * 0.2, rb * 0.1, 0, 0, 6.3);
  }
  c.lineJoin = "round"; c.lineCap = "round";
  c.strokeStyle = UNDER;
  c.globalAlpha = 0.25; c.lineWidth = 9; c.stroke(body);
  c.globalAlpha = 0.7; c.lineWidth = 4; c.stroke(body);
  c.globalAlpha = 1;
  c.fillStyle = LIME;
  c.fill(body);
  c.save();
  c.clip(body);
  // the darker rim inside the edge is what makes it look thick
  c.strokeStyle = RIM;
  c.globalAlpha = 0.22; c.lineWidth = 11; c.stroke(body);
  c.globalAlpha = 0.8; c.lineWidth = 6.5; c.stroke(body);
  c.strokeStyle = RIM_DEEP;
  c.globalAlpha = 0.85; c.lineWidth = 2.6; c.stroke(body);
  c.strokeStyle = SHINE;
  c.globalAlpha = 0.14; c.lineWidth = 5.5; c.stroke(shine);
  c.globalAlpha = 0.9; c.lineWidth = 2.2; c.stroke(shine);
  c.globalAlpha = 1;
  // the potion's bubbles
  for (let i = 0; i < s.nMoving; i++) {
    const m = i * 4, q = s.moving;
    if (q[m + 3] > 0) continue;
    c.strokeStyle = RIM_DEEP; c.lineWidth = 1.2;
    c.beginPath(); c.arc(q[m], q[m + 1], q[m + 2], 0, 6.3); c.stroke();
  }
  c.restore();
}

/** Where the slime is drawn: WebGL2 when possible. draw() takes a scene; `path` says which one is in use. */
export function makeSurface({ className, parent, width, height, dpr }) {
  let gl = acquireRenderer();
  let cv, c = null, W = width, H = height;
  const use2D = () => {
    cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    c = cv.getContext("2d");
  };
  const size2D = () => {
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = `${W}px`; cv.style.height = `${H}px`;
  };
  if (gl) cv = gl.canvas; else { use2D(); size2D(); }
  cv.className = className;
  document.documentElement.dataset.slime = gl ? "webgl" : "canvas2d";
  if (gl) {
    gl.resize(W, H, dpr);
    // a lost context (driver reset, too many tabs): the same effect goes on in canvas 2D
    gl.onLost = () => {
      const old = cv;
      gl = null;
      use2D(); size2D();
      cv.className = old.className;
      if (old.style.opacity) cv.style.opacity = old.style.opacity;
      old.replaceWith(cv);
      document.documentElement.dataset.slime = "canvas2d";
    };
  }
  parent?.append(cv);
  return {
    get canvas() { return cv; },
    get path() { return gl ? "webgl" : "canvas2d"; },
    resize(w, h) { W = w; H = h; if (gl) gl.resize(w, h, dpr); else size2D(); },
    frame(dt) { gl?.frame(dt); },
    draw(s) {
      if (gl) { gl.draw(s); return; }
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint2D(c, s, W, H);
    },
    clear() {
      if (gl) gl.clear();
      else { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); }
    },
    release() {
      if (gl) { gl.onLost = null; gl.release(); gl = null; } else cv.remove();
    },
  };
}

export const slimeDpr = (w = innerWidth) => {
  const small = matchMedia("(pointer: coarse)").matches || w < 640;
  return Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
};

/* ---------- drips ---------- */
export function makeDrips(w, maxLen) {
  const small = w < 640 || matchMedia("(pointer: coarse)").matches;
  const most = small ? 14 : 24;
  const k = clamp(w / 1440, 0.62, 1.15); // everything is a little slimmer on a phone
  const drips = [];
  let x = rand(10, 44) * k;
  while (x < w - 6 && drips.length < most) {
    const kind = Math.random();
    // long and fat, long and thin, or just a short nub: spaced irregularly
    const [wMin, wMax, lMin, lMax] = kind < 0.34 ? [27, 37, 0.55, 1]
      : kind < 0.62 ? [18, 26, 0.3, 0.75]
        : [15, 25, 0.08, 0.26];
    const width = rand(wMin, wMax) * k;
    const len = rand(lMin, lMax) * maxLen;
    drips.push({
      x, w: width, len,
      delay: Math.random(),                                     // each starts in its own moment of the pour
      breatheA: rand(0.03, 0.08), breatheF: rand(0.2, 0.46), breatheP: rand(0, 6.28), // the slow stretch
      swayA: rand(0.4, 1.3), swayF: rand(0.5, 1.1), swayP: rand(0, 6.28),
      // the simulation
      l: 0, v: 0, neck: 1, bulb: 1, pinch: 0, recoil: 0,
      lets: len > maxLen * 0.42 && Math.random() < 0.7,          // only some of them ever let go
      nextDrop: rand(3, 13),
    });
    x += width + rand(52, 132) * k;
  }
  // narrow screens: the blob fills the middle, so make sure long drips run down the free space at both sides
  if (w < 960 && drips.length > 2) {
    for (const px of [w * 0.052, w * 0.948]) {
      const near = drips.reduce((a, d) => (Math.abs(d.x - px) < Math.abs(a.x - px) ? d : a));
      Object.assign(near, { x: px, w: 21 + Math.random() * 5, len: rand(0.6, 1) * maxLen, lets: true, nextDrop: rand(3, 10) });
    }
    drips.sort((a, b) => a.x - b.x);
  }
  return drips;
}

/** One step of every drip. grow (0..1): how far the pour has come. Detached drops go into `drops`. */
export function stepDrips(drips, drops, dt, grow, time, allowDrops, edgeAt) {
  for (const d of drips) {
    const g = clamp(grow * 1.9 - d.delay * 0.9);
    let want = d.len * easeOut(g, 2) * (1 + Math.sin(time * d.breatheF + d.breatheP) * d.breatheA);
    if (d.pinch > 0) {
      // about to let go: it stretches further while its neck runs thin
      d.pinch += dt / 0.95;
      want *= 1 + 0.2 * d.pinch;
      if (d.pinch >= 1) {
        const r = d.w * 0.34;
        const free = drops.find((o) => !o.on);
        if (free) { free.on = true; free.x = d.x; free.y = edgeAt(d.x) + d.l - r; free.vy = 40 + d.v; free.r = r; }
        d.l = Math.max(0, d.l - r * 2.2); // the bulb is gone: the stump is that much shorter
        d.v = -34;
        d.bulb = 0.62;
        d.pinch = 0;
        d.recoil = 1;
        d.nextDrop = rand(7, 20);
      }
    } else if (allowDrops && d.lets) {
      d.nextDrop -= dt;
      if (d.nextDrop <= 0 && d.l > d.len * 0.7) d.pinch = 0.001;
    }
    // recoil: a stiff, lively spring; otherwise a soft, heavily damped one (that is what makes it read as viscous)
    d.recoil = Math.max(0, d.recoil - dt / 1.1);
    // (quicker while the pour is on, so the drips keep up with the level)
    const stiff = (grow < 1 ? 20 : 7) + 60 * d.recoil, damp = (grow < 1 ? 5 : 6.5) - 1.2 * d.recoil;
    if (d.recoil > 0) want *= 0.7 + 0.3 * (1 - d.recoil);
    d.v += ((want - d.l) * stiff - d.v * damp * 2) * dt;
    d.l = Math.max(0, d.l + d.v * dt);
    // the neck thins as it stretches and when it pinches; the bulb slowly fills up again
    const target = (1 - 0.2 * clamp(d.l / Math.max(1, d.len))) * (1 - 0.86 * Math.pow(d.pinch, 1.6));
    d.neck += (target - d.neck) * Math.min(1, dt * (d.pinch > 0 ? 9 : 2.4));
    d.bulb += (1 - d.bulb) * Math.min(1, dt * 0.55);
  }
}

export function writeDrips(s, drips, time, sceneEdge = massEdge) {
  for (const d of drips) {
    if (d.l < 1) continue;
    const hw = d.w / 2, x = d.x;
    const y = sceneEdge(s, x);
    const rb = hw * (0.82 + 0.18 * clamp(d.l / (d.w * 2))) * d.bulb;
    const short = d.l < d.w * 0.9;
    addPrim(s, x, y - 7, y + d.l, Math.sin(time * d.swayF + d.swayP) * d.swayA * clamp(d.l / 50),
      hw * 1.05, Math.max(0.9, hw * 0.9 * d.neck), short ? Math.max(hw * 0.55, 1) : rb, 15 + hw * 1.05);
  }
}

export function makeDrops(n) {
  return Array.from({ length: n }, () => ({ on: false, x: 0, y: 0, vy: 0, r: 0 }));
}
export function stepDrops(s, drops, dt, H) {
  for (const o of drops) {
    if (!o.on) continue;
    o.vy += 980 * dt;
    o.y += o.vy * dt;
    if (o.y > H + 24) { o.on = false; continue; }
    // it stretches into a tear as it speeds up, and shrinks away at the bottom of the canvas
    const near = clamp((H - o.y + 16) / 70);
    const r = o.r * (0.35 + 0.65 * near), tail = r * (0.6 + Math.min(2.2, o.vy / 420));
    addPrim(s, o.x, o.y - tail, o.y + r, 0, r * 0.2, r * 0.52, r, 0.5);
  }
}

/* ---------- the puddle ---------- */
/**
 * band(): the height of its edge in px. dripMax(): the longest drip. mode: "full", "short", or "still" (reduced motion).
 * onEdge(y) is called with the edge's height while it is on its way, so the page can turn its text black as the slime reaches it.
 * Returns { setBand, stop }: setBand() re-reads the height (the edge eases there) when the layout changes.
 */
export function pourSlime({ band, dripMax, mode = "full", onEdge, onSettled } = {}) {
  const coarse = matchMedia("(pointer: coarse)").matches;
  const still = mode === "still";
  const T = POUR[mode === "short" ? "short" : "full"];
  let w = document.documentElement.clientWidth, H = innerHeight;
  const surface = makeSurface({ className: "slime", parent: document.body, width: w, height: H, dpr: slimeDpr(w) });
  const scene = makeScene();
  scene.massDir = 1;
  scene.bubbles = 1;
  const drops = makeDrops(6);
  let drips = makeDrips(w, dripMax());
  let target = band(), edge = target;

  if (still) {
    // no flow: it fades in at its final place, with the drips already out
    drips.forEach((d) => { d.l = d.len; });
    surface.canvas.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_IN_MS, easing: "ease-out" });
  }

  const t0 = performance.now();
  let raf = 0, stopped = false, settled = false, visible = true, last = t0, lastDraw = 0, simTime = t0 / 1000;
  const draw = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; // clamped: a hiccup or a hidden tab must not make it jump
    simTime += dt;
    const e = still ? 1e9 : (now - t0) / 1000;
    const p = clamp(e / T.pour);
    edge += (target - edge) * Math.min(1, dt * 5);
    // fast at first, slowing as it thickens, ending exactly at the band
    const base = -44 + (edge + 44) * easeOut(p, 2.6);
    // the lip is thick and very wavy while it is swelling, then calms down to the idle wobble
    const swell = clamp(e / Math.max(0.01, T.swell));
    scene.massAmp = (0.55 + 0.45 * swell) * (1 + 1.1 * Math.pow(1 - p, 2));
    scene.massBase = base;
    scene.time = simTime;
    const grow = clamp((e - T.dripsAfter) / T.dripsOver);
    scene.n = 0;
    stepDrips(drips, drops, dt, grow, simTime, grow >= 1, (x) => massEdge(scene, x));
    writeDrips(scene, drips, simTime);
    stepDrops(scene, drops, dt, H);
    surface.draw(scene);
    if (!settled) {
      onEdge?.(base);
      if (p >= 1 && grow >= 1) { settled = true; onSettled?.(); }
    }
  };
  // the cursor: is this point on the lime? (the canvas scrolls with the page, so scroll counts)
  const removeProbe = addBackProbe((x, y) => (sceneHit(scene, x, y + window.scrollY) ? "light" : null));
  let lastTick = 0;
  const loop = (now) => {
    if (stopped) return;
    if (visible && !document.hidden) {
      // the quality watch reads the real frame rate: the deliberate 30 fps below must not look like a slow machine
      if (lastTick) surface.frame((now - lastTick) / 1000);
      lastTick = now;
      if (!coarse || !settled || now - lastDraw > 1000 / IDLE_FPS_COARSE - 2) { lastDraw = now; draw(now); }
      raf = requestAnimationFrame(loop);
    } else raf = 0;
  };
  const wake = () => { if (!raf && !stopped) { last = performance.now(); lastTick = 0; raf = requestAnimationFrame(loop); } };
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; wake(); });
  io.observe(surface.canvas);
  document.addEventListener("visibilitychange", wake);
  const onResize = () => {
    const nw = document.documentElement.clientWidth;
    if (nw === w) return; // phones: the URL bar only changes the height
    w = nw; H = innerHeight;
    surface.resize(w, H);
    drips = makeDrips(w, dripMax());
    drips.forEach((d) => { d.l = settled ? d.len : 0; });
    target = edge = band();
  };
  window.addEventListener("resize", onResize);
  raf = requestAnimationFrame(loop);

  return {
    setBand() { target = band(); },
    stop() {
      stopped = true;
      removeProbe();
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("resize", onResize);
      surface.release();
    },
  };
}

/** Full-screen curtain: flood down (`during` runs while the screen is covered), then drain upward and away. */
export function coverSlime({ during, reduce = false, downMs = 520, upMs = 900 } = {}) {
  return new Promise((resolve) => {
    if (reduce) { during?.(); resolve(); return; }
    const w = innerWidth, H = innerHeight;
    const surface = makeSurface({ className: "slime-cover", parent: document.body, width: w, height: H, dpr: Math.min(window.devicePixelRatio || 1, 1.5) });
    const scene = makeScene();
    scene.massDir = 1;
    const drips = makeDrips(w, H * 0.22);
    const full = H + 44;
    let phase = 0, tStart = performance.now(), last = tStart;
    const removeProbe = addProbe((x, y) => (sceneHit(scene, x, y) ? "light" : null));
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const time = now / 1000;
      let grow;
      if (phase === 0) {
        const p = clamp((now - tStart) / downMs);
        scene.massBase = full * p * p; grow = clamp(p * 1.2);
        if (p >= 1) { phase = 1; tStart = now; during?.(); }
      } else {
        const p = clamp((now - tStart) / upMs);
        // the level climbs back up; the drips stay behind for a moment, then are pulled up after it
        scene.massBase = (full + 60) * (1 - p * p * (3 - 2 * p)) - 60;
        grow = 1 - Math.pow(p, 3);
        if (p >= 1) { removeProbe(); surface.release(); resolve(); return; }
      }
      scene.time = time;
      scene.n = 0;
      // quick: this one follows the level closely, there is no time for a slow stretch
      for (const d of drips) { d.l = d.len * easeOut(clamp(grow * 1.6 - d.delay * 0.6), 2); d.neck = 0.85; }
      writeDrips(scene, drips, time);
      surface.draw(scene);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/* ACID gate's finale, played when the hold button is full: the portrait's skull bites the screen twice and swallows it.
     1  Black. The skull emerges with a glitch flicker on its pale blob, and idles: breathing, a jaw tremble, drips.
     2  First bite: anticipation, a tense opening, the snap, a hit-stop on contact, a damped bounce.
     3  Second bite: the same, wider and harder, and some teeth chip.
     4  The camera lunges into the open mouth: both rows of teeth swing in, huge, and clamp shut. A lime-and-black wave follows.
     5  Under the black the page is started (onCovered), and everything here dissolves into it.
   A click, a tap or Esc jumps to 5. Reduced motion, or no WebGL2: the skull fades in, closes its jaw once, and fades to the page.

   The skull is a rig (js/finale-rig.js) of sprites cut from the portrait's own dots (skullRig() in js/skull.js): the cranium, the
   mandible with its rami, every tooth, and a mouth cavity. At rest the pieces add up to the portrait's picture.
   The jaw angle comes from a small solver with fixed steps, not from a timeline. Every screen effect hangs on its CONTACT event.

   Layers, inside one shaking wrapper (a transform only, so nothing is laid out again):
     rig  WebGL2: the skull  /  glitch  2D canvas: slices of the rig  /  slime  js/slime-gl.js  /  fx  2D canvas: wave, scars, shards */
import { addProbe } from "./cursor-tone.js";
import { getLang } from "./i18n.js";
import { skullRig } from "./skull.js";
import { createRig } from "./finale-rig.js";
import { addPrim, makeScene, makeSurface, sceneHit, slimeDpr } from "./slime.js";

/* ---------- the two bites: tweak here. Times in seconds, angles in degrees ---------- */
const BITES = [
  { antic: 0.2, sink: 0.016, open: 34, openStiff: 150, openDamp: 19, hold: 0.1, snap: 0.09, hitStop: 0.07, rebound: 0.1, rest: 1.6, settle: 0.58,
    pull: 0.95, pitchBack: 7, pitchFwd: 5, recoil: 95, lunge: 1.32, roll: 0 },
  { antic: 0.14, sink: 0.022, open: 48, openStiff: 200, openDamp: 22, hold: 0.08, snap: 0.078, hitStop: 0.09, rebound: 0.12, rest: 2.4, settle: 0.42,
    pull: 0.9, pitchBack: 10, pitchFwd: 7, recoil: 150, lunge: 1.75, roll: 2.2 },
];
const APPEAR = 0.8, IDLE = 0.8;                // stage 1
const OPEN_MS_MIN = 0.3;                       // the opening lasts at least this long before the hold starts
const BOUNCE = { omega: 40, damping: 0.17, floor: 0.45 };   // the jaw's bounce after contact: speed, damping, how much a touch of the teeth gives back
const HEAD = { stiff: 170, damp: 15, snapStiff: 1500, snapDamp: 62, backStiff: 130, backDamp: 15 };
const TOOTH = { stiff: 1000, damp: 10, jitter: 0.0035, kick: 0.5, turn: 7, lag: 0.0065, reach: 0.014 }; // the teeth's own springs. jitter, reach: shares of the figure
const SWALLOW = { zoomT: 0.3, zoomScale: 6.5, jaw: 58, mouthV: 0.84, shotT: 0.16, teethScale: 3, swing: 58, hitStop: 0.06 };   // the shot into the mouth
const WAVE = 0.44, WAVE_LAG = 0.16;            // the lime-and-black wave after the last clamp: how long, the black's lag behind the lime
const DISSOLVE = 1.0;                          // into the page
const STILL = { fade: 0.45, hold: 0.45, clamp: 0.14, after: 0.35, out: 0.6, open: 12 };    // reduced motion
const STEP = 1 / 240;                          // the solver's fixed step
/* ---------- the hinge and the camera ---------- */
const PERSPECTIVE = 1100;                      // px, for a skull 630 px tall; it scales with the skull
const JAW = {
  hinge: 0.6,      // height of the jaw joints: the lower edge of the eye sockets
  depth: 0.27,     // how far in front of the hinge the chin lies
  push: 0.42,      // how far the jaw also comes toward the viewer as it opens
  stretch: 0.07,   // a slight lengthening with the angle, to sell the depth
};
const ARCH = 0.245;                             // half width of the jaw bone's curve: at this distance from the middle the depth is gone
/* ---------- how hard ---------- */
const SHAKE = { wind: 3, hit1: 22, hit2: 44, hit3: 70, decay: 0.3 };   // px, and the time it dies away in
const GLITCH = { first: 0.2, second: 0.46 };                           // how long the slices last after each contact
const COUNTS = { // [desktop, phone]
  shards: [[64, 26], [130, 52]], dust: [[120, 40], [260, 90]], chips: [14, 7],
  blobs: [[7, 4], [11, 6]], streaks: [[9, 5], [13, 7]], cracks: [[6, 4], [10, 6]],
};
/* ---------- the skull's geometry, as shares of its 4:5 figure (measured on public/img/skull-tone.webp) ---------- */
const GEO = {
  cut: 0.7795,                    // the middle of the dark bite line
  upperTop: 0.694, upperRootTop: 0.686, upperGum: [0.678, 0.722],
  lowerRoot: 0.852, lowerRootEnd: 0.858,
  seamL: 0.297, seamR: 0.708,     // the rami are the columns outside these
  ramusTop: 0.64,
  cavity: { u0: 0.302, u1: 0.702, v0: 0.7, v1: 1.0 },
};
const FIG_H = 0.7, FIG_W_PHONE = 0.85;         // size on screen: share of the height, at most this share of the width
const PALE = "#E6FF99", LIME = "#B8FF00", WHITE = "#FFFFFF", BLACK = "#000000";
const GLASS = "#0C1600";                       // the screen once it has been hit: faintly lit, so a bite out of it reads as a hole
const RAD = Math.PI / 180;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const rand = (a, b) => a + Math.random() * (b - a);
const outC = (t) => 1 - Math.pow(1 - t, 3);
const inC = (t) => t * t * t;
const smooth = (a, b, x) => { const e = clamp((x - a) / (b - a)); return e * e * (3 - 2 * e); };
const mix = (a, b, t) => a + (b - a) * t;

let abortCurrent = null;
export function abortFinale() { abortCurrent?.(); }

const canvas = (w, h) => {
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.ceil(w));
  cv.height = Math.max(1, Math.ceil(h));
  return cv;
};

/* ---------- pictures, drawn once ---------- */
function sizes(W, H) {
  const figW = Math.min(H * FIG_H * 0.8, W * FIG_W_PHONE);
  return { W, H, figW, figH: figW * 1.25 };
}

/* The same egg as `.hero__portrait::before` in css/acid.css: its box, its tilt and its corner radii. */
function eggPath(c, x, y, w, h) {
  const R = [[0.47, 0.37], [0.53, 0.39], [0.48, 0.61], [0.52, 0.63]].map(([a, b]) => [a * w, b * h]);
  const [tl, tr, br, bl] = R, Q = Math.PI / 2;
  c.beginPath();
  c.ellipse(x + tl[0], y + tl[1], tl[0], tl[1], 0, Q * 2, Q * 3);
  c.ellipse(x + w - tr[0], y + tr[1], tr[0], tr[1], 0, Q * 3, Q * 4);
  c.ellipse(x + w - br[0], y + h - br[1], br[0], br[1], 0, 0, Q);
  c.ellipse(x + bl[0], y + h - bl[1], bl[0], bl[1], 0, Q, Q * 2);
  c.closePath();
}

let cache = null;
/** Draws everything the finale shows and hands it to the GPU. Called during the hold, so the first frame finds it all ready. */
export async function prepareFinale() {
  const dims = sizes(innerWidth, innerHeight);
  if (cache?.figW === dims.figW && cache?.W === dims.W && cache?.H === dims.H) return cache;
  cache?.gl?.dispose();
  const { W, H, figW, figH } = dims;
  const phone = W < 720 || W / H < 1.15 || matchMedia("(pointer: coarse)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
  // twice the screen's density: mipmaps then give a clean picture at rest and there is detail left for the lunges
  const res = Math.min(dpr * 2, 4096 / figH);
  const rig = await skullRig(figW, figH, res, GEO);

  // the egg: the same box, tilt and radii as the portrait's. Flat, so the screen's own density is enough.
  const pad = 0.1, eggRes = Math.max(1, dpr);
  const egg = canvas(figW * (1 + pad * 2) * eggRes, figH * (1 + pad * 2) * eggRes);
  const b = egg.getContext("2d");
  b.scale(eggRes, eggRes);
  b.translate(figW * pad, figH * pad);
  const ex = -0.039 * figW, ey = 0.028 * figH, ew = 1.083 * figW, eh = 0.989 * figH;
  b.translate(ex + ew / 2, ey + eh / 2);
  b.rotate((3 * Math.PI) / 180);
  b.translate(-(ex + ew / 2), -(ey + eh / 2));
  eggPath(b, ex, ey, ew, eh);
  b.fillStyle = PALE;
  b.fill();
  b.lineWidth = 2;
  b.strokeStyle = BLACK;
  b.stroke();
  const eggSprite = { cv: egg, u0: -pad, v0: -pad, u1: 1 + pad, v1: 1 + pad };

  // a speck of dust floating in the mouth
  const speck = canvas(16, 16);
  const sp = speck.getContext("2d");
  sp.fillStyle = PALE;
  sp.beginPath(); sp.arc(8, 8, 6, 0, 6.2832); sp.fill();

  // a patch of the same halftone, for the chips that fly off the teeth
  const chipCv = canvas(cell2(rig) * 2, cell2(rig) * 1.732);
  const ch = chipCv.getContext("2d");
  const cc = cell2(rig);
  ch.fillStyle = "#1A1A1A";
  for (const [x, y] of [[0, 0], [cc, 0], [cc * 2, 0], [cc / 2, cc * 0.866], [cc * 1.5, cc * 0.866], [0, cc * 1.732], [cc, cc * 1.732], [cc * 2, cc * 1.732]]) { ch.beginPath(); ch.arc(x, y, cc * 0.3, 0, 6.2832); ch.fill(); }

  const art = { ...dims, dpr, phone, rig, eggSprite, speck, chipCv, gl: null };
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const gl = createRig({ W, H, dpr, figW, figH, perspective: (PERSPECTIVE * figH) / 630, jawCfg: JAW, arch: ARCH });
    if (gl) {
      art.gl = gl;
      art.tex = {
        egg: gl.upload(eggSprite),
        cavity: gl.upload(rig.cavity),
        speck: gl.upload({ cv: speck, u0: 0, v0: 0, u1: 0.01, v1: 0.008 }),
        cranium: gl.upload(rig.cranium),
        mandible: gl.upload(rig.mandible, gl.fine),
        upper: rig.upper.map((t) => gl.upload(t)),
        lower: rig.lower.map((t) => gl.upload(t, gl.fine)),
        gumU: gl.upload(rig.gumU),
        gumL: gl.upload(rig.gumL),
      };
    }
  }
  cache = art;
  return art;
}
const cell2 = (rig) => Math.ceil(rig.cell * 2);

/* ---------- scars: a bite out of the screen's edge and the cracks around it ---------- */
/* A jagged arc of tooth marks around (cx, cy). Painted black over everything, so the screen looks bitten away. */
function drawBite(c, cx, cy, radius, from, to, dark) {
  const teeth = Math.round((to - from) * radius / Math.max(34, radius * 0.27));
  const line = new Path2D();
  let first = null;
  for (let i = 0; i <= teeth; i++) {
    const a = from + ((to - from) * i) / teeth, a2 = a + ((to - from) / teeth) * 0.5;
    const r1 = radius * rand(0.9, 1), r2 = radius * rand(0.68, 0.8);
    const x = cx + Math.cos(a) * r1, y = cy + Math.sin(a) * r1;
    first ??= [x, y];
    line.lineTo(x, y);
    if (i < teeth) line.lineTo(cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2);
  }
  const hole = new Path2D();
  hole.moveTo(cx, cy);
  hole.addPath(line);
  hole.closePath();
  c.fillStyle = dark;
  c.fill(hole);
  c.lineJoin = "miter";
  c.strokeStyle = LIME;
  c.lineWidth = Math.max(2.5, radius * 0.016);
  c.stroke(line);
  c.strokeStyle = WHITE;
  c.lineWidth = 1;
  c.stroke(line);
}

function drawCrack(c, x, y, angle, length, depth) {
  // straight runs with sudden turns, like glass: thin, and each may split
  let a = angle, left = length;
  c.beginPath();
  c.moveTo(x, y);
  const branches = [];
  while (left > 0) {
    const step = Math.min(left, rand(18, 64));
    a += rand(-0.42, 0.42);
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    c.lineTo(x, y);
    left -= step;
    if (depth > 0 && Math.random() < 0.34) branches.push([x, y, a + rand(0.5, 1) * (Math.random() < 0.5 ? -1 : 1), left * rand(0.3, 0.6)]);
  }
  c.stroke();
  for (const [bx, by, ba, bl] of branches) drawCrack(c, bx, by, ba, bl, depth - 1);
}

/* ---------- the finale ---------- */
/** onCovered() fires once while the page is fully hidden; the promise resolves when everything here is gone. */
export function runFinale({ reduce = false, onCovered } = {}) {
  return prepareFinale().then((art) => new Promise((resolve) => {
    const { W, H, figW, figH, phone, dpr, rig, tex } = art;
    const simple = reduce || !art.gl;   // no shake, no glitch, no zoom
    const count = (pair) => pair[phone ? 1 : 0];
    const canBuzz = typeof navigator.vibrate === "function" && matchMedia("(pointer: coarse)").matches;

    /* ----- the DOM: all of it goes away at the end ----- */
    const root = document.createElement("div");
    root.className = "ak-finale";
    root.setAttribute("role", "img");
    root.setAttribute("aria-label", getLang() === "en" ? "A skull bites the screen twice" : "Череп дважды кусает экран");
    const wrap = document.createElement("div");
    wrap.className = "ak-finale__shake";
    const layer2D = () => {
      const cv = canvas(W * dpr, H * dpr);
      cv.className = "ak-finale__layer";
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      return cv;
    };
    const stageCv = layer2D(), fxCv = layer2D();
    const c = stageCv.getContext("2d");   // the simple version's stage, and the glitch's slices over the rig
    const f = fxCv.getContext("2d");
    root.append(wrap);
    document.body.append(root);
    let surface = null;
    const scene = makeScene();
    if (!simple) {
      wrap.append(art.gl.canvas, stageCv);
      surface = makeSurface({ className: "ak-finale__layer", parent: wrap, width: W, height: H, dpr: slimeDpr(W) });
      wrap.append(fxCv);
    } else wrap.append(stageCv);

    /* ----- ending and failsafes ----- */
    let finished = false, covered = false, raf = 0, removeProbe = () => {};
    const cover = () => {
      if (covered) return;
      covered = true;
      coveredAt = clock;
      if (surface) { surface.release(); surface = null; } // the page can have this context for its own slime
      try { onCovered?.(); } catch (e) { console.warn("finale:", e); }
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      removeProbe();
      window.removeEventListener("keydown", onKey);
      root.removeEventListener("pointerdown", onTap);
      abortCurrent = null;
      cover();
      root.remove();
      art.gl?.dispose();
      cache = null;
      resolve();
    };
    abortCurrent = finish;
    let skipTo = () => {};
    const onTap = () => skipTo();
    const onKey = (e) => { if (e.key === "Escape") skipTo(); };
    root.addEventListener("pointerdown", onTap);
    window.addEventListener("keydown", onKey);

    /* ----- the clock (it stops with a hidden tab) ----- */
    let clock = 0, last = performance.now(), coveredAt = 0;

    /* ----- the simple version: 2D, one fade, one close, one fade ----- */
    if (simple) {
      const stack = (sprites) => {
        const cv = canvas(figW * dpr, figH * dpr);
        const x = cv.getContext("2d");
        for (const s of sprites) x.drawImage(s.cv, s.u0 * cv.width, s.v0 * cv.height, (s.u1 - s.u0) * cv.width, (s.v1 - s.v0) * cv.height);
        return cv;
      };
      const upper = stack([rig.cranium, ...rig.upper]), lower = stack([rig.mandible, ...rig.lower]);
      const S = STILL, clampAt = S.fade + S.hold, coverAt = clampAt + S.clamp + S.after;
      const x0 = (W - figW) / 2, y0 = (H - figH) / 2;
      const gapH = figH * 0.09;
      skipTo = () => { clock = Math.max(clock, coverAt); };
      removeProbe = addProbe((x, y) => (covered ? null : Math.hypot((x - W / 2) / (figW * 0.54), (y - H / 2) / (figH * 0.5)) < 1 ? "light" : "dark"));
      const still = (now) => {
        if (finished) return;
        try {
          clock += Math.min(0.05, (now - last) / 1000); last = now;
          const alpha = clamp(clock / S.fade) * (1 - clamp((clock - clampAt - S.clamp - S.after * 0.3) / (S.after * 0.7)));
          const open = clock < clampAt ? 1 : 1 - clamp((clock - clampAt) / S.clamp);
          c.setTransform(dpr, 0, 0, dpr, 0, 0);
          c.fillStyle = BLACK;
          c.fillRect(0, 0, W, H);
          c.globalAlpha = alpha;
          const p = art.eggSprite;
          c.drawImage(p.cv, x0 + p.u0 * figW, y0 + p.v0 * figH, (p.u1 - p.u0) * figW, (p.v1 - p.v0) * figH);
          if (open > 0.01) {
            const q = rig.cavity;
            c.drawImage(q.cv, x0 + q.u0 * figW, y0 + q.v0 * figH, (q.u1 - q.u0) * figW, (q.v1 - q.v0) * figH);
          }
          c.drawImage(lower, x0, y0 + gapH * open, figW, figH);
          c.drawImage(upper, x0, y0, figW, figH);
          c.globalAlpha = 1;
          if (clock >= coverAt) {
            cover();
            root.style.pointerEvents = "none";
            root.style.opacity = String(1 - clamp((clock - coverAt) / S.out));
          }
          if (clock >= coverAt + S.out) { finish(); return; }
          raf = requestAnimationFrame(still);
        } catch (e) { console.warn("finale:", e); finish(); }
      };
      raf = requestAnimationFrame((now) => { last = now; still(now); });
      return;
    }

    /* ----- the solver's state. Nothing below allocates per frame. ----- */
    const P_APPEAR = 0, P_ANTIC = 1, P_OPEN = 2, P_HOLD = 3, P_SNAP = 4, P_STOP = 5, P_BOUNCE = 6, P_ZOOM = 7, P_SHOT = 8, P_SHOT_STOP = 9, P_WAVE = 10;
    let phase = P_APPEAR, phaseT = 0, bite = 0, snapAccel = 0;
    let jaw = 0, jawV = 0;              // degrees, degrees per second
    let pitch = 0, pitchV = 0;          // the head's tilt: + is back
    let scale = 0.88, scaleV = 0;
    let sinkY = 0, sinkV = 0, roll = 0, rollV = 0, shift = 0;
    let shotT = 0, shotBack = 0, shotBackV = 0;
    let waveAt = Infinity;
    let hit1At = -1e3, hit2At = -1e3;
    const N = 16;
    const toothY = new Float32Array(N), toothVy = new Float32Array(N), toothR = new Float32Array(N), toothVr = new Float32Array(N);
    const toothF = new Float32Array(N), toothP = new Float32Array(N), toothW = new Float32Array(N);
    for (let i = 0; i < N; i++) { toothF[i] = rand(31, 67); toothP[i] = rand(0, 6.28); toothW[i] = rand(0.6, 1.4); }
    const chipped = new Set(phone ? [3, 11] : [2, 5, 11, 13]);

    const toothRoot = (i) => {
      const cols = i < 8 ? rig.upperCols[i] : rig.lowerCols[i - 8];
      return (cols[0] + cols[1]) / 2;
    };
    const rootX = new Float32Array(N), rootY = new Float32Array(N), tipU = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      tipU[i] = toothRoot(i);
      rootX[i] = (tipU[i] - 0.5) * figW;
      rootY[i] = ((i < 8 ? GEO.upperRootTop : GEO.lowerRootEnd) - 0.5) * figH;
    }

    const enter = (p) => { phase = p; phaseT = 0; };
    function contact(n) {
      // THE moment the teeth meet. Everything that happens on screen starts here.
      jaw = 0; jawV = 0;
      if (n === 0) { hit1At = clock; strike(SHAKE.hit1, false); enter(P_STOP); }
      else { hit2At = clock; strike(SHAKE.hit2, true); enter(P_STOP); }
      reformStrings();
    }
    function kickTeeth(power) {
      const k = TOOTH.kick * figH * power;
      for (let i = 0; i < N; i++) {
        const more = chipped.has(i) ? 1.8 : 1;
        toothVy[i] += rand(-1, 1) * k * more;
        toothVr[i] += rand(-1, 1) * TOOTH.turn * power * more;
      }
    }
    /* One fixed step of everything that has weight. */
    function step(h) {
      phaseT += h;
      const b = BITES[bite];
      const frozen = phase === P_STOP || phase === P_SHOT_STOP;
      const n1 = Math.sin(clock * 47) * 0.6 + Math.sin(clock * 83) * 0.4; // the tense shiver
      let jawTo = 0, kJ = 200, cJ = 26, pitchTo = 0, scaleTo = 1, sinkTo = 0, rollTo = 0, kH = HEAD.stiff, cH = HEAD.damp, tense = 0;
      switch (phase) {
        case P_APPEAR: {
          const e = clamp(phaseT / APPEAR);
          scaleTo = 1 + Math.sin(clock * 2.5) * 0.012;
          jawTo = 0.5 + 0.35 * e * n1;
          kH = 60; cH = 12;
          if (phaseT >= APPEAR + IDLE) enter(P_ANTIC);
          break;
        }
        case P_ANTIC:
          // anticipation: the skull sinks and gathers itself, the jaw shivers shut
          jawTo = 0.3 + 0.55 * n1;
          kJ = 700; cJ = 26;
          pitchTo = -b.pitchBack * 0.28;
          scaleTo = 0.985;
          sinkTo = b.sink * figH;
          tense = 0.6;
          if (phaseT >= b.antic) enter(P_OPEN);
          break;
        case P_OPEN:
          jawTo = b.open + n1 * 1.3;
          kJ = b.openStiff; cJ = b.openDamp;
          pitchTo = b.pitchBack; scaleTo = b.pull; rollTo = b.roll; sinkTo = -figH * 0.012;
          tense = 1;
          if (phaseT >= OPEN_MS_MIN && jaw > b.open * 0.93) enter(P_HOLD);
          break;
        case P_HOLD:
          jawTo = b.open + n1 * 1.9;
          kJ = b.openStiff * 2; cJ = b.openDamp * 1.4;
          pitchTo = b.pitchBack; scaleTo = b.pull; rollTo = b.roll; sinkTo = -figH * 0.012;
          tense = 1.3;
          if (phaseT >= b.hold) { snapAccel = (2 * jaw) / (b.snap * b.snap); jawV = 0; enter(P_SNAP); }
          break;
        case P_SNAP:
          pitchTo = -b.pitchFwd; scaleTo = b.lunge; rollTo = -b.roll * 0.55;
          kH = HEAD.snapStiff; cH = HEAD.snapDamp;
          break;
        case P_STOP:
          // the hit-stop: the skull holds still for a beat while the screen takes the blow
          if (phaseT >= b.hitStop) {
            jawV = b.open * b.rebound * BOUNCE.omega * 0.95;
            pitchV += b.recoil;
            kickTeeth(bite ? 1.3 : 1);
            enter(P_BOUNCE);
          }
          break;
        case P_BOUNCE: {
          jawTo = b.rest;
          const w = BOUNCE.omega;
          kJ = w * w; cJ = 2 * BOUNCE.damping * w;
          pitchTo = 0; scaleTo = 1 + (bite ? 0.12 : 0) + Math.sin(clock * 2.5) * 0.01;
          kH = HEAD.backStiff; cH = HEAD.backDamp;
          rollTo = 0;
          if (phaseT >= b.settle) {
            if (bite === 0) { bite = 1; enter(P_ANTIC); }
            else { shift = 0; enter(P_ZOOM); }
          }
          break;
        }
        case P_ZOOM:
          jawTo = SWALLOW.jaw; kJ = 900; cJ = 50;
          pitchTo = 4; rollTo = 0; tense = 0.8;
          break;
        default:
          break;
      }
      if (phase === P_SNAP) {
        // ease-in by constant acceleration; the teeth stop it
        jawV -= snapAccel * h;
        jaw += jawV * h;
        if (jaw <= 0) contact(bite);
      } else if (!frozen && phase <= P_ZOOM) {
        jawV += ((jawTo - jaw) * kJ - jawV * cJ) * h;
        jaw += jawV * h;
        if (jaw < 0) { jaw = 0; jawV = -jawV * BOUNCE.floor; } // the teeth meet again: smaller each time
      }
      if (!frozen) {
        pitchV += ((pitchTo - pitch) * kH - pitchV * cH) * h;
        pitch += pitchV * h;
        rollV += ((rollTo - roll) * kH - rollV * cH) * h;
        roll += rollV * h;
        if (phase === P_ZOOM) {
          const e = clamp(phaseT / SWALLOW.zoomT);
          scale = mix(zoomFrom, SWALLOW.zoomScale, e * e * e);
          scaleV = 0;
          if (e >= 1) { blobs.length = 0; streaks.length = 0; enter(P_SHOT); } // the camera has passed through the glass and what was on it
        } else {
          scaleV += ((scaleTo - scale) * kH - scaleV * cH) * h;
          scale += scaleV * h;
          zoomFrom = scale;
        }
        sinkV += ((sinkTo - sinkY) * kH - sinkV * cH) * h;
        sinkY += sinkV * h;
        // each tooth on its own spring: dragged along late when the jaw moves, rattled when tense
        const k = TOOTH.stiff, d = TOOTH.damp, reach = TOOTH.reach * figH;
        for (let i = 0; i < N; i++) {
          const drag = i < 8 ? 0 : -jawV * TOOTH.lag * figH * 0.1 * toothW[i];
          const rattle = tense * Math.sin(clock * toothF[i] + toothP[i]) * TOOTH.jitter * figH * k;
          toothVy[i] += (-toothY[i] * k - toothVy[i] * d + rattle + drag * k * 0.1) * h;
          toothY[i] += toothVy[i] * h;
          if (toothY[i] > reach) { toothY[i] = reach; toothVy[i] *= -0.3; } else if (toothY[i] < -reach) { toothY[i] = -reach; toothVy[i] *= -0.3; }
          toothVr[i] += (-toothR[i] * k * 0.6 - toothVr[i] * d * 0.8) * h;
          toothR[i] += toothVr[i] * h;
        }
      }
      if (phase === P_SHOT) {
        shotT = clamp(phaseT / SWALLOW.shotT);
        if (shotT >= 1) {
          strikeLast();
          enter(P_SHOT_STOP);
        }
      } else if (phase === P_SHOT_STOP) {
        if (phaseT >= SWALLOW.hitStop) { shotBackV = 900; waveAt = clock; enter(P_WAVE); }
      } else if (phase === P_WAVE) {
        shotBackV += (-shotBack * 900 - shotBackV * 16) * h;
        shotBack += shotBackV * h;
        if (shotBack < 0) { shotBack = 0; shotBackV = -shotBackV * 0.4; }
      }
      clock += h;
    }
    let zoomFrom = 1;

    /* ----- where a point of the skull is on screen: the rig's math, for the other layers. Results in PX, PY. ----- */
    const PERSP = (PERSPECTIVE * figH) / 630;
    let PX = 0, PY = 0;
    const AXIS = 0.42;
    function project(u, v, onJaw) {
      let x = (u - 0.5) * figW, y = (v - 0.5) * figH, z = 0;
      if (onJaw) {
        const th = jaw * RAD, s = Math.sin(th), cs = Math.cos(th), hh = (v - JAW.hinge) * figH;
        const e = Math.abs((u - 0.5) / ARCH), prof = clamp(1 - e * e * e), r = clamp((v - JAW.hinge - 0.04) / 0.16), D = JAW.depth * figH * prof * r * r * (3 - 2 * r);
        y = (JAW.hinge - 0.5) * figH + hh * cs * (1 + JAW.stretch * s) + D * s;
        z = -hh * s + D * (cs - 1) + JAW.push * figH * s * prof;
      }
      const pv = (AXIS - 0.5) * figH, b = y - pv, ph = pitch * RAD, cp = Math.cos(ph), sp = Math.sin(ph);
      const y2 = b * cp - z * sp, z2 = b * sp + z * cp, ro = roll * RAD, cw = Math.cos(ro), sw = Math.sin(ro);
      const w = Math.max(0.1, 1 - (z2 * scale) / PERSP);
      PX = W / 2 + ((x * cw - y2 * sw) * scale) / w;
      PY = H / 2 + (((y2 * cw + x * sw + pv) * scale) + sinkY + shift) / w;
    }

    /* ----- drawing the rig ----- */
    const GL = art.gl;
    function drawTeeth(list, from, onJaw, alpha, inverted) {
      for (let i = 0; i < 8; i++) {
        const j = from + i;
        GL.draw(list[i], onJaw, alpha, inverted, 0, toothY[j], toothR[j] * RAD, rootX[j], rootY[j]);
      }
    }
    function drawRig(inverted, alpha) {
      if (inverted) GL.clear(0.722, 1, 0);
      else if (hit1At > 0) GL.clear(0.047, 0.086, 0); // GLASS
      else GL.clear(0, 0, 0);
      if (phase === P_ZOOM) shift = -(SWALLOW.mouthV - 0.5) * figH * scale * clamp(phaseT / SWALLOW.zoomT);
      GL.head(pitch * RAD, roll * RAD, 0, scale, AXIS, sinkY + shift);
      GL.jaw(jaw * RAD);
      GL.draw(tex.egg, false, alpha, inverted, 0, 0, 0, 0, 0);
      // the mouth: only there when it is open
      const a = smooth(0.15, 2.5, jaw) * alpha;
      if (a > 0.003 && !inverted) {
        GL.draw(tex.cavity, false, a, false, 0, 0, 0, 0, 0);
        // specks of dust, drifting in the dark
        for (let i = 0; i < SPECKS.length; i += 4) {
          const u = SPECKS[i] + Math.sin(clock * SPECKS[i + 2] + i) * 0.012;
          const v = SPECKS[i + 1] + Math.sin(clock * SPECKS[i + 3] + i * 2.1) * 0.012;
          const sq = SPECKS[i + 2] * 0.0018 + 0.0018;
          tex.speck.u0 = u - sq; tex.speck.u1 = u + sq; tex.speck.v0 = v - sq * 0.8; tex.speck.v1 = v + sq * 0.8;
          GL.draw(tex.speck, false, a * 0.75, false, 0, 0, 0, 0, 0);
        }
      }
      GL.draw(tex.cranium, false, alpha, inverted, 0, 0, 0, 0, 0);
      // the smear: during the snap, the jaw also where it just was
      if (phase === P_SNAP && !inverted) {
        for (let g = 2; g >= 1; g--) {
          GL.jaw((jaw - jawV * 0.011 * g) * RAD);
          const ga = alpha * (g === 1 ? 0.3 : 0.15);
          GL.draw(tex.mandible, true, ga, false, 0, 0, 0, 0, 0);
          drawTeeth(tex.lower, 8, true, ga, false);
        }
        GL.jaw(jaw * RAD);
      }
      GL.draw(tex.mandible, true, alpha, inverted, 0, 0, 0, 0, 0);
      drawTeeth(tex.lower, 8, true, alpha, inverted);
      // the upper row bites in front of the lower one
      drawTeeth(tex.upper, 0, false, alpha, inverted);
    }
    /* The shot inside the mouth: the same tooth sprites, huge, swinging in from the edges of the screen. */
    const rowShare = rig.upperCols[7][1] - rig.upperCols[0][0];
    const shotScale = Math.max(SWALLOW.teethScale, Math.min(5.2, (W * 0.98) / (rowShare * figW)));
    function drawShot() {
      GL.clear(0, 0, 0);
      GL.jaw(0);
      const cavS = Math.max(W / (rig.cavity.u1 - rig.cavity.u0) / figW, H / (rig.cavity.v1 - rig.cavity.v0) / figH) * 1.04;
      GL.head(0, 0, 0, cavS, 0.85, -(0.85 - 0.5) * figH * cavS);
      GL.draw(tex.cavity, false, 1, false, 0, 0, 0, 0, 0);
      const e = inC(shotT), open = 1 - e + shotBack / 900;
      const pv = (GEO.cut - 0.5) * figH * shotScale;
      const travel = H * 0.62 * open;
      GL.head(SWALLOW.swing * RAD * open, 0, 0, shotScale, GEO.cut, -pv - travel);
      GL.draw(tex.gumU, false, 1, false, 0, 0, 0, 0, 0);
      drawTeeth(tex.upper, 0, false, 1, false);
      GL.head(-SWALLOW.swing * RAD * open, 0, 0, shotScale, GEO.cut, -pv + travel);
      GL.draw(tex.gumL, false, 1, false, 0, 0, 0, 0, 0);
      drawTeeth(tex.lower, 8, false, 1, false);
    }

    /* ----- scars: a layer of its own that only changes at the moment of a bite ----- */
    const scarRes = Math.min(dpr, 1.5);
    const scars = canvas(W * scarRes, H * scarRes);
    const sc = scars.getContext("2d");
    sc.scale(scarRes, scarRes);
    const scar = (hard) => {
      const small = Math.min(W, H);
      // the first bite takes the upper right edge, the second a bigger chunk of the lower left. On a phone they are smaller.
      const [cx, cy, radius, a0, a1] = hard
        ? [phone ? W * 0.1 : W * 0.16, H * 1.02, small * (phone ? 0.42 : 0.56), -Math.PI * 0.98, -Math.PI * 0.02]
        : [phone ? W * 0.94 : W * 0.82, -H * 0.02, small * (phone ? 0.3 : 0.4), Math.PI * 0.02, Math.PI * 0.98];
      sc.lineCap = "round";
      sc.lineJoin = "round";
      // cracks run from the bite across the glass: a glow under a thin bright line
      const n = count(hard ? COUNTS.cracks[1] : COUNTS.cracks[0]);
      const toCentre = Math.atan2(H / 2 - cy, W / 2 - cx);
      for (let i = 0; i < n; i++) {
        const a = toCentre + (i - (n - 1) / 2) * (hard ? 0.34 : 0.4) + rand(-0.1, 0.1);
        const len = small * rand(0.3, hard ? 0.9 : 0.6);
        const sx = cx + Math.cos(a) * radius * 0.82, sy = cy + Math.sin(a) * radius * 0.82;
        // a faint wide line and a bright thin one. They are two separate random lines on purpose: light scatters in broken glass.
        sc.strokeStyle = "rgba(184, 255, 0, .28)";
        sc.lineWidth = hard ? 5 : 4;
        drawCrack(sc, sx, sy, a, len, 2);
        sc.strokeStyle = Math.random() < 0.25 ? WHITE : LIME;
        sc.lineWidth = hard ? 1.7 : 1.3;
        drawCrack(sc, sx, sy, a, len, 2);
      }
      drawBite(sc, cx, cy, radius, a0, a1, BLACK);
    };

    /* ----- shards and dust fly at the viewer: they start small near the skull and grow past the screen ----- */
    const shardN = count(COUNTS.shards[1]), dustN = count(COUNTS.dust[1]);
    const shards = Array.from({ length: shardN + count(COUNTS.chips) }, () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, z: 0, vz: 0, r: 0, vr: 0, s: 0, pale: false, cut: 0, chip: false }));
    const dust = Array.from({ length: dustN }, () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, z: 0, vz: 0, s: 0, lime: false }));
    const burst = (n, nd, x, y, power) => {
      let left = n;
      for (const o of shards) {
        if (o.on || left <= 0) continue;
        left--;
        const a = rand(0, 6.2832), v = rand(160, 620) * power;
        Object.assign(o, { on: true, x: x + rand(-figW, figW) * 0.2, y: y + rand(-figH, figH) * 0.06, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, z: 1, vz: rand(1.4, 3.6) * power, r: rand(0, 6.28), vr: rand(-9, 9), s: rand(4, 13), pale: Math.random() < 0.72, cut: rand(0.35, 0.8), chip: false });
      }
      left = nd;
      for (const o of dust) {
        if (o.on || left <= 0) continue;
        left--;
        const a = rand(0, 6.2832), v = rand(70, 520) * power;
        Object.assign(o, { on: true, x: x + rand(-figW, figW) * 0.34, y: y + rand(-figH, figH) * 0.14, vx: Math.cos(a) * v, vy: Math.sin(a) * v, z: 1, vz: rand(0.6, 2.4) * power, s: rand(1, 3.6), lime: Math.random() < 0.55 });
      }
    };
    /* Bits of a tooth: thrown out of the mouth from a few of the teeth, at the viewer, in the skull's own halftone. */
    const chipFill = f.createPattern(art.chipCv, "repeat");
    const chips = (n) => {
      let left = n, k = 0;
      const which = [...chipped];
      for (const o of shards) {
        if (o.on || left <= 0) continue;
        left--;
        const i = which[k++ % which.length];
        project(tipU[i], GEO.cut, i >= 8);
        const a = rand(-2.6, -0.5), v = rand(240, 620);
        Object.assign(o, { on: true, x: PX, y: PY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, z: 1, vz: rand(2, 4.4), r: rand(0, 6.28), vr: rand(-12, 12), s: rand(9, 17) * (figW / 480), pale: true, cut: rand(0.4, 0.8), chip: true });
      }
    };
    function drawParticles(dt) {
      const paintDust = (lime) => {
        f.fillStyle = lime ? LIME : PALE;
        f.beginPath();
        for (const o of dust) {
          if (!o.on || o.lime !== lime) continue;
          const r = o.s * o.z;
          f.moveTo(o.x + r, o.y);
          f.arc(o.x, o.y, r, 0, 6.2832);
        }
        f.fill();
      };
      for (const o of dust) {
        if (!o.on) continue;
        o.z += o.vz * dt;
        o.x += o.vx * o.z * dt;
        o.y += o.vy * o.z * dt + 40 * dt;
        if (o.z > 6 || o.x < -60 || o.x > W + 60 || o.y < -60 || o.y > H + 60) o.on = false;
      }
      paintDust(true);
      paintDust(false);
      // a shard is a tooth's sharp triangle, its dark outline keeps it visible on the pale blob
      for (const o of shards) {
        if (!o.on) continue;
        o.z += o.vz * dt;
        o.x += o.vx * o.z * dt;
        o.y += o.vy * o.z * dt;
        o.r += o.vr * dt;
        if (o.z > 7 || o.x < -120 || o.x > W + 120 || o.y < -120 || o.y > H + 120) { o.on = false; continue; }
        const s = o.s * o.z, cos = Math.cos(o.r), sin = Math.sin(o.r);
        f.beginPath();
        f.moveTo(o.x + cos * s, o.y + sin * s);
        f.lineTo(o.x - sin * s * 0.5, o.y + cos * s * 0.5);
        f.lineTo(o.x - cos * s * o.cut, o.y - sin * s * o.cut);
        f.closePath();
        f.fillStyle = o.pale ? PALE : WHITE;
        f.fill();
        if (o.chip && chipFill) { f.fillStyle = chipFill; f.fill(); }
        f.strokeStyle = BLACK;
        f.lineWidth = 1;
        f.stroke();
      }
    }

    /* ----- slime: drips from the upper teeth, strings that stretch between the rows and snap, splashes on the glass ----- */
    const toothDrips = [1, 3, 4, 6].slice(0, phone ? 3 : 4).map((i) => ({ i, l: 0, len: rand(0.03, 0.08) * figH, r: rand(2.6, 4.2) * (figW / 480) + 1.2, v: rand(0.5, 1) }));
    const strings = (phone ? [1, 4, 6] : [0, 2, 3, 5, 7]).map((i) => ({ i, r: rand(0.0048, 0.0078) * figW + 0.6, snapAt: 0, broke: false, top: 0, bottom: 0, x: 0, xb: 0, yt: 0, yb: 0 }));
    function reformStrings() { for (const o of strings) { o.broke = false; o.top = o.bottom = 0; o.snapAt = rand(0.07, 0.17) * figH; } }
    reformStrings();
    const blobs = [], streaks = [];
    const splash = (hard) => {
      const k = Math.min(W, H) / 900;
      const nb = count(hard ? COUNTS.blobs[1] : COUNTS.blobs[0]), ns = count(hard ? COUNTS.streaks[1] : COUNTS.streaks[0]);
      // where it hits: an uneven group, thrown out of the mouth at the glass
      const mx = W / 2, my = H * 0.52;
      const spreadX = W * (hard ? 0.42 : 0.3), spreadY = H * (hard ? 0.36 : 0.26);
      for (let i = 0; i < nb; i++) {
        const x = mx + rand(-1, 1) * spreadX, y = my + rand(-1, 0.8) * spreadY;
        const big = rand(hard ? 30 : 22, hard ? 78 : 54) * k * (i === 0 ? 1.25 : 1);
        blobs.push({ x, y, r: 0, v: 0, to: big });
        // lumps around it: thrown liquid is never round
        for (let j = 0, m = phone ? 1 : 3; j < m; j++) {
          const a = rand(0, 6.2832), far = big * rand(0.75, 1.5);
          blobs.push({ x: x + Math.cos(a) * far, y: y + Math.sin(a) * far * 0.8, r: 0, v: 0, to: big * rand(0.2, 0.5) });
        }
        // and a thrown droplet or two, separate from it
        const a = rand(0, 6.2832), far = big * rand(2.1, 3.2);
        blobs.push({ x: x + Math.cos(a) * far, y: y + Math.sin(a) * far, r: 0, v: 0, to: rand(3, 9) * k + 1.5 });
      }
      const mains = blobs.filter((b) => b.to > 14 * k);
      for (let i = 0; i < ns; i++) {
        const b = mains[Math.floor(Math.random() * mains.length)];
        streaks.push({ x: b.x + rand(-0.8, 0.8) * b.to, y: b.y, l: 0, r: rand(3.5, hard ? 10 : 8) * k + 2, to: rand(0.14, hard ? 0.5 : 0.36) * H, v: rand(0.12, 0.3) });
      }
    };
    function drawSlime(dt, wave) {
      scene.n = 0;
      scene.time = clock;
      if (phase <= P_ZOOM) {
        // first the teeth drips: they hang from the tips of the teeth
        for (const d of toothDrips) {
          if (clock < APPEAR * 0.7) break;
          d.l += (d.len - d.l) * Math.min(1, dt * d.v * 1.7);
          project(tipU[d.i], GEO.cut - 0.012, false);
          addPrim(scene, PX, PY - 3, PY + (d.l + d.r * 1.7) * scale, Math.sin(clock * 2 + d.i * 3) * 0.8, d.r * 1.1 * scale, d.r * 0.5 * scale, d.r * scale, 5);
        }
        // strings between the rows: thinner as they stretch, and at their limit they snap into two stumps that pull back
        for (const o of strings) {
          project(tipU[o.i], GEO.cut - 0.004, false);
          const x = PX, yt = PY;
          project(tipU[o.i + 8], GEO.cut + 0.004, true);
          const xb = PX, yb = PY, gap = yb - yt;
          if (gap < 3) continue;
          const rs = o.r * scale;
          if (!o.broke && gap > o.snapAt) { o.broke = true; o.top = o.bottom = gap * 0.5; }
          if (!o.broke) {
            const thin = 1 - 0.72 * clamp(gap / o.snapAt);
            addPrim(scene, x, yt - 2, yb + 2, xb - x, rs * 1.7, Math.max(0.7, rs * thin), Math.max(1, rs * 1.2), 3);
          } else {
            o.top *= Math.exp(-dt * 11); o.bottom *= Math.exp(-dt * 13);
            if (o.top > 2) addPrim(scene, x, yt - 2, yt + o.top, 0, rs * 1.5, Math.max(0.7, rs * 0.45), Math.max(1, rs * 0.9), 3);
            if (o.bottom > 3) addPrim(scene, xb, yb - o.bottom, yb + 1, 0, Math.max(0.7, rs * 0.4), Math.max(0.7, rs * 0.7), rs * 1.1, 3);
          }
        }
      }
      // the splashes: springy where they land, then very slow, like something thick running down glass
      for (const b of blobs) {
        b.v += ((b.to - b.r) * 240 - b.v * 19) * dt;
        b.r = Math.max(0, b.r + b.v * dt);
        addPrim(scene, b.x, b.y, b.y + b.r, 0, b.r, b.r, b.r, b.to * 0.55 + 4);
      }
      for (const d of streaks) {
        d.l += (d.to - d.l) * dt * d.v;
        addPrim(scene, d.x, d.y, d.y + d.l + d.r * 2, 0, d.r * 1.4, d.r * 0.68, d.r, 7);
      }
      if (wave >= 0) {
        scene.massDir = 1;
        scene.massBase = wave;
        scene.massAmp = 2.2;
      } else scene.massDir = 0;
      surface?.draw(scene);
      surface?.frame(dt);
    }

    /* ----- screen effects ----- */
    let flashed = 0;
    let shakeFrom = -1e3, shakePower = 0;
    const strike = (power, hard) => {
      shakeFrom = clock; shakePower = power;
      flashed = 2;              // a white frame, then nothing
      scar(hard);
      project(0.5, GEO.cut, false);
      burst(count(hard ? COUNTS.shards[1] : COUNTS.shards[0]), count(hard ? COUNTS.dust[1] : COUNTS.dust[0]), W / 2, PY, hard ? 1.25 : 0.85);
      splash(hard);
      // a little slime squeezed out from between the teeth
      for (let i = 0; i < (phone ? 4 : 8); i++) {
        const u = rand(0.34, 0.66);
        blobs.push({ x: W / 2 + (u - 0.5) * figW * scale, y: PY + rand(-6, 10) * scale, r: 0, v: 0, to: rand(2.5, 7) * (figW / 480) * scale });
      }
      if (hard) chips(count(COUNTS.chips));
      if (canBuzz) navigator.vibrate(hard ? 70 : 35);
    };
    // the last clamp: no white here, that flash budget went to the second bite. The screen goes black and lime instead.
    const strikeLast = () => {
      shakeFrom = clock; shakePower = SHAKE.hit3;
      burst(0, count(COUNTS.dust[1]), W / 2, H / 2, 1.5);
      if (canBuzz) navigator.vibrate(90);
    };
    function applyShake() {
      const u = clock - shakeFrom;
      let amount = 0;
      if (u < SHAKE.decay) amount = shakePower * Math.pow(1 - u / SHAKE.decay, 2) * (phone ? 0.65 : 1);
      // the wind-ups only vibrate
      if (phase === P_OPEN || phase === P_HOLD) amount = Math.max(amount, SHAKE.wind * (bite ? 1.5 : 1));
      if (amount < 0.05) {
        if (wrap.style.transform) wrap.style.transform = "";
        return;
      }
      const x = Math.sin(clock * 91) * amount + Math.sin(clock * 57) * amount * 0.4, y = Math.sin(clock * 73 + 1) * amount;
      // straight: only the hard contacts may turn the screen a little
      const r = bite ? Math.sin(clock * 43) * amount * 0.03 : 0;
      wrap.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${r.toFixed(2)}deg)`;
    }
    // glitch: strips of what the rig just drew, pushed sideways on the layer over it. Fresh strips every few frames.
    const STRIPS = 22, strip = new Float32Array(STRIPS * 2);
    let stripAt = -1, glitchOn = false;
    function glitch(power, lines) {
      if (clock - stripAt > 0.035) {
        stripAt = clock;
        for (let i = 0; i < STRIPS; i++) {
          strip[i * 2] = Math.random() < 0.55 ? rand(-1, 1) * power : 0;
          strip[i * 2 + 1] = Math.random();
        }
      }
      const sh = stageCv.height / STRIPS, wpx = stageCv.width;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, wpx, stageCv.height);
      glitchOn = true;
      const src = GL.canvas;
      for (let i = 0; i < STRIPS; i++) {
        const off = strip[i * 2];
        if (!off) continue;
        const y = i * sh;
        c.fillStyle = BLACK;
        c.fillRect(0, y, wpx, sh);
        c.drawImage(src, 0, y, wpx, sh, off * dpr, y, wpx, sh);
        // the split: a lime or a white edge on the strip, and sometimes the whole strip in lime
        c.fillStyle = strip[i * 2 + 1] < 0.5 ? LIME : WHITE;
        const bar = Math.abs(off) * dpr * 0.5;
        c.fillRect(off > 0 ? 0 : wpx - bar, y, bar, sh);
        if (strip[i * 2 + 1] > 0.78) {
          c.globalCompositeOperation = "multiply";
          c.fillStyle = LIME;
          c.fillRect(0, y, wpx, sh);
          c.globalCompositeOperation = "source-over";
        }
      }
      if (lines) {
        c.fillStyle = "rgba(0, 0, 0, .34)";
        const step = Math.max(3, Math.round(4 * dpr));
        for (let y = (Math.floor(clock * 240) % step); y < stageCv.height; y += step) c.fillRect(0, y, wpx, Math.ceil(dpr));
      }
    }
    const SPECKS = [0.42, 0.84, 1.3, 0.9, 0.56, 0.82, 0.8, 1.2, 0.47, 0.9, 1.7, 0.7, 0.6, 0.92, 1.1, 1.5, 0.52, 0.88, 0.6, 1];

    /* ----- the cursor: what is on screen at this point ----- */
    let limeTo = -1, blackTo = -1;
    removeProbe = addProbe((x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return null;
      if (covered) return clock - coveredAt > DISSOLVE * 0.5 ? null : "dark";
      if (y < blackTo) return "dark";
      if (y < limeTo) return "light";
      if (sceneHit(scene, x, y)) return "light";
      if (phase >= P_SHOT) return "dark";
      const u = (x - (W / 2)) / (figW * scale * 0.54), v = (y - (H / 2 + sinkY + shift + figH * 0.03 * scale)) / (figH * scale * 0.5);
      return figAlpha > 0.5 && u * u + v * v < 1 ? "light" : "dark";
    });

    /* ----- skipping: straight to the dissolve, from a black screen ----- */
    skipTo = () => {
      if (covered || clock < 0.15) return;
      phase = P_WAVE;
      waveAt = clock - WAVE - WAVE_LAG;
      limeTo = blackTo = H + 50;
    };

    /* ----- one frame ----- */
    let figAlpha = 1, solverLeft = 0;
    function draw(dt) {
      // the solver runs in fixed steps, so a contact lands on the right moment at any frame rate
      solverLeft += dt;
      while (solverLeft >= STEP) { step(STEP); solverLeft -= STEP; }
      applyShake();
      const sinceHit2 = clock - hit2At;
      // two short inverted frames in the second burst: with the white flash that is three in a second, the safe limit
      const inverted = (sinceHit2 > 0.06 && sinceHit2 < 0.1) || (sinceHit2 > 0.2 && sinceHit2 < 0.24);
      const e = clamp(clock / APPEAR);
      // the emergence: dark, flickering, then all there
      figAlpha = clamp(e * 2.2) * (e < 1 && Math.floor(clock * 28) % 3 === 0 ? 0.25 : 1);
      let glitching = false;
      if (!covered) {
        if (phase === P_SHOT || phase === P_SHOT_STOP || phase === P_WAVE) drawShot();
        else drawRig(inverted, figAlpha);
        if (clock < APPEAR * 0.55) { glitch(26 * (1 - clock / (APPEAR * 0.55)), false); glitching = true; }
        else if (clock - hit1At < GLITCH.first) { glitch(46, false); glitching = true; }
        else if (sinceHit2 < GLITCH.second) { glitch(90, true); glitching = true; }
      }
      if (!glitching && glitchOn) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, stageCv.width, stageCv.height); glitchOn = false; }
      // the wave: lime first, the black close behind it
      const w0 = clock - waveAt;
      const easeWave = (u) => { const q = clamp(u / WAVE); return q * q * (3 - 2 * q); };
      if (w0 > 0) {
        limeTo = easeWave(w0) * (H + 60) - 40;
        blackTo = easeWave(w0 - WAVE_LAG) * (H + 60) - 40;
      }
      if (surface) drawSlime(dt, w0 > 0 ? limeTo : -1);
      // and the top layer
      f.setTransform(dpr, 0, 0, dpr, 0, 0);
      f.clearRect(0, 0, W, H);
      if (blackTo > 0) {
        f.fillStyle = BLACK;
        f.beginPath();
        f.moveTo(0, 0);
        for (let x = 0; x <= W + 20; x += 20) f.lineTo(x, blackTo + Math.sin(x * 0.012 + clock * 3) * 18 + Math.sin(x * 0.031 - clock * 2) * 8);
        f.lineTo(W, 0);
        f.closePath();
        f.fill();
      }
      const scarAlpha = covered ? 1 - clamp((clock - coveredAt) / (DISSOLVE * 0.8)) : phase === P_ZOOM ? 1 - clamp(phaseT / SWALLOW.zoomT) : phase === P_SHOT || phase === P_SHOT_STOP ? 0 : 1;
      if (hit1At > 0 && scarAlpha > 0) {
        f.globalAlpha = scarAlpha;
        f.drawImage(scars, 0, 0, W, H);
        f.globalAlpha = 1;
      }
      if (!covered) drawParticles(dt);
      if (flashed > 0) {
        if (flashed === 2) { f.fillStyle = WHITE; f.fillRect(0, 0, W, H); }
        flashed--;
      }
      if (clock - waveAt >= WAVE + WAVE_LAG) {
        cover();
        root.style.pointerEvents = "none";
        wrap.style.transform = "";
      }
      if (covered) {
        const q = clamp((clock - coveredAt) / DISSOLVE);
        root.style.opacity = String(1 - q * q * (3 - 2 * q));
      }
    }
    let paused = false;
    const frame = (now) => {
      if (finished) return;
      try {
        const dt = Math.min(0.05, (now - last) / 1000); last = now; // clamped: a stutter makes it slower, never makes it skip a bite
        if (!paused) draw(dt);
        if (covered && clock >= coveredAt + DISSOLVE) { finish(); return; }
        raf = requestAnimationFrame(frame);
      } catch (e) {
        console.warn("finale:", e);
        finish();
      }
    };
    raf = requestAnimationFrame((now) => { last = now; frame(now); });

    /* Dev server only (removed from the build): exact frames for the contact sheets, and the closed-mouth check. */
    if (import.meta.env?.DEV) {
      const names = ["appear", "antic", "open", "hold", "snap", "stop", "bounce", "zoom", "shot", "shotStop", "wave"];
      window.__finale = {
        pause() { paused = true; },
        play() { paused = false; },
        info: () => ({ clock, phase: names[phase], bite, jaw, jawV, pitch, scale, phaseT, covered }),
        /** Runs forward in 60 Hz frames until the clock reaches ms. */
        seek(ms) { while (clock * 1000 < ms && !covered) draw(1 / 60); return this.info(); },
        /** Runs forward until this phase of this bite has lasted ms. */
        until(name, n, ms = 0) { const id = names.indexOf(name); let g = 0; while (!(phase === id && bite === n && phaseT * 1000 >= ms) && g++ < 2000) draw(1 / 240); return this.info(); },
        /** The rig at rest on the portrait's paper, without slime or screen effects. */
        rest() {
          jaw = 0; pitch = 0; roll = 0; scale = 1; sinkY = 0; shift = 0; toothY.fill(0); toothR.fill(0);
          const hit = hit1At; hit1At = -1e3;
          GL.clear(0.902, 1, 0.6);
          GL.head(0, 0, 0, 1, AXIS, 0);
          GL.jaw(0);
          GL.draw(tex.cranium, false, 1, false, 0, 0, 0, 0, 0);
          GL.draw(tex.mandible, true, 1, false, 0, 0, 0, 0, 0);
          drawTeeth(tex.lower, 8, true, 1, false);
          drawTeeth(tex.upper, 0, false, 1, false);
          c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, stageCv.width, stageCv.height);
          f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, fxCv.width, fxCv.height);
          surface?.clear();
          wrap.style.transform = "";
          hit1At = hit;
        },
      };
    }
  }));
}

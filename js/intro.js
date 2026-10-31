/* Intro sequence, played once per session right after the counter loader reaches 100:
   1. the loader turns white; its own star shrinks, turns navy with a bolder outline and becomes a pen,
   2. the pen writes "Akbar" (capital A, then "kbar"): it travels the letters' centerline, lifting between strokes,
      and the ink appears right behind it,
   3. the pen draws a hand-drawn swoosh under the name,
   4. small icons scatter over the screen, then fly block by block from the top and land on the real page elements;
      each element appears in place as its icons arrive, and the icons melt into it.
   Remove: delete this file, js/intro-word.js, css/intro.css and the marked "intro" lines in js/main.js. */
import { gsap } from "gsap";
import { box, ink, word, pen } from "./intro-word.js";
import "../css/intro.css";

const NAVY = "#0B1F3A";
const KEY = "akbar-intro-seen";
const NS = "http://www.w3.org/2000/svg";
const rand = (a, b) => a + Math.random() * (b - a);

export function shouldPlayIntro({ reduce, seen }) {
  if (reduce || seen) return false;
  try { if (sessionStorage.getItem(KEY)) return false; } catch (e) {}
  return true;
}

const ICONS = {
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  star: { box: "0 0 48 48", d: '<path d="M24 2l5.2 9.4 10.4-3-3 10.4L46 24l-9.4 5.2 3 10.4-10.4-3L24 46l-5.2-9.4-10.4 3 3-10.4L2 24l9.4-5.2-3-10.4 10.4 3z"/>' },
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  sparkle: { solid: true, d: '<path d="M12 2c.7 5.3 2.7 7.3 8 8-5.3.7-7.3 2.7-8 8-.7-5.3-2.7-7.3-8-8 5.3-.7 7.3-2.7 8-8z"/>' },
  cursor: { solid: true, d: '<path d="M5 3l14 7-6.2 1.8L10 18z"/>' },
  braces: '<path d="M9 4C7 4 6 5 6 7v2c0 1.5-1 3-3 3 2 0 3 1.5 3 3v2c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2c0 1.5 1 3 3 3-2 0-3 1.5-3 3v2c0 2-1 3-3 3"/>',
  pixel: { solid: true, d: '<rect x="5" y="5" width="14" height="14" rx="2"/>' },
  dot: { solid: true, d: '<circle cx="12" cy="12" r="6"/>' },
  hash: '<path d="M10 4 8 20M16 4l-2 16M4 9h16M4 15h16"/>',
  angle: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
};
const ICON_NAMES = Object.keys(ICONS);
// site palette: logo orange, apricot, steel blue, ivory, navy (with a white halo), white (with a navy outline)
const PALETTE = [
  { c: "#C9A35E" }, { c: "#D7BC8A" }, { c: "#8FA8C2" }, { c: "#ECE7DC" }, { c: "#7690AC" },
  { c: NAVY, halo: "#FFFFFF" }, { c: "#FFFFFF", halo: NAVY }, { c: "#C9A35E" }, { c: NAVY, halo: "#FFFFFF" },
];

const play = (tl) => new Promise((r) => tl.eventCallback("onComplete", r));
const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
};

let activeUnlock = null; // the scroll lock of a running intro (released by abortIntro if something breaks)

/* Failsafe: if the intro breaks halfway, take the overlay away and give the page back exactly as the site expects it. */
export function abortIntro() {
  activeUnlock?.();
  activeUnlock = null;
  document.documentElement.classList.remove("ak-hide-site");
  document.querySelectorAll(".ak-intro").forEach((n) => n.remove());
  for (const sel of ["#nav", "main", ".footer"]) {
    const root = document.querySelector(sel);
    if (!root) continue;
    root.style.visibility = "";
    root.querySelectorAll("[style]").forEach((el) => { el.style.visibility = ""; el.style.clipPath = ""; });
  }
}

/* Hold the page still while the intro covers it. */
function lockScroll() {
  const stop = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
  const keys = (e) => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) stop(e); };
  const opts = { capture: true, passive: false };
  window.addEventListener("wheel", stop, opts);
  window.addEventListener("touchmove", stop, opts);
  window.addEventListener("keydown", keys, true);
  return () => {
    window.removeEventListener("wheel", stop, opts);
    window.removeEventListener("touchmove", stop, opts);
    window.removeEventListener("keydown", keys, true);
  };
}

/* A small icon in one of the site colors; navy and white ones get a contrasting outline so they read on white and dark. */
// (markup only: all icons are parsed in one go, which is much cheaper than building them one by one)
function iconMarkup(name, size, { c, halo }) {
  const def = typeof ICONS[name] === "string" ? { d: ICONS[name] } : ICONS[name];
  const k = def.box ? 2 : 1; // the 48-unit star needs doubled line widths
  const layer = (stroke, sw, fill) =>
    `<g fill="${fill}" stroke="${stroke}" stroke-width="${sw * k}" stroke-linecap="round" stroke-linejoin="round">${def.d}</g>`;
  const body = def.solid ? (halo ? layer(halo, 3, c) : layer("none", 0, c))
    : (halo ? layer(halo, 4.6, "none") : "") + layer(c, 2.2, "none");
  return `<svg class="ak-intro__icon" viewBox="${def.box || "0 0 24 24"}" width="${size}" height="${size}">${body}</svg>`;
}

/* The word as SVG: filled letters, uncovered by a mask made of the pen's centerline chunks. */
function makeWord(width) {
  const scale = width / box[2];
  const svg = svgEl("svg", { viewBox: box.join(" "), width, height: box[3] * scale, "aria-hidden": "true" });
  const mask = svgEl("mask", { id: "ak-intro-ink", maskUnits: "userSpaceOnUse", x: box[0], y: box[1], width: box[2], height: box[3] });
  const strokes = pen.map((chunks) => chunks.map(([w, d]) => {
    const p = svgEl("path", { d, fill: "none", stroke: "#fff", "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round" });
    mask.append(p);
    return p;
  }));
  const defs = svgEl("defs");
  defs.append(mask);
  svg.append(defs, svgEl("path", { d: word, fill: NAVY, mask: "url(#ak-intro-ink)" }));
  return { svg, strokes, scale };
}

/* A quick pen swoosh: starts a touch low, wobbles gently, rises at the end and hooks back with a tiny overshoot.
   Drawn as a filled shape that tapers toward both ends (round tips), uncovered by a stroke mask along its centerline. */
function makeSwoosh(L, Wd, parent) {
  const h = Math.max(16, L * 0.07) + Wd;
  const padX = Wd + 4;
  const svg = svgEl("svg", { width: L + padX * 2, height: h, viewBox: `${-padX} 0 ${L + padX * 2} ${h}`, class: "ak-intro__swoosh", "aria-hidden": "true" });
  const y = (f) => (Wd / 2 + (h - Wd) * f).toFixed(1);
  const x = (f) => (L * f).toFixed(1);
  const d = `M0 ${y(0.66)} C${x(0.16)} ${y(0.8)} ${x(0.33)} ${y(0.5)} ${x(0.52)} ${y(0.56)}`
    + ` S${x(0.84)} ${y(0.46)} ${x(0.985)} ${y(0.27)} Q${x(1.012)} ${y(0.22)} ${x(0.997)} ${y(0.36)}`;
  const center = svgEl("path", { d, fill: "none" });
  const mask = svgEl("mask", { id: "ak-intro-swoosh", maskUnits: "userSpaceOnUse", x: -padX, y: 0, width: L + padX * 2, height: h });
  const reveal = svgEl("path", { d, fill: "none", stroke: "#fff", "stroke-width": Wd * 1.9, "stroke-linecap": "round", "stroke-linejoin": "round" });
  mask.append(reveal);
  const defs = svgEl("defs");
  defs.append(center, mask);
  svg.append(defs);
  parent.append(svg); // measured in place
  // width along the stroke: full in the middle, ~40% at the tips
  const len = center.getTotalLength();
  const N = 96, left = [], right = [];
  let top = Infinity;
  for (let i = 0; i <= N; i++) {
    const t = i / N, l = t * len;
    const p = center.getPointAtLength(l);
    const q = center.getPointAtLength(Math.min(len, l + 0.5)), o = center.getPointAtLength(Math.max(0, l - 0.5));
    const dx = q.x - o.x, dy = q.y - o.y, m = Math.hypot(dx, dy) || 1;
    const half = (Wd / 2) * (0.4 + 0.6 * Math.pow(Math.sin(Math.PI * t), 0.55));
    left.push(`${(p.x - (dy / m) * half).toFixed(2)} ${(p.y + (dx / m) * half).toFixed(2)}`);
    right.push(`${(p.x + (dy / m) * half).toFixed(2)} ${(p.y - (dx / m) * half).toFixed(2)}`);
    top = Math.min(top, p.y - half);
  }
  const ends = [center.getPointAtLength(0), center.getPointAtLength(len)];
  const g = svgEl("g", { fill: NAVY, mask: "url(#ak-intro-swoosh)" });
  g.append(svgEl("path", { d: `M${left.join("L")}L${right.reverse().join("L")}Z` }));
  ends.forEach((e) => g.append(svgEl("circle", { cx: e.x, cy: e.y, r: (Wd / 2) * 0.4 })));
  svg.append(g);
  return { svg, center, reveal, len, top };
}

/* The pen's route: ink chunks in order, with a lift (no ink) between strokes. Lengths in SVG units. */
function route(strokes) {
  const items = [];
  strokes.forEach((chunks, k) => {
    if (k) {
      const a = items[items.length - 1].path.getPointAtLength(items[items.length - 1].len);
      const b = chunks[0].getPointAtLength(0);
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      items.push({ lift: true, a, b, len: dist * 0.6, arc: Math.min(dist * 0.18, 140) }); // lifts move a bit faster
    }
    chunks.forEach((path) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len} ${len + 1}`;
      path.style.strokeDashoffset = len;
      items.push({ path, len });
    });
  });
  return items;
}

/* Frames per second over a short window (a weak device gets fewer assemble icons). */
function measureFps(ms) {
  return new Promise((resolve) => {
    let frames = 0;
    const t0 = performance.now();
    const tick = (now) => {
      frames++;
      if (now - t0 < ms) requestAnimationFrame(tick);
      else resolve((frames * 1000) / (now - t0));
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- the real page, measured ---------- */
// Elements taken whole: they appear as one piece when their icons land.
const ATOMIC = "a, button, img, picture, figure, svg, canvas, video, h1, h2, h3, h4, h5, h6, p, li, label, input, textarea, select, .btn, .marquee, blockquote";

/* Visible blocks of the first screen, in reading order, plus the containers to hide while they are built. */
function measurePage(W, H) {
  const roots = [document.getElementById("nav"), document.querySelector("main"), document.querySelector(".footer")].filter(Boolean);
  const blocks = [];
  const visit = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return;
    if (cs.display === "contents") { [...el.children].forEach(visit); return; } // no box of its own
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) return;
    if (r.width < 3 || r.height < 3) { [...el.children].forEach(visit); return; }
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const painted = cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.backgroundImage !== "none"
      || parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth) > 0;
    const huge = r.width * r.height > W * H * 0.4;
    if (el.matches(ATOMIC) || ownText || (painted && !huge)) { blocks.push({ el, r }); return; }
    [...el.children].forEach(visit);
  };
  roots.forEach(visit);
  blocks.sort((a, b) => (Math.abs(a.r.top - b.r.top) < 8 ? a.r.left - b.r.left : a.r.top - b.r.top));
  return { roots, blocks };
}

/* Landing points on a block's real rectangle: corners, then the outline, then the inside. */
function targetsFor({ r }, n, W, H) {
  const x0 = Math.max(4, r.left + 2), x1 = Math.min(W - 4, r.right - 2);
  const y0 = Math.max(4, r.top + 2), y1 = Math.min(H - 4, r.bottom - 2);
  const w = Math.max(0, x1 - x0), h = Math.max(0, y1 - y0);
  const pts = [];
  if (n >= 4) pts.push({ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 });
  const edge = Math.max(0, Math.round((n - pts.length) * 0.55));
  const per = 2 * (w + h) || 1;
  for (let i = 0; i < edge; i++) {
    let d = ((i + 0.5) / edge) * per;
    if (d < w) pts.push({ x: x0 + d, y: y0 });
    else if ((d -= w) < h) pts.push({ x: x1, y: y0 + d });
    else if ((d -= h) < w) pts.push({ x: x1 - d, y: y1 });
    else pts.push({ x: x0, y: y1 - (d - w) });
  }
  const inner = n - pts.length;
  const cols = Math.max(1, Math.round(Math.sqrt((inner * w) / (h || 1))));
  const rows = Math.max(1, Math.ceil(inner / cols));
  for (let i = 0; i < inner; i++) {
    pts.push({ x: x0 + ((i % cols) + 0.5 + rand(-0.2, 0.2)) / cols * w, y: y0 + (Math.floor(i / cols) + 0.5 + rand(-0.2, 0.2)) / rows * h });
  }
  return pts.slice(0, n);
}

/**
 * Run the intro over the finished loader. `prepare` puts the page in its final state (nav in place, hero settled)
 * before it is measured. Resolves true once the page has been assembled and the overlay is gone.
 */
export async function playIntro(loader, { prepare } = {}) {
  try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  const star = loader?.querySelector(".loader__star");
  if (!star) return false;
  const starPath = star.querySelector("path");
  const fade = loader.querySelectorAll(".loader__count, .loader__word");
  const unlock = lockScroll();
  activeUnlock = unlock;

  const W = innerWidth, H = innerHeight;
  const phone = W < 640;

  /* ----- overlay ----- */
  const root = document.createElement("div");
  root.className = "ak-intro";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = '<div class="ak-intro__cover"></div><div class="ak-intro__sig"></div><div class="ak-intro__icons"></div><div class="ak-intro__pen"></div>';
  document.body.append(root);
  const cover = root.querySelector(".ak-intro__cover");
  const sig = root.querySelector(".ak-intro__sig");
  const iconBox = root.querySelector(".ak-intro__icons");
  const penLayer = root.querySelector(".ak-intro__pen");

  // the name takes ~56% of the width on desktop, ~80% on phones
  const { svg, strokes, scale } = makeWord(Math.min(W * (phone ? 0.8 : 0.56), 1100));
  // underline: 2.25x the original line (max(2px, .2vw)), placed so its top stays clear of the lowest letter
  const lineW = Math.max(4.5, W * 0.0045);
  sig.append(svg);
  const sw = makeSwoosh((ink[2] - ink[0]) * scale * 1.02, lineW, sig);
  const swooshSvg = sw.svg, swoosh = sw.center, swooshLen = sw.len;
  const gap = phone ? 5 : 7;
  swooshSvg.style.marginLeft = `${(ink[0] - box[0]) * scale - (lineW + 4)}px`;
  swooshSvg.style.marginTop = `${-(box[1] + box[3] - ink[3]) * scale + gap - sw.top}px`;
  sw.reveal.style.strokeDasharray = `${swooshLen} ${swooshLen + 1}`;
  sw.reveal.style.strokeDashoffset = swooshLen;

  const items = route(strokes);
  const total = items.reduce((a, it) => a + it.len, 0);
  const ctm = svg.getScreenCTM();
  const toScreen = (pt, m = ctm) => new DOMPoint(pt.x, pt.y).matrixTransform(m);

  /* ----- the star becomes the pen: same element, moved on top of the overlay ----- */
  const from = star.getBoundingClientRect();
  const S0 = from.width;
  const hold = document.createElement("div"); // keeps the counter from jumping while it fades
  hold.style.width = hold.style.height = `${S0}px`;
  star.replaceWith(hold);
  penLayer.append(star);
  const at = (x, y) => ({ x: x - S0 / 2, y: y - S0 / 2 });
  gsap.set(star, { ...at(from.left + S0 / 2, from.top + S0 / 2), transformOrigin: "50% 50%" });

  const penSize = phone ? 40 : 56;
  const start = toScreen(items[0].path.getPointAtLength(0));

  /* ----- 1. white, shrink, navy + bolder outline (~0.8s) ----- */
  // the same outline, now bolder and backed with white so the pen stays visible on top of fresh ink
  starPath.style.fill = "#FFFFFF";
  starPath.style.fillOpacity = "0";
  const intro = gsap.timeline({ defaults: { duration: 0.8, ease: "power3.inOut" } });
  intro.to(fade, { opacity: 0, y: -12, duration: 0.45, ease: "power2.out" }, 0)
    .to(loader, { backgroundColor: "#FFFFFF" }, 0)
    .to(star, { ...at(start.x, start.y), scale: penSize / S0 }, 0)
    .to(starPath, { stroke: NAVY, strokeWidth: 3.6, fillOpacity: 1, ease: "power1.inOut" }, 0);
  await play(intro);
  // the white moves from the loader to our own sheet, so the loader can go away underneath
  cover.style.opacity = "1";
  loader.style.visibility = "hidden";

  /* ----- 2. the pen writes the name (~2.3s) ----- */
  let cur = 0, acc = 0;
  const pos = { s: 0 };
  const fpsProbe = measureFps(300); // quick frame-rate check while the pen is moving
  const write = gsap.to(pos, {
    s: total, duration: 2.3, ease: "sine.inOut",
    onUpdate() {
      while (cur < items.length - 1 && pos.s > acc + items[cur].len) {
        if (!items[cur].lift) items[cur].path.style.strokeDashoffset = 0;
        acc += items[cur].len; cur++;
      }
      const it = items[cur];
      const local = Math.max(0, Math.min(it.len, pos.s - acc));
      let p;
      if (it.lift) { // pen off the paper: glide to the next stroke on a slight arc
        const t = it.len ? local / it.len : 1;
        p = { x: it.a.x + (it.b.x - it.a.x) * t, y: it.a.y + (it.b.y - it.a.y) * t - Math.sin(Math.PI * t) * it.arc };
      } else {
        it.path.style.strokeDashoffset = it.len - local;
        p = it.path.getPointAtLength(local);
      }
      p = toScreen(p);
      gsap.set(star, { ...at(p.x, p.y), rotation: (pos.s / total) * 180 }); // a slow turn, like a nib rolling
    },
  });
  await play(write);
  items.forEach((it) => { if (!it.lift) it.path.style.strokeDashoffset = 0; });

  /* ----- 3. the pen draws the swoosh under the name (~0.7s), riding its tip ----- */
  const sm = swooshSvg.getScreenCTM(); // the centerline has no transform of its own
  const s0 = toScreen(swoosh.getPointAtLength(0), sm);
  const line = { t: 0 };
  const under = gsap.timeline();
  under.to(star, { ...at(s0.x, s0.y), rotation: 200, duration: 0.4, ease: "power2.inOut" })
    .to(line, {
      t: 1, duration: 0.7, ease: "power2.out",
      onUpdate() {
        sw.reveal.style.strokeDashoffset = swooshLen * (1 - line.t);
        const p = toScreen(swoosh.getPointAtLength(swooshLen * line.t), sm);
        gsap.set(star, { ...at(p.x, p.y), rotation: 200 + line.t * 90 });
      },
    })
    .to({}, { duration: 0.3 });
  await play(under);

  /* ----- 4. icons scatter, then assemble the real page block by block from the top (~4s) ----- */
  // the page was left unpainted under the gate/loader/pen (perf); give it back right before measuring (same frame)
  document.documentElement.classList.remove("ak-hide-site");
  prepare?.();
  const { roots, blocks } = measurePage(W, H);
  const hidden = roots.map((el) => [el, el.style.visibility]);
  roots.forEach((el) => { el.style.visibility = "hidden"; }); // under the white sheet, nothing visible changes yet

  // lots of small icons (fewer if the quick frame-rate check during the writing found a slow device)
  // low-memory phones get the reduced count right away; others only if the check found dropped frames
  const lowMem = navigator.deviceMemory && navigator.deviceMemory <= 4;
  const slow = lowMem || (await fpsProbe) < 50;
  const count = Math.max(blocks.length, Math.round((phone ? 155 : 300) * (slow ? 0.6 : 1)));
  const weights = blocks.map(({ r }) => Math.sqrt(Math.max(1, Math.min(r.width, W) * Math.min(r.height, H))));
  const wsum = weights.reduce((a, b) => a + b, 0) || 1;
  const per = weights.map((w) => Math.max(1, Math.round((w / wsum) * count)));
  const groups = blocks.map((b, i) => ({ ...b, pts: targetsFor(b, per[i], W, H) }));
  const targets = groups.flatMap((g, gi) => g.pts.map((p) => ({ ...p, gi })));

  // scattered start positions, sorted top to bottom so top icons build the top of the page
  const scatter = targets.map(() => ({ x: rand(0.04, 0.96) * W, y: rand(0.04, 0.96) * H })).sort((a, b) => a.y - b.y);
  const sizes = targets.map(() => Math.round(phone ? rand(9, 14) : rand(11, 17)));
  iconBox.innerHTML = targets.map((t, i) => iconMarkup(ICON_NAMES[i % ICON_NAMES.length], sizes[i], PALETTE[i % PALETTE.length])).join("");
  const els = iconBox.children;
  const icons = targets.map((t, i) => {
    const size = sizes[i], el = els[i];
    const sx = scatter[i].x - size / 2, sy = scatter[i].y - size / 2;
    el.style.transform = `translate3d(${sx}px,${sy}px,0) scale(0)`;
    return { el, gi: t.gi, sx, sy, tx: t.x - size / 2, ty: t.y - size / 2, r0: rand(-90, 90), curve: i % 2, done: false, idle: false };
  });

  // schedule: pop in (random order), fly block by block from the top, melt into the element on landing
  const FLY = 0.65, SPAN = 1.8, T0 = 1.1, POP = 0.3, MELT = 0.32;
  gsap.utils.shuffle(icons.slice()).forEach((ic, i, all) => { ic.tPop = 0.25 + (i / all.length) * 0.55; });
  const asm = gsap.timeline({ onUpdate: () => step(asm.time()) });
  asm.to([sig, star], { opacity: 0, duration: 0.4, ease: "power2.in" }, 0);
  asm.to(cover, { opacity: 0, duration: 0.45, ease: "power1.inOut" }, 1.0); // the dark page, still empty
  let end = 0;
  groups.forEach((g, gi) => {
    const mine = icons.filter((ic) => ic.gi === gi);
    const t0 = T0 + (groups.length > 1 ? gi / (groups.length - 1) : 0) * SPAN;
    const stag = mine.length > 1 ? Math.min(0.006, 0.3 / (mine.length - 1)) : 0; // more icons, smaller steps
    mine.forEach((ic, j) => { ic.tFly = t0 + j * stag; });
    const land = t0 + (mine.length - 1) * stag + FLY;
    mine.forEach((ic, j) => { ic.tMelt = land - 0.04 + j * 0.002; end = Math.max(end, ic.tMelt + MELT); });
    // the real element appears right where its icons landed (its icons melt into it in step())
    asm.add(() => { g.el.style.visibility = "visible"; }, land - 0.12)
      .fromTo(g.el, { clipPath: "inset(0% 100% 0% 0%)" }, {
        clipPath: "inset(-30% -30% -30% -30%)", duration: 0.4, ease: "power2.out",
        onComplete: () => { g.el.style.clipPath = ""; },
      }, land - 0.12);
  });
  asm.to({}, { duration: 0.01 }, end); // the timeline runs until the last icon has melted

  /* One loop moves every icon (transform + opacity only); icons leave the DOM as soon as they have merged. */
  const ease = {
    pop: gsap.parseEase("back.out(2.5)"), x: gsap.parseEase("power2.inOut"), yA: gsap.parseEase("power3.out"),
    yB: gsap.parseEase("power1.in"), rot: gsap.parseEase("power2.out"), melt: gsap.parseEase("power2.in"),
  };
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  function step(t) {
    for (const ic of icons) {
      if (ic.done || t < ic.tPop) continue;
      let x = ic.sx, y = ic.sy, r = ic.r0, sc = 1;
      if (t < ic.tFly) {
        const p = (t - ic.tPop) / POP;
        if (p >= 1) { if (ic.idle) continue; ic.idle = true; }
        sc = ease.pop(clamp(p));
      } else if (t < ic.tMelt) {
        // x and y on different easings: a smooth curve rather than a straight line
        const f = clamp((t - ic.tFly) / FLY);
        x = ic.sx + (ic.tx - ic.sx) * ease.x(f);
        y = ic.sy + (ic.ty - ic.sy) * (ic.curve ? ease.yA(f) : ease.yB(f));
        r = ic.r0 * (1 - ease.rot(f));
      } else {
        const m = clamp((t - ic.tMelt) / MELT);
        if (m >= 1) { ic.el.remove(); ic.done = true; continue; }
        x = ic.tx; y = ic.ty; r = 0; sc = 1 - ease.melt(m);
        ic.el.style.opacity = sc;
      }
      ic.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${r.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
    }
  }
  await play(asm);

  /* ----- done: everything back to the site's own styles ----- */
  hidden.forEach(([el, v]) => { el.style.visibility = v; });
  groups.forEach((g) => { g.el.style.visibility = ""; g.el.style.clipPath = ""; });
  root.remove();
  unlock();
  activeUnlock = null;
  return true;
}

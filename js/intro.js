/* Intro sequence, played once per session right after the counter loader reaches 100:
   1. the loader's own star shrinks to the left of center and turns navy while the loader turns white,
   2. "Akbar" is written in a script font, 3. a line draws under it,
   4. small icons fly in and settle on the real page layout, then fade into it as the white lifts.
   Remove: delete this file, css/intro.css and the two "intro" lines in js/main.js. */
import { gsap } from "gsap";
import "@fontsource/great-vibes/latin-400.css";
import "../css/intro.css";

const NAVY = "#0B1F3A";
const FONT = "Great Vibes";
const KEY = "akbar-intro-seen";

export function shouldPlayIntro({ reduce, seen }) {
  if (reduce || seen) return false;
  try { if (sessionStorage.getItem(KEY)) return false; } catch (e) {}
  return true;
}

// start fetching the script font now (only when the intro will play), so it is ready by the time the counter hits 100
const willPlay = shouldPlayIntro({
  reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
  seen: document.documentElement.classList.contains("seen"),
});
const fontReady = willPlay && document.fonts?.load ? document.fonts.load(`64px "${FONT}"`, "Akbar").catch(() => {}) : Promise.resolve();

const ICONS = {
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  angle: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
  braces: '<path d="M9 4C7 4 6 5 6 7v2c0 1.5-1 3-3 3 2 0 3 1.5 3 3v2c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2c0 1.5 1 3 3 3-2 0-3 1.5-3 3v2c0 2-1 3-3 3"/>',
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  hash: '<path d="M10 4 8 20M16 4l-2 16M4 9h16M4 15h16"/>',
  star: { box: "0 0 48 48", d: '<path d="M24 2l5.2 9.4 10.4-3-3 10.4L46 24l-9.4 5.2 3 10.4-10.4-3L24 46l-5.2-9.4-10.4 3 3-10.4L2 24l9.4-5.2-3-10.4 10.4 3z"/>' },
  sparkle: { solid: true, d: '<path d="M12 2c.7 5.3 2.7 7.3 8 8-5.3.7-7.3 2.7-8 8-.7-5.3-2.7-7.3-8-8 5.3-.7 7.3-2.7 8-8z"/>' },
  pixel: { solid: true, d: '<rect x="5" y="5" width="14" height="14" rx="2"/>' },
  dot: { solid: true, d: '<circle cx="12" cy="12" r="5"/>' },
};
const ICON_NAMES = Object.keys(ICONS);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const play = (tl) => new Promise((r) => tl.eventCallback("onComplete", r));
const rand = (a, b) => a + Math.random() * (b - a);

/* Hold scroll still while the intro covers the page: the icons aim at where the layout is now. */
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

/* Where the real page will be: visible blocks in the first screen, with their area as a weight. */
function layoutTargets() {
  const nav = document.getElementById("nav");
  // the nav is still parked above the screen (.is-pre); aim at where it will slide to
  const navShift = nav?.classList.contains("is-pre") ? nav.offsetHeight : 0;
  const sel = [
    "#nav .nav__logo", "#nav .nav__links a", "#nav .nav__right > *",
    "main h1 > span:not(.sr-only)", "main h2", "main h3", "main p", "main figure", "main .btn", "main li", "main .hub a", "main .sec-num",
  ].join(",");
  const W = innerWidth, H = innerHeight;
  const out = [];
  document.querySelectorAll(sel).forEach((el) => {
    const r = el.getBoundingClientRect();
    const top = r.top + (nav?.contains(el) ? navShift : 0);
    const x0 = Math.max(0, r.left), x1 = Math.min(W, r.right);
    const y0 = Math.max(0, top), y1 = Math.min(H, top + r.height);
    if (x1 - x0 < 6 || y1 - y0 < 6) return;
    out.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, weight: Math.sqrt((x1 - x0) * (y1 - y0)) });
  });
  if (!out.length) out.push({ x: W * 0.1, y: H * 0.2, w: W * 0.8, h: H * 0.6, weight: 1 });
  return out;
}

/* Spread `count` points over the targets, proportional to weight, at least one per target while they last. */
function pickPoints(targets, count) {
  const total = targets.reduce((s, t) => s + t.weight, 0);
  const pts = [];
  const sorted = [...targets].sort((a, b) => b.weight - a.weight);
  // each block gets a loose grid shaped like the block, so rows of text read as rows and panels as panels
  sorted.forEach((t) => {
    const n = Math.min(count - pts.length, Math.max(1, Math.round((t.weight / total) * count)));
    if (n <= 0) return;
    const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt((n * t.w) / t.h))));
    const rows = Math.ceil(n / cols);
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      pts.push({
        x: t.x + ((c + 0.5 + rand(-0.15, 0.15)) / cols) * t.w,
        y: t.y + ((r + 0.5 + rand(-0.15, 0.15)) / rows) * t.h,
      });
    }
  });
  while (pts.length < count) { const t = sorted[pts.length % sorted.length]; pts.push({ x: t.x + Math.random() * t.w, y: t.y + Math.random() * t.h }); }
  return pts;
}

function makeIcon(name, size) {
  const def = typeof ICONS[name] === "string" ? { d: ICONS[name] } : ICONS[name];
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", def.box || "0 0 24 24");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("class", `ak-intro__icon ${def.solid ? "is-solid" : ""} ${Math.random() < 0.3 ? "is-orange" : "is-navy"}`);
  if (def.box) svg.style.strokeWidth = "3.2"; // the 48-unit star needs a heavier line to match
  svg.innerHTML = def.d;
  return svg;
}

/* Build "Akbar" as SVG text sized to its own ink, so the stroke can be drawn and the clip can sweep it. */
function makeName(fontSize) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  const text = document.createElementNS(ns, "text");
  text.setAttribute("font-family", `"${FONT}", "Dancing Script", cursive`);
  text.setAttribute("font-size", fontSize);
  text.setAttribute("x", 0);
  text.setAttribute("y", 0);
  text.textContent = "Akbar";
  svg.append(text);
  return { svg, text };
}

/**
 * Run the intro over the finished loader. Resolves the moment the real page should start its own
 * entrance (the white is about to lift); the overlay cleans itself up afterwards.
 */
export async function playIntro(loader) {
  try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  const star = loader?.querySelector(".loader__star");
  if (!star) return;
  const starPath = star.querySelector("path");
  const fade = loader.querySelectorAll(".loader__count, .loader__word");
  const unlock = lockScroll();
  await Promise.race([fontReady, wait(1200)]);

  const W = innerWidth, H = innerHeight;
  const phone = W < 640;
  const fontSize = Math.round(Math.min(104, Math.max(48, W * 0.13)));
  const markSize = Math.round(fontSize * 0.62);

  /* ----- overlay ----- */
  const root = document.createElement("div");
  root.className = "ak-intro";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `<div class="ak-intro__bg"></div><div class="ak-intro__sig"><div class="ak-intro__mark"></div><div class="ak-intro__name"></div></div><div class="ak-intro__icons"></div>`;
  document.body.append(root);
  const bg = root.querySelector(".ak-intro__bg");
  const sig = root.querySelector(".ak-intro__sig");
  const mark = root.querySelector(".ak-intro__mark");
  const nameBox = root.querySelector(".ak-intro__name");
  const iconBox = root.querySelector(".ak-intro__icons");
  mark.style.width = mark.style.height = `${markSize}px`;
  sig.style.gap = `${Math.round(fontSize * 0.12)}px`;

  const { svg: nameSvg, text } = makeName(fontSize);
  nameBox.append(nameSvg);
  const bb = text.getBBox();
  const padX = fontSize * 0.08, padY = fontSize * 0.06;
  const nw = bb.width + padX * 2, nh = bb.height + padY * 2;
  nameSvg.setAttribute("viewBox", `${bb.x - padX} ${bb.y - padY} ${nw} ${nh}`);
  nameSvg.setAttribute("width", nw);
  nameSvg.setAttribute("height", nh);
  const dash = fontSize * 5;
  text.style.strokeWidth = Math.max(0.8, fontSize / 70);
  text.style.strokeDasharray = dash;
  text.style.strokeDashoffset = dash;
  const line = document.createElement("div");
  line.className = "ak-intro__line";
  line.style.margin = `${Math.round(fontSize * -0.16)}px ${padX}px 0`;
  nameBox.append(line);

  /* ----- 1. the star shrinks up-left and turns navy, the loader turns white (~0.8s) ----- */
  const from = star.getBoundingClientRect();
  const to = mark.getBoundingClientRect();
  const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
  tl.to(fade, { opacity: 0, y: -12, duration: 0.45, ease: "power2.out" }, 0)
    .to(loader, { backgroundColor: "#FFFFFF", duration: 0.8 }, 0)
    .to(star, {
      x: to.left + to.width / 2 - (from.left + from.width / 2),
      y: to.top + to.height / 2 - (from.top + from.height / 2),
      scale: to.width / from.width,
      duration: 0.8,
    }, 0)
    .to(starPath, { stroke: NAVY, duration: 0.8, ease: "power1.inOut" }, 0)

  /* ----- 2. "Akbar" is written left to right (~1.5s) ----- */
    .fromTo(nameSvg, { clipPath: "inset(-20% 100% -20% 0%)" }, { clipPath: "inset(-20% 0% -20% 0%)", duration: 1.5, ease: "power1.inOut" }, 0.8)
    .to(text, { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut" }, 0.8)
    .to(text, { fillOpacity: 1, duration: 0.7, ease: "power1.in" }, 1.6)

  /* ----- 3. the underline draws itself (~0.6s) ----- */
    .to(line, { scaleX: 1, duration: 0.6, ease: "power2.inOut" }, 2.3);
  await play(tl);
  await wait(250);

  /* ----- 4. icons fly in and settle on the real layout ----- */
  // the white moves from the loader to our own layer, so the loader can go away underneath
  bg.style.opacity = "1";
  const count = phone ? 64 : 96;
  const points = pickPoints(layoutTargets(), count);
  const sigBox = sig.getBoundingClientRect();
  const cx = sigBox.left + sigBox.width / 2, cy = sigBox.top + sigBox.height / 2;
  const icons = points.map((pt, i) => {
    const size = Math.round(phone ? rand(12, 18) : rand(14, 24));
    const el = makeIcon(ICON_NAMES[i % ICON_NAMES.length], size);
    iconBox.append(el);
    // half burst out of the signature, half come in from just past the screen edges
    let sx, sy;
    if (i % 2) { sx = cx + rand(-40, 40); sy = cy + rand(-20, 20); }
    else {
      const side = i % 8 >> 1;
      sx = side === 0 ? -30 : side === 1 ? W + 30 : rand(0, W);
      sy = side === 2 ? -30 : side === 3 ? H + 30 : rand(0, H);
    }
    gsap.set(el, { x: sx - size / 2, y: sy - size / 2, scale: 0.2, rotation: rand(-160, 160) });
    return { el, tx: pt.x - size / 2, ty: pt.y - size / 2 };
  });
  gsap.utils.shuffle(icons);

  const build = gsap.timeline();
  build.to([star, sig], { opacity: 0, scale: (i) => (i ? 0.96 : gsap.getProperty(star, "scale") * 0.9), duration: 0.45, ease: "power2.in" }, 0);
  icons.forEach((ic, i) => {
    build.to(ic.el, { x: ic.tx, y: ic.ty, scale: 1, rotation: 0, opacity: 1, duration: 0.85, ease: "power3.out" }, 0.1 + (i / icons.length) * 0.9);
  });
  await play(build);
  loader.style.visibility = "hidden"; // covered by our white layer; main.js still runs its own exit on it
  await wait(150);

  /* ----- 5. the icons dissolve into the real page as the white lifts ----- */
  const out = gsap.timeline({ onComplete: () => { root.remove(); } });
  out.to(bg, { opacity: 0, duration: 0.9, ease: "power2.inOut" }, 0);
  icons.forEach((ic, i) => {
    out.to(ic.el, { opacity: 0, scale: 0.3, duration: 0.5, ease: "power2.in" }, 0.1 + (i / icons.length) * 0.5);
  });
  unlock();
  // hand over now: the page's own entrance plays while the white lifts and the icons dissolve
}

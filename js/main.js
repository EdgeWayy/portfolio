import "@fontsource-variable/unbounded";
import "@fontsource-variable/onest";
import "@fontsource/jetbrains-mono/500.css";
import "../css/style.css";

import { initI18n, onLang } from "./i18n.js";
import { renderAll } from "./render.js";
import { initUI } from "./ui.js";
import { initSmoothScroll, initMotion, initStill, heroIntro, gsap, ScrollTrigger } from "./motion.js";
import { initCursor, initMagnetic } from "./cursor.js";

const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const conn = navigator.connection || {};
// weak phone or data saver: keep the static halftone image, skip WebGL
const weak = !!conn.saveData || /(^|-)2g/.test(conn.effectiveType || "")
  || (navigator.deviceMemory && navigator.deviceMemory <= 2)
  || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);

initI18n();
renderAll();
if (!reduce) initSmoothScroll();
initUI();
initCursor();
initMagnetic();
reduce ? initStill() : initMotion();

/* ---------- giant words fill the width exactly ---------- */
function fitWidth(box, inner, max = Infinity) {
  if (!box || !inner) return;
  const avail = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) - parseFloat(getComputedStyle(box).paddingRight);
  const fs = parseFloat(getComputedStyle(inner).fontSize);
  const w = inner.scrollWidth;
  if (!w || !avail) return;
  inner.style.fontSize = `${Math.min(max, fs * (avail / w))}px`;
}
function fitAll() {
  fitWidth(document.querySelector(".footer"), document.querySelector(".footer__big"));
  // the name fills its own grid column: full width on phones, the left column on desktop (home page only)
  const name = document.querySelector(".hero__name");
  if (!name) return;
  const inner = name.querySelector(".hero__name-in");
  name.style.fontSize = "";
  const fs = parseFloat(getComputedStyle(name).fontSize);
  const avail = name.clientWidth;
  name.style.fontSize = `${fs * (avail / inner.getBoundingClientRect().width) * 0.99}px`;
}
let fitRaf = 0;
const refit = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(() => { fitAll(); ScrollTrigger.refresh(); }); };
// phones fire resize when the URL bar shows or hides: only a width change can change the fit
let lastW = innerWidth;
window.addEventListener("resize", () => { if (innerWidth !== lastW) { lastW = innerWidth; refit(); } });
onLang(refit);

/* ---------- WebGL portrait ---------- */
async function startGL() {
  if (reduce || weak || !document.getElementById("portrait")) return;
  const probe = document.createElement("canvas");
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) return;
  try {
    const { initHeroGL } = await import("./hero-gl.js");
    const figure = document.getElementById("portrait");
    const url = (p) => new URL(p, document.baseURI).href;
    const gl = await initHeroGL(figure, {
      toneUrl: url("img/portrait-tone-dots.webp"),
      coarse,
    });
    root.classList.add("gl-ready");
    ScrollTrigger.create({
      trigger: ".hero", start: "top top", end: "bottom top",
      onUpdate: (s) => gl.setScroll(s.progress),
    });
    await gl.intro(1.5);
    gl.sweep(coarse ? 3200 : 2800);
  } catch (err) {
    console.warn("WebGL portrait disabled:", err);
    root.classList.remove("gl-ready");
  }
}

/* ---------- hero parallax ---------- */
function heroScroll() {
  if (reduce || !document.querySelector(".hero")) return;
  // No parallax on the name: pushing it down slid it under the portrait and out through the hero's clip edge,
  // where it was cut flat mid-scroll. The intro tween is now the only thing that moves .hero__name-in.
  // Desktop only: on phones the buttons sit low in a tall hero, so this fade had already dimmed them
  // to 20% by the time they scrolled into view (the "dull buttons" bug).
  gsap.matchMedia().add("(min-width: 960px)", () => {
    gsap.to(".hero__line, .hero__bottom", { y: -60, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "center center", end: "bottom top", scrub: true } });
  });
}

/* ---------- loader ---------- */
// The counter loader plays on the first page of a visit only. Later pages already have .seen/.loaded
// from the inline head script (loader hidden from the first paint) and just wait for the fonts.
async function boot() {
  const loader = document.getElementById("loader");
  const num = document.getElementById("loader-num");
  const star = loader.querySelector(".loader__star path");
  // one source of truth: the counter value also drives the star's stroke
  const draw = (pct) => {
    num.textContent = String(pct).padStart(3, "0");
    star.style.strokeDashoffset = 100 - pct;
  };
  const seen = root.classList.contains("seen");
  try { sessionStorage.setItem("akbar-seen", "1"); } catch (e) {}
  let ready = false;
  (document.fonts?.ready || Promise.resolve()).then(() => { ready = true; });
  const minTime = reduce || seen ? 0 : 1000;
  const t0 = performance.now();

  await new Promise((resolve) => {
    const tick = (now) => {
      const elapsed = now - t0;
      const p = minTime ? Math.min(1, elapsed / minTime) : 1;
      const shown = ready ? p : Math.min(p, 0.9);
      const done = (ready && p >= 1) || elapsed > (seen ? 1200 : 4000);
      draw(done ? 100 : Math.round(shown * 100));
      if (done) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // hold the finished star + 100 for a beat, then fade out
  if (!reduce && !seen) {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 400));
  }
  fitAll();
  loader.classList.add("is-out");
  setTimeout(() => document.getElementById("nav").classList.remove("is-pre"), reduce || seen ? 0 : 350);
  if (!reduce && document.querySelector(".hero")) heroIntro();
  heroScroll();
  let shown = false;
  const show = () => { if (shown) return; shown = true; root.classList.add("loaded"); ScrollTrigger.refresh(); };
  if (reduce) show();
  else {
    loader.addEventListener("transitionend", (e) => { if (e.target === loader) show(); });
    setTimeout(show, 1200); // fallback if transitionend never fires
  }
  // give the intro a head start, then build the WebGL portrait
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  const later = () => idle(startGL, { timeout: 1500 });
  document.readyState === "complete" ? setTimeout(later, 300) : window.addEventListener("load", () => setTimeout(later, 300), { once: true });
}

boot();

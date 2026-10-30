import "@fontsource-variable/unbounded";
import "@fontsource-variable/onest";
import "@fontsource/jetbrains-mono/500.css";
import "./styles/main.css";

import { initI18n, onLang } from "./i18n.js";
import { renderAll } from "./render.js";
import { initUI } from "./ui.js";
import { initPay } from "./pay.js";
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
initPay();
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
  // the name fills its own grid column: full width on phones, the left column on desktop
  const name = document.querySelector(".hero__name");
  const inner = name.querySelector(".hero__name-in");
  name.style.fontSize = "";
  const fs = parseFloat(getComputedStyle(name).fontSize);
  const avail = name.clientWidth;
  name.style.fontSize = `${fs * (avail / inner.getBoundingClientRect().width) * 0.99}px`;
  fitWidth(document.querySelector(".footer"), document.querySelector(".footer__big"));
}
let fitRaf = 0;
const refit = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(() => { fitAll(); ScrollTrigger.refresh(); }); };
// phones fire resize when the URL bar shows or hides: only a width change can change the fit
let lastW = innerWidth;
window.addEventListener("resize", () => { if (innerWidth !== lastW) { lastW = innerWidth; refit(); } });
onLang(refit);

/* ---------- WebGL portrait ---------- */
async function startGL() {
  if (reduce || weak) return;
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
  if (reduce) return;
  // No parallax on the name: pushing it down slid it under the portrait and out through the hero's clip edge,
  // where it was cut flat mid-scroll. The intro tween is now the only thing that moves .hero__name-in.
  gsap.to(".hero__line, .hero__bottom", { y: -60, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "center center", end: "bottom top", scrub: true } });
}

/* ---------- loader ---------- */
async function boot() {
  const loader = document.getElementById("loader");
  const num = document.getElementById("loader-num");
  let seen = false;
  try { seen = !!sessionStorage.getItem("akbar-seen"); sessionStorage.setItem("akbar-seen", "1"); } catch (e) {}
  let ready = false;
  (document.fonts?.ready || Promise.resolve()).then(() => { ready = true; });
  const minTime = reduce ? 0 : seen ? 300 : 1000;
  const t0 = performance.now();

  await new Promise((resolve) => {
    const tick = (now) => {
      const elapsed = now - t0;
      const p = minTime ? Math.min(1, elapsed / minTime) : 1;
      const shown = ready ? p : Math.min(p, 0.9);
      num.textContent = String(Math.round(shown * 100)).padStart(3, "0");
      if ((ready && p >= 1) || elapsed > 4000) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  fitAll();
  loader.classList.add("is-out");
  setTimeout(() => document.getElementById("nav").classList.remove("is-pre"), reduce ? 0 : 350);
  if (!reduce) heroIntro();
  heroScroll();
  setTimeout(() => { root.classList.add("loaded"); ScrollTrigger.refresh(); }, reduce ? 0 : 950);
  // give the intro a head start, then build the WebGL portrait
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  const later = () => idle(startGL, { timeout: 1500 });
  document.readyState === "complete" ? setTimeout(later, 300) : window.addEventListener("load", () => setTimeout(later, 300), { once: true });
}

boot();

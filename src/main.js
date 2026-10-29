import "@fontsource-variable/unbounded";
import "@fontsource-variable/onest";
import "@fontsource/jetbrains-mono/500.css";
import "./styles/main.css";

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
  const hero = document.querySelector(".hero");
  const name = document.querySelector(".hero__name");
  const heroInner = hero.clientWidth - parseFloat(getComputedStyle(hero).paddingLeft) * 2;
  const fs = parseFloat(getComputedStyle(name).fontSize);
  const inner = name.querySelector(".hero__name-in");
  name.style.fontSize = `${fs * (heroInner / inner.getBoundingClientRect().width) * 0.995}px`;
  fitWidth(document.querySelector(".footer"), document.querySelector(".footer__big"));
}
let fitRaf = 0;
const refit = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(() => { fitAll(); ScrollTrigger.refresh(); }); };
window.addEventListener("resize", refit);
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
      toneUrl: url("img/portrait-tone.webp"),
      photoUrl: url(coarse ? "img/portrait-photo-480.webp" : "img/portrait-photo-900.webp"),
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
  gsap.to(".hero__name-in", { yPercent: 30, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__line, .hero__bottom", { y: -60, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "center center", end: "bottom top", scrub: true } });
}

/* ---------- loader ---------- */
async function boot() {
  const loader = document.getElementById("loader");
  const num = document.getElementById("loader-num");
  let seen = false;
  try { seen = !!sessionStorage.getItem("usta-seen"); sessionStorage.setItem("usta-seen", "1"); } catch (e) {}
  const img = document.querySelector(".hero__img");
  let ready = false;
  Promise.all([document.fonts?.ready, img.decode?.().catch(() => {})]).then(() => { ready = true; });
  const minTime = reduce ? 0 : seen ? 350 : 1400;
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
  setTimeout(startGL, reduce ? 0 : 500);
}

boot();

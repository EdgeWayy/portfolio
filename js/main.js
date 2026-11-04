import "@fontsource-variable/unbounded";
import "@fontsource-variable/onest";
import "@fontsource/jetbrains-mono/500.css";
// ACID theme fonts (the files download only when that theme uses them): Rubik Wet Paint has Cyrillic, Creepster is for Latin labels
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/rubik-wet-paint/400.css";
import "@fontsource/creepster/400.css";
import "../css/style.css";
import "../css/fx.css";
import "../css/acid.css";
import "../css/halloween.css";

import { initI18n, onLang, getLang } from "./i18n.js";
import { renderAll } from "./render.js";
import { initUI } from "./ui.js";
import { initSmoothScroll, initMotion, initStill, heroIntro, gsap, ScrollTrigger } from "./motion.js";
import { initCursor, initMagnetic } from "./cursor.js";
import { playIntro, shouldPlayIntro, abortIntro } from "./intro.js"; // intro sequence (remove with js/intro.js, js/intro-word.js, css/intro.css)
import { runGate, abortGate } from "./gate.js"; // gate screen (remove with js/gate.js, css/gate.css)
import { initTheme, isAcid, onTheme } from "./theme.js";
import { initThemeFx } from "./theme-fx.js";
import { acidEntrance, abortAcidEntrance } from "./acid-intro.js";
import { initSecret } from "./secret.js";
import { initHoldMorph, ensureSkullCanvas } from "./hold-morph.js";
import { initStillBlob, initPupils } from "./xray.js";
import { loadSkullTone } from "./skull.js";
import { addProbe } from "./cursor-tone.js";
import { initFx } from "./fx.js";

const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const conn = navigator.connection || {};
// weak phone or data saver: keep the static halftone image, skip WebGL
const weak = !!conn.saveData || /(^|-)2g/.test(conn.effectiveType || "")
  || (navigator.deviceMemory && navigator.deviceMemory <= 2)
  || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);

initTheme();
initI18n();
renderAll();
if (!reduce) initSmoothScroll();
initUI();
initCursor();
initMagnetic();
initFx();
initSecret({ morph: initHoldMorph({
  getGl: () => glPortrait,
  canUseGl: () => !reduce && !weak && !!(document.createElement("canvas").getContext("webgl")),
  toneUrl: new URL("img/portrait-tone-dots.webp", document.baseURI).href,
  coarse,
  reduce,
}) });
const themeFx = initThemeFx({ reduce, weak, phone: innerWidth < 640 });
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
  // ACID on desktop: a smaller name, so the headline and text fit on the slime above its edge
  const k = isAcid() && innerWidth >= 960 ? 0.6 : 1;
  name.style.fontSize = `${fs * (avail / inner.getBoundingClientRect().width) * 0.99 * k}px`;
}
let fitRaf = 0;
const refit = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(() => { fitAll(); ScrollTrigger.refresh(); }); };
// phones fire resize when the URL bar shows or hides: only a width change can change the fit
let lastW = innerWidth;
window.addEventListener("resize", () => { if (innerWidth !== lastW) { lastW = innerWidth; refit(); } });
onLang(refit);
// the themes use different fonts, so the fitted words and every scroll position have to be measured again
// (a font the current theme has not used yet is not downloaded, so wait for it before measuring again)
const refitTheme = () => {
  refit();
  document.fonts?.load?.(isAcid() ? '40px "Rubik Wet Paint"' : '800 40px "Unbounded Variable"', "Акбар").then(refit, () => {});
};
onTheme(refitTheme);
if (isAcid()) refitTheme();

/* ---------- the portrait in the ACID theme: a skull ---------- */
const SKULL_ALT = { ru: "Череп из восьмиконечных звёзд", en: "A skull made of eight-point stars" };
let glPortrait = null;
function skullAlt() {
  const img = document.querySelector(".hero__img");
  if (img && isAcid()) img.alt = SKULL_ALT[getLang()];
}
/* Without WebGL (reduced motion, weak phones) the same halftone is a still canvas that fades in over the photo. */
async function skullFallback() {
  const figure = document.getElementById("portrait");
  if (!figure || glPortrait) return;
  if (!figure.querySelector(".hero__skull") && isAcid()) {
    const cv = await ensureSkullCanvas(figure);
    void cv.offsetWidth; // start the fade from the first frame it exists
  }
  root.classList.toggle("skull-on", isAcid());
}
function portraitTheme() {
  skullAlt();
  if (glPortrait) glPortrait.setAcid(isAcid(), isAcid() ? 2600 : 1800).catch((e) => console.warn("skull:", e));
  else skullFallback().catch((e) => console.warn("skull:", e));
}
onTheme(portraitTheme);
onLang(skullAlt);
skullAlt();

/* ---------- the portrait's X-ray blob and the skull's eyes ---------- */
const portraitFig = document.getElementById("portrait");
let stillBlob = null;
function startStillBlob() {
  if (stillBlob || !portraitFig) return;
  const loadImage = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  let tone = null;
  stillBlob = initStillBlob(portraitFig, {
    loadTone: () => (tone ??= loadImage(new URL("img/portrait-tone-dots.webp", document.baseURI).href)),
    loadSkull: loadSkullTone,
    isAcid, onTheme,
    isHeld: () => !!root.style.getPropertyValue("--hold"),
  });
}
if (portraitFig) {
  initPupils(portraitFig, { reduce });
  // the cursor over the portrait: dark inside the blob, light on the pale egg around the skull in ACID
  addProbe((x, y, top) => {
    if (!isAcid() || !top?.closest?.(".hero__portrait") || top.closest("a")) return null;
    const b = glPortrait?.blob() || stillBlob?.state();
    if (b?.on && Math.hypot(x - b.x, y - b.y) < b.r * 0.82) return "dark";
    const r = portraitFig.getBoundingClientRect();
    const ex = (x - (r.left + r.width / 2)) / (r.width * 0.54), ey = (y - (r.top + r.height / 2)) / (r.height * 0.5);
    return ex * ex + ey * ey < 1 ? "light" : null;
  });
}

/* ---------- WebGL portrait ---------- */
let portraitReady = () => {};
const portraitUp = new Promise((resolve) => { portraitReady = resolve; });
async function startGL() {
  const still = () => { startStillBlob(); return skullFallback().finally(portraitReady); };
  if (reduce || weak || !portraitFig) return still();
  const probe = document.createElement("canvas");
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) return still();
  try {
    const { initHeroGL } = await import("./hero-gl.js");
    const figure = document.getElementById("portrait");
    const url = (p) => new URL(p, document.baseURI).href;
    const gl = await initHeroGL(figure, {
      toneUrl: url("img/portrait-tone-dots.webp"),
      coarse,
    });
    root.classList.add("gl-ready");
    glPortrait = gl;
    root.classList.remove("skull-on");
    // arriving in ACID the skull is simply there: only the star's hold or a theme change shows the morph
    if (isAcid()) gl.setAcid(true, 0).catch((e) => console.warn("skull:", e));
    portraitReady();
    ScrollTrigger.create({
      trigger: ".hero", start: "top top", end: "bottom top",
      onUpdate: (s) => gl.setScroll(s.progress),
    });
    await gl.intro(isAcid() ? 0.8 : 1.5);
    if (!isAcid()) {
      // the X-ray's demo: once per visit
      let fresh = true;
      try { fresh = !sessionStorage.getItem("akbar-xray-demo"); sessionStorage.setItem("akbar-xray-demo", "1"); } catch (e) {}
      if (fresh) gl.sweep(coarse ? 3200 : 2800);
    }
  } catch (err) {
    console.warn("WebGL portrait disabled:", err);
    glPortrait = null;
    root.classList.remove("gl-ready");
    startStillBlob();
    skullFallback().catch(() => {}).finally(portraitReady);
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
let glStarted = false;
async function boot() {
  // gate screen: the loader and the intro wait until the button has been held (if it ever breaks, the site goes on)
  await runGate().catch((e) => { console.warn("gate:", e); abortGate(); });
  setTimeout(rescue, 25000); // gate screen: safety net, the loader + intro normally finish in ~11s
  const loader = document.getElementById("loader");
  const num = document.getElementById("loader-num");
  const star = loader.querySelector(".loader__star path");
  // one source of truth: the counter value also drives the star's stroke
  const draw = (pct) => {
    num.textContent = String(pct).padStart(3, "0");
    star.style.strokeDashoffset = 100 - pct;
    // drawn all the way round: no dash any more. A dash's two ends meet in butt caps, which leaves a notch in the point it started from.
    star.style.strokeDasharray = pct >= 100 ? "none" : "";
  };
  // ACID has no counter loader or intro: the gate's lime flood fades straight into the page
  const seen = root.classList.contains("seen") || isAcid();
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
  // intro sequence: the page is put in its final state (nav in place, hero entrance finished) before it is assembled
  const settlePage = () => {
    const nav = document.getElementById("nav");
    nav.style.transition = "none"; nav.classList.remove("is-pre"); void nav.offsetHeight; nav.style.transition = "";
    if (document.querySelector(".hero")) heroIntro().progress(1, false);
  };
  const assembled = shouldPlayIntro({ reduce, seen }) && await playIntro(loader, { prepare: settlePage }) // intro sequence
    .catch((e) => { console.warn("intro:", e); abortIntro(); return false; }); // if it ever breaks, the page is given back intact
  root.classList.remove("ak-hide-site"); // gate screen: the page was not painted under the gate/loader (perf)
  const acid = isAcid();
  if (acid) {
    // ACID: the portrait is started first, so the interface can come in with the skull already on it. Then the slime.
    if (!glStarted) { glStarted = true; startGL().catch((e) => { console.warn("skull:", e); portraitReady(); }); }
    acidEntrance({ reduce, portrait: portraitUp, start: (mode) => themeFx.start(mode) })
      .catch((e) => { console.warn("acid intro:", e); abortAcidEntrance(); themeFx.start("short"); });
  } else themeFx.start(); // leaves, once the page is actually on screen
  loader.classList.add("is-out");
  setTimeout(() => document.getElementById("nav").classList.remove("is-pre"), reduce || seen ? 0 : 350);
  if (!reduce && document.querySelector(".hero") && !assembled && !acid) heroIntro();
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
  const later = () => idle(() => { if (!glStarted) { glStarted = true; startGL(); } }, { timeout: 1500 });
  document.readyState === "complete" ? setTimeout(later, 300) : window.addEventListener("load", () => setTimeout(later, 300), { once: true });
}

// gate screen / intro sequence safety net: if the loader or the intro ever errors or stalls, show the site anyway
function rescue() {
  if (root.classList.contains("loaded")) return;
  console.warn("boot: rescue");
  abortIntro();
  abortGate();
  abortAcidEntrance();
  document.getElementById("loader")?.classList.add("is-out");
  document.getElementById("nav")?.classList.remove("is-pre");
  root.classList.add("loaded");
  themeFx.start();
}
boot().catch((e) => { console.warn("boot:", e); rescue(); });

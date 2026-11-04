/* The way the page comes up in the ACID theme, wherever it is entered from (the finale, a reload, another page).
     1  black, no slime
     2  the interface comes in, item after item
     3  a short pause, and only then the slime starts to flow (js/slime.js)
   On a later page of the same visit there is a short version: the interface is simply there and the slime flows in a second.
   A reload is a new entrance, so it gets the full one. Reduced motion: a gentle fade, then the slime fades in where it stays.
   head.html decides on `acid-pre` before the first paint with the same rules, so nothing is ever seen before this runs. */
import { gsap } from "gsap";

/* ---------- timings, in seconds ---------- */
const ITEM = 0.46;            // one item's fade and rise
const STAGGER = 0.05;         // between two items
const RISE = 14;              // px
const PAUSE = 0.3;            // interface in place, slime not started yet
const FONTS_WAIT = 900;       // ms: the fonts get this long, so nothing jumps; then it goes on regardless
const PORTRAIT_WAIT = 1200;   // ms: the same for the skull
const STILL_FADE = 0.5;       // reduced motion

const KEY = "akbar-acid-intro";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let aborted = false;

export function abortAcidEntrance() {
  aborted = true;
  document.documentElement.classList.remove("acid-pre");
}

const items = () => {
  const home = document.documentElement.dataset.page === "index";
  const nav = ".nav__logo, .nav__links > a, .nav__right > *";
  const list = home
    ? [nav, ".hero__meta, .hero__name, .hero__line, .hero__lead, .hero__ctas > *", ".hero__portrait", ".skull-badge, .skull-tag, .skull-links", ".marquees", ".acid-exit"]
    : [nav, "main", ".acid-exit"];
  return list.flatMap((s) => [...document.querySelectorAll(s)]);
};

export async function acidEntrance({ reduce, portrait, start }) {
  const root = document.documentElement;
  const nav = document.getElementById("nav");
  const full = root.classList.contains("acid-pre");
  try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  nav.style.transition = "none";
  nav.classList.remove("is-pre");
  void nav.offsetHeight;
  nav.style.transition = "";
  if (!full) { start("short"); return; }

  const fontsReady = Promise.all([
    document.fonts?.load?.('40px "Rubik Wet Paint"', "Акбар"),
    document.fonts?.load?.('40px "Creepster"', "akbar"),
    document.fonts?.ready,
  ]).catch(() => {});
  await Promise.race([fontsReady, wait(FONTS_WAIT)]);
  await Promise.race([portrait, wait(PORTRAIT_WAIT)]);
  if (aborted) { start("short"); return; }

  const list = items();
  gsap.set(list, { autoAlpha: 0 });
  root.classList.remove("acid-pre");
  if (reduce) {
    await gsap.to(list, { autoAlpha: 1, duration: STILL_FADE, ease: "power1.out", clearProps: "visibility,opacity" }).then();
    start("full"); // js/theme-fx.js turns this into the still version
    return;
  }
  // the fade and the rise are cleared at the end, so the magnetic buttons get their own transform back
  await gsap.fromTo(list, { y: RISE }, {
    y: 0, autoAlpha: 1, duration: ITEM, ease: "power2.out", stagger: STAGGER,
    clearProps: "transform,visibility,opacity",
  }).then();
  await wait(PAUSE * 1000);
  start("full");
}

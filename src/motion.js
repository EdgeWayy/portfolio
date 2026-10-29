/* Smooth scroll, text reveals, marquee, counters, process line, stacked case cards. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { onLang } from "./i18n.js";

gsap.registerPlugin(ScrollTrigger);

export let lenis = null;

/* Wrap each word in .w > .wi so it can slide up from a mask. */
export function split(node) {
  const text = node.textContent.replace(/\s+/g, " ").trim();
  node.innerHTML = `<span class="sr-only">${text}</span>` + node.innerHTML
    .split(/([ \t\n\r]+)/)  // &nbsp; is not split: words joined by it stay together
    .map((part) => (/^[ \t\n\r]+$/.test(part) || !part ? part : `<span class="w" aria-hidden="true"><span class="wi">${part}</span></span>`))
    .join("");
  return node.querySelectorAll(".wi");
}

export function initSmoothScroll() {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollToTarget(target) {
  const navH = 72;
  if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -navH, duration: 1.4 });
  else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
  else target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

/* ---------- hero entrance (after the loader) ---------- */
export function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const name = document.querySelector(".hero__name-in");
  const line = document.querySelector(".hero__line");
  const words = split(line);
  tl.from(name, { yPercent: 105, duration: 1.4 }, 0)
    .from(words, { yPercent: 110, duration: 1.1, stagger: 0.045 }, 0.15)
    .from(".hero__lead, .hero__ctas > *, .hero__meta", { y: 24, opacity: 0, duration: 1, stagger: 0.07 }, 0.45)
    .from(".hero__portrait", { scale: 0.94, duration: 1.4 }, 0.1); // no opacity: the image is the LCP element
  // the name lives in an overflow mask so it rises from the baseline
  name.parentElement.style.overflow = "hidden";
  tl.add(() => { name.parentElement.style.overflow = ""; });
  onLang(() => split(line));
  return tl;
}

/* ---------- section reveals ---------- */
function reveals() {
  document.querySelectorAll("[data-split]:not(.hero__line)").forEach((node) => {
    const words = split(node);
    gsap.from(words, {
      yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.04,
      scrollTrigger: { trigger: node, start: "top 88%" },
    });
  });
  // headings get re-split after a language switch, already visible
  onLang(() => document.querySelectorAll("[data-split]:not(.hero__line)").forEach((n) => split(n)));

  gsap.utils.toArray("[data-reveal]").forEach((node) => {
    gsap.to(node, { y: 0, opacity: 1, duration: 1, ease: "expo.out", scrollTrigger: { trigger: node, start: "top 90%" } });
  });

  gsap.utils.toArray(".svc__item, .log li, .qa, .step").forEach((node) => {
    gsap.from(node, { y: 30, opacity: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: node, start: "top 92%" } });
  });
}

/* ---------- marquee: endless, speeds up with scroll velocity ---------- */
function marquees() {
  const rows = [...document.querySelectorAll(".marquee")];
  const state = rows.map((row) => {
    const track = row.querySelector(".marquee__track");
    const fill = () => {
      track.querySelectorAll("[data-clone]").forEach((n) => n.remove());
      const original = [...track.children];
      for (let k = 0; k < 3; k++) original.forEach((n) => { const c = n.cloneNode(true); c.dataset.clone = ""; c.setAttribute("aria-hidden", "true"); track.append(c); });
    };
    fill();
    return { track, fill, dir: Number(row.dataset.speed) || 1, x: 0 };
  });
  onLang(() => state.forEach((s) => s.fill()));
  let boost = 0;
  if (lenis) lenis.on("scroll", (e) => { boost = Math.min(6, Math.abs(e.velocity) * 0.25); });
  gsap.ticker.add((_, dt) => {
    boost *= 0.94;
    for (const s of state) {
      const quarter = s.track.scrollWidth / 4;
      s.x -= s.dir * (0.05 + boost * 0.05) * dt;
      if (s.x <= -quarter) s.x += quarter;
      if (s.x > 0) s.x -= quarter;
      s.track.style.transform = `translate3d(${s.x}px,0,0)`;
    }
  });
}

/* ---------- counters ---------- */
function counters() {
  document.querySelectorAll("[data-count]").forEach((node) => {
    const end = Number(node.dataset.count);
    const suffix = node.dataset.suffix || "";
    const obj = { v: end === 0 ? 9 : 0 };
    gsap.to(obj, {
      v: end, duration: end === 0 ? 1.2 : 1.6, ease: "power3.out",
      scrollTrigger: { trigger: node, start: "top 90%" },
      onUpdate: () => { node.textContent = Math.round(obj.v) + suffix; },
    });
  });
}

/* ---------- process line ---------- */
function processLine() {
  const steps = document.getElementById("steps");
  const items = [...steps.querySelectorAll(".step")];
  ScrollTrigger.create({
    trigger: steps, start: "top 75%", end: "bottom 55%", scrub: true,
    onUpdate: (self) => {
      steps.style.setProperty("--p", self.progress.toFixed(3));
      items.forEach((it, i) => it.classList.toggle("is-on", self.progress >= i / items.length));
    },
  });
}

/* ---------- stacked case cards (desktop) ---------- */
function cases() {
  const mm = gsap.matchMedia();
  mm.add("(min-width: 960px)", () => {
    const cards = gsap.utils.toArray(".case");
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      gsap.to(card, {
        scale: 0.92, filter: "brightness(.55)", ease: "none",
        scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
      });
    });
  });
  gsap.utils.toArray(".case .phone").forEach((ph) => {
    gsap.fromTo(ph, { yPercent: 14 }, { yPercent: -10, ease: "none", scrollTrigger: { trigger: ph.closest(".case"), start: "top bottom", end: "bottom top", scrub: true } });
  });
}

/* ---------- footer name ---------- */
function footer() {
  gsap.from(".footer__big > *", {
    yPercent: 100, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.08,
    scrollTrigger: { trigger: ".footer", start: "top bottom" },
  });
}

export function initMotion() {
  document.documentElement.classList.add("anim");
  reveals();
  marquees();
  counters();
  processLine();
  cases();
  footer();
  // fonts can change heights after load
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

/* Reduced motion: no smooth scroll, no scrubbing, just a still marquee and final numbers. */
export function initStill() {
  const steps = document.getElementById("steps");
  steps.style.setProperty("--p", 1);
  steps.querySelectorAll(".step").forEach((s) => s.classList.add("is-on"));
}

export { gsap, ScrollTrigger };

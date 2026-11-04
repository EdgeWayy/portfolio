/* Custom cursor + magnetic buttons. Desktop with a fine pointer only.
   ACID theme: the cursor is lime on dark and black on light, decided per frame from what is really under it:
   canvases and shapes through the probes of js/cursor-tone.js, everything else from the computed background of the
   elements at that point. A thin outline in the opposite color keeps it readable wherever the guess cannot be exact
   (lime letters on black, screenshots). No blend modes: those tint it off palette on the pale lime. */
import { gsap } from "gsap";
import { askBack, askFront } from "./cursor-tone.js";

const RGBA = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?/;
function parseColor(str) {
  const m = RGBA.exec(str || "");
  if (!m) return null;
  const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return { r: +m[1], g: +m[2], b: +m[3], a };
}
const isLight = (c) => (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255 > 0.45;

/** "light" or "dark" at this point of the screen. */
function toneAt(x, y) {
  const stack = document.elementsFromPoint(x, y);
  const fromProbe = askFront(x, y, stack[0]);
  if (fromProbe) return fromProbe;
  for (const el of stack) {
    if (el === document.body || el === document.documentElement) break;
    const s = getComputedStyle(el);
    // a button's hover fill is a pseudo-element: while it is hovered, that fill is what is under the pointer
    if (el.matches(".btn:hover, .btn:focus-visible")) {
      const h = parseColor(probeColor(s.getPropertyValue("--hover")));
      if (h && h.a > 0.5) return isLight(h) ? "light" : "dark";
    }
    const bg = parseColor(s.backgroundColor);
    if (bg && bg.a > 0.5) return isLight(bg) ? "light" : "dark";
    if (el.tagName === "IMG" || el.tagName === "VIDEO") return "dark";
  }
  return askBack(x, y, stack[0]) || "dark";
}

/* A custom property may hold any CSS color: let the browser turn it into rgb(). */
const swatch = () => {
  const n = document.createElement("i");
  n.hidden = true;
  document.documentElement.append(n);
  return n;
};
let sample = null;
const memo = new Map();
function probeColor(value) {
  const v = value.trim();
  if (!v) return "";
  if (memo.has(v)) return memo.get(v);
  sample ??= swatch();
  sample.style.color = "";
  sample.style.color = v;
  const out = getComputedStyle(sample).color;
  memo.set(v, out);
  return out;
}

export function initCursor() {
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine) return;
  const root = document.documentElement;
  const cursor = document.querySelector(".cursor");
  const dot = cursor?.querySelector(".cursor__dot");
  const ring = cursor?.querySelector(".cursor__ring");
  const label = cursor?.querySelector(".cursor__label");
  if (!dot || !ring || !label) return; // no custom cursor on this page: the system cursor stays
  root.classList.add("has-cursor");
  try {
    const dx = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });

    let mx = -1, my = -1, moved = false, lastTone = 0;
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      if (cursor.classList.contains("is-hidden")) {
        cursor.classList.remove("is-hidden");
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
      }
      mx = e.clientX; my = e.clientY; moved = true;
      dx(mx); dy(my); rx(mx); ry(my);
    }, { passive: true });
    document.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
    document.addEventListener("pointerenter", () => cursor.classList.remove("is-hidden"));

    document.addEventListener("pointerover", (e) => {
      const t = e.target;
      if (!t?.closest) return;
      const labeled = t.closest("[data-cursor]");
      const link = t.closest("a, button, summary, label, input[type=range], .ak-gate__btn");
      const text = t.closest("input[type=text], textarea");
      cursor.classList.toggle("is-label", !!labeled);
      cursor.classList.toggle("is-link", !!link && !labeled);
      cursor.classList.toggle("is-text", !!text);
      label.textContent = labeled ? labeled.dataset.cursor : "";
    });

    /* At most once a frame while the mouse moves, and a few times a second when it rests (the slime moves under it). */
    let tone = "";
    gsap.ticker.add(() => {
      if (root.dataset.theme !== "acid") {
        if (tone) { tone = ""; cursor.classList.remove("on-light"); }
        return;
      }
      if (mx < 0 || document.hidden) return;
      const now = performance.now();
      if (!moved && now - lastTone < 90) return;
      moved = false;
      lastTone = now;
      const next = toneAt(mx, my);
      if (next !== tone) {
        tone = next;
        cursor.classList.toggle("on-light", next === "light");
      }
    });
  } catch (err) {
    console.warn("cursor:", err);
    root.classList.remove("has-cursor"); // it failed: give the system cursor back
  }
}

export function initMagnetic() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.addEventListener("pointermove", (e) => {
    const m = e.target.closest?.(".magnetic");
    document.querySelectorAll(".magnetic.is-pulled").forEach((n) => {
      if (n !== m) { n.classList.remove("is-pulled"); gsap.to(n, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, .4)" }); }
    });
    if (!m) return;
    const r = m.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    m.classList.add("is-pulled");
    gsap.to(m, { x: x * 0.28, y: y * 0.36, duration: 0.5, ease: "power3.out" });
  }, { passive: true });
}

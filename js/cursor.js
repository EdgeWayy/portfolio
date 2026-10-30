/* Custom cursor + magnetic buttons. Desktop with a fine pointer only. */
import { gsap } from "gsap";

export function initCursor() {
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine) return;
  document.documentElement.classList.add("has-cursor");
  const cursor = document.querySelector(".cursor");
  const dot = cursor.querySelector(".cursor__dot");
  const ring = cursor.querySelector(".cursor__ring");
  const label = cursor.querySelector(".cursor__label");
  const dx = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
  const dy = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
  const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    if (cursor.classList.contains("is-hidden") && !e.target.closest(".hero__portrait")) {
      cursor.classList.remove("is-hidden");
      gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
    }
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
  }, { passive: true });
  document.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
  document.addEventListener("pointerenter", () => cursor.classList.remove("is-hidden"));

  document.addEventListener("pointerover", (e) => {
    const t = e.target;
    const labeled = t.closest("[data-cursor]");
    const link = t.closest("a, button, summary, label, input[type=range]");
    const text = t.closest("input[type=text], textarea");
    const portrait = t.closest(".hero__portrait");
    cursor.classList.toggle("is-label", !!labeled);
    cursor.classList.toggle("is-link", !!link && !labeled);
    cursor.classList.toggle("is-text", !!text);
    cursor.classList.toggle("is-hidden", !!portrait && document.documentElement.classList.contains("gl-ready"));
    label.textContent = labeled ? labeled.dataset.cursor : "";
  });
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

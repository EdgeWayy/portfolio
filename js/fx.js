/* The press ripple shared by buttons and chips (one delegated listener). Hover and focus effects live in css/fx.css. */
const TARGETS = ".btn, .chips label, .burger, .acid-exit";

export function initFx() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.addEventListener("pointerdown", (e) => {
    const host = e.target.closest?.(TARGETS);
    if (!host || e.button > 0) return;
    const box = host.matches("label") ? host.querySelector("span") : host;
    if (!box) return;
    const r = box.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const dot = document.createElement("span");
    dot.className = "ripple";
    dot.setAttribute("aria-hidden", "true");
    dot.style.width = dot.style.height = `${size}px`;
    dot.style.left = `${e.clientX - r.left - size / 2}px`;
    dot.style.top = `${e.clientY - r.top - size / 2}px`;
    box.append(dot);
    dot.animate(
      [{ transform: "scale(0)", opacity: 0.32 }, { transform: "scale(1)", opacity: 0 }],
      { duration: 620, easing: "cubic-bezier(.2,.8,.2,1)" },
    ).finished.finally(() => dot.remove());
  }, { passive: true });
}

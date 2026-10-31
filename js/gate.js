/* Gate screen, shown before the intro on the first page of a visit: softly glowing code symbols ("living code")
   and a pill button. Holding the button for 3 seconds fills it, zooms the symbols and the button toward the viewer
   and opens the site; letting go earlier drains it back. The loader and the intro only start after the gate is done.
   Remove: delete this file, css/gate.css and the marked "gate" lines in js/main.js. */
import { gsap } from "gsap";
import { getLang, onLang } from "./i18n.js";
import "../css/gate.css";

const KEY = "akbar-intro-seen"; // same key as the intro: seen once this session, both are skipped
const HOLD = 3;                 // seconds
const TEXT = {
  ru: { open: "Открыть", hold: "Держи", label: "Удерживайте кнопку 3 секунды, чтобы открыть сайт" },
  en: { open: "Open", hold: "Hold it", label: "Hold the button for 3 seconds to open the site" },
};
const SYMBOLS = ["</>", "{ }", "=>", "#", "$_", ";", "[]", "( )", "//", "&&", "||", "!=", "++", ">_", "0 1",
  "const", "<div>", "def", "if", "return", "{ }", "</>", "=>", ";", "()", "[]"];
// mostly navy and the site's orange, a few soft warm accents (soft yellow, soft teal)
const COLORS = ["#0B1F3A", "#0B1F3A", "#C9A35E", "#0B1F3A", "#C9A35E", "#E2C46B", "#0B1F3A", "#C9A35E", "#6FA8A0"];
const rand = (a, b) => a + Math.random() * (b - a);
const alpha = (hex, a) => `${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}`;

export function shouldShowGate() {
  if (document.documentElement.classList.contains("seen")) return false;
  try { if (sessionStorage.getItem(KEY)) return false; } catch (e) {}
  return true;
}

/* Evenly spread candidate spots (jittered grid), in random order. */
function place(count, W, H) {
  const cols = Math.max(3, Math.round(Math.sqrt((count * 1.8 * W) / H)));
  const rows = Math.max(3, Math.round((count * 1.8) / cols));
  const cw = W / cols, ch = H / rows;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    cells.push({ x: (c + rand(0.2, 0.8)) * cw, y: (r + rand(0.2, 0.8)) * ch });
  }
  return gsap.utils.shuffle(cells);
}

/** Show the gate; resolves once it has been held for 3 seconds and has faded away. */
export function runGate() {
  const html = document.documentElement;
  if (!shouldShowGate()) { html.classList.add("ak-gate-done"); return Promise.resolve(); }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  return new Promise((resolve) => {
    const W = innerWidth, H = innerHeight;
    const phone = W < 640;
    const gate = document.createElement("div");
    gate.className = "ak-gate";
    gate.innerHTML = `<div class="ak-gate__code" aria-hidden="true"></div>
      <div class="ak-gate__btn" role="button" tabindex="0">
        <span class="ak-gate__layer"><span class="ak-gate__t is-idle"></span><span class="ak-gate__t is-hold"></span></span>
        <span class="ak-gate__layer ak-gate__fill" aria-hidden="true"><span class="ak-gate__t is-idle"></span><span class="ak-gate__t is-hold"></span></span>
      </div>`;
    document.body.append(gate);
    const btn = gate.querySelector(".ak-gate__btn");
    const fill = gate.querySelector(".ak-gate__fill");
    const codeBox = gate.querySelector(".ak-gate__code");

    const setText = () => {
      const t = TEXT[getLang() === "en" ? "en" : "ru"];
      btn.querySelectorAll(".is-idle").forEach((n) => { n.textContent = t.open; });
      btn.querySelectorAll(".is-hold").forEach((n) => { n.textContent = t.hold; });
      btn.setAttribute("aria-label", t.label);
    };
    setText();
    onLang(() => { if (gate.isConnected) setText(); });

    /* ----- living code: ~60% far (small, blurred, faint), ~40% near (big, sharp, stronger glow) ----- */
    const BTN_MAX = phone ? 1.15 : 1.3; // how far the button grows while held
    const b = btn.getBoundingClientRect();
    const grow = { x: (b.width * (BTN_MAX - 1)) / 2, y: (b.height * (BTN_MAX - 1)) / 2 };
    const pad = phone ? 30 : 64;
    const zone = { l: b.left - grow.x - pad, r: b.right + grow.x + pad, t: b.top - grow.y - pad, b: b.bottom + grow.y + pad };
    const count = phone ? 28 : 44;
    const cx = W / 2, cy = H / 2;
    const syms = [];
    for (const p of place(count, W, H)) {
      if (syms.length >= count) break;
      const i = syms.length;
      const near = i % 5 < 2;
      const size = near ? (phone ? rand(20, 34) : rand(26, 48)) : (phone ? rand(12, 18) : rand(14, 24));
      const text = SYMBOLS[(i * 7) % SYMBOLS.length];
      // rough box of the text (monospace: ~0.6em per character): it must stay clear of the button zone
      const w = text.length * size * 0.62 + 24, h = size * 1.2 + 24;
      if (p.x + w / 2 > zone.l && p.x - w / 2 < zone.r && p.y + h / 2 > zone.t && p.y - h / 2 < zone.b) continue;
      const color = COLORS[(i * 5) % COLORS.length];
      const el = document.createElement("div");
      el.className = `ak-gate__sym ${near ? "is-near" : "is-far"}`;
      const bob = document.createElement("span");
      bob.className = `ak-gate__bob${i % 6 === 3 ? " is-breathing" : ""}`;
      const amp = near ? 12 : 5;
      bob.style.setProperty("--d", `${(near ? rand(4.5, 6.5) : rand(6.5, 9)).toFixed(2)}s`);
      bob.style.setProperty("--delay", `${(-rand(0, 8)).toFixed(2)}s`);
      bob.style.setProperty("--ax", `${rand(-amp, amp).toFixed(1)}px`);
      bob.style.setProperty("--ay", `${(-rand(amp * 0.6, amp)).toFixed(1)}px`);
      bob.style.setProperty("--r", `${rand(-15, 15).toFixed(1)}deg`);
      bob.style.color = color;
      bob.style.fontSize = `${size.toFixed(1)}px`;
      // a soft, static glow in the symbol's own color (stronger on near symbols)
      bob.style.textShadow = near
        ? `0 0 14px ${alpha(color, 0.45)}, 0 0 4px ${alpha(color, 0.3)}`
        : `0 0 12px ${alpha(color, 0.4)}`;
      bob.textContent = text;
      el.append(bob);
      codeBox.append(el);
      const x = p.x, y = p.y;
      gsap.set(el, { x, y, xPercent: -50, yPercent: -50 });
      syms.push({ el, near, x, y, dx: p.x - cx, dy: p.y - cy });
    }
    // far layer first in the DOM, so near symbols paint on top
    syms.filter((s) => !s.near).forEach((s) => codeBox.prepend(s.el));
    gsap.from(syms.map((s) => s.el), { opacity: 0, duration: reduce ? 0.01 : 0.8, stagger: reduce ? 0 : 0.012, ease: "power1.out" });

    /* ----- the 3-second hold: fill left to right (linear, exactly 3s) + scene and button zoom toward the viewer ----- */
    gsap.set(fill, { clipPath: "inset(0% 100% 0% 0%)" });
    const hold = gsap.timeline({ paused: true, onComplete: finish });
    hold.to(fill, { clipPath: "inset(0% 0% 0% 0%)", duration: HOLD, ease: "none" }, 0);
    if (!reduce) {
      hold.to(btn, { scale: BTN_MAX, duration: HOLD, ease: "power2.in" }, 0); // same easing as the scene zoom
      syms.forEach((s) => {
        const k = s.near ? 0.9 : 0.15; // near symbols drift out past the edges, far ones barely move
        hold.to(s.el, { x: s.x + s.dx * k, y: s.y + s.dy * k, scale: s.near ? 1.8 : 1.2, duration: HOLD, ease: "power2.in" }, 0);
      });
    }

    let holding = false, done = false;
    const start = () => {
      if (done || holding) return;
      holding = true;
      btn.classList.add("is-holding");
      gate.classList.add("is-moving");
      hold.timeScale(1).play();
    };
    const stop = () => {
      if (done || !holding) return;
      holding = false;
      btn.classList.remove("is-holding");
      hold.timeScale(HOLD / 0.5).reverse(); // drains back in about half a second
    };

    /* ----- input: pointer (mouse + touch) and keyboard (Space / Enter) ----- */
    const isKey = (e) => e.key === " " || e.key === "Enter";
    const onDown = (e) => { if (e.button > 0) return; e.preventDefault(); start(); };
    const onKeyDown = (e) => { if (!isKey(e)) return; e.preventDefault(); if (!e.repeat) start(); };
    const onKeyUp = (e) => { if (isKey(e)) { e.preventDefault(); stop(); } };
    const noMenu = (e) => e.preventDefault();
    btn.addEventListener("pointerdown", onDown);
    ["pointerup", "pointercancel", "pointerleave"].forEach((t) => btn.addEventListener(t, stop));
    btn.addEventListener("keydown", onKeyDown);
    btn.addEventListener("keyup", onKeyUp);
    btn.addEventListener("blur", stop);
    btn.addEventListener("contextmenu", noMenu);
    window.addEventListener("blur", stop);

    // the page under the gate must not scroll
    // (stopped before the smooth-scroll library sees them, it scrolls on its own otherwise)
    const block = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
    const blockKeys = (e) => {
      if (e.target !== btn && ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) block(e);
    };
    const opts = { capture: true, passive: false };
    window.addEventListener("wheel", block, opts);
    window.addEventListener("touchmove", block, opts);
    window.addEventListener("keydown", blockKeys, true);
    btn.focus({ preventScroll: true });

    function finish() {
      if (done) return;
      done = true;
      window.removeEventListener("blur", stop);
      const out = gsap.timeline({
        onComplete() {
          window.removeEventListener("wheel", block, opts);
          window.removeEventListener("touchmove", block, opts);
          window.removeEventListener("keydown", blockKeys, true);
          gate.remove();
          resolve();
        },
      });
      if (!reduce) {
        // a small pulse on the (already zoomed) button, then the zoom speeds up: near symbols rush past and fade
        out.to(btn, { scale: BTN_MAX * 1.05, duration: 0.14, ease: "power2.out", yoyo: true, repeat: 1 }, 0);
        syms.forEach((s) => {
          out.to(s.el, s.near
            ? { x: s.x + s.dx * 2.4, y: s.y + s.dy * 2.4, scale: 3.4, opacity: 0, duration: 0.6, ease: "power2.in" }
            : { scale: 1.5, opacity: 0, duration: 0.6, ease: "power1.in" }, 0.05);
        });
      }
      // the white gate fades to the loader underneath (the counter starts right after)
      out.add(() => html.classList.add("ak-gate-done"), reduce ? 0 : 0.3)
        .to(gate, { opacity: 0, duration: 0.45, ease: "power1.inOut" }, reduce ? 0 : 0.3);
    }
  });
}

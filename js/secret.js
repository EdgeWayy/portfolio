/* The way into the ACID theme: press and hold the star next to the name (top-left) for 2 seconds.
   The progress is shown on the portrait, because a finger covers the star: the portrait morphs into the skull as it fills
   (js/hold-morph.js). There is ONE progress value. It climbs while held and falls while released, in a frame loop with
   delta time, and is never reset: pressing again during the rewind continues from wherever it is.
   A short tap (or Enter) still opens the link as before.
   At 100%: a glitch + lime flash, theme = acid, the gate is forgotten, and the gate page opens. */
import { forgetGate, storeTheme } from "./theme.js";

const UP = 1 / 2;       // full in 2 seconds of holding
const DOWN = 1 / 0.7;   // empty in 0.7 seconds from full, proportionally less from lower down
const TAP_MS = 280;     // shorter than this is a normal click on the link

function flash(reduce) {
  const f = document.createElement("div");
  f.className = `acid-flash${reduce ? " is-still" : ""}`;
  f.setAttribute("aria-hidden", "true");
  f.innerHTML = reduce ? "" : "<i></i><i></i><i></i><i></i><i></i><i></i><b></b>";
  document.body.append(f);
  return f;
}

/* "HOLD ME" stays out of the way: if the next thing in the nav is too close, it is not shown at all. */
function initLabel(link) {
  const label = link.querySelector(".nav__holdme");
  if (!label) return;
  const check = () => {
    label.classList.remove("is-noroom");
    const next = [...link.parentNode.children].find((n) => n !== link && n.getBoundingClientRect().width > 0);
    if (next && label.getBoundingClientRect().right + 8 > next.getBoundingClientRect().left) label.classList.add("is-noroom");
  };
  check();
  window.addEventListener("resize", check);
  document.fonts?.ready?.then(check);
}

export function initSecret({ morph } = {}) {
  const link = document.querySelector(".nav__logo");
  const seal = link?.querySelector(".nav__seal");
  if (!seal || !morph) return;
  initLabel(link);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canBuzz = () => navigator.vibrate && matchMedia("(pointer: coarse)").matches;
  let p = 0, held = false, raf = 0, last = 0, pressedAt = 0, fired = false;
  let swallowClick = false, keyDown = null, pointerId = null, startX = 0, startY = 0, buzz = 0;

  // swallow the click that follows a real hold; it expires, so a later plain click is never eaten by accident
  const swallow = () => { swallowClick = true; setTimeout(() => { swallowClick = false; }, 400); };

  const step = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    p = Math.min(1, Math.max(0, p + (held ? UP : -DOWN) * dt));
    morph.set(p);
    if (p >= 1 && held) { raf = 0; fire(); return; }
    if (p <= 0 && !held) {
      raf = 0;
      seal.classList.remove("is-charging");
      morph.end();
      return;
    }
    raf = requestAnimationFrame(step);
  };

  function press() {
    if (fired) return;
    pressedAt = performance.now();
    swallowClick = false;
    held = true;
    seal.classList.add("is-charging");
    link.classList.add("is-held");
    morph.begin();
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    if (canBuzz()) buzz = setInterval(() => navigator.vibrate(8), 500);
  }
  function release() {
    if (fired || !pressedAt) return false;
    const short = performance.now() - pressedAt < TAP_MS;
    pressedAt = 0;
    held = false;
    link.classList.remove("is-held");
    clearInterval(buzz);
    return short;
  }
  function fire() {
    fired = true;
    swallow();
    clearInterval(buzz);
    if (canBuzz()) navigator.vibrate(40);
    storeTheme("acid");
    forgetGate();
    const f = flash(reduce);
    setTimeout(() => { location.href = link.href; }, reduce ? 200 : 720);
    // coming back with the Back button (page restored from memory): nothing may stay covered
    window.addEventListener("pageshow", (e) => {
      if (!e.persisted) return;
      f.remove();
      fired = false;
      held = false;
      p = 0;
      pressedAt = 0;
      link.classList.remove("is-held");
      seal.classList.remove("is-charging");
      morph.set(0);
      morph.end();
    }, { once: true });
  }

  /* ----- mouse and touch ----- */
  seal.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || pointerId !== null) return;
    pointerId = e.pointerId; startX = e.clientX; startY = e.clientY;
    try { seal.setPointerCapture(pointerId); } catch (err) {}
    press();
  });
  const up = (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    const short = release();
    // released after a real hold: nothing happens, not even the click
    if (!short) swallow();
  };
  seal.addEventListener("pointerup", up);
  seal.addEventListener("pointercancel", up);
  seal.addEventListener("lostpointercapture", up);
  // the pointer is captured, so "leaving" is measured: wandering off the star is a release
  seal.addEventListener("pointermove", (e) => {
    if (e.pointerId === pointerId && Math.hypot(e.clientX - startX, e.clientY - startY) > 28) { pointerId = null; release(); swallow(); }
  });
  link.addEventListener("click", (e) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  /* no context menu on long-press, no image drag, no selection (the last is in css/fx.css) */
  seal.addEventListener("contextmenu", (e) => e.preventDefault());
  link.addEventListener("dragstart", (e) => e.preventDefault());

  /* ----- keyboard: hold Enter or Space on the focused logo. A short Enter is still a normal link press. ----- */
  link.addEventListener("keydown", (e) => {
    if ((e.key !== "Enter" && e.key !== " ") || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!e.repeat && keyDown === null) { keyDown = e.key; press(); }
  });
  link.addEventListener("keyup", (e) => {
    if (e.key !== keyDown) return;
    e.preventDefault();
    keyDown = null;
    const short = release();
    if (short && e.key === "Enter") link.click();
  });
  link.addEventListener("blur", () => { if (keyDown !== null) { keyDown = null; release(); } });
  window.addEventListener("blur", () => { if (pressedAt) { keyDown = null; pointerId = null; release(); swallow(); } });
}

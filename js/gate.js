/* Gate screen, shown before the intro on the first page of a visit: a dark field of terminal-like blocks, each
   with one blinking white code symbol, and a pill button. Holding the button for HOLD_MS fills it, grows it and
   pushes the blocks away (spring physics); letting go earlier springs everything back. At the end a shockwave
   throws the blocks out and a white circle opens into the (white) loader and the intro.
   Remove: delete this file, css/gate.css and the marked "gate" lines in js/main.js. */
import { gsap } from "gsap";
import { getLang, onLang } from "./i18n.js";
import "../css/gate.css";

const KEY = "akbar-intro-seen"; // same key as the intro: seen once this session, both are skipped
const HOLD_MS = 2200;           // the one hold duration: fill, button, glow, blocks, haptics, keyboard, completion
const HOLD = HOLD_MS / 1000;
const TEXT = {
  ru: { open: "Открыть", hold: "Держи", label: "Удерживайте кнопку около 2 секунд, чтобы открыть сайт" },
  en: { open: "Open", hold: "Hold it", label: "Hold the button for about 2 seconds to open the site" },
};
// the five main symbols are the most frequent
const SYMBOLS = ["</>", "{ }", "=>", "#", "$_", "</>", "{ }", "=>", "#", "$_", "</>", "{ }", "$_", "=>",
  "[]", "( )", "//", "&&", "!=", ">_", ";"];
const rand = (a, b) => a + Math.random() * (b - a);

let activeCleanup = null; // undoes the gate's listeners and loop (used by abortGate if something breaks)

/* Failsafe: if the gate breaks, remove it and let the site through instead of leaving a stuck dark screen. */
export function abortGate() {
  activeCleanup?.();
  activeCleanup = null;
  document.querySelectorAll(".ak-gate").forEach((n) => n.remove());
  document.documentElement.classList.remove("ak-gate-flow", "ak-hide-site");
  document.documentElement.classList.add("ak-gate-done");
}

export function shouldShowGate() {
  if (document.documentElement.classList.contains("seen")) return false;
  try { if (sessionStorage.getItem(KEY)) return false; } catch (e) {}
  return true;
}

/* Place `count` blocks at random without overlaps, fully on screen, clear of the button zone. */
function layout(count, W, H, zone, sizes) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const size = sizes(i);
    const r = size * 0.6; // half size plus room for the small tilt
    for (let tries = 0; tries < 300; tries++) {
      const x = rand(r + 6, W - r - 6), y = rand(r + 6, H - r - 6);
      if (x + r > zone.l && x - r < zone.r && y + r > zone.t && y - r < zone.b) continue;
      if (out.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 4)) continue;
      out.push({ x, y, r, size });
      break;
    }
  }
  return out;
}

/** Show the gate; resolves once the button has been held for HOLD_MS and the gate has opened. */
export function runGate() {
  const html = document.documentElement;
  if (!shouldShowGate()) { html.classList.add("ak-gate-done"); return Promise.resolve(); }
  html.classList.add("ak-gate-flow"); // the loader that follows is shown on white
  html.classList.add("ak-hide-site"); // the covered page is not painted while the gate/loader/intro are on top (perf)
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  return new Promise((resolve) => {
    const W = innerWidth, H = innerHeight;
    const phone = W < 640;
    const gate = document.createElement("div");
    gate.className = "ak-gate";
    gate.innerHTML = `<div class="ak-gate__field" aria-hidden="true"></div>
      <div class="ak-gate__aura" aria-hidden="true"></div>
      <span class="ak-gate__burst" aria-hidden="true"></span>
      <span class="ak-gate__shadow" aria-hidden="true"></span>
      <div class="ak-gate__btn" role="button" tabindex="0">
        <span class="ak-gate__layer"><span class="ak-gate__t is-idle"></span><span class="ak-gate__t is-hold"></span></span>
        <span class="ak-gate__fill" aria-hidden="true"><span class="ak-gate__layer ak-gate__fill-in"><span class="ak-gate__t is-idle"></span><span class="ak-gate__t is-hold"></span></span></span>
        <span class="ak-gate__shine" aria-hidden="true"></span>
      </div>
      <span class="ak-gate__open" aria-hidden="true"></span>`;
    document.body.append(gate);
    const btn = gate.querySelector(".ak-gate__btn");
    const fill = gate.querySelector(".ak-gate__fill");
    const fillIn = gate.querySelector(".ak-gate__fill-in");
    const shadow = gate.querySelector(".ak-gate__shadow");
    const field = gate.querySelector(".ak-gate__field");
    const aura = gate.querySelector(".ak-gate__aura");
    const burst = gate.querySelector(".ak-gate__burst");
    const shine = gate.querySelector(".ak-gate__shine");
    const opener = gate.querySelector(".ak-gate__open");

    const setText = () => {
      const t = TEXT[getLang() === "en" ? "en" : "ru"];
      btn.querySelectorAll(".is-idle").forEach((n) => { n.textContent = t.open; });
      btn.querySelectorAll(".is-hold").forEach((n) => { n.textContent = t.hold; });
      btn.setAttribute("aria-label", t.label);
    };
    setText();
    onLang(() => { if (gate.isConnected) setText(); });

    /* ----- blocks: ~40% near (big, sharp), ~60% far (smaller, static blur, fainter) ----- */
    const BTN_MAX = phone ? 1.15 : 1.3; // how far the button grows while held
    const b = btn.getBoundingClientRect();
    const bcx = b.left + b.width / 2, bcy = b.top + b.height / 2;
    const pad = phone ? 22 : 56;
    const gx = (b.width * BTN_MAX * 1.08) / 2 + pad, gy = (b.height * BTN_MAX * 1.08) / 2 + pad; // incl. the final pulse
    const zone = { l: bcx - gx, r: bcx + gx, t: bcy - gy, b: bcy + gy };
    const count = phone ? 18 : 28;
    const isNear = (i) => i % 5 < 2;
    const sizes = (i) => (isNear(i) ? (phone ? rand(76, 92) : rand(108, 140)) : (phone ? rand(56, 70) : rand(72, 96)));
    const pick = gsap.utils.shuffle([...SYMBOLS, ...SYMBOLS]); // weighted mix: the main five come up most
    const blocks = layout(count, W, H, zone, sizes).map((p, i) => {
      const near = isNear(i);
      const text = pick[i % pick.length];
      const el = document.createElement("div");
      el.className = `ak-gate__blk ${near ? "is-near" : "is-far"}`;
      el.style.width = el.style.height = `${p.size.toFixed(0)}px`;
      const key = document.createElement("div");
      key.className = "ak-gate__key";
      key.style.transform = `rotate(${rand(-8, 8).toFixed(1)}deg)`; // static tilt on the inner element
      const glyph = document.createElement("span");
      const steady = i % 7 === 5, fast = i % 6 === 2;
      glyph.className = `ak-gate__glyph${steady ? "" : " is-blinking"}${i % 3 === 1 ? " is-dim" : ""}`;
      glyph.style.fontSize = `${(p.size * (text.replace(/ /g, "").length > 2 ? 0.28 : 0.34)).toFixed(1)}px`;
      // a terminal-cursor blink with its own pace: never in sync, never changed by the hold
      glyph.style.animationDuration = `${(fast ? rand(0.8, 1.1) : rand(1.2, 3)).toFixed(2)}s`;
      glyph.style.animationDelay = `${(-rand(0, 3)).toFixed(2)}s`;
      glyph.textContent = text;
      key.append(glyph);
      el.append(key);
      field.append(el);
      const dx = p.x - bcx, dy = p.y - bcy, dist = Math.hypot(dx, dy) || 1;
      return {
        el, near, size: p.size,
        hx: p.x - p.size / 2, hy: p.y - p.size / 2, // home (top-left), cached once
        ux: dx / dist, uy: dy / dist, dist,
        // its own fixed organic twist on the drift (no randomness per frame)
        ox: rand(-0.12, 0.12), oy: rand(-0.12, 0.12),
        // spring-damper body: heavier near blocks react slower, travel farther, overshoot a little
        w: near ? 7 : 10.5, z: near ? 0.62 : 0.78, m: near ? 1.6 : 1,
        reach: near ? 0.5 : 0.18,
        bobA: near ? 7 : 3, bobF: near ? 0.55 : 0.38, bobP: rand(0, Math.PI * 2),
        x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, op: 1,
      };
    });
    // far layer first in the DOM, so near blocks paint on top
    blocks.filter((k) => !k.near).forEach((k) => field.prepend(k.el));
    blocks.forEach((k) => { k.el.style.transform = `translate3d(${k.hx.toFixed(1)}px,${k.hy.toFixed(1)}px,0)`; });
    gsap.fromTo(blocks.map((k) => k.el.firstChild), { opacity: 0 }, { opacity: 1, duration: reduce ? 0.01 : 0.8, stagger: reduce ? 0 : 0.02, ease: "power1.out" });

    /* ----- the hold: the fill fills at a constant speed; everything else reads its progress ----- */
    // the fill is a window sliding in from the left while its content slides the other way: a left-to-right
    // reveal done with transforms only (no clip-path repaint per frame)
    gsap.set(fill, { xPercent: -100 });
    gsap.set(fillIn, { xPercent: 100 });
    const hold = gsap.timeline({ paused: true, onComplete: finish });
    hold.to(fill, { xPercent: 0, duration: HOLD, ease: "none" }, 0)
      .to(fillIn, { xPercent: 0, duration: HOLD, ease: "none" }, 0);

    const build = gsap.parseEase("power2.in"); // slow at first, stronger toward the end
    const bw = b.width;
    // the charging glow: a big soft orange circle behind the button (sized to stay soft on small screens)
    aura.style.setProperty("--d", `${Math.round(Math.min(bw * 1.6, W * 1.15))}px`);
    const canBuzz = typeof navigator.vibrate === "function" && matchMedia("(pointer: coarse)").matches;
    let buzz = 0;
    const st = { press: 1, glow: 1, hover: 0 };
    // mouse position for the magnetic blocks (mouse only; touch has no hover)
    const mouse = { x: 0, y: 0, on: false, w: 0 };
    const onMove = (e) => { if (e.pointerType !== "mouse") return; mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; };
    const onOut = (e) => { if (!e.relatedTarget) mouse.on = false; };
    if (!reduce) { window.addEventListener("pointermove", onMove, { passive: true }); document.addEventListener("mouseout", onOut); }
    let mode = "idle"; // idle | hold | release | done
    let release = null, pressTween = null;
    let floatW = 1;      // idle float weight: blends out while holding, back in afterwards
    let shock = -1;      // time (s) the shockwave started
    let last = 0;
    const prev = {}; // last written values (skip writes that would not change anything)

    /* One loop: button (scale, tension shake), glow, shine, and every block's physics. One transform per element. */
    const tick = (time) => {
      const dt = Math.min(0.033, Math.max(0, time - (last || time))); // real delta time, clamped
      last = time;
      const p = hold.progress();
      const z = build(p);
      // write only what changed (an idle gate then costs almost nothing per frame)
      if (!reduce) {
        // glow: charges with the hold; a soft hint of it while the mouse is over the button
        const o = Math.max(Math.pow(p, 0.8) * st.glow, st.hover * 0.45).toFixed(3), sc = (0.55 + 0.75 * z + 0.12 * st.hover).toFixed(3);
        if (o !== prev.o) { aura.style.setProperty("--o", o); prev.o = o; }
        if (sc !== prev.s) { aura.style.setProperty("--s", sc); prev.s = sc; }
      }
      const sx = (p * bw - 16).toFixed(1), so = p > 0.004 && p < 0.996 && mode !== "done" ? "1" : "0";
      if (sx !== prev.sx) { shine.style.transform = `translate3d(${sx}px,0,0)`; prev.sx = sx; }
      if (so !== prev.so) { shine.style.opacity = so; prev.so = so; }

      if (mode === "hold" && !reduce) {
        // tension on the button only: in the last 40% a tiny tremble that grows toward the end (max ~1.5px / 0.3deg)
        const k = Math.max(0, (p - 0.6) / 0.4);
        const n1 = Math.sin(time * 61) * 0.6 + Math.sin(time * 97) * 0.4;
        const n2 = Math.sin(time * 71 + 1.3) * 0.6 + Math.sin(time * 113) * 0.4;
        gsap.set(btn, {
          scale: st.press * (1 + (BTN_MAX - 1) * z),
          x: n1 * 1.5 * k, y: n2 * 1.1 * k, rotation: Math.sin(time * 83) * 0.3 * k,
        });
      }
      // the shadow lives on its own layer and follows the button (so the soft shadow is never repainted)
      if (btn.style.transform !== prev.bt) { shadow.style.transform = prev.bt = btn.style.transform; }
      if (reduce) return;

      // idle float blends out while holding and back in after a release (exponential smoothing, no jumps)
      floatW += ((mode === "idle" || mode === "release" ? 1 : 0) - floatW) * (1 - Math.exp(-4 * dt));
      mouse.w += ((mouse.on && mode !== "hold" && mode !== "done" ? 1 : 0) - mouse.w) * (1 - Math.exp(-6 * dt));
      // synchronized gentle breathing after ~70%
      const bk = mode === "hold" ? Math.max(0, (p - 0.7) / 0.3) : 0;
      const breathe = 1 + 0.03 * bk * (0.5 - 0.5 * Math.cos(time * Math.PI * 2 * 1.1));
      const drift = mode === "hold" ? z : 0; // released: the target is home, the spring brings them back
      const steps = dt > 1 / 90 ? 2 : 1, h = dt / steps;
      for (const k of blocks) {
        if (shock >= 0) {
          // free flight after the shockwave: damped, turning slightly with the motion, fading out over ~0.5s
          for (let s = 0; s < steps; s++) {
            const damp = Math.exp(-2.6 * h);
            k.vx *= damp; k.vy *= damp; k.vr *= damp;
            k.x += k.vx * h; k.y += k.vy * h; k.rot += k.vr * h;
          }
          k.op = Math.max(0, 1 - (time - shock) / 0.5);
        } else {
          const reach = k.dist * k.reach * drift;
          let tx = (k.ux + k.oy * 0.5) * reach + k.ox * reach * 0.3;
          let ty = (k.uy - k.ox * 0.5) * reach + k.oy * reach * 0.3;
          // magnetic: blocks near the mouse lean toward it (through the same spring, so the pull has weight);
          // it fades out while the button is held, like the idle float
          if (mouse.w > 0.001) {
            const mx = mouse.x - (k.hx + k.size / 2), my = mouse.y - (k.hy + k.size / 2);
            const d = Math.hypot(mx, my), R = k.near ? 260 : 200;
            if (d < R && d > 1) {
              const f = Math.min(Math.pow(1 - d / R, 2) * (k.near ? 34 : 18), d * 0.4) * mouse.w;
              tx += (mx / d) * f; ty += (my / d) * f;
            }
          }
          for (let s = 0; s < steps; s++) {
            // spring-damper: a = w^2 (target - x) - 2 z w v   (semi-implicit Euler)
            k.vx += (k.w * k.w * (tx - k.x) - 2 * k.z * k.w * k.vx) * h;
            k.vy += (k.w * k.w * (ty - k.y) - 2 * k.z * k.w * k.vy) * h;
            k.x += k.vx * h; k.y += k.vy * h;
          }
        }
        const bob = floatW * k.bobA;
        const fx = Math.sin(time * k.bobF + k.bobP) * bob * 0.6;
        const fy = Math.sin(time * k.bobF * 1.3 + k.bobP) * bob;
        const sc = shock >= 0 ? 1 : breathe;
        k.el.style.transform = `translate3d(${(k.hx + k.x + fx).toFixed(1)}px,${(k.hy + k.y + fy).toFixed(1)}px,0) rotate(${k.rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        if (shock >= 0) k.el.style.opacity = k.op.toFixed(3);
      }
    };
    gsap.ticker.add(tick);

    let holding = false, done = false;
    const start = () => {
      if (done || holding) return;
      holding = true;
      btn.classList.add("is-holding");
      if (!reduce) {
        // press in (~0.96 over 120ms), then let the growth take over
        release?.kill();
        const cur = gsap.getProperty(btn, "scale");
        st.press = cur / (1 + (BTN_MAX - 1) * build(hold.progress()));
        st.glow = 1;
        pressTween?.kill();
        pressTween = gsap.timeline()
          .to(st, { press: 0.96, duration: 0.12, ease: "power2.out" })
          .to(st, { press: 1, duration: 0.3, ease: "power2.inOut" });
        mode = "hold";
      }
      if (canBuzz) { navigator.vibrate(10); buzz = setInterval(() => navigator.vibrate(10), 400); }
      hold.timeScale(1).play();
    };
    const stop = () => {
      if (done || !holding) return;
      holding = false;
      btn.classList.remove("is-holding");
      if (canBuzz) { clearInterval(buzz); navigator.vibrate(0); }
      hold.timeScale(HOLD / 0.5).reverse(); // the fill drains in about half a second
      if (!reduce) {
        // spring back: a little past 1 (~0.97), then settle (~0.6s); the glow fades out; blocks spring home
        mode = "release";
        pressTween?.kill();
        release = gsap.timeline({ onComplete: () => { if (mode === "release") mode = "idle"; } })
          .to(btn, { scale: 0.97, x: 0, y: 0, rotation: 0, duration: 0.28, ease: "power2.out" })
          .to(btn, { scale: hovered ? HOVER_SCALE : 1, duration: 0.32, ease: "power2.inOut" });
        gsap.to(st, { glow: 0, duration: 0.35, ease: "power1.out" });
      }
    };

    /* ----- input: pointer (mouse + touch) and keyboard (Space / Enter) ----- */
    const isKey = (e) => e.key === " " || e.key === "Enter";
    const onDown = (e) => { if (e.button > 0) return; e.preventDefault(); start(); };
    const onKeyDown = (e) => { if (!isKey(e)) return; e.preventDefault(); if (!e.repeat) start(); };
    const onKeyUp = (e) => { if (isKey(e)) { e.preventDefault(); stop(); } };
    const noMenu = (e) => e.preventDefault();
    // hover (mouse): the button lifts a little, its border brightens and a soft glow appears
    const HOVER_SCALE = 1.04;
    let hovered = false;
    const onEnter = (e) => {
      if (e.pointerType !== "mouse" || done || reduce) return;
      hovered = true;
      btn.classList.add("is-hover");
      gsap.to(st, { hover: 1, duration: 0.35, ease: "power2.out", overwrite: "auto" });
      if (!holding && mode !== "release") gsap.to(btn, { scale: HOVER_SCALE, duration: 0.35, ease: "power2.out", overwrite: "auto" });
    };
    const onLeave = (e) => {
      if (e.pointerType !== "mouse" || !hovered) return;
      hovered = false;
      btn.classList.remove("is-hover");
      gsap.to(st, { hover: 0, duration: 0.35, ease: "power2.out", overwrite: "auto" });
      if (!holding && !done && mode !== "release") gsap.to(btn, { scale: 1, duration: 0.35, ease: "power2.out", overwrite: "auto" });
    };
    btn.addEventListener("pointerenter", onEnter);
    btn.addEventListener("pointerleave", onLeave);
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
    activeCleanup = () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("wheel", block, opts);
      window.removeEventListener("touchmove", block, opts);
      window.removeEventListener("keydown", blockKeys, true);
      window.removeEventListener("blur", stop);
      if (canBuzz) { clearInterval(buzz); navigator.vibrate(0); }
      gsap.ticker.remove(tick);
    };
    btn.focus({ preventScroll: true });

    function finish() {
      try { finishGate(); } catch (e) { console.warn("gate:", e); abortGate(); resolve(); }
    }
    function finishGate() {
      if (done) return;
      done = true;
      mode = "done";
      window.removeEventListener("blur", stop);
      if (canBuzz) { clearInterval(buzz); navigator.vibrate(40); }
      const diag = Math.hypot(Math.max(bcx, W - bcx), Math.max(bcy, H - bcy)) * 2; // circle that covers the screen
      const out = gsap.timeline({
        onComplete() {
          activeCleanup?.();
          activeCleanup = null;
          html.classList.add("ak-gate-done");
          gate.remove(); // the loader underneath is already white: nothing changes on screen
          resolve();
        },
      });
      if (!reduce) {
        // ONE shockwave: a radial impulse from the button, stronger close by, weaker for heavy blocks
        shock = gsap.ticker.time;
        const far = Math.hypot(W, H);
        for (const k of blocks) {
          const j = 1500 * (0.35 + 0.65 * Math.max(0, 1 - k.dist / far)) / k.m;
          k.vx += k.ux * j; k.vy += k.uy * j;
          k.vr = Math.sign(k.ux || 1) * (k.near ? 40 : 60);
        }
        // the button pulses, the soft orange ring races out, the glow fades
        pressTween?.kill();
        out.to(btn, { scale: BTN_MAX * 1.08, x: 0, y: 0, rotation: 0, duration: 0.14, ease: "power2.out" }, 0)
          .to(btn, { scale: BTN_MAX, duration: 0.22, ease: "power2.inOut" }, 0.14)
          .fromTo(burst, { scale: BTN_MAX, opacity: 0.9 }, {
            scale: Math.max(W / bw, H / b.height) * 1.15, opacity: 0, duration: 0.6, ease: "power1.out",
          }, 0)
          .to(st, { glow: 0, duration: 0.4, ease: "power1.in" }, 0.1)
        // ...and a white circle opens from the button into the white intro (~0.5s)
          .fromTo(opener, { scale: 0 }, { scale: diag / 40, duration: 0.5, ease: "power2.in" }, 0.12);
      } else {
        // reduced motion: a plain crossfade to white
        out.fromTo(opener, { scale: diag / 40, opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.inOut" }, 0);
      }
    }
  });
}

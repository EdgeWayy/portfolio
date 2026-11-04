/* What the hold on the star does to the portrait. js/secret.js owns the one progress value; this shows it.
   Where it shows:
     - the real portrait, when it is clearly on screen;
     - otherwise (scrolled away, or a page without a portrait) a fixed copy in the middle of the screen over a dim backdrop.
       With a running WebGL portrait the same canvas moves into the copy for the duration of the hold.
   How it shows:
     - WebGL: the ACID morph itself (hero-gl.js), driven by the progress;
     - no WebGL (reduced motion, weak phones): a crossfade to the still skull. */
import { isAcid } from "./theme.js";
import { drawSkullMosaic } from "./skull.js";

const smooth = (p) => p * p * (3 - 2 * p);

/** The still skull in a figure, built once. */
export async function ensureSkullCanvas(figure) {
  let cv = figure.querySelector(".hero__skull");
  if (cv) return cv;
  cv = document.createElement("canvas");
  cv.className = "hero__skull";
  cv.setAttribute("aria-hidden", "true");
  await drawSkullMosaic(cv);
  figure.querySelector(".hero__skull")?.remove();
  figure.append(cv);
  return cv;
}

function clearlyVisible(figure) {
  if (!figure || document.body.classList.contains("menu-open")) return false;
  const r = figure.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  const nav = document.getElementById("nav")?.offsetHeight || 0;
  const shown = Math.min(r.bottom, innerHeight) - Math.max(r.top, nav);
  return shown / r.height >= 0.6;
}

export function initHoldMorph({ getGl, canUseGl, toneUrl, coarse, reduce }) {
  const root = document.documentElement;
  let stage = null, stageFig = null, stageGl = null, home = null; // home: where the canvas came from
  let skull = null, img = null, target = null, active = false, lastP = 0;

  const buildStage = () => {
    stage = document.createElement("div");
    stage.className = "hold-stage";
    stage.setAttribute("aria-hidden", "true");
    stageFig = document.createElement("div");
    stageFig.className = "hold-stage__fig";
    stage.append(stageFig);
    document.body.append(stage);
  };

  /* A page without the portrait's WebGL: its own small copy, with the photo mosaic until (or unless) WebGL is up. */
  const fillStage = async () => {
    const fig = stageFig; // the hold can end while this is still loading: then the result is thrown away
    img = document.createElement("img");
    img.className = "hero__img";
    img.alt = "";
    img.src = new URL("img/portrait-dots-640.webp", document.baseURI).href;
    fig.append(img);
    if (!canUseGl()) {
      const cv = await ensureSkullCanvas(fig);
      if (fig !== stageFig) return;
      skull = cv;
      skull.style.transition = "none";
      show(lastP);
      return;
    }
    const cv = document.createElement("canvas");
    cv.className = "hero__gl";
    cv.setAttribute("aria-hidden", "true");
    fig.append(cv);
    const { initHeroGL } = await import("./hero-gl.js");
    if (fig !== stageFig) return;
    const gl = await initHeroGL(fig, { toneUrl, coarse, interactive: false });
    if (fig !== stageFig) { gl.dispose(); return; }
    gl.skipIntro();
    if (isAcid()) await gl.setAcid(true, 0);
    gl.setForced(true);
    stageGl = gl;
    fig.classList.add("has-gl");
    if (active) show(lastP);
  };

  const show = (p) => {
    const acid = isAcid();
    const gl = stageGl || (target === "real" || home ? getGl() : null);
    const morph = acid ? 1 : smooth(p);
    if (gl) gl.setHold(morph, reduce ? 0 : p, acid || reduce ? 0 : p);
    else if (skull) { skull.style.opacity = String(acid ? 1 : p); if (img) img.style.opacity = String(acid ? 0 : 1 - p); }
    // the escalation that is not in the shader: a tremble that grows, and a lime glow
    const el = target === "real" ? document.getElementById("portrait") : stageFig;
    if (el) {
      el.style.setProperty("--hold", p.toFixed(3));
      if (!reduce) {
        const k = Math.max(0, p - 0.25) / 0.75, t = performance.now() / 1000;
        el.style.translate = p > 0.01 ? `${(Math.sin(t * 61) * 2.2 * k).toFixed(2)}px ${(Math.sin(t * 79 + 1.2) * 1.7 * k).toFixed(2)}px` : "";
      }
    }
    if (stage) stage.style.opacity = String(Math.min(1, p * 6));
  };

  return {
    /** A hold starts from nothing: decide where it shows. A hold that continues a rewind keeps the place it has. */
    begin() {
      if (active) return;
      active = true;
      const figure = document.getElementById("portrait");
      const gl = getGl();
      gl?.setBlobHidden(true);
      if (clearlyVisible(figure)) {
        target = "real";
        if (!gl) {
          ensureSkullCanvas(figure).then((cv) => {
            if (!active || isAcid()) return;
            skull = cv;
            img = figure.querySelector(".hero__img");
            skull.style.transition = "none";
            if (img) img.style.transition = "none";
            show(lastP);
          }).catch((e) => console.warn("skull:", e));
        }
        return;
      }
      target = "stage";
      buildStage();
      if (gl && figure) {
        const cv = figure.querySelector(".hero__gl");
        home = { parent: cv.parentNode, next: cv.nextSibling, cv };
        stageFig.append(cv);
        gl.setForced(true);
      } else {
        fillStage().catch((e) => console.warn("hold:", e));
      }
    },
    set(p) {
      lastP = p;
      root.style.setProperty("--hold", p.toFixed(3));
      if (active) show(p);
    },
    /** The progress is back at zero: everything returns to how it was. */
    end() {
      if (!active) return;
      active = false;
      lastP = 0;
      root.style.removeProperty("--hold");
      const figure = document.getElementById("portrait");
      const gl = getGl();
      if (gl) {
        gl.setHold(isAcid() ? 1 : 0, 0, 0);
        gl.setBlobHidden(false);
      }
      if (figure) { figure.style.removeProperty("--hold"); figure.style.translate = ""; }
      if (home) {
        home.parent.insertBefore(home.cv, home.next);
        home = null;
        gl?.setForced(false);
      }
      if (target === "real" && skull) {
        skull.style.opacity = ""; skull.style.transition = "";
        if (img) { img.style.opacity = ""; img.style.transition = ""; }
      }
      stageGl?.dispose();
      stageGl = null;
      stage?.remove();
      stage = stageFig = null;
      skull = img = null;
      target = null;
    },
  };
}

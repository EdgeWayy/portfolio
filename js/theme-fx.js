/* What each theme runs on the page: leaves (autumn) or the slime puddle (acid), and the "ACID ×" button.
   The puddle is only started when js/acid-intro.js says so: the interface comes first. */
import { getLang, onLang } from "./i18n.js";
import { isAcid, onTheme, setTheme, storeTheme } from "./theme.js";
import { pourSlime, coverSlime } from "./slime.js";
import { startLeaves, stopLeaves } from "./leaves.js";

export function initThemeFx({ reduce, weak, phone }) {
  const root = document.documentElement;
  let started = false, puddle = null, layout = null, exiting = false, pourMode = "full";

  /* Black text only where the slime has actually arrived: lime on lime would vanish, and black on black too. */
  let flips = [];
  const clearFlips = () => {
    document.querySelectorAll(".on-slime").forEach((n) => n.classList.remove("on-slime"));
    flips = [];
    root.classList.remove("acid-nav", "acid-band");
  };
  const measureFlips = () => {
    const home = root.dataset.page === "index";
    // layout positions: GSAP may be moving these right now, the slime must not chase that
    const mid = (el) => {
      let y = el.offsetHeight / 2;
      for (let e = el; e; e = e.offsetParent) y += e.offsetTop;
      return y;
    };
    const nav = document.getElementById("nav");
    flips = [{ y: (nav?.offsetHeight || 64) * 0.6, cls: "acid-nav" }];
    if (!home) return;
    const desktop = innerWidth >= 960;
    for (const s of [".hero__meta", ".hero__meta--r", ".hero__name", ...(desktop ? [".hero__line", ".hero__lead"] : [])]) {
      const el = document.querySelector(s);
      if (el) flips.push({ el, y: mid(el) });
    }
  };
  const onEdge = (y) => {
    for (const f of flips) {
      if (f.done || y < f.y) continue;
      f.done = true;
      if (f.cls) root.classList.add(f.cls); else f.el.classList.add("on-slime");
    }
  };

  const apply = () => {
    if (isAcid()) {
      stopLeaves();
      if (puddle) return;
      measureFlips();
      const navH = document.getElementById("nav")?.offsetHeight || 64;
      const home = root.dataset.page === "index";
      const name = document.querySelector(".hero__name"), lead = document.querySelector(".hero__lead");
      // Main page: about half of the screen or more, always just past the text set in black on the lime
      // (on phones that is the name: the blob covers the edge there). Other pages: a short rim, so nothing covers their text.
      const band = () => {
        if (!home || !name || !lead) return navH + 26;
        const hero = name.closest(".hero");
        const last = innerWidth >= 960 ? lead : name;
        // layout position, summed up to the hero: GSAP moves these blocks while they animate, the edge must not follow
        let y = last.offsetHeight;
        for (let e = last; e && e !== hero; e = e.offsetParent) y += e.offsetTop;
        // 50: the wave and the arches between drips rise up to that far above the edge, and black text must stay on lime
        return Math.max(innerHeight * 0.5, y + 50);
      };
      const dripMax = () => (home ? innerHeight * 0.27 : Math.max(40, innerHeight * 0.2 - navH - 26));
      puddle = pourSlime({
        band, dripMax, onEdge,
        mode: reduce ? "still" : pourMode,
        onSettled: () => { root.classList.add("acid-nav", "acid-band"); },
      });
      if (home && name && lead) {
        layout = new ResizeObserver(() => puddle?.setBand());
        layout.observe(name);
        layout.observe(lead);
      }
    } else {
      layout?.disconnect();
      layout = null;
      puddle?.stop();
      puddle = null;
      clearFlips();
      startLeaves({ reduce, weak, phone });
    }
  };

  /* The way back to Autumn: visible only in ACID (css/acid.css), on every page, also over the gate. */
  const exit = document.createElement("button");
  exit.type = "button";
  exit.className = "acid-exit";
  exit.textContent = "ACID ×";
  const label = () => exit.setAttribute("aria-label", getLang() === "en" ? "Turn off the ACID theme" : "Выключить тему ACID");
  label();
  exit.addEventListener("pointerenter", label);
  exit.addEventListener("focus", label);
  exit.addEventListener("click", async () => {
    if (exiting) return;
    exiting = true;
    const hadFocus = document.activeElement === exit;
    await coverSlime({
      reduce,
      during() {
        // the gate was built for ACID, so it starts over in Autumn
        if (document.querySelector(".ak-gate")) { storeTheme("autumn"); location.reload(); return; }
        setTheme("autumn");
      },
    });
    exiting = false;
    if (hadFocus) document.querySelector(".nav__logo")?.focus({ preventScroll: true });
  });
  document.body.append(exit);

  onTheme(() => { if (started) apply(); });
  onLang(() => puddle?.setBand());

  return {
    /** mode: how the puddle arrives. "full" or "short" (see POUR in js/slime.js). */
    start(mode = "full") {
      if (started) return;
      started = true;
      pourMode = mode;
      apply();
    },
  };
}

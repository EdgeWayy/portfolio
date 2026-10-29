/* Nav, menu, quote form, clock, page wipe, easter egg. */
import { t, onLang } from "./i18n.js";
import { scrollToTarget, lenis } from "./motion.js";

const TG = "KrieWoo";

/* ---------- nav: solid after scroll, hides on scroll down ---------- */
function nav() {
  const navEl = document.getElementById("nav");
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    navEl.classList.toggle("is-solid", y > 30);
    const menuOpen = document.body.classList.contains("menu-open");
    navEl.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 2);
    if (y < lastY - 2) navEl.classList.remove("is-hidden");
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // active section dot
  const links = [...document.querySelectorAll(".nav__links a")];
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${en.target.id}`));
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((a) => { const s = document.querySelector(a.getAttribute("href")); if (s) io.observe(s); });
}

/* ---------- mobile menu ---------- */
function menu() {
  const burger = document.querySelector(".burger");
  const panel = document.getElementById("menu");
  const set = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    if (lenis) open ? lenis.stop() : lenis.start();
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) panel.querySelector("a")?.focus();
  };
  burger.addEventListener("click", () => set(burger.getAttribute("aria-expanded") !== "true"));
  panel.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { set(false); burger.focus(); } });
  matchMedia("(min-width: 960px)").addEventListener("change", (e) => e.matches && set(false));
}

/* ---------- in-page anchors use smooth scroll ---------- */
function anchors() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : document.querySelector(id);
    if (target == null) return;
    e.preventDefault();
    // menu closes first (unlocks scroll), then we glide
    requestAnimationFrame(() => scrollToTarget(target));
    if (id !== "#top") history.replaceState(null, "", id);
  });
}

/* ---------- Tashkent clock in the hero ---------- */
function clock() {
  const node = document.getElementById("clock");
  const fmt = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" });
  const tick = () => { node.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 15000);
}

/* ---------- quote form -> Telegram with a prefilled message ---------- */
function quote() {
  const form = document.getElementById("quote");
  const note = document.getElementById("q-note");
  const build = () => {
    const need = [...form.querySelectorAll('[data-name="need"] input:checked')].map((i) => t("need")[i.value]);
    const budget = form.querySelector('[data-name="budget"] input:checked');
    const name = form.querySelector("#q-name").value.trim();
    const msg = form.querySelector("#q-msg").value.trim();
    const lines = [t("msgHello")];
    if (name) lines.push(`${t("msgFrom")}: ${name}`);
    if (need.length) lines.push(`${t("msgNeed")}: ${need.join(", ")}`);
    if (budget) lines.push(`${t("msgBudget")}: ${t("budget")[budget.value]}`);
    lines.push(msg ? `${t("msgTask")}: ${msg}` : t("msgEmpty"));
    return lines.join("\n");
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = `https://t.me/${TG}?text=${encodeURIComponent(build())}`;
    window.open(url, "_blank", "noopener");
  });
  document.getElementById("q-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(build());
      note.textContent = t("copied");
    } catch {
      note.textContent = t("copyFail");
    }
  });
}

/* ---------- page wipe when opening a demo ---------- */
function wipe() {
  const w = document.getElementById("wipe");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-demo]");
    if (!a || reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    w.classList.remove("is-leave");
    w.classList.add("is-in");
    setTimeout(() => { location.href = a.href; }, 560);
  });
  // back/forward cache: never come back to a covered page
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) { w.className = "wipe"; }
  });
}

/* ---------- easter egg: type "usta" (or the Konami code) ---------- */
function egg() {
  const words = ["usta", "уста"];
  const konami = "ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a";
  let buf = "", keys = [];
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    buf = (buf + (e.key.length === 1 ? e.key.toLowerCase() : "")).slice(-6);
    keys = [...keys, e.key].slice(-10);
    if (words.some((w) => buf.endsWith(w)) || keys.join(",") === konami) { buf = ""; keys = []; rain(); }
  });
  function rain() {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    toast(t("eggOn"));
    if (reduce) return;
    const colors = ["#FF5A1F", "#1B3BD1", "#121212"];
    for (let i = 0; i < 46; i++) {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("viewBox", "0 0 48 48");
      s.setAttribute("class", "egg-star");
      s.innerHTML = `<path fill="${colors[i % 3]}" d="M24 2l5.2 9.4 10.4-3-3 10.4L46 24l-9.4 5.2 3 10.4-10.4-3L24 46l-5.2-9.4-10.4 3 3-10.4L2 24l9.4-5.2-3-10.4 10.4 3z"/>`;
      const size = 14 + Math.random() * 30;
      s.style.left = `${Math.random() * 100}vw`;
      s.style.width = s.style.height = `${size}px`;
      document.body.append(s);
      s.animate([
        { transform: "translateY(0) rotate(0deg)" },
        { transform: `translateY(${innerHeight + 80}px) rotate(${(Math.random() - 0.5) * 720}deg)` },
      ], { duration: 1800 + Math.random() * 1600, delay: Math.random() * 600, easing: "cubic-bezier(.3,.1,.6,1)", fill: "forwards" })
        .finished.then(() => s.remove());
    }
  }
}

let toastTimer = 0;
export function toast(text) {
  let node = document.querySelector(".toast");
  if (!node) { node = document.createElement("div"); node.className = "toast"; node.setAttribute("role", "status"); document.body.append(node); }
  node.textContent = text;
  requestAnimationFrame(() => node.classList.add("is-on"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("is-on"), 2600);
}

/* ---------- touch devices get a different hint ---------- */
function hint() {
  const h = document.querySelector(".hero__hint");
  const coarse = matchMedia("(pointer: coarse)").matches;
  const set = () => { if (coarse) h.textContent = t("hintTouch"); };
  set();
  onLang(set);
  document.getElementById("portrait").addEventListener("pointerdown", () => h.classList.add("is-off"), { once: true });
  document.getElementById("portrait").addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") h.classList.add("is-off"); }, { once: true });
}

export function initUI() {
  nav();
  menu();
  anchors();
  clock();
  quote();
  wipe();
  egg();
  hint();
  console.log("%c✦ usta %c Привет! Нравится код? Напишите: https://t.me/KrieWoo", "background:#FF5A1F;color:#121212;font-weight:700;padding:4px 8px;border-radius:4px", "color:#1B3BD1");
}

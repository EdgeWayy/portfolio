/* Builds the data-driven sections once, then swaps texts on language change. */
import { projects } from "./data/projects.js";
import { services } from "./data/services.js";
import { faq } from "./data/faq.js";
import { getLang, t, onLang } from "./i18n.js";

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

// [node, getter] pairs updated on every language switch
const bindings = [];
const bind = (node, get, attr) => { bindings.push([node, get, attr]); return node; };
const L = (obj) => () => obj[getLang()] ?? obj.ru;

function applyTexts() {
  for (const [node, get, attr] of bindings) {
    const v = get();
    if (attr) node.setAttribute(attr, v); else node.textContent = v;
  }
}

const ICONS = {
  site: '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="46" height="36" rx="3"/><path d="M3 16h46"/><path fill="currentColor" stroke="none" d="M26 21l1.9 3.4 3.8-1.1-1.1 3.8L34 29l-3.4 1.9 1.1 3.8-3.8-1.1L26 37l-1.9-3.4-3.8 1.1 1.1-3.8L18 29l3.4-1.9-1.1-3.8 3.8 1.1z"/></svg>',
  shop: '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 17h36l-3 29H11z"/><path d="M18 17v-3a8 8 0 0 1 16 0v3"/><path fill="currentColor" stroke="none" d="M26 24l1.7 3 3.3-1-1 3.3 3 1.7-3 1.7 1 3.3-3.3-1-1.7 3-1.7-3-3.3 1 1-3.3-3-1.7 3-1.7-1-3.3 3.3 1z"/></svg>',
  admin: '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 14h40M6 26h40M6 38h40"/><circle cx="16" cy="14" r="4" fill="currentColor"/><circle cx="34" cy="26" r="4" fill="currentColor"/><rect x="20" y="34" width="8" height="8" transform="rotate(45 24 38)" fill="currentColor"/></svg>',
  pay: '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="44" height="30" rx="3"/><path d="M4 19h44"/><path d="M11 32h12"/><path fill="currentColor" stroke="none" d="M39 26l1.4 2.5 2.7-.8-.8 2.7L45 32l-2.5 1.4.8 2.7-2.7-.8L39 38l-1.4-2.5-2.7.8.8-2.7L33 32l2.5-1.4-.8-2.7 2.7.8z"/></svg>',
  bot: '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="15" width="34" height="26" rx="6"/><path d="M26 15V8"/><circle cx="26" cy="7" r="2" fill="currentColor"/><circle cx="19" cy="27" r="3" fill="currentColor"/><circle cx="33" cy="27" r="3" fill="currentColor"/><path d="M20 35h12"/><path d="M5 25v8M47 25v8"/></svg>',
  book: '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="10" width="42" height="36" rx="3"/><path d="M5 19h42M16 5v9M36 5v9"/><path d="M17 32l6 6 12-12"/></svg>',
  qr: '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="16" height="16"/><rect x="30" y="6" width="16" height="16"/><rect x="6" y="30" width="16" height="16"/><rect x="11" y="11" width="6" height="6" fill="currentColor"/><rect x="35" y="11" width="6" height="6" fill="currentColor"/><rect x="11" y="35" width="6" height="6" fill="currentColor"/><path d="M30 30h6v6h-6zM40 40h6v6h-6zM40 30h6M30 40v6"/></svg>',
  speed: '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 38a18 18 0 1 1 36 0"/><path d="M26 38l9-13"/><circle cx="26" cy="38" r="3" fill="currentColor"/><path d="M14 30l-3-2M38 30l3-2M26 20v-4"/></svg>',
  seo: '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="2"><circle cx="22" cy="22" r="14"/><path d="M32 32l13 13"/><path d="M22 13c-4 0-7 3-7 7 0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z"/><circle cx="22" cy="20" r="2" fill="currentColor"/></svg>',
  support: '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="8" height="12" rx="2"/><rect x="38" y="28" width="8" height="12" rx="2"/><path d="M42 40c0 4-4 6-10 6h-4"/></svg>',
};

function renderCases() {
  const root = document.getElementById("cases");
  projects.forEach((p, i) => {
    const art = el("article", `case case--${p.accent}`);
    art.style.setProperty("--i", i);
    art.setAttribute("aria-labelledby", `case-${p.slug}`);

    const head = el("div", "case__head");
    head.append(el("span", "case__idx", `${String(i + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}`));
    head.append(bind(el("span", "case__kind"), L(p.kind)));
    art.append(head);

    const body = el("div", "case__body");
    const title = el("h3", "case__title", p.title);
    title.id = `case-${p.slug}`;
    body.append(title);
    const dl = el("dl", "case__dl");
    for (const key of ["problem", "solution", "result"]) {
      const row = el("div");
      row.append(bind(el("dt"), () => t(key === "problem" ? "task" : key)));
      row.append(bind(el("dd"), L(p[key])));
      dl.append(row);
    }
    body.append(dl);
    const tags = el("ul", "case__tags");
    tags.setAttribute("aria-label", "Tech");
    bind(tags, () => t("tech"), "aria-label");
    p.tech.forEach((x) => tags.append(el("li", "", x)));
    body.append(tags);
    if (p.note) body.append(bind(el("p", "case__note"), L(p.note)));
    const cta = el("div", "case__cta");
    const a = el("a", "btn btn--lg btn--case magnetic");
    a.href = p.url;
    a.dataset.demo = "";
    a.dataset.cursor = "Open";
    a.append(bind(el("span"), () => t("open")));
    a.insertAdjacentHTML("beforeend", '<svg class="btn__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>');
    cta.append(a);
    body.append(cta);
    art.append(body);

    const vis = el("a", "case__visual");
    vis.href = p.url;
    vis.dataset.demo = "";
    vis.dataset.cursor = "Open";
    vis.tabIndex = -1;
    vis.setAttribute("aria-hidden", "true");
    vis.innerHTML = `
      <div class="browser">
        <div class="browser__bar"><i></i><i></i><i></i><span>${p.url.replace("/index.html", "/")}</span></div>
        <img src="img/work/${p.slug}-720.webp" srcset="img/work/${p.slug}-720.webp 720w, img/work/${p.slug}-1200.webp 1200w"
          sizes="(max-width: 960px) 92vw, 52vw" width="1200" height="750" loading="lazy" decoding="async" alt="">
      </div>
      <div class="phone"><img src="img/work/${p.slug}-m.webp" width="360" height="779" loading="lazy" decoding="async" alt=""></div>`;
    art.append(vis);
    art.append(el("div", "case__shade"));
    root.append(art);
  });
}

function renderServices() {
  const root = document.getElementById("svc");
  for (const s of services) {
    const item = el("article", "svc__item");
    const top = el("div", "svc__top");
    top.append(el("span", "svc__icon", ICONS[s.icon]));
    top.append(bind(el("h3", "svc__title"), L(s.title)));
    item.append(top);
    item.append(bind(el("p", "svc__text"), L(s.text)));
    const price = el("p", "svc__price");
    price.append(bind(el("b"), L(s.price)));
    price.append(bind(el("span", "mono"), L(s.time)));
    item.append(price);
    root.append(item);
  }
}

function renderFaq() {
  const root = document.getElementById("faq-list");
  faq.forEach((f, i) => {
    const d = el("details", "qa");
    if (i === 0) d.open = true;
    const s = el("summary");
    s.append(bind(el("span"), L(f.q)));
    s.append(el("span", "qa__icon"));
    s.lastChild.setAttribute("aria-hidden", "true");
    d.append(s);
    const a = el("div", "qa__a");
    a.append(bind(el("p"), L(f.a)));
    d.append(a);
    root.append(d);
  });
}

export function renderAll() {
  renderCases();
  renderServices();
  renderFaq();
  applyTexts();
  onLang(applyTexts);
}

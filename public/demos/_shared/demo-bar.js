/* Demo bar: injected into every demo page by tools/copy-demos.mjs.
   Shadow DOM keeps the demo's own CSS from touching it (and the other way round). */
(() => {
  const me = document.currentScript;
  if (!me || window.__akbarDemoBar) return;
  window.__akbarDemoBar = true;

  const home = me.dataset.home || "../../";
  const name = me.dataset.name || "Demo";
  const note = me.dataset.note || "";
  let lang = "ru";
  try { lang = localStorage.getItem("akbar-lang") || (navigator.language || "ru").slice(0, 2); } catch (e) {}
  const en = lang === "en";
  const T = {
    back: en ? "Akbar's portfolio" : "Портфолио Акбара",
    demo: en ? "Demo version" : "Демо-версия",
    hint: en ? `${name} is a demo: mock data, no real orders or payments.` : `${name}: демо с тестовыми данными, без реальных заказов и оплат.`,
    hide: en ? "Hide bar" : "Скрыть панель",
    show: en ? "Show demo bar" : "Показать панель демо",
  };

  const host = document.createElement("div");
  host.setAttribute("data-akbar-demo", "");
  Object.assign(host.style, { position: "fixed", left: "12px", bottom: "12px", zIndex: "2147483000" });
  const root = host.attachShadow({ mode: "open" });
  // Constructable stylesheet: works under strict CSP (style-src 'self'), unlike an inline <style>.
  const css = `
    :host{all:initial}
    *{box-sizing:border-box;margin:0}
    .bar{display:flex;align-items:center;gap:2px;font:600 13px/1 "Onest",system-ui,-apple-system,"Segoe UI",sans-serif;
      background:#121212;color:#F3EEE4;border-radius:999px;padding:4px;box-shadow:0 6px 24px rgba(0,0,0,.28);
      transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .35s}
    a,button{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:9px 12px;min-height:20px}
    a:hover{background:#1B3BD1} a:focus-visible,button:focus-visible{outline:2px solid #FF5A1F;outline-offset:2px}
    .tag{background:#FF5A1F;color:#121212;font:700 10px/1 ui-monospace,"JetBrains Mono",monospace;letter-spacing:.08em;
      text-transform:uppercase;padding:6px 8px;border-radius:999px;white-space:nowrap}
    .x{padding:9px 10px;opacity:.7} .x:hover{opacity:1;background:#2a2a2a}
    svg{width:14px;height:14px;flex:none}
    .mini{display:none}
    .min .full{display:none} .min .mini{display:inline-flex}
    @media (max-width:420px){.label{display:none}}
    @media (prefers-reduced-motion:reduce){.bar{transition:none}}`;
  if ("adoptedStyleSheets" in root) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    root.adoptedStyleSheets = [sheet];
  } else {
    const style = document.createElement("style");
    style.textContent = css;
    root.appendChild(style);
  }
  root.innerHTML += `
  <div class="bar" role="region" aria-label="${T.demo}">
    <a class="full" href="${home}#work" title="${T.hint}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF5A1F" d="M12 1l2.6 4.7L19.8 4.2l-1.5 5.2L23 12l-4.7 2.6 1.5 5.2-5.2-1.5L12 23l-2.6-4.7-5.2 1.5 1.5-5.2L1 12l4.7-2.6L4.2 4.2l5.2 1.5z"/></svg>
      <span aria-hidden="true">←</span><span class="label">${T.back}</span>
    </a>
    <span class="tag full" title="${T.hint}${note ? " · " + note : ""}">${T.demo}${note ? " · " + note : ""}</span>
    <button class="x full" type="button" aria-label="${T.hide}">✕</button>
    <button class="mini" type="button" aria-label="${T.show}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF5A1F" d="M12 1l2.6 4.7L19.8 4.2l-1.5 5.2L23 12l-4.7 2.6 1.5 5.2-5.2-1.5L12 23l-2.6-4.7-5.2 1.5 1.5-5.2L1 12l4.7-2.6L4.2 4.2l5.2 1.5z"/></svg>
    </button>
  </div>`;
  const bar = root.querySelector(".bar");
  root.querySelector(".x").addEventListener("click", () => bar.classList.add("min"));
  root.querySelector(".mini").addEventListener("click", () => bar.classList.remove("min"));
  (document.body || document.documentElement).appendChild(host);
})();

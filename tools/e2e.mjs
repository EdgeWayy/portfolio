// End-to-end check of the BUILT site under a GitHub Pages subpath.
// npm run build && node tools/e2e.mjs
import { spawn } from "node:child_process";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const PREFIX = "/akbar-portfolio/";
const BASE = `http://localhost:4181${PREFIX}`;
const server = spawn(process.execPath, ["tools/serve.mjs", "dist", PREFIX, "4181"], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch({ args: ["--use-gl=angle", "--ignore-gpu-blocklist"] });
const fails = [];
const check = (ok, msg) => { console.log(`${ok ? "✓" : "✗"} ${msg}`); if (!ok) fails.push(msg); };

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("akbar-intro-seen", "1"); } catch (e) {} }); // skip the gate + intro
  const p = await ctx.newPage();
  const errors = [];
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

  await p.goto(BASE, { waitUntil: "load" });
  await p.waitForTimeout(3500);
  check(errors.length === 0, `portfolio loads without console errors ${errors.join(" | ")}`);
  // the portrait starts after the first-visit intro (js/intro.js), so wait for it instead of a fixed delay
  const gl = await p.waitForFunction(() => document.documentElement.classList.contains("gl-ready"), null, { timeout: 15000 }).then(() => true, () => false);
  check(gl, "WebGL portrait running");

  // every page: loads clean, its nav link is marked active, every internal link and image answers 200
  const PAGES = { "": "index", "projects.html": "projects", "services.html": "services", "about.html": "about", "faq.html": "faq", "contact.html": "contact" };
  const checked = new Set();
  for (const [file, id] of Object.entries(PAGES)) {
    errors.length = 0;
    await p.goto(BASE + file, { waitUntil: "load" });
    await p.waitForTimeout(1200);
    const info = await p.evaluate(() => ({
      title: document.title,
      active: [...document.querySelectorAll('[aria-current="page"]')].map((a) => a.dataset.nav),
      nav: [...document.querySelectorAll(".nav__links a")].length,
      footer: !!document.querySelector(".footer__big"),
      over: document.documentElement.scrollWidth - innerWidth,
    }));
    const activeOk = id === "index" ? info.active.every((n) => n === "index") : info.active.length >= 1 && info.active.every((n) => n === id);
    check(errors.length === 0 && activeOk && info.nav === 5 && info.footer && info.over === 0,
      `${file || "index"}: "${info.title}", active=${info.active.join(",")} ${errors.join(" | ")}`);
    const hrefs = await p.evaluate(() => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.href.split("#")[0]))]);
    for (const h of hrefs.filter((h) => h.startsWith("http://localhost") && !checked.has(h))) {
      checked.add(h);
      const res = await p.request.get(h);
      check(res.status() === 200, `link ${h.replace(BASE, "") || "./"} -> ${res.status()}`);
    }
    const imgs = await p.evaluate(() => [...document.querySelectorAll("img")].map((i) => i.currentSrc || i.src));
    for (const src of imgs.filter((x) => !checked.has(x))) { checked.add(src); const r = await p.request.get(src); check(r.status() === 200, `img ${src.replace(BASE, "")}`); }
  }

  // language toggle (home hero, then the projects page keeps EN)
  await p.goto(BASE, { waitUntil: "load" });
  await p.waitForTimeout(2500);
  await p.click('[data-lang="en"]');
  await p.waitForTimeout(400);
  const h = await p.evaluate(() => document.querySelector(".hero__line").textContent);
  await p.goto(BASE + "projects.html", { waitUntil: "load" });
  await p.waitForTimeout(1200);
  const en = await p.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, open: document.querySelector(".case .btn span").textContent }));
  check(en.lang === "en" && /Websites/.test(h) && /Open/.test(en.open) && /^Work/.test(en.title), `EN toggle: "${h.slice(0, 30)}…" / "${en.open}" / "${en.title}"`);
  await p.click('[data-lang="ru"]');

  // portfolio -> every demo -> back
  const demos = await p.evaluate(() => [...document.querySelectorAll(".case .btn--case")].map((a) => a.getAttribute("href")));
  for (const href of demos) {
    const d = await ctx.newPage();
    const derr = [];
    d.on("pageerror", (e) => derr.push(e.message));
    d.on("response", (r) => r.status() >= 400 && derr.push(`${r.status()} ${r.url()}`));
    await d.goto(BASE + href, { waitUntil: "load" });
    await d.waitForTimeout(1200);
    const back = await d.evaluate(() => document.querySelector("[data-akbar-demo]")?.shadowRoot?.querySelector("a")?.href);
    check(!!back && derr.length === 0, `${href} opens, demo bar present ${derr.join(" | ")}`);
    await d.evaluate(() => document.querySelector("[data-akbar-demo]").shadowRoot.querySelector("a").click());
    await d.waitForURL(/projects\.html$/, { timeout: 5000 }).catch(() => {});
    check(d.url() === BASE + "projects.html", `back link returns to ${d.url().replace("http://localhost:4181", "")}`);
    await d.close();
  }

  // 404 page with a working home link at any depth
  const n = await ctx.newPage();
  const r404 = await n.goto(BASE + "some/deep/missing/page", { waitUntil: "load" });
  const home = await n.evaluate(() => document.getElementById("home")?.href);
  check(r404.status() === 404 && home === BASE, `404 page, home link -> ${home}`);
  await n.close();

  // ---------- themes ----------
  // autumn: leaves on, the portrait's own WebGL canvas still works next to them
  const au = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await au.addInitScript(() => { try { if (!sessionStorage.getItem("__t")) { sessionStorage.setItem("__t", "1"); sessionStorage.setItem("akbar-intro-seen", "1"); sessionStorage.setItem("akbar-seen", "1"); } } catch (e) {} });
  const a = await au.newPage();
  const aerr = [];
  a.on("pageerror", (e) => aerr.push(e.message));
  a.on("console", (m) => (m.type() === "error" || /disabled/.test(m.text())) && aerr.push(m.text()));
  await a.goto(BASE, { waitUntil: "load" });
  await a.waitForFunction(() => document.documentElement.classList.contains("gl-ready"), null, { timeout: 15000 }).catch(() => {});
  const au0 = await a.evaluate(() => ({ gl: document.documentElement.classList.contains("gl-ready"), leaves: document.querySelectorAll(".leaves").length, exit: getComputedStyle(document.querySelector(".acid-exit")).display, secret: document.querySelectorAll(".ak-gate__blk.is-secret").length }));
  check(au0.gl && au0.leaves === 3 && au0.exit === "none" && aerr.length === 0, `autumn: WebGL + leaves, no ACID button ${JSON.stringify(au0)} ${aerr.join(" | ")}`);

  await a.waitForTimeout(1800);
  const cta = await a.evaluate(() => [...document.querySelectorAll(".hero__ctas .btn")].map((b) => getComputedStyle(b).opacity));
  check(cta.length === 2 && cta.every((o) => o === "1"), `hero buttons fully visible ${cta.join(",")}`);

  // the star: a hold released early rewinds and does nothing
  const seal = await a.locator(".nav__seal").boundingBox();
  await a.mouse.move(seal.x + seal.width / 2, seal.y + seal.height / 2);
  await a.mouse.down(); await a.waitForTimeout(1000); await a.mouse.up(); await a.waitForTimeout(900);
  const early = await a.evaluate(() => ({ theme: sessionStorage.getItem("akbar-theme"), charging: document.querySelector(".nav__seal").classList.contains("is-charging"), gate: !!document.querySelector(".ak-gate") }));
  check(!early.theme && !early.charging && !early.gate, `star released at 1s: nothing happens ${JSON.stringify(early)}`);

  // the star: 2 seconds -> theme saved, gate forced back, in ACID
  await a.mouse.down(); await a.waitForTimeout(2150); await a.mouse.up();
  await a.waitForSelector(".ak-gate", { timeout: 8000 }).catch(() => {});
  await a.waitForTimeout(800);
  const g = await a.evaluate(() => ({ theme: document.documentElement.dataset.theme, stored: sessionStorage.getItem("akbar-theme"), gate: !!document.querySelector(".ak-gate"), potion: !!document.querySelector(".ak-gate__potion"), blocks: document.querySelectorAll(".ak-gate__blk").length }));
  check(g.theme === "acid" && g.stored === "acid" && g.gate && g.potion && g.blocks > 10, `star held 2s: gate in ACID ${JSON.stringify(g)}`);
  const candy = await a.evaluate(() => document.querySelectorAll(".ak-candy").length);
  check(candy === g.blocks, `ACID gate floats candies (${candy})`);

  // the potion: filling the button enters the site in ACID, skipping the white intro
  const gb = await a.locator(".ak-gate__btn").boundingBox();
  await a.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2);
  await a.mouse.down(); await a.waitForTimeout(800); await a.mouse.up(); await a.waitForTimeout(1200);
  const drained = await a.evaluate(() => !!document.querySelector(".ak-gate"));
  await a.mouse.down(); await a.waitForTimeout(2350); await a.mouse.up();
  const finale = await a.waitForSelector(".ak-finale", { timeout: 8000 }).then(() => true, () => false);
  check(finale, "full button starts the skull-bite finale");
  // while the skull is on screen the page's slime must not exist yet
  await a.waitForTimeout(1500);
  const during = await a.evaluate(() => ({ slime: !!document.querySelector(".slime"), layers: document.querySelectorAll(".ak-finale canvas").length }));
  check(!during.slime && during.layers >= 2, `finale: layers up, no page slime yet ${JSON.stringify(during)}`);
  await a.waitForFunction(() => !document.querySelector(".ak-gate") && !document.querySelector(".ak-finale"), null, { timeout: 40000 }).catch(() => {});
  // the interface comes first, the slime only after it
  const first = await a.evaluate(() => ({ slime: !!document.querySelector(".slime"), nav: getComputedStyle(document.getElementById("nav")).visibility }));
  check(!first.slime && first.nav === "visible", `after the finale: interface first, slime later ${JSON.stringify(first)}`);
  await a.waitForSelector(".slime", { timeout: 5000 }).catch(() => {});
  await a.waitForTimeout(800);
  const onHome = await a.evaluate(() => ({ theme: document.documentElement.dataset.theme, intro: !!document.querySelector(".ak-intro"), slime: !!document.querySelector(".slime"), bg: getComputedStyle(document.documentElement).backgroundColor, font: getComputedStyle(document.querySelector(".hero__name")).fontFamily, leaves: !!document.querySelector(".leaves") && getComputedStyle(document.querySelector(".leaves")).display }));
  await a.waitForTimeout(4200); // the slime has arrived, the skull has formed
  const look = await a.evaluate(() => {
    const g = document.querySelector(".hero__gl"), r = g.getBoundingClientRect();
    const px = (s) => getComputedStyle(document.querySelector(s));
    return {
      stickers: [".skull-badge", ".skull-tag--name", ".skull-tag--role", ".skull-links"].every((s) => px(s).display !== "none"),
      black: px(".hero__name").color === "rgb(0, 0, 0)" && (innerWidth < 960 || px(".hero__lead").color === "rgb(0, 0, 0)"),
      dpr: g.width / r.width, over: document.documentElement.scrollWidth - innerWidth,
      slimeBehind: px(".slime").zIndex,
    };
  });
  check(look.stickers && look.black && look.slimeBehind === "-1" && look.over === 0, `ACID hero: stickers, black text on the slime ${JSON.stringify(look)}`);
  const skullTone = await a.request.get(BASE + "img/skull-tone.webp");
  check(skullTone.status() === 200, `skull tone map -> ${skullTone.status()}`);
  const flow = await a.evaluate(() => getComputedStyle(document.getElementById("loader")).visibility);
  check(flow === "hidden", `ACID entry shows no counter loader (${flow})`);
  check(drained && onHome.theme === "acid" && !onHome.intro && onHome.slime && onHome.bg === "rgb(0, 0, 0)" && /Wet Paint/.test(onHome.font), `potion filled: main page in ACID ${JSON.stringify(onHome)}`);

  // a click and Esc both skip the finale, from any moment after it has begun
  for (const how of ["click", "Escape"]) {
    const sk = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await sk.addInitScript(() => { try { sessionStorage.setItem("akbar-theme", "acid"); } catch (e) {} });
    const s = await sk.newPage();
    const serr = [];
    s.on("pageerror", (e) => serr.push(e.message));
    await s.goto(BASE, { waitUntil: "load" });
    await s.waitForSelector(".ak-gate__btn");
    await s.waitForTimeout(700);
    const b = await s.locator(".ak-gate__btn").boundingBox();
    await s.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await s.mouse.down(); await s.waitForTimeout(2350); await s.mouse.up();
    await s.waitForSelector(".ak-finale", { timeout: 8000 });
    await s.waitForTimeout(500);
    const t0 = Date.now();
    if (how === "click") await s.mouse.click(300, 300); else await s.keyboard.press("Escape");
    await s.waitForFunction(() => !document.querySelector(".ak-finale"), null, { timeout: 4000 }).catch(() => {});
    const gone = await s.evaluate(() => !document.querySelector(".ak-finale") && !document.querySelector(".ak-gate"));
    check(gone && Date.now() - t0 < 1800 && serr.length === 0, `finale skipped by ${how} in ${Date.now() - t0}ms ${serr.join(" | ")}`);
    await sk.close();
  }

  // every page keeps ACID, with the button, without overflow
  for (const f of ["projects.html", "services.html", "about.html", "faq.html", "contact.html"]) {
    await a.goto(BASE + f, { waitUntil: "load" });
    await a.waitForTimeout(1500);
    const st = await a.evaluate(() => ({ theme: document.documentElement.dataset.theme, exit: getComputedStyle(document.querySelector(".acid-exit")).display, over: document.documentElement.scrollWidth - innerWidth, frame: getComputedStyle(document.querySelector(".sec-head")).borderImageSource.includes("acid-frame") || getComputedStyle(document.querySelector(".sec-head")).borderImageSource.includes("svg") }));
    check(st.theme === "acid" && st.exit !== "none" && st.over === 0 && st.frame, `${f} in ACID ${JSON.stringify(st)}`);
  }

  // ACID x: back to autumn on the live page, remembered after a reload
  await a.goto(BASE, { waitUntil: "load" });
  await a.waitForTimeout(1500);
  const short = await a.evaluate(() => ({ visible: getComputedStyle(document.getElementById("nav")).visibility, slime: !!document.querySelector(".slime") }));
  check(short.visible === "visible" && short.slime, `later page of a visit: interface at once, short slime ${JSON.stringify(short)}`);
  await a.click(".acid-exit");
  await a.waitForTimeout(1800);
  await a.reload({ waitUntil: "load" });
  await a.waitForTimeout(600);
  const back = await a.evaluate(() => ({ theme: document.documentElement.dataset.theme ?? "autumn", stored: sessionStorage.getItem("akbar-theme"), slime: !!document.querySelector(".slime") }));
  check(back.theme === "autumn" && back.stored === "autumn" && !back.slime, `ACID x: back to autumn ${JSON.stringify(back)}`);
  check(aerr.length === 0, `themes: no errors ${aerr.join(" | ")}`);
  await au.close();

  // first visit in autumn: gate -> loader -> intro still end on a working page
  const fv = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const v = await fv.newPage();
  const verr = [];
  v.on("pageerror", (e) => verr.push(e.message));
  await v.goto(BASE, { waitUntil: "load" });
  await v.waitForSelector(".ak-gate__btn");
  const vb = await v.locator(".ak-gate__btn").boundingBox();
  await v.mouse.move(vb.x + vb.width / 2, vb.y + vb.height / 2);
  await v.mouse.down(); await v.waitForTimeout(2400); await v.mouse.up();
  await v.waitForFunction(() => document.documentElement.classList.contains("loaded") && !document.querySelector(".ak-intro"), null, { timeout: 25000 }).catch(() => {});
  const fin = await v.evaluate(() => ({ loaded: document.documentElement.classList.contains("loaded"), intro: !!document.querySelector(".ak-intro"), leaves: document.querySelectorAll(".leaves").length, gate: !!document.querySelector(".ak-gate"), navVisible: getComputedStyle(document.getElementById("nav")).visibility }));
  check(fin.loaded && !fin.intro && !fin.gate && fin.leaves > 0 && fin.navVisible === "visible" && verr.length === 0, `first visit autumn flow ${JSON.stringify(fin)} ${verr.join(" | ")}`);
  await fv.close();

  // mobile: a real touch hold on the star (a tap keeps the link, 2 seconds enters ACID), then the ACID layout
  const tc = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await tc.addInitScript(() => { try { if (!sessionStorage.getItem("__t")) { sessionStorage.setItem("__t", "1"); sessionStorage.setItem("akbar-intro-seen", "1"); sessionStorage.setItem("akbar-seen", "1"); } } catch (e) {} }); // first load only: the star has to be able to bring the gate back
  const tp = await tc.newPage();
  await tp.goto(BASE, { waitUntil: "load" });
  await tp.waitForTimeout(1500);
  const cdp = await tc.newCDPSession(tp);
  const sb = await tp.locator(".nav__seal").boundingBox();
  const pt = [{ x: sb.x + sb.width / 2, y: sb.y + sb.height / 2 }];
  let menus = 0;
  await tp.exposeFunction("__menu", () => { menus++; });
  await tp.evaluate(() => document.addEventListener("contextmenu", (e) => { if (!e.defaultPrevented) window.__menu(); }));
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt });
  await tp.waitForTimeout(900);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await tp.waitForTimeout(700);
  const te = await tp.evaluate(() => ({ theme: sessionStorage.getItem("akbar-theme"), charging: document.querySelector(".nav__seal").classList.contains("is-charging") }));
  check(!te.theme && !te.charging, `touch released at 0.9s: nothing happens ${JSON.stringify(te)}`);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt });
  await tp.waitForTimeout(2200);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }).catch(() => {});
  await tp.waitForSelector(".ak-gate", { timeout: 8000 }).catch(() => {});
  const tg = await tp.evaluate(() => ({ stored: sessionStorage.getItem("akbar-theme"), gate: !!document.querySelector(".ak-gate"), potion: !!document.querySelector(".ak-gate__potion") }));
  check(tg.stored === "acid" && tg.gate && tg.potion && menus === 0, `touch held 2s: gate in ACID, no context menu ${JSON.stringify(tg)}`);
  await tp.evaluate(() => sessionStorage.setItem("akbar-seen", "1"));
  await tp.goto(BASE, { waitUntil: "load" });
  await tp.waitForTimeout(3500);
  const mo = await tp.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, theme: document.documentElement.dataset.theme, drip: !!document.querySelector(".slime") }));
  check(mo.over === 0 && mo.theme === "acid" && mo.drip, `mobile ACID layout ${JSON.stringify(mo)}`);
  // the 404 page follows the theme too, and can switch it off (its inline script must pass the CSP)
  const e404 = [];
  tp.on("console", (m) => m.type() === "error" && !/404/.test(m.text()) && e404.push(m.text()));
  tp.on("pageerror", (e) => e404.push(e.message));
  await tp.goto(BASE + "no/such/page", { waitUntil: "load" });
  const n1 = await tp.evaluate(() => ({ theme: document.documentElement.dataset.theme, bg: getComputedStyle(document.body).backgroundColor, btn: getComputedStyle(document.getElementById("acid")).display }));
  await tp.tap("#acid");
  const n2 = await tp.evaluate(() => ({ theme: document.documentElement.dataset.theme ?? "autumn", stored: sessionStorage.getItem("akbar-theme"), btn: getComputedStyle(document.getElementById("acid")).display }));
  check(n1.theme === "acid" && n1.bg === "rgb(0, 0, 0)" && n1.btn !== "none" && n2.theme === "autumn" && n2.stored === "autumn" && n2.btn === "none" && e404.length === 0, `404 in ACID, then off ${JSON.stringify(n1)} ${e404.join(" | ")}`);
  await tc.close();

  // mobile + reduced motion: static portrait, no WebGL, content visible
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  await m.addInitScript(() => { try { sessionStorage.setItem("akbar-intro-seen", "1"); } catch (e) {} }); // skip the gate + intro
  const mp = await m.newPage();
  await mp.goto(BASE, { waitUntil: "load" });
  await mp.waitForTimeout(1500);
  const still = await mp.evaluate(() => ({
    gl: document.documentElement.classList.contains("gl-ready"),
    img: getComputedStyle(document.querySelector(".hero__img")).opacity,
    loader: getComputedStyle(document.getElementById("loader")).display,
    overflow: document.documentElement.scrollWidth - innerWidth,
  }));
  check(!still.gl && still.img === "1" && still.loader === "none" && still.overflow === 0, `reduced motion mobile: ${JSON.stringify(still)}`);
  await m.close();
} finally {
  await browser.close();
  server.kill();
}
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASSED");
process.exit(fails.length ? 1 : 0);

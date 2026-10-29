// Renders public/og.jpg (1200x630) from an HTML card. node tools/og.mjs
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
const ROOT = path.resolve(import.meta.dirname, "..");
const img = (f) => "data:image/webp;base64," + fs.readFileSync(path.join(ROOT, "public/img", f)).toString("base64");
const font = (f) => "data:font/woff2;base64," + fs.readFileSync(path.join(ROOT, "node_modules", f)).toString("base64");
const html = `<!doctype html><html><head><style>
@font-face{font-family:U;src:url(${font("@fontsource-variable/unbounded/files/unbounded-cyrillic-wght-normal.woff2")});font-weight:200 900}
@font-face{font-family:U;src:url(${font("@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2")});font-weight:200 900;unicode-range:U+0000-00FF}
@font-face{font-family:M;src:url(${font("@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2")})}
@font-face{font-family:M;src:url(${font("@fontsource/jetbrains-mono/files/jetbrains-mono-cyrillic-500-normal.woff2")});unicode-range:U+0400-04FF}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#F3EEE4;color:#121212;font-family:U;position:relative;overflow:hidden}
.p{position:absolute;right:20px;bottom:-30px;height:620px}
.name{position:absolute;left:44px;bottom:-22px;font-weight:800;font-size:226px;letter-spacing:-.06em;line-height:.8}
.line{position:absolute;left:52px;top:118px;font-weight:600;font-size:46px;line-height:1.02;letter-spacing:-.035em;width:640px}
.top{position:absolute;left:52px;top:46px;font:500 16px M;letter-spacing:.08em;text-transform:uppercase;display:flex;gap:12px;align-items:center}
.top i{width:10px;height:10px;border-radius:50%;background:#1FA65A}
.tag{position:absolute;right:44px;top:44px;background:#FF5A1F;padding:12px 18px;border-radius:999px;font:500 16px M;letter-spacing:.06em}
</style></head><body>
<div class="top"><i></i>akbar.usta · сайты для бизнеса</div>
<div class="tag">@KrieWoo</div>
<div class="line">Сайты, которые продают, для бизнеса в&nbsp;Узбекистане</div>
<div class="name">Акбар</div>
<img class="p" src="${img("portrait-halftone-900.webp")}">
</body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html, { waitUntil: "load" });
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(ROOT, "public/og.jpg"), type: "jpeg", quality: 86 });
await b.close();
console.log("public/og.jpg written");

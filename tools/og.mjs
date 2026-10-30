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
/* same look as the hero: graphite ground, ivory name, brass tag, navy dots on a light print panel */
body{width:1200px;height:630px;background:#0F1318;color:#ECE7DC;font-family:U;position:relative;overflow:hidden}
.panel{position:absolute;right:48px;top:48px;width:427px;height:534px;background:#E9E4D8;border-radius:10px;overflow:hidden}
.panel img{width:100%;height:100%;object-fit:cover}
.top{position:absolute;left:56px;top:56px;font:500 17px M;letter-spacing:.08em;text-transform:uppercase;display:flex;gap:12px;align-items:center;color:#9AA2AC}
.top i{width:10px;height:10px;border-radius:50%;background:#4FB37A}
.name{position:absolute;left:50px;top:150px;font-weight:800;font-size:150px;letter-spacing:-.055em;line-height:.9}
.line{position:absolute;left:56px;top:330px;font-weight:600;font-size:38px;line-height:1.12;letter-spacing:-.03em;width:620px;color:#D9D4C9}
.tag{position:absolute;left:56px;bottom:56px;background:#C9A35E;color:#0F1318;padding:14px 22px;border-radius:999px;font:500 19px M;letter-spacing:.06em}
</style></head><body>
<div class="top"><i></i>akbar · сайты для бизнеса</div>
<div class="name">Акбар</div>
<div class="line">Сайты, которые продают, для бизнеса в&nbsp;Узбекистане</div>
<div class="tag">t.me/KrieWoo</div>
<div class="panel"><img src="${img("portrait-dots-900.webp")}"></div>
</body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html, { waitUntil: "load" });
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(ROOT, "public/og.jpg"), type: "jpeg", quality: 86 });
await b.close();
console.log("public/og.jpg written");

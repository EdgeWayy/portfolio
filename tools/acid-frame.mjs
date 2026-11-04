// Generates css/acid-frame.svg: the rough lime frame used as a border-image by the ACID theme (css/acid.css).
// The image is 200x200 and sliced at 20 units: four rough corners and four 160-unit edges that tile seamlessly.
// The bottom edge carries the drips. Run: node tools/acid-frame.mjs
import fs from "node:fs";
import path from "node:path";

const LIME = "#B8FF00";
let seed = 23;
const rnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + ((seed - 1) / 2147483646) * (b - a); };

// a jagged line from a to b: [position along the line, offset]. The ends have no offset, so neighbouring tiles join up
const jag = (a, b, steps, amp) => Array.from({ length: steps + 1 }, (_, i) => [
  a + ((b - a) * i) / steps,
  i === 0 || i === steps ? 0 : rnd(-amp, amp),
]);

const line = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
const Y = 10, T = 7; // the frame's centerline inside the 20-unit edge, stroke width

const top = jag(20, 180, 12, 3.4).map(([p, n]) => [p, Y + n]);
const bottomLine = jag(20, 180, 12, 3).map(([p, n]) => [p, 190 + n]);
const left = jag(20, 180, 12, 3.4).map(([p, n]) => [Y + n, p]);
const right = jag(20, 180, 12, 3.4).map(([p, n]) => [190 + n, p]);

// drips on the bottom edge: flat color, a rounded head and a neck that flares out of the line
const drips = [[44, 6, 7], [88, 4, 4], [118, 9, 11.5], [156, 5, 5.5]].map(([x, w, len]) => {
  const y0 = 188, y1 = Math.min(199 - w * 0.5, y0 + len);
  return `M${x - w - 3} ${y0}C${x - w} ${y0} ${x - w * 0.6} ${y0 + 2} ${x - w * 0.6} ${y1 - w * 0.5}`
    + `A${w * 0.62} ${w * 0.62} 0 1 0 ${x + w * 0.6} ${y1 - w * 0.5}C${x + w * 0.6} ${y0 + 2} ${x + w} ${y0} ${x + w + 3} ${y0}Z`;
}).join("");

const corners = "M0 4L8 0L20 7L17 16L7 20L0 13Z" // top-left
  + "M200 4L192 0L180 7L183 16L193 20L200 13Z"   // top-right
  + "M0 196L8 200L20 193L17 184L7 180L0 187Z"    // bottom-left
  + "M200 196L192 200L180 193L183 184L193 180L200 187Z"; // bottom-right

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><g fill="none" stroke="${LIME}" stroke-width="${T}" stroke-linejoin="round"><path d="${line(top)}"/><path d="${line(bottomLine)}"/><path d="${line(left)}"/><path d="${line(right)}"/></g><path fill="${LIME}" d="${corners}${drips}"/></svg>\n`;
const out = path.resolve(import.meta.dirname, "../css/acid-frame.svg");
fs.writeFileSync(out, svg);
console.log("wrote", out, svg.length, "bytes");

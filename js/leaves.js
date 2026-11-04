/* Autumn theme: falling leaves on plain canvases (no library). Three layers share one animation loop:
   the whole site (barely visible), the hero around the portrait, and inside the portrait panel behind the stars.
   Each leaf is a pre-rendered sprite, so a frame is only a few drawImage calls.
   The loop stops while the tab is hidden and while no layer is on screen; reduced motion gets a single still frame. */

const COLORS = ["#C9762B", "#E0A030", "#A8441F", "#8C5A2B", "#C9A35E", "#D9662B"];
// five leaf shapes, each drawn in a 48x48 box
const SHAPES = [
  // maple
  "M24 2l4 9 5-3-1 9 8-3-3 7 8 2-7 6 2 5-9-2-1 6h-.2l.2 8h-4l.2-8H26l-1-6-9 2 2-5-7-6 8-2-3-7 8 3-1-9 5 3z",
  // oak
  "M24 2c3 2 2 6 5 7s6-2 7 2-3 6-1 8 7 0 7 4-6 4-6 7 4 6 1 8-6-1-8 1-1 5-3 6l-.5 5h-3l-.5-5c-2-1-1-4-3-6s-5 1-8-1 1-5 1-8-6-3-6-7 5-2 7-4-2-6-1-8 4 1 7-2 1-5 4-7z",
  // beech (oval, pointed)
  "M24 2C35 11 40 21 35 32c-2 5-6 8-10 9l-.3 5h-1.4l-.3-5c-4-1-8-4-10-9C8 21 13 11 24 2z",
  // birch (round with a tip)
  "M24 4c9 3 17 12 15 23-2 9-8 13-14 14l-.3 5h-1.4l-.3-5c-6-1-12-5-14-14C7 16 15 7 24 4z",
  // ginkgo (fan)
  "M24 30C14 29 5 24 3 15c6-5 13-7 19-6l2 6 2-6c6-1 13 1 19 6-2 9-11 14-21 15l.6 16h-1.2z",
];
const VEIN = "M24 6v36";

const sprites = new Map();
function sprite(shape, color) {
  const key = shape + color;
  if (sprites.has(key)) return sprites.get(key);
  const S = 64; // drawn at most about this big, then scaled down
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const c = cv.getContext("2d");
  c.scale(S / 48, S / 48);
  c.fillStyle = color;
  c.fill(new Path2D(SHAPES[shape]));
  c.strokeStyle = "rgba(15, 19, 24, .28)";
  c.lineWidth = 1;
  c.stroke(new Path2D(VEIN));
  sprites.set(key, cv);
  return cv;
}

const rand = (a, b) => a + Math.random() * (b - a);
const layers = [];
let running = false, last = 0, active = false;

function spawn(l, leaf, anywhere) {
  leaf.s = rand(l.size[0], l.size[1]);
  leaf.x = rand(-20, l.w + 20);
  leaf.y = anywhere ? rand(-20, l.h) : -leaf.s - rand(0, l.h * 0.25);
  leaf.vy = rand(l.speed[0], l.speed[1]) * (0.7 + (leaf.s / l.size[1]) * 0.5); // bigger leaves fall a little faster
  leaf.swayA = rand(14, 42);
  leaf.swayF = rand(0.45, 1.1);
  leaf.swayP = rand(0, Math.PI * 2);
  leaf.rot = rand(0, Math.PI * 2);
  leaf.vr = rand(-1.1, 1.1);
  leaf.flipF = rand(0.5, 1.6);
  leaf.flipP = rand(0, Math.PI * 2);
  leaf.img = sprite(Math.floor(rand(0, SHAPES.length)), COLORS[Math.floor(rand(0, COLORS.length))]);
}

function fit(l) {
  const r = l.canvas.getBoundingClientRect();
  l.w = Math.max(1, l.fixed ? innerWidth : r.width);
  l.h = Math.max(1, l.fixed ? innerHeight : r.height);
  l.canvas.width = Math.round(l.w * l.dpr);
  l.canvas.height = Math.round(l.h * l.dpr);
}

function drawLayer(l, time, dt) {
  const c = l.ctx;
  c.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
  c.clearRect(0, 0, l.w, l.h);
  for (const f of l.leaves) {
    f.y += f.vy * dt;
    f.rot += f.vr * dt;
    if (f.y > l.h + f.s) spawn(l, f, false);
    const x = f.x + Math.sin(time * f.swayF + f.swayP) * f.swayA;
    // a leaf turning in the air: its width pulses as if it were flipping over
    const flip = 0.35 + 0.65 * Math.abs(Math.cos(time * f.flipF + f.flipP));
    c.setTransform(l.dpr * Math.cos(f.rot) * flip, l.dpr * Math.sin(f.rot) * flip, -l.dpr * Math.sin(f.rot), l.dpr * Math.cos(f.rot), x * l.dpr, f.y * l.dpr);
    c.drawImage(f.img, -f.s / 2, -f.s / 2, f.s, f.s);
  }
}

function frame(now) {
  if (!active || document.hidden) { running = false; return; }
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  const time = now / 1000;
  let any = false;
  for (const l of layers) {
    if (!l.visible) continue;
    any = true;
    drawLayer(l, time, dt);
  }
  if (!any) { running = false; return; }
  requestAnimationFrame(frame);
}

function kick() {
  if (running || !active || document.hidden) return;
  running = true;
  last = performance.now();
  requestAnimationFrame(frame);
}

function addLayer(canvas, opts) {
  const ctx = canvas.getContext("2d");
  const l = { canvas, ctx, visible: true, leaves: [], dpr: 1, ...opts };
  l.dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr || 1);
  fit(l);
  for (let i = 0; i < opts.count; i++) { const f = {}; spawn(l, f, true); l.leaves.push(f); }
  if (!l.fixed) {
    new ResizeObserver(() => { fit(l); }).observe(canvas);
    new IntersectionObserver(([en]) => { l.visible = en.isIntersecting; if (l.visible) kick(); }).observe(canvas);
  }
  layers.push(l);
  return l;
}

function makeCanvas(cls) {
  const c = document.createElement("canvas");
  c.className = cls;
  c.setAttribute("aria-hidden", "true");
  return c;
}

let built = false;
export function startLeaves({ reduce = false, weak = false, phone = false } = {}) {
  active = true;
  document.documentElement.classList.add("leaves-on");
  if (!built) {
    built = true;
    const page = makeCanvas("leaves leaves--page");
    document.body.prepend(page);
    addLayer(page, { fixed: true, count: phone || weak ? 7 : 14, size: [14, 30], speed: [14, 34], maxDpr: 1 });
    const hero = document.querySelector(".hero");
    const portrait = document.getElementById("portrait");
    if (hero && portrait && !weak) {
      if (!phone) {
        const around = makeCanvas("leaves leaves--hero");
        hero.append(around);
        addLayer(around, { count: 16, size: [18, 40], speed: [26, 58], maxDpr: 1.5 });
      }
      const inside = makeCanvas("leaves leaves--panel");
      portrait.prepend(inside);
      addLayer(inside, { count: phone ? 5 : 9, size: [16, 34], speed: [20, 44], maxDpr: 1.5 });
    }
    window.addEventListener("resize", () => layers.forEach((l) => { if (l.fixed) fit(l); if (!running) drawStill(); }));
    document.addEventListener("visibilitychange", kick);
  }
  if (reduce) { drawStill(); return; }
  kick();
}

function drawStill() { for (const l of layers) drawLayer(l, 0, 0); }

export function stopLeaves() {
  active = false;
  document.documentElement.classList.remove("leaves-on");
  for (const l of layers) l.ctx.clearRect(0, 0, l.canvas.width, l.canvas.height);
}

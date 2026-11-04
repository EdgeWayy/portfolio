/* The ACID hold button's liquid, in the same slime look as everything else (js/slime-gl.js): the level follows the hold,
   a waving surface with a meniscus climbing the walls, a glow under the surface, bubbles that rise, wobble and pop with a
   tiny ring. The surface sloshes harder the faster the level moves, and drains back down on release. */
import { makeScene, makeSurface, massEdge, slimeDpr } from "./slime.js";

const rand = (a, b) => a + Math.random() * (b - a);
const BUBBLES = 10;              // at once; one slot in the shader's list each
const POP_S = 0.3;               // how long the ring lasts

/** `holder`: the canvas placeholder in the button. Returns tick(time, dt, progress), with tick.dispose() to give the renderer back. */
export function makePotion(holder, w, h, reduce) {
  const surface = makeSurface({ className: holder.className, width: w, height: h, dpr: slimeDpr() });
  holder.replaceWith(surface.canvas);
  const s = makeScene();
  s.massDir = -1;
  s.waveX = 7;        // a button is short: the page's slow waves are scaled to fit it
  s.waveT = 11;
  s.thick = 15;
  s.deep = 1;
  s.bubbles = 0;      // these bubbles are simulated, not the page's trapped ones
  const list = [], pops = [];
  let lastP = 0, slosh = 0, spawn = 0, blank = true;
  const tick = (t, dt, p) => {
    if (p <= 0 && !list.length && !pops.length) {
      if (!blank) { surface.clear(); blank = true; }
      lastP = 0;
      return;
    }
    blank = false;
    const rising = p >= lastP;
    slosh += (Math.min(1, (Math.abs(p - lastP) / Math.max(dt, 0.001)) * 2) - slosh) * Math.min(1, dt * 5);
    lastP = p;
    s.time = t;
    s.massBase = h + 6 - p * (h + 14);       // at p = 1 the crests are above the pill too
    s.massAmp = reduce ? 0 : (2 + slosh * 4 + (p > 0.8 ? (p - 0.8) * 8 : 0)) / 15;
    s.meniscus = reduce ? 0 : 7;
    s.glow = 0.6 + slosh * 0.6 + p * 0.5;
    s.n = 0;
    s.nMoving = 0;
    const put = (x, y, r, kind) => {
      if (s.nMoving >= 16) return;
      const m = s.nMoving * 4;
      s.moving[m] = x; s.moving[m + 1] = y; s.moving[m + 2] = r; s.moving[m + 3] = kind;
      s.nMoving++;
    };
    if (!reduce) {
      // bubbles: while the potion rises, none when it is draining
      spawn -= dt;
      if (p > 0.04 && p < 1 && rising && spawn <= 0 && list.length < BUBBLES) {
        spawn = rand(0.08, 0.24);
        list.push({ x: rand(14, w - 14), y: h + 4, r: rand(1.6, 4.6), v: rand(26, 62), f: rand(4, 9), a: rand(0, 6.3) });
      }
      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        b.y -= b.v * dt; b.a += b.f * dt;
        const x = b.x + Math.sin(b.a) * 2.2;
        const top = massEdge(s, x);
        if (b.y - b.r <= top) {  // reached the surface: pop
          pops.push({ x, y: top - 1, r: b.r, t: 0 });
          list.splice(i, 1);
          continue;
        }
        put(x, b.y, b.r, 0);
      }
      for (let i = pops.length - 1; i >= 0; i--) {
        const o = pops[i];
        o.t += dt / POP_S;
        if (o.t >= 1) { pops.splice(i, 1); continue; }
        put(o.x, o.y, o.r * (0.7 + o.t * 1.8), Math.max(0.001, o.t));
      }
    }
    surface.draw(s);
  };
  tick.dispose = () => surface.release();
  tick.frame = (dt) => surface.frame(dt);
  return tick;
}

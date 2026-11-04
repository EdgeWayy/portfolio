/* The ACID portrait: a halftone skull. public/img/skull-tone.webp is its tone map (white = no dot, black = solid),
   traced from the design reference by tools/photo/skull_tone.py. hero-gl.js feeds it to the portrait's shader, so the
   same mosaic changes into the skull; drawSkullMosaic() is the no-WebGL version of the same dots, skullRig() the finale's sprites. */

const INK = "#1A1A1A";
let toneImg = null;

/** The tone map as an <img> (loaded once). */
export function loadSkullTone() {
  toneImg ??= new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("skull tone failed"));
    img.src = new URL("img/skull-tone.webp", document.baseURI).href;
  });
  return toneImg;
}

/** The tone's darkness at a share of the image (x, y from the top left), read the way a linear texture is. */
function sampler(img) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const sc = cv.getContext("2d", { willReadFrequently: true });
  sc.drawImage(img, 0, 0);
  const d = sc.getImageData(0, 0, W, H).data;
  const at = (x, y) => d[(Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))) * 4] / 255;
  return (u, v) => {
    const x = u * W - 0.5, y = v * H - 0.5, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    return 1 - ((at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy);
  };
}

/* The teeth are the pale runs between the dark vertical bars of the tone map. Finds them along a band of rows. */
function toothRuns(dark, v0, v1) {
  const N = 480, runs = [];
  let from = -1;
  for (let i = 0; i <= N; i++) {
    const u = 0.3 + (i / N) * 0.4;
    let sum = 0;
    for (let k = 0; k < 6; k++) sum += dark(u, v0 + ((v1 - v0) * k) / 5);
    const pale = i < N && sum / 6 < 0.45;
    if (pale && from < 0) from = u;
    if (!pale && from >= 0) { if (u - from > 0.01) runs.push([from, u]); from = -1; }
  }
  if (runs.length !== 8) throw new Error(`skull rig: expected 8 teeth, found ${runs.length}`);
  return runs;
}

/**
 * The portrait's skull as separate sprites, for the finale's jaw rig (js/finale-rig.js). Computed pixel by pixel with the formula
 * of the shader in js/hero-gl.js at full morph: its hex grid (rows counted from the bottom), its dot radius, each dot cut off at
 * its own grid cell, its soft edge. Then every grid cell is given whole to one sprite, so nothing is redrawn:
 *   cranium   everything above the bite line, with a strip of pale gum for the teeth's roots
 *   mandible  everything below it, plus the rami: the outer cheek columns up to the hinge, on a pale backing
 *   upper[], lower[]  one tooth each, from the middle of one dark bar to the middle of the next, on a pale backing
 * and three pictures that do not exist in the portrait, on the same dot grid: the mouth's cavity and two gums for the close-up.
 * figW, figH: the figure in CSS px. res: pixels per CSS px. G: geometry as shares of the figure.
 */
export async function skullRig(figW, figH, res, G) {
  const img = await loadSkullTone();
  const dark = sampler(img);
  const cell = Math.max(3.6, figW / 112), rowH = cell * 0.866;
  const rows = Math.ceil(figH / rowH) + 1, cols = Math.ceil(figW / cell) + 2;
  const upperRuns = toothRuns(dark, 0.705, 0.76), lowerRuns = toothRuns(dark, 0.8, 0.84);
  // a tooth's column runs to the middle of the bar beside it; the two outer ones get the same width of bar
  const columns = (runs) => runs.map(([a, b], i) => [
    i ? (runs[i - 1][1] + a) / 2 : a - (runs[1][0] - runs[0][1]) / 2,
    i < runs.length - 1 ? (b + runs[i + 1][0]) / 2 : b + (runs[1][0] - runs[0][1]) / 2,
  ]);
  const upperCols = columns(upperRuns), lowerCols = columns(lowerRuns);
  const CRANIUM = 0, MANDIBLE = 1, UPPER = 2, LOWER = 10;
  const ownerOf = (u, v) => {
    if (v >= G.cut) {
      if (v < G.lowerRoot) for (let i = 0; i < 8; i++) if (u >= lowerCols[i][0] && u < lowerCols[i][1]) return LOWER + i;
      return MANDIBLE;
    }
    if (v >= G.upperTop) for (let i = 0; i < 8; i++) if (u >= upperCols[i][0] && u < upperCols[i][1]) return UPPER + i;
    return (u < G.seamL || u > G.seamR) && v >= G.ramusTop ? MANDIBLE : CRANIUM;
  };

  const R = new Float32Array(rows * cols), owner = new Uint8Array(rows * cols);
  for (let row = 0; row < rows; row++) {
    const shift = row % 2 ? cell / 2 : 0, cy = figH - (row + 0.5) * rowH;
    for (let k = 0; k < cols; k++) {
      const cx = (k + 0.5) * cell - shift;
      if (cx < 0 || cx > figW || cy < 0 || cy > figH) continue;
      const v = dark(cx / figW, cy / figH);
      if (v < 0.06) continue;
      const t = Math.min(1, Math.max(0, (v - 0.82) / 0.18));
      R[row * cols + k] = cell * (0.6 * Math.sqrt(v) + 0.2 * t * t * (3 - 2 * t));
      owner[row * cols + k] = ownerOf(cx / figW, cy / figH);
    }
  }

  // the whole picture: ink coverage and who owns each pixel
  const w = Math.ceil(figW * res), h = Math.ceil(figH * res);
  const cutPx = G.cut * h;
  const A = new Uint8Array(w * h), O = new Uint8Array(w * h);
  const AA = 0.9; // the shader's edge, in CSS px
  const breath = () => new Promise((r) => setTimeout(r)); // this runs during the hold: the potion keeps its frames
  const spans = new Map();
  for (let y = 0; y < h; y++) {
    if (y % 240 === 239) await breath();
    const fy = figH - (y + 0.5) / res;
    const row = Math.floor(fy / rowH);
    if (row < 0 || row >= rows) continue;
    const shift = row % 2 ? cell / 2 : 0, dy = fy - (row + 0.5) * rowH;
    for (let x = 0; x < w; x++) {
      const fx = (x + 0.5) / res, k = Math.floor((fx + shift) / cell);
      if (k < 0 || k >= cols) continue;
      const r = R[row * cols + k];
      if (r === 0) continue;
      const dx = fx - (k + 0.5) * cell + shift;
      const t = Math.min(1, Math.max(0, (Math.sqrt(dx * dx + dy * dy) - r + AA) / (2 * AA)));
      const a = 1 - t * t * (3 - 2 * t);
      if (a <= 0) continue;
      const i = y * w + x;
      A[i] = a * 255 + 0.5;
      O[i] = owner[row * cols + k];
      if ((y + 0.5) / res >= G.cut * figH) {
        const sp = spans.get(row);
        if (sp) { if (fx < sp[0]) sp[0] = fx; if (fx > sp[1]) sp[1] = fx; } else spans.set(row, [fx, fx, figH - (row + 0.5) * rowH]);
      }
    }
  }

  /* One sprite: a tight canvas, its pale backing, and its pixels of ink. A pixel near the sprite's border also counts when a
     close neighbour of this sprite's ink, it comes along: sprites overlap by a hair, or resampled apart they would leave a line. */
  const grow = Math.max(1, Math.round(res * 0.5));
  const ink = document.createElement("canvas").getContext("2d");
  const sprite = (id, u0, v0, u1, v1, backing) => {
    // even borders: the first mipmap level, which is what shows at rest, then lands exactly on the screen's pixels
    const x0 = Math.max(0, Math.floor(u0 * w)) & ~1, y0 = Math.max(0, Math.floor(v0 * h)) & ~1;
    const x1 = Math.min(w, (Math.ceil(u1 * w) + 1) & ~1), y1 = Math.min(h, (Math.ceil(v1 * h) + 1) & ~1);
    const sw = x1 - x0, sh = y1 - y0;
    const cv = document.createElement("canvas");
    cv.width = sw; cv.height = sh;
    const c = cv.getContext("2d");
    if (backing) {
      c.save();
      c.scale(res, res);
      c.translate(-x0 / res, -y0 / res);
      c.fillStyle = "#E6FF99";
      backing(c);
      c.restore();
    }
    if (id >= 0) {
      const im = new ImageData(sw, sh), px = im.data;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = y * w + x, a = A[i];
          if (a === 0) continue;
          // the cheek stays where it is when the ramus swings away: the cranium keeps a copy of the rami's dots
          if (O[i] !== id && !(id === CRANIUM && O[i] === MANDIBLE && y < cutPx)) {
            const near = (x >= grow && O[i - grow] === id && A[i - grow]) || (x < w - grow && O[i + grow] === id && A[i + grow])
              || (y >= grow && O[i - grow * w] === id && A[i - grow * w]) || (y < h - grow && O[i + grow * w] === id && A[i + grow * w]);
            if (!near) continue;
          }
          const o = ((y - y0) * sw + (x - x0)) * 4;
          px[o] = px[o + 1] = px[o + 2] = 0x1a; // the portrait's ink
          px[o + 3] = a;
        }
      }
      ink.canvas.width = sw; ink.canvas.height = sh;
      ink.putImageData(im, 0, 0);
      c.drawImage(ink.canvas, 0, 0);
    }
    return { cv, u0: x0 / w, v0: y0 / h, u1: x1 / w, v1: y1 / h };
  };

  const edge = cell * 0.6 / figW; // a tooth's backing stops short of its neighbour's jagged edge
  const toothBack = (run, v0, v1, tipAtBottom) => (c) => {
    const x = (run[0] - edge) * figW, wd = (run[1] - run[0] + edge * 2) * figW, y = v0 * figH, ht = (v1 - v0) * figH;
    const rr = wd * 0.26;
    c.beginPath();
    if (tipAtBottom) c.roundRect(x, y, wd, ht, [0, 0, rr, rr]); else c.roundRect(x, y, wd, ht, [rr, rr, 0, 0]);
    c.fill();
  };
  const toothInk = G.cut;
  const out = { res, cell, rowH, upper: [], lower: [], upperCols, lowerCols, upperRuns, lowerRuns };
  await breath();
  out.cranium = sprite(CRANIUM, 0, 0, 1, G.cut + 0.02, (c) => { c.fillRect(upperCols[0][0] * figW, G.upperGum[0] * figH, (upperCols[7][1] - upperCols[0][0]) * figW, (G.upperGum[1] - G.upperGum[0]) * figH); });
  await breath();
  out.mandible = sprite(MANDIBLE, 0, G.ramusTop - 0.01, 1, 1, (c) => {
    // pale under the jaw bone, but not under the teeth's row: there the cavity has to show between the teeth
    for (const [x0, x1, y] of spans.values()) {
      const v = y / figH;
      // never above the bite line: there it would cover the cranium's ink and draw a pale line across the closed mouth
      const top = Math.max(y - cell * 0.6, (G.cut * figH) + 1), ht = y + cell * 0.6 - top;
      if (ht <= 0) continue;
      if (v >= G.lowerRoot - 0.004) c.fillRect(x0, top, x1 - x0, ht);
      else {
        const a = lowerCols[0][0] * figW, b = lowerCols[7][1] * figW;
        if (a > x0) c.fillRect(x0, top, a - x0, ht);
        if (x1 > b) c.fillRect(b, top, x1 - b, ht);
      }
    }
  });
  for (let i = 0; i < 8; i++) {
    const [a, b] = upperCols[i], run = upperRuns[i];
    out.upper.push(sprite(UPPER + i, a - 0.012, G.upperRootTop, b + 0.012, G.cut + 0.012, toothBack(run, G.upperRootTop, G.cut - 0.004, true)));
    const [c0, c1] = lowerCols[i], lr = lowerRuns[i];
    out.lower.push(sprite(LOWER + i, c0 - 0.012, G.cut - 0.012, c1 + 0.012, G.lowerRootEnd, toothBack(lr, G.cut + 0.004, G.lowerRootEnd, false)));
    await breath();
  }

  /* ----- what the portrait does not have, on the same grid and in the same ink ----- */
  const onGrid = (c, u0, v0, u1, v1, fn) => {
    for (let row = 0; row < rows + 40; row++) {
      const shift = row % 2 ? cell / 2 : 0, cy = figH - (row + 0.5) * rowH;
      if (cy < (v0 * figH - cell) || cy > v1 * figH + cell) continue;
      for (let k = -2; k < cols + 2; k++) {
        const cx = (k + 0.5) * cell - shift;
        if (cx < u0 * figW - cell || cx > u1 * figW + cell) continue;
        fn(cx, cy, cx / figW, cy / figH, row);
      }
    }
  };
  const dots = (c, list) => {
    c.beginPath();
    for (let i = 0; i < list.length; i += 3) { c.moveTo(list[i] + list[i + 2], list[i + 1]); c.arc(list[i], list[i + 1], list[i + 2], 0, 6.2832); }
    c.fill();
  };
  const CV = G.cavity;
  out.cavity = sprite(-1, CV.u0, CV.v0, CV.u1, CV.v1, (c) => {
    // a U that stays inside the jaw bone's outline at every opening
    const cx = 0.5 * figW, top = CV.v0 * figH, hw = (CV.u1 - CV.u0) * 0.5 * figW, bot = CV.v1 * figH;
    c.beginPath();
    c.moveTo(cx - hw, top);
    c.lineTo(cx + hw, top);
    c.bezierCurveTo(cx + hw, top + (bot - top) * 0.55, cx + hw * 0.55, bot, cx, bot);
    c.bezierCurveTo(cx - hw * 0.55, bot, cx - hw, top + (bot - top) * 0.55, cx - hw, top);
    c.save();
    c.clip();
    c.fillStyle = "#000000";
    c.fillRect(cx - hw, top, hw * 2, bot - top);
    const inks = [], pale = [], lime = [];
    onGrid(c, CV.u0, CV.v0, CV.u1, CV.v1, (x, y, u, v, row) => {
      const ny = (v - G.cut) / (CV.v1 - G.cut);
      // depth: the ink dots get denser toward the throat
      inks.push(x, y, cell * (0.26 + 0.3 * Math.min(1, Math.max(0, ny * 1.5))));
      // the palate, seen from below: pale ridges right behind the upper teeth, fading into the dark
      const arch = 1 - Math.abs((u - 0.5) / ((CV.u1 - CV.u0) * 0.5));
      const pal = Math.max(0, 1 - ny / 0.3) * (0.62 + 0.38 * Math.sin(row * 1.05)) * Math.min(1, arch * 2.4);
      if (pal > 0.06) pale.push(x, y, cell * 0.42 * Math.sqrt(pal));
      // the throat: a faint toxic glow far back
      const d = Math.hypot((u - 0.5) / 0.1, (ny - 0.52) / 0.24), g = Math.exp(-d * d);
      if (g > 0.06) lime.push(x, y, cell * 0.44 * Math.sqrt(g));
    });
    c.fillStyle = "#1A1A1A"; dots(c, inks);
    c.globalAlpha = 0.5; c.fillStyle = "#E6FF99"; dots(c, pale);
    c.globalAlpha = 0.78; c.fillStyle = "#B8FF00"; dots(c, lime);
    c.restore();
  });
  // the gums of the close-up: pale, running into solid ink away from the teeth
  const gum = (v0, v1, darkAtTop) => sprite(-1, upperCols[0][0] - 0.02, v0, upperCols[7][1] + 0.02, v1, (c) => {
    const x0 = (upperCols[0][0] - 0.02) * figW, x1 = (upperCols[7][1] + 0.02) * figW;
    c.fillRect(x0, v0 * figH, x1 - x0, (v1 - v0) * figH);
    const list = [];
    onGrid(c, upperCols[0][0] - 0.02, v0, upperCols[7][1] + 0.02, v1, (x, y, u, v) => {
      const t = (v - v0) / (v1 - v0), side = Math.abs(u - 0.5) / ((upperCols[7][1] - upperCols[0][0]) * 0.5 + 0.02);
      const d = Math.max(darkAtTop ? 1 - t : t, (side - 0.8) / 0.2);
      if (d > 0.22) list.push(x, y, cell * 0.74 * Math.sqrt(Math.min(1, (d - 0.22) / 0.78)));
    });
    c.fillStyle = "#1A1A1A"; dots(c, list);
  });
  out.gumU = gum(G.upperRootTop - 0.1, G.upperRootTop + 0.012, true);
  out.gumL = gum(G.lowerRootEnd - 0.012, G.lowerRootEnd + 0.1, false);
  return out;
}

/** No-WebGL fallback: hex-packed round dots on a still canvas, at twice the size it is shown for crisp retina edges. */
export async function drawSkullMosaic(canvas, { cols = 112 } = {}) {
  const img = await loadSkullTone();
  const W = img.naturalWidth, H = img.naturalHeight;
  const src = document.createElement("canvas");
  src.width = W; src.height = H;
  const sc = src.getContext("2d");
  sc.drawImage(img, 0, 0);
  const tone = sc.getImageData(0, 0, W, H).data;

  const size = 1280;
  canvas.width = size;
  canvas.height = Math.round(size * (H / W));
  const c = canvas.getContext("2d");
  const cell = size / cols, rowH = cell * 0.866;
  const rows = Math.ceil(canvas.height / rowH);
  c.fillStyle = INK;
  c.beginPath();
  for (let y = 0; y < rows; y++) {
    const off = y % 2 ? cell / 2 : 0;
    for (let x = -1; x <= cols; x++) {
      const px = (x + 0.5) * cell + off, py = (y + 0.5) * rowH;
      if (px < 0 || px >= size) continue;
      const sx = Math.floor((px / size) * W), sy = Math.min(H - 1, Math.floor((py / canvas.height) * H));
      const dark = 1 - tone[(sy * W + sx) * 4] / 255;
      if (dark < 0.06) continue;
      const r = cell * 0.62 * Math.sqrt(dark);
      c.moveTo(px + r, py);
      c.arc(px, py, r, 0, Math.PI * 2);
    }
  }
  c.fill();
}

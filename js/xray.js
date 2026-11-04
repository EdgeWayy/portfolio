/* The "UV X-ray blob" on the portrait: what it shows and everything around the WebGL shader.
     makeMask()      a texture for the shader. R / G: where the portrait / skull tone map is background (flood-filled from
                     the corners, so the white around the head stays dark in the X-ray), B: the hidden details.
     initStillBlob() the same X-ray without WebGL (reduced motion, weak phones): a still picture in a soft blob.
     initPupils()    ACID: small lime pupils in the skull's sockets that look at the pointer anywhere on the screen.
   Positions are shares of the 4:5 image. The skull's sockets were measured on public/img/skull-tone.webp. */
import { gsap } from "gsap";

export const SOCKETS = [[0.347, 0.468], [0.69, 0.468]];
export const PALETTE = {
  acid: { bg: "#000000", ink: "#B8FF00", hi: "#E6FF99", shadow: "#1F3A00" },
  autumn: { bg: "#140A03", ink: "#FF7A00", hi: "#FFC46B", shadow: "#3A1A00" },
};

/** Share of the image's pixels that are background: 1 where the corners can reach through near-white. */
function background(img, W, H, thr) {
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d", { willReadFrequently: true });
  c.drawImage(img, 0, 0, W, H);
  const d = c.getImageData(0, 0, W, H).data;
  const seen = new Uint8Array(W * H);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (seen[i] || d[i * 4] < thr) return;
    seen[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const i = stack.pop(), x = i % W, y = (i - x) / W;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  return seen;
}

function channel(seen, W, H, r, g) {
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  const im = c.createImageData(W, H);
  for (let i = 0; i < seen.length; i++) {
    im.data[i * 4] = seen[i] ? r : 0;
    im.data[i * 4 + 1] = seen[i] ? g : 0;
    im.data[i * 4 + 3] = 255;
  }
  c.putImageData(im, 0, 0);
  return cv;
}

const line = (c, pts) => {
  c.beginPath();
  pts.forEach(([x, y], i) => c[i ? "lineTo" : "moveTo"](x, y));
  c.stroke();
};

/* Only what exists inside the blob. ACID: cracks in the bone and a small brain. */
function detailsAcid(c, w, h) {
  const P = (pts) => pts.map(([x, y]) => [x * w, y * h]);
  c.lineWidth = w * 0.0065;
  line(c, P([[0.27, 0.1], [0.31, 0.15], [0.27, 0.19], [0.32, 0.25], [0.29, 0.29]]));
  line(c, P([[0.31, 0.15], [0.37, 0.17], [0.4, 0.14]]));
  line(c, P([[0.27, 0.19], [0.21, 0.22], [0.2, 0.27]]));
  line(c, P([[0.84, 0.3], [0.78, 0.33], [0.8, 0.37]]));
  line(c, P([[0.5, 0.62], [0.47, 0.67], [0.51, 0.7]]));
  // the brain: a lumpy outline with folds, in the middle of the forehead
  const cx = 0.42 * w, cy = 0.2 * h, rx = 0.1 * w, ry = 0.075 * h;
  c.lineWidth = w * 0.0055;
  c.beginPath();
  for (let a = 0; a <= 6.3; a += 0.06) {
    const k = 1 + Math.sin(a * 9) * 0.07;
    const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
    c[a ? "lineTo" : "moveTo"](x, y);
  }
  c.closePath();
  c.stroke();
  line(c, [[cx, cy - ry * 0.9], [cx, cy + ry * 0.9]]);
  for (const s of [-1, 1]) {
    c.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = cx + s * rx * (0.16 + t * 0.66), y = cy - ry * 0.45 + Math.sin(t * 15) * ry * 0.2;
      c[i ? "lineTo" : "moveTo"](x, y);
    }
    c.stroke();
    c.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = cx + s * rx * (0.16 + t * 0.6), y = cy + ry * 0.35 + Math.sin(t * 13 + 1) * ry * 0.2;
      c[i ? "lineTo" : "moveTo"](x, y);
    }
    c.stroke();
  }
}

/* Autumn: a leaf skeleton on the forehead and veins through the face and neck. */
function detailsAutumn(c, w, h) {
  const P = (pts) => pts.map(([x, y]) => [x * w, y * h]);
  c.lineWidth = w * 0.0055;
  const lx = 0.5, ly = 0.3, len = 0.13;
  c.save();
  c.translate(lx * w, ly * h);
  c.rotate(-0.5);
  const L = len * w;
  c.beginPath();
  c.moveTo(0, L);
  c.bezierCurveTo(L * 0.62, L * 0.55, L * 0.55, -L * 0.45, 0, -L);
  c.bezierCurveTo(-L * 0.55, -L * 0.45, -L * 0.62, L * 0.55, 0, L);
  c.stroke();
  line(c, [[0, L * 1.35], [0, -L]]);
  for (let i = 0; i < 5; i++) {
    const y = L * (0.62 - i * 0.32), span = L * (0.42 - Math.abs(i - 1.6) * 0.06);
    line(c, [[0, y], [span, y - L * 0.22]]);
    line(c, [[0, y], [-span, y - L * 0.22]]);
  }
  c.restore();
  line(c, P([[0.42, 0.68], [0.44, 0.58], [0.4, 0.5], [0.34, 0.45]]));
  line(c, P([[0.44, 0.58], [0.5, 0.52]]));
  line(c, P([[0.56, 0.72], [0.56, 0.62], [0.62, 0.54], [0.66, 0.47]]));
  line(c, P([[0.56, 0.62], [0.5, 0.58]]));
  line(c, P([[0.47, 0.82], [0.46, 0.72], [0.51, 0.66]]));
}

/** toneImg and skullImg as image elements. Both background channels stay; the details follow the theme. */
export function makeMask(toneImg, skullImg, acid) {
  const W = 512, H = 640;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  c.fillStyle = "#000";
  c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = "lighter";
  const sw = 144, sh = 180;
  c.drawImage(channel(background(toneImg, sw, sh, 225), sw, sh, 255, 0), 0, 0, W, H);
  if (skullImg) c.drawImage(channel(background(skullImg, sw, sh, 225), sw, sh, 0, 255), 0, 0, W, H);
  c.strokeStyle = "#0000FF";
  c.lineJoin = "round";
  c.lineCap = "round";
  (acid ? detailsAcid : detailsAutumn)(c, W, H);
  return cv;
}

/* ---------- without WebGL: the same picture, still, inside a soft blob ---------- */
function drawStill(cv, toneImg, skullImg, acid) {
  const pal = PALETTE[acid ? "acid" : "autumn"];
  const img = acid && skullImg ? skullImg : toneImg;
  const W = 720, H = 900;
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  const src = document.createElement("canvas");
  src.width = 144; src.height = 180;
  const sc = src.getContext("2d", { willReadFrequently: true });
  sc.drawImage(img, 0, 0, 144, 180);
  const tone = sc.getImageData(0, 0, 144, 180).data;
  const out = background(img, 144, 180, 225);
  c.fillStyle = pal.bg;
  c.fillRect(0, 0, W, H);
  c.fillStyle = pal.ink;
  c.beginPath();
  const cell = 9, rowH = cell * 0.866;
  for (let r = 0; r * rowH < H; r++) {
    for (let k = -1; k * cell < W; k++) {
      const x = (k + 0.5) * cell + (r % 2 ? cell / 2 : 0), y = (r + 0.5) * rowH;
      const sx = Math.max(0, Math.min(143, Math.floor((x / W) * 144))), sy = Math.max(0, Math.min(179, Math.floor((y / H) * 180)));
      const i = sy * 144 + sx;
      if (out[i]) continue;
      const v = tone[i * 4] / 255;
      if (v < 0.05) continue;
      const rad = cell * 0.43 * Math.sqrt(v);
      c.moveTo(x + rad, y);
      c.arc(x, y, rad, 0, 6.3);
    }
  }
  c.fill();
  c.strokeStyle = pal.hi;
  c.lineJoin = "round";
  c.lineCap = "round";
  (acid ? detailsAcid : detailsAutumn)(c, W, H);
  // the hidden details only exist on the bone: the background goes back over whatever reached past it
  c.fillStyle = pal.bg;
  for (let i = 0; i < out.length; i++) if (out[i]) c.fillRect((i % 144) * 5, Math.floor(i / 144) * 5, 5, 5);
}

/** Returns { state() } so the cursor can tell whether it is over the blob, or null if there is no portrait. */
export function initStillBlob(figure, { loadTone, loadSkull, isAcid, onTheme, isHeld }) {
  const blob = document.createElement("div");
  blob.className = "hero__xray";
  blob.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas");
  blob.append(cv);
  figure.append(blob);
  const st = { x: 0, y: 0, on: false, r: 0 };
  let ready = null;
  const paint = async () => {
    const [tone, skull] = await Promise.all([loadTone(), loadSkull().catch(() => null)]);
    drawStill(cv, tone, skull, isAcid());
  };
  // pointer events only store: the rect is read and the styles are written once a frame at most
  let rect = null, last = null, pending = 0;
  const markRect = () => { rect = null; };
  window.addEventListener("scroll", markRect, { passive: true, capture: true });
  window.addEventListener("resize", markRect, { passive: true });
  const place = () => {
    pending = 0;
    if (!last) return;
    const r = (rect ??= figure.getBoundingClientRect());
    const R = Math.max(56, Math.min(110, r.width * 0.2));
    st.x = last.x; st.y = last.y; st.r = R;
    const x = last.x - r.left, y = last.y - r.top;
    blob.style.width = blob.style.height = `${R * 2}px`;
    blob.style.transform = `translate3d(${(x - R).toFixed(1)}px,${(y - R).toFixed(1)}px,0)`;
    cv.style.width = `${r.width}px`;
    cv.style.height = `${r.height}px`;
    cv.style.transform = `translate3d(${(R - x).toFixed(1)}px,${(R - y).toFixed(1)}px,0)`;
  };
  const show = (e) => {
    ready ??= paint().catch((err) => console.warn("xray:", err));
    last = { x: e.clientX, y: e.clientY };
    pending ||= requestAnimationFrame(place);
    st.on = !isHeld();
    blob.classList.toggle("is-on", st.on);
  };
  const hide = () => { st.on = false; blob.classList.remove("is-on"); };
  let timer = 0;
  figure.addEventListener("pointermove", (e) => { clearTimeout(timer); show(e); });
  figure.addEventListener("pointerdown", (e) => { clearTimeout(timer); show(e); });
  // a quick trip over the edge is not a leave
  figure.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { clearTimeout(timer); timer = setTimeout(hide, 100); } });
  figure.addEventListener("pointercancel", hide);
  figure.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") timer = setTimeout(hide, 1400); });
  onTheme(() => { if (ready) ready = paint().catch((err) => console.warn("xray:", err)); });
  return { state: () => ({ x: st.x, y: st.y, r: st.r, on: st.on }), hide };
}

/* ---------- the skull's eyes ---------- */
export function initPupils(figure, { reduce }) {
  const pupils = SOCKETS.map(([x, y]) => {
    const el = document.createElement("i");
    el.className = "hero__pupil";
    el.setAttribute("aria-hidden", "true");
    el.style.left = `${x * 100}%`;
    el.style.top = `${y * 100}%`;
    figure.append(el);
    return {
      el, ax: x, ay: y,
      sx: gsap.quickTo(el, "x", { duration: reduce ? 0 : 0.35, ease: "power3" }),
      sy: gsap.quickTo(el, "y", { duration: reduce ? 0 : 0.35, ease: "power3" }),
    };
  });
  // pointer events only store where it is; the rect is read again only after a scroll or a resize
  let rect = null, px = 0, py = 0, pending = 0;
  const markRect = () => { rect = null; };
  window.addEventListener("scroll", markRect, { passive: true, capture: true });
  window.addEventListener("resize", markRect, { passive: true });
  const update = () => {
    pending = 0;
    if (document.documentElement.dataset.theme !== "acid") return;
    rect ??= figure.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const reach = rect.width * 0.052; // stays inside the socket
    for (const p of pupils) {
      const dx = px - (rect.left + p.ax * rect.width), dy = py - (rect.top + p.ay * rect.height);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 180) * reach;
      p.sx((dx / d) * k);
      p.sy((dy / d) * k * 0.8);
    }
  };
  const look = (e) => { px = e.clientX; py = e.clientY; pending ||= requestAnimationFrame(update); };
  window.addEventListener("pointermove", look, { passive: true });
  window.addEventListener("pointerdown", look, { passive: true });
}

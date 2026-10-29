/* Hero portrait: a grid of eight-point stars (khatam) drawn by one fragment shader.
   Star size = darkness of the photo. The pointer is a lens that shows the original photo,
   the grid bulges around it. Scrolling grows and turns the stars until the portrait dissolves.
   Loaded lazily; the static halftone <img> stays as the fallback. */
import {
  WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, Mesh, ShaderMaterial,
  TextureLoader, Vector2, Vector3, LinearFilter, LinearSRGBColorSpace,
} from "three";

const vertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D uTone;
uniform sampler2D uPhoto;
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uMouse;
uniform float uLens;
uniform float uHover;
uniform float uTime;
uniform float uScroll;
uniform float uIntro;
uniform float uCell;
uniform vec3 uInk;
uniform vec3 uRing;
varying vec2 vUv;

const float IMG_ASPECT = 0.8; // 4:5 portrait

vec2 coverUv(vec2 uv) {
  float ca = uRes.x / uRes.y;
  vec2 s = ca > IMG_ASPECT ? vec2(1.0, IMG_ASPECT / ca) : vec2(ca / IMG_ASPECT, 1.0);
  return (uv - 0.5) * s + 0.5;
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sdBox(vec2 p, float r) { vec2 d = abs(p) - vec2(r); return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
// octagram: two squares turned 45 degrees to each other
float star(vec2 p, float r, float a) {
  p = rot(a) * p;
  return min(sdBox(p, r * 0.7071), sdBox(rot(0.785398) * p, r * 0.7071));
}

void main() {
  vec2 frag = vUv * uRes;
  vec2 dm = frag - uMouse;
  float dist = length(dm);
  float sigma = uLens * 1.7;
  float field = exp(-dist * dist / (2.0 * sigma * sigma)) * uHover;

  float cell = uCell * (1.0 + uScroll * 1.8);
  vec2 p = frag - normalize(dm + 1e-4) * field * cell * 1.1;   // bulge around the pointer
  vec2 id = floor(p / cell);
  vec2 center = (id + 0.5) * cell;
  vec2 local = p - center;

  vec2 cuv = coverUv(center / uRes);
  float tone = texture2D(uTone, cuv).r;
  if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) tone = 1.0;
  float dark = 1.0 - tone;

  // intro: stars grow from the face outward
  float d0 = length((center / uRes - vec2(0.5, 0.58)) * vec2(1.0, 1.25));
  float grow = smoothstep(0.0, 0.22, uIntro * 1.5 - d0);

  float wob = sin(uTime * 1.3 + id.x * 0.7 + id.y * 0.45) * 0.06;
  float edge = smoothstep(0.02, 0.2, cuv.y);               // fade out the shirt edge
  float r = cell * 0.5 * pow(dark, 0.62) * (1.1 + wob) * grow * edge * (1.0 + field * 0.4);
  float ang = dark * 0.7 + uTime * 0.12 + field * 1.8 + uScroll * 2.2;
  float sd = star(local, r, ang);
  float a = (1.0 - smoothstep(-0.9 * uDpr, 0.9 * uDpr, sd)) * step(0.06, dark);
  vec4 col = vec4(uInk * a, a);

  float lensR = uLens * uHover;
  if (lensR > 1.0) {
    float inLens = 1.0 - smoothstep(lensR - 1.5 * uDpr, lensR + 1.5 * uDpr, dist);
    vec3 ph = texture2D(uPhoto, coverUv(vUv)).rgb;
    col = mix(col, vec4(ph, 1.0), inLens);
    float ring = 1.0 - smoothstep(1.2 * uDpr, 2.6 * uDpr, abs(dist - lensR));
    col = mix(col, vec4(uRing, 1.0), ring);
  }
  gl_FragColor = col * (1.0 - smoothstep(0.55, 1.0, uScroll));
}
`;

const hex = (h) => new Vector3(...[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255));

export async function initHeroGL(figure, { toneUrl, photoUrl, coarse }) {
  const canvas = figure.querySelector("canvas");
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.outputColorSpace = LinearSRGBColorSpace; // colors pass through untouched (flat brand colors)
  renderer.setClearColor(0x000000, 0);

  const loader = new TextureLoader();
  const [tone, photo] = await Promise.all([loader.loadAsync(toneUrl), loader.loadAsync(photoUrl)]);
  for (const tx of [tone, photo]) { tx.minFilter = LinearFilter; tx.magFilter = LinearFilter; tx.generateMipmaps = false; }

  const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75);
  const u = {
    uTone: { value: tone }, uPhoto: { value: photo },
    uRes: { value: new Vector2(1, 1) }, uDpr: { value: dpr },
    uMouse: { value: new Vector2(-9999, -9999) }, uLens: { value: 90 }, uHover: { value: 0 },
    uTime: { value: 0 }, uScroll: { value: 0 }, uIntro: { value: 0 }, uCell: { value: 11 },
    uInk: { value: hex("#1B3BD1") }, uRing: { value: hex("#FF5A1F") },
  };
  const material = new ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms: u, transparent: true, depthTest: false });
  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // smoothed pointer state
  const target = { x: 0, y: 0, hover: 0 };
  const cur = { x: 0, y: 0, hover: 0 };
  let w = 1, h = 1;

  function resize() {
    const r = figure.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    u.uRes.value.set(w * dpr, h * dpr);
    // ~70 stars across on desktop, fewer on phones (bigger, clearer stars)
    u.uCell.value = Math.max(6, Math.min(12, w / (coarse ? 52 : 74))) * dpr;
    u.uLens.value = Math.max(56, Math.min(130, w * 0.2)) * dpr;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(figure);
  resize();

  function setPointer(clientX, clientY) {
    const r = figure.getBoundingClientRect();
    target.x = (clientX - r.left) * dpr;
    target.y = (r.height - (clientY - r.top)) * dpr;
  }

  let idleTimer = 0;
  figure.addEventListener("pointermove", (e) => { setPointer(e.clientX, e.clientY); target.hover = 1; clearTimeout(idleTimer); });
  figure.addEventListener("pointerdown", (e) => { setPointer(e.clientX, e.clientY); target.hover = 1; if (!cur.hover) { cur.x = target.x; cur.y = target.y; } });
  figure.addEventListener("pointerleave", () => { target.hover = 0; });
  figure.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") idleTimer = setTimeout(() => (target.hover = 0), 1400); });

  // visible + tab active = render
  let visible = true, running = false, last = performance.now(), sweep = null;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }, { rootMargin: "100px" }).observe(figure);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });

  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    u.uTime.value += dt;
    if (sweep) {
      const t = (now - sweep.t0) / sweep.dur;
      if (t >= 1) { sweep = null; target.hover = 0; }
      else {
        // a slow figure-eight over the face
        const a = t * Math.PI * 2;
        target.x = (0.5 + Math.sin(a) * 0.22) * w * dpr;
        target.y = (0.6 + Math.sin(a * 2) * 0.08) * h * dpr;
        target.hover = t < 0.12 ? t / 0.12 : t > 0.85 ? (1 - t) / 0.15 : 1;
      }
    }
    const k = 1 - Math.pow(0.0008, dt);           // frame-rate independent smoothing
    if (cur.hover < 0.01 && target.hover > 0) { cur.x = target.x; cur.y = target.y; }
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    cur.hover += (target.hover - cur.hover) * (1 - Math.pow(0.004, dt));
    u.uMouse.value.set(cur.x, cur.y);
    u.uHover.value = cur.hover;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }
  start();

  return {
    intro(duration = 1.6) {
      return new Promise((done) => {
        const t0 = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - t0) / (duration * 1000));
          u.uIntro.value = 1 - Math.pow(1 - t, 3);
          if (t < 1) requestAnimationFrame(step); else done();
        };
        requestAnimationFrame(step);
      });
    },
    sweep(dur = 2600) { sweep = { t0: performance.now(), dur }; },
    setScroll(v) { u.uScroll.value = v; },
    dispose() { ro.disconnect(); renderer.dispose(); },
  };
}

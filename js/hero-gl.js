/* Hero portrait: a grid of eight-point stars (khatam) drawn by one fragment shader.
   Star size = darkness of the tone map. The pointer carries the "UV X-ray blob": a wobbling drop of slime that shows the
   same picture as an X-ray, with details that only exist inside it (js/xray.js). Scrolling grows and turns the stars until the portrait dissolves.
   Raw WebGL (one full-screen quad, no library), loaded lazily; the static halftone <img> stays as the fallback.
   ACID theme: a second tone map (the skull, js/skull.js) is morphed in star by star. The same grid tightens and shifts
   into hex rows while each star rounds into a dot, so the portrait's mosaic becomes a printed halftone.
   setHold() drives the same morph from the star's hold (js/hold-morph.js), with a glitch and a lime tint from the edges.
   The blob: pointer events only store coordinates; one frame loop does everything else. Its X-ray picture is rendered once
   into a texture (xrayFragment below, again only when the theme, the size or the morph changes), and each frame only reveals it. */
import { loadSkullTone } from "./skull.js";
import { makeMask, PALETTE, SOCKETS } from "./xray.js";

const vertex = /* glsl */ `
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTone;
uniform sampler2D uSkull;
uniform sampler2D uMask;
uniform sampler2D uXray;
uniform float uMorph;
uniform vec2 uRes;      // the figure, in device px
uniform vec2 uCanvas;   // the canvas: the figure plus room for the blob on every side
uniform vec2 uPad;      // that room
uniform float uDpr;
uniform vec2 uMouse;
uniform float uBlobR;
uniform float uHover;
uniform mat2 uStretch;
uniform float uHold;
uniform float uTint;
uniform float uSpider;
uniform vec2 uEye;
uniform vec3 uXInk;
uniform vec3 uXHi;
uniform vec3 uXShadow;
uniform float uTime;
uniform float uScroll;
uniform float uIntro;
uniform float uCell;
uniform vec3 uInk;
varying vec2 vUv;

const float IMG_ASPECT = 0.8; // 4:5 portrait

vec2 coverUv(vec2 uv) {
  float ca = uRes.x / uRes.y;
  vec2 s = ca > IMG_ASPECT ? vec2(1.0, IMG_ASPECT / ca) : vec2(ca / IMG_ASPECT, 1.0);
  return (uv - 0.5) * s + 0.5;
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// every star changes at its own moment, so the skull spreads through the mosaic
float cellMorph(vec2 id) { return smoothstep(0.0, 1.0, clamp(uMorph * 1.7 - hash(id) * 0.7, 0.0, 1.0)); }
float sdBox(vec2 p, float r) { vec2 d = abs(p) - vec2(r); return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
// octagram: two squares turned 45 degrees to each other
float star(vec2 p, float r, float a) {
  p = rot(a) * p;
  return min(sdBox(p, r * 0.7071), sdBox(rot(0.785398) * p, r * 0.7071));
}

float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}
// the spider in the eye socket, in image units (x and y on the same scale)
float spider(vec2 q, float t) {
  float d = min(length(q) - 0.0085, length(q - vec2(0.0, 0.012)) - 0.0058);
  for (int i = 0; i < 4; i++) {
    float f = float(i);
    float y = -0.006 + f * 0.0058;
    float swing = sin(t * 9.0 + f * 1.7) * 0.0028;
    for (int s = 0; s < 2; s++) {
      float k = s == 0 ? -1.0 : 1.0;
      vec2 knee = vec2(k * 0.015, y + 0.0085 - f * 0.0007 + swing * k);
      vec2 foot = vec2(k * 0.024, y - 0.0075 + f * 0.0048 - swing * k);
      d = min(d, min(sdSeg(q, vec2(0.0, y * 0.6), knee), sdSeg(q, knee, foot)));
    }
  }
  return d;
}

void main() {
  vec2 frag = vUv * uCanvas - uPad; // everything below is measured from the figure's corner
  vec2 dm = uStretch * (frag - uMouse);
  float dist = length(dm);

  float cell = uCell * (1.0 + uScroll * 1.8);
  vec2 p = frag;
  if (uHold > 0.02) { // the hold: thin bands of the mosaic jump sideways, more and more often
    float band = floor(frag.y / (15.0 * uDpr));
    float g = step(0.97 - uHold * 0.13, hash(vec2(band, floor(uTime * 13.0))));
    p.x += g * (hash(vec2(band, 3.0)) - 0.5) * cell * 3.2 * uHold;
  }
  // square grid for the portrait, hex-packed rows for the skull
  float rowH = cell * mix(1.0, 0.866, uMorph);
  float row = floor(p.y / rowH);
  float shift = mod(row, 2.0) * 0.5 * cell * uMorph;
  vec2 id = vec2(floor((p.x + shift) / cell), row);
  vec2 center = vec2((id.x + 0.5) * cell - shift, (row + 0.5) * rowH);
  vec2 local = p - center;

  vec2 cuv = coverUv(center / uRes);
  float m = cellMorph(id);
  float tone = mix(texture2D(uTone, cuv).r, texture2D(uSkull, cuv).r, m);
  if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) tone = 1.0;
  float dark = 1.0 - tone;

  // intro: stars grow from the face outward
  float d0 = length((center / uRes - vec2(0.5, 0.58)) * vec2(1.0, 1.25));
  float grow = smoothstep(0.0, 0.22, uIntro * 1.5 - d0);

  float wob = sin(uTime * 1.3 + id.x * 0.7 + id.y * 0.45) * 0.06;
  float edge = mix(smoothstep(0.02, 0.2, cuv.y), 1.0, m);  // fade out the shirt edge (the skull has none)
  float r = cell * 0.5 * pow(dark, 0.62) * (1.1 + wob) * grow * edge;
  // skull: dot area follows the tone, and the darkest dots grow together into solid black
  float rSkull = cell * (0.6 * sqrt(dark) + 0.2 * smoothstep(0.82, 1.0, dark)) * grow;
  r = mix(r, rSkull, m);
  float ang = dark * 0.7 + uTime * 0.12 + uScroll * 2.2 + m * (1.0 - m) * 7.0; // a star spins while it changes
  float sd = mix(star(local, r, ang), length(local) - r, m);
  float a = (1.0 - smoothstep(-0.9 * uDpr, 0.9 * uDpr, sd)) * step(0.06, dark);
  vec4 col = vec4(uInk * a, a);

  if (uTint > 0.001) { // lime creeping in from the edges of the portrait
    vec2 fv = frag / uRes, e = min(fv, 1.0 - fv);
    float rim = min(e.x, e.y) + sin(frag.x * 0.021 / uDpr + uTime * 1.5) * 0.009 + sin(frag.y * 0.017 / uDpr - uTime) * 0.009;
    float reach = uTint * uTint * 0.075 - 0.004; // flat and wavy, like slime coming in over the edge
    col = mix(col, vec4(0.722, 1.0, 0.0, 1.0), (1.0 - smoothstep(reach - 0.002, reach + 0.002, rim)) * step(0.0, e.x) * step(0.0, e.y));
  }

  if (uHover > 0.004) { // the blob
    float a2 = atan(dm.y, dm.x);
    float R = uBlobR * uHover * (1.0 + sin(uTime * 1.5) * 0.035
      + sin(a2 * 2.0 + uTime * 0.9) * 0.085 + sin(a2 * 3.0 - uTime * 1.6 + 1.0) * 0.07 + sin(a2 * 5.0 + uTime * 2.2) * 0.04);
    float sb = dist - R;
    // a soft dark-green (or brown) shade on what is around it
    float sh = (1.0 - smoothstep(0.0, 15.0 * uDpr, sb)) * 0.5;
    col = mix(col, vec4(uXShadow, 1.0), sh * step(0.0, sb));
    float inB = 1.0 - smoothstep(-1.2 * uDpr, 0.6 * uDpr, sb);
    if (inB > 0.0) {
      vec2 fuv = coverUv(frag / uRes);
      vec3 x = texture2D(uXray, vUv).rgb; // the X-ray's dots and hidden details, rendered ahead
      vec2 u = vec2(fuv.x * 0.8, fuv.y);
      if (uSpider > 0.5) {
        float t = uTime;
        vec2 home = vec2(uEye.x * 0.8, uEye.y);
        vec2 pos = home + vec2(sin(t * 0.61) * 0.034 + sin(t * 1.7) * 0.006, cos(t * 0.47) * 0.034);
        vec2 q = u - pos;
        float heading = sin(t * 0.61 + 0.6) * 0.9;
        q = rot(heading) * q;
        if (length(q) < 0.05) x = mix(x, uXHi, 1.0 - smoothstep(0.0009, 0.0024, spider(q, t)));
      }
      // bubbles rising through the blob
      vec2 bq = (frag - uMouse) / max(uBlobR, 1.0);
      for (int i = 0; i < 6; i++) {
        float f = float(i);
        float s = 0.26 + hash(vec2(f, 7.0)) * 0.3;
        float y = mod(uTime * s + hash(vec2(f, 1.0)) * 2.0, 2.0) - 1.0;
        float bx = (hash(vec2(f, 2.0)) - 0.5) * 1.4 + sin(uTime * 2.0 + f * 2.4) * 0.05;
        float br = 0.022 + hash(vec2(f, 4.0)) * 0.032;
        float ring = abs(length(bq - vec2(bx, y)) - br) - 0.008;
        x = mix(x, uXHi, 1.0 - smoothstep(0.0, 0.009, ring));
      }
      col = mix(col, vec4(x, 1.0), inB);
    }
    float line = 1.0 - smoothstep(0.9 * uDpr, 2.1 * uDpr, abs(sb));
    col = mix(col, vec4(uXInk, 1.0), line);
  }
  gl_FragColor = col * (1.0 - smoothstep(0.55, 1.0, uScroll));
}
`;

/* The X-ray picture, without the blob: rendered into a texture, so moving the blob costs next to nothing. */
const xrayFragment = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTone;
uniform sampler2D uSkull;
uniform sampler2D uMask;
uniform float uMorph;
uniform vec2 uRes;
uniform vec2 uCanvas;
uniform vec2 uPad;
uniform float uDpr;
uniform float uCell;
uniform vec3 uXBg;
uniform vec3 uXInk;
uniform vec3 uXHi;
varying vec2 vUv;
const float IMG_ASPECT = 0.8;
vec2 coverUv(vec2 uv) {
  float ca = uRes.x / uRes.y;
  vec2 s = ca > IMG_ASPECT ? vec2(1.0, IMG_ASPECT / ca) : vec2(ca / IMG_ASPECT, 1.0);
  return (uv - 0.5) * s + 0.5;
}
void main() {
  vec2 frag = vUv * uCanvas - uPad;
  vec2 fuv = coverUv(frag / uRes);
  float fc = max(4.0 * uDpr, uCell * 0.8);
  float fh = fc * 0.866;
  float fr = floor(frag.y / fh);
  float fs = mod(fr, 2.0) * 0.5 * fc;
  vec2 fcen = vec2((floor((frag.x + fs) / fc) + 0.5) * fc - fs, (fr + 0.5) * fh);
  vec2 cu = coverUv(fcen / uRes);
  vec4 mk = texture2D(uMask, cu);
  float bg = mix(mk.r, mk.g, smoothstep(0.3, 0.7, uMorph));
  float light = mix(texture2D(uTone, cu).r, texture2D(uSkull, cu).r, uMorph) * (1.0 - bg);
  if (cu.x < 0.0 || cu.x > 1.0 || cu.y < 0.0 || cu.y > 1.0) light = 0.0;
  float dotA = 1.0 - smoothstep(-0.8 * uDpr, 0.8 * uDpr, length(frag - fcen) - fc * 0.43 * sqrt(light));
  dotA *= step(0.05, light);
  vec3 x = mix(uXBg, uXInk, dotA);
  // the hidden details live on the picture and only exist on its bone: nothing is revealed over the empty background around it
  vec4 here = texture2D(uMask, fuv);
  float onBone = 1.0 - mix(here.r, here.g, smoothstep(0.3, 0.7, uMorph));
  float inFigure = step(0.0, fuv.x) * step(fuv.x, 1.0) * step(0.0, fuv.y) * step(fuv.y, 1.0);
  x = mix(x, uXHi, smoothstep(0.35, 0.65, here.b) * onBone * inFigure);
  gl_FragColor = vec4(x, 1.0);
}
`;

/* The blob's motion. Spring: critically damped, about as far behind the pointer as before, but it keeps its velocity, so a
   sudden change of direction curves instead of kinking. A swipe faster than TOP_SPEED is caught up with, never jumped to. */
const OMEGA = 15, TOP_SPEED = 3400;     // rad/s, css px/s
const STRETCH_MAX = 0.34;               // the most it stretches (1.34x along the motion)
const STRETCH_SPEED = 2600;             // css px/s of motion for that stretch
const LEAVE_MS = 100;                   // the pointer has to stay out this long before the blob goes
const DEMO_MOVE = 3.5;                  // css px: a move smaller than this is a trembling hand and does not end the demo
const OUTSIDE = 0, ENTERING = 1, INSIDE = 2, LEAVING = 3;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed: " + url));
    img.src = url;
  });
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}

function texture(gl, img, unit) {
  const tx = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tx);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  return tx;
}

export async function initHeroGL(figure, { toneUrl, coarse, interactive = true }) {
  const canvas = figure.querySelector("canvas.hero__gl");
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "high-performance" });
  if (!gl) throw new Error("no webgl");
  const toneImg = await loadImage(toneUrl);

  const link = (fs) => {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vertex));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "position");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  };
  const prog = link(fragment), xrayProg = link(xrayFragment);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one big triangle
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  texture(gl, toneImg, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const uni = Object.fromEntries(["uTone", "uSkull", "uMask", "uXray", "uMorph", "uRes", "uCanvas", "uPad", "uDpr", "uMouse", "uBlobR", "uHover", "uStretch", "uHold", "uTint", "uSpider", "uEye", "uXInk", "uXHi", "uXShadow", "uTime", "uScroll", "uIntro", "uCell", "uInk"].map((n) => [n, U(n)]));
  gl.uniform1i(uni.uTone, 0);
  gl.uniform1i(uni.uSkull, 1);
  gl.uniform1i(uni.uMask, 2);
  gl.uniform1i(uni.uXray, 3);
  const xu = Object.fromEntries(["uTone", "uSkull", "uMask", "uMorph", "uRes", "uCanvas", "uPad", "uDpr", "uCell", "uXBg", "uXInk", "uXHi"].map((n) => [n, gl.getUniformLocation(xrayProg, n)]));
  gl.useProgram(xrayProg);
  gl.uniform1i(xu.uTone, 0);
  gl.uniform1i(xu.uSkull, 1);
  gl.uniform1i(xu.uMask, 2);
  gl.useProgram(prog);
  // the target of the X-ray picture
  const xrayTex = gl.createTexture(), xrayFb = gl.createFramebuffer();
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, xrayTex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  gl.activeTexture(gl.TEXTURE0);
  let xrayDirty = true, xrayMorph = -1, xrayW = 0, xrayH = 0, maskTex = null;
  // the skull is loaded right away: holding the star has to be able to morph into it at once
  const skullImg = await loadSkullTone().catch((e) => { console.warn("skull:", e); return null; });
  texture(gl, skullImg || toneImg, 1);
  gl.uniform2f(uni.uEye, SOCKETS[1][0], 1 - SOCKETS[1][1]); // the spider lives in the right socket (the texture is flipped)
  const paint = (acid) => {
    const pal = PALETTE[acid ? "acid" : "autumn"];
    gl.useProgram(xrayProg);
    gl.uniform3fv(xu.uXBg, hex(pal.bg));
    gl.uniform3fv(xu.uXInk, hex(pal.ink));
    gl.uniform3fv(xu.uXHi, hex(pal.hi));
    gl.useProgram(prog);
    gl.uniform3fv(uni.uInk, hex(acid ? "#1A1A1A" : "#1D2B3A"));
    gl.uniform3fv(uni.uXInk, hex(pal.ink));
    gl.uniform3fv(uni.uXHi, hex(pal.hi));
    gl.uniform3fv(uni.uXShadow, hex(pal.shadow));
    gl.uniform1f(uni.uSpider, acid ? 1 : 0);
    if (maskTex) gl.deleteTexture(maskTex);
    maskTex = texture(gl, makeMask(toneImg, skullImg, acid), 2);
    gl.activeTexture(gl.TEXTURE0);
    xrayDirty = true;
  };
  paint(false);
  gl.clearColor(0, 0, 0, 0);

  let dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75);
  gl.uniform1f(uni.uDpr, dpr);
  const state = { time: 0, scroll: 0, intro: 0, cell: 11, cellPortrait: 11, cellSkull: 7, blobR: 90, morph: 0, hold: 0, tint: 0 };
  let morphing = null, blobOff = false, forced = false;

  // smoothed pointer state; hover (the blob's size) moves on a spring, so it pops in with a wobble
  const target = { x: 0, y: 0, hover: 0 };
  const cur = { x: 0, y: 0, hover: 0, vh: 0, vx: 0, vy: 0, sq: 0, cos: 1, sin: 0, svx: 0, svy: 0, m0: 1, m1: 0, m2: 1 };
  let w = 1, h = 1, padPx = 0;
  const figPx = { x: 1, y: 1 };

  /* The figure's place on screen: only measured when something can have moved it, never for a pointer move or per frame. */
  let rect = null, rectDirty = true;
  const markRect = () => { rectDirty = true; };
  const readRect = () => {
    if (rectDirty || !rect) { rect = figure.getBoundingClientRect(); rectDirty = false; }
    return rect;
  };
  window.addEventListener("scroll", markRect, { passive: true, capture: true });
  window.addEventListener("resize", markRect, { passive: true });
  window.addEventListener("orientationchange", markRect, { passive: true });

  /* One state for the pointer: outside, entering, inside, leaving. A leave only counts once it has lasted LEAVE_MS. */
  const ptr = { x: 0, y: 0, state: OUTSIDE, since: 0, fresh: false };
  const pointerAt = (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.fresh = true; };
  const enter = (now) => {
    if (ptr.state === OUTSIDE) { ptr.state = ENTERING; ptr.since = now; } else if (ptr.state === LEAVING) ptr.state = INSIDE;
    if (!sweep) target.hover = 1; // while the demo runs it alone drives the blob
  };

  /* Who drives the blob: the demo or the pointer, never both. Any real input ends the demo right away: the blob just gets a
     new target, and the spring carries it there from wherever it is. */
  let sweep = null, demoFrom = null;
  const endDemo = () => {
    if (!sweep) return;
    sweep = null;
    demoFrom = null;
    figure.removeEventListener("wheel", endDemo);
    figure.removeEventListener("touchstart", endDemo);
    window.removeEventListener("keydown", endDemo);
    window.removeEventListener("scroll", endDemo);
    target.hover = ptr.state === OUTSIDE ? 0 : 1;
  };

  function resize() {
    // the canvas fills the panel inside its frame (the ACID theme has a border), so measure that box
    w = Math.max(1, figure.clientWidth); h = Math.max(1, figure.clientHeight);
    const blobCss = Math.max(56, Math.min(120, w * 0.21));
    // The canvas reaches past the figure on every side, as far as the blob's biggest outline can (pop-in, wobble, stretch, shade),
    // so no box ever cuts it. In shares of the figure, so it also fits when the hold moves it into the copy on the stage.
    const padDev = interactive ? Math.ceil((blobCss * 2.05 + 20) * dpr) : 0;
    figPx.x = Math.round(w * dpr); figPx.y = Math.round(h * dpr); padPx = padDev;
    canvas.width = figPx.x + padDev * 2;
    canvas.height = figPx.y + padDev * 2;
    canvas.style.maxWidth = "none";
    canvas.style.pointerEvents = "none"; // only the figure itself answers the pointer, not the room around it
    canvas.style.inset = "auto";
    canvas.style.left = `${(-padDev / figPx.x) * 100}%`;
    canvas.style.top = `${(-padDev / figPx.y) * 100}%`;
    canvas.style.width = `${(canvas.width / figPx.x) * 100}%`;
    canvas.style.height = `${(canvas.height / figPx.y) * 100}%`;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uni.uRes, figPx.x, figPx.y);
    gl.uniform2f(uni.uCanvas, canvas.width, canvas.height);
    gl.uniform2f(uni.uPad, padDev, padDev);
    xrayDirty = true;
    rectDirty = true;
    // ~74 stars across on desktop, fewer on phones (bigger, clearer stars)
    state.cellPortrait = Math.max(6, Math.min(12, w / (coarse ? 52 : 74))) * dpr;
    state.cellSkull = Math.max(3.6, w / (coarse ? 84 : 112)) * dpr; // the halftone's dots are finer
    state.cell = state.cellPortrait + (state.cellSkull - state.cellPortrait) * state.morph;
    state.blobR = Math.max(56, Math.min(120, w * 0.21)) * dpr;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(figure);
  resize();

  /* The blob. Mouse: follows over the portrait. Touch: appears under the finger and follows sideways drags; a quick
     vertical swipe stays a normal page scroll (touch-action: pan-y hands it to the browser, which cancels the pointer).
     A finger that rests for a moment takes the blob along in every direction instead, and only then the scroll is held back. */
  if (interactive) {
    let idleTimer = 0, lockTimer = 0, locked = false, downX = 0, downY = 0;
    // pointerenter and pointerleave do not fire for moves between the figure and its stickers, so those cannot flicker it
    figure.addEventListener("pointerenter", (e) => { pointerAt(e); markRect(); enter(performance.now()); demoFrom = [e.clientX, e.clientY]; });
    figure.addEventListener("pointermove", (e) => {
      pointerAt(e);
      if (ptr.state === OUTSIDE || ptr.state === LEAVING) enter(performance.now()); // a touch can move in without an enter
      if (sweep) {
        demoFrom ??= [e.clientX, e.clientY];
        if (Math.hypot(e.clientX - demoFrom[0], e.clientY - demoFrom[1]) < DEMO_MOVE) return;
        endDemo();
      }
      clearTimeout(idleTimer);
      if (e.pointerType !== "mouse" && Math.hypot(e.clientX - downX, e.clientY - downY) > 12) clearTimeout(lockTimer);
    });
    figure.addEventListener("pointerdown", (e) => {
      pointerAt(e);
      markRect();
      enter(performance.now());
      endDemo();
      clearTimeout(idleTimer);
      if (e.pointerType === "mouse") return;
      downX = e.clientX; downY = e.clientY; locked = false;
      clearTimeout(lockTimer);
      lockTimer = setTimeout(() => { locked = true; }, 220);
    });
    const leave = () => { if (ptr.state !== OUTSIDE) { ptr.state = LEAVING; ptr.since = performance.now(); } };
    figure.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") leave(); });
    figure.addEventListener("pointercancel", () => { clearTimeout(lockTimer); locked = false; leave(); });
    figure.addEventListener("pointerup", (e) => {
      clearTimeout(lockTimer);
      locked = false;
      if (e.pointerType !== "mouse") idleTimer = setTimeout(leave, 1400);
    });
    figure.addEventListener("touchmove", (e) => { if (locked) e.preventDefault(); }, { passive: false });
    figure.addEventListener("contextmenu", (e) => { if (matchMedia("(pointer: coarse)").matches) e.preventDefault(); });
  }

  // visible + tab active = render
  let visible = true, running = false, last = performance.now();
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }, { rootMargin: "100px" }).observe(figure);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });

  /* The X-ray picture is only rendered again when it has changed, and only if the blob is there to show it. */
  function renderXray() {
    const sw = canvas.width, sh = canvas.height;
    if (xrayMorph !== state.morph) { xrayMorph = state.morph; xrayDirty = true; }
    if (!xrayDirty) return;
    xrayDirty = false;
    gl.useProgram(xrayProg);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, xrayTex);
    if (xrayW !== sw || xrayH !== sh) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sw, sh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      xrayW = sw; xrayH = sh;
      gl.bindFramebuffer(gl.FRAMEBUFFER, xrayFb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, xrayTex, 0);
    } else gl.bindFramebuffer(gl.FRAMEBUFFER, xrayFb);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform2f(xu.uRes, figPx.x, figPx.y);
    gl.uniform2f(xu.uCanvas, sw, sh);
    gl.uniform2f(xu.uPad, padPx, padPx);
    gl.uniform1f(xu.uDpr, dpr);
    gl.uniform1f(xu.uCell, state.cell);
    gl.uniform1f(xu.uMorph, state.morph);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(prog);
  }

  function draw() {
    gl.disable(gl.SCISSOR_TEST);
    if (cur.hover > 0.004 || target.hover > 0) renderXray();
    gl.uniform1f(uni.uTime, state.time);
    gl.uniform1f(uni.uScroll, forced ? 0 : state.scroll); // shown elsewhere during a hold: not dissolved by the page's scroll
    gl.uniform1f(uni.uMorph, state.morph);
    gl.uniform1f(uni.uIntro, state.intro);
    gl.uniform1f(uni.uCell, state.cell);
    gl.uniform1f(uni.uBlobR, state.blobR);
    gl.uniform1f(uni.uHold, state.hold);
    gl.uniform1f(uni.uTint, state.tint);
    gl.uniform2f(uni.uMouse, cur.x, cur.y);
    gl.uniform1f(uni.uHover, cur.hover);
    stretch[0] = cur.m0; stretch[1] = cur.m1; stretch[2] = cur.m1; stretch[3] = cur.m2;
    gl.uniformMatrix2fv(uni.uStretch, false, stretch);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // the room around the figure costs nothing: only the figure and the blob's own box are shaded
    let x0 = padPx, y0 = padPx, x1 = padPx + figPx.x, y1 = padPx + figPx.y;
    if (cur.hover > 0.004) {
      const reach = state.blobR * cur.hover * 1.25 * (1 + cur.sq) + 20 * dpr;
      x0 = Math.min(x0, padPx + cur.x - reach); y0 = Math.min(y0, padPx + cur.y - reach);
      x1 = Math.max(x1, padPx + cur.x + reach); y1 = Math.max(y1, padPx + cur.y + reach);
    }
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x0, y0, Math.min(canvas.width, Math.ceil(x1)) - x0, Math.min(canvas.height, Math.ceil(y1)) - y0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const stretch = new Float32Array([1, 0, 0, 1]);
  function frame(now) {
    if ((!visible && !forced) || document.hidden) { running = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    state.time += dt;
    if (morphing) {
      const t = Math.min(1, (now - morphing.t0) / morphing.dur);
      state.morph = morphing.from + (morphing.to - morphing.from) * t;
      state.cell = state.cellPortrait + (state.cellSkull - state.cellPortrait) * state.morph;
      if (t >= 1) morphing = null;
    }
    if (sweep) {
      const t = (now - sweep.t0) / sweep.dur;
      if (t >= 1) endDemo();
      else {
        // a slow figure-eight over the face
        const a = t * Math.PI * 2;
        target.x = (0.5 + Math.sin(a) * 0.22) * w * dpr;
        target.y = (0.6 + Math.sin(a * 2) * 0.08) * h * dpr;
        target.hover = t < 0.12 ? t / 0.12 : t > 0.85 ? (1 - t) / 0.15 : 1;
      }
    }
    // the pointer's state, on the frame clock
    if (ptr.state === LEAVING && now - ptr.since > LEAVE_MS) { ptr.state = OUTSIDE; if (!sweep) target.hover = 0; }
    if (ptr.state === ENTERING && now - ptr.since > LEAVE_MS) ptr.state = INSIDE;
    // the only place a pointer position turns into a blob position
    if (ptr.fresh && !sweep) {
      ptr.fresh = false;
      const r = readRect();
      target.x = (ptr.x - r.left) * dpr;
      target.y = (r.height - (ptr.y - r.top)) * dpr;
    }
    // it can only appear at the pointer while it is too small to see; once visible it always travels
    if (cur.hover < 0.01 && target.hover > 0 && cur.vh <= 0.01) {
      cur.x = target.x; cur.y = target.y;
      cur.vx = cur.vy = cur.svx = cur.svy = 0;
    }
    // critically damped spring toward the pointer; the speed limit keeps a long jump from becoming one giant step
    const ax = (target.x - cur.x) * OMEGA * OMEGA - cur.vx * 2 * OMEGA, ay = (target.y - cur.y) * OMEGA * OMEGA - cur.vy * 2 * OMEGA;
    cur.vx += ax * dt; cur.vy += ay * dt;
    const top = TOP_SPEED * dpr, vel = Math.hypot(cur.vx, cur.vy);
    if (vel > top) { cur.vx *= top / vel; cur.vy *= top / vel; }
    cur.x += cur.vx * dt; cur.y += cur.vy * dt;
    // the stretch reads a smoothed velocity, so a zig-zag passes through "round" instead of flipping the shape's axis
    const sk = 1 - Math.exp(-dt * 11);
    cur.svx += (cur.vx - cur.svx) * sk; cur.svy += (cur.vy - cur.svy) * sk;
    const sp = Math.hypot(cur.svx, cur.svy) / dpr; // css px per second
    if (sp > 30) { cur.cos = cur.svx / dpr / sp; cur.sin = cur.svy / dpr / sp; }
    cur.sq += (Math.min(STRETCH_MAX, sp / STRETCH_SPEED) - cur.sq) * (1 - Math.exp(-dt * 7.6));
    // squash and stretch along the way it is moving: the distance in that direction is divided, across it multiplied.
    // The matrix itself is smoothed: that is what guarantees the shape can only ever turn gradually.
    const q = 1 + cur.sq, mk = 1 - Math.exp(-dt * 16);
    cur.m0 += (cur.cos * cur.cos / q + cur.sin * cur.sin * q - cur.m0) * mk;
    cur.m1 += (cur.cos * cur.sin * (1 / q - q) - cur.m1) * mk;
    cur.m2 += (cur.sin * cur.sin / q + cur.cos * cur.cos * q - cur.m2) * mk;
    // a spring, so the size overshoots and settles; the hold hides it
    const want = blobOff ? 0 : target.hover;
    cur.vh += ((want - cur.hover) * 150 - cur.vh * (want > cur.hover ? 13 : 24)) * dt;
    cur.hover = Math.max(0, cur.hover + cur.vh * dt);
    if (cur.hover === 0 && want === 0) cur.vh = 0;
    draw();
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
          state.intro = 1 - Math.pow(1 - t, 3);
          if (t < 1) requestAnimationFrame(step); else done();
        };
        requestAnimationFrame(step);
      });
    },
    skipIntro() { state.intro = 1; },
    /** The demo. Does not start over a pointer that is already on the figure. It never disables anything: the figure keeps all its input. */
    sweep(dur = 2600) {
      if (sweep || blobOff || !interactive || ptr.state !== OUTSIDE || figure.matches(":hover")) return false;
      sweep = { t0: performance.now(), dur };
      figure.addEventListener("wheel", endDemo, { passive: true });
      figure.addEventListener("touchstart", endDemo, { passive: true });
      window.addEventListener("keydown", endDemo);
      window.addEventListener("scroll", endDemo, { passive: true });
      return true;
    },
    setScroll(v) { state.scroll = v; },
    /** The hold on the star. morph: 0 portrait .. 1 skull. fx: the glitch. tint: the lime from the edges. */
    setHold(morph, fx, tint) {
      morphing = null;
      state.morph = morph;
      state.cell = state.cellPortrait + (state.cellSkull - state.cellPortrait) * morph;
      state.hold = fx;
      state.tint = tint;
    },
    /** The hold hides the blob; while the canvas is shown somewhere else it has to render even though its figure is off screen. */
    setBlobHidden(on) { blobOff = on; if (on) endDemo(); },
    setForced(on) { forced = on; if (on) start(); },
    /** For the cursor: the blob in client pixels. */
    blob() {
      const r = readRect();
      return { x: r.left + cur.x / dpr, y: r.bottom - cur.y / dpr, r: (state.blobR / dpr) * cur.hover, on: cur.hover > 0.25 };
    },
    /** ACID on/off: the colors change at once, the shape morphs between portrait and skull over `dur` ms. */
    async setAcid(on, dur = 2600) {
      paint(on);
      if (on) {
        // the halftone's small dots must stay crisp on retina screens
        const crisp = Math.min(window.devicePixelRatio || 1, 2);
        if (crisp !== dpr) { dpr = crisp; gl.uniform1f(uni.uDpr, dpr); resize(); }
      }
      if (dur <= 0) { // at once: a frame clock can run a little behind this one, and dividing by zero is no way to find out
        morphing = null;
        state.morph = on ? 1 : 0;
        state.cell = state.cellPortrait + (state.cellSkull - state.cellPortrait) * state.morph;
      } else morphing = { t0: performance.now(), dur, from: state.morph, to: on ? 1 : 0 };
    },
    dispose() {
      window.removeEventListener("scroll", markRect, { capture: true });
      window.removeEventListener("resize", markRect);
      window.removeEventListener("orientationchange", markRect);
      ro.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

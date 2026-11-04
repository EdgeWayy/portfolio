/* The slime's WebGL2 renderer. Everything slime in the project is drawn by it: the page's puddle, the theme's curtain,
   the gate's potion and the finale's splashes (js/slime.js and js/potion.js describe what to draw, this draws it).
   Three passes, so that the costly part is small and the sharp part is cheap:
     1 field    at low resolution: signed distance (sd, px) and height of the slime. One wavy mass plus drips, smooth-min
                blended. The screen is cut into vertical strips and each strip only evaluates the drips near it, because
                drips are narrow and hang straight down: a pixel is only ever touched by two or three of them.
     2 slope    at the same resolution: the height's gradient, which is the surface normal.
     3 shade    at full resolution: reads the field through a smooth filter. A distance field stays razor sharp when it
                is magnified (the same trick as SDF text), so the edge is crisp at any pixel ratio.
   Only lime, dark green and white-lime appear in the shading. Coordinates are CSS px from the canvas's top left.
   One context is reused through a small pool: only the curtain, which runs over a live puddle, ever needs a second one. */

export const MAX_PRIMS = 64;       // drips, droplets and splashes in one frame
export const MAX_MOVING = 16;      // bubbles that are simulated on the CPU (the potion's)
const PER_STRIP = 18;              // drips one strip can evaluate; a strip is narrow, so this is generous
const STRIP_W = 130;               // px
const SHADOW = 5;                 // how far the dark contact shade reaches, so the field must be right that far out
// quality tiers: the renderer steps down by itself if frames stay slow
const TIERS = [
  { res: 1, field: 0.6, bubbles: 1, smooth: 1 },
  { res: 0.8, field: 0.5, bubbles: 0.6, smooth: 1 },
  { res: 0.65, field: 0.45, bubbles: 0, smooth: 1 },
  { res: 0.5, field: 0.4, bubbles: 0, smooth: 0 },
];
const SLOW_MS = 20, SLOW_FOR = 1.5;   // this slow for this long: one tier down

const VS = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FIELD = `#version 300 es
precision highp float;
uniform vec4 uA[${PER_STRIP}]; // x, top, tip, sideways sway of the tip
uniform vec4 uB[${PER_STRIP}]; // radius at the top, at the neck, of the bulb; softness of its join
uniform int uN;
uniform float uH, uScale;
uniform vec4 uMass;   // edge height, wave size, time, side (1: the body is above the edge, -1: below, 0: no mass)
uniform vec4 uMass2;  // wave's x scale, wave's time scale, walls' meniscus, canvas width
uniform float uThick;
out vec4 o;
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float smax(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return max(a, b) + h * h * k * 0.25; }
void main() {
  vec2 q = vec2(gl_FragCoord.x, uH - gl_FragCoord.y) / uScale;
  float sd = 1000.0, h = 0.0;
  if (uMass.w != 0.0) {
    float fx = uMass2.x, ft = uMass2.y, t = uMass.z;
    // layered, slow waves. js/slime.js has the same formula for the cursor.
    float e = uMass.x + uMass.y * (sin(q.x * 0.0058 * fx + t * 0.28 * ft + 1.1) * 15.0
      + sin(q.x * 0.0163 * fx - t * 0.21 * ft) * 6.0 + sin(q.x * 0.041 * fx + t * 0.36 * ft) * 1.8);
    if (uMass2.z > 0.0) e -= uMass2.z * exp(-min(q.x, uMass2.w - q.x) / 11.0); // the meniscus climbing the walls
    sd = (q.y - e) * uMass.w;
    float s = clamp(-sd / uThick, 0.0, 1.0);
    h = uThick * sqrt(s * (2.0 - s));
  }
  for (int i = 0; i < uN; i++) {
    vec4 a = uA[i], b = uB[i];
    float rb = b.z, tip = a.z - rb;
    float s = clamp((q.y - a.y) / max(a.z - a.y, 0.001), 0.0, 1.0);
    float yc = clamp(q.y, a.y, max(a.y, tip));
    // wide where it leaves the mass, thin at the neck, round again at the bulb
    float r = mix(b.x, b.y, smoothstep(0.0, 0.42, s));
    r = mix(r, rb, smoothstep(tip - 3.4 * rb, tip, yc));
    float d = length(vec2(q.x - a.x - a.w * s * s, q.y - yc));
    sd = smin(sd, d - r, b.w);
    h = smax(h, sqrt(max(r * r - d * d, 0.0)), max(2.0, b.w * 0.35));
  }
  // every edge is rounded over, also where a join has no height of its own
  float s = clamp(-sd / 6.5, 0.0, 1.0);
  h = smax(h, 6.5 * sqrt(s * (2.0 - s)), 3.0);
  o = vec4(sd, h, 0.0, 0.0);
}`;

const SLOPE = `#version 300 es
precision highp float;
uniform sampler2D uF;
uniform float uScale;
out vec4 o;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy), m = textureSize(uF, 0) - 1;
  vec4 f = texelFetch(uF, c, 0);
  float l = texelFetch(uF, clamp(c + ivec2(-1, 0), ivec2(0), m), 0).g, r = texelFetch(uF, clamp(c + ivec2(1, 0), ivec2(0), m), 0).g;
  float u = texelFetch(uF, clamp(c + ivec2(0, 1), ivec2(0), m), 0).g, d = texelFetch(uF, clamp(c + ivec2(0, -1), ivec2(0), m), 0).g;
  // gradient in px per px, x to the right and y downward
  o = vec4(f.r, f.g, (r - l) * 0.5 * uScale, (d - u) * 0.5 * uScale);
}`;

const SHADE = `#version 300 es
precision highp float;
uniform sampler2D uF;
uniform vec2 uRes, uTexel;
uniform float uDpr, uTime, uBubbles, uGlow, uDeep, uSmooth;
uniform vec4 uMove[${MAX_MOVING}]; // x, y, radius, 0 for a bubble or 0..1 for a popping ring
uniform int uNMove;
out vec4 o;
const vec3 LIME = vec3(0.722, 1.0, 0.0);
const vec3 RIM = vec3(0.369, 0.6, 0.0);      // #5E9900
const vec3 DEEP = vec3(0.184, 0.322, 0.0);   // #2F5200
const vec3 SHINE = vec3(0.957, 1.0, 0.812);  // soft white-lime
const vec3 UNDER = vec3(0.09, 0.16, 0.0);
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// B-spline filter in four bilinear taps: bilinear alone would facet the highlights along the texture's grid
vec4 field(vec2 uv) {
  if (uSmooth < 0.5) return texture(uF, uv);
  vec2 st = uv / uTexel - 0.5, i = floor(st), f = st - i;
  vec2 w0 = (1.0 - f) * (1.0 - f) * (1.0 - f) / 6.0, w1 = (4.0 - 6.0 * f * f + 3.0 * f * f * f) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f * f - 3.0 * f * f * f) / 6.0, w3 = f * f * f / 6.0;
  vec2 g0 = w0 + w1, g1 = w2 + w3, h0 = (w1 / g0 - 0.5 + i) * uTexel + 0.5 * uTexel, h1 = (w3 / g1 + 1.5 + i) * uTexel + 0.5 * uTexel;
  return (texture(uF, h0) * g0.x + texture(uF, vec2(h1.x, h0.y)) * g1.x) * g0.y
    + (texture(uF, vec2(h0.x, h1.y)) * g0.x + texture(uF, h1) * g1.x) * g1.y;
}
float gloss(vec3 n, vec3 h, float sharp) { return pow(clamp((dot(n, h) - h.z) / (1.0 - h.z), 0.0, 1.0), sharp); }
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 f = field(uv);
  float sd = f.r, d = -sd;
  vec2 q = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float aa = 0.75 / uDpr;
  float cover = smoothstep(-aa, aa, d);
  // the dark shade it leaves on what is around it
  float under = (1.0 - smoothstep(0.0, ${SHADOW.toFixed(1)}, sd)) * 0.34 * step(0.0, sd + aa);
  vec4 result = vec4(UNDER * under, under);

  if (cover > 0.001) {
    vec3 n = normalize(vec3(-f.ba * 1.15, 1.0));
    const vec3 L = vec3(-0.47, -0.09, 0.878);       // key light, from the upper left: the streak along each drip
    const vec3 L2 = vec3(-0.14, 0.5, 0.855);        // low light: the gleam along the wet lower lip and in the bulbs
    vec3 c = LIME;
    // the deep body of a thick pool (the potion)
    c = mix(c, vec3(0.6, 0.89, 0.0), uDeep * smoothstep(10.0, 30.0, d));
    // darker on the side turned from the light: subsurface-like, never touches the flat top where the text sits
    float away = clamp(dot(n, L) / L.z, 0.0, 1.0);
    c = mix(RIM, c, smoothstep(0.0, 0.62, away));
    // the thick dark rim inside the edge, then a dark line right on it. Short ramps: wet paint has clean edges.
    c = mix(c, RIM, 1.0 - smoothstep(3.1, 4.3, d));
    c = mix(c, DEEP, 1.0 - smoothstep(0.5, 1.7, d));
    // a wet sheen drifting slowly over the surface
    float drift = sin(q.x * 0.011 + q.y * 0.017 + uTime * 0.17) * sin(q.x * 0.0071 - q.y * 0.0093 - uTime * 0.11);
    c += SHINE * 0.028 * smoothstep(0.2, 1.0, drift);
    // bubbles trapped inside: a grid of cells, most of them empty
    if (uBubbles > 0.0 && d > 12.0) {
      vec2 g = vec2(q.x, q.y + uTime * 2.2) / 58.0, id = floor(g);
      if (hash(id) < 0.16 * uBubbles) {
        vec2 ctr = 0.25 + 0.5 * vec2(hash(id + 3.1), hash(id + 7.7));
        float r = (1.3 + 2.8 * hash(id + 11.3)) / 58.0, l = length(g - id - ctr);
        float ring = 1.0 - smoothstep(0.0, 0.022, abs(l - r));
        c = mix(c, RIM, ring * 0.16);
        c = mix(c, SHINE, (1.0 - smoothstep(0.0, r * 0.32, length(g - id - ctr + r * 0.38))) * 0.5);
      }
    }
    for (int i = 0; i < uNMove; i++) {
      vec4 b = uMove[i];
      float l = length(q - b.xy);
      if (b.w <= 0.0) {
        c = mix(c, RIM, (1.0 - smoothstep(0.5, 1.5, abs(l - b.z))) * 0.75);
        c = mix(c, SHINE, 1.0 - smoothstep(0.0, max(0.9, b.z * 0.3), length(q - b.xy + b.z * 0.36)));
      }
    }
    // the glow inside: strongest just under the surface
    c += LIME * uGlow * 0.22 * (1.0 - smoothstep(0.0, 26.0, d));
    // gloss: a broad soft highlight under two sharp ones. Thresholded, so they have clean edges like wet paint.
    vec3 h1 = normalize(L + vec3(0.0, 0.0, 1.0)), h2 = normalize(L2 + vec3(0.0, 0.0, 1.0));
    c += SHINE * 0.1 * gloss(n, h1, 6.0);
    float lip = 0.62 + 0.38 * sin(q.x * 0.023 + uTime * 0.12) * sin(q.x * 0.0071 - uTime * 0.07 + 2.0);
    float s1 = smoothstep(0.56, 0.64, gloss(n, h1, 2.6));
    float s2 = smoothstep(0.62, 0.7, gloss(n, h2, 2.6)) * smoothstep(0.42, 0.62, lip);
    c = mix(c, SHINE, max(s1, s2) * 0.94);
    // the potion's meniscus: one sharp wet line just under its surface
    c = mix(c, SHINE, uDeep * 0.85 * (1.0 - smoothstep(0.5, 1.2, abs(d - 5.5))) * smoothstep(0.4, 0.6, lip));
    // the fresnel rim: a thin light on the curve facing the viewer's side
    float fr = pow(1.0 - n.z, 3.0);
    c += SHINE * fr * 0.24 * smoothstep(1.5, 4.5, d);
    // thin slime lets a little of the black through
    float a = cover * mix(0.9, 1.0, smoothstep(0.0, 5.0, d));
    result = result * (1.0 - a) + vec4(c * a, a);
  }
  // popping bubbles leave a tiny ring that is also visible above the surface
  for (int i = 0; i < uNMove; i++) {
    vec4 b = uMove[i];
    if (b.w > 0.0) {
      float ring = (1.0 - smoothstep(0.4, 1.3, abs(length(q - b.xy) - b.z))) * (1.0 - b.w);
      vec3 rc = mix(SHINE, RIM, step(0.5, cover));
      result = result * (1.0 - ring) + vec4(rc * ring, ring);
    }
  }
  o = result;
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}
function program(gl, fs, names) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, "p");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  for (const n of names) u[n] = gl.getUniformLocation(p, n);
  return { p, u };
}

function createRenderer() {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" });
  if (!gl) return null;
  // the field needs float pixels: a distance stored in 8 bits would show steps in the highlights
  if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) return null;

  const field = program(gl, FIELD, ["uA", "uB", "uN", "uH", "uScale", "uMass", "uMass2", "uThick"]);
  const slope = program(gl, SLOPE, ["uF", "uScale"]);
  const shade = program(gl, SHADE, ["uF", "uRes", "uTexel", "uDpr", "uTime", "uBubbles", "uGlow", "uDeep", "uSmooth", "uMove", "uNMove"]);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  const target = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    return { tex, fb: gl.createFramebuffer() };
  };
  const A = target(), B = target();
  const allocate = (t, w, h) => {
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  };
  if (!allocate(A, 4, 4) || !allocate(B, 4, 4)) return null;

  // buffers are made once: nothing below allocates per frame
  const stripA = new Float32Array(PER_STRIP * 4), stripB = new Float32Array(PER_STRIP * 4);
  const INSIDE = new Float32Array([-1000, 0, 0, 0]), OUTSIDE = new Float32Array([1000, 0, 0, 0]);

  let W = 1, H = 1, baseDpr = 1, dpr = 1, fw = 1, fh = 1, scale = 1;
  let tier = 0, slowFor = 0, lost = false;
  const fit = () => {
    const t = TIERS[tier];
    dpr = baseDpr * t.res;
    const cw = Math.max(1, Math.round(W * dpr)), ch = Math.max(1, Math.round(H * dpr));
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    // a small canvas (the potion) is cheap, so its field stays sharp
    scale = Math.min(1, Math.max(t.field, 150 / Math.min(W, H)));
    const nw = Math.max(4, Math.ceil(W * scale)), nh = Math.max(4, Math.ceil(H * scale));
    if (nw !== fw || nh !== fh) { fw = nw; fh = nh; allocate(A, fw, fh); allocate(B, fw, fh); }
  };

  const api = {
    canvas,
    path: "webgl",
    get tier() { return tier; },
    get lost() { return lost; },
    /** Size in CSS px. The drawing buffer follows the pixel ratio and the quality tier. */
    resize(w, h, pixelRatio) {
      W = w; H = h; baseDpr = pixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      fit();
    },
    /** Frame time watch: a machine that stays slow gets a lower tier, once and for all. */
    frame(dtSec) {
      if (dtSec > 0.1 || tier >= TIERS.length - 1) return;
      slowFor = dtSec * 1000 > SLOW_MS ? slowFor + dtSec : Math.max(0, slowFor - dtSec * 2);
      if (slowFor > SLOW_FOR) { slowFor = 0; tier++; fit(); }
    },
    clear() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    /** One frame. See makeScene() in js/slime.js for the scene's fields. */
    draw(s) {
      if (lost) return;
      const P = s.prims, n = Math.min(s.n, MAX_PRIMS);
      const massAmp = s.massDir ? (15 + 6 + 1.8) * s.massAmp + s.meniscus : 0;
      INSIDE[1] = s.thick; // the solid rows are as high as the plateau, or their border would read as a step
      // pass 1: the field. Above and below the band that can change, it is a constant, so those parts are not computed.
      gl.bindFramebuffer(gl.FRAMEBUFFER, A.fb);
      gl.viewport(0, 0, fw, fh);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearBufferfv(gl.COLOR, 0, OUTSIDE);
      gl.enable(gl.SCISSOR_TEST);
      gl.useProgram(field.p);
      gl.uniform1f(field.u.uH, fh);
      gl.uniform1f(field.u.uScale, scale);
      gl.uniform4f(field.u.uMass, s.massBase, s.massAmp, s.time, s.massDir);
      gl.uniform4f(field.u.uMass2, s.waveX, s.waveT, s.meniscus, W);
      gl.uniform1f(field.u.uThick, s.thick);
      const strips = Math.max(1, Math.min(24, Math.ceil(W / STRIP_W)));
      const sw = W / strips;
      let top = s.massDir ? s.massBase - massAmp - 34 : 1e9, bottom = s.massDir ? s.massBase + massAmp + 34 : -1e9;
      for (let k = 0; k < strips; k++) {
        const x0 = k * sw, x1 = x0 + sw;
        let m = 0, yMin = s.massDir ? s.massBase - massAmp - 34 : 1e9, yMax = s.massDir ? s.massBase + massAmp + 34 : -1e9;
        for (let i = 0; i < n && m < PER_STRIP; i++) {
          const o = i * 8;
          const reach = Math.max(P[o + 4], P[o + 5], P[o + 6]) + P[o + 7] + SHADOW + 6;
          const sway = P[o + 3];
          if (P[o] + Math.max(sway, 0) + reach < x0 || P[o] + Math.min(sway, 0) - reach > x1) continue;
          for (let j = 0; j < 4; j++) { stripA[m * 4 + j] = P[o + j]; stripB[m * 4 + j] = P[o + 4 + j]; }
          if (P[o + 1] - reach < yMin) yMin = P[o + 1] - reach;
          if (P[o + 2] + reach > yMax) yMax = P[o + 2] + reach;
          m++;
        }
        const clip0 = Math.floor(x0 * scale), clip1 = Math.ceil(x1 * scale);
        // inside the mass, above (or below) the band: solid
        if (s.massDir > 0 && yMin > 0) {
          gl.scissor(clip0, Math.floor(fh - yMin * scale), clip1 - clip0, Math.ceil(yMin * scale) + 1);
          gl.clearBufferfv(gl.COLOR, 0, INSIDE);
        } else if (s.massDir < 0 && yMax < H) {
          gl.scissor(clip0, 0, clip1 - clip0, Math.ceil(fh - yMax * scale) + 1);
          gl.clearBufferfv(gl.COLOR, 0, INSIDE);
        }
        if (yMax <= yMin || yMax < 0 || yMin > H) continue;
        const y0 = Math.max(0, Math.floor(fh - yMax * scale)), y1 = Math.min(fh, Math.ceil(fh - yMin * scale));
        if (y1 <= y0) continue;
        gl.scissor(clip0, y0, clip1 - clip0, y1 - y0);
        gl.uniform1i(field.u.uN, m);
        if (m) {
          gl.uniform4fv(field.u.uA, stripA, 0, m * 4);
          gl.uniform4fv(field.u.uB, stripB, 0, m * 4);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (yMin < top) top = yMin;
        if (yMax > bottom) bottom = yMax;
      }
      // solid rows have no slope, so pass 2 only runs over the band, and pass 3 only over what can be visible
      const bandY0 = Math.max(0, Math.floor(fh - (bottom + 2) * scale)), bandY1 = Math.min(fh, Math.ceil(fh - (top - 2) * scale));
      gl.bindFramebuffer(gl.FRAMEBUFFER, B.fb);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearBufferfv(gl.COLOR, 0, OUTSIDE);
      gl.enable(gl.SCISSOR_TEST);
      if (s.massDir > 0 && bandY1 < fh) { gl.scissor(0, bandY1, fw, fh - bandY1); gl.clearBufferfv(gl.COLOR, 0, INSIDE); }
      if (s.massDir < 0 && bandY0 > 0) { gl.scissor(0, 0, fw, bandY0); gl.clearBufferfv(gl.COLOR, 0, INSIDE); }
      if (bandY1 > bandY0) {
        gl.scissor(0, bandY0, fw, bandY1 - bandY0);
        gl.useProgram(slope.p);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, A.tex);
        gl.uniform1i(slope.u.uF, 0);
        gl.uniform1f(slope.u.uScale, scale);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      // pass 3: shade
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.SCISSOR_TEST);
      const fy0 = s.massDir < 0 ? 0 : Math.max(0, Math.floor(canvas.height - (bottom + 2) * dpr));
      const fy1 = s.massDir > 0 ? canvas.height : Math.min(canvas.height, Math.ceil(canvas.height - (top - 2) * dpr));
      if (fy1 > fy0) {
        gl.scissor(0, fy0, canvas.width, fy1 - fy0);
        gl.useProgram(shade.p);
        gl.bindTexture(gl.TEXTURE_2D, B.tex);
        gl.uniform1i(shade.u.uF, 0);
        gl.uniform2f(shade.u.uRes, canvas.width, canvas.height);
        gl.uniform2f(shade.u.uTexel, 1 / fw, 1 / fh);
        gl.uniform1f(shade.u.uDpr, dpr);
        gl.uniform1f(shade.u.uTime, s.time);
        gl.uniform1f(shade.u.uBubbles, s.bubbles * TIERS[tier].bubbles);
        gl.uniform1f(shade.u.uGlow, s.glow);
        gl.uniform1f(shade.u.uDeep, s.deep);
        gl.uniform1f(shade.u.uSmooth, TIERS[tier].smooth);
        gl.uniform1i(shade.u.uNMove, s.nMoving);
        if (s.nMoving) gl.uniform4fv(shade.u.uMove, s.moving, 0, s.nMoving * 4);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      gl.disable(gl.SCISSOR_TEST);
    },
    release() {
      api.clear();
      canvas.remove();
      canvas.className = "";
      if (!lost) pool.push(api);
    },
  };
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; api.onLost?.(); });
  return api;
}

const pool = [];
let unavailable = false;

/** A renderer that is free right now, or null when this browser cannot run it (the callers then fall back to canvas 2D). */
export function acquireRenderer() {
  if (unavailable) return null;
  const free = pool.pop();
  if (free) return free;
  try {
    const r = createRenderer();
    if (!r) unavailable = true;
    return r;
  } catch (e) {
    console.warn("slime:", e);
    unavailable = true;
    return null;
  }
}

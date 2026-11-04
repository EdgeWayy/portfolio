/* The finale's skull as a small 3D rig on WebGL2. Every sprite is a textured mesh; the vertex shader is the whole rig:
     tooth    its own small offset and rotation around its root
     jaw      rotateX around a hinge that lies behind the face. The jaw bone is curved like a real one: the chin is far in front
              of the hinge, the corners are close to it, so the chin swings far and the corners barely move, and the teeth follow.
     head     pitch around its own centre, a deliberate roll, a lunge at the camera
     camera   real perspective (w), so rows of teeth foreshorten by themselves. At rest every part of this is an identity.
   project() in JS is the same math, for what has to stick to the skull on other layers (slime, shards, cursor).
   Textures are mipmapped, so the halftone does not shimmer at any size. */

const VS = `#version 300 es
in vec2 a;
out vec2 vUv;
uniform vec4 uRect;       // the sprite, in shares of the figure
uniform vec2 uFig;        // the figure in px
uniform vec3 uView;       // screen width, height, perspective distance
uniform vec4 uTooth;      // dx, dy, rotation; w: 1 when this sprite hangs on the jaw
uniform vec2 uRoot;       // what a tooth rotates around, in px from the figure's centre
uniform float uJaw;       // radians
uniform vec4 uJawCfg;     // hinge height, depth, push toward the viewer, stretch
uniform float uArch;      // half width of the jaw bone's curve
uniform vec4 uHead;       // pitch, roll, z, scale
uniform vec2 uHeadAt;     // height of the pitch's axis (share), vertical shift (px)
void main() {
  vUv = a;
  vec2 p = vec2((mix(uRect.x, uRect.z, a.x) - 0.5) * uFig.x, (mix(uRect.y, uRect.w, a.y) - 0.5) * uFig.y);
  float cr = cos(uTooth.z), sr = sin(uTooth.z);
  vec2 q = p - uRoot;
  p = uRoot + vec2(q.x * cr - q.y * sr, q.x * sr + q.y * cr) + uTooth.xy;
  float z = 0.0;
  if (uTooth.w > 0.5) {
    float u = p.x / uFig.x + 0.5, v = p.y / uFig.y + 0.5;
    float hv = uJawCfg.x, h = (v - hv) * uFig.y;
    float e = (u - 0.5) / uArch;
    float prof = clamp(1.0 - pow(abs(e), 3.0), 0.0, 1.0); // flat across the front, falling away at the corners: a U, not a V
    float D = uJawCfg.y * uFig.y * prof * smoothstep(0.04, 0.2, v - hv);
    float s = sin(uJaw), c = cos(uJaw);
    p.y = (hv - 0.5) * uFig.y + h * c * (1.0 + uJawCfg.w * s) + D * s;
    z = -h * s + D * (c - 1.0) + uJawCfg.z * uFig.y * s * prof;
  }
  float pv = (uHeadAt.x - 0.5) * uFig.y, b = p.y - pv;
  float cp = cos(uHead.x), sp = sin(uHead.x);
  float y2 = b * cp - z * sp, z2 = b * sp + z * cp;
  float cw = cos(uHead.y), sw = sin(uHead.y);
  vec3 o = vec3(p.x * cw - y2 * sw, y2 * cw + p.x * sw + pv, z2) * uHead.w;
  o.y += uHeadAt.y;
  o.z += uHead.z;
  float w = max(0.1, 1.0 - o.z / uView.z);
  gl_Position = vec4(o.x / (uView.x * 0.5), -o.y / (uView.y * 0.5), 0.0, w);
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D t;
uniform float uAlpha, uInv;
void main() {
  vec4 c = texture(t, vUv);
  // the inverted frames: pale goes black and ink goes white, so no color can drift off the palette
  if (uInv > 0.5 && c.a > 0.0) c.rgb = vec3(1.0 - step(0.5, c.g / c.a)) * c.a;
  o = c * uAlpha;
}`;

const gridMesh = (gl, n) => {
  const v = new Float32Array((n + 1) * (n + 1) * 2), idx = new Uint16Array(n * n * 6);
  let k = 0;
  for (let y = 0; y <= n; y++) for (let x = 0; x <= n; x++) { v[k++] = x / n; v[k++] = y / n; }
  k = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const a = y * (n + 1) + x, b = a + 1, c = a + n + 1, d = c + 1;
      idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c;
    }
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return { vao, count: idx.length };
};

/** Returns null where WebGL2 is not available (the finale then plays its simple version). */
export function createRig({ W, H, dpr, figW, figH, perspective, jawCfg, arch }) {
  const cv = document.createElement("canvas");
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  cv.style.width = `${W}px`;
  cv.style.height = `${H}px`;
  cv.className = "ak-finale__layer";
  const gl = cv.getContext("webgl2", { alpha: false, antialias: true, depth: false, stencil: false, powerPreference: "high-performance" });
  if (!gl) return null;
  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(prog, 0, "a");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const U = {};
  for (const n of ["uRect", "uFig", "uView", "uTooth", "uRoot", "uJaw", "uJawCfg", "uArch", "uHead", "uHeadAt", "uAlpha", "uInv", "t"]) U[n] = gl.getUniformLocation(prog, n);
  gl.uniform2f(U.uFig, figW, figH);
  gl.uniform3f(U.uView, W, H, perspective);
  gl.uniform4f(U.uJawCfg, jawCfg.hinge, jawCfg.depth, jawCfg.push, jawCfg.stretch);
  gl.uniform1f(U.uArch, arch);
  gl.uniform1i(U.t, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.viewport(0, 0, cv.width, cv.height);
  const fine = gridMesh(gl, 40), coarse = gridMesh(gl, 4);
  let bound = null;

  const textures = [];
  const api = {
    canvas: cv,
    /** A sprite ({ cv, u0, v0, u1, v1 }) becomes a mipmapped texture. */
    upload(s, mesh = coarse) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s.cv);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      textures.push(tex);
      return { tex, mesh, u0: s.u0, v0: s.v0, u1: s.u1, v1: s.v1 };
    },
    fine,
    coarse,
    clear(r, g, b) {
      gl.clearColor(r, g, b, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    /** The head's pose for the sprites that follow. */
    head(pitch, roll, z, scale, axis, shift) {
      gl.uniform4f(U.uHead, pitch, roll, z, scale);
      gl.uniform2f(U.uHeadAt, axis, shift);
    },
    jaw(angle) { gl.uniform1f(U.uJaw, angle); },
    /** One sprite. onJaw: it hangs on the mandible. dx, dy, rot, rootX, rootY: a tooth's own motion. */
    draw(s, onJaw, alpha, inv, dx, dy, rot, rootX, rootY) {
      if (bound !== s.tex) { gl.bindTexture(gl.TEXTURE_2D, s.tex); bound = s.tex; }
      gl.uniform4f(U.uRect, s.u0, s.v0, s.u1, s.v1);
      gl.uniform4f(U.uTooth, dx, dy, rot, onJaw ? 1 : 0);
      gl.uniform2f(U.uRoot, rootX, rootY);
      gl.uniform1f(U.uAlpha, alpha);
      gl.uniform1f(U.uInv, inv ? 1 : 0);
      gl.bindVertexArray(s.mesh.vao);
      gl.drawElements(gl.TRIANGLES, s.mesh.count, gl.UNSIGNED_SHORT, 0);
    },
    dispose() {
      textures.forEach((t) => gl.deleteTexture(t));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
  return api;
}

/* =========================================================================
 * Lumina Mall — the atrium (main screen)
 * -------------------------------------------------------------------------
 * A cutaway illustration of the inside of a four-floor shopping-mall atrium,
 * generated as inline SVG: marble walls, a glass skylight with light rays,
 * pendant lamps, glass railings, escalators with moving steps, a glass
 * elevator, planters and benches, people walking on every floor, a marble
 * ground floor with reflections, a fountain and an information desk. Every
 * store is a real-looking shop front (sign, awning, photo window, door).
 *
 * LAYERS (parallax). Three stacked SVGs, each moved only with a composited
 * CSS transform (no SVG re-layout while the camera moves):
 *   back  (factor 0.85)  skylight, sky, distant wall
 *   main  (factor 1.00)  floors, shop fronts, people, escalators, elevator
 *   front (factor 1.12)  pendant lamps and light rays (pointer-events: none)
 *
 * CAMERA. `cam` is the scene y at the top of the viewport (scene units).
 * Floors are reached with the elevator panel, the mouse wheel, vertical
 * drag/swipe or the keyboard. The intro rises from the entrance.
 *
 * HOVER RULES (see the bug note in bindShop):
 *   - pointerenter/pointerleave per shop (they do not bubble from children)
 *   - the hovered id is remembered; the same shop never re-fires
 *   - glow, window light and sign light are pure CSS :hover/:focus-visible
 *   - one tooltip element, content swapped only when the shop changes
 *   - decorative layers have pointer-events: none
 * ========================================================================= */
(function (global) {
  'use strict';

  const Mall = global.Mall;
  const { h, s } = Mall.dom;
  const t = Mall.t;
  const L = Mall.L;
  const C = Mall.color;

  const FLOORS = 4;
  const PALETTE_PEOPLE = ['#c2547a', '#1f2a4d', '#c9a227', '#e88b73', '#5a6fb0', '#8a5a3c', '#a46fc4', '#d9779a', '#3b6fd8', '#f0a35e'];

  /* ------------------------------------------------------------ layout */
  const MODES = {
    wide: { W: 1600, band: 300, shaft: 140, gap: 16, frontH: 254, rowGap: 0, ceiling: 44, walk: 70, sky: 270, ground: 330, perRowMax: 3 },
    compact: { W: 800, band: 64, shaft: 96, gap: 14, frontH: 238, rowGap: 24, ceiling: 40, walk: 72, sky: 210, ground: 320, perRowMax: 1 },
  };

  /**
   * Compute where every floor and shop front goes.
   * wide:    each floor is one row; stores split left/right of the elevator.
   * compact: each side is a single column, stores stack in rows (phones).
   */
  function computeLayout(stores, mode) {
    const M = MODES[mode];
    const cx = M.W / 2;
    const leftArea = [M.band + 10, cx - M.shaft / 2 - 10];
    const rightArea = [cx + M.shaft / 2 + 10, M.W - M.band - 10];
    const floors = {};
    let y = M.sky;
    for (let f = FLOORS; f >= 1; f--) {
      const list = stores.filter((st) => st.floor === f).sort((a, b) => a.slot - b.slot);
      const half = Math.ceil(list.length / 2);
      const sides = [list.slice(0, half), list.slice(half)];
      const rows = mode === 'wide' ? 1 : Math.max(1, ...sides.map((x) => x.length));
      const hgt = M.ceiling + rows * M.frontH + (rows - 1) * M.rowGap + M.walk;
      const shops = [];
      sides.forEach((side, si) => {
        const [x0, x1] = si === 0 ? leftArea : rightArea;
        if (mode === 'wide') {
          const n = Math.max(1, side.length);
          const w = (x1 - x0 - (n - 1) * M.gap) / n;
          side.forEach((st, i) => shops.push({ store: st, x: x0 + i * (w + M.gap), y: y + M.ceiling, w, h: M.frontH }));
          if (!side.length) shops.push({ store: null, x: x0, y: y + M.ceiling, w: x1 - x0, h: M.frontH });
        } else {
          side.forEach((st, i) => shops.push({ store: st, x: x0, y: y + M.ceiling + i * (M.frontH + M.rowGap), w: x1 - x0, h: M.frontH }));
          for (let i = side.length; i < rows; i++) shops.push({ store: null, x: x0, y: y + M.ceiling + i * (M.frontH + M.rowGap), w: x1 - x0, h: M.frontH });
        }
      });
      floors[f] = { top: y, h: hgt, bottom: y + hgt, walkTop: y + hgt - M.walk, shops };
      y += hgt;
    }
    return { mode, M, cx, floors, groundTop: y, H: y + M.ground, leftArea, rightArea };
  }

  /* -------------------------------------------------------- text helper */
  const textWidth = (str, size, k = 0.56) => Array.from(str).length * size * k;
  function fitText(str, maxW, start, min = 9, k = 0.56) {
    let size = start;
    while (size > min && textWidth(str, size, k) > maxW) size -= 0.5;
    if (textWidth(str, size, k) <= maxW) return { text: str, size };
    const chars = Array.from(str);
    let n = chars.length;
    while (n > 1 && textWidth(chars.slice(0, n).join('') + '…', size, k) > maxW) n--;
    return { text: chars.slice(0, n).join('') + '…', size };
  }

  /* ================================================================= */
  function create(stage, opts = {}) {
    const o = Object.assign({ onEnter: null, onFloor: null, onCamera: null }, opts);
    const coarse = matchMedia('(pointer: coarse)').matches;

    let stores = [];
    let lay = null;
    let mode = 'wide';
    let scale = 1;
    let cam = 0;
    let zoom = 1;
    let floor = 1;
    let camAnim = 0;
    let searchSet = null;
    let activeId = null;
    const shopEls = new Map();
    const uid = 'at' + Math.random().toString(36).slice(2, 7);
    const ref = (n) => `url(#${uid}-${n})`;

    /* DOM skeleton: stage > camera > [back, main, front] */
    const camera = h('div', { class: 'atrium-camera' });
    const back = s('svg', { class: 'atrium-layer layer-back', 'aria-hidden': 'true', focusable: 'false' });
    const main = s('svg', { class: 'atrium-layer layer-main', role: 'group', 'aria-label': t('atrium.label') });
    const front = s('svg', { class: 'atrium-layer layer-front', 'aria-hidden': 'true', focusable: 'false' });
    camera.append(back, main, front);
    stage.appendChild(camera);
    const LAYERS = [[back, 0.85], [main, 1], [front, 1.12]];

    /* ------------------------------------------------------ SVG defs */
    function defs() {
      return s('defs', null,
        s('linearGradient', { id: `${uid}-marble`, x1: 0, y1: 0, x2: 1, y2: 1 },
          s('stop', { offset: 0, class: 'st-m1' }), s('stop', { offset: 0.55, class: 'st-m2' }), s('stop', { offset: 1, class: 'st-m1' })),
        s('linearGradient', { id: `${uid}-floor`, x1: 0, y1: 0, x2: 0, y2: 1 },
          s('stop', { offset: 0, class: 'st-f1' }), s('stop', { offset: 1, class: 'st-f2' })),
        s('linearGradient', { id: `${uid}-sky`, x1: 0, y1: 0, x2: 0, y2: 1 },
          s('stop', { offset: 0, class: 'st-s1' }), s('stop', { offset: 1, class: 'st-s2' })),
        s('linearGradient', { id: `${uid}-ray`, x1: 0, y1: 0, x2: 0, y2: 1 },
          s('stop', { offset: 0, class: 'st-r1' }), s('stop', { offset: 1, class: 'st-r2' })),
        s('linearGradient', { id: `${uid}-shade`, x1: 0, y1: 0, x2: 0, y2: 1 },
          s('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': 0.05 }), s('stop', { offset: 0.55, 'stop-color': '#000', 'stop-opacity': 0.2 }), s('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.72 })),
        s('linearGradient', { id: `${uid}-glass`, x1: 0, y1: 0, x2: 1, y2: 1 },
          s('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.55 }), s('stop', { offset: 0.5, 'stop-color': '#dbe8f5', 'stop-opacity': 0.12 }), s('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0.35 })),
        s('linearGradient', { id: `${uid}-gold`, x1: 0, y1: 0, x2: 1, y2: 0 },
          s('stop', { offset: 0, 'stop-color': '#b8862b' }), s('stop', { offset: 0.5, 'stop-color': '#f2d27c' }), s('stop', { offset: 1, 'stop-color': '#b8862b' })),
        s('linearGradient', { id: `${uid}-reflect`, x1: 0, y1: 0, x2: 0, y2: 1 },
          s('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.32 }), s('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 })),
        s('linearGradient', { id: `${uid}-fadeout`, x1: 0, y1: 0, x2: 0, y2: 1 },
          s('stop', { offset: 0, class: 'st-f1', 'stop-opacity': 0.35 }), s('stop', { offset: 1, class: 'st-f1', 'stop-opacity': 1 })),
        s('radialGradient', { id: `${uid}-bulb` },
          s('stop', { offset: 0, 'stop-color': '#fff4cf', 'stop-opacity': 0.95 }), s('stop', { offset: 0.35, 'stop-color': '#ffd98a', 'stop-opacity': 0.45 }), s('stop', { offset: 1, 'stop-color': '#ffd98a', 'stop-opacity': 0 })),
        s('radialGradient', { id: `${uid}-water`, cx: 0.5, cy: 0.4, r: 0.6 },
          s('stop', { offset: 0, class: 'st-w1' }), s('stop', { offset: 1, class: 'st-w2' })),
        s('pattern', { id: `${uid}-veins`, width: 240, height: 180, patternUnits: 'userSpaceOnUse' },
          s('path', { class: 'a-vein', d: 'M-10 40C40 20 70 70 120 52S200 10 250 30M-10 130c50-24 90 18 140 0s80-40 120-26M60 180c10-30 40-50 80-60' }))
      );
    }

    /* ------------------------------------------------------ back layer */
    function buildBack() {
      const { M, H } = lay;
      const g = s('g');
      g.append(
        s('rect', { class: 'a-wall', x: -400, y: 0, width: M.W + 800, height: H + 400, fill: ref('marble') }),
        s('rect', { x: -400, y: 0, width: M.W + 800, height: H + 400, fill: ref('veins') })
      );
      // Skylight: a big barrel-vault of glass over the atrium
      const top = 18, bottom = M.sky + 36;
      const sky = s('g', { class: 'a-skylight' });
      const arch = `M${-40} ${bottom}L${-40} ${top + 120}Q${M.W / 2} ${top - 70} ${M.W + 40} ${top + 120}L${M.W + 40} ${bottom}Z`;
      sky.appendChild(s('path', { d: arch, fill: ref('sky') }));
      // stars (night) and sun glow (day)
      for (let i = 0; i < 34; i++) {
        const x = (i * 211) % M.W, y = top + 50 + ((i * 97) % (bottom - top - 70));
        sky.appendChild(s('circle', { class: 'a-star', cx: x, cy: y, r: (i % 3) * 0.6 + 0.9, style: { animationDelay: `${(i % 7) * -0.6}s` } }));
      }
      sky.appendChild(s('circle', { class: 'a-sun', cx: M.W * 0.72, cy: top + 90, r: 70 }));
      // mullions
      let mull = '';
      const cols = mode === 'wide' ? 16 : 8;
      for (let i = 0; i <= cols; i++) {
        const x = -40 + (i * (M.W + 80)) / cols;
        const archY = top + 120 - (1 - Math.pow((x - M.W / 2) / (M.W / 2 + 40), 2)) * 95;
        mull += `M${x.toFixed(1)} ${bottom}V${archY.toFixed(1)}`;
      }
      for (let r = 1; r <= 3; r++) mull += `M-40 ${bottom - r * ((bottom - top - 60) / 4)}H${M.W + 40}`;
      sky.appendChild(s('path', { class: 'a-mullion', d: mull }));
      sky.appendChild(s('path', { class: 'a-arch', d: `M${-40} ${top + 120}Q${M.W / 2} ${top - 70} ${M.W + 40} ${top + 120}` }));
      sky.appendChild(s('rect', { class: 'a-cornice', x: -40, y: bottom - 14, width: M.W + 80, height: 14 }));
      g.appendChild(sky);
      return g;
    }

    /* ----------------------------------------------------- front layer */
    function buildFront() {
      const { M, floors, H } = lay;
      const g = s('g');
      // Light rays from the skylight (moving gently)
      const rays = s('g', { class: 'a-rays' });
      const rayDefs = mode === 'wide' ? [[260, 160], [560, 120], [900, 180], [1220, 140], [1420, 110]] : [[160, 90], [420, 80], [640, 90]];
      rayDefs.forEach(([x, w], i) => {
        const len = Math.min(H * 0.75, floors[2].bottom);
        rays.appendChild(s('polygon', {
          class: 'a-ray', fill: ref('ray'),
          points: `${x},${M.sky - 30} ${x + w},${M.sky - 30} ${x + w * 2.4 + 120},${len} ${x + w * 0.4 + 60},${len}`,
          style: { animationDelay: `${i * -2.3}s`, animationDuration: `${9 + i * 1.7}s` },
        }));
      });
      g.appendChild(rays);
      // Pendant lamps hanging in the void (over the elevator sides and the bands)
      const lampXs = mode === 'wide' ? [150, 470, 650, 950, 1130, 1450] : [32, 250, 550, 768];
      lampXs.forEach((x, i) => {
        const dropTo = floors[((i % 3) + 2)].top + 20 + (i % 2) * 70;
        const lamp = s('g', { class: 'a-lamp', style: { animationDelay: `${i * -0.9}s` } },
          s('line', { class: 'a-cord', x1: x, y1: M.sky - 30, x2: x, y2: dropTo }),
          s('circle', { class: 'a-lamp-glow', cx: x, cy: dropTo + 26, r: 70, fill: ref('bulb') }),
          s('path', { class: 'a-shade', d: `M${x - 22} ${dropTo + 22}Q${x} ${dropTo - 8} ${x + 22} ${dropTo + 22}Z` }),
          s('rect', { class: 'a-shade-rim', x: x - 23, y: dropTo + 20, width: 46, height: 4, rx: 2 }),
          s('circle', { class: 'a-bulb', cx: x, cy: dropTo + 26, r: 6 })
        );
        g.appendChild(lamp);
      });
      // Floating sparkles in the light
      if (!Mall.motion.lite) {
        for (let i = 0; i < (mode === 'wide' ? 18 : 8); i++) {
          g.appendChild(s('circle', { class: 'a-dust', cx: 120 + ((i * 263) % (M.W - 200)), cy: M.sky + ((i * 151) % 900), r: 1.6 + (i % 3) * 0.6, style: { animationDelay: `${(i % 9) * -1.1}s` } }));
        }
      }
      return g;
    }

    /* ------------------------------------------------------ main layer */
    function pillar(x, y, h0) {
      return s('g', { class: 'a-pillar' },
        s('rect', { x: x - 9, y, width: 18, height: h0, fill: ref('marble') }),
        s('rect', { class: 'a-pillar-edge', x: x - 9, y, width: 18, height: h0 }),
        s('rect', { x: x - 12, y, width: 24, height: 8, fill: ref('gold') }),
        s('rect', { x: x - 12, y: y + h0 - 8, width: 24, height: 8, fill: ref('gold') }));
    }

    function planter(x, y, big) {
      const w = big ? 46 : 32, hh = big ? 34 : 26;
      const g = s('g', { class: 'a-planter' });
      // leaves: dusty sage, with coral blossoms so the palette stays warm
      const leaves = big ? 7 : 5;
      for (let i = 0; i < leaves; i++) {
        const a = -70 + (140 / (leaves - 1)) * i;
        const rad = (a * Math.PI) / 180;
        const len = (big ? 44 : 32) * (0.75 + (i % 2) * 0.3);
        const ex = x + Math.sin(rad) * len, ey = y - Math.cos(rad) * len;
        g.appendChild(s('path', { class: 'a-leaf', d: `M${x} ${y}Q${(x + ex) / 2 + 8} ${(y + ey) / 2} ${ex} ${ey}Q${(x + ex) / 2 - 8} ${(y + ey) / 2} ${x} ${y}` }));
      }
      if (big) [[-12, -36], [14, -30], [2, -46]].forEach(([dx, dy]) => g.appendChild(s('circle', { class: 'a-blossom', cx: x + dx, cy: y + dy, r: 4.5 })));
      g.append(
        s('path', { class: 'a-pot', d: `M${x - w / 2} ${y}h${w}l-5 ${hh}h${-(w - 10)}Z` }),
        s('rect', { x: x - w / 2 - 2, y: y - 3, width: w + 4, height: 6, rx: 2, fill: ref('gold') })
      );
      return g;
    }

    function bench(x, y) {
      return s('g', { class: 'a-bench' },
        s('rect', { class: 'a-bench-seat', x: x - 34, y: y - 14, width: 68, height: 9, rx: 4 }),
        s('rect', { class: 'a-bench-back', x: x - 34, y: y - 30, width: 68, height: 8, rx: 4 }),
        s('rect', { x: x - 30, y: y - 5, width: 5, height: 10, fill: ref('gold') }),
        s('rect', { x: x + 25, y: y - 5, width: 5, height: 10, fill: ref('gold') }));
    }

    /** One shop front. `slot` is a layout entry { store, x, y, w, h }. */
    function shopFront(slot, index) {
      const { store: st, x, y, w, h: hh } = slot;
      if (!st) {
        return s('g', { class: 'shop-empty' },
          s('rect', { class: 'shop-empty-box', x, y: y + 6, width: w, height: hh - 6, rx: 10 }),
          s('text', { class: 'shop-empty-text', x: x + w / 2, y: y + hh / 2, 'text-anchor': 'middle' }, t('atrium.empty')));
      }
      const name = L(st.name);
      const cat = L(st.category);
      const color = st.color;
      const dark = C.mix(color, '#141a30', 0.45);
      const g = s('g', {
        class: 'shop', 'data-id': st.id, tabindex: 0, role: 'button',
        'aria-label': t('atrium.storeAria', { name, category: cat, floor: t('floor.n', { n: st.floor }) }),
        style: { '--c': color, '--c-dark': dark, '--d': `${(index * 140) % 1400}ms` },
      });

      // --- sign board
      const signH = 40;
      const sign = s('g', { class: 'shop-sign' });
      sign.appendChild(s('rect', { class: 'shop-sign-glow', x: x + 2, y: y + 2, width: w - 4, height: signH - 4, rx: 7 }));
      sign.appendChild(s('rect', { class: 'shop-sign-board', x, y, width: w, height: signH, rx: 7 }));
      sign.appendChild(s('rect', { class: 'shop-sign-line', x: x + 5, y: y + 5, width: w - 10, height: signH - 10, rx: 4 }));
      const showLogo = w > 150;
      const fit = fitText(name, w - (showLogo ? 52 : 18), mode === 'wide' ? 19 : 18, 10, 0.6);
      const textX = showLogo ? x + 38 + (w - 46) / 2 : x + w / 2;
      if (showLogo) sign.appendChild(s('text', { class: 'shop-sign-logo', x: x + 22, y: y + 27, 'text-anchor': 'middle', 'font-size': 18 }, st.logo));
      sign.appendChild(s('text', { class: 'shop-sign-text', x: textX, y: y + signH / 2 + fit.size * 0.36, 'text-anchor': 'middle', 'font-size': fit.size }, fit.text));
      g.appendChild(sign);

      // --- awning with scalloped edge
      const ay = y + signH + 2, ah = 22;
      const stripes = Math.max(4, Math.round(w / 22));
      const sw = w / stripes;
      const awn = s('g', { class: 'shop-awning' });
      for (let i = 0; i < stripes; i++) {
        awn.appendChild(s('rect', { class: i % 2 ? 'awn-b' : 'awn-a', x: x + i * sw, y: ay, width: sw + 0.5, height: ah }));
      }
      let scallop = `M${x} ${ay + ah}`;
      for (let i = 0; i < stripes; i++) scallop += `q${sw / 2} ${sw / 2.2} ${sw} 0`;
      awn.appendChild(s('path', { class: 'awn-edge', d: scallop + `V${ay + ah - 1}H${x}Z` }));
      awn.appendChild(s('rect', { class: 'awn-top', x: x - 3, y: ay - 2, width: w + 6, height: 5, rx: 2 }));
      g.appendChild(awn);

      // --- facade (window + door)
      const fy = ay + ah + 8, fh = y + hh - fy;
      g.appendChild(s('rect', { class: 'shop-facade', x, y: fy - 4, width: w, height: fh + 4, rx: 4 }));
      const doorW = Math.max(46, Math.min(w * 0.34, 92));
      const winX = x + 7, winY = fy + 4, winW = w - doorW - 20, winH = fh - 14;
      const clipId = `${uid}-win-${st.id}`;
      g.appendChild(s('clipPath', { id: clipId }, s('rect', { x: winX, y: winY, width: winW, height: winH, rx: 4 })));
      const win = s('g', { class: 'shop-window', 'clip-path': `url(#${clipId})` });
      win.appendChild(s('rect', { class: 'shop-window-fallback', x: winX, y: winY, width: winW, height: winH }));
      const img = s('image', { class: 'shop-photo', x: winX, y: winY, width: winW, height: winH, preserveAspectRatio: 'xMidYMid slice' });
      win.appendChild(img);
      win.appendChild(s('rect', { class: 'shop-window-shade', x: winX, y: winY, width: winW, height: winH, fill: ref('shade') }));
      win.appendChild(s('rect', { class: 'shop-light', x: winX, y: winY, width: winW, height: winH }));
      win.appendChild(s('polygon', { class: 'shop-reflection', points: `${winX + winW * 0.15},${winY} ${winX + winW * 0.34},${winY} ${winX + winW * 0.02},${winY + winH} ${winX - winW * 0.17},${winY + winH}` }));
      const catFit = fitText(cat.toUpperCase(), winW - 18, 11, 7.5, 0.8);   // bold caps + letter-spacing are wide
      win.appendChild(s('text', { class: 'shop-window-cat', x: winX + 10, y: winY + winH - 12, 'font-size': catFit.size }, catFit.text));
      g.appendChild(win);
      g.appendChild(s('rect', { class: 'shop-window-frame', x: winX, y: winY, width: winW, height: winH, rx: 4 }));

      // door: two glass leaves that slide open when you enter
      const dx = x + w - doorW - 7, dy = fy + 4, dh = fh - 8;
      const door = s('g', { class: 'shop-door' });
      door.appendChild(s('rect', { class: 'shop-door-inside', x: dx, y: dy, width: doorW, height: dh, rx: 3 }));
      const leafW = doorW / 2;
      for (const side of [0, 1]) {
        door.appendChild(s('g', { class: side ? 'door-r' : 'door-l' },
          s('rect', { class: 'door-glass', x: dx + side * leafW + 1, y: dy + 1, width: leafW - 2, height: dh - 2, rx: 2 }),
          s('rect', { x: dx + side * leafW + 1, y: dy + 1, width: leafW - 2, height: dh - 2, rx: 2, fill: ref('glass'), opacity: 0.6 }),
          s('rect', { class: 'door-handle', x: side ? dx + leafW + 5 : dx + leafW - 8, y: dy + dh * 0.45, width: 3, height: dh * 0.18, rx: 1.5 })
        ));
      }
      door.appendChild(s('rect', { class: 'shop-door-frame', x: dx, y: dy, width: doorW, height: dh, rx: 3 }));
      g.appendChild(door);
      g.appendChild(s('rect', { class: 'shop-threshold', x: dx - 4, y: y + hh - 4, width: doorW + 8, height: 4, rx: 2 }));
      g.appendChild(s('rect', { class: 'shop-pulse', x: x - 4, y: y - 4, width: w + 8, height: hh + 8, rx: 12 }));
      g.appendChild(s('rect', { class: 'shop-focus', x: x - 3, y: y - 3, width: w + 6, height: hh + 6, rx: 11 }));

      // photo: custom cover → bundled photo → gradient fallback
      const photoRef = st.cover || st.photo;
      if (photoRef) {
        img.addEventListener('error', () => img.remove(), { once: true });
        Mall.images.url(photoRef, 'sm').then((u) => { if (u) img.setAttribute('href', u); else img.remove(); }).catch(() => img.remove());
      } else img.remove();

      g.__door = { x: dx + doorW / 2, y: dy + dh / 2 };
      bindShop(g, st.id);
      shopEls.set(st.id, g);
      return g;
    }

    function escalator(x0, y0, x1, y1, up, cls) {
      // Side view: a truss with glass balustrade, moving steps and gold handrail.
      const g = s('g', { class: ['a-esc', cls] });
      const off = 26;
      g.appendChild(s('path', { class: 'esc-truss', d: `M${x0} ${y0}L${x1} ${y1}L${x1} ${y1 + off}L${x0} ${y0 + off}Z` }));
      g.appendChild(s('path', { class: 'esc-glass', d: `M${x0} ${y0 - 34}L${x1} ${y1 - 34}L${x1} ${y1}L${x0} ${y0}Z`, fill: ref('glass') }));
      g.appendChild(s('path', { class: ['esc-steps', up ? 'is-up' : 'is-down'], d: `M${x0 + 6} ${y0 + 4}L${x1 - 6} ${y1 + 4}` }));
      g.appendChild(s('path', { class: 'esc-rail', d: `M${x0 - 10} ${y0 - 30}L${x1 + 10} ${y1 - 30}` }));
      g.appendChild(s('path', { class: 'esc-rail-shadow', d: `M${x0} ${y0 - 26}L${x1} ${y1 - 26}` }));
      return g;
    }

    function person(x, y, color, flip, scaleK = 1) {
      const p = s('g', { class: 'a-person', transform: `translate(${x} ${y})` });
      const body = s('g', { class: 'a-person-body', transform: `scale(${(flip ? -1 : 1) * scaleK} ${scaleK})` },
        s('line', { class: 'a-leg a-leg-l', x1: -2.5, y1: -12, x2: -3.5, y2: 0 }),
        s('line', { class: 'a-leg a-leg-r', x1: 2.5, y1: -12, x2: 3.5, y2: 0 }),
        s('rect', { x: -6, y: -30, width: 12, height: 20, rx: 5, fill: color }),
        s('circle', { class: 'a-head', cx: 0, cy: -36, r: 5.4 }),
        s('path', { class: 'a-hair', d: 'M-5.4 -37a5.4 5.4 0 0 1 10.8 0c-2-2.4-8.8-2.4-10.8 0Z' }),
        s('rect', { class: 'a-bag', x: 5, y: -20, width: 6, height: 8, rx: 1.5, fill: C.mix(color, '#ffffff', 0.35) })
      );
      p.appendChild(body);
      return p;
    }

    let walkers = [];

    function buildMain() {
      const { M, floors, groundTop, H, cx } = lay;
      walkers = [];
      shopEls.clear();
      const g = s('g', { class: 'a-scene' });

      // Elevator shaft background (behind floors' slabs, visible between)
      const shaftX = cx - M.shaft / 2;

      for (let f = FLOORS; f >= 1; f--) {
        const F = floors[f];
        const fg = s('g', { class: 'a-floor', 'data-floor': f, id: `${uid}-floor-${f}` });
        // wall
        fg.appendChild(s('rect', { class: 'a-floor-wall', x: 0, y: F.top, width: M.W, height: F.h, fill: ref('marble') }));
        fg.appendChild(s('rect', { x: 0, y: F.top, width: M.W, height: F.h, fill: ref('veins') }));
        // ceiling band with downlights
        fg.appendChild(s('rect', { class: 'a-ceiling', x: 0, y: F.top, width: M.W, height: M.ceiling - 12 }));
        fg.appendChild(s('rect', { x: 0, y: F.top + M.ceiling - 14, width: M.W, height: 3, fill: ref('gold') }));
        for (let x = 40; x < M.W; x += mode === 'wide' ? 80 : 60) {
          fg.appendChild(s('circle', { class: 'a-downlight', cx: x, cy: F.top + M.ceiling - 22, r: 3.4 }));
          fg.appendChild(s('path', { class: 'a-downlight-beam', d: `M${x - 3} ${F.top + M.ceiling - 18}L${x - 22} ${F.top + M.ceiling + 46}H${x + 22}L${x + 3} ${F.top + M.ceiling - 18}Z` }));
        }
        // pillars at the store area edges
        const pTop = F.top + M.ceiling - 12, pH = F.walkTop - pTop;
        [lay.leftArea[0] - 6, lay.rightArea[1] + 6].forEach((px) => fg.appendChild(pillar(px, pTop, pH)));
        // shop fronts
        const shops = s('g', { class: 'a-shops' });
        F.shops.forEach((slot, i) => shops.appendChild(shopFront(slot, i + f * 7)));
        fg.appendChild(shops);
        // walkway (polished floor of the level)
        fg.appendChild(s('rect', { class: 'a-walk', x: 0, y: F.walkTop, width: M.W, height: M.walk, fill: ref('floor') }));
        fg.appendChild(s('rect', { class: 'a-walk-shine', x: 0, y: F.walkTop, width: M.W, height: 10 }));
        // planters and benches in the bands and beside the shaft
        if (mode === 'wide') {
          fg.appendChild(planter(M.band - 34, F.walkTop + 30, true));
          fg.appendChild(planter(M.W - M.band + 34, F.walkTop + 30, true));
          if (f === 1 || f === 3) fg.appendChild(bench(M.band / 2 + 10, F.walkTop + 36));
          if (f === 2 || f === 4) fg.appendChild(bench(M.W - M.band / 2 - 10, F.walkTop + 36));
          fg.appendChild(planter(shaftX - 20, F.walkTop + 28, false));
          fg.appendChild(planter(shaftX + M.shaft + 20, F.walkTop + 28, false));
        } else {
          fg.appendChild(planter(shaftX - 16, F.walkTop + 28, false));
          fg.appendChild(planter(shaftX + M.shaft + 16, F.walkTop + 28, false));
        }
        // people on this floor's walkway
        const people = s('g', { class: 'a-people' });
        const count = Mall.motion.lite ? 1 : mode === 'wide' ? 3 : 2;
        for (let i = 0; i < count; i++) {
          const side = i % 2;
          const [a0, a1] = side ? [cx + M.shaft / 2 + 26, M.W - (mode === 'wide' ? M.band - 40 : 20)] : [mode === 'wide' ? M.band - 40 : 20, cx - M.shaft / 2 - 26];
          const color = PALETTE_PEOPLE[(f * 3 + i) % PALETTE_PEOPLE.length];
          const startX = a0 + ((i * 137 + f * 53) % Math.max(1, a1 - a0));
          const py = F.walkTop + 46 + (i % 2) * 8;
          const el = person(startX, py, color, false, mode === 'wide' ? 1 : 1.15);
          people.appendChild(el);
          walkers.push({ el, body: el.firstChild, x: startX, y: py, a0, a1, dir: (i + f) % 2 ? 1 : -1, speed: 16 + ((i * 7 + f * 3) % 12), pause: 0, k: mode === 'wide' ? 1 : 1.15 });
        }
        fg.appendChild(people);
        // glass railing + slab edge (floor 1 has no railing: it is the ground)
        const slabY = F.bottom - 20;
        if (f > 1) {
          const rail = s('g', { class: 'a-rail' });
          rail.appendChild(s('rect', { class: 'a-rail-glass', x: 0, y: F.walkTop + 8, width: M.W, height: slabY - F.walkTop - 8, fill: ref('glass') }));
          let posts = '';
          for (let x = 30; x < M.W; x += 90) posts += `M${x} ${F.walkTop + 8}V${slabY}`;
          rail.appendChild(s('path', { class: 'a-rail-posts', d: posts }));
          rail.appendChild(s('rect', { x: 0, y: F.walkTop + 4, width: M.W, height: 5, rx: 2, fill: ref('gold') }));
          fg.appendChild(rail);
          fg.appendChild(s('rect', { class: 'a-slab', x: 0, y: slabY, width: M.W, height: 20 }));
          fg.appendChild(s('rect', { x: 0, y: slabY, width: M.W, height: 2.5, fill: ref('gold') }));
        }
        // floor badge on the slab next to the shaft
        const by = f > 1 ? slabY + 10 : F.walkTop + 36;
        fg.appendChild(s('g', { class: 'a-floor-badge' },
          s('circle', { cx: shaftX - 26, cy: by, r: 13 }),
          s('text', { x: shaftX - 26, y: by + 5, 'text-anchor': 'middle' }, String(f))));
        g.appendChild(fg);
      }

      // Escalators: left band 1→2 and 3→4, right band 2→3 (and 4→3 down on the left in wide mode)
      const walkY = (f) => floors[f].walkTop + 50;
      const escs = s('g', { class: 'a-escalators' });
      const bandL = [16, M.band - 22], bandR = [M.W - M.band + 22, M.W - 16];
      if (mode === 'compact') { bandL[0] = 6; bandL[1] = M.band - 6; bandR[0] = M.W - M.band + 6; bandR[1] = M.W - 6; }
      escs.appendChild(escalator(bandL[0], walkY(1), bandL[1], walkY(2), true, 'esc-1'));
      escs.appendChild(escalator(bandR[1], walkY(2), bandR[0], walkY(3), true, 'esc-2'));
      escs.appendChild(escalator(bandL[0], walkY(3), bandL[1], walkY(4), true, 'esc-3'));
      if (mode === 'wide') escs.appendChild(escalator(bandR[1], walkY(3), bandR[0], walkY(4), false, 'esc-4'));
      g.appendChild(escs);

      // Elevator: glass shaft through every floor with a moving cabin
      const shaftTop = M.sky - 10, shaftBottom = groundTop + 30;
      const shaft = s('g', { class: 'a-shaft' });
      shaft.appendChild(s('rect', { class: 'a-shaft-glass', x: shaftX, y: shaftTop, width: M.shaft, height: shaftBottom - shaftTop, fill: ref('glass') }));
      let frames = `M${shaftX} ${shaftTop}V${shaftBottom}M${shaftX + M.shaft} ${shaftTop}V${shaftBottom}M${cx} ${shaftTop}V${shaftBottom}`;
      for (let f = FLOORS; f >= 1; f--) frames += `M${shaftX} ${floors[f].bottom - 10}H${shaftX + M.shaft}`;
      shaft.appendChild(s('path', { class: 'a-shaft-frame', d: frames }));
      const cabinW = M.shaft - 18, cabinH = Math.min(120, M.walk + 70);
      const cabin = s('g', { class: 'a-cabin' });
      const cx0 = shaftX + 9;
      cabin.append(
        s('line', { class: 'a-cable', x1: cx, y1: -4000, x2: cx, y2: 0 }),
        s('rect', { class: 'a-cabin-body', x: cx0, y: 0, width: cabinW, height: cabinH, rx: 8 }),
        s('rect', { x: cx0 + 4, y: 6, width: cabinW - 8, height: cabinH - 16, rx: 5, fill: ref('glass') }),
        s('rect', { x: cx0, y: 0, width: cabinW, height: 7, rx: 3, fill: ref('gold') }),
        s('rect', { x: cx0, y: cabinH - 8, width: cabinW, height: 8, rx: 3, fill: ref('gold') }),
        s('circle', { class: 'a-cabin-light', cx, cy: 14, r: 4 })
      );
      // two tiny passengers
      cabin.appendChild(person(cx - cabinW * 0.18, cabinH - 9, '#c2547a', false, 0.9));
      cabin.appendChild(person(cx + cabinW * 0.2, cabinH - 9, '#1f2a4d', true, 0.9));
      shaft.appendChild(cabin);
      g.appendChild(shaft);
      cabinEl = cabin;
      cabinH0 = cabinH;

      // Ground floor: marble with reflections, fountain, info desk, entrance
      const gy = groundTop;
      const gr = s('g', { class: 'a-ground' });
      gr.appendChild(s('rect', { class: 'a-marble-floor', x: -200, y: gy, width: M.W + 400, height: H - gy + 400, fill: ref('floor') }));
      // checker inlay
      let inlay = '';
      for (let x = -40; x < M.W + 40; x += mode === 'wide' ? 120 : 90) inlay += `M${x} ${gy}L${x + (x - cx) * 0.6} ${H + 20}`;
      for (let i = 1; i < 5; i++) { const yy = gy + (H - gy) * (i * i) / 25; inlay += `M-200 ${yy}H${M.W + 200}`; }
      gr.appendChild(s('path', { class: 'a-inlay', d: inlay }));
      // Mirrored reflection of the ground-floor shop fronts: only a short band right
      // under the shops (a polished floor reflects what is near), fading out quickly.
      const reflH = mode === 'wide' ? 150 : 120;
      gr.appendChild(s('clipPath', { id: `${uid}-reflclip` }, s('rect', { x: -200, y: gy, width: M.W + 400, height: reflH })));
      gr.appendChild(s('g', { 'clip-path': `url(#${uid}-reflclip)` },
        s('use', { class: 'a-reflection', href: `#${uid}-floor-1`, transform: `translate(0 ${gy * 2}) scale(1 -1)` }),
        s('rect', { class: 'a-reflection-fade', x: -200, y: gy, width: M.W + 400, height: reflH, fill: ref('fadeout') })));
      gr.appendChild(s('rect', { class: 'a-floor-gloss', x: -200, y: gy, width: M.W + 400, height: 40 }));
      // fountain
      const fx = cx, fyy = gy + (mode === 'wide' ? 160 : 150);
      const rx = mode === 'wide' ? 170 : 140;
      const fountain = s('g', { class: 'a-fountain' },
        s('ellipse', { class: 'a-fountain-shadow', cx: fx, cy: fyy + 24, rx: rx + 18, ry: 30 }),
        s('ellipse', { class: 'a-fountain-rim', cx: fx, cy: fyy, rx, ry: 36 }),
        s('ellipse', { cx: fx, cy: fyy - 2, rx: rx - 12, ry: 27, fill: ref('water') }),
        s('ellipse', { class: 'a-ripple', cx: fx, cy: fyy - 2, rx: rx - 40, ry: 18 }),
        s('ellipse', { class: 'a-ripple a-ripple-2', cx: fx, cy: fyy - 2, rx: rx - 40, ry: 18 }),
        s('rect', { class: 'a-fountain-column', x: fx - 9, y: fyy - 56, width: 18, height: 56, rx: 5 }),
        s('ellipse', { class: 'a-fountain-bowl', cx: fx, cy: fyy - 56, rx: 46, ry: 10 })
      );
      for (const [dx, hgt] of [[-1, 90], [1, 90], [-0.5, 120], [0.5, 120], [0, 150]]) {
        fountain.appendChild(s('path', { class: 'a-jet', d: `M${fx} ${fyy - 60}Q${fx + dx * 60} ${fyy - 60 - hgt} ${fx + dx * (rx - 50)} ${fyy - 10}`, style: { animationDelay: `${(dx + 1) * -0.35}s` } }));
      }
      gr.appendChild(fountain);
      // info desk
      const ix = mode === 'wide' ? cx + 420 : cx + 250, iy = gy + (mode === 'wide' ? 150 : 250);
      const deskW = mode === 'wide' ? 190 : 150;
      gr.appendChild(s('g', { class: 'a-info' },
        s('path', { class: 'a-info-desk', d: `M${ix - deskW / 2} ${iy}Q${ix} ${iy - 24} ${ix + deskW / 2} ${iy}V${iy + 52}Q${ix} ${iy + 34} ${ix - deskW / 2} ${iy + 52}Z` }),
        s('path', { d: `M${ix - deskW / 2} ${iy}Q${ix} ${iy - 24} ${ix + deskW / 2} ${iy}`, class: 'a-info-top' }),
        s('circle', { class: 'a-info-badge', cx: ix, cy: iy - 46, r: 15 }),
        s('text', { class: 'a-info-i', x: ix, y: iy - 40, 'text-anchor': 'middle' }, 'i'),
        s('text', { class: 'a-info-label', x: ix, y: iy + 32, 'text-anchor': 'middle' }, t('atrium.info'))
      ));
      if (mode === 'wide') {
        gr.appendChild(bench(cx - 420, gy + 170));
        gr.appendChild(planter(cx - 560, gy + 150, true));
        gr.appendChild(planter(cx + 600, gy + 140, true));
      } else {
        gr.appendChild(planter(cx - 300, gy + 260, true));
      }
      // entrance mat
      const matW = mode === 'wide' ? 420 : 320;
      gr.appendChild(s('g', { class: 'a-mat' },
        s('rect', { x: cx - matW / 2, y: H - 64, width: matW, height: 44, rx: 8 }),
        s('text', { x: cx, y: H - 36, 'text-anchor': 'middle' }, t('atrium.welcome').toUpperCase())));
      // ground floor walkers on the marble
      const groundPeople = s('g', { class: 'a-people' });
      const gCount = Mall.motion.lite ? 1 : mode === 'wide' ? 4 : 2;
      for (let i = 0; i < gCount; i++) {
        const a0 = 40, a1 = M.W - 40;
        const py = gy + (mode === 'wide' ? 245 : 120) + (i % 2) * 26;
        const startX = a0 + ((i * 311) % (a1 - a0));
        const el = person(startX, py, PALETTE_PEOPLE[(i * 4 + 1) % PALETTE_PEOPLE.length], false, mode === 'wide' ? 1.25 : 1.4);
        groundPeople.appendChild(el);
        walkers.push({ el, body: el.firstChild, x: startX, y: py, a0, a1, dir: i % 2 ? 1 : -1, speed: 20 + i * 4, pause: 0, k: mode === 'wide' ? 1.25 : 1.4 });
      }
      gr.appendChild(groundPeople);
      g.appendChild(gr);
      return g;
    }

    let cabinEl = null;
    let cabinH0 = 100;

    /* ---------------------------------------------------------- build */
    function build() {
      const vw = stage.clientWidth || global.innerWidth;
      const vh = stage.clientHeight || global.innerHeight;
      mode = vw < 760 || vw / vh < 0.78 ? 'compact' : 'wide';
      lay = computeLayout(stores, mode);
      stage.dataset.mode = mode;
      scale = vw / lay.M.W;

      for (const [svg] of LAYERS) Mall.dom.clear(svg);
      back.appendChild(defs());
      back.appendChild(buildBack());
      main.appendChild(defs());
      main.appendChild(buildMain());
      front.appendChild(defs());
      front.appendChild(buildFront());

      for (const [svg] of LAYERS) {
        svg.setAttribute('viewBox', `0 0 ${lay.M.W} ${lay.H}`);
        svg.setAttribute('width', String(Math.round(lay.M.W * scale)));
        svg.setAttribute('height', String(Math.round(lay.H * scale)));
      }
      main.setAttribute('aria-label', t('atrium.label'));
      applySearch();
      if (activeId) setActive(activeId);
      moveCabin(floor, false);
      applyCamera();
    }

    /* --------------------------------------------------------- camera */
    const viewH = () => stage.clientHeight || global.innerHeight;
    const maxCam = () => Math.max(0, lay.H - viewH() / scale);
    const clampCam = (v) => Mall.clamp(v, 0, maxCam());

    /** Camera position that frames floor f (its shop fronts slightly above centre). */
    function floorCam(f) {
      const F = lay.floors[f];
      const focus = f === 1 ? F.top + F.h * 0.62 : F.top + F.h * 0.52;
      return clampCam(focus - (viewH() / scale) * 0.5);
    }

    function applyCamera() {
      if (!lay) return;
      for (const [svg, k] of LAYERS) {
        const y = -cam * k * scale;
        svg.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      }
      camera.style.transform = zoom !== 1 ? `scale(${zoom.toFixed(4)})` : '';
      if (o.onCamera) o.onCamera(cam);
    }

    function nearestFloor(c = cam) {
      let best = 1, bestD = Infinity;
      for (let f = 1; f <= FLOORS; f++) {
        const d = Math.abs(floorCam(f) - c);
        if (d < bestD) { bestD = d; best = f; }
      }
      return best;
    }

    /** rAF tween of the camera (and optional zoom). Resolves when done. */
    function tweenCamera(to, { duration = 900, zoomTo = zoom, ease = 'inOut', origin } = {}) {
      cancelAnimationFrame(camAnim);
      const from = cam, z0 = zoom;
      if (origin) camera.style.transformOrigin = `${origin.x}px ${origin.y}px`;
      if (Mall.motion.reduced || duration <= 0) {
        cam = to; zoom = zoomTo; applyCamera();
        return Promise.resolve();
      }
      stage.classList.add('is-moving');
      const E = ease === 'out' ? (x) => 1 - Math.pow(1 - x, 3) : (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
      return new Promise((resolve) => {
        const start = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const e = E(p);
          cam = from + (to - from) * e;
          zoom = z0 + (zoomTo - z0) * e;
          applyCamera();
          if (p < 1) camAnim = requestAnimationFrame(step);
          else { stage.classList.remove('is-moving'); resolve(); }
        };
        camAnim = requestAnimationFrame(step);
      });
    }

    function moveCabin(f, animate = true) {
      if (!cabinEl || !lay) return;
      const F = lay.floors[f];
      const y = (f === 1 ? F.walkTop : F.walkTop) + lay.M.walk - 18 - cabinH0;
      cabinEl.style.transition = animate && !Mall.motion.reduced ? '' : 'none';
      cabinEl.style.transform = `translateY(${y}px)`;
    }

    /** Go to a floor: the camera glides, the elevator cabin travels, escalators speed up. */
    function setFloor(f, { animate = true } = {}) {
      f = Mall.clamp(Math.round(f), 1, FLOORS);
      const dir = f > floor ? 'up' : f < floor ? 'down' : '';
      floor = f;
      moveCabin(f, animate);
      if (o.onFloor) o.onFloor(f, dir);
      return tweenCamera(floorCam(f), { duration: animate ? 950 : 0 });
    }

    /* ---------------------------------------------------------- intro */
    function playIntro({ speed = 1 } = {}) {
      stage.classList.add('is-lit');
      if (Mall.motion.reduced) { setFloor(1, { animate: false }); startPeople(); return Promise.resolve(); }
      cam = maxCam();
      zoom = 1.22;
      const vw = stage.clientWidth;
      camera.style.transformOrigin = `${vw / 2}px ${viewH() * 0.85}px`;
      applyCamera();
      stage.classList.add('is-intro');
      startPeople();
      floor = 1;
      moveCabin(1, false);
      if (o.onFloor) o.onFloor(1, '');
      return tweenCamera(floorCam(1), { duration: 2400 * speed, zoomTo: 1 }).then(() => {
        stage.classList.remove('is-intro');
        camera.style.transformOrigin = '';
      });
    }

    /* --------------------------------------------------------- people */
    let peopleRaf = 0, lastT = 0, running = false;
    function tickPeople(now) {
      peopleRaf = 0;
      if (!running || document.hidden) return;
      const minGap = Mall.motion.lite ? 33 : 16;
      if (now - lastT >= minGap) {
        const dt = Math.min(0.05, (now - (lastT || now)) / 1000);
        lastT = now;
        for (const w of walkers) {
          if (w.pause > 0) { w.pause -= dt; continue; }
          w.x += w.speed * dt * w.dir;
          if (w.x < w.a0 || w.x > w.a1) {
            w.x = Mall.clamp(w.x, w.a0, w.a1);
            w.dir *= -1;
            w.pause = 0.8 + Math.random() * 2.2;   // window shopping
            w.body.setAttribute('transform', `scale(${(w.dir < 0 ? -1 : 1) * w.k} ${w.k})`);
          }
          w.el.setAttribute('transform', `translate(${w.x.toFixed(1)} ${w.y})`);
        }
      }
      peopleRaf = requestAnimationFrame(tickPeople);
    }
    function startPeople() {
      if (Mall.motion.reduced || running) return;
      running = true;
      for (const w of walkers) w.body.setAttribute('transform', `scale(${(w.dir < 0 ? -1 : 1) * w.k} ${w.k})`);
      stage.classList.add('is-walking');
      peopleRaf = requestAnimationFrame(tickPeople);
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden && running && !peopleRaf) peopleRaf = requestAnimationFrame(tickPeople); });

    /* ================================================= hover & tooltip
     * THE HOVER BUG (fixed, keep it fixed): the first version listened to
     * `pointerover`/`pointerout` on the whole map. Those events BUBBLE, so
     * they fired again every time the cursor crossed a child of a store (sign,
     * window, door, text), and each firing rebuilt the tooltip and replayed
     * its entrance animation. Now:
     *   - each shop has its own pointerenter/pointerleave (non-bubbling)
     *   - hoveredId guards against re-entering the same shop
     *   - glow / window light are CSS :hover, never class toggles
     *   - the tooltip is one element, re-filled only when the shop changes
     *   - show after ~100 ms, hide after ~140 ms (hover intent)
     */
    let hoveredId = null;
    const tip = h('div', { class: 'atrium-tip', role: 'status', 'aria-hidden': 'true' });
    stage.parentElement.appendChild(tip);
    let tipFor = null, showTimer = 0, hideTimer = 0, tipRaf = 0;

    function bindShop(g, id) {
      g.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse' || hoveredId === id) return;
        hoveredId = id;
        clearTimeout(hideTimer);
        clearTimeout(showTimer);
        if (tipFor === id && tip.classList.contains('is-visible')) return;
        showTimer = setTimeout(() => showTip(id), tip.classList.contains('is-visible') ? 40 : 100);
      });
      g.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse' || hoveredId !== id) return;
        hoveredId = null;
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => { if (activeId !== tipFor) hideTip(); }, 140);
      });
      g.addEventListener('focus', () => showTip(id));
      g.addEventListener('blur', () => { if (activeId !== id) hideTip(); });
    }

    function fillTip(st) {
      Mall.dom.clear(tip);
      const open = Mall.isOpenNow(st.hours);
      tip.style.setProperty('--c', st.color);
      tip.append(
        h('div', { class: 'tip-head' },
          h('span', { class: 'tip-logo', 'aria-hidden': 'true' }, st.logo),
          h('div', null,
            h('strong', { class: 'tip-name' }, L(st.name)),
            h('span', { class: 'tip-meta' }, `${L(st.category)} · ${t('floor.n', { n: st.floor })}`))),
        h('div', { class: 'tip-row' },
          open == null ? null : h('span', { class: ['dot-status', open ? 'is-open' : 'is-closed'] }, t(open ? 'status.openNow' : 'status.closedNow')),
          h('span', { class: 'tip-hours' }, st.hours)),
        coarse
          ? h('button', { class: 'btn btn-primary btn-sm btn-block tip-enter', type: 'button', onclick: () => enter(st.id) }, t('tip.enter'), Mall.icon('arrow-right', { size: 16 }))
          : h('span', { class: 'tip-hint' }, t('tip.click'))
      );
    }

    function showTip(id) {
      const st = stores.find((x) => x.id === id);
      if (!st) return;
      clearTimeout(hideTimer);
      if (tipFor !== id) { fillTip(st); tipFor = id; }     // content changes only when the shop changes
      tip.classList.toggle('is-interactive', coarse);
      tip.setAttribute('aria-hidden', 'false');
      positionTip();
      tip.classList.add('is-visible');                      // CSS transition plays once
    }

    function hideTip() {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      tip.classList.remove('is-visible', 'is-interactive');
      tip.setAttribute('aria-hidden', 'true');
      tipFor = null;
    }

    /** Position follows the shop while the camera moves: transform only, once per frame. */
    function positionTip() {
      if (tipRaf || !tipFor) return;
      tipRaf = requestAnimationFrame(() => {
        tipRaf = 0;
        const el = shopEls.get(tipFor);
        if (!el) return;
        const hero = stage.parentElement.getBoundingClientRect();
        const r = el.querySelector('.shop-sign-board').getBoundingClientRect();
        const tw = tip.offsetWidth, th = tip.offsetHeight;
        const topLimit = (document.querySelector('.topbar') || { offsetHeight: 64 }).offsetHeight + 8;
        let left = r.left + r.width / 2 - hero.left - tw / 2;
        let top = r.top - hero.top - th - 12;
        if (top < topLimit) top = r.bottom - hero.top + 14;
        left = Mall.clamp(left, 10, hero.width - tw - 10);
        top = Mall.clamp(top, topLimit, hero.height - th - 10);
        tip.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
      });
    }

    function setActive(id) {
      activeId = id || null;
      for (const [k, el] of shopEls) el.classList.toggle('is-active', k === activeId);
    }

    /* ----------------------------------------------- click / tap / keys */
    let dragged = false;
    main.addEventListener('click', (e) => {
      if (dragged) return;
      const el = e.target.closest('.shop');
      if (!el) { setActive(null); hideTip(); return; }
      const id = el.dataset.id;
      // Touch: first tap previews (info panel), second tap or the button enters.
      if (coarse && activeId !== id) { setActive(id); showTip(id); return; }
      enter(id);
    });
    main.addEventListener('keydown', (e) => {
      const el = e.target.closest && e.target.closest('.shop');
      if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); enter(el.dataset.id); }
    });
    // Tap anywhere outside the stage closes the info panel.
    document.addEventListener('pointerdown', (e) => {
      if (!tipFor || tip.contains(e.target) || stage.contains(e.target)) return;
      setActive(null); hideTip();
    });

    let entering = false;
    /** Zoom into the shop's entrance, open its doors, then hand over to the page. */
    async function enter(id) {
      const el = shopEls.get(id);
      const st = stores.find((x) => x.id === id);
      if (!el || !st || entering) return;
      entering = true;
      hideTip();
      setActive(id);
      if (Mall.motion.reduced) { o.onEnter && o.onEnter(st, 0); return; }
      el.classList.add('is-entering');
      const door = el.querySelector('.shop-door').getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const origin = { x: door.left + door.width / 2 - sr.left, y: door.top + door.height / 2 - sr.top };
      o.onEnter && o.onEnter(st, 760);
      await tweenCamera(cam, { duration: 760, zoomTo: 5.5, ease: 'inOut', origin });
    }

    function reset() {
      entering = false;
      zoom = 1;
      camera.style.transformOrigin = '';
      for (const el of shopEls.values()) el.classList.remove('is-entering');
      applyCamera();
    }

    /* --------------------------------------------------- wheel & drag */
    let wheelAcc = 0, wheelLock = 0;
    stage.addEventListener('wheel', (e) => {
      if (e.ctrlKey) return;            // let the browser zoom
      const hero = stage.parentElement.getBoundingClientRect();
      if (hero.top < -10) return;       // page scrolled: behave like a normal page
      const down = e.deltaY > 0;
      if (down && floor === 1) return;  // at the ground floor, scrolling down continues to the page
      e.preventDefault();
      if (performance.now() < wheelLock) return;
      wheelAcc += e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
      if (Math.abs(wheelAcc) < 40) return;
      wheelLock = performance.now() + 650;
      const next = Mall.clamp(floor + (wheelAcc > 0 ? -1 : 1), 1, FLOORS);
      wheelAcc = 0;
      if (next !== floor) setFloor(next);
    }, { passive: false });

    let drag = null;
    stage.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      cancelAnimationFrame(camAnim);
      drag = { id: e.pointerId, y0: e.clientY, cam0: cam, last: e.clientY, lastT: performance.now(), v: 0, moved: false };
      dragged = false;
    });
    stage.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dy = e.clientY - drag.y0;
      if (!drag.moved && Math.abs(dy) > 8) {
        drag.moved = true;
        dragged = true;
        stage.classList.add('is-dragging', 'is-moving');
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        if (tipFor && !coarse) hideTip();
      }
      if (!drag.moved) return;
      const now = performance.now();
      drag.v = (e.clientY - drag.last) / Math.max(1, now - drag.lastT);   // px/ms
      drag.last = e.clientY; drag.lastT = now;
      // Rubber band past the ends.
      let next = drag.cam0 - dy / scale;
      const max = maxCam();
      if (next < 0) next = next / 3;
      if (next > max) next = max + (next - max) / 3;
      cam = next;
      applyCamera();
      positionTip();
    });
    const endDrag = (e) => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const d = drag;
      drag = null;
      stage.classList.remove('is-dragging');
      if (!d.moved) return;
      setTimeout(() => { dragged = false; }, 0);
      // Fling: a fast swipe moves one floor in that direction; otherwise snap to the nearest.
      let target = nearestFloor();
      if (Math.abs(d.v) > 0.45) target = Mall.clamp(floor + (d.v > 0 ? 1 : -1), 1, FLOORS);
      // Swiping up on the ground floor continues to the page content below.
      if (floor === 1 && d.v < -0.45 && o.onPastBottom) { setFloor(1); o.onPastBottom(); return; }
      setFloor(target);
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    stage.addEventListener('keydown', (e) => {
      if (e.target !== stage) return;
      const map = { PageUp: 1, ArrowUp: 1, PageDown: -1, ArrowDown: -1 };
      if (map[e.key]) { e.preventDefault(); setFloor(floor + map[e.key]); }
      else if (/^[1-4]$/.test(e.key)) setFloor(Number(e.key));
    });

    /* ----------------------------------------------------- search API */
    function applySearch() {
      stage.classList.toggle('has-search', !!searchSet);
      for (const [id, el] of shopEls) el.classList.toggle('is-match', !!searchSet && searchSet.has(id));
    }
    function setSearch(ids) { searchSet = ids && ids.size !== undefined ? ids : null; applySearch(); }

    /** Fly to a store, pulse its front and open its info panel. */
    async function focusStore(id, { pulse = true } = {}) {
      const st = stores.find((x) => x.id === id);
      if (!st) return;
      await setFloor(st.floor);
      const el = shopEls.get(id);
      if (!el) return;
      setActive(id);
      showTip(id);
      if (pulse && !Mall.motion.reduced) {
        el.classList.remove('is-pulse');
        void el.getBoundingClientRect();
        el.classList.add('is-pulse');
        setTimeout(() => el.classList.remove('is-pulse'), 3000);
      }
    }

    /* ---------------------------------------------------------- resize */
    global.addEventListener('resize', Mall.debounce(() => {
      const oldMode = mode;
      const vw = stage.clientWidth, vh = viewH();
      const nextMode = vw < 760 || vw / vh < 0.78 ? 'compact' : 'wide';
      if (nextMode !== oldMode) build();
      else {
        scale = vw / lay.M.W;
        for (const [svg] of LAYERS) {
          svg.setAttribute('width', String(Math.round(lay.M.W * scale)));
          svg.setAttribute('height', String(Math.round(lay.H * scale)));
        }
      }
      cam = floorCam(floor);
      applyCamera();
      hideTip();
    }, 150));

    return {
      setStores(list) { stores = list.slice(); const keepCam = cam; build(); cam = clampCam(keepCam); applyCamera(); },
      rebuild() { build(); cam = floorCam(floor); applyCamera(); if (tipFor) { const id = tipFor; tipFor = null; showTip(id); } },
      setFloor, playIntro, setSearch, focusStore, enter, reset, startPeople,
      get floor() { return floor; },
      get mode() { return mode; },
      hideTip,
    };
  }

  Mall.Atrium = { create };
})(window);

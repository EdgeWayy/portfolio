/* Генератор SVG-букетов: каждая композиция рисуется процедурно и детерминированно по seed. */
window.LirevoArt = (() => {
  let uid = 0;

  // mulberry32 поверх FNV-хэша строки — один и тот же seed даёт один и тот же букет
  const rng = (seed) => {
    let h = 2166136261;
    for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => {
      h += 0x6D2B79F5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const DEF = {
    rose: ['#F9D0D7', '#E8879C', '#A3344F'],
    peony: ['#FBE1E4', '#F1A7B5', '#C9607A'],
    tulip: ['#FFD1D9', '#F0617F', '#B3203F'],
    daisy: ['#FFFFFF', '#F3EEE4', '#E9A93A'],
    sunflower: ['#FFD84D', '#F2A81D', '#5B3A1A'],
    lily: ['#FFFFFF', '#F7E9EE', '#E07A93'],
    hydrangea: ['#D9E4FF', '#9DB4F2', '#6D86D6'],
    lavender: ['#C9B6EE', '#9A7FD6', '#6A4FB0'],
  };
  const SCALE = { rose: 1.25, peony: 1.08, tulip: 1.12, daisy: 1.2, sunflower: 0.92, lily: 0.98, hydrangea: 1.18, lavender: 1.05 };

  const r1 = (n) => Math.round(n * 10) / 10;

  const HEADS = {
    rose(p, g) {
      let s = '';
      for (let i = 0; i < 6; i++) s += `<ellipse cy="-11" rx="13" ry="16" transform="rotate(${i * 60})" fill="url(#${g}r)" stroke="${p[2]}" stroke-opacity=".22" stroke-width=".8"/>`;
      for (let i = 0; i < 5; i++) s += `<ellipse cy="-6.5" rx="9.5" ry="11" transform="rotate(${i * 72 + 36})" fill="${p[1]}" stroke="${p[2]}" stroke-opacity=".3" stroke-width=".8"/>`;
      s += `<circle r="7.5" fill="${p[2]}" opacity=".88"/><path d="M-4.5 1a4.5 4.5 0 1 1 4.5 4.5a2.8 2.8 0 1 1-2.8-2.8" fill="none" stroke="${p[0]}" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>`;
      return s;
    },
    peony(p, g) {
      let s = '';
      const layers = [[9, 15, 13, `url(#${g}r)`], [8, 10, 10.5, p[1]], [7, 5.5, 8, p[0]]];
      layers.forEach(([n, off, r, f], li) => {
        for (let i = 0; i < n; i++) s += `<ellipse cy="-${off}" rx="${r}" ry="${r1(r * 0.9)}" transform="rotate(${r1(i * 360 / n + li * 17)})" fill="${f}" stroke="${p[2]}" stroke-opacity=".18" stroke-width=".8"/>`;
      });
      return s + `<circle r="4.5" fill="${p[1]}"/><circle r="2" fill="${p[2]}" opacity=".5"/>`;
    },
    tulip(p, g) {
      return `<path d="M-12-2C-14-18-9-28-3-31L0-22L3-31C9-28 14-18 12-2C8 8-8 8-12-2Z" fill="url(#${g}l)" stroke="${p[2]}" stroke-opacity=".3" stroke-width=".8"/>`
        + `<path d="M0-33C7-25 8-9 0 5C-8-9-7-25 0-33Z" fill="${p[1]}" opacity=".94"/>`
        + `<path d="M0-26V0" stroke="${p[2]}" stroke-opacity=".25"/>`;
    },
    daisy(p) {
      let s = '';
      for (let i = 0; i < 16; i++) s += `<ellipse cy="-14" rx="3.4" ry="10" transform="rotate(${i * 22.5})" fill="${p[0]}" stroke="#D8CFBE" stroke-width=".6"/>`;
      s += `<circle r="7" fill="${p[2]}"/><circle r="4" fill="#C9801A" opacity=".55"/>`;
      return s;
    },
    sunflower(p) {
      const pet = 'M0-9C5-16 4-26 0-33C-4-26-5-16 0-9Z';
      let s = '';
      for (let i = 0; i < 18; i++) s += `<path d="${pet}" transform="rotate(${i * 20 + 10})" fill="${p[1]}"/>`;
      for (let i = 0; i < 18; i++) s += `<path d="${pet}" transform="rotate(${i * 20}) scale(.92)" fill="${p[0]}" stroke="${p[1]}" stroke-width=".6"/>`;
      s += `<circle r="13" fill="${p[2]}"/>`;
      for (let i = 0; i < 22; i++) {
        const a = i * 2.4, rr = 2.6 * Math.sqrt(i + 1);
        s += `<circle cx="${r1(Math.cos(a) * rr)}" cy="${r1(Math.sin(a) * rr)}" r="1.1" fill="#2E1C0B" opacity=".7"/>`;
      }
      return s;
    },
    lily(p, g) {
      let s = '';
      for (let i = 0; i < 6; i++) {
        s += `<g transform="rotate(${i * 60 + 30})"><path d="M0 0C7-9 6-26 0-34C-6-26-7-9 0 0Z" fill="url(#${g}r)" stroke="${p[2]}" stroke-opacity=".25" stroke-width=".8"/><path d="M0-4V-24" stroke="${p[2]}" stroke-opacity=".55" stroke-width="1.1" stroke-linecap="round"/></g>`;
      }
      for (let i = 0; i < 6; i++) {
        const a = (i * 60) * Math.PI / 180, x = r1(Math.cos(a) * 14), y = r1(Math.sin(a) * 14);
        s += `<path d="M0 0L${x} ${y}" stroke="#B9C27A" stroke-width="1"/><ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.3" transform="rotate(${i * 60} ${x} ${y})" fill="#9B4A1C"/>`;
      }
      return s + '<circle r="3" fill="#E6D27A"/>';
    },
    hydrangea(p, _g, R) {
      const pts = [[0, 0]];
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; pts.push([Math.cos(a) * 9, Math.sin(a) * 9]); }
      for (let i = 0; i < 11; i++) { const a = i * Math.PI * 2 / 11 + 0.3; pts.push([Math.cos(a) * 18, Math.sin(a) * 17]); }
      let s = '';
      pts.forEach(([x, y]) => {
        const f = R() > 0.5 ? p[0] : p[1];
        s += `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(R() * 90)})">`;
        for (let k = 0; k < 4; k++) s += `<ellipse cy="-3.8" rx="3.2" ry="4.4" transform="rotate(${k * 90})" fill="${f}" stroke="${p[2]}" stroke-opacity=".25" stroke-width=".5"/>`;
        s += `<circle r="1.1" fill="${p[2]}"/></g>`;
      });
      return s;
    },
    lavender(p) {
      let s = '<path d="M0 6V-44" stroke="#6E8F63" stroke-width="1.4"/>';
      for (let i = 0; i < 10; i++) {
        const y = -i * 4.6, side = i % 2 ? 2.4 : -2.4, sz = 1 - i * 0.05;
        s += `<ellipse cx="${side}" cy="${r1(y)}" rx="${r1(2.8 * sz)}" ry="${r1(3.8 * sz)}" fill="${i % 3 ? p[1] : p[2]}"/><ellipse cx="${-side * 0.4}" cy="${r1(y - 2)}" rx="${r1(2.2 * sz)}" ry="${r1(3 * sz)}" fill="${p[0]}" opacity=".9"/>`;
      }
      return s;
    },
  };

  const leaf = (x, y, rot, s, fill) =>
    `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)}) scale(${r1(s)})"><g class="lf"><path d="M0 0C9-10 9-28 0-40C-9-28-9-10 0 0Z" fill="${fill}"/><path d="M0-2V-36" stroke="#4F7446" stroke-opacity=".45" stroke-width="1"/></g></g>`;

  const eucalyptus = (x, y, rot, s) => {
    let b = `<path d="M0 0Q3-25 0-56" fill="none" stroke="#7F9C8A" stroke-width="1.6"/>`;
    [-8, -18, -28, -38, -47, -55].forEach((yy, i) => {
      const side = i % 2 ? 6 : -6;
      b += `<ellipse cx="${side}" cy="${yy}" rx="${6 - i * 0.4}" ry="${5.4 - i * 0.4}" fill="${i % 2 ? '#A7BEB0' : '#93AE9F'}" stroke="#7F9C8A" stroke-width=".6"/>`;
    });
    return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)}) scale(${r1(s)})"><g class="lf">${b}</g></g>`;
  };

  const gyps = (x, y, R) => {
    let s = `<g transform="translate(${r1(x)} ${r1(y)})" opacity=".95">`;
    for (let i = 0; i < 9; i++) {
      const a = R() * Math.PI * 2, d = R() * 11;
      s += `<circle cx="${r1(Math.cos(a) * d)}" cy="${r1(Math.sin(a) * d)}" r="${r1(1.5 + R() * 1.2)}" fill="#FFFFFF" stroke="#E2DCCF" stroke-width=".5"/>`;
    }
    return s + '</g>';
  };

  // позиции голов: [x, y] в порядке приоритета (центр → края)
  const PAPER_SLOTS = [
    [150, 128], [116, 112], [184, 112], [132, 152], [170, 152], [150, 88], [92, 140], [208, 140],
    [112, 78], [188, 78], [150, 172], [76, 104], [224, 104], [104, 174], [196, 174], [150, 56],
  ];
  const BOX_SLOTS = [
    [94, 192], [124, 196], [154, 197], [184, 195], [210, 190],
    [108, 168], [138, 170], [168, 170], [196, 166],
    [122, 146], [152, 146], [182, 145], [138, 126], [166, 125],
  ];

  const pal = (f) => f.c || DEF[f.t];

  function defs(id, flowers) {
    let d = '';
    flowers.forEach((f, k) => {
      const p = pal(f);
      d += `<radialGradient id="${id}-${k}r" cx=".5" cy=".18" r=".95"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></radialGradient>`;
      d += `<linearGradient id="${id}-${k}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset=".55" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>`;
    });
    d += `<linearGradient id="${id}-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".14"/><stop offset=".38" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>`;
    return `<defs>${d}</defs>`;
  }

  function pickFlower(flowers, i) {
    if (flowers.length === 1 || i % 2 === 0) return 0;
    return 1 + ((i >> 1) % (flowers.length - 1));
  }

  function headsLayer(art, slots, n, id, R, opts) {
    const placed = slots.slice(0, Math.min(n, slots.length)).map((pos, i) => ({ pos, k: pickFlower(art.flowers, i), i }));
    placed.sort((a, b) => a.pos[1] - b.pos[1]);
    let s = '';
    placed.forEach(({ pos: [x, y], k, i }, order) => {
      const f = art.flowers[k];
      const p = pal(f);
      const sc = SCALE[f.t] * (i === 0 ? 1.08 : 1) * (0.9 + R() * 0.18) * (opts.headScale || 1);
      const upright = f.t === 'tulip' || f.t === 'lavender';
      const rot = upright ? (x - 150) * 0.28 + (R() - 0.5) * 8 : Math.round((R() - 0.5) * 60);
      const jx = (R() - 0.5) * 6, jy = (R() - 0.5) * 6;
      const d = Math.round(180 + order * 65);
      s += `<g transform="translate(${r1(x + jx)} ${r1(y + jy)}) rotate(${Math.round(rot)}) scale(${r1(sc * 100) / 100})"><g class="bl" style="--d:${d}ms">${HEADS[f.t](p, `${id}-${k}`, R)}</g></g>`;
    });
    return s;
  }

  function paper(art, n, id, R, opts) {
    const [w0, w1] = art.wrap || ['#F3E3D3', '#E8D2BC'];
    const rib = art.ribbon || '#C9607A';
    const slots = PAPER_SLOTS;
    const used = slots.slice(0, Math.min(n, slots.length));
    let s = `<ellipse cx="150" cy="346" rx="64" ry="6" fill="#000" opacity=".08"/>`;
    // задняя упаковка
    s += `<path d="M150 330L40 98Q66 66 106 66Z" fill="${w0}" stroke="#000" stroke-opacity=".06"/>`;
    s += `<path d="M150 330L260 98Q234 66 194 66Z" fill="${w0}" stroke="#000" stroke-opacity=".06"/>`;
    s += `<path d="M150 330L98 54Q150 30 202 54Z" fill="${w0}" opacity=".9"/>`;
    s += `<path d="M150 330L40 98Q66 66 106 66Z" fill="#fff" opacity=".18"/>`;
    s += '<g class="sway">';
    // стебли
    used.forEach(([x, y]) => {
      s += `<path d="M${x} ${y}Q${r1((x + 150) / 2)} ${r1((y + 300) / 2)} ${r1(150 + (x - 150) * 0.12)} 304" fill="none" stroke="#5F8A57" stroke-width="2.6" stroke-linecap="round"/>`;
    });
    // зелень и наполнители по краю купола
    const fillers = art.fillers || [];
    const angles = [-165, -140, -115, -90, -65, -40, -15];
    angles.forEach((a, i) => {
      const rad = a * Math.PI / 180, dist = 62 + R() * 18;
      const x = 150 + Math.cos(rad) * dist, y = 132 + Math.sin(rad) * dist * 0.9;
      const kind = fillers.includes('eucalyptus') && i % 2 ? 'euc' : 'leaf';
      s += kind === 'euc'
        ? eucalyptus(150 + Math.cos(rad) * 40, 132 + Math.sin(rad) * 36, a + 90, 0.95 + R() * 0.25)
        : leaf(x, y + 20, a + 90, 0.8 + R() * 0.35, i % 2 ? '#7FA572' : '#6A955E');
    });
    if (fillers.includes('gyps')) {
      for (let i = 0; i < 6; i++) {
        const a = (-170 + i * 32) * Math.PI / 180, dist = 50 + R() * 26;
        s += gyps(150 + Math.cos(a) * dist, 128 + Math.sin(a) * dist * 0.85, R);
      }
    }
    s += headsLayer(art, slots, n, id, R, opts);
    s += '</g>';
    // передняя упаковка
    s += `<path d="M64 190Q107 214 150 206Q193 214 236 190L150 338Z" fill="${w1}"/>`;
    s += `<path d="M64 190L150 338L120 207Q90 205 64 190Z" fill="#000" opacity=".07"/>`;
    s += `<path d="M236 190L150 338L182 207Q212 205 236 190Z" fill="#fff" opacity=".16"/>`;
    s += `<path d="M113 270Q150 283 187 270" fill="none" stroke="${rib}" stroke-width="6" stroke-linecap="round"/>`;
    s += `<g transform="translate(150 274)"><path d="M0 0C-14-15-31-12-29 0C-31 12-14 15 0 0Z" fill="${rib}"/><path d="M0 0C14-15 31-12 29 0C31 12 14 15 0 0Z" fill="${rib}"/><path d="M-2 2L-15 31L-6 29L0 5ZM2 2L15 31L6 29L0 5Z" fill="${rib}" opacity=".88"/><circle r="5.5" fill="${rib}"/><path d="M-20-3C-15-8-8-6-4-2" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>`;
    return s;
  }

  function box(art, n, id, R, opts) {
    const c = art.box || '#F2E3E3';
    const band = art.band || '#1F2A22';
    let s = `<ellipse cx="150" cy="318" rx="96" ry="11" fill="#000" opacity=".1"/>`;
    s += `<ellipse cx="150" cy="200" rx="80" ry="18" fill="${c}"/><ellipse cx="150" cy="200" rx="80" ry="18" fill="#000" opacity=".28"/>`;
    s += '<g class="sway">';
    if ((art.fillers || []).includes('gyps') || art.flowers.length === 1) {
      [-150, -110, -70, -30].forEach((a) => {
        const rad = a * Math.PI / 180;
        s += leaf(150 + Math.cos(rad) * 66, 186 + Math.sin(rad) * 44, a + 90, 0.7, '#6A955E');
      });
    }
    s += headsLayer(art, BOX_SLOTS, Math.max(n, 9), id, R, { ...opts, headScale: (opts.headScale || 1) * 1.12 });
    if ((art.fillers || []).includes('gyps')) {
      for (let i = 0; i < 4; i++) s += gyps(108 + i * 28 + R() * 10, 150 + R() * 30, R);
    }
    s += '</g>';
    const body = 'M70 200A80 18 0 0 0 230 200L230 298A80 18 0 0 1 70 298Z';
    s += `<path d="${body}" fill="${c}"/><path d="${body}" fill="url(#${id}-shade)"/>`;
    s += '<path d="M70 200A80 18 0 0 0 230 200" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2.5"/>';
    s += `<path d="M70 262A80 18 0 0 0 230 262L230 276A80 18 0 0 1 70 276Z" fill="${band}"/>`;
    s += `<text x="150" y="246" text-anchor="middle" font-family="Cormorant, serif" font-size="17" font-weight="600" letter-spacing="5" fill="${band}" opacity=".75">LIREVO</text>`;
    return s;
  }

  function bouquet(art, opts = {}) {
    if (art.photo) {
      const alt = opts.label ? `alt="${opts.label}"` : 'alt="" aria-hidden="true"';
      return `<img class="bouquet bouquet--photo is-in ${opts.cls || ''}" src="${art.photo}" ${alt} loading="lazy" decoding="async" width="800" height="1000">`;
    }
    const id = `fa${++uid}`;
    const R = rng(opts.seed || JSON.stringify(art.flowers));
    const n = opts.count || 8;
    const body = art.style === 'box' ? box(art, n, id, R, opts) : paper(art, n, id, R, opts);
    const label = opts.label ? `role="img" aria-label="${opts.label}"` : 'aria-hidden="true"';
    return `<svg class="bouquet ${opts.cls || ''}" viewBox="0 0 300 360" ${label} focusable="false">${defs(id, art.flowers)}${body}</svg>`;
  }

  const tint = (art) => {
    const p = pal(art.flowers[0]);
    return p[0] === '#FFFFFF' ? pal(art.flowers[1] || { t: 'rose' })[0] : p[0];
  };

  // распускание при появлении в зоне видимости
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 })
    : null;

  function observe(root = document) {
    root.querySelectorAll('.bouquet:not(.is-in)').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));
  }

  function replay(svgEl) {
    svgEl.classList.remove('is-in');
    void svgEl.getBoundingClientRect();
    svgEl.classList.add('is-in');
  }

  return { bouquet, observe, replay, tint };
})();

/* The ACID gate's floating candies: seven kinds, drawn here as inline SVG. Flat colors with thick black outlines. */
const LIME = "#B8FF00", BONE = "#E6FF99", ORANGE = "#FF7A00", GREEN = "#2F5A00", K = "#000";
const O = `stroke="${K}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
const spiral = (cx, cy, r, turns = 2.4) => {
  let d = "";
  for (let i = 0; i <= 44; i++) {
    const t = i / 44, a = t * turns * 6.283, q = r * t;
    d += `${i ? "L" : "M"}${(cx + Math.cos(a) * q).toFixed(1)} ${(cy + Math.sin(a) * q).toFixed(1)}`;
  }
  return d;
};

const KINDS = [
  // wrapped swirl
  `<path d="M28 50 6 32l5 18-5 18zM72 50l22-18-5 18 5 18z" fill="${ORANGE}" ${O}/>
   <circle cx="50" cy="50" r="27" fill="${LIME}" ${O}/>
   <path d="${spiral(50, 50, 23)}" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`,
  // lollipop
  `<path d="M50 56v40" stroke="${K}" stroke-width="12" stroke-linecap="round"/>
   <path d="M50 56v38" stroke="${BONE}" stroke-width="5" stroke-linecap="round"/>
   <circle cx="50" cy="34" r="30" fill="${ORANGE}" ${O}/>
   <path d="${spiral(50, 34, 26, 2.6)}" fill="none" stroke="${BONE}" stroke-width="6" stroke-linecap="round"/>`,
  // candy corn
  `<path d="M50 6C58 6 88 76 84 84 80 92 20 92 16 84 12 76 42 6 50 6Z" fill="${BONE}" ${O}/>
   <path d="M34 40C44 44 56 44 66 40L84 84C80 92 20 92 16 84Z" fill="${ORANGE}" ${O}/>
   <path d="M23 66C40 72 60 72 77 66L84 84C80 92 20 92 16 84Z" fill="${LIME}" ${O}/>`,
  // toffee
  `<path d="M26 50 6 36v28zM74 50l20-14v28z" fill="${LIME}" ${O}/>
   <rect x="22" y="30" width="56" height="40" rx="14" fill="${BONE}" ${O}/>
   <path d="M38 33v34M50 33v34M62 33v34" stroke="${ORANGE}" stroke-width="7"/>`,
  // skull
  `<path d="M50 8C26 8 12 26 14 46c1 12 8 18 14 22v14c0 5 4 8 8 8h28c4 0 8-3 8-8V68c6-4 13-10 14-22C88 26 74 8 50 8Z" fill="${BONE}" ${O}/>
   <ellipse cx="35" cy="46" rx="11" ry="12" fill="${K}"/><ellipse cx="65" cy="46" rx="11" ry="12" fill="${K}"/>
   <circle cx="35" cy="47" r="3.500" fill="${LIME}"/><circle cx="65" cy="47" r="3.500" fill="${LIME}"/>
   <path d="M50 58l-5 9h10z" fill="${K}"/><path d="M38 76v13M50 76v13M62 76v13" stroke="${K}" stroke-width="4.500"/>`,
  // eyeball
  `<circle cx="50" cy="50" r="40" fill="${BONE}" ${O}/>
   <path d="M15 40l13 5-9 7M85 34l-14 8 10 6M26 80l10-13 4 11M78 76 65 66l-2 11" fill="none" stroke="${GREEN}" stroke-width="3.500" stroke-linecap="round" stroke-linejoin="round"/>
   <circle cx="50" cy="50" r="21" fill="${LIME}" ${O}/>
   <circle cx="50" cy="50" r="10" fill="${K}"/><circle cx="45" cy="45" r="3.500" fill="${BONE}"/>`,
  // pumpkin
  `<path d="M46 22c0-8 4-13 12-16l4 8c-5 2-7 5-7 10z" fill="${GREEN}" ${O}/>
   <ellipse cx="24" cy="58" rx="17" ry="30" fill="${ORANGE}" ${O}/><ellipse cx="76" cy="58" rx="17" ry="30" fill="${ORANGE}" ${O}/>
   <ellipse cx="38" cy="58" rx="17" ry="34" fill="${ORANGE}" ${O}/><ellipse cx="62" cy="58" rx="17" ry="34" fill="${ORANGE}" ${O}/>
   <ellipse cx="50" cy="58" rx="16" ry="35" fill="${ORANGE}" ${O}/>
   <path d="M25 52l13-11 6 14zM75 52 62 41l-6 14zM50 56l-5 8h10zM23 68c12 16 42 16 54 0l-9 4-5 7-7-6-6 7-6-7-7 6-5-7z" fill="${K}"/>`,
];

/** One candy as a string of SVG. The index picks the kind, so a field gets an even mix. */
export function candySvg(i) {
  return `<svg class="ak-candy" viewBox="0 0 100 100" aria-hidden="true">${KINDS[i % KINDS.length]}</svg>`;
}

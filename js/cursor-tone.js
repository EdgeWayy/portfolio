/* What is under the custom cursor: "light" (it must be black) or "dark" (it must be lime).
   DOM elements answer through their computed background (js/cursor.js). Canvases and shapes the DOM cannot describe
   register a probe here instead: the slime, the portrait blob, the candies, the gate's liquid and the finale.
     addProbe()      above the page: asked first, newest first
     addBackProbe()  behind the page (the slime sits under the transparent content): asked when no element decided
   A probe gets (x, y, topElement) in client pixels and returns "light", "dark" or null for "not mine". */
const front = [];
const back = [];

const add = (list, fn) => {
  list.unshift(fn);
  return () => { const i = list.indexOf(fn); if (i >= 0) list.splice(i, 1); };
};
export const addProbe = (fn) => add(front, fn);
export const addBackProbe = (fn) => add(back, fn);

const ask = (list, x, y, top) => {
  for (const fn of list) {
    const r = fn(x, y, top);
    if (r) return r;
  }
  return null;
};
export const askFront = (x, y, top) => ask(front, x, y, top);
export const askBack = (x, y, top) => ask(back, x, y, top);

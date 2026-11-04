/* The site's two themes: "autumn" (default) and "acid".
   The inline script in partials/head.html sets <html data-theme="acid"> before the first paint, so there is no flash;
   this module is the only code that changes it afterwards. */
const KEY = "akbar-theme";
const root = document.documentElement;
const listeners = [];

export function getTheme() { return root.dataset.theme === "acid" ? "acid" : "autumn"; }
export const isAcid = () => getTheme() === "acid";
export function onTheme(fn) { listeners.push(fn); }

function paintBar() {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isAcid() ? "#000000" : "#0F1318");
}

/** Save the theme only (used right before a navigation: the next page reads it in its head script). */
export function storeTheme(next) {
  try { sessionStorage.setItem(KEY, next); } catch (e) {} // session only: every new visit starts in Autumn
}

/** Switch the live page. Listeners get the new theme name. */
export function setTheme(next) {
  const name = next === "acid" ? "acid" : "autumn";
  storeTheme(name);
  if (name === "acid") root.dataset.theme = "acid"; else delete root.dataset.theme;
  paintBar();
  listeners.forEach((fn) => fn(name));
}

/** Make the gate show again on the next page load, whatever this visit has already seen. */
export function forgetGate() {
  try {
    sessionStorage.removeItem("akbar-intro-seen");
    sessionStorage.removeItem("akbar-seen");
  } catch (e) {}
}

export function initTheme() { paintBar(); }

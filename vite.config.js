import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { inlineScriptHashes, inlineStyleHashes, withCsp } from "./tools/csp.mjs";

// Strict CSP for the portfolio pages, added at build time only (the dev server needs inline HMR code).
const portfolioCsp = (html) => withCsp(html, {
  "default-src": "'self'",
  "script-src": ["'self'", ...inlineScriptHashes(html)],
  "style-src": ["'self'", ...inlineStyleHashes(html)],
  "img-src": ["'self'", "data:"],
  "font-src": ["'self'", "data:"],          // Vite inlines tiny font subsets as data: URLs
  "connect-src": "'self'",
  "object-src": "'none'",
  "base-uri": "'self'",
  "form-action": "'none'",
});

function csp() {
  let outDir = "dist";
  return {
    name: "portfolio-csp",
    apply: "build",
    configResolved(c) { outDir = c.build.outDir; },
    transformIndexHtml: { order: "post", handler: (html) => portfolioCsp(html) },
    // 404.html is copied from public/ untouched, so it gets its policy after the bundle is written
    writeBundle() {
      const file = path.resolve(outDir, "404.html");
      if (fs.existsSync(file)) fs.writeFileSync(file, portfolioCsp(fs.readFileSync(file, "utf8")));
    },
  };
}

// Shared markup lives once in partials/: "<!-- @include header -->" in a page is replaced by partials/header.html.
// Links with data-nav="<page>" get aria-current="page" on that page, so the active link is right without JS.
const PAGES = ["index", "projects", "services", "about", "faq", "contact"];
function includes() {
  const read = (name) => fs.readFileSync(path.resolve("partials", `${name}.html`), "utf8").trim();
  return {
    name: "portfolio-includes",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const page = path.basename(ctx.filename, ".html");
        return html
          .replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) => read(name))
          .replace(new RegExp(`data-nav="${page}"`, "g"), `data-nav="${page}" aria-current="page"`);
      },
    },
    // edits to a partial reload every page in dev
    handleHotUpdate({ file, server }) {
      if (file.includes(`${path.sep}partials${path.sep}`) || file.includes("/partials/")) server.ws.send({ type: "full-reload" });
    },
  };
}

// GitHub Pages serves the site from /<repo-name>/. Relative base ("./") works for any repo name.
// To pin an absolute base instead: BASE_PATH=/my-repo/ npm run build
export default defineConfig({
  base: process.env.BASE_PATH || "./",
  plugins: [includes(), csp()],
  build: {
    rollupOptions: { input: Object.fromEntries(PAGES.map((p) => [p, path.resolve(`${p}.html`)])) },
    target: "es2020",
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 700,
    sourcemap: false,
  },
  server: { port: 5173 },
});

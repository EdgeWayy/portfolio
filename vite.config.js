import { defineConfig } from "vite";

// GitHub Pages serves the site from /<repo-name>/. Relative base ("./") works for any repo name.
// To pin an absolute base instead: BASE_PATH=/my-repo/ npm run build
export default defineConfig({
  base: process.env.BASE_PATH || "./",
  build: {
    target: "es2020",
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 700,
  },
  server: { port: 5173 },
});

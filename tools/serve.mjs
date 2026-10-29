// Tiny static server that mimics GitHub Pages under a repo subpath.
// node tools/serve.mjs [dir=dist] [prefix=/akbar-portfolio/] [port=4173]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2] || "dist");
const prefix = process.argv[3] || "/akbar-portfolio/";
const port = Number(process.argv[4] || 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif", ".ico": "image/x-icon", ".woff2": "font/woff2",
  ".woff": "font/woff", ".mp4": "video/mp4", ".webm": "video/webm", ".txt": "text/plain", ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

function send404(res) {
  const p = path.join(dir, "404.html");
  res.writeHead(404, { "content-type": TYPES[".html"] });
  res.end(fs.existsSync(p) ? fs.readFileSync(p) : "404");
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  if (url === prefix.slice(0, -1)) { res.writeHead(301, { location: prefix }); return res.end(); }
  if (!url.startsWith(prefix)) return send404(res);
  let file = path.join(dir, url.slice(prefix.length));
  if (file !== dir && !file.startsWith(dir + path.sep)) return send404(res); // no path traversal
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!url.endsWith("/")) { res.writeHead(301, { location: url + "/" }); return res.end(); }
    file = path.join(file, "index.html");
  }
  if (!fs.existsSync(file)) return send404(res);
  const stat = fs.statSync(file);
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;
  if (range && /^bytes=/.test(range)) {
    const [a, b] = range.replace("bytes=", "").split("-");
    const start = Number(a), end = b ? Number(b) : stat.size - 1;
    res.writeHead(206, { "content-type": type, "content-range": `bytes ${start}-${end}/${stat.size}`, "accept-ranges": "bytes", "content-length": end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { "content-type": type, "content-length": stat.size });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving ${dir} at http://localhost:${port}${prefix}`));

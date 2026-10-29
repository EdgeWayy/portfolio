// Content-Security-Policy as a <meta> tag (GitHub Pages cannot send real HTTP headers).
// Inline <script>/<style> blocks are allowed by their exact SHA-256 hash, nothing else inline runs.
import crypto from "node:crypto";

const sha = (text) => `'sha256-${crypto.createHash("sha256").update(text, "utf8").digest("base64")}'`;

/** Hashes of inline executable scripts (JSON-LD and other data blocks are not executed, so skipped). */
export function inlineScriptHashes(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs]) => !/type=["']?application\/(ld\+)?json/i.test(attrs))
    .map(([, , body]) => sha(body));
}

export function inlineStyleHashes(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(([, body]) => sha(body));
}

/** Insert (or replace) the CSP and referrer metas right after <meta charset>. */
export function withCsp(html, directives) {
  const policy = Object.entries(directives).map(([k, v]) => `${k} ${[].concat(v).join(" ")}`.trim()).join("; ");
  const tags = `\n  <meta http-equiv="Content-Security-Policy" content="${policy}">` +
    (/name=["']referrer["']/i.test(html) ? "" : `\n  <meta name="referrer" content="strict-origin-when-cross-origin">`);
  html = html.replace(/\n?\s*<meta http-equiv="Content-Security-Policy"[^>]*>/i, "");
  return html.replace(/<meta charset=["']?utf-8["']?\s*\/?>/i, (m) => m + tags);
}

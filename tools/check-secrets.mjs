// Fails (exit 1) if anything that looks like a secret is in the repo files.
// Runs before every build (npm run build) and can be run alone: npm run check
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", "_work"]);
const TEXT = /\.(html?|js|mjs|cjs|css|json|md|txt|py|toml|ya?ml|svg|xml|env|ini|cfg)$/i;

const RULES = [
  [/\b\d{8,10}:AA[A-Za-z0-9_-]{30,}\b/, "Telegram bot token"],
  [/\bsk-[A-Za-z0-9_-]{20,}/, "API secret key (sk-...)"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "Google API key"],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}\b/, "GitHub token"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  // real card numbers belong in .env.local / repo Variables, not in source (4242… is the public test card)
  [/\b(?!4242[ -]?4242)(8600|9860|5614|4\d{3}|5[1-5]\d{2})[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/, "card number (use .env.local)"],
  [/\b(BOT_TOKEN|SECRET_KEY|TICKET_SECRET|CHAT_ID|API_KEY|BILLZ_[A-Z_]*|PAYME_[A-Z_]*|CLICK_[A-Z_]*)\s*[=:]\s*["']?[A-Za-z0-9_\-:]{12,}/, "credential assignment"],
];

const hits = [];
const ignored = (rel) => {
  try { execFileSync("git", ["check-ignore", "-q", rel], { cwd: ROOT, stdio: "ignore" }); return true; }
  catch { return false; }
};
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    const rel = path.relative(ROOT, p);
    if (/^\.env/.test(e.name)) {
      if (e.name === ".env.example") continue;          // placeholders only (XXXX), meant to be committed
      if (!ignored(rel)) hits.push(`${rel}: .env file must not be in the repo (add it to .gitignore)`);
      continue;                                         // a git-ignored .env.local stays on this machine
    }
    if (/^my-photo\./.test(e.name) && dir === ROOT) continue; // original photo, git-ignored
    if (!TEXT.test(e.name)) continue;
    const text = fs.readFileSync(p, "utf8");
    for (const [re, label] of RULES) {
      const m = text.match(re);
      if (m) hits.push(`${rel}: ${label}: ${m[0].slice(0, 24)}…`);
    }
  }
}
walk(ROOT);
if (hits.length) {
  console.error("Possible secrets found:\n  " + hits.join("\n  "));
  process.exit(1);
}
console.log("check-secrets: clean");

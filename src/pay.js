/* Payment section: method chips, instructions per method, proof (transaction ID or screenshot) -> Telegram.
   Details come from src/data/payments.js. Nothing is uploaded: the screenshot stays in the browser and
   leaves only through the phone's share sheet (Telegram) or is attached by hand in the chat. */
import { methods, payConfig, filled } from "./data/payments.js";
import { t, getLang, onLang } from "./i18n.js";
import { toast } from "./ui.js";

const TG = "KrieWoo";
const MAX_FILE = 10 * 1024 * 1024;
const CURRENCIES = ["UZS", "USD", "RUB", "KZT"];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const L = (obj) => obj[getLang()] ?? obj.ru;
const digits = (v) => v.replace(/\D/g, "");
const groupCard = (v) => digits(v).replace(/(\d{4})(?=\d)/g, "$1 ");
const safeUrl = (v) => { try { const u = new URL(v); return u.protocol === "https:" ? u.href : ""; } catch { return ""; } };
// plain text only; length capped even if maxlength is edited out in DevTools
const clean = (v, max) => v.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, max);

export function initPay() {
  const form = document.getElementById("pay-form");
  if (!form) return;
  const info = document.getElementById("pay-info");
  const amount = document.getElementById("p-amount");
  const cur = document.getElementById("p-cur");
  const txid = document.getElementById("p-txid");
  const name = document.getElementById("p-name");
  const fileIn = document.getElementById("p-file");
  const drop = document.getElementById("p-drop");
  const proof = document.getElementById("p-proof");
  const fname = document.getElementById("p-fname");
  const note = document.getElementById("p-note");
  let file = null, thumbUrl = "", curTouched = false;

  /* ---------- chips ---------- */
  const chips = { uz: document.getElementById("pay-uz"), abroad: document.getElementById("pay-abroad") };
  const labels = [];
  for (const m of methods) {
    const label = document.createElement("label");
    label.innerHTML = `<input type="radio" name="paymethod" value="${m.id}"><span></span>`;
    chips[m.group].append(label);
    labels.push([label.querySelector("span"), m]);
  }
  const chipTexts = () => labels.forEach(([span, m]) => { span.textContent = L(m.name); });

  /* ---------- amount: ?amount=1500000&cur=UZS#pay, else the config default ---------- */
  const qs = new URLSearchParams(location.search);
  const qAmount = clean(qs.get("amount") || payConfig.amount || "", 16).replace(/[^\d.,\s]/g, "");
  const qCur = (qs.get("cur") || payConfig.currency || "UZS").toUpperCase();
  amount.value = qAmount;
  cur.value = CURRENCIES.includes(qCur) ? qCur : "UZS";
  // a preset amount keeps its currency: switching it would silently turn 1 500 000 UZS into 1 500 000 RUB
  curTouched = qs.has("cur") || !!qAmount;
  cur.addEventListener("change", () => { curTouched = true; render(); });
  amount.addEventListener("input", () => render());

  const amountText = () => {
    const raw = clean(amount.value, 16).replace(/\s/g, "").replace(",", ".");
    const n = Number(raw);
    if (!raw || !Number.isFinite(n) || n <= 0) return "";
    const fmt = new Intl.NumberFormat(getLang() === "en" ? "en-US" : "ru-RU", { maximumFractionDigits: 2 });
    return `${fmt.format(n)} ${cur.value}`;
  };
  const selected = () => methods.find((m) => m.id === form.querySelector('input[name="paymethod"]:checked')?.value);

  /* ---------- instructions for the chosen method ---------- */
  function render() {
    const m = selected();
    if (!m) {
      info.innerHTML = `<p class="pay__missing">${esc(t("payPick"))}</p>`;
      return;
    }
    const link = filled(m.link) ? safeUrl(m.link) : "";
    const card = filled(m.card) ? groupCard(m.card) : "";
    const sum = amountText();
    const rows = [];
    if (link) {
      rows.push([t("payLink"), `<a class="btn btn--ink btn--lg" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(t("payOpen"))} ${esc(L(m.name))} ↗</a>`]);
    }
    if (card) {
      rows.push([t("payCard"), `<span class="pay__value"><span class="pay__num">${esc(card)}</span><button type="button" class="pay__copy" data-copy="${esc(digits(card))}">${esc(t("payCopy"))}</button></span>`]);
      if (filled(payConfig.holder)) rows.push([t("payHolder"), esc(payConfig.holder)]);
    }
    if (!link && !card) rows.push([m.kind === "link" ? t("payLink") : t("payCard"), `<span class="pay__missing">${esc(t("payMissing"))}</span>`]);
    rows.push([t("payAmount"), sum ? `<span class="pay__sum">${esc(sum)}</span>` : `<span class="pay__missing">${esc(t("payAgree"))}</span>`]);

    info.innerHTML = `
      <div class="pay__card-head">
        <h3 class="pay__card-title">${esc(L(m.name))}</h3>
        <span class="pay__card-kind mono">${esc(m.group === "abroad" ? t("kindAbroad") : m.kind === "link" ? t("kindLink") : t("kindCard"))}</span>
      </div>
      <dl class="pay__rows">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>
      <div class="pay__rows"><div><dt>${esc(t("paySteps"))}</dt><dd><ol class="pay__steps">${L(m.steps).map((s) => `<li>${esc(s)}</li>`).join("")}</ol></dd></div></div>
      <p class="pay__note">${esc(L(m.note))}</p>`;
  }

  form.addEventListener("change", (e) => {
    if (e.target.name !== "paymethod") return;
    const m = selected();
    if (m && !curTouched) cur.value = m.currency;
    render();
    note.textContent = t("payNote");
  });
  info.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); toast(t("payCopied")); }
    catch { toast(t("copyFail")); }
  });

  /* ---------- screenshot: picked or dropped, previewed locally ---------- */
  function setFile(f) {
    if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    file = null; thumbUrl = "";
    if (f && (!/^image\//.test(f.type) || f.size > MAX_FILE)) { note.innerHTML = `<span class="pay__err">${esc(t("payErrFile"))}</span>`; f = null; }
    if (!f) { proof.hidden = true; proof.querySelector("img")?.remove(); fileIn.value = ""; return; }
    file = f;
    thumbUrl = URL.createObjectURL(f);
    // the preview <img> exists only while a file is picked (no empty src in the page)
    proof.querySelector("img")?.remove();
    const thumb = Object.assign(new Image(64, 64), { src: thumbUrl, alt: "" });
    proof.prepend(thumb);
    fname.textContent = f.name;
    proof.hidden = false;
  }
  fileIn.addEventListener("change", () => setFile(fileIn.files[0]));
  document.getElementById("p-remove").addEventListener("click", () => { setFile(null); fileIn.focus(); });
  for (const ev of ["dragenter", "dragover"]) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("is-over"); });
  for (const ev of ["dragleave", "drop"]) drop.addEventListener(ev, () => drop.classList.remove("is-over"));
  drop.addEventListener("drop", (e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); });

  /* ---------- message ---------- */
  const build = () => {
    const m = selected();
    const lines = [t("payMsgHello")];
    const who = clean(name.value, 80);
    if (who) lines.push(`${t("msgFrom")}: ${who}`);
    if (m) lines.push(`${t("payMsgMethod")}: ${L(m.name)}${m.group === "abroad" ? ` (${t("kindAbroad")})` : ""}`);
    const sum = amountText();
    if (sum) lines.push(`${t("payAmount")}: ${sum}`);
    const tx = clean(txid.value, 64);
    if (tx) lines.push(`${t("payMsgTx")}: ${tx}`);
    if (file) lines.push(t("payMsgShot"));
    return lines.join("\n");
  };
  const check = () => {
    if (!selected()) return t("payErrMethod");
    if (!clean(txid.value, 64) && !file) return t("payErrProof");
    return "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = check();
    if (err) { note.innerHTML = `<span class="pay__err">${esc(err)}</span>`; return; }
    const text = build();
    // phones: share the screenshot and the text in one go (Telegram is in the share sheet)
    if (file && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text }); note.textContent = t("payShared"); return; }
      catch (x) { if (x.name === "AbortError") return; }
    }
    window.open(`https://t.me/${TG}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    note.textContent = file ? t("payAttach") : t("payNote");
  });
  document.getElementById("p-copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(build()); note.textContent = t("copied"); }
    catch { note.textContent = t("copyFail"); }
  });

  chipTexts();
  render();
  onLang(() => { chipTexts(); render(); });
}

/* Оформление: 3 шага, валидация на месте, маски телефона/карты, интервалы доставки, экран успеха. */
(() => {
  const { D, t, $, $$, fmt, esc, icon, Cart, totals, sizeOf, thumb, store, reduceMotion } = window.Lirevo;
  const form = $('#co-form');
  const f = (id) => document.getElementById(id);

  $$('[data-icon]').forEach((el) => { el.outerHTML = icon(el.dataset.icon); });

  if (!Cart.count()) {
    f('co-layout').hidden = true;
    f('co-empty').hidden = false;
    return;
  }

  /* ---------- summary ---------- */
  const express = f('express');
  function renderSummary() {
    const tt = totals({ express: express.checked });
    f('sum-lines').innerHTML = Cart.lines().map((l) => `
      <div class="sum-line"><div class="t">${thumb(l, 5)}<i>${l.qty}</i></div><div>${esc(l.p.name)}<span>${l.extra ? t('line.extra') : sizeOf(l.size).name}</span></div><b>${fmt(l.total)}</b></div>`).join('');
    f('sum-rows').innerHTML = `
      <div class="sum-row"><span>${t('sum.goods')}</span><b>${fmt(tt.sub)}</b></div>
      ${tt.discount ? `<div class="sum-row discount"><span>${t('sum.promo', { code: esc(tt.code) })}</span><b>−${fmt(tt.discount)}</b></div>` : ''}
      <div class="sum-row"><span>${t('sum.delivery')}</span><b>${tt.shipping ? fmt(tt.shipping) : t('free')}</b></div>
      ${tt.express ? `<div class="sum-row"><span>${t('sum.express')}</span><b>${fmt(tt.express)}</b></div>` : ''}`;
    f('sum-total').textContent = fmt(tt.total);
    f('pay-label').textContent = t(payMethod() === 'cash' ? 'pay.order' : 'pay.sum', { sum: fmt(tt.total) });
    return t;
  }

  /* ---------- date & time slots ---------- */
  const SLOTS = [[9, 12], [12, 15], [15, 18], [18, 21]];
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayOffset = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
  const dateInput = f('date');
  dateInput.min = iso(dayOffset(0));
  dateInput.max = iso(dayOffset(60));

  const isToday = () => dateInput.value === iso(dayOffset(0));
  const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  const slotOpen = (s) => !isToday() || s[1] * 60 > nowMin() + 90;
  const expressOpen = () => { const m = nowMin(); return m >= 8 * 60 && m <= 20 * 60 + 30; };
  let slot = null;

  function renderSlots() {
    const box = f('slots');
    box.innerHTML = SLOTS.map((s, i) => {
      const open = slotOpen(s);
      const sel = slot === i && open;
      return `<button type="button" class="chip" role="radio" data-slot="${i}" aria-checked="${sel}" ${open ? '' : 'aria-disabled="true" disabled'} tabindex="${sel || (slot === null && i === SLOTS.findIndex(slotOpen)) ? 0 : -1}">${pad(s[0])}:00–${pad(s[1])}:00</button>`;
    }).join('');
    if (slot !== null && !slotOpen(SLOTS[slot])) slot = null;
  }

  function syncDay() {
    $$('[data-day]').forEach((b) => b.setAttribute('aria-pressed', String(dateInput.value === iso(dayOffset(+b.dataset.day)))));
    const canExpress = isToday() && expressOpen();
    express.disabled = !canExpress;
    if (!canExpress) express.checked = false;
    f('express-note').textContent = canExpress ? t('express.on', { sum: fmt(D.EXPRESS) }) : t('express.off');
    f('slots-field').hidden = express.checked;
    renderSlots();
    renderSummary();
  }

  // по умолчанию — сегодня, если остались интервалы, иначе завтра
  dateInput.value = iso(dayOffset(0));
  if (!SLOTS.some(slotOpen)) dateInput.value = iso(dayOffset(1));

  $('.date-quick').addEventListener('click', (e) => {
    const b = e.target.closest('[data-day]');
    if (!b) return;
    dateInput.value = iso(dayOffset(+b.dataset.day));
    clearError(dateInput);
    syncDay();
  });
  dateInput.addEventListener('change', () => { clearError(dateInput); syncDay(); });
  express.addEventListener('change', syncDay);

  f('slots').addEventListener('click', (e) => {
    const b = e.target.closest('[data-slot]');
    if (!b || b.disabled) return;
    slot = +b.dataset.slot;
    f('slots-field').classList.remove('has-error');
    renderSlots();
    $(`[data-slot="${slot}"]`, f('slots')).focus();
  });
  f('slots').addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const open = SLOTS.map((s, i) => i).filter((i) => slotOpen(SLOTS[i]));
    if (!open.length) return;
    const cur = open.indexOf(slot ?? open[0]);
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    slot = open[(cur + dir + open.length) % open.length];
    renderSlots();
    $(`[data-slot="${slot}"]`, f('slots')).focus();
  });

  /* ---------- masks ---------- */
  function maskPhone(el) {
    let d = el.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = `7${d.slice(1)}`;
    if (d && !d.startsWith('7')) d = `7${d}`;
    d = d.slice(0, 11);
    const p = d.slice(1);
    let out = d ? '+7' : '';
    if (p.length) out += ` (${p.slice(0, 3)}`;
    if (p.length >= 3) out += ')';
    if (p.length > 3) out += ` ${p.slice(3, 6)}`;
    if (p.length > 6) out += `-${p.slice(6, 8)}`;
    if (p.length > 8) out += `-${p.slice(8, 10)}`;
    el.value = out;
  }
  ['phone', 'r-phone'].forEach((id) => f(id).addEventListener('input', (e) => maskPhone(e.target)));

  const cc = f('cc'), exp = f('exp'), cvc = f('cvc');
  cc.addEventListener('input', () => {
    const d = cc.value.replace(/\D/g, '').slice(0, 16);
    cc.value = d.replace(/(.{4})/g, '$1 ').trim();
    f('cp-num').textContent = (d + '•'.repeat(16 - d.length)).replace(/(.{4})/g, '$1 ').trim();
  });
  exp.addEventListener('input', () => {
    let d = exp.value.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) d = `${d.slice(0, 2)}/${d.slice(2)}`;
    exp.value = d;
    f('cp-exp').textContent = d || t('mmyy');
  });
  cvc.addEventListener('input', () => { cvc.value = cvc.value.replace(/\D/g, '').slice(0, 3); });
  f('name').addEventListener('input', (e) => { f('cp-name').textContent = e.target.value.trim().toUpperCase() || t('cardholder'); });

  const note = f('note');
  note.addEventListener('input', () => { f('note-count').textContent = `${note.value.length} / 200`; });

  const other = f('other');
  other.addEventListener('change', () => {
    f('recipient').classList.toggle('is-open', other.checked);
    if (!other.checked) $$('[data-when="other"]').forEach(clearError);
  });

  const payMethod = () => $('input[name="pay"]:checked').value;
  $$('input[name="pay"]').forEach((r) => r.addEventListener('change', () => {
    f('card-fields').hidden = payMethod() !== 'card';
    renderSummary();
  }));

  /* ---------- validation ---------- */
  const alertIc = icon('alert');
  const RULES = {
    required: (v, el) => (v.trim().length < 2 ? t('err.required') : el.maxLength > 0 && v.length > el.maxLength ? t('err.tooLong') : ''),
    phone: (v) => (v.replace(/\D/g, '').length === 11 ? '' : t('err.phone')),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : t('err.email')),
    date: (v) => (!v ? t('err.dateNone') : v < dateInput.min ? t('err.datePast') : v > dateInput.max ? t('err.dateMax') : ''),
    card: (v) => (v.replace(/\D/g, '').length === 16 ? '' : t('err.card')),
    exp: (v) => {
      const m = /^(\d{2})\/(\d{2})$/.exec(v);
      if (!m || +m[1] < 1 || +m[1] > 12) return t('err.expFmt');
      const end = new Date(2000 + +m[2], +m[1], 0, 23, 59);
      return end < new Date() ? t('err.expOld') : '';
    },
    cvc: (v) => (/^\d{3}$/.test(v) ? '' : t('err.cvc')),
    agree: (_, el) => (el.checked ? '' : t('err.agree')),
  };

  function setError(el, msg) {
    const field = el.closest('.field');
    const box = f(el.getAttribute('aria-describedby').split(' ')[0]);
    field.classList.add('has-error');
    el.setAttribute('aria-invalid', 'true');
    box.innerHTML = `${alertIc}<span>${esc(msg)}</span>`;
  }
  function clearError(el) {
    const field = el.closest('.field');
    if (!field) return;
    field.classList.remove('has-error');
    el.removeAttribute('aria-invalid');
  }
  const active = (el) => {
    const w = el.dataset.when;
    if (w === 'other') return other.checked;
    if (w === 'card') return payMethod() === 'card';
    return true;
  };
  function check(el) {
    if (!active(el)) { clearError(el); return true; }
    const msg = RULES[el.dataset.v](el.value, el);
    msg ? setError(el, msg) : clearError(el);
    return !msg;
  }

  // валидация «после касания»: ошибки появляются на blur, исчезают сразу при исправлении
  form.addEventListener('focusout', (e) => { const el = e.target; if (el.dataset && el.dataset.v && el.type !== 'checkbox' && el.value) check(el); });
  form.addEventListener('input', (e) => { const el = e.target; if (el.getAttribute('aria-invalid') === 'true') check(el); });
  f('agree').addEventListener('change', (e) => check(e.target));

  function validateStep(n) {
    const step = $(`[data-step="${n}"]`);
    const els = $$('[data-v]', step);
    let firstBad = null;
    els.forEach((el) => { if (!check(el) && !firstBad) firstBad = el; });
    if (n === 1 && !express.checked && slot === null) {
      const sf = f('slots-field');
      sf.classList.add('has-error');
      f('e-slot').innerHTML = `${alertIc}<span>${t('err.slot')}</span>`;
      if (!firstBad) firstBad = $('[data-slot]:not([disabled])', sf) || sf;
    }
    if (firstBad) firstBad.focus({ preventScroll: false });
    return !firstBad;
  }

  /* ---------- step navigation ---------- */
  let current = 1;
  function go(n, back) {
    current = n;
    $$('.co-step').forEach((s) => {
      const on = +s.dataset.step === n;
      s.classList.toggle('is-active', on);
      s.classList.toggle('is-back', on && !!back);
    });
    $$('#stepper li').forEach((li, i) => {
      li.classList.toggle('is-current', i + 1 === n);
      li.classList.toggle('is-done', i + 1 < n);
      if (i + 1 === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      $('.n', li).innerHTML = i + 1 < n ? icon('check') : String(i + 1);
    });
    const top = f('co-form').getBoundingClientRect().top + scrollY - 100;
    scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => f(`s${n}-title`).focus({ preventScroll: true }), 50);
  }
  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) { if (validateStep(current)) go(current + 1); }
    if (e.target.closest('[data-prev]')) go(current - 1, true);
  });
  $$('#stepper .n').forEach((n) => { n.style.pointerEvents = 'none'; });

  /* ---------- submit ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (current !== 3) { if (validateStep(current)) go(current + 1); return; }
    if (!validateStep(3)) return;
    const btn = f('pay-btn');
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    const tt = totals({ express: express.checked });
    const order = {
      no: `LV-${String(Date.now()).slice(-6)}`,
      date: dateInput.value,
      time: express.checked ? t('time.express') : `${pad(SLOTS[slot][0])}:00–${pad(SLOTS[slot][1])}:00`,
      address: [f('street').value, f('apt').value && t('apt.short', { v: f('apt').value })].filter(Boolean).join(', '),
      recipient: other.checked ? f('r-name').value : f('name').value,
      total: tt.total,
      pay: payMethod(),
      items: Cart.count(),
    };
    setTimeout(() => success(order), 1400);
  });

  function success(o) {
    store.set('lirevo.lastOrder', o);
    Cart.clear();
    window.Lirevo.Promo.set('');
    const d = new Date(`${o.date}T12:00:00`);
    const dateStr = d.toLocaleDateString(window.I18N.locale, { weekday: 'long', day: 'numeric', month: 'long' });
    const payStr = t(`paid.${o.pay}`);
    f('order-card').innerHTML = `
      <div class="sum-row"><span>${t('ord.no')}</span><span class="order-no">${esc(o.no)}</span></div>
      <div class="sum-row"><span>${t('ord.delivery')}</span><b>${esc(dateStr)}</b></div>
      <div class="sum-row"><span>${t('ord.time')}</span><b>${esc(o.time)}</b></div>
      <div class="sum-row"><span>${t('ord.addr')}</span><b style="text-align:right">${esc(o.address)}</b></div>
      <div class="sum-row"><span>${t('ord.recipient')}</span><b>${esc(o.recipient)}</b></div>
      <div class="sum-total"><span>${payStr}</span><b>${fmt(o.total)}</b></div>`;
    $('#co-head').hidden = true;
    f('co-layout').hidden = true;
    const s = f('success');
    s.classList.add('is-active');
    scrollTo({ top: 0, behavior: 'auto' });
    s.focus({ preventScroll: true });
    confetti();
  }

  function confetti() {
    if (reduceMotion) return;
    const cv = document.createElement('canvas');
    cv.className = 'confetti';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = innerWidth, h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr; ctx.scale(dpr, dpr);
    const colors = ['#B4475F', '#EC93A6', '#F9D0D7', '#F2DDC2', '#7FA572', '#F7C83C'];
    const parts = Array.from({ length: 120 }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, v = 7 + Math.random() * 9;
      return { x: w / 2, y: h * 0.42, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[(Math.random() * colors.length) | 0], f: Math.random() * 6 };
    });
    const t0 = performance.now();
    (function frame(t) {
      const k = (t - t0) / 3200;
      ctx.clearRect(0, 0, w, h);
      parts.forEach((p) => {
        p.vy += 0.22; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.f += 0.1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.f));
        ctx.globalAlpha = Math.max(0, 1 - k);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.55, p.s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      if (k < 1) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  syncDay();
})();

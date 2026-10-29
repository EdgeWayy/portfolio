import { $, $$, mountChrome, loadData, store, stepsHtml, emptyStateHtml, todayISO, rng, hashStr, escapeHtml } from './common.js';
import { summaryHtml } from './booking.js';
import { icons } from './icons.js';

mountChrome('flights');
$('#steps').innerHTML = stepsHtml(3);
$('#back').innerHTML = `${icons.back(16)} К выбору мест`;

const state = store.get();
const form = $('#pax-form');

if (!state.search || !state.outbound) {
  $('#page').innerHTML = emptyStateHtml('Бронирование не найдено', 'Похоже, сессия истекла. Начните с поиска рейса, это займёт меньше минуты.');
} else {
  init();
}

function init() {
  const pax = Number(state.search.pax);
  const prev = state.passengers ?? [];
  $('#pax-list').innerHTML = Array.from({ length: pax }, (_, i) => paxCard(i, prev[i] ?? {})).join('');
  if (state.contact) {
    $('#email').value = state.contact.email ?? '';
    $('#phone').value = state.contact.phone ?? '';
  }

  loadData().then((data) => {
    $('#summary').innerHTML = summaryHtml(data, state, {
      cta: `<button type="submit" form="pax-form" class="btn btn--accent btn--lg" id="submit"><span class="btn__label">Подтвердить бронирование</span></button>`,
      hint: 'Демо: оплата не проводится, билет будет недействителен.',
    });
  });

  // Validate a field once the user leaves it, then live while they fix it.
  form.addEventListener('focusout', (e) => {
    if (e.target.matches('input, select')) {
      e.target.dataset.touched = '1';
      validateField(e.target);
    }
  });
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.upper) {
      const pos = el.selectionStart;
      el.value = el.value.toUpperCase();
      el.setSelectionRange?.(pos, pos);
    }
    if (el.dataset.touched || el.getAttribute('aria-invalid') === 'true') validateField(el);
  });
  form.addEventListener('submit', onSubmit);
}

function seatOf(i) {
  return state.seats?.[i];
}

function paxCard(i, p) {
  const id = (name) => `p${i}-${name}`;
  const field = (name, label, input, cls = '', hint = '') => `
    <div class="field ${cls}">
      <label class="field__label" for="${id(name)}">${label}</label>
      ${input}
      ${hint ? `<p class="field__hint" id="${id(name)}-hint">${hint}</p>` : ''}
      <p class="field__error" id="${id(name)}-error"></p>
    </div>`;
  const text = (name, attrs = '') =>
    `<input class="input" id="${id(name)}" name="${id(name)}" value="${escapeHtml(p[name] ?? '')}" aria-describedby="${id(name)}-error${attrs.includes('hint') ? ` ${id(name)}-hint` : ''}" ${attrs.replace('hint', '')} required>`;

  return `<fieldset class="pax-card" style="border:0;margin:0;padding:0;min-width:0" aria-labelledby="${id('title')}">
    <div class="pax-card__head">
      <h3 class="pax-card__title" id="${id('title')}">Пассажир ${i + 1}, взрослый</h3>
      ${seatOf(i) ? `<span class="chip">${icons.seat(14)} Место ${seatOf(i)}</span>` : ''}
    </div>
    <div class="form-grid">
      ${field('last', 'Фамилия латиницей', text('last', 'autocomplete="family-name" data-upper="1" data-rule="latin" placeholder="RAKHIMOVA" hint'), '', 'Как в паспорте, например RAKHIMOVA')}
      ${field('first', 'Имя латиницей', text('first', 'autocomplete="given-name" data-upper="1" data-rule="latin" placeholder="DILNOZA"'))}
      ${field('birth', 'Дата рождения', text('birth', `type="date" data-rule="birth" max="${todayISO(-1)}" min="1910-01-01"`))}
      ${field(
        'sex',
        'Пол',
        `<select class="input" id="${id('sex')}" name="${id('sex')}" aria-describedby="${id('sex')}-error" required>
          <option value="">Выберите</option>
          <option value="F"${p.sex === 'F' ? ' selected' : ''}>Женский</option>
          <option value="M"${p.sex === 'M' ? ' selected' : ''}>Мужской</option>
        </select>`
      )}
      ${field(
        'country',
        'Гражданство',
        `<select class="input" id="${id('country')}" name="${id('country')}" aria-describedby="${id('country')}-error" required>
          ${['Узбекистан', 'Казахстан', 'Кыргызстан', 'Таджикистан', 'Россия', 'Турция', 'Другое']
            .map((c) => `<option${(p.country ?? 'Узбекистан') === c ? ' selected' : ''}>${c}</option>`)
            .join('')}
        </select>`
      )}
      ${field('doc', 'Номер паспорта', text('doc', 'autocomplete="off" data-upper="1" data-rule="doc" placeholder="FA1234567" hint'), '', 'Серия и номер без пробелов')}
      ${field('expiry', 'Паспорт действует до', text('expiry', `type="date" data-rule="expiry" min="${todayISO()}"`), 'span-2')}
    </div>
  </fieldset>`;
}

/* ---------- Validation ---------- */

function addMonths(iso, months) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1 + months, d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function message(el) {
  const v = el.value.trim();
  const rule = el.dataset.rule;
  if (el.type === 'checkbox') return el.checked ? '' : 'Подтвердите согласие, чтобы продолжить.';
  if (!v) return el.tagName === 'SELECT' ? 'Выберите значение из списка.' : 'Заполните это поле.';
  if (rule === 'latin' && !/^[A-Z][A-Z' ]{1,39}$/.test(v)) return 'Только латинские буквы, как в паспорте. Минимум 2 символа.';
  if (rule === 'doc' && !/^[A-Z]{2}\d{7}$|^[A-Z0-9]{6,12}$/.test(v)) return 'Номер выглядит неверно. Пример: FA1234567.';
  if (rule === 'birth') {
    if (v >= todayISO()) return 'Дата рождения должна быть в прошлом.';
    if (v > addMonths(state.outbound.date, -12 * 12)) return 'В демо можно оформить только взрослых, от 12 лет на дату вылета.';
  }
  if (rule === 'expiry') {
    const lastFlight = state.inbound?.date ?? state.outbound.date;
    if (v < addMonths(lastFlight, 6)) return 'Паспорт должен действовать ещё 6 месяцев после даты полёта.';
  }
  if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Проверьте адрес почты. Пример: name@mail.uz.';
  if (el.type === 'tel' && !/^\+?\d{9,15}$/.test(v.replace(/[\s()-]/g, ''))) return 'Укажите номер с кодом страны, например +998 90 123 45 67.';
  return '';
}

function validateField(el) {
  const msg = message(el);
  const out = $(`#${el.id}-error`);
  el.setAttribute('aria-invalid', String(Boolean(msg)));
  if (out) out.textContent = msg;
  return !msg;
}

function onSubmit(e) {
  e.preventDefault();
  const fields = $$('input, select', form);
  const invalid = fields.filter((el) => !validateField(el));
  const alert = $('#form-alert');
  if (invalid.length) {
    alert.hidden = false;
    alert.textContent = `Проверьте ${invalid.length} ${invalid.length === 1 ? 'поле' : invalid.length < 5 ? 'поля' : 'полей'}: ошибки отмечены под ними.`;
    invalid[0].focus();
    return;
  }
  alert.hidden = true;

  const pax = Number(state.search.pax);
  const passengers = Array.from({ length: pax }, (_, i) => ({
    last: $(`#p${i}-last`).value.trim(),
    first: $(`#p${i}-first`).value.trim(),
    birth: $(`#p${i}-birth`).value,
    sex: $(`#p${i}-sex`).value,
    country: $(`#p${i}-country`).value,
    doc: $(`#p${i}-doc`).value.trim(),
    expiry: $(`#p${i}-expiry`).value,
  }));
  const contact = { email: $('#email').value.trim(), phone: $('#phone').value.trim() };

  // Booking code: 6 characters without easily confused letters.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = rng(hashStr(state.outbound.id + passengers.map((p) => p.doc).join('') + Date.now()));
  const code = Array.from({ length: 6 }, () => alphabet[Math.floor(rand() * alphabet.length)]).join('');
  store.set({ passengers, contact, code });

  const btn = $('#submit');
  btn.classList.add('is-loading');
  btn.setAttribute('aria-disabled', 'true');
  btn.insertAdjacentHTML('afterbegin', '<span class="btn__spinner" aria-hidden="true"></span>');
  $('.btn__label', btn).textContent = 'Оформляем билет…';
  setTimeout(() => (location.href = 'confirm.html'), 900);
}

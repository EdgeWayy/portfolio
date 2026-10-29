import { $, $$, mountChrome, loadData, store, stepsHtml, emptyStateHtml, rng, hashStr, fmtPrice, reduceMotion } from './common.js';
import { summaryHtml, seatExtra } from './booking.js';
import { icons } from './icons.js';

mountChrome('flights');
$('#steps').innerHTML = stepsHtml(2);
$('#back').innerHTML = `${icons.back(16)} К выбору рейса`;

const BIZ_ROWS = [1, 2, 3];
const BIZ_COLS = ['A', 'C', 'D', 'F'];
const ECO_ROWS = Array.from({ length: 24 }, (_, i) => i + 5);
const ECO_COLS = ['A', 'B', 'C', 'D', 'E', 'F'];

const state = store.get();
let data;
let active = 0;

if (!state.search || !state.outbound) {
  $('#page').innerHTML = emptyStateHtml('Рейс ещё не выбран', 'Найдите рейс и выберите подходящий вариант, после этого откроется схема салона.');
} else {
  const pax = Number(state.search.pax);
  state.seats = Array.from({ length: pax }, (_, i) => state.seats?.[i] ?? null);
  loadData().then((d) => {
    data = d;
    renderMap();
    renderTabs();
    renderSummary();
    tip();
  });
}

function occupiedSet() {
  const rand = rng(hashStr(state.outbound.id));
  const taken = new Set();
  [...BIZ_ROWS.flatMap((r) => BIZ_COLS.map((c) => r + c)), ...ECO_ROWS.flatMap((r) => ECO_COLS.map((c) => r + c))].forEach((s) => {
    if (rand() < 0.38) taken.add(s);
  });
  return taken;
}

function seatLabel(seat, cabin) {
  const col = seat.slice(-1);
  const pos = ['A', 'F'].includes(col) ? 'у окна' : ['C', 'D'].includes(col) ? 'у прохода' : 'посередине';
  const extra = seatExtra(data, seat);
  return `Место ${seat}, ${pos}, ${cabin === 'business' ? 'бизнес' : extra ? fmtPrice(extra) : 'бесплатно'}`;
}

function renderMap() {
  const taken = occupiedSet();
  const cabin = state.search.cabin;
  const seat = (row, col, kind) => {
    const id = `${row}${col}`;
    const wrongCabin = kind !== cabin;
    const disabled = taken.has(id) || wrongCabin;
    const extra = kind === 'economy' && seatExtra(data, id);
    return `<button type="button" class="seat${kind === 'business' ? ' seat--biz' : ''}${extra ? ' seat--extra' : ''}" data-seat="${id}"
      aria-label="${seatLabel(id, kind)}${taken.has(id) ? ', занято' : wrongCabin ? ', другой класс' : ''}" aria-pressed="false"${disabled ? ' disabled' : ''}>${col}</button>`;
  };
  const head = (cols, cls) =>
    `<div class="seat-row ${cls} cols-head" aria-hidden="true">${cols.slice(0, cols.length / 2).map((c) => `<span>${c}</span>`).join('')}<span></span>${cols
      .slice(cols.length / 2)
      .map((c) => `<span>${c}</span>`)
      .join('')}</div>`;

  const bizRows = BIZ_ROWS.map(
    (r) => `<div class="seat-row seat-row--biz" role="group" aria-label="Ряд ${r}">${seat(r, 'A', 'business')}${seat(r, 'C', 'business')}<span class="row-num">${r}</span>${seat(r, 'D', 'business')}${seat(r, 'F', 'business')}</div>`
  ).join('');
  const ecoRows = ECO_ROWS.map(
    (r) => `<div class="seat-row${r === 12 ? ' seat-row--exit' : ''}" role="group" aria-label="Ряд ${r}">${ECO_COLS.slice(0, 3).map((c) => seat(r, c, 'economy')).join('')}<span class="row-num">${r}</span>${ECO_COLS.slice(3).map((c) => seat(r, c, 'economy')).join('')}</div>`
  ).join('');

  $('#seat-map').innerHTML = `<span class="fuselage__nose">Нос самолёта</span>
    <p class="cabin-label">Бизнес</p>${head(BIZ_COLS, 'seat-row--biz')}${bizRows}
    <p class="cabin-label">Эконом</p>${head(ECO_COLS, '')}${ecoRows}`;

  $('#seat-map').addEventListener('click', (e) => {
    const btn = e.target.closest('.seat:not(:disabled)');
    if (!btn) return;
    const id = btn.dataset.seat;
    const owner = state.seats.indexOf(id);
    if (owner !== -1 && owner !== active) {
      active = owner;
      renderTabs();
      paintSeats();
      tip(`Место ${id} уже у пассажира ${owner + 1}. Переключились на него.`);
      return;
    }
    state.seats[active] = owner === active ? null : id;
    if (state.seats[active]) pop(btn);
    store.set({ seats: state.seats });
    const next = state.seats.findIndex((s) => !s);
    if (state.seats[active] && next !== -1) active = next;
    renderTabs();
    paintSeats();
    renderSummary();
    tip();
  });
  paintSeats();
}

function pop(el) {
  if (reduceMotion() || !el.animate) return;
  el.animate([{ transform: 'scale(0.9)' }, { transform: 'scale(1.16)', offset: 0.45 }, { transform: 'scale(1)' }], {
    duration: 280,
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
  });
}

function paintSeats() {
  $$('.seat', $('#seat-map')).forEach((btn) => {
    const owner = state.seats.indexOf(btn.dataset.seat);
    btn.setAttribute('aria-pressed', String(owner === active));
    btn.classList.toggle('is-taken-by-other', owner !== -1 && owner !== active);
  });
}

function renderTabs() {
  const tabs = $('#pax-tabs');
  tabs.innerHTML = state.seats
    .map(
      (s, i) => `<button type="button" class="pax-tab" role="tab" aria-selected="${i === active}" data-pax="${i}">
        ${icons.user(16)} Пассажир ${i + 1}${s ? ` <span class="pax-tab__seat">${s}</span>` : ''}</button>`
    )
    .join('');
  tabs.onclick = (e) => {
    const btn = e.target.closest('[data-pax]');
    if (!btn) return;
    active = Number(btn.dataset.pax);
    renderTabs();
    paintSeats();
    tip();
  };
}

function tip(msg) {
  const missing = state.seats.filter((s) => !s).length;
  $('#seat-tip').textContent =
    msg ||
    (missing
      ? `Выберите место для пассажира ${active + 1}. ${state.search.cabin === 'business' ? 'Доступны ряды бизнес класса.' : 'Обычные места бесплатно.'}`
      : 'Места выбраны для всех пассажиров.');
}

function renderSummary() {
  const ready = state.seats.every(Boolean);
  const hint = state.inbound ? 'Место на обратный рейс можно выбрать при онлайн регистрации.' : 'Можно продолжить без места, мы назначим его при регистрации.';
  $('#summary').innerHTML = summaryHtml(data, state, {
    cta: `<a class="btn btn--accent btn--lg" href="passenger.html" id="next">${ready ? 'Ввести данные пассажиров' : 'Продолжить без выбора'}</a>`,
    hint,
  });
}

import { $, mountChrome, loadData, store, stepsHtml, emptyStateHtml, airportBy, fmtDate, fmtPrice, rng, hashStr, escapeHtml, routeTrack, plural } from './common.js';
import { totals } from './booking.js';
import { icons } from './icons.js';

mountChrome('flights');
$('#steps').innerHTML = stepsHtml(4);

const state = store.get();

if (!state.code || !state.outbound || !state.passengers) {
  $('#content').innerHTML = emptyStateHtml('Здесь появится ваш билет', 'После выбора рейса и ввода данных пассажиров мы покажем код бронирования и посадочный талон.');
} else {
  loadData().then(render);
}

// QR-style pattern: three finder squares plus modules seeded by the booking code.
// Decorative only, it does not encode real data.
function qrSvg(seed) {
  const n = 25;
  const rand = rng(hashStr(seed));
  const inFinder = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7);
  let cells = '';
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (!inFinder(x, y) && rand() < 0.5) cells += `M${x} ${y}h1v1h-1z`;
  const finder = ([fx, fy]) =>
    `<path d="M${fx} ${fy}h7v7h-7zM${fx + 1} ${fy + 1}v5h5v-5z" fill-rule="evenodd"/><rect x="${fx + 2}" y="${fy + 2}" width="3" height="3"/>`;
  return `<svg class="qr" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" fill="#071427" role="img" aria-label="QR код посадочного талона">
    ${[[0, 0], [n - 7, 0], [0, n - 7]].map(finder).join('')}<path d="${cells}"/></svg>`;
}

function render(data) {
  const f = state.outbound;
  const a = airportBy(data, f.from);
  const b = airportBy(data, f.to);
  const t = totals(data, state);
  const names = state.passengers.map((p) => `${escapeHtml(p.last)} ${escapeHtml(p.first)}`);
  const seats = (state.seats ?? []).filter(Boolean);
  const boarding = (() => {
    const [h, m] = f.dep.split(':').map(Number);
    const mins = (h * 60 + m - 40 + 1440) % 1440;
    return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  })();

  $('#content').innerHTML = `
    <section class="done" aria-labelledby="done-title">
      <span class="done__badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path class="done__check" d="m5 12.5 4.5 4.5L19 7.5"/></svg>
      </span>
      <h1 class="done__title" id="done-title">Бронирование подтверждено</h1>
      <p class="done__text">Контакт для билета: ${escapeHtml(state.contact.email)}. В демо письма не отправляются. Онлайн регистрация откроется за 30 часов до вылета.</p>
      <p class="done__code glass">Код бронирования <strong>${state.code}</strong></p>
    </section>

    <article class="ticket glass" aria-label="Электронный билет">
      <div class="ticket__main">
        <div class="ticket__head">
          <span class="logo"><span class="logo__mark">${icons.plane(16)}</span><span class="logo__word">SkyNavoi</span></span>
          <span class="ticket__class">${data.cabins[state.search.cabin].label}</span>
        </div>
        <div class="ticket__route">
          <div><p class="ticket__code">${a.code}</p><p class="ticket__city">${a.city}</p></div>
          ${routeTrack({ loop: true, label: `${a.city} – ${b.city}` })}
          <div style="text-align:right"><p class="ticket__code">${b.code}</p><p class="ticket__city">${b.city}</p></div>
        </div>
        <dl class="ticket__grid">
          <div><dt>Дата</dt><dd>${fmtDate(f.date, { day: 'numeric', month: 'short' })}</dd></div>
          <div><dt>Вылет</dt><dd>${f.dep}</dd></div>
          <div><dt>Посадка</dt><dd>${boarding}</dd></div>
          <div><dt>Рейс</dt><dd>${f.number}</dd></div>
          <div><dt>${seats.length > 1 ? 'Места' : 'Место'}</dt><dd>${seats.length ? seats.join(', ') : 'при регистрации'}</dd></div>
          <div><dt>Выход</dt><dd>на табло</dd></div>
          <div><dt>Прилёт</dt><dd>${f.arr}${f.nextDay ? ' +1' : ''}</dd></div>
          <div><dt>Сумма</dt><dd>${fmtPrice(t.total)}</dd></div>
        </dl>
        <p class="ticket__names">${names.length > 1 ? `${names.length} ${plural(names.length, ['пассажир', 'пассажира', 'пассажиров'])}: ` : 'Пассажир: '}<strong>${names.join(', ')}</strong>
        ${state.inbound ? `<br>Обратно: ${state.inbound.number}, ${fmtDate(state.inbound.date, { day: 'numeric', month: 'short' })} в ${state.inbound.dep}` : ''}</p>
      </div>
      <div class="ticket__stub">
        ${qrSvg(state.code)}
        <small>Демо билет, недействителен</small>
      </div>
    </article>

    <div class="done__actions">
      <button type="button" class="btn btn--ghost" id="print">${icons.print(18)} Распечатать</button>
      <a class="btn btn--accent" href="index.html" id="new">Новый поиск</a>
    </div>`;

  $('#print').addEventListener('click', () => window.print());
  $('#new').addEventListener('click', () => store.set({ outbound: null, inbound: null, seats: null, passengers: null, code: null }));
  $('#done-title').setAttribute('tabindex', '-1');
  $('#done-title').focus({ preventScroll: true });
}

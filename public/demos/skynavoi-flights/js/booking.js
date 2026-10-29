// Shared booking summary for the seat and passenger pages.
import { airportBy, fmtPrice, fmtDate, fmtDuration, routeTrack, plural } from './common.js';

export function seatExtra(data, seat) {
  if (!seat) return 0;
  const row = parseInt(seat, 10);
  return data.seatExtras.find((x) => x.rows.includes(row))?.price ?? 0;
}

export function totals(data, state) {
  const pax = Number(state.search.pax);
  const fares = (state.outbound?.price ?? 0) + (state.inbound?.price ?? 0);
  const seats = (state.seats ?? []).reduce((sum, s) => sum + seatExtra(data, s), 0);
  return { pax, fare: fares * pax, seats, total: fares * pax + seats };
}

const legRow = (data, f, label) => {
  const a = airportBy(data, f.from);
  const b = airportBy(data, f.to);
  return `<div><dt>${label}</dt><dd>${a.code} → ${b.code}, ${fmtDate(f.date, { day: 'numeric', month: 'short' })}, ${f.dep}</dd></div>`;
};

export function summaryHtml(data, state, { cta = '', hint = '' } = {}) {
  const f = state.outbound;
  const a = airportBy(data, f.from);
  const b = airportBy(data, f.to);
  const t = totals(data, state);
  const seats = (state.seats ?? []).filter(Boolean);
  return `
    <h2 class="panel__title">Ваше бронирование</h2>
    <div class="sum__route"><span>${a.code}</span>${routeTrack({ loop: true, label: `${a.city} – ${b.city}` })}<span>${b.code}</span></div>
    <dl class="sum__list">
      ${legRow(data, f, 'Туда')}
      ${state.inbound ? legRow(data, state.inbound, 'Обратно') : ''}
      <div><dt>Рейс</dt><dd>${f.number}${state.inbound ? `, ${state.inbound.number}` : ''}</dd></div>
      <div><dt>В пути</dt><dd>${fmtDuration(f.duration)}</dd></div>
      <div><dt>Класс</dt><dd>${data.cabins[state.search.cabin].label}</dd></div>
      <div><dt>Багаж</dt><dd>${data.cabins[state.search.cabin].baggage}</dd></div>
      <div><dt>Тариф × ${t.pax}</dt><dd>${fmtPrice(t.fare)}</dd></div>
      <div><dt>Места${seats.length ? ` (${seats.join(', ')})` : ''}</dt><dd>${t.seats ? fmtPrice(t.seats) : 'бесплатно'}</dd></div>
    </dl>
    <div class="sum__total"><span>Итого за ${t.pax} ${plural(t.pax, ['пассажира', 'пассажиров', 'пассажиров'])}</span><strong>${fmtPrice(t.total)}</strong></div>
    ${cta}
    ${hint ? `<p class="sum__hint">${hint}</p>` : ''}`;
}

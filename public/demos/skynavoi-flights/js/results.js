import {
  $, $$, mountChrome, loadData, airportBy, generateFlights, fmtPrice, fmtDuration, fmtDate,
  stopsLabel, plural, routeTrack, store, stepsHtml, emptyStateHtml, reduceMotion, escapeHtml,
} from './common.js';
import { icons } from './icons.js';

mountChrome('flights');
$('#steps').innerHTML = stepsHtml(1);
$('#filters-icon').innerHTML = icons.sliders(18);

const list = $('#flight-list');
const filterForm = $('#filter-form');
const priceInput = $('#price');

const params = new URLSearchParams(location.search);
const saved = store.get();
const search = params.get('from')
  ? {
      trip: params.get('trip') === 'one' ? 'one' : 'round',
      from: params.get('from'),
      to: params.get('to'),
      depart: params.get('depart'),
      return: params.get('return') || '',
      pax: params.get('pax') || '1',
      cabin: params.get('cabin') === 'business' ? 'business' : 'economy',
    }
  : saved.search;
const leg = params.get('leg') === 'back' && search?.trip === 'round' && saved.outbound ? 'back' : 'out';

let flights = [];
let data;

$('#edit-search').innerHTML = `${icons.back(16)} Изменить поиск`;
if (search) $('#edit-search').href = `index.html?${new URLSearchParams({ from: search.from, to: search.to })}#search`;

showSkeleton();

loadData()
  .then((d) => {
    data = d;
    if (!search || !airportBy(d, search.from) || !airportBy(d, search.to)) {
      $('#summary').hidden = true;
      $('.results').innerHTML = emptyStateHtml('Сначала выберите направление', 'Укажите города и даты на главной странице, и мы покажем подходящие рейсы.');
      return;
    }
    store.set({ search });
    const [from, to, date] = leg === 'back' ? [search.to, search.from, search.return] : [search.from, search.to, search.depart];
    flights = generateFlights(d, { from, to, date, cabin: search.cabin });
    renderSummary(from, to, date);
    setupFilters();
    // Short delay so the skeleton reads as loading rather than flashing.
    setTimeout(render, reduceMotion() ? 0 : 450);
  })
  .catch(() => {
    list.removeAttribute('aria-busy');
    list.innerHTML = `<div class="empty glass"><h2 class="empty__title">Не удалось загрузить рейсы</h2>
      <p class="empty__text">Файл data/flights.json недоступен. Запустите сайт через локальный сервер и обновите страницу.</p>
      <button class="btn btn--accent" type="button" onclick="location.reload()">Обновить страницу</button></div>`;
  });

function showSkeleton() {
  const bar = (w) => `<span class="skeleton__bar" style="width:${w}"></span>`;
  list.innerHTML = Array.from(
    { length: 3 },
    () => `<div class="skeleton" aria-hidden="true">
      <div class="skeleton__row">${bar('22%')}${bar('36%')}${bar('22%')}</div>
      <div class="skeleton__row">${bar('40%')}${bar('28%')}</div></div>`
  ).join('');
  $('#list-count').textContent = 'Ищем рейсы…';
}

function renderSummary(from, to, date) {
  const a = airportBy(data, from);
  const b = airportBy(data, to);
  const pax = Number(search.pax);
  $('#summary').innerHTML = `
    <div class="summary__route">
      <span>${a.code}<small>${a.city}</small></span>
      ${routeTrack({ loop: true, label: `${a.city} – ${b.city}` })}
      <span>${b.code}<small>${b.city}</small></span>
    </div>
    <div class="summary__meta">
      <span class="chip">${icons.calendar(14)} ${fmtDate(date)}</span>
      <span class="chip">${icons.user(14)} ${pax} ${plural(pax, ['пассажир', 'пассажира', 'пассажиров'])}</span>
      <span class="chip">${data.cabins[search.cabin].label}</span>
    </div>`;

  if (search.trip === 'round') {
    const note = $('#leg-note');
    note.hidden = false;
    note.innerHTML =
      leg === 'out'
        ? `${icons.plane(16)} <span><strong>Шаг 1 из 2:</strong> рейс туда. Обратный рейс на ${fmtDate(search.return, { day: 'numeric', month: 'long' })} выберете следующим.</span>`
        : `${icons.plane(16)} <span><strong>Шаг 2 из 2:</strong> обратный рейс. Туда: ${escapeHtml(saved.outbound.number)}, ${saved.outbound.dep}.</span>`;
    $('#page-title').textContent = leg === 'out' ? 'Выберите рейс туда' : 'Выберите обратный рейс';
  }
}

/* ---------- Filters and sorting ---------- */

const timeBucket = (min) => (min < 360 ? 'night' : min < 720 ? 'morning' : min < 1080 ? 'day' : 'evening');

function setupFilters() {
  if (!flights.length) return;
  const prices = flights.map((f) => f.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  priceInput.min = String(Math.floor(min / 10000) * 10000);
  priceInput.max = String(Math.ceil(max / 10000) * 10000);
  priceInput.value = priceInput.max;
  $('#price-min').textContent = fmtPrice(min);
  updatePriceLabel();

  ['0', '1', '2'].forEach((s) => {
    const n = flights.filter((f) => String(Math.min(f.stops, 2)) === s).length;
    const box = $(`input[name="stops"][value="${s}"]`);
    $(`[data-count="stops-${s}"]`).textContent = n;
    box.closest('.check').hidden = n === 0;
  });
  ['night', 'morning', 'day', 'evening'].forEach((t) => {
    $(`[data-count="time-${t}"]`).textContent = flights.filter((f) => timeBucket(f.depMinutes) === t).length;
  });

  filterForm.addEventListener('input', () => {
    updatePriceLabel();
    render();
  });
  filterForm.addEventListener('reset', () =>
    setTimeout(() => {
      priceInput.value = priceInput.max;
      updatePriceLabel();
      render();
    })
  );
  $$('input[name="sort"]').forEach((r) => r.addEventListener('change', render));

  // Filters start collapsed on small screens.
  if (matchMedia('(max-width: 1023px)').matches) $('#filters').open = false;
}

function updatePriceLabel() {
  $('#price-out').textContent = fmtPrice(Number(priceInput.value));
  priceInput.setAttribute('aria-valuetext', fmtPrice(Number(priceInput.value)));
}

function visibleFlights() {
  const maxPrice = Number(priceInput.value);
  const stops = $$('input[name="stops"]:checked').map((i) => Number(i.value));
  const times = $$('input[name="time"]:checked').map((i) => i.value);
  const sort = $('input[name="sort"]:checked').value;
  return flights
    .filter((f) => f.price <= maxPrice && stops.includes(Math.min(f.stops, 2)) && times.includes(timeBucket(f.depMinutes)))
    .sort((a, b) => (sort === 'dep' ? a.depMinutes - b.depMinutes : a[sort] - b[sort]));
}

function render() {
  list.removeAttribute('aria-busy');
  if (!flights.length) {
    $('#filters').hidden = true;
    $('#list-count').textContent = 'Рейсов не найдено';
    list.innerHTML = emptyStateHtml(
      'На этом направлении пока нет рейсов',
      'Мы не летаем между этими городами. Попробуйте рейс с пересадкой в Ташкенте или выберите другой город.'
    );
    return;
  }
  const shown = visibleFlights();
  const cheapest = Math.min(...flights.map((f) => f.price));
  const fastest = Math.min(...flights.map((f) => f.duration));
  $('#list-count').textContent = `${shown.length} ${plural(shown.length, ['рейс', 'рейса', 'рейсов'])} из ${flights.length}`;

  if (!shown.length) {
    list.innerHTML = `<div class="empty glass">
      <span class="empty__icon">${icons.sliders(26)}</span>
      <h2 class="empty__title">Под фильтры ничего не подходит</h2>
      <p class="empty__text">Увеличьте максимальную цену или отметьте больше вариантов времени вылета.</p>
      <button type="button" class="btn btn--accent" id="clear-filters">Сбросить фильтры</button></div>`;
    $('#clear-filters').addEventListener('click', () => filterForm.reset());
    return;
  }

  const pax = Number(search.pax);
  list.innerHTML = shown
    .map((f, i) => {
      const a = airportBy(data, f.from);
      const b = airportBy(data, f.to);
      const tags = [
        f.price === cheapest ? '<span class="chip">Самый дешёвый</span>' : '',
        f.duration === fastest ? '<span class="chip">Самый быстрый</span>' : '',
        `<span>${f.number} · ${f.aircraft}</span>`,
      ].join('');
      return `<article class="flight glass reveal" style="--i:${i}" aria-label="${a.city} – ${b.city}, вылет ${f.dep}, ${fmtPrice(f.price)}">
        <div class="flight__main">
          <div><p class="flight__time">${f.dep}</p><p class="flight__code">${a.code} · ${a.city}</p></div>
          <div class="flight__mid">
            <span class="flight__dur">${fmtDuration(f.duration)}</span>
            ${routeTrack()}
            <span class="flight__stops${f.stops ? '' : ' flight__stops--direct'}">${stopsLabel(f.stops)}${f.via.length ? `, ${f.via.join(', ')}` : ''}</span>
          </div>
          <div class="flight__end"><p class="flight__time">${f.arr}${f.nextDay ? `<sup>+${f.nextDay}</sup>` : ''}</p><p class="flight__code">${b.code} · ${b.city}</p></div>
        </div>
        <div class="flight__foot">
          <div class="flight__tags">${tags}</div>
          <div class="flight__buy">
            <p class="flight__price"><strong>${fmtPrice(f.price)}</strong>
              <small>${pax > 1 ? `за ${pax}: ${fmtPrice(f.price * pax)}` : 'за пассажира'}${f.seatsLeft <= 4 ? ` · <span class="flight__left">осталось ${f.seatsLeft}</span>` : ''}</small></p>
            <button type="button" class="btn btn--accent" data-select="${f.id}">Выбрать</button>
          </div>
        </div>
      </article>`;
    })
    .join('');

  // Stagger the first paint; filter changes after that appear instantly.
  const cards = $$('.flight', list);
  if (reduceMotion() || render.done) cards.forEach((c) => c.classList.add('is-in'));
  else requestAnimationFrame(() => requestAnimationFrame(() => cards.forEach((c) => c.classList.add('is-in'))));
  render.done = true;
  cards.forEach(addTilt);
}

list.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-select]');
  if (!btn) return;
  const flight = flights.find((f) => f.id === btn.dataset.select);
  if (leg === 'out') {
    store.set({ outbound: flight, inbound: null, seats: null });
    if (search.trip === 'round') {
      location.href = `results.html?${new URLSearchParams({ ...search, leg: 'back' })}`;
      return;
    }
  } else {
    store.set({ inbound: flight });
  }
  location.href = 'seats.html';
});

/* ---------- Card tilt (fine pointers only) ---------- */

function addTilt(card) {
  if (reduceMotion() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let frame;
  card.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transition = 'transform 120ms ease-out';
      card.style.transform = `perspective(1200px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg) translateY(-2px)`;
    });
  });
  card.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    card.style.transition = 'transform 300ms var(--ease-out)';
    card.style.transform = '';
  });
}

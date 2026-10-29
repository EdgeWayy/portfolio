import { $, $$, mountChrome, loadData, airportBy, fmtPrice, fmtDuration, todayISO, reduceMotion, routeTrack, initReveal, store } from './common.js';
import { icons } from './icons.js';

mountChrome('flights');

$$('[data-icon]').forEach((el) => (el.innerHTML = icons[el.dataset.icon](22)));
$$('[data-plane]').forEach((el) => (el.innerHTML = icons.plane(18)));
$('#swap').innerHTML = icons.swap(18);

splitHeadline($('[data-words]'));
initHeroVideo();
initTagline($('#tagline'));

const form = $('#search');
const from = $('#from');
const to = $('#to');
const depart = $('#depart');
const ret = $('#return');
const error = $('#search-error');

loadData()
  .then((data) => {
    fillAirports(data);
    renderDestinations(data);
  })
  .catch(() => {
    error.textContent = 'Не удалось загрузить список городов. Запустите сайт через локальный сервер, как описано в README.';
  });

/* ---------- Headline: one span per word, staggered by CSS ---------- */

function splitHeadline(el) {
  if (!el) return;
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(' ');
          const span = document.createElement('span');
          span.className = 'word';
          span.style.setProperty('--i', i++);
          span.textContent = part;
          frag.append(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        if (child.classList.contains('accent')) {
          child.classList.add('word');
          child.style.setProperty('--i', i++);
        } else walk(child);
      }
    });
  };
  walk(el);
}

/* ---------- Hero video: skip on data saver and slow networks ---------- */

function initHeroVideo() {
  const video = $('#hero-video');
  const media = $('#hero-media');
  const toggle = $('#video-toggle');
  if (!video) return;

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slow = conn && (conn.saveData || /(^|-)2g$|3g/.test(conn.effectiveType || '') || (conn.downlink && conn.downlink < 1.5));
  if (slow) {
    video.remove();
    return;
  }

  const setToggle = (playing) => {
    toggle.innerHTML = playing ? icons.pause(16) : icons.play(16);
    toggle.setAttribute('aria-label', playing ? 'Остановить видео' : 'Включить видео');
  };

  let userPaused = reduceMotion();
  video.autoplay = !userPaused;

  const attachSources = () => {
    if (video.dataset.loaded) return;
    video.dataset.loaded = '1';
    const webm = document.createElement('source');
    webm.src = video.dataset.srcWebm;
    webm.type = 'video/webm';
    const mp4 = document.createElement('source');
    mp4.src = video.dataset.srcMp4;
    mp4.type = 'video/mp4';
    video.append(webm, mp4);
    video.load();
  };

  video.addEventListener('playing', () => {
    video.classList.add('is-playing');
    setToggle(true);
  });
  video.addEventListener('pause', () => setToggle(false));

  toggle.hidden = false;
  setToggle(false);
  toggle.addEventListener('click', () => {
    attachSources();
    if (video.paused) {
      userPaused = false;
      video.play().catch(() => {});
    } else {
      userPaused = true;
      video.pause();
    }
  });

  if (!userPaused) attachSources();

  // Pause when the hero is off screen, resume when it returns.
  let heroVisible = true;
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    if (!heroVisible) video.pause();
    else if (!userPaused && video.dataset.loaded) video.play().catch(() => {});
  }).observe($('.hero'));

  // Light parallax, only while the hero is on screen.
  if (reduceMotion()) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    if (!heroVisible) return;
    const y = Math.min(window.scrollY, window.innerHeight);
    media.style.transform = `translate3d(0, ${(y * 0.15).toFixed(1)}px, 0)`;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
}

/* ---------- Tagline: words light up in reading order on scroll ---------- */

function initTagline(el) {
  if (!el) return;
  const words = [];
  const wrap = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/( )/).forEach((part) => {
          if (!part) return;
          if (part === ' ') return frag.append(' ');
          const span = document.createElement('span');
          span.className = 'tw';
          span.textContent = part;
          words.push(span);
          frag.append(span);
        });
        child.replaceWith(frag);
      } else if (child.classList?.contains('accent')) {
        child.classList.add('tw');
        words.push(child);
      }
    });
  };
  wrap(el);

  if (reduceMotion()) {
    words.forEach((w) => w.classList.add('is-lit'));
    return;
  }

  let lit = 0;
  let active = false;
  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when the block top hits 85% of the viewport, 1 when its bottom reaches 45%.
    const start = vh * 0.85;
    const end = vh * 0.45;
    const progress = (start - rect.top) / (start - end + rect.height);
    const target = Math.max(0, Math.min(words.length, Math.ceil(progress * words.length)));
    while (lit < target) words[lit++].classList.add('is-lit');
  };
  const onScroll = () => {
    if (!active || ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting && lit < words.length;
    if (active) update();
  }).observe(el);
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- Search form ---------- */

function fillAirports(data) {
  const opts = data.airports.map((a) => `<option value="${a.code}">${a.city} (${a.code})</option>`).join('');
  from.innerHTML = opts;
  to.innerHTML = opts;

  const last = store.get().search;
  const params = new URLSearchParams(location.search);
  from.value = params.get('from') || last?.from || 'NVI';
  to.value = params.get('to') || last?.to || 'IST';
  depart.min = todayISO();
  depart.value = last?.depart && last.depart >= todayISO() ? last.depart : todayISO(7);
  ret.min = depart.value;
  ret.value = last?.return && last.return >= depart.value ? last.return : todayISO(14);
  if (last?.pax) $('#pax').value = last.pax;
  if (last?.cabin) $('#cabin').value = last.cabin;
  if (last?.trip === 'one') $('#trip-one').checked = true;
  syncTrip();
  updatePreview();
}

function updatePreview() {
  $('[data-preview="from"]').textContent = from.value;
  $('[data-preview="to"]').textContent = to.value;
}

function syncTrip() {
  const oneWay = $('#trip-one').checked;
  ret.disabled = oneWay;
  ret.required = !oneWay;
}

from.addEventListener('change', updatePreview);
to.addEventListener('change', updatePreview);
$$('input[name="trip"]').forEach((r) => r.addEventListener('change', syncTrip));
depart.addEventListener('change', () => {
  ret.min = depart.value;
  if (ret.value && ret.value < depart.value) ret.value = depart.value;
});

$('#swap').addEventListener('click', (e) => {
  [from.value, to.value] = [to.value, from.value];
  e.currentTarget.classList.toggle('is-flipped');
  updatePreview();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  error.textContent = '';
  [from, to, depart, ret].forEach((el) => el.removeAttribute('aria-invalid'));

  const fail = (msg, el) => {
    error.textContent = msg;
    el.setAttribute('aria-invalid', 'true');
    el.focus();
  };
  const oneWay = $('#trip-one').checked;
  if (from.value === to.value) return fail('Город вылета и прилёта совпадают. Выберите другой город прилёта.', to);
  if (!depart.value) return fail('Укажите дату вылета.', depart);
  if (depart.value < todayISO()) return fail('Дата вылета уже прошла. Выберите сегодняшнюю или более позднюю.', depart);
  if (!oneWay && !ret.value) return fail('Укажите дату обратного рейса или выберите «В одну сторону».', ret);
  if (!oneWay && ret.value < depart.value) return fail('Обратный рейс не может быть раньше вылета.', ret);

  const search = {
    trip: oneWay ? 'one' : 'round',
    from: from.value,
    to: to.value,
    depart: depart.value,
    return: oneWay ? '' : ret.value,
    pax: $('#pax').value,
    cabin: $('#cabin').value,
  };
  store.set({ search, outbound: null, inbound: null, seats: null, passengers: null });
  location.href = `results.html?${new URLSearchParams(search)}`;
});

/* ---------- Destinations ---------- */

function renderDestinations(data) {
  const tones = ['navy', 'sand', 'orange', 'sand', 'navy', 'sand'];
  $('#dest-grid').innerHTML = data.destinations
    .map((d, i) => {
      const dest = airportBy(data, d.code);
      const origin = airportBy(data, d.from);
      const href = `results.html?${new URLSearchParams({
        trip: 'one',
        from: d.from,
        to: d.code,
        depart: todayISO(10 + i * 3),
        pax: '1',
        cabin: 'economy',
      })}`;
      return `<a class="dest dest--${tones[i]}" href="${href}" aria-label="${dest.city}: рейсы из города ${origin.city} от ${fmtPrice(d.price)}">
        <div class="dest__top">
          <div>
            <h3 class="dest__city">${dest.city}</h3>
            <p class="dest__meta">${dest.country} · ${d.note}</p>
          </div>
          <span class="dest__code" aria-hidden="true">${dest.code}</span>
        </div>
        <p class="dest__route" aria-hidden="true">${origin.code} ${routeTrack()} ${dest.code} · ${fmtDuration(d.minutes)}</p>
        <div class="dest__bottom">
          <p class="dest__price">из города ${origin.city}<strong>от ${fmtPrice(d.price)}</strong></p>
          <span class="dest__go" aria-hidden="true">${icons.arrow(20)}</span>
        </div>
      </a>`;
    })
    .join('');
  initReveal($('#destinations'));
}

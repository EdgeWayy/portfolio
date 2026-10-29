/* =========================================================================
 * Runs synchronously in <head>, before first paint, so the page never
 * flashes the wrong theme. It also decides on "lite mode" for low-end phones.
 * ========================================================================= */
(function () {
  'use strict';
  var root = document.documentElement;
  var prefix = 'lumina:';

  function read(key) {
    try { return localStorage.getItem(prefix + key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(prefix + key, value); } catch (e) { /* private mode */ }
  }

  /* Theme: the saved choice wins. Otherwise use the local time (the mall is "night" after 19:00). */
  var theme = read('theme');
  if (theme !== 'light' && theme !== 'dark') {
    var hour = new Date().getHours();
    theme = (hour >= 19 || hour < 7) ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', theme);

  /* Lite mode: fewer moving parts, no backdrop blur. You can force it with ?lite=1 or ?lite=0. */
  var params = new URLSearchParams(location.search);
  var forced = params.get('lite');
  if (forced === '1' || forced === '0') write('lite', forced);
  else forced = read('lite');

  var lite;
  if (forced === '1') lite = true;
  else if (forced === '0') lite = false;
  else {
    var cores = navigator.hardwareConcurrency || 8;
    var memory = navigator.deviceMemory || 8;
    var conn = navigator.connection || {};
    var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    lite = !!conn.saveData || memory <= 2 || (coarse && (cores <= 4 || memory <= 3));
  }
  if (lite) root.classList.add('lite');
  root.classList.add('js');
  window.__loaderStart = (window.performance && performance.now()) || 0;
})();

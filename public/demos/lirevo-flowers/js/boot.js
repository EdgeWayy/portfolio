/* Ранний старт: классы js/motion до первой отрисовки (вынесено из inline-скрипта ради CSP). */
document.documentElement.classList.add('js');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('motion');

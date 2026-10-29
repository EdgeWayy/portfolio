// Inline SVG icons, drawn for this project. All use currentColor.
const svg = (body, { size = 20, fill = false } = {}) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" ${
    fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"'
  }>${body}</svg>`;

export const icons = {
  plane: (size) =>
    svg(
      '<path d="M2.5 13.2v-2.4l7.2-1.1L7 3.4l1.9-.4 5 6.2 5.3-.5c1.6-.1 2.8 1.3 2.8 3.3s-1.2 3.4-2.8 3.3l-5.3-.5-5 6.2-1.9-.4 2.7-6.3z"/><path d="M2.5 10.8 1.4 8h1.5l2.4 2.3M2.5 13.2 1.4 16h1.5l2.4-2.3"/>',
      { size, fill: true }
    ),
  swap: (size) => svg('<path d="M7 4 3 8l4 4"/><path d="M3 8h13"/><path d="m17 20 4-4-4-4"/><path d="M21 16H8"/>', { size }),
  calendar: (size) => svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', { size }),
  user: (size) => svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/>', { size }),
  seat: (size) => svg('<path d="M7 4h6a2 2 0 0 1 2 2v7H9a2 2 0 0 1-2-2z"/><path d="M5 9v5a3 3 0 0 0 3 3h9"/><path d="M9 17v3M16 17v3"/>', { size }),
  check: (size) => svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', { size }),
  arrow: (size) => svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', { size }),
  back: (size) => svg('<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>', { size }),
  clock: (size) => svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', { size }),
  bag: (size) => svg('<rect x="4.5" y="7.5" width="15" height="12.5" rx="2.5"/><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2"/><path d="M9 11v5M15 11v5"/>', { size }),
  shield: (size) => svg('<path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6z"/><path d="m9 12 2 2 4-4"/>', { size }),
  sliders: (size) => svg('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>', { size }),
  play: (size) => svg('<path d="M8 5.5v13l10.5-6.5z"/>', { size, fill: true }),
  pause: (size) => svg('<rect x="6.5" y="5" width="3.5" height="14" rx="1"/><rect x="14" y="5" width="3.5" height="14" rx="1"/>', { size, fill: true }),
  print: (size) => svg('<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>', { size }),
  globe: (size) => svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5S9.6 5.9 12 3.5z"/>', { size }),
};

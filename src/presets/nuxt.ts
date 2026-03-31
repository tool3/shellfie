import type { Preset } from '../types';
import { createTemplate } from '../templates';

const green = '#00dc82';
const pad = 64;

export const nuxt: Preset = {
  template: createTemplate('nuxt', {
    titleBar: false,
    borderRadius: 10,
    controls: false,
    padding: 16,
    shadow: false,
    border: false,
    borderColor: green,
    borderWidth: 1,
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'nuxt',
    background: '#0b0c11',
    foreground: '#babed8',
    cursor: '#babed8',
    selection: '#3a3a3a',
    black: '#0b0c11',
    red: '#babed8',
    green: '#C3E88D',
    yellow: '#F78C6C',
    blue: '#82AAFF',
    magenta: '#C793EA',
    cyan: '#BABED8',
    white: '#89DDFF',
    brightBlack: '#676E95',
    brightRed: '#d4d8f2',
    brightGreen: '#DCF5A0',
    brightYellow: '#FFA686',
    brightBlue: '#A0C8FF',
    brightMagenta: '#E0B0FF',
    brightCyan: '#f07178',
    brightWhite: '#A3F7FF',
  },
  lineNumbers: true,
  background: {
    color: '#0b0c11',
    padding: pad,
    borderRadius: 0,
  },
  overlays: (w, h) => {
    // Terminal rect position and size
    const tx = pad;
    const ty = pad;
    const tw = w - pad * 2;
    const th = h - pad * 2;

    // Three concentric gradient borders (135deg diagonal, green at corners, transparent center)
    // Each ring is larger than the previous, with increasing fade
    const ring = (expand: number, radius: number, startPct: number, endPct: number, opacity: number) => {
      const rx = tx - expand;
      const ry = ty - expand;
      const rw = tw + expand * 2;
      const rh = th + expand * 2;
      const id = `nuxt-ring-${expand}`;
      return `<defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">` +
        `<stop offset="0%" stop-color="${green}"/>` +
        `<stop offset="${startPct}%" stop-color="${green}"/>` +
        `<stop offset="${startPct + 12}%" stop-color="transparent"/>` +
        `<stop offset="${100 - startPct - 12}%" stop-color="transparent"/>` +
        `<stop offset="${endPct}%" stop-color="${green}"/>` +
        `<stop offset="100%" stop-color="${green}"/>` +
      `</linearGradient></defs>` +
      `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="none" stroke="url(#${id})" stroke-width="1" rx="${radius}" ry="${radius}" opacity="${opacity}"/>`;
    };

    // Radial glow behind terminal
    const glowId = 'nuxt-glow';
    const glow = `<defs><radialGradient id="${glowId}">` +
      `<stop offset="0%" stop-color="${green}" stop-opacity="0.15"/>` +
      `<stop offset="70%" stop-color="${green}" stop-opacity="0"/>` +
    `</radialGradient></defs>` +
    `<rect x="${tx - 1}" y="${ty - 1}" width="${tw + 2}" height="${th + 2}" fill="url(#${glowId})" rx="10" ry="10"/>`;

    return [
      glow,
      ring(0, 10, 8, 92, 0.5),   // Inner — brightest
      ring(7, 18, 10, 90, 0.25),  // Middle — dimmer
      ring(13, 25, 12, 88, 0.15), // Outer — dimmest
    ];
  },
};

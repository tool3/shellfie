import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;

// Deterministic scattered stars — matches Ray.so's gemini frame visual
const generateStars = (w: number, h: number): string => {
  let seed = 0x13371337;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const density = 0.00067;
  const count = Math.round(w * h * density);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand() * w).toFixed(1);
    const y = (rand() * h).toFixed(1);
    const r = (0.3 + rand() * 0.5).toFixed(2);
    const opacity = (0.3 + Math.floor(rand() * 4) * 0.1).toFixed(1);
    parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill-opacity="${opacity}"/>`);
  }
  return `<g fill="#ffffff">${parts.join('')}</g>`;
};

export const gemini: Preset = {
  title: 'gemini',
  titleAlignment: 'left',
  template: createTemplate('gemini', {
    titleBar: true,
    titleBarHeight: 40,
    borderRadius: 26,
    controls: true,
    controlsPosition: 'left',
    controlStyle: {
      close: '#444444',
      minimize: '#444444',
      maximize: '#444444',
      radius: 4,
      spacing: 16,
      size: 8,
    },
    padding: 16,
    shadow: false,
    border: false,
    header: { backgroundColor: '#11131780' },
  }),
  fontFamily: "'Google Sans Code', monospace",
  theme: {
    name: 'gemini',
    background: '#16181d',
    foreground: '#abb2bf',
    cursor: '#abb2bf',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#d19a66',
    green: '#98c379',
    yellow: '#5c9dc7',
    blue: '#98c379',
    magenta: '#5c9dc7',
    cyan: '#5c9dc7',
    white: '#abb2bf',
    brightBlack: '#5c6370',
    brightRed: '#ebb480',
    brightGreen: '#b2d993',
    brightYellow: '#76b7e1',
    brightBlue: '#b2d993',
    brightMagenta: '#76b7e1',
    brightCyan: '#76b7e1',
    brightWhite: '#c5ccd9',
  },
  lineNumbers: true,
  background: {
    color: '#0e1016',
    padding: pad,
  },
  overlays: (w, h) => [generateStars(w, h)],
};

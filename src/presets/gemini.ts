import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;

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
    border: '1px solid #222222',
    header: { border: '1px solid #1a1a1a', backgroundColor: '#0a0c12' },
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'gemini',
    background: '#16181d',
    foreground: '#abb2bf',
    cursor: '#abb2bf',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#d19a66',
    green: '#98c379',
    yellow: '#56b6c2',
    blue: '#98c379',
    magenta: '#5c9dc7',
    cyan: '#56b6c2',
    white: '#abb2bf',
    brightBlack: '#5c6370',
    brightRed: '#ebb480',
    brightGreen: '#b2d993',
    brightYellow: '#70d0dc',
    brightBlue: '#b2d993',
    brightMagenta: '#76b7e1',
    brightCyan: '#56b6c2',
    brightWhite: '#c5ccd9',
  },
  lineNumbers: true,
  backgroundOpacity: 0.8,
  background: {
    color: '#0e1016',
    padding: pad,
    pattern: { type: 'dots', color: '#161616', size: 24 },
  },
  overlays: (w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    return [
      // Subtle star/dots scattered in background — solid colors, no alpha
      `<circle cx="${pad + 20}" cy="${pad + 15}" r="1" fill="#1c1c1c"/>`,
      `<circle cx="${w - pad - 30}" cy="${pad + 25}" r="1.5" fill="#1a1a1a"/>`,
      `<circle cx="${cx - 60}" cy="${cy - 40}" r="1" fill="#1b1b1b"/>`,
      `<circle cx="${cx + 80}" cy="${cy + 30}" r="1.5" fill="#1a1a1a"/>`,
      `<circle cx="${pad + 50}" cy="${h - pad - 20}" r="1" fill="#1c1c1c"/>`,
      `<circle cx="${w - pad - 40}" cy="${h - pad - 35}" r="1" fill="#1b1b1b"/>`,
      `<circle cx="${cx}" cy="${pad + 10}" r="1.5" fill="#1a1a1a"/>`,
      `<circle cx="${cx + 40}" cy="${h - pad - 15}" r="1" fill="#1c1c1c"/>`,
    ];
  },
};

import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 40;
const lineColor = '#272727';

export const tailwind: Preset = {
  template: createTemplate('tailwind', {
    titleBar: true,
    titleBarHeight: 34,
    borderRadius: 8,
    controls: true,
    controlsPosition: 'left',
    controlStyle: {
      close: '#ffffff33',
      minimize: '#ffffff33',
      maximize: '#ffffff33',
      radius: 4,
      spacing: 16,
      size: 8,
    },
    padding: 12,
    shadow: true,
    border: true,
    borderColor: '#ffffff40',
    borderWidth: 1,
    header: { border: true, borderColor: '#ffffff1a', borderWidth: 1 },
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'tailwind',
    background: '#1e293b',
    foreground: '#ffffff',
    cursor: '#ffffff',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#d1d5db',
    green: '#d1d5db',
    yellow: '#ffffff',
    blue: '#f9fafb',
    magenta: '#e5e7eb',
    cyan: '#e5e7eb',
    white: '#d1d5db',
    brightBlack: '#6b7280',
    brightRed: '#ebeff3',
    brightGreen: '#ebeff3',
    brightYellow: '#ffffff',
    brightBlue: '#ffffff',
    brightMagenta: '#ffffff',
    brightCyan: '#e5e7eb',
    brightWhite: '#ebeff3',
  },
  lineNumbers: true,
  background: {
    color: '#0f172a',
    padding: pad,
    pattern: { type: 'grid', color: '#171717', size: 50 },
  },
  overlays: (w, h) => [
    // Grid lines at terminal boundary (segments outside terminal box)
    `<line x1="0" y1="${pad}" x2="${pad}" y2="${pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${w - pad}" y1="${pad}" x2="${w}" y2="${pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="0" y1="${h - pad}" x2="${pad}" y2="${h - pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${w - pad}" y1="${h - pad}" x2="${w}" y2="${h - pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${pad}" y1="0" x2="${pad}" y2="${pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${pad}" y1="${h - pad}" x2="${pad}" y2="${h}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${w - pad}" y1="0" x2="${w - pad}" y2="${pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${w - pad}" y1="${h - pad}" x2="${w - pad}" y2="${h}" stroke="${lineColor}" stroke-width="1"/>`,
    // Blurred gradient beams at bottom
    `<defs>` +
      `<linearGradient id="tw-beam" x1="0%" y1="0%" x2="100%" y2="0%">` +
        `<stop offset="0%" stop-color="#06b6d4"/>` +
        `<stop offset="50%" stop-color="#ec4899"/>` +
        `<stop offset="100%" stop-color="#8b5cf6"/>` +
      `</linearGradient>` +
      `<filter id="tw-blur"><feGaussianBlur stdDeviation="8"/></filter>` +
    `</defs>`,
    `<rect x="${w * 0.15}" y="${h + 10}" width="${w * 0.7}" height="30" rx="15" fill="url(#tw-beam)" opacity="0.6" filter="url(#tw-blur)"/>`,
    `<rect x="${w * 0.2}" y="${h + 20}" width="${w * 0.6}" height="20" rx="10" fill="url(#tw-beam)" opacity="0.3" filter="url(#tw-blur)"/>`,
  ],
};

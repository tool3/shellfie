import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;
const lineColor = '#272727';

export const tailwind: Preset = {
  title: 'tailwind',
  template: createTemplate('tailwind', {
    titleBar: true,
    titleBarHeight: 34,
    borderRadius: 8,
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
    padding: 12,
    shadow: false,
    border: '1px solid #2a2a2a',
    header: { border: '1px solid #222222' },
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'tailwind',
    background: 'transparent',
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
    pattern: { type: 'grid', color: '#171f33', size: 50 },
  },
  overlays: (w, h) => {
    const bx = w - pad;
    const by = h - pad;
    return [
      // Grid lines at terminal boundary using filled rects
      `<path d="M 0 ${pad} L ${w} ${pad} L ${w} ${pad + 1} L 0 ${pad + 1} Z M 0 ${by} L ${w} ${by} L ${w} ${by + 1} L 0 ${by + 1} Z M ${pad} 0 L ${pad + 1} 0 L ${pad + 1} ${h} L ${pad} ${h} Z M ${bx} 0 L ${bx + 1} 0 L ${bx + 1} ${h} L ${bx} ${h} Z" fill="${lineColor}" fill-rule="nonzero" shape-rendering="crispEdges"/>`,
      // Blurred gradient beams at bottom
      `<defs>` +
        `<linearGradient id="tw-beam" x1="0%" y1="0%" x2="100%" y2="0%">` +
          `<stop offset="0%" stop-color="#06b6d4"/>` +
          `<stop offset="50%" stop-color="#ec4899"/>` +
          `<stop offset="100%" stop-color="#8b5cf6"/>` +
        `</linearGradient>` +
        `<filter id="tw-blur"><feGaussianBlur stdDeviation="8"/></filter>` +
      `</defs>`,
      `<rect x="${w * 0.15}" y="${h - 15}" width="${w * 0.7}" height="30" rx="15" fill="url(#tw-beam)" opacity="0.6" filter="url(#tw-blur)"/>`,
      `<rect x="${w * 0.2}" y="${h - 5}" width="${w * 0.6}" height="20" rx="10" fill="url(#tw-beam)" opacity="0.3" filter="url(#tw-blur)"/>`,
    ];
  },
};

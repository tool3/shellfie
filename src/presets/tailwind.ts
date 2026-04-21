import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;
const outerBg = '#0f172a';
const termBg = '#1e293b';
const gridColor = '#1e293b';
const controlColor = '#475569';

export const tailwind: Preset = {
  title: '',
  template: createTemplate('tailwind', {
    titleBar: true,
    titleBarHeight: 34,
    borderRadius: 8,
    controls: true,
    controlsPosition: 'left',
    controlStyle: {
      close: controlColor,
      minimize: controlColor,
      maximize: controlColor,
      radius: 4,
      spacing: 16,
      size: 8,
    },
    padding: 12,
    shadow: false,
    border: '1px solid #ffffff1a',
    header: { border: '1px solid #ffffff14' },
  }),
  fontFamily: "'Fira Code', monospace",
  theme: {
    name: 'tailwind',
    background: termBg,
    foreground: '#d1d5db',
    cursor: '#f1f5f9',
    selection: '#334155',
    black: '#1e293b',
    red: '#f472b6',
    green: '#7dd3fc',
    yellow: '#c4b5fd',
    blue: '#99f6e4',
    magenta: '#f472b6',
    cyan: '#9ca3af',
    white: '#d1d5db',
    brightBlack: '#64748b',
    brightRed: '#f472b6',
    brightGreen: '#7dd3fc',
    brightYellow: '#c4b5fd',
    brightBlue: '#99f6e4',
    brightMagenta: '#f472b6',
    brightCyan: '#7dd3fc',
    brightWhite: '#f1f5f9',
  },
  lineNumbers: true,
  background: {
    color: outerBg,
    padding: pad,
  },
  overlays: (w, h) => {
    const bx = w - pad;
    const by = h - pad;
    const termW = w - pad * 2;

    // Beams: cyan -> pink gradient, positioned just below terminal window
    const beamW = termW * 0.8;
    const beamX = (w - beamW) / 2;
    const beamY = by + 22;

    // Grid lines covering the padding area, masked so they fade at outer edges
    const gridStep = 50;
    const gridLines: string[] = [];
    for (let x = pad + gridStep; x < bx; x += gridStep) {
      gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${pad}" stroke="${gridColor}" stroke-width="1"/>`);
      gridLines.push(`<line x1="${x}" y1="${by}" x2="${x}" y2="${h}" stroke="${gridColor}" stroke-width="1"/>`);
    }
    for (let y = pad + gridStep; y < by; y += gridStep) {
      gridLines.push(`<line x1="0" y1="${y}" x2="${pad}" y2="${y}" stroke="${gridColor}" stroke-width="1"/>`);
      gridLines.push(`<line x1="${bx}" y1="${y}" x2="${w}" y2="${y}" stroke="${gridColor}" stroke-width="1"/>`);
    }

    return [
      `<defs>` +
        `<linearGradient id="tw-beam" x1="0%" y1="0%" x2="100%" y2="0%">` +
          `<stop offset="0%" stop-color="#0ea5e9" stop-opacity="0"/>` +
          `<stop offset="32.29%" stop-color="#0ea5e9" stop-opacity="1"/>` +
          `<stop offset="67.19%" stop-color="#ec4899" stop-opacity="0.3"/>` +
          `<stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>` +
        `</linearGradient>` +
        `<filter id="tw-blur-hi" x="-5%" y="-1000%" width="110%" height="2100%"><feGaussianBlur stdDeviation="4"/></filter>` +
        `<filter id="tw-blur-lo" x="-5%" y="-1000%" width="110%" height="2100%"><feGaussianBlur stdDeviation="1"/></filter>` +
        `<linearGradient id="tw-mask-h" x1="0%" y1="0%" x2="100%" y2="0%">` +
          `<stop offset="0%" stop-color="#000000"/>` +
          `<stop offset="${(pad / w) * 100}%" stop-color="#ffffff"/>` +
          `<stop offset="${((w - pad) / w) * 100}%" stop-color="#ffffff"/>` +
          `<stop offset="100%" stop-color="#000000"/>` +
        `</linearGradient>` +
        `<linearGradient id="tw-mask-v" x1="0%" y1="0%" x2="0%" y2="100%">` +
          `<stop offset="0%" stop-color="#000000"/>` +
          `<stop offset="${(pad / h) * 100}%" stop-color="#ffffff"/>` +
          `<stop offset="${((h - pad) / h) * 100}%" stop-color="#ffffff"/>` +
          `<stop offset="100%" stop-color="#000000"/>` +
        `</linearGradient>` +
        `<mask id="tw-grid-mask">` +
          `<rect x="0" y="0" width="${w}" height="${pad}" fill="url(#tw-mask-h)"/>` +
          `<rect x="0" y="${by}" width="${w}" height="${pad}" fill="url(#tw-mask-h)"/>` +
          `<rect x="0" y="0" width="${pad}" height="${h}" fill="url(#tw-mask-v)"/>` +
          `<rect x="${bx}" y="0" width="${pad}" height="${h}" fill="url(#tw-mask-v)"/>` +
        `</mask>` +
      `</defs>`,
      // Fading grid lines in the padding area
      `<g mask="url(#tw-grid-mask)">${gridLines.join('')}</g>`,
      // Boundary lines extending outward from terminal corners (stays in padding zones)
      `<path d="` +
        `M 0 ${pad} L ${pad} ${pad} L ${pad} ${pad + 1} L 0 ${pad + 1} Z ` +
        `M ${bx} ${pad} L ${w} ${pad} L ${w} ${pad + 1} L ${bx} ${pad + 1} Z ` +
        `M 0 ${by} L ${pad} ${by} L ${pad} ${by + 1} L 0 ${by + 1} Z ` +
        `M ${bx} ${by} L ${w} ${by} L ${w} ${by + 1} L ${bx} ${by + 1} Z ` +
        `M ${pad} 0 L ${pad + 1} 0 L ${pad + 1} ${pad} L ${pad} ${pad} Z ` +
        `M ${pad} ${by} L ${pad + 1} ${by} L ${pad + 1} ${h} L ${pad} ${h} Z ` +
        `M ${bx} 0 L ${bx + 1} 0 L ${bx + 1} ${pad} L ${bx} ${pad} Z ` +
        `M ${bx} ${by} L ${bx + 1} ${by} L ${bx + 1} ${h} L ${bx} ${h} Z` +
      `" fill="${gridColor}" fill-rule="nonzero" shape-rendering="crispEdges"/>`,
      // Beams just below the terminal window
      `<rect x="${beamX}" y="${beamY}" width="${beamW}" height="2" fill="url(#tw-beam)" filter="url(#tw-blur-hi)"/>`,
      `<rect x="${beamX}" y="${beamY + 2}" width="${beamW}" height="2" fill="url(#tw-beam)" filter="url(#tw-blur-lo)"/>`,
    ];
  },
};

import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;
const plusSize = 12;
const plusColor = '#4d4d4d';
const lineColor = '#1a1a1a';

const plus = (cx: number, cy: number) =>
  `<g transform="translate(${cx + 0.5}, ${cy + 0.5})">` +
    `<line x1="0" y1="${-plusSize}" x2="0" y2="${plusSize}" stroke="${plusColor}" stroke-width="1"/>` +
    `<line x1="${-plusSize}" y1="0" x2="${plusSize}" y2="0" stroke="${plusColor}" stroke-width="1"/>` +
  `</g>`;

export const vercel: Preset = {
  template: createTemplate('vercel', {
    titleBar: false,
    borderRadius: 0,
    controls: false,
    padding: 16,
    shadow: false,
    border: false,
    borderColor: '#ffffff1a',
    borderWidth: 1,
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'vercel',
    background: 'transparent',
    foreground: '#ededed',
    cursor: '#ededed',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#dfa558',
    green: '#5ec073',
    yellow: '#ffffff',
    blue: '#cf72e5',
    magenta: '#f76e6e',
    cyan: '#6ab0f3',
    white: '#ededed',
    brightBlack: '#a1a1a1',
    brightRed: '#f9bf72',
    brightGreen: '#78da8d',
    brightYellow: '#ffffff',
    brightBlue: '#e98cff',
    brightMagenta: '#ff8888',
    brightCyan: '#6ab0f3',
    brightWhite: '#ffffff',
  },
  lineNumbers: true,
  background: {
    color: '#000000',
    padding: pad,
    borderRadius: 0,
  },
  overlays: (w, h) => {
    const bx = w - pad;
    const by = h - pad;
    // All lines as a single filled path — no stroke, no sub-pixel misalignment
    // 4 extending lines + 4 terminal border edges in one continuous path
    const p = `M 0 ${pad} L ${w} ${pad} L ${w} ${pad + 1} L 0 ${pad + 1} Z` +     // full top line
              `M 0 ${by} L ${w} ${by} L ${w} ${by + 1} L 0 ${by + 1} Z` +          // full bottom line
              `M ${pad} 0 L ${pad + 1} 0 L ${pad + 1} ${h} L ${pad} ${h} Z` +      // full left line
              `M ${bx} 0 L ${bx + 1} 0 L ${bx + 1} ${h} L ${bx} ${h} Z`;          // full right line
    return [
      `<path d="${p}" fill="${lineColor}" fill-rule="nonzero" shape-rendering="crispEdges"/>`,
      // Plus signs at corners
      plus(pad, pad),
      plus(bx, by),
    ];
  },
};

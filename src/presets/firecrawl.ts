import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;
const lineColor = '#222222';
const starColor = '#222222';

// 4-pointed star shape at a given center point
const star = (cx: number, cy: number, size: number = 8) => {
  const s = size;
  const inner = size * 0.3;
  return `<path d="M ${cx} ${cy - s} L ${cx + inner} ${cy - inner} L ${cx + s} ${cy} L ${cx + inner} ${cy + inner} L ${cx} ${cy + s} L ${cx - inner} ${cy + inner} L ${cx - s} ${cy} L ${cx - inner} ${cy - inner} Z" fill="${starColor}"/>`;
};

export const firecrawl: Preset = {
  template: createTemplate('firecrawl', {
    titleBar: false,
    borderRadius: 0,
    controls: false,
    padding: 16,
    shadow: false,
    border: false,
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'firecrawl',
    background: 'transparent',
    foreground: '#ffffff',
    cursor: '#ffffff',
    selection: '#3a3a3a',
    black: '#000000',
    red: '#e97317',
    green: '#e97317',
    yellow: '#ffffff',
    blue: '#e97317',
    magenta: '#a7a7a7',
    cyan: '#e97317',
    white: '#a7a7a7',
    brightBlack: '#666666',
    brightRed: '#ff8d37',
    brightGreen: '#ff8d37',
    brightYellow: '#ffffff',
    brightBlue: '#ff8d37',
    brightMagenta: '#c1c1c1',
    brightCyan: '#a7a7a7',
    brightWhite: '#c1c1c1',
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
    // 4 lines forming terminal boundary + 4 stars at corners (like vercel with stars)
    const lines = `M 0 ${pad} L ${w} ${pad} L ${w} ${pad + 1} L 0 ${pad + 1} Z` +
                  `M 0 ${by} L ${w} ${by} L ${w} ${by + 1} L 0 ${by + 1} Z` +
                  `M ${pad} 0 L ${pad + 1} 0 L ${pad + 1} ${h} L ${pad} ${h} Z` +
                  `M ${bx} 0 L ${bx + 1} 0 L ${bx + 1} ${h} L ${bx} ${h} Z`;
    return [
      `<path d="${lines}" fill="${lineColor}" fill-rule="nonzero" shape-rendering="crispEdges"/>`,
      // 4-pointed stars at each corner of the terminal
      star(pad + 0.5, pad + 0.5),
      star(bx + 0.5, pad + 0.5),
      star(pad + 0.5, by + 0.5),
      star(bx + 0.5, by + 0.5),
    ];
  },
};

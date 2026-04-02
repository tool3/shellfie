import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;
const gridColor = '#222222';
const gridSize = 60;

export const firecrawl: Preset = {
  template: createTemplate('firecrawl', {
    titleBar: false,
    borderRadius: 0,
    controls: false,
    padding: 16,
    shadow: false,
    border: '1px solid #222222',
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'firecrawl',
    background: 'transparent',
    foreground: '#ffffff',
    cursor: '#ffffff',
    selection: '#3a3a3a',
    black: '#1a1a1a',
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
    pattern: { type: 'grid', color: gridColor, size: gridSize },
  },
  overlays: (w, h) => {
    const diamonds: string[] = [];
    const diamondSize = 4;
    // Diamond shapes at grid intersections
    for (let x = 0; x <= w; x += gridSize) {
      for (let y = 0; y <= h; y += gridSize) {
        diamonds.push(
          `<polygon points="${x},${y - diamondSize} ${x + diamondSize},${y} ${x},${y + diamondSize} ${x - diamondSize},${y}" fill="${gridColor}" shape-rendering="crispEdges"/>`
        );
      }
    }
    return diamonds;
  },
};

import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;
const lineColor = '#1a1a1a';
const gridSpacing = 78;

export const browserbase: Preset = {
  title: 'browserbase',
  titleAlignment: 'center',
  template: createTemplate('browserbase', {
    titleBar: true,
    titleBarHeight: 30,
    borderRadius: 0,
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
    border: '2px solid #222222',
    header: { border: '1px solid #1a1a1a' },
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'browserbase',
    background: '#0f0f0f',
    foreground: '#FFFFFF',
    cursor: '#FFFFFF',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#FF6B35',
    green: '#FFB800',
    yellow: '#FF6B35',
    blue: '#FFFFFF',
    magenta: '#FF4500',
    cyan: '#FF6B35',
    white: '#D1D5DB',
    brightBlack: '#6B7280',
    brightRed: '#FF8B5E',
    brightGreen: '#FFD01E',
    brightYellow: '#FF8B5E',
    brightBlue: '#FFFFFF',
    brightMagenta: '#FF6720',
    brightCyan: '#FF6B35',
    brightWhite: '#FFFFFF',
  },
  lineNumbers: true,
  background: {
    color: '#080808',
    padding: pad,
    borderRadius: 0,
  },
  overlays: (w, h) => {
    // Vertical gridlines at regular intervals spanning full height
    const lines: string[] = [];
    for (let i = 0; i < 7; i++) {
      const x = pad + 26 + i * gridSpacing;
      if (x < w) {
        lines.push(`<rect x="${x}" y="0" width="2" height="${h}" fill="${lineColor}" shape-rendering="crispEdges"/>`);
      }
    }
    return lines;
  },
};

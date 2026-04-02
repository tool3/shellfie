import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;
const lineColor = '#1a1a1a';

export const browserbase: Preset = {
  title: 'browserbase',
  titleAlignment: 'left',
  template: createTemplate('browserbase', {
    titleBar: true,
    titleBarHeight: 30,
    borderRadius: 7,
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
    header: { border: '1px solid #1a1a1a' },
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'browserbase',
    background: 'transparent',
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
    pattern: { type: 'grid', color: '#121212', size: 50 },
  },
  overlays: (w, h) => {
    const lines: string[] = [];
    const spacing = 20;
    // Horizontal gridlines across the background area using filled rects
    for (let y = pad; y <= h - pad; y += spacing) {
      lines.push(`<rect x="${pad}" y="${y}" width="${w - pad * 2}" height="1" fill="${lineColor}" shape-rendering="crispEdges"/>`);
    }
    return lines;
  },
};

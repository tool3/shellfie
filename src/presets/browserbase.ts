import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 40;

export const browserbase: Preset = {
  template: createTemplate('browserbase', {
    titleBar: true,
    titleBarHeight: 30,
    borderRadius: 7,
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
    padding: 16,
    shadow: true,
    border: true,
    borderColor: '#ffffff1a',
    borderWidth: 2,
    header: { border: true, borderColor: '#ffffff1a', borderWidth: 1 },
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
    pattern: { type: 'grid', color: '#121212', size: 50 },
  },
  overlays: (w, h) => {
    const lines: string[] = [];
    const lineColor = '#101010';
    const spacing = 20;
    // Horizontal gridlines across the background area
    for (let y = pad; y <= h - pad; y += spacing) {
      lines.push(`<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="${lineColor}" stroke-width="1"/>`);
    }
    return lines;
  },
};

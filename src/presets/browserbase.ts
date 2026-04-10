import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;
const dashColor = '#252525';  // rgba(255,255,255,0.1) pre-blended on #0d0d0d
const dashWidth = 2;
const dashLength = 6;
const dashGap = 4;

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
      close: '#ffffff33',
      minimize: '#ffffff33',
      maximize: '#ffffff33',
      radius: 4,
      spacing: 16,
      size: 8,
    },
    padding: 16,
    shadow: false,
    border: '1px solid #222222',
    header: { border: '1px solid #1a1a1a' },
  }),
  fontFamily: "'Space Mono', monospace",
  theme: {
    name: 'browserbase',
    background: '#191919',
    foreground: '#FFFFFF',
    cursor: '#FFFFFF',
    selection: '#3a3a3a',
    black: '#191919',
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
    color: '#0d0d0d',
    padding: pad,
    borderRadius: 0,
  },
  overlays: (w, h) => {
    // 7 dashed vertical lines, evenly distributed across the SVG width
    // Centered: total span = 6 gaps * spacing, first line at center - 3*spacing
    const numLines = 7;
    const spacing = Math.round(w / (numLines + 1));
    const lines: string[] = [];

    for (let i = 1; i <= numLines; i++) {
      const x = Math.round(i * spacing);
      // Build dashed line as series of small rects
      for (let y = 0; y < h; y += dashLength + dashGap) {
        const segH = Math.min(dashLength, h - y);
        lines.push(`<rect x="${x}" y="${y}" width="${dashWidth}" height="${segH}" fill="${dashColor}" shape-rendering="crispEdges"/>`);
      }
    }

    return lines;
  },
};

import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;

export const prisma: Preset = {
  template: createTemplate('prisma', {
    titleBar: true,
    titleBarHeight: 40,
    borderRadius: 10,
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
    border: false,
    header: {
      border: '1px solid #141818',
      backgroundColor: '#090d15',
    },
  }),
  fontFamily: "'JetBrains Mono', monospace",
  titleAlignment: 'left',
  titleStyle: 'tab-underline',
  theme: {
    name: 'prisma',
    background: '#0b101a',
    foreground: '#ffffff',
    cursor: '#ffffff',
    selection: '#3a3a3a',
    blue: '#71E8DF',
    black: '#0b101a',
    red: '#71E8DF',
    green: '#71E8DF',
    yellow: '#71E8DF',
    magenta: '#71E8DF',
    cyan: '#7F9CF5',
    white: '#FFFFFF',
    brightBlack: '#718096',
    brightRed: '#8BFFF6',
    brightGreen: '#8BFFF6',
    brightYellow: '#8BFFF6',
    brightBlue: '#99B6FF',
    brightMagenta: '#8BFFF6',
    brightCyan: '#71E8DF',
    brightWhite: '#ffffff',
  },
  lineNumbers: true,
  background: {
    color: 'gradient(#0c1d26, #0a0c17:diagonal)',
    padding: pad,
    borderRadius: 0,
  },
  overlays: (w, h) => {
    const tx = pad;
    const ty = pad;
    const tw = w - pad * 2;
    const th = h - pad * 2;

    // Concentric gradient border rings (140deg, indigo to teal)
    const ring = (expand: number, radius: number, opacity: number) => {
      const id = `prisma-ring-${expand}`;
      const rx = tx - expand;
      const ry = ty - expand;
      const rw = tw + expand * 2;
      const rh = th + expand * 2;
      return `<defs><linearGradient id="${id}" x1="20%" y1="0%" x2="80%" y2="100%">` +
        `<stop offset="0%" stop-color="#3e4083"/>` +
        `<stop offset="100%" stop-color="#16544f"/>` +
      `</linearGradient></defs>` +
      `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="none" stroke="url(#${id})" stroke-width="1" rx="${radius}" ry="${radius}" opacity="${opacity}"/>`;
    };

    return [
      // Inner border — brightest
      ring(0, 10, 0.6),
      // Middle border
      ring(4, 13, 0.3),
      // Outer border — dimmest
      ring(8, 16, 0.15),
    ];
  },
};

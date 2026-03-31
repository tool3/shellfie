import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;
const lineColor = '#353535';
const dotColor = 'white';
const borderColor = '#414141';

export const elevenlabs: Preset = {
  template: createTemplate('elevenlabs', {
    titleBar: false,
    borderRadius: 24,
    controls: false,
    padding: 16,
    shadow: false,
    border: `1px solid ${borderColor}`,
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'elevenlabs',
    background: 'transparent',
    foreground: '#ffffff',
    cursor: '#ffffff',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#8F8FFF',
    green: '#a1ffe0',
    yellow: '#8F8FFF',
    blue: '#ff8080',
    magenta: '#fff9b2',
    cyan: '#8F8FFF',
    white: '#ffffff',
    brightBlack: '#a1a1a1',
    brightRed: '#ABABFF',
    brightGreen: '#bfffe9',
    brightYellow: '#ABABFF',
    brightBlue: '#FFA0A0',
    brightMagenta: '#FFFBCC',
    brightCyan: '#8F8FFF',
    brightWhite: '#ffffff',
  },
  lineNumbers: true,
  background: {
    color: '#111111',
    padding: pad,
    borderRadius: 0,
  },
  overlays: (w, h) => {
    const tx = pad;
    const ty = pad;
    const bx = w - pad;
    const by = h - pad;
    const tw = bx - tx;
    const th = by - ty;
    const cx = (tx + bx) / 2;
    const cy = (ty + by) / 2;
    const circleR = Math.max(tw, th) * 0.55;

    return [
      // Large decorative circle centered on terminal
      `<circle cx="${cx}" cy="${cy}" r="${circleR}" fill="none" stroke="${lineColor}" stroke-width="1"/>`,

      // 3 horizontal gridlines (full width, solid fill)
      `<rect x="0" y="${ty}" width="${w}" height="1" fill="${lineColor}" shape-rendering="crispEdges"/>`,
      `<rect x="0" y="${Math.round(cy)}" width="${w}" height="1" fill="${lineColor}" shape-rendering="crispEdges"/>`,
      `<rect x="0" y="${by}" width="${w}" height="1" fill="${lineColor}" shape-rendering="crispEdges"/>`,

      // 3 vertical gridlines (full height, solid fill)
      `<rect x="${tx}" y="0" width="1" height="${h}" fill="${lineColor}" shape-rendering="crispEdges"/>`,
      `<rect x="${Math.round(cx)}" y="0" width="1" height="${h}" fill="${lineColor}" shape-rendering="crispEdges"/>`,
      `<rect x="${bx}" y="0" width="1" height="${h}" fill="${lineColor}" shape-rendering="crispEdges"/>`,

      // Diagonal lines from corners of terminal to corners of SVG
      `<line x1="${tx}" y1="${ty}" x2="0" y2="0" stroke="${lineColor}" stroke-width="1"/>`,
      `<line x1="${bx}" y1="${ty}" x2="${w}" y2="0" stroke="${lineColor}" stroke-width="1"/>`,
      `<line x1="${tx}" y1="${by}" x2="0" y2="${h}" stroke="${lineColor}" stroke-width="1"/>`,
      `<line x1="${bx}" y1="${by}" x2="${w}" y2="${h}" stroke="${lineColor}" stroke-width="1"/>`,

      // 4 corner dots (white, 3x3, on top of everything)
      `<rect x="${tx - 1}" y="${ty - 1}" width="3" height="3" fill="${dotColor}"/>`,
      `<rect x="${bx - 1}" y="${ty - 1}" width="3" height="3" fill="${dotColor}"/>`,
      `<rect x="${tx - 1}" y="${by - 1}" width="3" height="3" fill="${dotColor}"/>`,
      `<rect x="${bx - 1}" y="${by - 1}" width="3" height="3" fill="${dotColor}"/>`,
    ];
  },
};

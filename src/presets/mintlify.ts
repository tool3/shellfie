import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;

export const mintlify: Preset = {
  title: 'mintlify',
  titleAlignment: 'left',
  titleStyle: 'tab-underline',
  template: createTemplate('mintlify', {
    titleBar: true,
    titleBarHeight: 40,
    borderRadius: 12,
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
    border: '1px solid #1a1a1a',
    header: { border: '1px solid #141818', backgroundColor: '#010201' },
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'mintlify',
    background: '#070a08',
    foreground: '#F3F7F6',
    cursor: '#F3F7F6',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#9cdcfe',
    green: '#F3F7F6',
    yellow: '#b5cea8',
    blue: '#9cdcfe',
    magenta: '#569cd6',
    cyan: '#4ec9b0',
    white: '#808080',
    brightBlack: '#707070',
    brightRed: '#b6f0ff',
    brightGreen: '#FFFFFF',
    brightYellow: '#cfe8c2',
    brightBlue: '#b6f0ff',
    brightMagenta: '#70b6f0',
    brightCyan: '#b5cea8',
    brightWhite: '#9a9a9a',
  },
  lineNumbers: true,
  background: {
    color: '#121212',
    padding: pad,
    pattern: { type: 'crosshatch', color: '#181818', size: 50 },
  },
  overlays: (w, h) => {
    const tx = pad;
    const ty = pad;
    const tw = w - pad * 2;
    const th = h - pad * 2;
    return [
      // Heavy layered shadow beneath terminal — using solid dark rects
      `<rect x="${tx + 4}" y="${ty + 8}" width="${tw}" height="${th}" rx="12" ry="12" fill="#050505" shape-rendering="crispEdges"/>`,
      `<rect x="${tx + 2}" y="${ty + 4}" width="${tw}" height="${th}" rx="12" ry="12" fill="#080808" shape-rendering="crispEdges"/>`,
    ];
  },
};

import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 40;

export const mintlify: Preset = {
  template: createTemplate('mintlify', {
    titleBar: true,
    titleBarHeight: 40,
    borderRadius: 12,
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
    borderWidth: 1,
    header: { border: true, borderColor: '#141818', borderWidth: 1, backgroundColor: '#010201' },
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
      // Heavy layered shadow on terminal
      `<defs><filter id="mintlify-shadow" x="-20%" y="-20%" width="140%" height="140%">` +
        `<feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="rgba(0,0,0,0.5)"/>` +
        `<feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>` +
        `<feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.2)"/>` +
      `</filter></defs>`,
      // Teal-tinted accent glow
      `<defs><radialGradient id="mintlify-glow">` +
        `<stop offset="0%" stop-color="#4EC9B0" stop-opacity="0.06"/>` +
        `<stop offset="100%" stop-color="#4EC9B0" stop-opacity="0"/>` +
      `</radialGradient></defs>`,
      `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" fill="url(#mintlify-glow)" rx="12" ry="12"/>`,
    ];
  },
};

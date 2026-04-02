import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 64;
const lineColor = '#1b1b1b';

export const triggerdev: Preset = {
  title: 'triggerdev',
  titleAlignment: 'left',
  badge: {
    color: '#878C99',
  },
  template: createTemplate('triggerdev', {
    titleBar: true,
    titleBarHeight: 40,
    borderRadius: 8,
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
    border: '1px solid #1e1e1e',
    header: { border: '1px solid #1e1e1e', backgroundColor: '#16181d' },
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'triggerdev',
    background: '#121317',
    foreground: '#CCCBFF',
    cursor: '#CCCBFF',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#CCCBFF',
    green: '#AFEC73',
    yellow: '#b5cea8',
    blue: '#9684FF',
    magenta: '#E888F8',
    cyan: '#9C9AF2',
    white: '#878C99',
    brightBlack: '#5F6570',
    brightRed: '#E6E5FF',
    brightGreen: '#C5F590',
    brightYellow: '#cfe8c2',
    brightBlue: '#B09EFF',
    brightMagenta: '#FFA2FF',
    brightCyan: '#CCCBFF',
    brightWhite: '#A1A6B3',
  },
  lineNumbers: true,
  background: {
    color: '#121317',
    padding: pad,
    pattern: { type: 'diagonal-stripes', color: '#181818', size: 8 },
  },
  overlays: (w, h) => {
    const bx = w - pad;
    const by = h - pad;
    return [
      // Grid lines at terminal boundary using filled path
      `<path d="M 0 ${pad} L ${w} ${pad} L ${w} ${pad + 1} L 0 ${pad + 1} Z M 0 ${by} L ${w} ${by} L ${w} ${by + 1} L 0 ${by + 1} Z M ${pad} 0 L ${pad + 1} 0 L ${pad + 1} ${h} L ${pad} ${h} Z M ${bx} 0 L ${bx + 1} 0 L ${bx + 1} ${h} L ${bx} ${h} Z" fill="${lineColor}" fill-rule="nonzero" shape-rendering="crispEdges"/>`,
    ];
  },
};

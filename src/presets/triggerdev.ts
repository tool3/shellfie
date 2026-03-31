import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 40;
const lineColor = '#1b1b1b';

export const triggerdev: Preset = {
  template: createTemplate('triggerdev', {
    titleBar: true,
    titleBarHeight: 40,
    borderRadius: 8,
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
    header: { border: true, borderColor: '#ffffff1a', borderWidth: 1, backgroundColor: '#16181d' },
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
  overlays: (w, h) => [
    // Grid lines at terminal boundary (segments outside terminal box)
    `<line x1="0" y1="${pad}" x2="${pad}" y2="${pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${w - pad}" y1="${pad}" x2="${w}" y2="${pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="0" y1="${h - pad}" x2="${pad}" y2="${h - pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${w - pad}" y1="${h - pad}" x2="${w}" y2="${h - pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${pad}" y1="0" x2="${pad}" y2="${pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${pad}" y1="${h - pad}" x2="${pad}" y2="${h}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${w - pad}" y1="0" x2="${w - pad}" y2="${pad}" stroke="${lineColor}" stroke-width="1"/>`,
    `<line x1="${w - pad}" y1="${h - pad}" x2="${w - pad}" y2="${h}" stroke="${lineColor}" stroke-width="1"/>`,
  ],
};

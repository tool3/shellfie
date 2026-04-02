import type { Preset } from '../types';
import { createTemplate } from '../templates';

export const clerk: Preset = {
  template: createTemplate('clerk', {
    titleBar: false,
    borderRadius: 5,
    controls: false,
    padding: 16,
    shadow: false,
    border: '1px solid #222222',
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'clerk',
    background: '#191919',
    foreground: '#ffffff',
    cursor: '#ffffff',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#86ef9b',
    green: '#5de3ff',
    yellow: '#86ef9b',
    blue: '#bab1ff',
    magenta: '#bab1ff',
    cyan: '#86ef9b',
    white: '#b7b8c2',
    brightBlack: '#9394a1',
    brightRed: '#a0ffb5',
    brightGreen: '#7debff',
    brightYellow: '#a0ffb5',
    brightBlue: '#d4cdff',
    brightMagenta: '#d4cdff',
    brightCyan: '#86ef9b',
    brightWhite: '#d1d2da',
  },
  lineNumbers: true,
  background: {
    color: '#0d0d0d',
    padding: 40,
    pattern: { type: 'dots', color: '#161616', size: 16 },
  },
};

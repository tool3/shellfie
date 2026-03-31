import type { Preset } from '../types';
import { createTemplate } from '../templates';

export const openai: Preset = {
  template: createTemplate('openai', {
    titleBar: false,
    borderRadius: 8,
    controls: false,
    padding: 16,
    shadow: true,
    border: true,
    borderColor: '#ffffff1a',
    borderWidth: 1,
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'openai',
    background: '#191919',
    foreground: '#ffffff',
    cursor: '#ffffff',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#ffffff',
    green: '#ffffff',
    yellow: '#e9950c',
    blue: '#00A67D',
    magenta: '#2E95D3',
    cyan: '#df3079',
    white: '#ffffff',
    brightBlack: '#999999',
    brightRed: '#ffffff',
    brightGreen: '#ffffff',
    brightYellow: '#ffaf2c',
    brightBlue: '#1AC097',
    brightMagenta: '#48AFED',
    brightCyan: '#F22C3D',
    brightWhite: '#ffffff',
  },
  lineNumbers: true,
  background: {
    color: '#0d0d0d',
    padding: 40,
  },
};

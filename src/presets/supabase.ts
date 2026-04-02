import type { Preset } from '../types';
import { createTemplate } from '../templates';

export const supabase: Preset = {
  template: createTemplate('supabase', {
    titleBar: false,
    borderRadius: 6,
    controls: false,
    padding: 16,
    shadow: false,
    border: '1px solid #222222',
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'supabase',
    background: '#191919',
    foreground: '#ffffff',
    cursor: '#ffffff',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#ffffff',
    green: '#ffcda1',
    yellow: '#ededed',
    blue: '#3ecf8e',
    magenta: '#bda4ff',
    cyan: '#3ecf8e',
    white: '#ffffff',
    brightBlack: '#7e7e7e',
    brightRed: '#ffffff',
    brightGreen: '#ffe7c1',
    brightYellow: '#ffffff',
    brightBlue: '#58e9a8',
    brightMagenta: '#d7beff',
    brightCyan: '#3ecf8e',
    brightWhite: '#ffffff',
  },
  lineNumbers: true,
  background: {
    color: '#0d0d0d',
    padding: 40,
  },
};

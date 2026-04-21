import type { Preset } from '../types';
import { createTemplate } from '../templates';

const pad = 40;
const lineColor = '#262626';

export const cloudflare: Preset = {
  title: 'cloudflare',
  titleAlignment: 'left',
  badge: {
    color: 'gray'
  },
  template: createTemplate('cloudflare', {
    titleBar: true,
    titleBarHeight: 40,
    borderRadius: 0,
    controls: false,
    controlsPosition: 'left',
    padding: 16,
    shadow: false,
    border: `1px solid ${lineColor}`,
    header: {
      height: 30,
      border: '1px solid #262626',
      backgroundColor: '#0f0f0f'
    },
  }),
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    name: 'cloudflare',
    background: 'transparent',
    foreground: '#E8E8E8',
    cursor: '#E8E8E8',
    selection: '#3a3a3a',
    black: '#1a1a1a',
    red: '#FFB366',
    green: '#0A95FF',
    yellow: '#79b8ff',
    blue: '#B084FF',
    magenta: '#FF7F4D',
    cyan: '#79b8ff',
    white: '#AAAAAA',
    brightBlack: '#888888',
    brightRed: '#FFD08A',
    brightGreen: '#3AAFFF',
    brightYellow: '#99CDFF',
    brightBlue: '#CCA4FF',
    brightMagenta: '#FF9F7D',
    brightCyan: '#79b8ff',
    brightWhite: '#CCCCCC',
  },
  lineNumbers: true,
  background: {
    color: '#0c0c0c',
    padding: pad,
    borderRadius: 0,
  },
  overlays: (w, h) => {
    const bx = w - pad;
    const by = h - pad;
    return [
      `<path d="M 0 ${pad} L ${w} ${pad} L ${w} ${pad + 1} L 0 ${pad + 1} Z M 0 ${by} L ${w} ${by} L ${w} ${by + 1} L 0 ${by + 1} Z M ${pad} 0 L ${pad + 1} 0 L ${pad + 1} ${h} L ${pad} ${h} Z M ${bx} 0 L ${bx + 1} 0 L ${bx + 1} ${h} L ${bx} ${h} Z" fill="${lineColor}" fill-rule="nonzero" shape-rendering="crispEdges"/>`,
    ];
  },
};

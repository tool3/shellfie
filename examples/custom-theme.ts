/**
 * Custom theme example
 *
 * Run: npx tsx examples/custom-theme.ts
 */

import { shellfie } from '../src';
import { writeFileSync } from 'node:fs';

const terminalOutput = `\x1b[1;32m❯\x1b[0m ls -la
\x1b[1;34mdrwxr-xr-x\x1b[0m  12 user  staff   384 Jan 15 10:30 \x1b[1;34m.\x1b[0m
\x1b[1;34mdrwxr-xr-x\x1b[0m   8 user  staff   256 Jan 14 09:15 \x1b[1;34m..\x1b[0m
-rw-r--r--   1 user  staff  1420 Jan 15 10:30 \x1b[32mpackage.json\x1b[0m
-rw-r--r--   1 user  staff   380 Jan 15 10:25 \x1b[32mtsconfig.json\x1b[0m
\x1b[1;34mdrwxr-xr-x\x1b[0m   6 user  staff   192 Jan 15 10:28 \x1b[1;34msrc\x1b[0m
\x1b[1;36mlrwxr-xr-x\x1b[0m   1 user  staff    12 Jan 14 15:00 \x1b[1;36mlink\x1b[0m -> \x1b[32mtarget\x1b[0m
-rwxr-xr-x   1 user  staff  8192 Jan 15 10:20 \x1b[1;31mexecutable\x1b[0m`;

const oceanTheme = {
  name: 'ocean',
  background: '#0a2540',
  foreground: '#e6f1ff',
  cursor: '#ffffff',
  selection: '#1e4976',
  black: '#0a2540',
  red: '#ff6b6b',
  green: '#69db7c',
  yellow: '#ffd43b',
  blue: '#4dabf7',
  magenta: '#da77f2',
  cyan: '#66d9e8',
  white: '#e6f1ff',
  brightBlack: '#495057',
  brightRed: '#ff8787',
  brightGreen: '#8ce99a',
  brightYellow: '#ffe066',
  brightBlue: '#74c0fc',
  brightMagenta: '#e599f7',
  brightCyan: '#99e9f2',
  brightWhite: '#ffffff',
};

const svg = shellfie(terminalOutput, {
  template: 'macos',
  title: 'Custom Theme',
  theme: oceanTheme,
});

writeFileSync('examples/svgs/custom-theme.svg', svg);
console.log('✓ Created examples/svgs/custom-theme.svg');


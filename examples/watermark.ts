/**
 * watermark example
 *
 * Run: npx ts-node examples/watermark.ts
 */

import shellfie, { themes } from '../src';
import { writeFileSync } from 'node:fs';

const terminalOutput = `
DESERVES_RAISE=1

while (DESERVE_RAISE):
    raise_paycheck(tool3, 1000000)
`;


const svg = shellfie(terminalOutput, {
  template: 'macos',
  theme: themes.tokyoNight,
  watermark: {
    content: '\x1b[7;32mpowered by shellfie',
    type: 'text',
    style: {
        outline: '1px solid white',
    }
  }
});

writeFileSync('examples/svgs/watermark.svg', svg);
console.log('✓ Created examples/svgs/watermark.svg');
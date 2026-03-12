/**
 * markup-watermark example
 *
 * Run: npx ts-node examples/markup-watermark.ts
 */

import shellfie, { themes } from '../src';
import { writeFileSync } from 'node:fs';

const terminalOutput = `
const cool: boolean = true;

if (cool) {
    starShellfieOnGitub(10000);
}
`;

const badgeMarkup = `
<a href="https://github.com/tool3/shellfie">
  <g transform="translate(-90, -5)">
    <defs>
      <clipPath id="wm-clip">
        <rect width="100" height="15" rx="3" fill="#fff"/>
      </clipPath>
    </defs>
    <g clip-path="url(#wm-clip)">
      <rect width="60" height="15" fill="#555"/>
      <rect x="60" width="40" height="15" fill="pink"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="110">
      <text x="385" y="130" transform="scale(.08)" fill="#fff" textLength="650">powered by</text>
      <text x="985" y="130" transform="scale(.08)" fill="#333" textLength="390">shellfie</text>
    </g>
  </g>
</a>
`;

const svg = shellfie(terminalOutput, {
  template: 'macos',
  theme: themes.draculaPro,
  watermark: {
    content: badgeMarkup,
    // type auto-detected as 'markup' since content starts with '<'
  }
});

writeFileSync('examples/svgs/markup-watermark.svg', svg);
console.log('✓ Created examples/svgs/markup-watermark.svg');
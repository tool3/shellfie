/**
 * Color support demo
 *
 * Run: npx tsx examples/colors.ts
 */

import shellfie from '../src';
import { writeFileSync } from 'node:fs';

const colorDemo = `\x1b[1m256 Color Palette Sample:\x1b[0m
\x1b[38;5;196m■■\x1b[0m\x1b[38;5;202m■■\x1b[0m\x1b[38;5;208m■■\x1b[0m\x1b[38;5;214m■■\x1b[0m\x1b[38;5;220m■■\x1b[0m\x1b[38;5;226m■■\x1b[0m\x1b[38;5;190m■■\x1b[0m\x1b[38;5;154m■■\x1b[0m\x1b[38;5;118m■■\x1b[0m\x1b[38;5;82m■■\x1b[0m\x1b[38;5;46m■■\x1b[0m\x1b[38;5;47m■■\x1b[0m\x1b[38;5;48m■■\x1b[0m\x1b[38;5;49m■■\x1b[0m\x1b[38;5;50m■■\x1b[0m\x1b[38;5;51m■■\x1b[0m

\x1b[1m24-bit RGB Gradient:\x1b[0m
\x1b[38;2;255;0;0m■\x1b[0m\x1b[38;2;255;51;0m■\x1b[0m\x1b[38;2;255;102;0m■\x1b[0m\x1b[38;2;255;153;0m■\x1b[0m\x1b[38;2;255;204;0m■\x1b[0m\x1b[38;2;255;255;0m■\x1b[0m\x1b[38;2;204;255;0m■\x1b[0m\x1b[38;2;153;255;0m■\x1b[0m\x1b[38;2;102;255;0m■\x1b[0m\x1b[38;2;51;255;0m■\x1b[0m\x1b[38;2;0;255;0m■\x1b[0m\x1b[38;2;0;255;51m■\x1b[0m\x1b[38;2;0;255;102m■\x1b[0m\x1b[38;2;0;255;153m■\x1b[0m\x1b[38;2;0;255;204m■\x1b[0m\x1b[38;2;0;255;255m■\x1b[0m

\x1b[1mText Styles:\x1b[0m
\x1b[1mBold\x1b[0m  \x1b[3mItalic\x1b[0m  \x1b[4mUnderline\x1b[0m  \x1b[9mStrikethrough\x1b[0m  \x1b[2mDim\x1b[0m  \x1b[7mInverse\x1b[0m`;

const svg = shellfie(colorDemo, {
  template: 'macos',
  title: 'Color Support Demo',
  watermark: 'Full \x1b[38;5;200mANSI\x1b[0m color support',
});

writeFileSync('examples/svgs/colors.svg', svg);
console.log('✓ Created examples/svgs/colors.svg');


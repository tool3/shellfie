/**
 * npm output example
 *
 * Run: npx ts-node examples/npm.ts
 */

import { snaptty } from '../src';
import { writeFileSync } from 'node:fs';

const npmOutput = `\x1b[32mnpm\x1b[0m \x1b[36minfo\x1b[0m using npm@10.2.0
\x1b[32mnpm\x1b[0m \x1b[36minfo\x1b[0m using node@v20.10.0
\x1b[32mnpm\x1b[0m \x1b[33mWARN\x1b[0m deprecated inflight@1.0.6: This module is not supported
\x1b[32mnpm\x1b[0m \x1b[33mWARN\x1b[0m deprecated glob@7.2.3: Glob versions prior to v9 are deprecated

added \x1b[1;32m127\x1b[0m packages in \x1b[1m2s\x1b[0m

\x1b[1;32m42\x1b[0m packages are looking for funding
run \x1b[36mnpm fund\x1b[0m for details`;

const svg = snaptty(npmOutput, {
  template: 'macos',
  title: 'npm install',
});

writeFileSync('examples/npm.svg', svg);
console.log('✓ Created examples/npm.svg');


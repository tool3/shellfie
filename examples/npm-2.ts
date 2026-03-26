/**
 * npm output example
 *
 * Run: npx ts-node examples/npm.ts
 */

import shellfie from '../src';
import { writeFileSync } from 'node:fs';

const npmOutput = `
$ npm install shellfie
added 1 package in 0.5s

$ shellfie --version
shellfie v1.0.0
`

const svg = shellfie(npmOutput, {
  template: 'macos',
  title: 'npm install',
});

writeFileSync('examples/svgs/npm-2.svg', svg);
console.log('✓ Created examples/svgs/npm-2.svg');

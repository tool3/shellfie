/**
 * Git diff example
 *
 * Run: npx tsx examples/git-diff.ts
 */

import shellfie from '../src';
import { writeFileSync } from 'node:fs';

const gitDiffOutput = `\x1b[1mdiff --git a/src/index.ts b/src/index.ts\x1b[0m
\x1b[1mindex abc1234..def5678 100644\x1b[0m
\x1b[1m--- a/src/index.ts\x1b[0m
\x1b[1m+++ b/src/index.ts\x1b[0m
\x1b[36m@@ -10,7 +10,8 @@\x1b[0m export function shellfie(input: string) {
   const lines = parseAnsi(input);
\x1b[31m-  const options = defaultOptions;\x1b[0m
\x1b[32m+  const options = resolveOptions(userOptions);\x1b[0m
\x1b[32m+  const template = getTemplate(options.template);\x1b[0m
  return renderSvg(lines, options);
 }`;

const svg = shellfie(gitDiffOutput, {
  template: 'macos',
  title: 'git diff',
});

writeFileSync('examples/svgs/git-diff.svg', svg);
console.log('✓ Created examples/svgs/git-diff.svg');


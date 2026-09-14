import { writeFileSync } from 'node:fs';

const marker = (dir, type) =>
  writeFileSync(new URL(`../dist/${dir}/package.json`, import.meta.url), `${JSON.stringify({ type }, null, 2)}\n`);

marker('esm', 'module');
marker('cjs', 'commonjs');

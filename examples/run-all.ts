import { readdirSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const examplesDir = dirname(resolve(process.argv[1]));
const projectRoot = resolve(examplesDir, '..');
const excluded = new Set(['run-all.ts', 'examples.ts']);

const collect = (dir: string): string[] =>
  [...readdirSync(dir, { withFileTypes: true })]
    .sort((a, b) => Number(a.isDirectory()) - Number(b.isDirectory()) || a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === 'svgs' ? [] : collect(path);
      return entry.name.endsWith('.ts') && !excluded.has(relative(examplesDir, path)) ? [path] : [];
    });

const files = collect(examplesDir);

const outputDirs = new Set([
  join(examplesDir, 'svgs'),
  ...files
    .map((file) => relative(examplesDir, dirname(file)))
    .filter((dir) => dir !== '')
    .map((dir) => join(examplesDir, 'svgs', dir)),
]);

type Result = { file: string; error: unknown };

const run = (file: string): Promise<Result> =>
  import(pathToFileURL(file).href)
    .then(
      () => ({ file, error: null as unknown }),
      (error: unknown) => ({ file, error })
    );

const runAll = (queue: string[]): Promise<Result[]> =>
  queue.reduce(
    (chain, file) => chain.then((done) => run(file).then((result) => [...done, result])),
    Promise.resolve([] as Result[])
  );

const report = (results: Result[]) => {
  const failures = results.filter(({ error }) => error !== null);

  console.log(`\nRan ${results.length} examples, ${failures.length} failed.`);

  failures.forEach(({ file, error }) =>
    console.error(`✗ ${relative(projectRoot, file)}: ${error instanceof Error ? error.message : String(error)}`)
  );

  if (failures.length === 0) console.log('All examples generated! see examples/svgs for output.');

  process.exit(failures.length === 0 ? 0 : 1);
};

process.chdir(projectRoot);
outputDirs.forEach((dir) => mkdirSync(dir, { recursive: true }));
runAll(files).then(report);

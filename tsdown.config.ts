import { defineConfig } from 'tsdown';
import { fileURLToPath } from 'node:url';

const browserFonts = fileURLToPath(new URL('src/fonts/system.browser.ts', import.meta.url));

const shared = {
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
} as const;

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    platform: 'node',
    dts: true,
    outExtensions: ({ format }) => ({
      js: format === 'es' ? '.js' : '.cjs',
      dts: format === 'es' ? '.d.ts' : '.d.cts',
    }),
  },
  {
    ...shared,
    clean: false,
    entry: { 'index.browser': 'src/index.ts' },
    format: ['esm'],
    platform: 'browser',
    dts: false,
    alias: { './system': browserFonts },
    outExtensions: () => ({ js: '.js' }),
  },
]);

/**
 * Builds the publishable `dist` directory.
 *
 * Source remains readable CommonJS. Esbuild converts explicit entry modules into
 * genuine browser-compatible ESM instead of relying on Node's `createRequire`.
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

// Always rebuild from scratch so stale files cannot leak into npm packages.
await rm('dist', { recursive: true, force: true });
await mkdir('dist/cjs', { recursive: true });
await cp('src', 'dist/cjs', { recursive: true });
await writeFile('dist/cjs/package.json', '{"type":"commonjs"}\n');
await writeFile(
  'dist/index.cjs',
  "module.exports = require('./cjs/index.js');\n"
);
await writeFile(
  'dist/react.cjs',
  "module.exports = require('./cjs/react.js');\n"
);
await writeFile(
  'dist/zod.cjs',
  "module.exports = { zodValidator: require('./cjs/adapters.js').zodValidator };\n"
);
await writeFile(
  'dist/valibot.cjs',
  "module.exports = { valibotValidator: require('./cjs/adapters.js').valibotValidator };\n"
);
await writeFile('dist/package.json', '{"type":"module"}\n');

const esmBuilds = [
  ['scripts/entries/index.mjs', 'dist/index.js', []],
  ['scripts/entries/react.mjs', 'dist/react.js', ['react']],
  ['scripts/entries/zod.mjs', 'dist/zod.js', []],
  ['scripts/entries/valibot.mjs', 'dist/valibot.js', []]
];

await Promise.all(esmBuilds.map(([entryPoint, outfile, external]) => build({
  entryPoints: [entryPoint],
  outfile,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  external,
  legalComments: 'none',
  sourcemap: false
})));

for (const declaration of ['index.d.ts', 'react.d.ts', 'zod.d.ts', 'valibot.d.ts']) {
  await cp(`types/${declaration}`, `dist/${declaration}`);
}

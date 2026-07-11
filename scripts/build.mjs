/**
 * Builds the publishable `dist` directory.
 *
 * Source remains readable CommonJS; small wrappers provide package-level ESM,
 * CommonJS, React, Zod, and Valibot entry points without a bundler dependency.
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

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

const names = [
  'Mapper', 'normalize', 'normalizeFlat', 'coerceType', 'denormalize', 'denormalizeDirect',
  'denormalizeFlat', 'denormalizeForPost', 'denormalizeForPatch', 'diff', 'getChangedPaths',
  'hasChanges', 'isEqual', 'buildPatchPayload', 'buildPostPayload', 'buildPutPayload',
  'buildPartialPayload', 'createPayloadBuilder', 'MapperError', 'MapperConfigurationError',
  'MapperValidationError', 'MapperTransformError', 'schemaValidator', 'zodValidator',
  'valibotValidator', 'utils', 'version'
];

// The ESM entry re-exports the exact same runtime objects as CommonJS.
await writeFile('dist/index.js', [
  "import { createRequire } from 'node:module';",
  'const require = createRequire(import.meta.url);',
  "const api = require('./index.cjs');",
  'export default api;',
  `export const { ${names.join(', ')} } = api;`,
  ''
].join('\n'));

function esmSubpath(cjsFile, exportedName) {
  return [
    "import { createRequire } from 'node:module';",
    'const require = createRequire(import.meta.url);',
    `export const { ${exportedName} } = require('./${cjsFile}');`,
    ''
  ].join('\n');
}

await writeFile('dist/react.js', esmSubpath('react.cjs', 'useMappedForm'));
await writeFile('dist/zod.js', esmSubpath('zod.cjs', 'zodValidator'));
await writeFile('dist/valibot.js', esmSubpath('valibot.cjs', 'valibotValidator'));

for (const declaration of ['index.d.ts', 'react.d.ts', 'zod.d.ts', 'valibot.d.ts']) {
  await cp(`types/${declaration}`, `dist/${declaration}`);
}

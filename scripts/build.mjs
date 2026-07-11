import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/cjs', { recursive: true });
await cp('src', 'dist/cjs', { recursive: true });
await writeFile('dist/cjs/package.json', '{"type":"commonjs"}\n');
await writeFile('dist/index.cjs', "module.exports = require('./cjs/index.js');\n");
await writeFile('dist/react.cjs', "module.exports = require('./cjs/react.js');\n");
await writeFile('dist/zod.cjs', "module.exports = { zodValidator: require('./cjs/adapters.js').zodValidator };\n");
await writeFile('dist/valibot.cjs', "module.exports = { valibotValidator: require('./cjs/adapters.js').valibotValidator };\n");
await writeFile('dist/package.json', '{"type":"module"}\n');

const names = [
  'Mapper', 'normalize', 'normalizeFlat', 'coerceType', 'denormalize', 'denormalizeDirect',
  'denormalizeFlat', 'denormalizeForPost', 'denormalizeForPatch', 'diff', 'getChangedPaths',
  'hasChanges', 'isEqual', 'buildPatchPayload', 'buildPostPayload', 'buildPutPayload',
  'buildPartialPayload', 'createPayloadBuilder', 'MapperError', 'MapperConfigurationError',
  'MapperValidationError', 'MapperTransformError', 'schemaValidator', 'zodValidator',
  'valibotValidator', 'utils', 'version'
];
await writeFile('dist/index.js', [
  "import { createRequire } from 'node:module';",
  'const require = createRequire(import.meta.url);',
  "const api = require('./index.cjs');",
  'export default api;',
  `export const { ${names.join(', ')} } = api;`,
  ''
].join('\n'));
await writeFile('dist/react.js', "import { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);\nexport const { useMappedForm } = require('./react.cjs');\n");
await writeFile('dist/zod.js', "import { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);\nexport const { zodValidator } = require('./zod.cjs');\n");
await writeFile('dist/valibot.js', "import { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);\nexport const { valibotValidator } = require('./valibot.cjs');\n");
for (const declaration of ['index.d.ts', 'react.d.ts', 'zod.d.ts', 'valibot.d.ts']) {
  await cp(declaration, `dist/${declaration}`);
}

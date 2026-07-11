/**
 * Verifies the actual npm tarball in a clean temporary project.
 *
 * Source-level tests cannot catch missing exports or declarations, so this script
 * installs the packed artifact and executes both CommonJS and ESM consumers.
 */
'use strict';

const { execFileSync } = require('node:child_process');
const {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { buildSync } = require('esbuild');

const root = resolve(__dirname, '..');
const temp = mkdtempSync(join(tmpdir(), 'api-schema-mapper-'));
const env = { ...process.env, npm_config_cache: join(temp, '.npm-cache') };
let tarball;

try {
  const output = execFileSync('npm', ['pack', '--json'], {
    cwd: root,
    encoding: 'utf8',
    env
  });
  const filename = JSON.parse(output)[0].filename;
  tarball = join(root, filename);

  execFileSync('npm', ['init', '-y'], { cwd: temp, stdio: 'ignore', env });
  execFileSync(
    'npm',
    ['install', '--ignore-scripts', '--offline', tarball],
    { cwd: temp, stdio: 'ignore', env }
  );

  writeFileSync(join(temp, 'common.cjs'), `
const Mapper = require('api-schema-mapper');
const mapper = new Mapper({
  fields: { name: { from: 'user_name', to: 'displayName' } }
});
const payload = mapper.denormalize(mapper.normalize({ user_name: 'Ada' }));
if (payload.displayName !== 'Ada') process.exit(1);
`);
  writeFileSync(join(temp, 'module.mjs'), `
import Mapper, { Mapper as NamedMapper } from 'api-schema-mapper';
if (Mapper !== NamedMapper) process.exit(1);
const mapper = new Mapper({ apiToForm: { user_name: 'name' } });
if (mapper.normalize({ user_name: 'Ada' }).name !== 'Ada') process.exit(1);
`);
  writeFileSync(join(temp, 'browser-core.js'), `
import Mapper from 'api-schema-mapper';
window.mapper = new Mapper({ apiToForm: { user_name: 'name' } });
`);
  writeFileSync(join(temp, 'browser-react.js'), `
import { useMappedForm } from 'api-schema-mapper/react';
window.useMappedForm = useMappedForm;
`);

  execFileSync(process.execPath, ['common.cjs'], { cwd: temp, stdio: 'inherit' });
  execFileSync(process.execPath, ['module.mjs'], { cwd: temp, stdio: 'inherit' });

  for (const entry of ['browser-core.js', 'browser-react.js']) {
    buildSync({
      absWorkingDir: temp,
      entryPoints: [entry],
      outfile: join(temp, `${entry}.bundle.js`),
      bundle: true,
      platform: 'browser',
      external: ['react'],
      logLevel: 'silent'
    });
  }

  const packageRoot = join(temp, 'node_modules', 'api-schema-mapper', 'dist');
  for (const output of ['index.js', 'react.js', 'zod.js', 'valibot.js']) {
    const source = readFileSync(join(packageRoot, output), 'utf8');
    if (/from ["']node:|require\(["']node:/.test(source)) {
      throw new Error(`${output} contains a browser-incompatible node: import`);
    }
  }

  process.stdout.write(
    'Packed CommonJS, Node ESM, core browser, and React browser smoke tests passed.\n'
  );
} finally {
  if (tarball && existsSync(tarball)) rmSync(tarball);
  rmSync(temp, { recursive: true, force: true });
}

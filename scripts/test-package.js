'use strict';

const { execFileSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

const root = resolve(__dirname, '..');
const temp = mkdtempSync(join(tmpdir(), 'api-schema-mapper-'));
const env = { ...process.env, npm_config_cache: join(temp, '.npm-cache') };
try {
  const output = execFileSync('npm', ['pack', '--json'], { cwd: root, encoding: 'utf8', env });
  const filename = JSON.parse(output)[0].filename;
  const tarball = join(root, filename);
  execFileSync('npm', ['init', '-y'], { cwd: temp, stdio: 'ignore', env });
  execFileSync('npm', ['install', '--ignore-scripts', '--offline', tarball], { cwd: temp, stdio: 'ignore', env });
  writeFileSync(join(temp, 'common.cjs'), "const Mapper = require('api-schema-mapper'); const m = new Mapper({fields:{name:{from:'user_name',to:'displayName'}}}); if(m.denormalize(m.normalize({user_name:'Ada'})).displayName !== 'Ada') process.exit(1);\n");
  writeFileSync(join(temp, 'module.mjs'), "import Mapper, { Mapper as Named } from 'api-schema-mapper'; if (Mapper !== Named) process.exit(1); const m = new Mapper({apiToForm:{user_name:'name'}}); if(m.normalize({user_name:'Ada'}).name !== 'Ada') process.exit(1);\n");
  execFileSync(process.execPath, ['common.cjs'], { cwd: temp, stdio: 'inherit' });
  execFileSync(process.execPath, ['module.mjs'], { cwd: temp, stdio: 'inherit' });
  rmSync(tarball);
  process.stdout.write('Packed CommonJS and ESM smoke tests passed.\n');
} finally {
  rmSync(temp, { recursive: true, force: true });
}

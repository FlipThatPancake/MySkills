// node needs.mjs → red/green: with no global esbuild or playwright, the scripts say what to install in one line (no stack), exit 1.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const scene = fileURLToPath(new URL('../../../skills/cozy-interiors/scene/', import.meta.url)), empty = '/tmp/cozy-empty-npm-root';
mkdirSync(empty, { recursive: true });
import { symlinkSync, existsSync as ex } from 'node:fs';
import { execSync } from 'node:child_process';
const onlyEsbuild = '/tmp/cozy-esbuild-only-root'; mkdirSync(onlyEsbuild, { recursive: true });
if (!ex(onlyEsbuild + '/esbuild')) symlinkSync(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/esbuild', onlyEsbuild + '/esbuild');
let bad = 0;
for (const [script, pkg] of [['build.mjs', 'esbuild'], ['check-home.mjs', 'esbuild'], ['fitshots.mjs', 'esbuild'], ['fitshots.mjs', 'playwright']]) {
  const root = pkg === 'playwright' ? onlyEsbuild : empty;
  const r = spawnSync('node', [script, 'example.json'], { cwd: scene, env: { ...process.env, COZY_NPM_ROOT: root }, encoding: 'utf8' }), err = r.stderr + r.stdout;
  const ok = r.status === 1 && err.includes(`needs a global package: ${pkg} is not installed`) && err.includes(`npm i -g ${pkg}`) && !/\n\s+at /.test(err);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${script} without ${pkg}: ${ok ? 'one-line install message' : err.split('\n').slice(0, 4).join(' | ')}`); if (!ok) bad++;
}
// T12: a scene json older than its spec is refused
import { copyFileSync, utimesSync, rmSync } from 'node:fs';
const t = scene + 'tmp-stale'; mkdirSync(t, { recursive: true });
for (const f of ['example.json', 'example.spec.mjs']) copyFileSync(scene + f, `${t}/${f}`);
const now = Date.now() / 1000; utimesSync(`${t}/example.json`, now - 100, now - 100); utimesSync(`${t}/example.spec.mjs`, now, now);
const r = spawnSync('node', [scene + 'check-home.mjs', `${t}/example.json`, '--quick'], { encoding: 'utf8' }), ok = r.status === 1 && /older than example\.spec\.mjs/.test(r.stderr);
console.log(`${ok ? 'ok  ' : 'FAIL'} check-home refuses a json older than its spec: ${ok ? 'refused' : (r.stderr + r.stdout).slice(0, 200)}`); if (!ok) bad++;
rmSync(t, { recursive: true, force: true });
process.exit(bad ? 1 : 0);

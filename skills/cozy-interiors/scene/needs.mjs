// needs.mjs — globalPkg(name): a package from the global npm folder (playwright, esbuild), or a one-line message that says what to install and exit 1 (no stack).
//   COZY_NPM_ROOT=<dir> points at another global folder (the tests use it to prove the message).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
const stop0 = (msg) => { console.error(`cozy-interiors needs a global package: ${msg}`); process.exit(1); };
export function globalPkg(name, optional = false) {
  const stop = optional ? (m) => { throw new Error(m); } : stop0;
  let root; try { root = process.env.COZY_NPM_ROOT || execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { stop(`npm is not on the path, so ${name} cannot be found; install Node with npm, then  npm i -g ${name}`); }
  try { if (!existsSync(join(root, name))) throw 0; return createRequire(join(root, 'x.js'))(name); } catch { stop(`${name} is not installed in ${root}; run  npm i -g ${name}${name === 'playwright' ? ' && npx playwright install chromium' : ''}`); }
}

// buildPage(here, scene): run build.mjs; when it fails, print its own message (not a stack) and exit 1
export function buildPage(here, scene) { try { execSync(`node ${join(here, 'build.mjs')} ${scene}`, { stdio: ['ignore', 'ignore', 'pipe'] }); } catch (e) { console.error(String(e.stderr || e.message).trim().split('\n').slice(0, 6).join('\n')); process.exit(1); } }

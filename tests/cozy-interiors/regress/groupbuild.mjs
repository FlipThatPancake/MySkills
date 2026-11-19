// node rollstats.mjs --build [seeds=4] [--only=text] [--jobs=4] → builds every group phrase with a.group in a bare room for each seed, runs check-home --quick, and prints the pass rate per phrase.
// A phrase passes a seed when the build leaves nothing out and check-home names no physical, placement or group finding (the whole-room composition rules of a bare room are ignored, see geom/comp.mjs).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), scene = path.resolve(here, '../../../skills/cozy-interiors/scene');
const { ASSETS } = await import(path.join(scene, 'src/library/meta.js'));
const { Home } = await import(path.join(scene, 'compose.mjs')), { group, groupPhrases, RECIPES } = await import(path.join(scene, 'groups.mjs')), { physical } = await import(path.join(scene, 'geom/comp.mjs'));
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d, N = Number(process.argv.find((a) => /^\d+$/.test(a)) || 4), only = arg('only', ''), JOBS = Number(arg('jobs', 4));
const COUNT = ['artbehind', 'chairback', 'footstool', 'pair', 'lights', 'stoolheight', 'rugreach', 'rugrun', 'group'];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'groupbuild-')), jobs = [];
const quiet = (f) => { const log = console.log; console.log = () => {}; try { return f(); } finally { console.log = log; } };
for (const ph of arg('stage', '') === '2' ? [] : groupPhrases().filter((p) => !only || p.includes(only))) for (let seed = 1; seed <= N; seed++) {
  const rec = RECIPES.find((r) => r.phrases.includes(ph)), json = path.join(dir, `${jobs.length}.json`), j = { ph, seed, json, left: [], err: null };
  try { quiet(() => { const H = new Home({ seed, floor: 'plain' }), a = H.area(/coat hooks/.test(ph) ? 'hallway' : 't', 'T', { rect: [0, 0, 6000, 4200] }), back = a.back(6000, []); a.left(4200); a.right(4200); a.view({ target: [3000, 700, 2000], az: 20, el: 15 });
    const o = rec.free ? { at: [3000, 2000] } : { wall: back, xc: 3000 }; const r = group(a, ph, { ...o, hero: true }); j.left = r.left; { let lo = 1e9, hi = -1e9; for (const id of r.ids) { let q; try { q = a.dims(id); } catch { continue; } if (ASSETS[q.asset]?.mount === 'wall' || q.asset === 'pendantLamp') continue; const x0 = ASSETS[q.asset]?.origin === 'front-left' ? q.at[0] : q.at[0] - q.w / 2; lo = Math.min(lo, x0); hi = Math.max(hi, x0 + q.w); } j.span = hi - lo; }   // the group's width along the back wall (a bare room, no turn)
    H.write(json, fs); }); } catch (e) { j.err = String(e.message || e).split('\n')[0].slice(0, 160); }
  jobs.push(j); }
// --stage=1 or --stage=2 runs one stage. stage 2: every wall arrangement and still life of tables.json, built by arrange.mjs over the furniture its phrase names (--only=text picks phrases)
if (arg('stage', '') !== '1') { const { wallArr } = await import(path.join(scene, 'arrange.mjs')); const T = JSON.parse(fs.readFileSync(path.join(scene, 'tables.json'), 'utf8')), SL = T.stillLife;
  const OVER = { sideboard: 'sideboard', console: 'console', 'chest of drawers': 'chestOfDrawers', desk: 'desk', sofa: 'sofa', bed: 'bed', daybed: 'daybed', 'side table': 'sideTable', table: 'table' };
  const walls = [...new Set(Object.entries(SL).filter(([k]) => k !== 'note').flatMap(([, v]) => v.wall))];
  const TOPF = { 'bedside table': 'bedsideTable', 'chest of drawers': 'chestOfDrawers', 'coffee table': 'coffeeTable', console: 'console', desk: 'desk', shelf: 'shelf', 'side table': 'sideTable', sideboard: 'sideboard', table: 'table' };
  const mk = (label, seed, body) => { const json = path.join(dir, `${jobs.length}.json`), j = { ph: label, seed, json, left: [], err: null };
    try { quiet(() => { const H = new Home({ seed, floor: 'plain' }), a = H.area(/coat hooks/.test(label) ? 'hallway' : 't', 'T', { rect: [0, 0, 6000, 4200] }), back = a.back(6000, []); a.left(4200); a.right(4200); a.view({ target: [3000, 700, 2000], az: 20, el: 15 }); j.left = body(a, back) || []; H.write(json, fs); }); } catch (e) { j.err = String(e.message || e).split('\n')[0].slice(0, 160); }
    jobs.push(j); };
  for (const ph of walls.filter((p) => !only || p.includes(only))) for (let seed = 1; seed <= N; seed++) mk(`wall: ${ph}`, seed, (a, back) => {
    const m = /never over/.test(ph) ? null : ph.match(/over the (sideboard|console|chest of drawers|desk|sofa|bed|daybed|side table|table)/), over = m ? OVER[m[1]] : null;
    if (over) { back.place('furn', over, 3000, { group: 'g' }); } return wallArr(a, ph, { wall: back, xc: 3000, over: over ? 'furn' : undefined, prefix: 'wa', group: 'g' }).left.filter((l) => !/opening owns|bed group|^note:/.test(l)); });
  const { still } = await import(path.join(scene, 'arrange.mjs'));
  for (const [k, v] of Object.entries(SL)) if (k !== 'note') for (const tp of v.tops) { const f = TOPF[tp.id]; if (!f || (only && !tp.say.includes(only))) continue; for (let seed = 1; seed <= N; seed++) mk(`still: ${tp.say} (${k})`, seed, (a, back) => { back.place('furn', f, 3000, { group: 'g' }); const r = (() => { let s = seed * 9301; return () => ((s = (s * 49297 + 233280) % 233280) / 233280); })(), pool = tp.things.slice(), pick = []; while (pick.length < 2 && pool.length) pick.push(pool.splice(Math.floor(r() * pool.length), 1)[0]); const r2 = still(a, 'furn', pick); return r2.ids.length ? [] : r2.left; }); } }
const run = (j) => new Promise((res) => { if (j.err) return res(); let out = ''; const p = spawn('node', [path.join(scene, 'check-home.mjs'), j.json, '--quick']); p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d)); p.on('close', () => { try { const S = JSON.parse(fs.readFileSync(j.json, 'utf8')); j.sig = JSON.stringify(S.home.objects.map((o) => [o.asset, o.at, o.params])); } catch {} j.findings = [...out.matchAll(/^\[([a-z0-9-]+)\] (.*)$/gm)].map((m) => ({ rule: m[1], text: m[2] })).filter((f) => physical(f, { counts: COUNT })).filter((f) => !(/^(wall|still): /.test(j.ph) && /^(table|group|placement-16|placement-9|placement-17a|seating)$/.test(f.rule))); res(); }); });
let next = 0; await Promise.all(Array.from({ length: JOBS }, async () => { while (next < jobs.length) await run(jobs[next++]); }));
const by = {}; for (const j of jobs) (by[j.ph] ||= []).push(j);
let all = 0, pass = 0;
for (const [ph, js] of Object.entries(by)) { const ok = js.filter((j) => !j.err && !j.left.length && !(j.findings || []).length); all += js.length; pass += ok.length;
  const why = {}; for (const j of js) { if (j.err) why[`build: ${j.err}`] = (why[`build: ${j.err}`] || 0) + 1; for (const l of j.left) why[`left: ${l}`] = (why[`left: ${l}`] || 0) + 1; for (const f of j.findings || []) { const k = `[${f.rule}] ${f.text.replace(/^\S+ \(\S+\): /, '').slice(0, 110)}`; why[k] = (why[k] || 0) + 1; } }
  const distinct = new Set(js.map((j) => j.sig)).size; console.log(`${ok.length === js.length ? 'PASS' : ok.length ? 'part' : 'FAIL'} ${ok.length}/${js.length}  (${distinct} different)  ${ph.slice(0, 80)}`); for (const [k, n] of Object.entries(why).sort((x, y) => y[1] - x[1]).slice(0, 3)) console.log(`      ${n}x ${k}`); }
{ const wide = Object.entries(by).map(([ph, js]) => [ph, Math.max(...js.map((j) => j.span || 0))]).filter(([, w]) => w > 3000).sort((x, y) => y[1] - x[1]); if (wide.length) { console.log('widest groups (over 3000 mm along the wall):'); for (const [ph, w] of wide) console.log(`      ${Math.round(w)} mm  ${ph.slice(0, 70)}`); } }
console.log(`${pass}/${all} group builds pass (${Object.keys(by).length} phrases, ${N} seeds each)`);
{ const H = new Home({ seed: 1, floor: 'plain' }), a = H.area('t', 'T', { rect: [0, 0, 6000, 4200] }), back = a.back(6000, []), r = quiet(() => group(a, 'sideboard or dresser with a still life and a picture', { wall: back, xc: 3000, pieces: { art: { skip: true }, furn: { asset: 'console' } } }));
  console.log(`per-call overrides: ${r.ids.includes('sideboard-art') || r.ids.some((i) => /art$/.test(i)) ? 'BAD (the skipped art was built)' : 'ok (art skipped)'}, furniture ${H.S.home.objects.find((o) => /furn$/.test(o.id)).asset} (asked for console)`); }
fs.rmSync(dir, { recursive: true, force: true });
process.exit(pass === all ? 0 : 1);

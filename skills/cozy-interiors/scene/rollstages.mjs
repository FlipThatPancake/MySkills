// rollstages.mjs — framework item F: does the roll, the plan and the shell give a home that is green through stage 4 (anchors)?
//   node rollstats.mjs --stages [seeds = 200] [--from=1] [--jobs=4] [--only=1,2,3] [--json out.json] [--keep]   (rollstats.mjs calls this file)
// Per seed: pick 2 to 4 area kinds, roll them, hand the roll to Home, build each area from the plan (its cell, its ways through, the dealt windows), place the dealt groups by their dealt slots (a.group(phrase, { slot })),
// then run `check-home --until anchors --quick` on it. A seed is GREEN when the build leaves nothing out and check-home names nothing of stages 1 to 4.
// A seed that fails is a bug in the roll, a recipe, the slots or the plan tool, not in the agent: the report names the stage, the rule and who owns it, and counts seeds per cause.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), WINW = { picture: 2100, wall: 3800, bay: 1800, pair: 1400 };   // the dealt widths by window style (openings.js); a plain window is 1200
const T = JSON.parse(fs.readFileSync(path.join(here, 'tables.json'), 'utf8'));

const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngOf = (seed) => { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; };
const quiet = (f) => { const log = console.log, warn = console.warn; console.log = () => {}; console.warn = () => {}; try { return f(); } finally { console.log = log; console.warn = warn; } };

// who fixes a failure: the stage and rule say which thread's code is at fault
const OWNER = (stage, rule, what = '') => (/^(still|wallArr)$/.test(rule) ? 'arrange.mjs / tops (a.still, a.wallArr)' : /no-recipe/.test(rule) ? 'recipes (groups.mjs has none; a.table / a.run / a.put build it today)' : stage === 1 ? 'roll' : stage === 2 ? 'plan tool' : stage === 3 ? (/slot|group|recipe/.test(what) ? 'slots or recipes' : /dealt window|too close/.test(what) ? 'roll vs plan (a window and a way through on one short wall)' : 'plan tool / compose shell') : /recipe|no such slot|under 600|corridor|slot/.test(what) ? 'slots or recipes' : /rolled|hero|groups/.test(rule) ? 'roll / recipes' : 'checks or recipes');

const DEP = new Set(['interest', 'fill', 'depth', 'emptyfloor', 'floorcover', 'rectfit', 'frame', 'rolled', 'open-separator', 'hidden', 'placement-18']);
import { groupPhrase as phraseOf } from './roll.mjs';
export { phraseOf };   // the roll owns the place wording (SLOTS in roll.mjs): one reader for every place text

// build the anchors-only home of one seed → { json, kinds, fails: [{ stage, rule, what }], areas }
const FG = [[/umbrella/i, 'umbrellaStand'], [/basket/i, 'basket'], [/stool/i, 'stool'], [/bench/i, 'bench'], [/pouf/i, 'pouf'], [/cat bed|crate/i, 'crate'], [/waste|bin/i, 'wasteBin'], [/trolley/i, 'trolley'], [/chair/i, 'chair'], [/boot|shoe/i, 'shoes']];
const TOPASSET = { worktop: ['baseRun'], table: ['table', 'roundTable'], sideboard: ['sideboard'], 'coffee table': ['coffeeTable'], 'side table': ['sideTable'], 'bedside table': ['bedsideTable'], 'chest of drawers': ['chestOfDrawers'], shelf: ['shelf', 'openShelf'], console: ['console'], desk: ['desk'] };
export async function buildSeed(seed, dir, { Home, roll, KINDS, group }) {
  const rng = rngOf(seed * 7919 + 13), pool = KINDS.filter((k) => k !== 'names'),   // 'names' is a tables.json key with a hero list, not an area kind (roll throws on it: KINDS in roll.mjs should drop it)
     n = 2 + (seed % 3), kinds = [];
  while (kinds.length < n && kinds.length < pool.length) { const k = pool[Math.floor(rng() * pool.length)]; if (!kinds.includes(k)) kinds.push(k); }
  const out = { seed, kinds, fails: [], placed: 0, json: null };
  let R; try { R = quiet(() => roll(seed, kinds)); } catch (e) { out.fails.push({ stage: 2, rule: 'roll', what: `roll(${seed}, ${kinds.join(' ')}) found no home: ${String(e.message).split('\n')[0].slice(0, 140)}` }); return out; }
  let clash = null;
  for (let attempt = 0; attempt < 2; attempt++) {   // the dealt window's x: the first that stays 300 mm clear of the plan's ways through
    const fr = [1, null][attempt], fails = clash ? [{ stage: 3, rule: 'shell', what: `no x for the dealt window beside the plan's way through, built without it (${clash})` }] : [];
    try {
      const H = quiet(() => new Home({ seed })), json = path.join(dir, `${seed}.json`); quiet(() => H.roll({ seed, plan: R.plan, openPlan: R.openPlan, areas: R.areas })); const made = {};
      for (const id of R.plan.order) {
        const pa = R.plan.areas[id], [w, d] = pa.fit, ra = R.areas[id], a = quiet(() => H.area(id, id, { rect: [0, 0, w, d] }));
        if (pa.entry?.kind === 'open') { const i = R.openPlan.chain.indexOf(id); quiet(() => H.join(made[pa.parent], a, { layout: R.openPlan.layout === 'corner' && i - 1 === R.openPlan.turn ? 'corner' : 'row', share: R.openPlan.seams[i - 1].overlap })); }
        const bk = (T.backing || []).find((x) => x.id === ra.backing) || { walls: 2, angle: 90, second: 'right' }, second = bk.walls === 2 ? bk.second : null;   // the shell follows the roll's backing: one wall, or two (a corner, or the wide angle)
        const win = fr == null ? [] : (ra.openings || []).filter((o) => o.kind === 'window'), wallOf = (o) => (o.on === 'second' && second ? second : 'back');
        const planX = (wl, len) => R.plan.links.filter((l) => l.kind !== 'open' && ((l.a === id && l.aWall === wl) || (l.b === id && l.bWall === wl))).map((l) => ({ x: Math.round(((l.a === id ? l.aF : l.bF) * len) / 10) * 10, w: l.width || 1000 }));
        const rolled = win.map((o) => ({ o, w: wallOf(o) })), mk = (wl) => (pa.windows || []).filter((q) => q.wall === wl && q.x != null).map((q) => { const o = (rolled.find((r) => r.w === wl && (r.o.style || 'sash') === q.style) || {}).o || {}; return { kind: 'window', x: q.x, ...(o.style ? { style: o.style } : {}), ...(o.sash ? { sash: o.sash } : {}) }; });   // each dealt window at the plan's x (plan.areas[id].windows; x null = left out), as compose builds it for an agent
        let backWall; quiet(() => { backWall = a.back(w, mk('back')); if (second === 'left') a.left(d, mk('left'), bk.angle); if (second === 'right') a.right(d, mk('right'), bk.angle); a.view({ target: [w / 2, 700, d / 2], el: 18 }); }); made[id] = a; made[id + ':back'] = backWall;
        (ra.groups || []).forEach((g, k) => { const ph = phraseOf(g), slot = ra.groupSlots?.[k];
          if (!slot) { fails.push({ stage: 4, rule: 'group', what: `${id}: group "${ph}" has no dealt slot` }); return; }
          try { const r = quiet(() => a.group(ph, { slot, hero: k === 0 })); out.placed += r.ids.length; if (r.left?.length) fails.push({ stage: 4, rule: 'group', what: `${id}: "${ph}" at ${slot} left out ${r.left.join('; ').slice(0, 120)}` }); }
          catch (e) { if (k === 0 && /no recipe/.test(e.message)) out.heroMissing = true; fails.push({ stage: 4, rule: /no recipe/.test(e.message) ? (k === 0 ? 'hero-no-recipe' : 'group-no-recipe') : 'group', what: `${id}: "${ph}" at ${slot}: ${String(e.message).split('\n')[0].slice(0, 170)}` }); } });
      }
      for (const id of R.plan.order) {   // stage 2's dealt things, as an agent builds them: each still life on its top, then the wall arrangement on the back wall
        const ra = R.areas[id], a = made[id], objs = H.S.home.objects.filter((o) => o.id.startsWith(id + '-')), asOf = (o) => o.asset ?? o.scene?.asset, local = (o) => o.id.slice(id.length + 1);
        for (const st of ra.still || []) { const want = TOPASSET[st.top], top = objs.find((o) => want?.includes(asOf(o))); if (!top) { fails.push({ stage: 5, rule: 'still', what: `${id}: no ${st.top} placed for the dealt still life (${st.things.join('; ').slice(0, 80)})` }); continue; }
          try { const r = quiet(() => a.still(local(top), st.things)); if (r.left?.length) fails.push({ stage: 5, rule: 'still', what: `${id}: ${st.top}: ${r.left.join('; ').slice(0, 140)}` }); } catch (e) { fails.push({ stage: 5, rule: 'still', what: `${id}: ${st.top}: ${String(e.message).split('\n')[0].slice(0, 140)}` }); } }
        { const fg = ra.foreground ? FG.find(([re]) => re.test(ra.foreground)) : null, [w0, d0] = R.plan.areas[id].fit, near = [[0.5, 0.78], [0.3, 0.78], [0.7, 0.78], [0.5, 0.65], [0.85, 0.78]];   // the foreground piece and the floor plant stand near the camera, as an agent puts them: first spot that holds
          for (const [nid, asset] of [fg ? ['fg', fg[1]] : null, (ra.plantAt || []).includes('floor') ? ['fplant', 'floorPlant'] : null].filter(Boolean)) { let ok = false, err = ''; for (const [fx, fz] of near) { try { quiet(() => a.put(nid, asset, [Math.round(w0 * fx), Math.round(d0 * fz)], 0, { group: objs.find((o) => o.hero)?.group.split(':')[1] || objs.find((o) => o.group)?.group.split(':')[1] })); ok = true; out.placed++; break; } catch (e) { err = String(e.message).split('\n')[0].slice(0, 120); } } if (!ok) fails.push({ stage: 5, rule: 'foreground', what: `${id}: ${asset} fits at no near spot: ${err}` }); } }
        { const c = a.c, sn = a.s, [o0, o1] = a.O, mine = objs.filter((o) => o.mount === 'floor' || o.group); if (mine.length) { let sx = 0, sz = 0; for (const o of mine) { const dx = o.at[0] - o0, dz = o.at[2] - o1; sx += dx * c + dz * sn; sz += -dx * sn + dz * c; } quiet(() => a.view({ target: [Math.round(sx / mine.length), 700, Math.round(sz / mine.length)], el: 18 })); } }   // the home view as an agent sets it: the plan's az, the target at the middle of what stands in the area
        if (ra.wallArr) { try { const w0 = R.plan.areas[id].fit[0], r = quiet(() => a.wallArr(ra.wallArr, { wall: made[id + ':back'], xc: Math.round(w0 / 2), group: objs.find((o) => o.group)?.group.split(':')[1] })); if (r.left?.length) fails.push({ stage: 5, rule: 'wallArr', what: `${id}: ${r.left.join('; ').slice(0, 140)}` }); } catch (e) { fails.push({ stage: 5, rule: 'wallArr', what: `${id}: ${String(e.message).split('\n')[0].slice(0, 140)}` }); } }
      }
      quiet(() => H.write(json, fs)); out.json = json; out.fails.push(...fails); return out;
    } catch (e) { if (process.env.RS_DEBUG) console.error(attempt, fr, String(e.message).slice(0, 120)); if (attempt < 1 && /too close|keep 300 mm clear/.test(String(e.message))) { clash = String(e.message).split(';')[0].slice(0, 110); continue; } out.fails.push({ stage: 3, rule: 'shell', what: `build: ${String(e.message).split('\n')[0].slice(0, 200)}` }); return out; }
  }
  return out;
}

const runCheck = (json) => new Promise((res) => { let o = ''; const p = spawn('node', [path.join(here, 'check-home.mjs'), json, '--until', 'anchors', '--quick']); p.stdout.on('data', (d) => (o += d)); p.stderr.on('data', (d) => (o += d)); p.on('close', () => res(o)); });
// an issue line: "[rule] text  -> stage N name: move"
const parse = (o) => o.split('\n').map((l) => l.match(/^\[([\w-]+)\] (.*?)  -> stage (\d+|\?) /)).filter(Boolean).map((m) => ({ rule: m[1], what: m[2], stage: m[3] === '?' ? 9 : +m[3] }));

export async function rollStages(argv) {
  const arg = (k, d) => (argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d, N = Number(argv.find((a) => /^\d+$/.test(a)) || 200), from = Number(arg('from', 1)), JOBS = Number(arg('jobs', 4)), only = arg('only', ''), jsonOut = arg('json', '');
  const { Home } = await import(path.join(here, 'compose.mjs')), { roll, KINDS } = await import(path.join(here, 'roll.mjs'));
  const seeds = only ? only.split(',').map(Number) : Array.from({ length: N }, (_, i) => from + i), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rollstages-')), results = [];
  for (const s of seeds) results.push(await buildSeed(s, dir, { Home, roll, KINDS }));
  let next = 0; await Promise.all(Array.from({ length: JOBS }, async () => { while (next < results.length) { const r = results[next++]; if (!r.json) continue; const o = await runCheck(r.json); r.issues = parse(o).filter((i) => i.stage <= 4 || i.stage === 9); } }));
  const by = {}, bump = (k, s) => { (by[k] ||= new Set()).add(s); };
  let green = 0; const lines = [];
  for (const r of results) {
    let iss = r.issues || []; if (r.heroMissing) { const n = iss.length; iss = iss.filter((i) => !DEP.has(i.rule)); r.suppressed = n - iss.length; }   // a hero with no a.group recipe is not placed: the whole-room rules that need it are noise for this seed
    const all = [...r.fails, ...iss.map((i) => ({ stage: i.stage, rule: i.rule, what: i.what }))];
    if (!all.some((f) => f.stage <= 4 || f.stage === 9)) green++;
    if (!all.length) continue;
    for (const f of all) { if (f.rule === 'penetrates') { const m = f.what.match(/^(\S+) \((\w+)\) is \d+ mm inside (a wall or opening|(\S+) \((\w+)\))/); if (m) bump(`penetrates by pair | ${m[3] === 'a wall or opening' ? 'recipe against wall or opening' : 'recipe against recipe'}: ${m[2]}${m[5] ? ' into ' + m[5] : ''}`, r.seed); } }
    for (const f of all) bump(`stage ${f.stage} | ${f.rule} | ${OWNER(f.stage, f.rule, f.what)}`, r.seed);
    lines.push(`seed ${r.seed} (${r.kinds.join(' ')}): ${all.length} problem(s): ${all.slice(0, 3).map((f) => `[${f.rule}] ${f.what.slice(0, 110)}`).join(' / ')}`);
  }
  console.log(`rollstats --stages: ${seeds.length} seed(s), ${results.filter((r) => r.heroMissing).length} with a hero that has no a.group recipe (their whole-room findings are left out: ${results.reduce((n, r) => n + (r.suppressed || 0), 0)}), ${green} green through stage 4 (${Math.round(100 * green / seeds.length)}%); built ${results.filter((r) => r.json).length}, placed ${results.reduce((s, r) => s + r.placed, 0)} anchor piece(s)`);
  console.log('\ncause (stage | rule | owner): seeds');
  for (const [k, v] of Object.entries(by).sort((a, b) => b[1].size - a[1].size)) console.log(`  ${String(v.size).padStart(4)}  ${k}   e.g. seeds ${[...v].slice(0, 5).join(', ')}`);
  console.log('\nper seed:'); for (const l of lines) console.log('  ' + l);
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(results.map((r) => ({ seed: r.seed, kinds: r.kinds, fails: r.fails, issues: r.issues })), null, 1));
  if (!argv.includes('--keep')) fs.rmSync(dir, { recursive: true, force: true }); else console.log(`\nscenes kept in ${dir}`);
  return { seeds: seeds.length, green };
}

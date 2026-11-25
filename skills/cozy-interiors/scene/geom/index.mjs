#!/usr/bin/env node
// geom/index.mjs — the one entry point of the geometry core.
//   checkScene(scene (path | parsed json)) → { findings, timings, shapes }   findings: { rule, id, text, ... } one line each
//   node geom/index.mjs <scene.json> [--json out] [--no-settle]   prints them like physics.mjs did
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadScene } from './load.mjs';
import { queryWorld, contacts } from './world.mjs';
import { applyRules } from './rules.mjs';
import { placementRules } from './placement.mjs';
import { COVER } from './settle.mjs';

export async function checkScene(scene, { settle = true, parts = true, src } = {}) {
  const t0 = performance.now(), L = await loadScene(scene, { src }), t1 = performance.now();
  const Q = queryWorld(L), t2 = performance.now(), C = contacts(Q), t3 = performance.now();
  const { find, supporters, supportPolys } = applyRules(Q, C.list), t4 = performance.now();
  const findings = [...find, ...placementRules(L, L)]; { const { pathRules } = await import('./pathrules.mjs'); findings.push(...pathRules(L)); }   // the rule 'path' (check-home ran it in the page before)
  for (const f of Q.failed) findings.push({ rule: 'shape-failed', id: f.owner, text: `${f.owner}: part ${f.k} (${f.type}, ${f.kind}) could not be made into a shape` });
  if (parts) { const { checkParts } = await import('./parts.mjs'); findings.push(...(await checkParts(L))); }
  let t5 = t4;
  if (settle) { const { settleScene } = await import('./settle.mjs'); findings.push(...settleScene(Q, C.list, {}, supportPolys)); t5 = performance.now(); }
  // an object pushed or slid out of a rug or a neighbour (or carried by one that is) is already named by the sunk or penetrates finding
  const named = new Set(find.filter((f) => f.rule === 'sunk' || f.rule === 'penetrates').flatMap((f) => [f.id, f.other]));
  const carried = (id, seen = new Set()) => { if (named.has(id)) return true; if (seen.has(id)) return false; seen.add(id); return (supporters[id] || []).some((s) => carried(s.other.owner, seen)); };
  for (let i = findings.length - 1; i >= 0; i--) if (findings[i].rule === 'moves' && /pushed|slides/.test(findings[i].text) && carried(findings[i].id)) findings.splice(i, 1);
  const nSolid = L.objects.filter((o) => o.parts.some((p) => p.kind !== 'flat')).length, skipped = Object.entries(COVER.skipped).map(([k, n]) => `${k} x${n}`).join(', ');
  const coverage = [`physics: ${L.objects.length} objects, ${Q.entries.length} parts${Q.failed.length ? `, ${Q.failed.length} shapes failed` : ''}`, parts ? `parts inside assets: ${nSolid} of ${L.objects.length} objects (flat-only skipped)` : 'parts inside assets: not run', settle ? `settle: ${COVER.falling} falling, ${COVER.fixed} fixed${skipped ? `; left out: ${skipped}` : ''}` : 'settle: not run', `placement: ${L.objects.filter((o) => o.parts.length).length} objects with geometry`];
  try { Q.W.free(); } catch { /* freed already */ }   // a.blocking scores layouts over and over in one process: the world's memory goes back (without it Rapier's heap runs out after about a thousand calls)
  findings.sort((a, b) => a.rule.localeCompare(b.rule) || String(a.id).localeCompare(String(b.id)));
  return { findings, coverage, shapes: { ...Q.tally, parts: Q.entries.length, objects: L.objects.length }, contacts: C.list.length, timings: { build: t1 - t0, world: t2 - t1, contacts: t3 - t2, rules: t4 - t3, settle: t5 - t4, total: t5 - t0 } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), out = args.includes('--json') ? args[args.indexOf('--json') + 1] : null, file = args.find((a) => !a.startsWith('--') && a !== out);
  const r = await checkScene(file, { settle: !args.includes('--no-settle'), parts: !args.includes('--no-parts') });
  console.log(`${r.shapes.objects} objects, ${r.shapes.parts} parts (${r.shapes.hull} hulls, ${r.shapes.mesh} meshes, ${r.shapes.failed} failed), ${Math.round(r.timings.total)} ms`);
  for (const f of r.findings) console.log(`[${f.rule}] ${f.text}`);
  console.log(`${r.findings.length} finding(s)`);
  if (out) writeFileSync(out, JSON.stringify(r, null, 1));
}

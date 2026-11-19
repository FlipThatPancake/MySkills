// stages.mjs — the build stages (build-framework-proposal.md, section 3) and which stage owns each check-home rule.
//   check-home tags every issue with its stage and its next move, prints them grouped by stage (earliest first), and `--until <stage>` keeps only the stages up to that one and says nothing about later ones.
//   node stages.mjs --lint   → every rule name that the checks push has a stage here (a new rule without one prints and exits 1).
// Stage numbers: 1 deal, 2 plan, 3 shell, 4 anchors, 5 dress, 6 life, 7 photographs, 8 walk. (Stage 9, look, is by eye and has no rule.)
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STAGES = ['deal', 'plan', 'shell', 'anchors', 'dress', 'life', 'photographs', 'walk'];
export const UNSTAGED = 9;   // a rule this table does not know: printed always, named in the coverage line, never held back

// The large pieces: what stage 4 places (a.group puts these, nothing small). A rule that mixes large and small pieces goes to 4 when it names a large piece, to 5 when it names only small ones.
export const LARGE = new Set(['baseRun', 'wallRun', 'fridge', 'hood', 'table', 'roundTable', 'chair', 'sofa', 'armchair', 'readingChair', 'coffeeTable', 'sideTable', 'rug', 'runner', 'shelf', 'sideboard', 'console', 'bench', 'glazedCabinet', 'openShelf', 'chestOfDrawers', 'clothesRail', 'woodStove', 'bed', 'bedsideTable', 'wardrobe', 'desk', 'windowSeat', 'deskChair', 'daybed', 'trolley', 'coatStand', 'shoeRack', 'readShelf', 'plantStand']);

const S = { deal: 1, plan: 2, shell: 3, anchors: 4, dress: 5, life: 6, photographs: 7, walk: 8 };
// rule → a stage number, or a function (issue, ctx) → stage number. split(base): the rules that mix large and small pieces.
const split = (shell) => (i, c) => { const a = c.assets(i.what); return a.length ? (LARGE.has(a[0]) ? 4 : 5) : (shell ?? 5); };   // the first object named is the subject: the piece to move
const RULE = {
  // 2 plan
  plan: S.plan, 'open-layout': S.plan, 'open-floor': S.plan,
  // 3 shell and view
  units: S.shell, openings: S.shell, window: S.shell, 'window-head': S.shell, sash: S.shell, pane: S.shell, cornerop: S.shell, 'open-glimpse': S.shell, rectfit: S.shell,
  casing: split(3),
  // 4 anchors
  path: split(4), emptyfloor: S.anchors, herowin: S.anchors, rugreach: S.anchors, rugrun: S.anchors, seatface: S.anchors, depth: S.anchors, front: S.anchors, seating: S.anchors, seat: S.anchors, fill: S.anchors, floorcover: S.anchors, table: S.anchors, rug: S.anchors, rugs: S.anchors, 'rug-edge': S.anchors, runner: S.anchors, group: S.anchors,
  'open-walkway': S.anchors, 'open-separator': S.anchors, 'open-island': S.anchors, 'open-island-seat': S.anchors, 'note-bedcentre': S.anchors, '_heroside': S.anchors,
  // split: the same rule on a large piece is stage 4, on a small one stage 5
  wall: split(), floor: split(), overlap: split(), swing: split(4), hidden: split(), lone: split(), stool: split(), support: split(), floating: split(), physics: split(), parts: split(), penetrates: split(), sunk: split(), overhangs: split(), moves: split(), zfight: split(), nan: split(), orbit: split(), artbehind: split(), chairback: split(), fridge: split(), pair: split(), footstool: split(), stoolheight: split(), 'shape-failed': split(),
  // frame: the area's cover of the home view and the windows inside it are the view (3); an object outside the frame is a piece (4 or 5)
  frame: (i, c) => (/objects and openings cover|opening|window|backing/.test(i.what) ? 3 : split()(i, c)),
  // interest: what a dressed area has; its backing walls are the shell, its hero an anchor
  interest: (i) => (/backing walls/.test(i.what) ? 3 : /hero/.test(i.what) ? 4 : 5),
  // rolled: the roll compared with the scene
  rolled: (i, c) => (/passage/.test(i.what) ? 2 : /roll deals \d+ groups|hero group|group "|hero "/.test(i.what) ? 4 : /plant/.test(i.what) ? 5 : c.assets(i.what).some((x) => LARGE.has(x)) ? 4 : /names a (sofa|bed|table|desk|wardrobe|run|island|bench|armchair|bookcase|shelf)/.test(i.what) ? 4 : 5),
  // visible: a group hidden in the home view is an anchor fault; a small piece hidden is a dress fault
  visible: (i, c) => (/hides the rest of group/.test(i.what) ? 4 : split()(i, c)),
  // 5 dress
  variety: S.dress, foreground: S.dress, bare: S.dress, tabletop: S.dress, surface: S.dress, lamps: S.dress, lights: S.dress, cushion: S.dress, throw: S.dress, shoes: S.dress, sill: S.dress, curtain: S.dress, kettle: S.dress, towel: S.dress, accent: S.dress, cord: S.dress, 'open-light': S.dress, 'note-lampspot': S.dress,
  // 6 life
  motion: S.life, windmover: S.life,
  // 7 photographs
  shot: S.photographs, camera: S.photographs, ghost: S.photographs, 'top-fade': S.photographs, 'open-shot': S.photographs,
  // 8 walk
  glide: S.walk, 'open-glide': S.walk,
};

// placement-N: the placement rules, a large piece (bed head, tall piece) or a small one
export function ruleStage(issue, ctx) { const r = RULE[issue.rule] ?? (/^placement-/.test(issue.rule) ? split() : undefined); if (r === undefined) return UNSTAGED; return typeof r === 'function' ? r(issue, ctx) : r; }

// ctx: { assetOf: { id: asset } } from the built page. assets(text) → the assets of every object id named in the text
export function makeCtx(assetOf = {}) {
  const ids = Object.keys(assetOf).sort((a, b) => b.length - a.length), esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), cache = new Map();
  return { assetOf, assets(text) { if (cache.has(text)) return cache.get(text); const hit = []; for (const id of ids) { const m = new RegExp(`(?<![\\w-])${esc(id)}(?![\\w-])`).exec(text); if (m) hit.push([m.index, assetOf[id]]); } const out = hit.sort((a, b) => a[0] - b[0]).map((h) => h[1]); cache.set(text, out); return out; } };
}

// the one next move (the ladder: nudge in slot, swap slot, go back one stage, a.skip)
const SWAP = new Set(['variety', 'bare', 'interest', 'tabletop', 'lamps']);
export function nextMove(issue, n) {
  if (n === UNSTAGED) return 'read the message';
  if (issue.rule === 'rolled' || /a\.skip\(/.test(issue.what)) return `a.skip(what, 'why') if it is left out on purpose`;
  if (issue.rule === 'nan') return 'fix the asset generator (the shape is broken, not misplaced)';
  if (n === 2) return 'go back to stage 2 (the plan)';
  if (n === 3) return 'go back to stage 3 (resize the rect, move the opening or the view)';
  if (n === 4) return 'nudge in its slot, else swap slots, else go back to stage 3';
  if (n === 5) return SWAP.has(issue.rule) ? 'swap to another piece or slot' : 'nudge in its slot, else swap slots, else go back to stage 4';
  if (n === 6) return 'go back to stage 5 (move what blocks it) or change the mover';
  if (n === 7) return 'refit with fitshots; a LOOSE fit goes back to stage 5 to shrink that group';
  return 'go back to stage 2 (the link)';
}

// issues → { shown: [...], lines, held } . until: a stage name or number or null
export function stageReport(issues, ctx, until = null) {
  const lim = until == null ? 99 : (typeof until === 'number' ? until : STAGES.indexOf(until) + 1 || +until || 99);
  const tagged = issues.map((i) => { const n = ruleStage(i, ctx); return { ...i, stage: n, move: nextMove(i, n) }; });
  const shown = tagged.filter((i) => i.stage === UNSTAGED || i.stage <= lim).sort((a, b) => a.stage - b.stage), held = tagged.length - shown.length;
  const counts = {}; for (const i of tagged) (counts[i.stage] ||= []).push(i.rule);
  const lines = []; let cur = -1;
  for (const i of shown) { if (i.stage !== cur) { cur = i.stage; const k = shown.filter((x) => x.stage === cur).length; lines.push(`== stage ${cur === UNSTAGED ? '?' : cur} ${STAGES[cur - 1] || 'unstaged'}: ${k} issue(s) ==`); } lines.push(`[${i.rule}] ${i.what}  -> stage ${i.stage === UNSTAGED ? '?' : i.stage} ${STAGES[i.stage - 1] || 'unstaged'}: ${i.move}`); }
  const first = shown.find((i) => i.stage !== UNSTAGED), later = until == null && first ? shown.filter((i) => i.stage > first.stage).length : 0;
  if (first && until == null && later) lines.push(`fix stage ${first.stage} (${STAGES[first.stage - 1]}) first; ${later} later issue(s) may change`);
  const unstaged = [...new Set(tagged.filter((i) => i.stage === UNSTAGED).map((i) => i.rule))];
  const cov = `stages: ${until == null ? 'all 8 stages reported, grouped earliest first' : `ran stages 1-${lim} (until ${STAGES[lim - 1] || until}); later stages are not reported`}${unstaged.length ? `; rule(s) without a stage (printed always): ${unstaged.join(', ')}` : ''}`;
  return { shown, lines, held, coverage: cov };
}

// --lint: every rule name pushed by a check has a stage
if (process.argv[1] && process.argv[1].endsWith('stages.mjs') && process.argv.includes('--lint')) {
  const here = dirname(fileURLToPath(import.meta.url)), files = ['check-home.mjs', 'check-visible.mjs', 'check-pendants.mjs', 'check-windows.mjs', 'check-motion.mjs', 'check-openplan.mjs', ...readdirSync(join(here, 'geom')).filter((f) => f.endsWith('.mjs')).map((f) => 'geom/' + f)];
  const seen = new Set(); for (const f of files) for (const m of readFileSync(join(here, f), 'utf8').matchAll(/(?:rule: |pushC\()'([\w-]+)'/g)) seen.add(m[1]);
  const missing = [...seen].filter((r) => !/^placement-/.test(r)).filter((r) => !(r in RULE) && !/^note-/.test(r) || (/^note-/.test(r) && !(r in RULE))); for (const r of missing) console.log(`rule without a stage: ${r}`);
  console.log(missing.length ? `${missing.length} rule(s) need a stage in stages.mjs` : `ok: ${seen.size} rule names, all staged`); process.exit(missing.length ? 1 : 0);
}

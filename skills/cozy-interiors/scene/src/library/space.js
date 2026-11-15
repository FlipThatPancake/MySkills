// @js:library-space — dealing a variant from an asset's parameter space (meta.js SPACE) and measuring how far apart two variants are. Pure data, no three.js: compose.mjs, check-home and assets.mjs import it.
// dealParams(home, asset, params): fills every unset parameter from a seeded deck, so the next instance of the same asset gets values not used yet; params the spec sets stay.
// distance(asset, a, b): choices that differ count 1 each, ranges count |a - b| / (hi - lo); 2 or more reads as clearly different.
import { SPACE } from './meta.js';
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (a, R) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
const round = (v, lo, hi) => (Number.isInteger(lo) && Number.isInteger(hi) && hi - lo < 20 ? Math.round(v) : hi - lo >= 100 ? Math.round(v / 10) * 10 : hi - lo >= 20 ? Math.round(v) : Math.round(v * 100) / 100);
const LEGACY = { cushion: ['form', 'pattern', ['plain', 'stripes', 'inset', 'diamond']], shelf: ['form', 'fill', ['books', 'boxes', 'mixed']] };   // an old numeric form maps to a choice
export function dealParams(home, asset, params = {}) {
  const sp = SPACE[asset]; if (!sp) return params;
  const out = { ...params }, st = (home.decks ||= {}), lg = LEGACY[asset];
  if (lg && out[lg[0]] !== undefined && out[lg[1]] === undefined) out[lg[1]] = lg[2][out[lg[0]] % lg[2].length];
  for (const [k, spec] of Object.entries(sp)) {
    if (out[k] !== undefined) continue;
    const key = asset + '/' + k, R = (st[key + '#r'] ||= rng(hash(`${home.S.seed}:${key}`)));
    if (!st[key]?.length) st[key] = Array.isArray(spec) && typeof spec[0] === 'string' ? shuffle([...spec], R) : shuffle(Array.from({ length: 8 }, (_, i) => round(spec[0] + (i + 0.5) / 8 * (spec[1] - spec[0]), spec[0], spec[1])), R);
    out[k] = st[key].pop();
  }
  return out;
}
export function distance(asset, a = {}, b = {}) {
  const sp = SPACE[asset]; if (!sp) return 0; let d = 0;
  for (const [k, spec] of Object.entries(sp)) { if (a[k] === undefined || b[k] === undefined) continue; d += typeof spec[0] === 'string' ? (a[k] === b[k] ? 0 : 1) : Math.abs(a[k] - b[k]) / (spec[1] - spec[0]); }
  return d;
}
export const spaceText = (asset) => Object.entries(SPACE[asset] || {}).map(([k, v]) => `${k} ${typeof v[0] === 'string' ? v.join('|') : v[0] + '-' + v[1]}`).join(', ');

// Bugs inside one asset: its own parts pass through each other. A throwaway asset (not in the library) is registered for the run and checked with physics.mjs --parts, the check selftest.mjs runs on every real asset.
// Whether parts count is decided by kit.content(...): only tagged parts are tested; untagged parts count as one rigid assembly where joinery may overlap (selftest.mjs header).
// The asset: a base plate with a thin sling plate across it, and a "magazine" standing from below the sling to above it (so it crosses the sling).
const meta = { origin: 'centre', size: [400, 300, 330], mount: 'floor', params: '-' };
const rack = (tag) => (kit) => {
  const g = kit.group(), B = (cx, y, cz, w, h, d) => kit.box(cx - w / 2, y, cz + d / 2, w, h, d);
  g.add(B(0, 0, 0, 400, 20, 300)); g.add(B(0, 150, 0, 380, 20, 280));   // base plate; the sling plate
  const mag = B(0, 40, 0, 150, 290, 40); g.add(tag ? kit.content(mag) : mag);   // from 40 to 330 mm: through the sling at 150-170
  return kit.merge(g);
};
const resting = (kit) => { const g = kit.group(), B = (cx, y, cz, w, h, d) => kit.box(cx - w / 2, y, cz + d / 2, w, h, d); g.add(B(0, 0, 0, 400, 20, 300)); g.add(kit.content(B(0, 20, 0, 150, 280, 40))); return kit.merge(g); };   // the magazine stands on the base, touching, nothing crossing
export const fixtures = [
  { name: 'asset-magazine-through-sling-tagged', from: 'Paul 13: magazines through the rack (kit.content tag set, as selftest expects)', kind: 'bug', asset: { meta, make: rack(true) }, expect: { rules: ['parts'], ids: [] } },
  { name: 'asset-magazine-through-sling-untagged', from: 'ledger Nov 17 06:43 watch: the assembly rule can hide a real pass-through inside one asset (Paul: "square things penetrate the object they are in")', kind: 'bug', asset: { meta, make: rack(false) }, expect: { rules: ['parts'], ids: [] } },
  { name: 'asset-magazine-resting-on-base', from: 'control: parts that only touch', kind: 'good', asset: { meta, make: resting } },
];

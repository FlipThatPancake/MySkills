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
// a pen pot: a hollow-looking cup with a pen standing in it; `from` is where the pen starts (a pen is 110 mm long inside: in a 90 mm pot it poked 20 mm through the floor)
const pot = (from) => (kit) => { const g = kit.group(); g.add(kit.cyl(0, 0, 0, 50, 90, { seg: 24 })); g.add(kit.through(kit.cyl(10, from, 0, 5, 170, { seg: 10 }), true)); return kit.merge(g); };
export const fixtures = [
  { name: 'asset-pen-through-pot-floor', from: 'through-proof Nov 17: deskOrganiser pens started 110 mm below the rim, so in a 90 mm pot they came out of the bottom (32 of 48 variants)', kind: 'bug', asset: { meta, make: pot(-20) }, expect: { rules: ['parts'], ids: [] } },
  { name: 'asset-pen-resting-in-pot', from: 'control: the pen stands on the pot floor, crossing the cup but nothing leaves it', kind: 'good', asset: { meta, make: pot(6) } },
  { name: 'asset-magazine-through-sling-tagged', from: 'Paul 13: magazines through the rack (kit.content tag set, as selftest expects)', kind: 'bug', asset: { meta, make: rack(true) }, expect: { rules: ['parts'], ids: [] } },
  { name: 'asset-magazine-through-sling-untagged', from: 'ledger Nov 17 06:43 watch: the assembly rule can hide a real pass-through inside one asset (Paul: "square things penetrate the object they are in")', kind: 'bug', asset: { meta, make: rack(false) }, expect: { rules: ['parts'], ids: [] } },
  { name: 'asset-magazine-resting-on-base', from: 'control: parts that only touch', kind: 'good', asset: { meta, make: resting } },
];

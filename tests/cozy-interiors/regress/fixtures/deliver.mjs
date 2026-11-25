// The delivery gate (round 6, fix list A1/B1): a home with open physical faults or believability findings is never delivered.
// The round-6 home shipped with 170 open issues, 15 of them a piece inside another, in a wall or in the air; nothing refused it. build.mjs --deliver now does.
export const fixtures = [
  { name: 'deliver-refuses-round6-home', from: 'round 6 home (tester seed 148556, 727e3be): handed over with open penetrations, wall crossings and an overhanging moka pot; build.mjs --deliver must refuse', kind: 'bug', replay: '../replays/round-6-a-home.json', deliver: true, expect: { rules: ['deliver'] } },
  { name: 'deliver-passes-clean-example', from: 'the example home has no finding: build.mjs --deliver builds it', kind: 'good', replay: '../../../../skills/cozy-interiors/scene/example.json', deliver: true },
];

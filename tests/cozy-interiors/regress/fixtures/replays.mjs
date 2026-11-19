// Home replays: a saved round home plus the (rule, object id) pairs its fix list expects. A fix counts only when the home that showed the fault turns red on that object.
// `known: true` marks pairs a check cannot see yet (XFAIL); delete it when the check lands.
export const fixtures = [
  { name: 'replay-round5-a-faults', from: 'round 5 home (tester commit 2becb55): fix list items 2, 4, 7, 8, 18 and the evaluator findings E1, E2, E5', kind: 'replay', replay: '../replays/round-5-a-home.json',
    pairs: [['throw', 'living-throw'], ['casing', 'bedroom-scl'], ['placement-16', 'bedroom-bed'], ['path', 'living-shoes'], ['shoes', 'hallway-boots'], ['runner', 'hallway-cstand']]},
];

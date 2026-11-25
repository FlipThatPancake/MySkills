// Home replays: a saved round home plus the (rule, object id) pairs its fix list expects. A fix counts only when the home that showed the fault turns red on that object.
// `known: true` marks pairs a check cannot see yet (XFAIL); delete it when the check lands.
// The round-5 pendant cords (dining-dt-pendantLamp, hallway-hpend) are not listed: the replay builds the home with today's pendant asset, whose cord passes the ink check, so the cord fix is shown by selftest, not by this home.
export const fixtures = [
  { name: 'replay-round5-a-faults', from: 'round 5 home (tester commit 2becb55): fix list items 2, 4, 7, 8, 18 and the evaluator findings E1, E2, E5; round 6 house plan: the four areas stand in a GAP row with no way through (plan rule)', kind: 'replay', replay: '../replays/round-5-a-home.json',
    pairs: [['throw', 'living-throw'], ['casing', 'bedroom-scl'], ['placement-16', 'bedroom-bed'], ['path', 'living-shoes'], ['shoes', 'hallway-boots'], ['runner', 'hallway-cstand'], ['visible', 'dining-cmug'], ['visible', 'bedroom-photo'], ['visible', 'bedroom-pstool'], ['visible', 'bedroom-dish'], ['visible', 'bedroom-nb'], ['visible', 'dining-dt-chair-1'], ['visible', 'bedroom-wardrobe'], ['cushion', 'dining-dt-chair-1-cushion1'], ['variety', 'living-books'], ['variety', 'dining-books'], ['plan', 'dining'], ['plan', 'bedroom'], ['plan', 'hallway']]},
  { name: 'replay-round6-a-fade', from: 'round 6 home (tester commit 727e3be, seed 148556), fix list B1/16: the kitchen table and its vase are faded out of the kitchen home view and no line said so (check-visible named only two groups hidden by pieces)', kind: 'replay', replay: '../replays/round-6-a-home.json',
    pairs: [['visible', 'kitchen-island-table'], ['visible', 'kitchen-bvase']]},
];

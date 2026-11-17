// @js:motion-rules — what "an open window" means, in one place for the roll, the spec helper, the page and the checks (plain data in, no THREE).
// An opening can let a living thing through when it is a window or a glass door that opens (not a fixed light, a picture window, a window wall or a bay) and is not set shut (op.open 0).
export const openable = (op) => (op.open ?? 1) > 0 && (op.kind === 'window' ? op.sash !== 'fixed' && (!op.style || op.style === 'sash' || op.style === 'pair') : op.kind === 'door' && !op.to && (op.style === 'french' || op.style === 'slider'));
// does any of these walls ({ openings }) hold an opening that is rendered open?
export const hasOpenWindow = (walls) => walls.some((w) => (w.openings || []).some(openable));
// the gap an opening's moving parts leave at its middle, in mm, from the opening's width and how far its leaves stand open (v 0 shut .. 1 wide, `max` degrees at 1).
// Two leaves hinged at the outer jambs swing inward: their free edges, which met at the middle, part by 2 L (1 - cos angle). A slider leaves about half its width.
export function gapOf(op, v, max = 75) {
  const w = op.width || 1000, a = v * max * Math.PI / 180;
  if (op.kind === 'door' && op.style === 'slider') return v > 0.02 ? w / 2 - 120 : 0;
  return Math.min(w - 160, 2 * (w / 2 - 60) * (1 - Math.cos(a)));
}
export const VISITOR_OPEN = 45;   // degrees: a window a flier uses stands at least this far open (an ajar 26 degrees leaves a gap narrower than a butterfly's wings)
export const PLANT_ASSETS = ['plant', 'floorPlant', 'pot', 'plantStand'];   // what the wind counts as a plant
export const PAD = 55;   // what a flier keeps from a solid, mm

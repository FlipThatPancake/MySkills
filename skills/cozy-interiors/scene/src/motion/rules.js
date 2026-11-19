// @js:motion-rules — what "an open window" means, in one place for the roll, the spec helper, the page and the checks (plain data in, no THREE).
// An opening can let a living thing through when it is a window or a glass door that opens (not a fixed light, a picture window, a window wall or a bay) and is not set shut (op.open 0).
export const openable = (op) => (op.open ?? 1) > 0 && (op.kind === 'window' ? op.sash !== 'fixed' && (!op.style || op.style === 'sash' || op.style === 'pair') : op.kind === 'door' && !op.to && (op.style === 'french' || op.style === 'slider'));
// does any of these walls ({ openings }) hold an opening that is rendered open?
export const hasOpenWindow = (walls) => walls.some((w) => (w.openings || []).some(openable));
// a passage a flier may use too: an arch (any style, always open) or a plain door rendered open 60 degrees or more. A window or glass door is still its first choice (pickVia).
export const passage = (op) => op.kind === 'arch' || (op.kind === 'door' && !op.style && (op.open ?? 0) >= 60);
export const flyable = (op) => openable(op) || passage(op);
export const hasOpenWay = (walls) => walls.some((w) => (w.openings || []).some(flyable));
// the gap an opening's moving parts leave at its middle, in mm, from the opening's width and how far its leaves stand open (v 0 shut .. 1 wide, `max` degrees at 1).
// Two leaves hinged at the outer jambs swing inward: their free edges, which met at the middle, part by 2 L (1 - cos angle). A slider leaves about half its width.
// the clear part of a slider (mm, in the opening's own z, 0 at its middle): its panel stands `slide` across (openings.js: 0.45 of a panel unless op.slide), so the uncovered strip is `slide` wide at the far jamb; its middle is off-centre by `off`
export function sliderClear(op) { const w = op.width || 2400, Wp = w / 2 - 20, slide = op.slide ?? 0.45 * Wp; return { gap: Math.max(0, slide - 50), off: w / 2 - 50 - slide / 2 }; }
// how wide a flier's way through `op` is at its widest, mm (a slider: its clear strip, not its width)
export const clearWidth = (op) => (op.kind === 'door' && op.style === 'slider' ? sliderClear(op).gap : op.width || 1000);
export function gapOf(op, v, max = 75) {
  const w = op.width || 1000, a = v * max * Math.PI / 180;
  if (op.kind === 'arch') return w - 120;   // jambs and casing
  if (op.kind === 'door' && !op.style) return w * 0.45;   // the open leaf stands in the room beside the hinge: the middle of the doorway is clear
  if (op.kind === 'door' && op.style === 'slider') return sliderClear(op).gap;   // a slider is drawn with its panel slid across (openings.js): it has no open state to change, so v does not matter
  return Math.min(w - 160, 2 * (w / 2 - 60) * (1 - Math.cos(a)));
}
export const VISITOR_OPEN = 45;   // degrees: a window a flier uses stands at least this far open (an ajar 26 degrees leaves a gap narrower than a butterfly's wings)
export const PLANT_ASSETS = ['plant', 'floorPlant', 'pot', 'plantStand', 'herbs', 'hangingPlant'];   // what the wind counts as a plant (herbs and hanging plants too)
export const WIND_REACH = 1500;   // mm: a plant farther than this from the open window does not feel the breeze, so it does not make wind a mover
export const PAD = 55;   // what a flier keeps from a solid, mm

// what kind of thing an asset is, for the rules (one place)
export const BUILT_IN = /^(hob|sink|tap|baseRun|wallRun|hood|woodStove)$/;                              // fixed into the room: never free, never "inside" its own run
export const FLATMARK = /rug|scuff|leaf|scratch/;                                                          // flat marks on a surface
export const DRAPE = /cloth|throw|towel|curtain|cushion|pillow|blanket|tablecloth|tableRunner|runner/i;   // hang or lie over things: left out of the settle test
export const CLOTH = /cloth|throw|towel|curtain|blanket|runner|duvet/i;                                   // thin cloth: things may sink 8 mm
export const SEAT = /cushion|pillow|sofa|armchair|readingChair|daybed|bed|windowSeat|footstool|pouf|seatSoft/i;  // upholstery: things may sink 30 mm
export const SOFT = new RegExp(CLOTH.source + '|' + SEAT.source, 'i');                                     // a rug is not soft: things stand on its pile
export const RUG = /rug/i;
export const PAN = /^(pan|pot|saucepan|frypan)$/i;
export const isFree = (o) => !/^(wall|ceiling|lines|in)/.test(o.mount) && !FLATMARK.test(o.asset || '') && !BUILT_IN.test(o.asset || '') && !DRAPE.test(o.asset || '');
export const softKind = (asset) => (CLOTH.test(asset || '') ? 'cloth' : SEAT.test(asset || '') ? 'seat' : null);
export const FOLDED = /^(foldedThrow|cushion|benchCushion|floorCushion|pillow)$/;                         // folded cloth things lie on a surface like any piece: the support rules (floating, overhangs, sunk) read them, the settle test leaves them be
export const holdsRules = (o) => isFree(o) || FOLDED.test(o.asset || '');

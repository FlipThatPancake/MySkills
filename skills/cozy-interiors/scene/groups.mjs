// groups.mjs — a.group(phrase, opts): builds one roll group phrase as a small arrangement that already passes the checks.
//   a.group('sideboard or dresser with a still life and a picture', { wall: back, xc: 2400 })       // against a wall, xc along it as in place()
//   a.group('island or table with two stools', { at: [3000, 2400] })                                // free-standing groups take at: [x, z]
// Options: wall, xc | at; id (the ids' prefix, default from the phrase); group (the group name, default the prefix); seed (default the home's seed);
//   pieces: { <slot>: { asset, params, skip: true } } overrides one slot of the recipe (the slots are listed in RECIPES below, `node groups.mjs` prints them);
//   hero: true marks the main piece. Every choice the recipe makes (which furniture, how many things on top, the art above, which side the lamp stands) comes from the seed, so one seed gives one result and other seeds give other results.
// Returns { ids, slots }: what was placed. A slot the placement refused is left out and listed in `left`.
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngOf = (seed) => { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; };
const STILL = ['plant', 'bookStack', 'jug', 'keyBowl', 'candlesticks', 'fruitBowl'];   // low things for a top that carries art above it
const rnd = (r, lo, hi, step = 10) => Math.round((lo + r() * (hi - lo)) / step) * step;

// One recipe: { phrases: [the roll phrases it answers], slots: {slot: what it is}, make(c) }. c gives place/on/art helpers; each helper takes the slot name first so overrides apply.
const make = (a, phrase, o) => {
  const rec = recipeFor(phrase); if (!rec) throw new Error(`a.group: no recipe for "${phrase}"; node groups.mjs lists the phrases`);
  if (rec.needs?.free && !o.at) throw new Error(`a.group: "${phrase}" stands free on the floor: give { at: [x, z] } (a floor slot such as floor:middle), not a wall or a wall slot`);
  if (!rec.needs?.free && !o.wall) throw new Error(`a.group: "${phrase}" stands at a wall: give { wall, xc } or { slot }`);
  const prefix = o.id || rec.id, grp = o.group || prefix, seed = (o.seed ?? a.h.S?.seed ?? 1) + hash(prefix + phrase), r = rngOf(seed), ov = o.pieces || {}, placed = [], left = [];
  const slot = (name) => ov[name] || {}, skip = (name) => !!slot(name).skip;
  const fail = (name, e) => { left.push(`${name}: ${String(e.message || e).split(':').slice(0, 1)[0]}`); return null; };
  const c = {
    a, r, phrase, wall: o.wall, xc: o.xc, at: o.at, grp, pick: (list) => list[Math.floor(r() * list.length)], rnd: (lo, hi, step) => rnd(r, lo, hi, step), chance: (p) => r() < p, skip,
    asset: (name, list) => slot(name).asset || c.pick(list),
    // a wall piece or floor piece against the wall: slot, id suffix, asset (or list), xc, extra place() options
    place(name, suffix, assets, xc, ex = {}) { if (skip(name)) return null; const asset = slot(name).asset || (Array.isArray(assets) ? c.pick(assets) : assets), id = `${prefix}-${suffix}`;
      try { (o.wall).place(id, asset, xc, { group: grp, ...ex, ...(slot(name).params || ex.params ? { params: { ...(ex.params || {}), ...(slot(name).params || {}) } } : {}), ...(o.hero && name === rec.hero ? { hero: true } : {}) }); placed.push(id); return id; } catch (e) { return fail(name, e); } },
    // low level on the wall: ox along it, off out from it, turn added to the facing out from the wall (a chair in front of a desk turns 180)
    putW(name, suffix, assets, ox, off, turn, ex = {}) { if (skip(name)) return null; const asset = slot(name).asset || (Array.isArray(assets) ? c.pick(assets) : assets), id = `${prefix}-${suffix}`;
      try { o.wall.put(id, asset, ox, off, { turn, group: grp, ...ex, ...(slot(name).params || ex.params ? { params: { ...(ex.params || {}), ...(slot(name).params || {}) } } : {}) }); placed.push(id); return id; } catch (e) { return fail(name, e); } },
    put(name, suffix, assets, pos, turn, ex = {}) { if (skip(name)) return null; const asset = slot(name).asset || (Array.isArray(assets) ? c.pick(assets) : assets), id = `${prefix}-${suffix}`;
      try { a.put(id, asset, pos, turn, { group: grp, ...ex, ...(slot(name).params || ex.params ? { params: { ...(ex.params || {}), ...(slot(name).params || {}) } } : {}), ...(o.hero && name === rec.hero ? { hero: true } : {}) }); placed.push(id); return id; } catch (e) { return fail(name, e); } },
    // things on a top: the items shrink until they fit
    on(name, surfaceId, items, ex = {}) { if (!surfaceId || skip(name)) return []; let list = items.map((it, i) => ({ id: `${prefix}-${name}${i}`, ...it })), done = false;
      while (list.length && !done) { try { a.onTop(surfaceId, list, { group: grp, ...ex }); done = true; placed.push(...list.map((x) => x.id)); } catch (e) { list = list.slice(0, -1); } }
      if (!done && !ex.quiet) fail(name, new Error('nothing fits')); return done ? list : []; },
    pt: (ox, off) => o.wall.at(ox, off), hero: !!o.hero,
    dims: (id) => a.dims(id), top: (id) => a.topOf(id),
  };
  rec.make(c, { slot, ov });
  return { ids: placed, left, recipe: rec.id };
};

// art over a piece of furniture on the wall: picture, mirror, wall shelf or nothing. Width 0.5-0.8 of the piece (mirror to 0.9), bottom 200 mm over the top, centred.
const artOver = (c, name, fid, kinds, top0) => { if (!fid) return null; const d = c.dims(fid), top = top0 ?? c.top(fid);   // top0: the furniture's own top, measured before things stood on it (the top then reads the height of what stands in its middle) if (d.h > 1300) return null;
  const kind = c.asset(name, kinds), W = d.w, xc = c.xc;
  if (kind === 'picture') { const w = Math.max(400, Math.min(900, c.rnd(0.55 * W, 0.78 * W, 50))), h = Math.round(w * (c.chance(0.5) ? 0.75 : 1.2) / 10) * 10, prm = c.a.dealt('picture', { w, h: Math.min(h, 900) }); return c.place(name, 'art', 'picture', xc, { y: top + c.rnd(170, 230, 10) - c.a.frameLift(prm), params: prm }); }   // the dealt painting form fixes the frame's real bottom: hang by that
  if (kind === 'mirror') { const w = Math.max(450, Math.min(900, c.rnd(0.55 * W, 0.85 * W, 50))); return c.place(name, 'art', 'mirror', xc, { y: top + c.rnd(170, 230, 10), params: { w, h: Math.min(Math.round(w * 1.3 / 10) * 10, 1200) } }); }
  if (kind === 'wallShelf') { const w = Math.min(900, Math.max(500, Math.round(0.7 * W / 50) * 50)); return c.place(name, 'art', 'wallShelf', xc, { y: top + c.rnd(450, 580, 10), params: { w } }); }
  return null; };

const stillPool = (c, n) => { const pool = [...STILL], out = []; while (out.length < n && pool.length) out.push({ asset: pool.splice(Math.floor(c.r() * pool.length), 1)[0] }); return out; };

const ARM = (c) => { const shape = c.pick(['upholstered', 'upholstered', 'wing', 'lounge', 'sling', 'beanbag']); return { off: 485, params: { shape, d: 860 } }; };   // off: arms and backs stand up to 55 mm behind d/2, so a chair stands a little off the wall

const RECIPES = [
  { id: 'furnart', needs: { w: 1200, d: 550, wall: 'any' }, hero: 'furn', phrases: [
      'sideboard or dresser with a still life on top and a picture, shelf or mirror above', 'sideboard or dresser with a still life and a picture', 'console or sideboard with a still life under a picture', 'console or sideboard with a printer and a still life', 'wardrobe or chest of drawers with a still life and a mirror', 'cabinet with a plant on top', 'glazed cabinet with dishes and a plant', 'sideboard with a big mirror'],
    slots: { furn: 'the furniture (sideboard, console, chest, cabinet)', still: 'the things on top', art: 'the picture, mirror or shelf above', printer: 'a printer on the top (printer phrase)' },
    make(c, { slot }) { const ph = c.phrase;
      const kind = /wardrobe or chest/.test(ph) ? ['chestOfDrawers'] : /glazed/.test(ph) ? ['glazedCabinet'] : /cabinet with a plant/.test(ph) ? ['sideboard', 'glazedCabinet'] : /printer/.test(ph) ? ['sideboard'] : /console or sideboard/.test(ph) ? ['console', 'sideboard'] : ['sideboard', 'sideboard', 'console'];
      const fid = c.place('furn', 'furn', kind, c.xc, /printer/.test(ph) ? { params: { d: 500 } } : {}); if (!fid) return;
      const tall = c.dims(fid).h > 1300;
      const things = /printer/.test(ph) ? [{ asset: 'printer' }, ...stillPool(c, 1)] : /cabinet with a plant|glazed/.test(ph) ? [{ asset: 'plant' }] : stillPool(c, c.chance(0.4) ? 3 : 2);
      const top0 = c.top(fid); c.on('still', fid, things);
      if (!tall && !/printer/.test(ph)) artOver(c, 'art', fid, /mirror/.test(ph) && /wardrobe|chest|big mirror/.test(ph) ? ['mirror'] : /picture, shelf or mirror/.test(ph) ? ['picture', 'picture', 'mirror', 'wallShelf'] : /picture/.test(ph) ? ['picture'] : ['picture'], top0);
      else if (/printer/.test(ph)) artOver(c, 'art', fid, ['picture', 'wallShelf'], top0);
    } },
];

// a seat with a lamp on one side and a small table on the other (sides drawn from the seed)
const seatSides = (c, seat, lamp, tableAsset, topItems) => { const sd = c.dims(seat), flip = c.chance(0.5) ? -1 : 1, half = sd.w / 2;
  const lamps = c.place('lamp', 'lamp', lamp, c.xc + flip * (half + 280)), tid = c.place('table', 'table', tableAsset, c.xc - flip * (half + 330), { params: { r: c.rnd(230, 290, 10) } });
  if (tid && topItems) c.on('top', tid, topItems.slice(0, 1 + (c.chance(0.4) ? 1 : 0))); return { lamps, tid }; };

const benchOver = (c, bid, art, topY = 450) => { if (!bid) return; const d = c.dims(bid), top = topY, W = d.w;
  if (art === 'picture') { const w = Math.max(400, Math.round(c.rnd(0.52 * W, 0.78 * W, 50))); const h = Math.round(w * (c.chance(0.5) ? 0.75 : 1.1) / 10) * 10; c.place('art', 'art', 'picture', c.xc, { y: Math.round(1500 - h / 2), params: { w, h } }); }   // eye level: a bench's top is soft and low, so the picture hangs at 1500 in the middle, not by the bench
  else if (art === 'shelf') c.place('art', 'art', 'wallShelf', c.xc, { y: top + c.rnd(450, 580, 10), params: { w: Math.min(900, Math.round(0.75 * W / 50) * 50) } });
  else if (art === 'hooks') c.place('art', 'art', 'coatHooks', c.xc, { y: 1550, params: { w: Math.min(900, Math.round(0.8 * W / 50) * 50) } }); };

RECIPES.push(
  { id: 'plantcorner', needs: { w: 900, d: 600, wall: 'any' }, hero: 'plant', phrases: ['plant corner: a floor plant on a plant stand, or with a basket beside it', 'plant corner: a floor plant with a basket or pouf', 'plant corner: a floor plant with a basket', 'plant corner: a floor plant on a plant stand'],
    slots: { plant: 'the floor plant or the plant stand', stand: 'a plant on a stand', soft: 'the basket or pouf beside it' },
    make(c) { const ph = c.phrase, stand = /plant stand/.test(ph) && (!/or with a basket/.test(ph) || c.chance(0.5));
      if (stand) { const r = c.rnd(190, 240, 10); c.place('plant', 'stand', 'plantStand', c.xc, { off: r + 14, params: { r } }); }   // the stand carries its own potted plant
      else c.place('plant', 'plant', 'floorPlant', c.xc);
      const side = c.chance(0.5) ? -1 : 1; c.place('soft', 'soft', /basket or pouf/.test(ph) ? ['basket', 'pouf'] : 'basket', c.xc + side * 640); } },
  { id: 'armchair', needs: { w: 2400, d: 900, wall: 'any' }, hero: 'seat', phrases: ['armchair with a floor lamp and a side table', 'armchair or sofa with a lamp and a side table', 'reading corner: armchair, floor lamp and a book stack'],
    slots: { seat: 'the armchair or sofa', lamp: 'the floor lamp', table: 'the side table', top: 'the things on the table' },
    make(c) { const ph = c.phrase, asset = c.asset('seat', /sofa/.test(ph) ? ['armchair', 'sofa'] : /reading/.test(ph) ? ['armchair', 'readingChair'] : ['armchair']), seat = c.place('seat', 'seat', asset, c.xc, asset === 'armchair' ? ARM(c) : {}); if (!seat) return;
      if (/reading/.test(ph)) { const sd = c.dims(seat), flip = c.chance(0.5) ? -1 : 1; c.place('lamp', 'lamp', 'floorLamp', c.xc + flip * (sd.w / 2 + 280)); c.place('books', 'books', 'floorBooks', c.xc - flip * (sd.w / 2 + 330)); return; }
      seatSides(c, seat, 'floorLamp', 'sideTable', [{ asset: 'plant', params: { form: Math.floor(c.r() * 5) } }, { asset: 'keyBowl' }].sort(() => c.r() - 0.5)); } },
  { id: 'sidechair', needs: { w: 1900, d: 700, wall: 'any' }, hero: 'seat', phrases: ['side chair with a lamp and a small table', 'side table with a lamp and a cup, a pouf beside it'],
    slots: { seat: 'the chair', table: 'the small table', top: 'lamp and cup', soft: 'the pouf' },
    make(c) { const ph = c.phrase;
      if (/side table with a lamp/.test(ph)) { const t = c.place('table', 'table', 'sideTable', c.xc, { params: { r: c.rnd(250, 290, 10) } }); if (t) c.on('top', t, [{ asset: 'bedsideLamp' }, { asset: 'mug' }]); c.place('soft', 'soft', 'pouf', c.xc + (c.chance(0.5) ? -1 : 1) * 700); return; }
      const sa = c.asset('seat', ['chair', 'armchair']), seat = c.place('seat', 'seat', sa, c.xc, sa === 'armchair' ? ARM(c) : {}); if (!seat) return; const sd = c.dims(seat), flip = c.chance(0.5) ? -1 : 1; const t = c.place('table', 'table', 'sideTable', c.xc + flip * (sd.w / 2 + 330), { params: { r: c.rnd(250, 290, 10) } }); if (t) c.on('top', t, [{ asset: 'bedsideLamp' }]); } },
  { id: 'benchgroup', needs: { w: 1500, d: 600, wall: 'any' }, hero: 'bench', phrases: ['bench under a picture, with a cushion and a basket', 'bench at a wall with a blanket and a basket', 'bench or window seat with cushions', 'window seat or bench with cushions', 'coat hooks with a bench, shoes and an umbrella stand', 'shelf with baskets above a bench', 'coat hooks over a bench'],
    slots: { bench: 'the bench or window seat', art: 'the picture, shelf or hooks above', cushion: 'the cushions on it', basket: 'the basket beside it', extra: 'shoes, umbrella stand' },
    make(c) { const ph = c.phrase, ws = /window seat/.test(ph) && c.chance(0.6), id = c.place('bench', 'bench', ws ? 'windowSeat' : 'bench', c.xc, ws || !/cushion|blanket/.test(ph) ? {} : { params: { form: c.pick(['plank', 'trestle', 'upholstered']) } }); if (!id) return; const d = c.dims(id), half = d.w / 2, side = c.chance(0.5) ? -1 : 1;
      if (ws) { c.place('basket', 'basket', ['basket', 'pouf'], c.xc + side * (half + 330)); return; }
      let topY = 450, on = [];
      if (/cushion/.test(ph) || /picture, with/.test(ph) || /blanket/.test(ph)) on = c.on('cushion', id, [{ asset: 'benchCushion', params: { w: Math.max(500, Math.round((d.w - 160) / 10) * 10), d: Math.max(200, Math.round((d.d - 110) / 10) * 10) } }, ...(c.chance(0.5) && d.w > 1150 ? [{ asset: 'cushion', params: { lean: 18 } }] : [])].slice(0, /blanket|picture/.test(ph) ? 1 : 2), { at: 'back', margin: 20 }); for (const it of on || []) { try { topY = Math.max(topY, c.top(it.id)); } catch {} }
      benchOver(c, id, /picture/.test(ph) ? 'picture' : /hooks/.test(ph) ? 'hooks' : /shelf with/.test(ph) ? 'shelf' : null, topY);
      if (/basket/.test(ph)) c.place('basket', 'basket', 'basket', c.xc + side * (half + 330));
      if (/shoes/.test(ph)) { c.place('extra', 'shoes', 'shoes', c.xc + side * (half + 420), { off: 160, params: { arrange: 'neat', kind: 'sneaker' } }); c.place('extra', 'umb', 'umbrellaStand', c.xc - side * (half + 220)); } } },
  { id: 'shelfunit', needs: { w: 1100, d: 400, wall: 'any' }, hero: 'shelf', phrases: ['bookcase or shelf unit with books and objects', 'bookcase with books and objects', 'bookshelf with files and objects'],
    slots: { shelf: 'the bookcase', plant: 'a plant or basket beside it' },
    make(c) { const id = c.place('shelf', 'shelf', 'shelf', c.xc); if (!id) return; const d = c.dims(id); c.place('plant', 'plant', c.pick(['floorPlant', 'basket']), c.xc + (c.chance(0.5) ? -1 : 1) * (d.w / 2 + 420)); } },
  { id: 'trolley', needs: { w: 1500, d: 650, wall: 'any' }, hero: 'trolley', phrases: ['bar cart or trolley with bottles and glasses', 'tall unit or fridge with a trolley beside it'],
    slots: { tall: 'the fridge or tall unit', trolley: 'the trolley', top: 'what stands on it' },
    make(c) { const ph = c.phrase; let xc = c.xc, f = null;
      if (/tall unit/.test(ph)) { f = c.place('tall', 'tall', 'fridge', c.xc, { params: { form: 1 } }); if (!f) return; xc = c.xc + (c.chance(0.5) ? -1 : 1) * (c.dims(f).w / 2 + 325 + 150); }   // fridge half + trolley half (650 wide) + a 150 mm gap
      const t = c.place('trolley', 'trolley', 'trolley', xc);
      if (t && f) { const gap = Math.abs(xc - c.xc) - (c.dims(f).w + c.dims(t).w) / 2;   // both xc are middles along the wall (a fridge's `at` is its left corner, so compare the xc, not `at`)
        if (gap < 100) throw new Error(`a.group: the trolley stands ${Math.round(gap)} mm from the fridge (it needs 100 mm of air)`); }
      if (t) c.on('top', t, /bar cart/.test(ph) ? [{ asset: 'jug' }, { asset: 'mug' }] : [{ asset: 'fruitBowl' }, { asset: 'mug' }]); } },
  { id: 'openshelf', needs: { w: 1200, d: 450, wall: 'any' }, hero: 'shelf', phrases: ['open shelves with jars and a plant'],
    slots: { shelf: 'the open shelf', plant: 'the floor plant under or beside it' },
    make(c) { c.place('shelf', 'shelf', ['openShelf', 'wallShelf'], c.xc, { y: c.rnd(1350, 1550, 10) }); c.place('plant', 'plant', 'floorPlant', c.xc + (c.chance(0.5) ? -1 : 1) * 900); } },
  { id: 'desk', needs: { w: 1800, d: 900, wall: 'any' }, hero: 'desk', phrases: ['desk or dressing table with a stool and a lamp'],
    slots: { desk: 'the desk', seat: 'the stool', lamp: 'the lamp on it' },
    make(c) { const id = c.place('desk', 'desk', 'desk', c.xc); if (!id) return; const d = c.dims(id); { const at = c.chance(0.5) ? 'back' : 'centre'; for (const margin of [100, 50, 20]) if (c.on('lamp', id, [{ asset: 'taskLamp', params: { pose: 'upright' } }], { at, margin, quiet: margin > 20 }).length) break; } c.putW('seat', 'seat', 'stool', c.xc + (c.chance(0.5) ? -1 : 1) * Math.round(d.w / 2 + 240), Math.round(d.d / 2), 0, { params: { form: 1 } }); } },
  { id: 'console', needs: { w: 1100, d: 400, wall: 'any' }, hero: 'console', phrases: ['console with a mirror, a key bowl and a plant', 'console with a mirror'],
    slots: { console: 'the console', top: 'key bowl and plant', art: 'the mirror' },
    make(c) { const id = c.place('console', 'console', 'console', c.xc); if (!id) return; const top0 = c.top(id); c.on('top', id, [{ asset: 'keyBowl' }, { asset: 'plant' }]); artOver(c, 'art', id, ['mirror'], top0); } },
  { id: 'island', needs: { w: 2200, d: 1800, free: true, foreground: true }, hero: 'table', free: true, phrases: ['island or table with two stools'],
    slots: { table: 'the table', stool: 'the two stools' },
    make(c) { const [x, z] = c.at, w = c.rnd(1100, 1500, 50), d = c.rnd(700, 850, 50);
      c.put('rug', 'rug', 'rug', [x, z + 80], 0, { params: { w: w + 1500, d: d + 1500 } });
      const t = c.put('table', 'table', ['table', 'table'], [x, z], 0, { params: { w, d } }); if (!t) return;
      for (const [k, sx] of [[1, -w / 4], [2, w / 4]]) c.put('stool', `stool${k}`, 'stool', [x + sx, z + d / 2 + 190 + 90], 180, { params: { form: 1 } }); } },
);

// hero groups (item 4): the dealt hero phrases of tables.json, one recipe each. A hero stands on the back wall's third (slot back:left | back:right); what stands in front of it is placed by the wall's own frame: c.pt(ox, off) is the area point ox along and off out from the wall.
const sofaSides = (c, sofa) => { const sd = c.dims(sofa); return { sd, half: sd.w / 2 }; };
const heroRug = (c, name, W, off, d = 1700, dx = 0) => c.put(name, 'rug', 'rug', c.pt(c.xc + dx, off), 0, { params: { w: Math.min(3200, Math.max(1800, Math.round((W + 700) / 100) * 100)), d } });
RECIPES.push(
  { id: 'sofaset', needs: { w: 3200, d: 2400, wall: 'any' }, hero: 'seat', phrases: ['sofa with a rug and coffee table', 'sofa with an armchair, a rug and a coffee table', 'sofa under a window with a side table and a rug'],
    slots: { seat: 'the sofa', rug: 'the rug under the front', table: 'the coffee table', arm: 'the armchair', side: 'the side table', top: 'things on a table' },
    make(c) { const ph = c.phrase, sofa = c.place('seat', 'seat', 'sofa', c.xc, {}); if (!sofa) return; const { sd, half } = sofaSides(c, sofa);
      heroRug(c, 'rug', sd.w, Math.round(sd.d / 2 + 880), 1800);
      if (/side table/.test(ph)) { const t = c.place('side', 'side', 'sideTable', c.xc + (c.chance(0.5) ? -1 : 1) * (half + 820), { params: { r: c.rnd(230, 290, 10) } }); if (t) c.on('top', t, [{ asset: 'plant', params: { form: Math.floor(c.r() * 5) } }]); }
      else { try { c.a.coffeeTable('ct', sofa, { group: c.grp }); } catch (e) { /* a sofa with no clear seat front gets no coffee table */ } }
      if (/armchair/.test(ph)) { const sx = c.chance(0.5) ? -1 : 1; c.putW('arm', 'arm', 'armchair', c.xc + sx * (half + 330), Math.round(sd.d / 2 + 1700), sx > 0 ? 90 : -90, { params: { shape: 'upholstered' } }); } } },
  { id: 'twoarm', needs: { w: 3000, d: 1000, wall: 'any' }, hero: 'seat', phrases: ['two armchairs and a side table'],
    slots: { seat: 'the left armchair', seat2: 'the right armchair', table: 'the side table between' },
    make(c) { const a1 = c.place('seat', 'seat1', 'armchair', c.xc - 900, ARM(c)), a2 = c.place('seat2', 'seat2', 'armchair', c.xc + 900, ARM(c)); if (!a1 || !a2) return; const t = c.place('table', 'table', 'sideTable', c.xc, { params: { r: c.rnd(230, 270, 10) } }); if (t) c.on('top', t, [{ asset: 'plant' }]); } },
  { id: 'shelfwall', needs: { w: 3000, d: 1100, wall: 'solid' }, hero: 'shelf', phrases: ['shelf wall with an armchair', 'sofa facing a shelf wall, with a rug'],
    slots: { shelf: 'the shelf wall', seat: 'the armchair or sofa', rug: 'the rug' },
    make(c) { const sofa = /sofa/.test(c.phrase); const sh = c.place('shelf', 'shelf', 'shelf', sofa ? c.xc : c.xc - 600, { params: { w: sofa ? 1500 : 1300 } }); if (!sh) return;
      if (sofa) { const sd = c.a.dealt('sofa', {}); c.putW('seat', 'seat', 'sofa', c.xc + 1400, 2300, 180); heroRug(c, 'rug', 2000, 1500, 1800, 1400); }
      else c.place('seat', 'seat', 'armchair', c.xc + 900, ARM(c)); } },
  { id: 'diningset', needs: { w: 3000, d: 2800, wall: 'any' }, hero: 'table', phrases: ['long table under a pendant', 'round table on a rug'],
    slots: { table: 'the table and its chairs', pendant: 'the pendant' },
    make(c) { const round = /round/.test(c.phrase), r = c.rnd(550, 650, 25), w = c.rnd(1800, 2200, 100), d = round ? 2 * r : 900, at = c.pt(c.xc, Math.round(d / 2 + 760 + 700)), t = c.a.table('table', round ? { at, r, chairs: 4, rug: true, group: c.grp } : { at, w, d, chairs: 6, rug: !c.chance(0.5), group: c.grp });
      if (!round && !c.skip('pendant')) { try { t.over('pendantLamp'); } catch (e) { c.left.push('pendant: ' + String(e.message).split(':')[0]); } } } },
  { id: 'bedset', needs: { w: 3400, d: 2400, wall: 'solid' }, hero: 'bed', phrases: ['bed with a headboard on the backing wall', 'bed with a bedside table each side, headboard on a wall without a window', 'bed with its headboard on the second wall (the back wall holds the window)', 'bed with its headboard on a side wall (the back wall holds the window)'],
    slots: { bed: 'the bed', table: 'the bedside tables', lamp: 'the lamps' },
    make(c) { const bed = c.place('bed', 'bed', 'bed', c.xc, {}); if (!bed) return; const bd = c.dims(bed), both = /each side/.test(c.phrase);
      for (const [k, sx] of both ? [[1, -1], [2, 1]] : [[1, c.chance(0.5) ? -1 : 1]]) { const t = c.place('table', `bt${k}`, 'bedsideTable', c.xc + sx * (bd.w / 2 + 300)); if (t) c.on('lamp', t, [{ asset: 'bedsideLamp' }], { at: 'centre', margin: 10 }); } } },
  { id: 'readset', needs: { w: 2600, d: 1600, wall: 'any' }, hero: 'seat', phrases: ['daybed under shelves', 'reading chair with a footstool and a floor lamp', 'window seat with pillows and a reading lamp'],
    slots: { seat: 'the daybed, chair or window seat', art: 'the shelves above', lamp: 'the lamp', foot: 'the footstool' },
    make(c) { const ph = c.phrase;
      if (/daybed/.test(ph)) { const d = c.place('seat', 'seat', 'daybed', c.xc, {}); if (!d) return; const w = c.dims(d).w; c.place('art', 'art', ['readShelf', 'openShelf'], c.xc, { y: 1300 }); c.place('lamp', 'lamp', 'floorLamp', c.xc + (c.chance(0.5) ? -1 : 1) * (w / 2 + 280)); return; }
      if (/reading chair/.test(ph)) { const ch = c.place('seat', 'seat', 'readingChair', c.xc, {}); if (!ch) return; const w = c.dims(ch).w; c.place('lamp', 'lamp', 'floorLamp', c.xc + (c.chance(0.5) ? -1 : 1) * (w / 2 + 300)); c.putW('foot', 'foot', 'footstool', c.xc, 1100, 180); return; }
      const ws = c.place('seat', 'seat', 'windowSeat', c.xc, {}); if (!ws) return; const d = c.dims(ws); c.on('pillow', ws, [{ asset: 'benchCushion', params: { w: Math.max(500, Math.round((d.w - 160) / 10) * 10), d: Math.max(200, Math.round((d.d - 110) / 10) * 10) } }], { at: 'back', margin: 20, quiet: true }); c.place('lamp', 'lamp', 'wallSconce', c.xc + (d.w / 2 + 300), { y: 1500 }); } },
  { id: 'shoerack', needs: { w: 1500, d: 700, wall: 'any', door: true }, hero: 'rack', phrases: ['shoe rack by the door', 'coat stand and a runner'],
    slots: { rack: 'the shoe rack or coat stand', extra: 'shoes, boots, runner' },
    make(c) { if (/shoe rack/.test(c.phrase)) { const r = c.place('rack', 'rack', 'shoeRack', c.xc, {}); if (!r) return; c.place('extra', 'shoes', 'shoes', c.xc + c.dims(r).w / 2 + 380, { off: 200, params: { arrange: 'neat', kind: 'sneaker' } }); }
      else { const s = c.place('rack', 'stand', 'coatStand', c.xc, {}); if (!s) return; c.put('extra', 'runner', 'runner', c.pt(c.xc + 600, 1200), 0, {}); } } },
  { id: 'officeset', needs: { w: 2400, d: 1100, wall: 'any' }, hero: 'desk', phrases: ['desk under a window', 'desk with a shelf wall', 'trestle desk with a pinboard above', 'writing desk in a corner'],
    slots: { desk: 'the desk', seat: 'the chair', art: 'the pinboard or shelves', top: 'things on the desk' },
    make(c) { const ph = c.phrase, id = c.place('desk', 'desk', 'desk', c.xc, /trestle/.test(ph) ? { params: { form: 'trestle' } } : {}); if (!id) return; const d = c.dims(id), top0 = c.top(id);
      c.on('top', id, [{ asset: c.pick(['laptop', 'monitor']) }, { asset: 'notebook' }].slice(0, 2));
      c.putW('seat', 'seat', 'deskChair', c.xc, Math.round(d.d / 2 + 460), 180);
      if (/pinboard/.test(ph)) c.place('art', 'art', 'pinboard', c.xc, { y: top0 + 350 });
      if (/shelf wall/.test(ph)) { c.place('art', 'art', ['readShelf', 'openShelf'], c.xc, { y: 1300 }); c.place('art', 'side', 'shelf', c.xc + d.w / 2 + 700, {}); } } },
  { id: 'dresser', needs: { w: 2200, d: 500, wall: 'any' }, hero: 'dresser', phrases: ['open shelves and a dresser'],
    slots: { furn: 'the dresser', shelf: 'the open shelves above', still: 'the things on top' },
    make(c) { const f = c.place('furn', 'furn', 'sideboard', c.xc - 500, {}); if (!f) return; c.on('still', f, stillPool(c, 2)); c.place('shelf', 'shelf', 'openShelf', c.xc + 700, { y: 1300 }); } },
  { id: 'breakfast', needs: { w: 2600, d: 1800, wall: 'any', window: true }, hero: 'table', phrases: ['breakfast table by the window'],
    slots: { table: 'the small table and two chairs' },
    make(c) { c.a.table('table', { at: c.pt(c.xc, 1100), w: 900, d: 700, chairs: 2, rug: false, group: c.grp }); } },
  { id: 'kitchenrun', needs: { w: 3000, d: 700, wall: 'any' }, hero: 'run', phrases: ['range hood over the hob', 'tall pantry wall', 'window over the sink'],
    slots: { run: 'the cabinet run', hood: 'the hood over the hob', tall: 'the pantry units' },
    make(c) { const ph = c.phrase, mods = /pantry/.test(ph) ? [{ w: 600, kind: 'doors' }, { w: 900, kind: 'drawers', n: 3 }, { w: 600, kind: 'doors' }] : /sink/.test(ph) ? [{ w: 600, kind: 'doors' }, { w: 900, kind: 'sink' }, { w: 600, kind: 'drawers', n: 3 }, { w: 600, kind: 'doors' }] : [{ w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'hob' }, { w: 600, kind: 'doors' }];
      const len = mods.reduce((s, m) => s + m.w, 0), left = Math.max(60, Math.round((c.xc - len / 2) / 10) * 10), R = c.a.run(c.wall, 'run', left, mods, { group: c.grp, hero: !!c.hero });
      if (/hood/.test(ph)) { R.on('hob', 'hob'); R.on('hob', 'hood'); R.on('hob', 'pan'); }
      else if (/sink/.test(ph)) { R.on('sink', 'kettle'); }
      if (/pantry/.test(ph)) c.place('tall', 'pantry', 'wardrobe', left + len + 450, {}); } },
);

const phraseSets = RECIPES.map((r) => new Set(r.phrases));
const recipeFor = (phrase) => RECIPES.find((r, i) => phraseSets[i].has(phrase));

// second: stands on the window wall or the second wall (the back wall holds the window)
// what a recipe asks of its place (item C, the vocabulary of a.slots()): w, d = footprint in mm (w along the wall); wall: 'any' | 'solid' (no window or door behind it); free: stands on the floor away from a wall; door: near an outside door; window: near a window; foreground: may stand in the near strip
const PHRASE_NEEDS = { 'bed with its headboard on the second wall (the back wall holds the window)': { wall: 'solid', second: true }, 'bed with its headboard on a side wall (the back wall holds the window)': { wall: 'solid', second: true }, 'sofa under a window with a side table and a rug': { window: true }, 'window over the sink': { window: true }, 'bed with a headboard on the backing wall': { wall: 'solid' }, 'desk under a window': { window: true }, 'window seat with pillows and a reading lamp': { window: true }, 'coat hooks over a bench': { door: true }, 'tall pantry wall': { wall: 'solid', w: 2200 }, 'reading corner: armchair, floor lamp and a book stack': { window: true }, 'coat hooks with a bench, shoes and an umbrella stand': { door: true, w: 2300 }, 'tall unit or fridge with a trolley beside it': { wall: 'solid' }, 'wardrobe or chest of drawers with a mirror': { wall: 'solid' } };
// What a phrase really builds, where that is more than its recipe's needs (groupbuild --measure prints it; groupbuild fails a build wider or deeper than this).
const PHRASE_FOOT = {"sideboard or dresser with a still life on top and a picture, shelf or mirror above": {"w": 1600}, "sideboard or dresser with a still life and a picture": {"w": 1600}, "console or sideboard with a still life under a picture": {"w": 1600}, "console or sideboard with a printer and a still life": {"w": 1600}, "cabinet with a plant on top": {"w": 1600}, "glazed cabinet with dishes and a plant": {"w": 1300}, "sideboard with a big mirror": {"w": 1600}, "plant corner: a floor plant on a plant stand, or with a basket beside it": {"w": 1300, "d": 700}, "plant corner: a floor plant with a basket or pouf": {"w": 1300, "d": 700}, "plant corner: a floor plant with a basket": {"w": 1300, "d": 700}, "plant corner: a floor plant on a plant stand": {"w": 1200}, "armchair with a floor lamp and a side table": {"d": 1000}, "armchair or sofa with a lamp and a side table": {"w": 3200, "d": 1750}, "reading corner: armchair, floor lamp and a book stack": {"d": 950}, "side chair with a lamp and a small table": {"d": 950}, "bench under a picture, with a cushion and a basket": {"w": 1800}, "bench at a wall with a blanket and a basket": {"w": 1800}, "bench or window seat with cushions": {"w": 2300}, "window seat or bench with cushions": {"w": 2300}, "coat hooks with a bench, shoes and an umbrella stand": {"w": 2300}, "shelf with baskets above a bench": {"w": 1800}, "bookcase or shelf unit with books and objects": {"w": 1800, "d": 700}, "bookcase with books and objects": {"w": 1800, "d": 700}, "bookshelf with files and objects": {"w": 1800, "d": 700}, "tall unit or fridge with a trolley beside it": {"d": 700}, "open shelves with jars and a plant": {"d": 700}, "desk or dressing table with a stool and a lamp": {"w": 2100}, "island or table with two stools": {"w": 3000}, "sofa with an armchair, a rug and a coffee table": {"w": 3300, "d": 2650}, "sofa under a window with a side table and a rug": {"w": 3600}, "sofa facing a shelf wall, with a rug": {"w": 3500, "d": 2800}, "shoe rack by the door": {"w": 1700}, "coat stand and a runner": {"d": 2800}, "desk under a window": {"d": 1150}, "desk with a shelf wall": {"w": 2900, "d": 1150}, "trestle desk with a pinboard above": {"d": 1150}, "writing desk in a corner": {"d": 1150}};
export const groupNeeds = (phrase) => { const r = recipeFor(phrase); return r ? { ...r.needs, ...(PHRASE_FOOT[phrase] || {}), ...(PHRASE_NEEDS[phrase] || {}) } : null; };
export const groupPhrases = () => RECIPES.flatMap((r) => r.phrases);
export const group = (a, phrase, o = {}) => { const rec = recipeFor(phrase); if (!rec) throw new Error(`a.group: no recipe for "${phrase}"`); return make(a, phrase, o); };
export { RECIPES };

if (process.argv[1] === fileURLToPath(import.meta.url)) { for (const r of RECIPES) { console.log(`${r.id}: ${Object.entries(r.slots).map(([k, v]) => `${k} (${v})`).join(', ')}`); console.log(`   needs ${JSON.stringify(r.needs)}`); for (const p of r.phrases) console.log(`   - ${p}`); } }

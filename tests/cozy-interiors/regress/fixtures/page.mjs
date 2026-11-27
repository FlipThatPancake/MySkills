// Round 6 page and tools (tools thread): what the page draws at rest and what stands on a faded piece. The switches `supportFade` and `passageView` (compose.mjs) turn the fix off, so each bug fixture shows the old page; the good fixture shows the page as built.
import { roll } from '../../../../skills/cozy-interiors/scene/roll.mjs';

// a hallway with a door to the bedroom and a way to the living room, as the round-6 plan builds them (plan.mjs homeOf, without furniture)
const passageHome = (Home, crowd = false) => {   // crowd: wardrobes in every room, so a leak of the room behind shows in pixels (the good fixture stays bare: wardrobes there break the placement rules)
  const R = roll(10, ['hallway', 'living', 'bedroom'], { rooms: [['hallway'], ['living'], ['bedroom']], touch: [['hallway', 'living'], ['hallway', 'bedroom']] }), H = new Home({ seed: 10 });
  H.roll({ seed: 10, plan: R.plan, openPlan: R.openPlan, areas: {} });
  for (const id of R.plan.order) { const pa = R.plan.areas[id], [w, d] = pa.fit.map((v) => Math.round(v)); const a = H.area(id, id, { rect: [0, 0, w, d] }); a.back(w); a.left(d); a.right(d); if (crowd) for (const f of [0.2, 0.5, 0.8]) a.put(`wd${id}${f}`, 'wardrobe', [Math.round(w * f), 800], 0, { group: 'g' }); }
  return H;
};

// a wardrobe stands between the camera and the sofa when the camera swings round, with a vase on it
const tableRoom = (Home, supportFade, keepHomeView = true, az = 0) => {
  const H = new Home({ seed: 5, floor: 'plain', detached: true, supportFade, keepHomeView }), a = H.area('t', 'T', { rect: [0, 0, 6000, 4500] }); a.back(6000); a.left(4500); a.right(4500);
  a.put('sofa', 'sofa', [3000, 700], 0, { group: 'seat', hero: true, params: { seats: 3, arms: 'rolled', back: 'tight' } });
  a.put('tb', 'wardrobe', [3000, 2600], 0, { group: 'store' });
  a.put('vase', 'vase', [3000, 2600], 0, { group: 'store', mount: 'on', y: 2100, params: { form: 1 } });
  a.view({ target: [3000, 600, 800], az: 0, el: 18 });
  return H;
};

// a furnished hallway with a window on the wall beside the arch: with the clip on, the kitchen-side pieces show through the arch only
// a picture on the right wall; the camera swings out past that wall
const wallPic = (Home, wallHang) => {
  const H = new Home({ seed: 5, floor: 'plain', detached: true, wallHang }), a = H.area('t', 'T', { rect: [0, 0, 6000, 4500] }); a.back(6000); a.left(4500); const Fr = a.right(4500);
  a.put('sofa', 'sofa', [3000, 700], 0, { group: 'seat', hero: true, params: { seats: 3, arms: 'rolled', back: 'tight' } });
  Fr.place('pic', 'picture', 2250, { group: 'seat', y: 1000 });
  a.view({ target: [3000, 600, 800], az: 20, el: 18 });
  return H;
};

export const fixtures = [
  { name: 'orbit-room-behind-an-arch-is-not-drawn', from: 'round 6 (Paul): behind the hallway arch nothing was drawn at rest, so from an angle the opening showed empty white; here the room behind is switched off (passageView false)', kind: 'bug', expect: { rules: ['orbit'], ids: ['the room behind is not drawn'] },
    build({ Home }) { const H = passageHome(Home); H.passageView = false; return H; } },
  { name: 'good-orbit-room-behind-an-arch-is-drawn', from: 'round 6 (Paul): the first room beyond an arch or a door is drawn while the camera stands on this side of it (area-run sync)', kind: 'good', counts: ['orbit'],
    build({ Home }) { return passageHome(Home); } },
  { name: 'orbit-vase-hangs-over-a-faded-table', from: 'round 6 (Paul, item 16): the table faded out of the kitchen home view and its vase stayed, hanging in the air; here what stands on a faded piece does not go with it (supportFade false)', kind: 'bug', expect: { rules: ['orbit'], ids: ['vase'] },
    build({ Home }) { return tableRoom(Home, false); } },
  { name: 'good-orbit-vase-fades-with-its-table', from: 'round 6 (Paul, item 16): a faded table takes its vase along (home.js supportOf)', kind: 'good', counts: ['orbit'],
    build({ Home }) { return tableRoom(Home, true); } },
  { name: 'orbit-room-behind-an-arch-shows-past-the-opening', from: 'round 6 (lead): the room behind the hallway arch showed through a window and past the wall where the hallway has none; here the stencil clip is switched off (portalClip false)', kind: 'bug', expect: { rules: ['orbit'], ids: ['outside the opening'] },
    build({ Home }) { const H = passageHome(Home, true); H.portalClip = false; return H; } },
  { name: 'orbit-home-view-fades-a-grouped-piece', from: 'round 6 (lead): the kitchen table, in the area own group, was drawn at 0% in the home view (and later half transparent); here the home view keeps nothing drawn (keepHomeView false), so the sideboard in the camera line fades', kind: 'bug', expect: { rules: ['orbit'], ids: ['tb'] },
    build({ Home }) { return tableRoom(Home, true, false); } },
  { name: 'good-orbit-home-view-keeps-its-groups-drawn', from: 'round 6 (lead): the same sideboard stays at full opacity in the home view', kind: 'good', counts: ['orbit'],
    build({ Home }) { return tableRoom(Home, true, true); } },
  { name: 'orbit-picture-stays-when-its-wall-fades', from: 'round 6 (lead): the hallway hat stayed in the air where its wall had faded; here a piece on the right wall no longer goes with the wall (wallHang false), and the camera swings out past that wall', kind: 'bug', expect: { rules: ['orbit'], ids: ['pic'] },
    build({ Home }) { return wallPic(Home, false); } },
  { name: 'good-orbit-picture-fades-with-its-wall', from: 'round 6 (lead): a piece hung on a wall fades with it', kind: 'good', counts: ['orbit'],
    build({ Home }) { return wallPic(Home, true); } },
];

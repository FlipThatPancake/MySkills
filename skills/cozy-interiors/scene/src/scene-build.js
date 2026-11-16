// @js:scene-build — scene.json -> three.js objects, no page needed: the room shell plus every object from the registry.
// scene.json = { seed, plan: { height, thickness, rooms, openings }, objects: [{ id, asset, at: [x, y, z], turn (deg about the vertical), mount, params, detail }], camera: {...} }
import { roomShell } from './shell.js';
import { REGISTRY } from './library/index.js';

// opts.assets limits the build to those asset names (node checks build only the runs: some assets need a page's canvas).
export function buildScene(kit, S, opts = {}) {
  const root = kit.group(), objects = {};
  const shell = S.plan ? roomShell(kit, S.plan) : kit.group();
  for (const o of S.objects || S.home?.objects || []) {
    if (opts.assets && !opts.assets.includes(o.asset)) continue;
    const make = REGISTRY[o.asset];
    if (!make) throw new Error(`scene.json: unknown asset "${o.asset}" (object "${o.id}"); known assets: ${Object.keys(REGISTRY).join(', ')}`);
    const g = make(kit, { ...o.params });
    g.rotation.y = (o.turn || 0) * Math.PI / 180;
    g.position.set(...(o.at || [0, 0, 0]));
    g.userData.scene = o;
    objects[o.id] = g; root.add(g);
  }
  const openables = Object.values(objects).flatMap((g) => g.userData.openables || []);
  return { shell, root, objects, openables };
}

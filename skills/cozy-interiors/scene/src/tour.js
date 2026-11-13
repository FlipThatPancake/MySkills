// @js:scene-tour — what the camera does while nobody touches the page, like a short film:
// 1. after `after` s idle: a slow sway round the home view, eased in from where the camera stands;
// 2. `cutsAfter` s into the sway: a hard cut to a new shot every `cutEvery` s (a close-up of an object or an area), each with a small move of its own;
// 3. any input: the sway stops on the spot, or, once cuts have started, the camera eases back to the home view and hands over to the orbit controls.
// Shots come from scene.json's `camera.shots`: an object id, or { look: [x, y, z] mm, size: mm, from: [azimuth, elevation] deg } for an area. Each shot is framed from its object's true size
// and tried from several angles; an angle where another object blocks the view, or where the camera would leave the room, is skipped.
export function createTour({ THREE, camera, controls, room, home, cfg }) {
  const rad = THREE.MathUtils.degToRad, R = room.userData.SCENE.room;
  const C = { after: 12, cutsAfter: 12, cutEvery: 4, swayDeg: 25, swayPeriod: 40, swayEase: 6, back: 1.2, ...cfg };
  const smooth = (k) => k * k * (3 - 2 * k);
  const ownerOf = (o) => { for (; o; o = o.parent) if (o.userData.scene) return o.userData.scene.id; return null; };
  const ray = new THREE.Raycaster();
  // Solid things that can block a shot: object parts, never lines, outline hulls or depth twins.
  const solids = () => { const l = []; room.traverseVisible((o) => { if (o.isMesh && !o.isLineSegments2 && ownerOf(o)) l.push(o); }); return l; };
  // A few angles to try, best first: from the front-right like the home view, then the left, then higher.
  const ANGLES = [[25, 22], [-25, 22], [0, 30], [45, 15], [-45, 15], [10, 50], [60, 30], [-60, 30]];
  const frame = (spec) => {
    let id = null, centre, size;
    if (typeof spec === 'string') {
      const g = room.userData.objects[spec]; if (!g || !g.visible) return null;
      const b = new THREE.Box3().setFromObject(g); id = spec;
      centre = b.getCenter(new THREE.Vector3()); size = b.getSize(new THREE.Vector3()).length();
    } else { centre = new THREE.Vector3(...spec.look); size = spec.size || 1200; }
    const dist = Math.max(500, size * 0.55 / Math.tan(rad(camera.fov / 2)));
    const blockers = solids();
    for (const [az, el] of spec.from ? [spec.from, ...ANGLES] : ANGLES) {
      const dir = new THREE.Vector3().setFromSphericalCoords(1, rad(90 - el), rad(az)), pos = centre.clone().addScaledVector(dir, dist);
      // inside the room: in front of the back wall, right of the side wall, above the floor, below the tops of the wall units
      if (pos.z < R.backWall + 300 || pos.x < R.sideWall + 300 || pos.y < 300 || pos.y > 2600) continue;
      ray.set(pos, centre.clone().sub(pos).normalize()); ray.far = dist;
      const hit = ray.intersectObjects(blockers, false)[0];
      if (hit && ownerOf(hit.object) !== id && hit.distance < dist - size * 0.3) continue;   // something else is in the way
      return { pos, target: centre, dist, az, el };
    }
    return null;
  };
  // Each shot drifts a little over its few seconds, the way a camera operator would: push in, slide sideways, or rise.
  const MOVES = [
    (s, k) => ({ pos: s.target.clone().lerp(s.pos, 1 - 0.12 * k), target: s.target }),
    (s, k) => { const side = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), rad(s.az)).multiplyScalar(s.dist * 0.12 * (k - 0.5));
      return { pos: s.pos.clone().add(side), target: s.target.clone().add(side) }; },
    (s, k) => { const up = new THREE.Vector3(0, s.dist * 0.08 * (k - 0.5), 0); return { pos: s.pos.clone().add(up), target: s.target.clone().addScaledVector(up, 0.3) }; },
  ];
  const shots = (C.shots || []).map((spec, i) => ({ spec, move: MOVES[i % MOVES.length] }));

  let state = 'idle', t0 = 0, swayLast = 0, shot = null, shotN = 0, back = null;
  const swayStep = (t) => {
    const k = Math.min(1, t / C.swayEase), ang = rad(C.swayDeg) * smooth(k) * Math.sin(2 * Math.PI * t / C.swayPeriod);
    const off = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang - swayLast);
    camera.position.copy(controls.target).add(off); swayLast = ang;
  };
  const nextShot = () => {
    for (let tries = 0; tries < shots.length; tries++) {
      const s = shots[shotN++ % shots.length], f = frame(s.spec);
      if (f) return { ...f, move: s.move, spec: s.spec };
    }
    return null;
  };
  const api = {
    get state() { return state; },
    get shot() { return shot && shot.spec; },
    // `idleMs`: time since the last input. Returns true while the tour owns the camera (the orbit controls must not move it then).
    update(now, idleMs) {
      if (idleMs < C.after * 1000) {
        if (state === 'cuts') { back = { t0: now, pos: camera.position.clone(), target: shot ? shot.lookAt.clone() : controls.target.clone() }; state = 'back'; controls.enabled = false; }
        else if (state === 'sway') state = 'idle';
      }
      if (state === 'back') {
        const k = smooth(Math.min(1, (now - back.t0) / (C.back * 1000)));
        camera.position.lerpVectors(back.pos, home.pos, k);
        controls.target.lerpVectors(back.target, home.target, k);
        camera.lookAt(controls.target);
        if (k >= 1) { state = 'idle'; shot = null; controls.enabled = true; controls.update(); }
        return state === 'back';
      }
      if (state === 'idle' && idleMs >= C.after * 1000) { state = 'sway'; t0 = now; swayLast = 0; }
      if (state === 'sway') {
        const t = (now - t0) / 1000;
        if (shots.length && t >= C.cutsAfter) { state = 'cuts'; t0 = now; shot = null; controls.enabled = false; }
        else { swayStep(t); return false; }
      }
      if (state === 'cuts') {
        const n = Math.floor((now - t0) / (C.cutEvery * 1000));
        if (!shot || shot.n !== n) { const s = nextShot(); if (!s) { state = 'sway'; t0 = now - C.cutsAfter * 1000; controls.enabled = true; return false; } shot = { ...s, n }; }
        const k = ((now - t0) / (C.cutEvery * 1000)) - n, p = shot.move(shot, k);
        camera.position.copy(p.pos); shot.lookAt = p.target; camera.lookAt(p.target);
        return true;
      }
      return false;
    },
  };
  return api;
}

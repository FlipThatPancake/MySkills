// @js:scene-tour — what the camera does while nobody touches the page, like a short film:
// 1. after `after` s idle: a slow sway round the home view, eased in from where the camera stands;
// 2. `cutsAfter` s into the sway: a hard cut to a new shot every `cutEvery` s (a composed view of the room), each with a small move of its own;
// 3. any input: the sway stops on the spot, or, once cuts have started, the camera eases back to the home view and hands over to the orbit controls.
// Shots are compositions, not portraits of one object: scene.json's `camera.shots` lists each as { name, from: [x, y, z] mm, look: [x, y, z] mm, fov: deg, move }.
// Compose like a photographer: a foreground piece cut by the frame edge, the subject on a third, lines (worktop edge, tiles, cabinet rows) leading in, depth in layers.
// `move` is the drift during the shot: push (in), pull (out), slide (sideways), rise (up), turn (a slow pan); it defaults to a cycle of them.
export function createTour({ THREE, camera, controls, room, home, cfg }) {
  const rad = THREE.MathUtils.degToRad;
  const C = { after: 12, cutsAfter: 12, cutEvery: 4, swayDeg: 25, swayPeriod: 40, swayEase: 6, back: 1.2, ...cfg };
  const smooth = (k) => k * k * (3 - 2 * k);
  const MOVE = {
    push: (f, l, d, k) => [f.clone().lerp(l, 0.08 * k), l],
    pull: (f, l, d, k) => [f.clone().lerp(l, 0.08 * (1 - k)), l],
    slide: (f, l, d, k) => { const s = new THREE.Vector3().subVectors(l, f).cross(new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(d * 0.06 * (k - 0.5)); return [f.clone().add(s), l.clone().add(s)]; },
    rise: (f, l, d, k) => { const u = new THREE.Vector3(0, d * 0.05 * (k - 0.5), 0); return [f.clone().add(u), l.clone().addScaledVector(u, 0.5)]; },
    turn: (f, l, d, k) => [f, l.clone().sub(f).applyAxisAngle(new THREE.Vector3(0, 1, 0), rad(4) * (k - 0.5)).add(f)],
  };
  const CYCLE = ['push', 'slide', 'turn', 'rise', 'pull'];
  const shots = (C.shots || []).map((s, i) => ({ ...s, from: new THREE.Vector3(...s.from), look: new THREE.Vector3(...s.look), move: MOVE[s.move] || MOVE[CYCLE[i % CYCLE.length]] }));
  const homeFov = camera.fov;
  const place = (s, k) => {
    const [pos, look] = s.move(s.from, s.look, s.from.distanceTo(s.look), k);
    camera.position.copy(pos); camera.lookAt(look);
    if (camera.fov !== (s.fov || homeFov)) { camera.fov = s.fov || homeFov; camera.updateProjectionMatrix(); }
    return look;
  };

  let state = 'idle', t0 = 0, swayLast = 0, shot = null, shotN = 0, back = null, lookAt = null;
  const swayStep = (t) => {
    const k = Math.min(1, t / C.swayEase), ang = rad(C.swayDeg) * smooth(k) * Math.sin(2 * Math.PI * t / C.swayPeriod);
    const off = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang - swayLast);
    camera.position.copy(controls.target).add(off); swayLast = ang;
  };
  const api = {
    get state() { return state; },
    get shot() { return shot && shot.name; },
    // Hold shot i at its middle, to look at the compositions side by side (a contact sheet).
    preview(i) { state = 'still'; controls.enabled = false; place(shots[i], 0.5); return shots[i].name; },
    // `idleMs`: time since the last input. Returns true while the tour owns the camera (the orbit controls must not move it then).
    update(now, idleMs) {
      if (idleMs < C.after * 1000) {
        if (state === 'cuts') { back = { t0: now, pos: camera.position.clone(), target: (lookAt || controls.target).clone(), fov: camera.fov }; state = 'back'; controls.enabled = false; }
        else if (state === 'sway') state = 'idle';
      }
      if (state === 'still') return true;
      if (state === 'back') {
        const k = smooth(Math.min(1, (now - back.t0) / (C.back * 1000)));
        camera.position.lerpVectors(back.pos, home.pos, k);
        controls.target.lerpVectors(back.target, home.target, k);
        camera.lookAt(controls.target);
        camera.fov = back.fov + (homeFov - back.fov) * k; camera.updateProjectionMatrix();
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
        if (!shot || shot.n !== n) shot = { ...shots[shotN++ % shots.length], n };
        lookAt = place(shot, (now - t0) / (C.cutEvery * 1000) - n);
        return true;
      }
      return false;
    },
  };
  return api;
}

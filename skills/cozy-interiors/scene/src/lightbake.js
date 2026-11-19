// @js:lightbake — soft light baked at page load, then frozen. Replaces the footprint halos.
// bakeLight({ THREE, renderer, scene, kit, walls, areas, group, mat }) -> { ms, passes, sheets }.
// For each area, a lightmap on its floor and its backing walls from the real geometry: a soft area light at every window (jittered samples across the opening, shadow-mapped through the wall's real hole)
// plus an even sky light (samples over the hemisphere). Each sample is a depth pass from the light and one pass per receiver that adds "was it lit, and how much could it have been".
// The result is a shadow fraction per texel; it is drawn as the old halo's grey with alpha up to the old halo's strength, so only shadow shows and light is where shadow is absent.
import { sheetTex } from './sheet.js';
const CAST = 5, FAR = 20000, GREY = [138 / 255, 138 / 255, 128 / 255];
const WIN_N = [5, 4], SKY_N = 32, SHADOW_A = 0.36, W_WIN = 0.7, W_SKY = 0.3, CONTACT = 0.4, REACH = 300;   // window and sky weights share SHADOW_A; CONTACT is the alpha right at a contact, found within REACH mm
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

export async function bakeLight({ THREE: T, renderer, scene, kit, walls, areas, group, seed = 7, size = 1024, quality = 1, debug = false, wWin = W_WIN, wSky = W_SKY, contact = CONTACT, strength = SHADOW_A, gain, withAll = (fn) => fn(), masks = null }) {
  const gl = renderer.extensions;
  if (!(renderer.capabilities.isWebGL2 && (gl.has('EXT_color_buffer_float') || gl.has('EXT_color_buffer_half_float')))) return null;
  const t0 = performance.now(), R = rnd(seed), out = { passes: 0, sheets: 0 };
  group.updateMatrixWorld(true);
  scene.traverse((o) => {   // what blocks light: solid parts and the wall planes, never lines, painted sheets or silhouettes
    if (!o.isMesh || o.isLineSegments2 || o.userData.lines || o.userData.nocast) return;
    if (o.material.isMeshBasicMaterial && !o.userData.caster) return;
    if (kit.hulls.includes(o.material) || o.material === kit.depth) return;
    o.layers.enable(CAST); out.casters = (out.casters || 0) + 1; if (!o.visible) out.hidden = (out.hidden || 0) + 1;
  });
  const rtOpts = { type: T.HalfFloatType, format: T.RGBAFormat, minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: true };
  const depthRT = new T.WebGLRenderTarget(size, size, rtOpts);
  const depthMat = new T.ShaderMaterial({
    side: T.DoubleSide,
    uniforms: { uRef: { value: new T.Vector3() }, uAxis: { value: new T.Vector3() }, uOrtho: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uRef, uAxis; uniform float uOrtho; varying vec3 vW; void main() { float d = uOrtho > 0.5 ? dot(vW - uRef, uAxis) : length(vW - uRef); gl_FragColor = vec4(d / ${FAR.toFixed(1)}, 0.0, 0.0, 1.0); }`,
  });
  const quad = new T.Mesh(new T.PlaneGeometry(2, 2)), ortho_cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), qs = new T.Scene(); qs.add(quad);
  const accMat = new T.ShaderMaterial({
    blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.OneFactor, blendDst: T.OneFactor, transparent: true, depthTest: false, depthWrite: false,
    uniforms: { uO: { value: new T.Vector3() }, uU: { value: new T.Vector3() }, uV: { value: new T.Vector3() }, uN: { value: new T.Vector3() }, uRef: { value: new T.Vector3() }, uAxis: { value: new T.Vector3() }, uOrtho: { value: 0 }, uDepth: { value: null }, uVP: { value: new T.Matrix4() }, uClipOut: { value: 0 }, uWallR: { value: 0 }, uWA: { value: Array.from({ length: 8 }, () => new T.Vector4()) }, uWB: { value: Array.from({ length: 8 }, () => new T.Vector4()) }, uNW: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform vec3 uO, uU, uV, uN, uRef, uAxis; uniform float uOrtho, uClipOut; uniform sampler2D uDepth; uniform mat4 uVP; uniform float uWallR, uNW; uniform vec4 uWA[8], uWB[8]; varying vec2 vUv;
      void main() {
        vec3 P = uO + uU * vUv.x + uV * vUv.y + uN * 20.0;   // clear of a rug's 7 mm and of the wall's own face
        vec3 L = uOrtho > 0.5 ? -uAxis : normalize(uRef - P);
        float c = max(dot(uN, L), 0.0), vis = 1.0, near = 0.0;
        vec4 cl = uVP * vec4(P, 1.0); vec3 nd = cl.xyz / cl.w; vec2 q = nd.xy * 0.5 + 0.5;
        if (uOrtho < 0.5 && cl.w <= 0.0) vis = 0.0;
        else if (uOrtho < 0.5 && (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0)) vis = 0.5;   // outside the light's 130 degree cone: half lit, so the cone's edge leaves no hard grey patch on the floor
        else if (uOrtho > 0.5 && (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0)) vis = 1.0;
        else { float d = uOrtho > 0.5 ? dot(P - uRef, uAxis) : length(P - uRef); float s = texture2D(uDepth, q).r * ${FAR.toFixed(1)}; float dd = d - s, bias = 14.0 + 14.0 / max(c, 0.1); vis = dd > bias ? 0.0 : 1.0; near = dd > bias && dd < ${REACH.toFixed(1)} ? 1.0 : 0.0;
          if (dd > bias) {
            vec3 B = P + L * dd;
            if (uWallR > 0.5) { if (dot(B - uO, uN) < 340.0) { vis = 1.0; near = 0.0; } }   // what hangs on a wall (a shelf, a frame) leaves no blob on it: only a thin line from its own thickness
            else if (uOrtho > 0.5) for (int i = 0; i < 8; i++) if (float(i) < uNW) { vec2 rel = B.xz - uWA[i].xy; float al = dot(rel, uWA[i].zw), di = dot(rel, uWB[i].xy); if (abs(di) < 30.0 && al > -30.0 && al < uWB[i].z + 30.0) near = 0.0; }   // the floor takes no contact shade from the wall's own face
          } }
        gl_FragColor = vec4(vis * c, c, near * c, 1.0);
      }`,
  });
  const resolveMat = new T.ShaderMaterial({
    transparent: false, depthTest: false, depthWrite: false,
    uniforms: { uWin: { value: null }, uSky: { value: null }, uHoles: { value: Array.from({ length: 4 }, () => new T.Vector4(0, 0, 0, 0)) }, uNH: { value: 0 }, uSize: { value: new T.Vector2(1, 1) }, uTexel: { value: new T.Vector2(1, 1) }, uWW: { value: 0.7 }, uWS: { value: 0.3 }, uA: { value: 0.3 }, uC: { value: 0.32 }, uWallK: { value: 0 }, uFadeLen: { value: 700 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    // each term is blurred over a 13-tap disc before it is turned into shade, so a few light samples read as a soft penumbra, not as blotches
    fragmentShader: `uniform sampler2D uWin, uSky; uniform vec4 uHoles[4]; uniform int uNH; uniform vec2 uSize, uTexel; uniform float uWW, uWS, uA, uC, uWallK, uFadeLen; varying vec2 vUv;
      vec4 disc(sampler2D t, float rad) { vec4 s = vec4(0.0); for (int i = 0; i < 13; i++) { float f = float(i) + 0.5, r = sqrt(f / 13.0) * rad, a = f * 2.39996; s += texture2D(t, vUv + vec2(cos(a), sin(a)) * r * uTexel); } return s; }
      void main() {
        vec4 w = disc(uWin, 4.0), s = disc(uSky, 3.0), n = disc(uSky, 1.6);
        float sw = w.g > 0.001 ? 1.0 - w.r / w.g : 0.0, ss = s.g > 0.001 ? 1.0 - s.r / s.g : 0.0, nr = n.g > 0.001 ? n.b / n.g : 0.0;
        float a = uA * (uWW * smoothstep(0.3, 1.0, sw) + uWS * ss) + uC * pow(clamp(nr * 3.5, 0.0, 1.0), 1.2);
        a = min(a, 0.5);
        vec2 p = vUv * uSize;
        for (int i = 0; i < 4; i++) if (i < uNH && p.x > uHoles[i].x && p.x < uHoles[i].z && p.y > uHoles[i].y && p.y < uHoles[i].w) a = 0.0;
        vec2 e = min(vUv, 1.0 - vUv) * uSize; float ed = uWallK > 0.5 ? min(e.x, (1.0 - vUv.y) * uSize.y) : min(e.x, e.y); a *= smoothstep(0.0, uFadeLen, ed);   // a sheet's edges melt away (a wall keeps its foot)
        gl_FragColor = vec4(${GREY.map((v) => v.toFixed(4)).join(', ')}, a);
      }`,
  });
  const oldRT = renderer.getRenderTarget(), oldAuto = renderer.autoClear, oldClear = renderer.getClearColor(new T.Color()), oldAlpha = renderer.getClearAlpha();
  renderer.autoClear = false;   // the accumulation buffers must keep what earlier samples drew
  const later = [];
  const apply = () => { renderer.autoClear = false; };
  const tick = async () => { renderer.setRenderTarget(oldRT); renderer.autoClear = oldAuto; renderer.setClearColor(oldClear, oldAlpha); await new Promise((r) => requestAnimationFrame(r)); apply(); };   // let the page draw a frame between batches of passes
  let batch = 0; const maybeTick = async () => { if (!debug && ++batch % 3 === 0) await tick(); };
  const lightCam = (cam) => { cam.layers.set(CAST); cam.updateMatrixWorld(true); return new T.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); };
  const depthPass = (cam, ref, axis, ortho) => {
    depthMat.uniforms.uRef.value.copy(ref); depthMat.uniforms.uAxis.value.copy(axis); depthMat.uniforms.uOrtho.value = ortho ? 1 : 0;
    renderer.setRenderTarget(depthRT); renderer.setClearColor(0xffffff, 1); renderer.clear(true, true, false);
    scene.overrideMaterial = depthMat; withAll(() => renderer.render(scene, cam)); scene.overrideMaterial = null; out.passes++;
  };
  let wallsOf = [];
  const accum = (rec, rt, vp, ref, axis, ortho) => {
    const u = accMat.uniforms; u.uO.value.copy(rec.O); u.uU.value.copy(rec.U); u.uV.value.copy(rec.V); u.uN.value.copy(rec.N); u.uRef.value.copy(ref); u.uAxis.value.copy(axis); u.uOrtho.value = ortho ? 1 : 0; u.uDepth.value = depthRT.texture; u.uVP.value.copy(vp); u.uWallR.value = rec.kind === 'wall' ? 1 : 0; u.uNW.value = wallsOf.length; wallsOf.forEach((r, i) => { u.uWA.value[i].set(r.O.x, r.O.z, r.U.x / r.w, r.U.z / r.w); u.uWB.value[i].set(r.N.x, r.N.z, r.w, 0); });
    quad.material = accMat; renderer.setRenderTarget(rt); renderer.render(qs, ortho_cam);
  };
  for (const A of areas) {
    const b = A.bounds, ws = walls.filter((w) => w.id && (A.ids || [A.id]).some((i) => w.id.startsWith(i + '-'))),   // an open-plan group is one floor sheet and one light: A.ids lists its areas
     pad = 500, H = Math.min(2500, (b.top || 2500));
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, bw = b.x1 - b.x0 + 2 * pad, bd = b.z1 - b.z0 + 2 * pad, px = 0.08 * quality;
    const recs = [{ kind: 'floor', O: new T.Vector3(b.x0 - pad, 0, b.z1 + pad), U: new T.Vector3(bw, 0, 0), V: new T.Vector3(0, 0, -bd), N: new T.Vector3(0, 1, 0), w: bw, h: bd }];
    for (const W of ws) {
      const nd = W.node, o = nd.localToWorld(new T.Vector3(0, 0, 0)), ux = nd.localToWorld(new T.Vector3(W.len, 0, 0)), vy = nd.localToWorld(new T.Vector3(0, H, 0)), nz = nd.localToWorld(new T.Vector3(0, 0, 1)).sub(o);
      recs.push({ kind: 'wall', W, O: o, U: ux.sub(o), V: vy.sub(o), N: nz.normalize(), w: W.len, h: H });
    }
    wallsOf = recs.filter((r) => r.kind === 'wall').slice(0, 8);
    for (const r of recs) {
      const rw = Math.max(8, Math.min(1024, Math.round(r.w * px))), rh = Math.max(8, Math.min(1024, Math.round(r.h * px)));
      r.win = new T.WebGLRenderTarget(rw, rh, { ...rtOpts, depthBuffer: false }); r.sky = new T.WebGLRenderTarget(rw, rh, { ...rtOpts, depthBuffer: false });
      for (const rt of [r.win, r.sky]) { renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false); }
    }
    // window lights: jittered samples across each opening, a little outside the wall so the wall's own hole frames the light
    for (const W of ws) for (const op of W.openings || []) {
      if (op.kind !== 'window' && !(op.kind === 'door' && op.style)) continue;   // a window, or a glass door (style french | slider)
      const xc = W.len - op.at, nx = Math.max(3, Math.round(WIN_N[0] * quality)), ny = Math.max(2, Math.round(WIN_N[1] * quality));
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = xc + ((i + R()) / nx - 0.5) * op.width, y = (op.sill || 900) + ((j + R()) / ny) * (op.height || 1100), p = W.node.localToWorld(new T.Vector3(x, y, -80));
        const cam = new T.PerspectiveCamera(130, 1, 30, FAR); cam.position.copy(p); cam.lookAt(cx, 300, cz); const vp = lightCam(cam);
        depthPass(cam, p, new T.Vector3(), false);
        for (const r of recs) accum(r, r.win, vp, p, new T.Vector3(), false);
        await maybeTick();
      }
    }
    // sky light: directions over the hemisphere, parallel, covering the whole area
    const Rr = Math.hypot(bw, bd, 2700) * 0.55;
    for (let k = 0; k < Math.round(SKY_N * quality); k++) {
      const n = Math.round(SKY_N * quality), th = Math.acos(1 - (k + 0.5) / n * 0.92), ph = k * 2.39996 + R(), d = new T.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));   // toward the light
      const eye = new T.Vector3(cx, 900, cz).addScaledVector(d, Rr + 500), cam = new T.OrthographicCamera(-Rr, Rr, Rr, -Rr, 1, 2 * Rr + 1000); cam.position.copy(eye); cam.lookAt(cx, 900, cz);
      const vp = lightCam(cam), axis = d.clone();   // distance along d from the receiver toward the light: smaller = nearer the light
      depthPass(cam, eye, axis.clone().negate(), true);
      if (debug && k === 0) (out.stats ||= []).push(`${A.id} cam ${eye.toArray().map(Math.round)} Rr ${Math.round(Rr)} cx ${Math.round(cx)} cz ${Math.round(cz)} layers ${cam.layers.mask} sceneChildren ${scene.children.length} ovr ${!!scene.overrideMaterial}`);
      if (debug && k === 0) { const px = new Uint16Array(size * size * 4); renderer.readRenderTargetPixels(depthRT, 0, 0, size, size, px); let mn = 9, mx = 0, cnt = 0; for (let i = 0; i < px.length; i += 4) { const v = T.DataUtils.fromHalfFloat(px[i]); if (v < 0.99) { cnt++; mn = Math.min(mn, v); mx = Math.max(mx, v); } } (out.stats ||= []).push(`sky0 depth texels<1: ${cnt} min ${mn.toFixed(3)} max ${mx.toFixed(3)} eyeDist ${(Rr + 500) / FAR}`); }
      for (const r of recs) accum(r, r.sky, vp, eye, axis.clone().negate(), true);
      await maybeTick();
    }
    // resolve each receiver into a grey-with-alpha texture and hang it where the halos used to be
    for (const r of recs) {
      const rw = r.win.width, rh = r.win.height, fin = new T.WebGLRenderTarget(rw, rh, { type: T.UnsignedByteType, format: T.RGBAFormat, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false });
      const u = resolveMat.uniforms; u.uWin.value = r.win.texture; u.uSky.value = r.sky.texture; u.uSize.value.set(r.w, r.h);
      const holes = r.kind === 'wall' ? r.W.holes.slice(0, 4).map((h) => { const xs = h.map((p) => p[0]), ys = h.map((p) => p[1]); return new T.Vector4(Math.min(...xs) - 20, Math.min(...ys) - 20, Math.max(...xs) + 20, Math.max(...ys) + 20); }) : [];
      u.uNH.value = holes.length; holes.forEach((h, i) => u.uHoles.value[i].copy(h)); u.uTexel.value.set(1 / rw, 1 / rh); u.uWW.value = wWin; u.uWS.value = wSky; u.uA.value = strength; u.uC.value = contact; u.uWallK.value = r.kind === 'wall' ? 1 : 0;
      quad.material = resolveMat; renderer.setRenderTarget(fin); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(qs, ortho_cam);
      if (debug) { const px = new Uint16Array(rw * rh * 4); renderer.readRenderTargetPixels(r.sky, 0, 0, rw, rh, px); let mr = 0, mb = 0, sb = 0, cnt = 0; for (let i = 0; i < px.length; i += 4) { const g = T.DataUtils.fromHalfFloat(px[i + 1]); if (g > 0.01) { mr = Math.max(mr, 1 - T.DataUtils.fromHalfFloat(px[i]) / g); const nb = T.DataUtils.fromHalfFloat(px[i + 2]) / g; mb = Math.max(mb, nb); sb += nb; cnt++; } } (out.stats ||= []).push(`${A.id}:${r.kind} sky maxShadow ${mr.toFixed(2)} maxNear ${mb.toFixed(2)} meanNear ${(sb / cnt).toFixed(3)}`); }
      r.win.dispose(); r.sky.dispose();
      if (r.kind === 'floor') {
        const m = sheetTex(kit, fin.texture, r.w, r.h, null, gain, false, masks); m.rotation.x = -Math.PI / 2; m.position.set(b.x0 - pad + bw / 2, 8, b.z1 + pad - bd / 2); later.push(() => group.add(m));
      } else {
        const m = sheetTex(kit, fin.texture, r.w, r.h, r.W.vis, gain); m.position.set(r.W.len / 2, r.h / 2, 2.5); later.push(() => r.W.node.add(m));
      }
      out.sheets++;
      if (debug) { const px = new Uint8Array(rw * rh * 4); renderer.readRenderTargetPixels(fin, 0, 0, rw, rh, px); let mx = 0, sum = 0; for (let i = 3; i < px.length; i += 4) { mx = Math.max(mx, px[i]); sum += px[i]; } (out.stats ||= []).push(`${A.id}:${r.kind} ${rw}x${rh} max ${mx} mean ${(sum / (rw * rh)).toFixed(1)}`); }
    }
  }
  later.forEach((f) => f()); depthRT.dispose(); renderer.setRenderTarget(oldRT); renderer.autoClear = oldAuto; renderer.setClearColor(oldClear, oldAlpha);
  out.ms = Math.round(performance.now() - t0);
  return out;
}

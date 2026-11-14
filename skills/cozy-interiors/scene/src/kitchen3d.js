// @js:kitchen3d — the kit every kitchen element is built from: one off-white shaded fill,
// one 0.6 px grey line in two tones ('mid' outlines, 'lo' small details), and helpers that add both to a shape. Sizes are millimetres.
// An element is `export function name(kit) { return group }`: its origin is the left-front-floor
// corner of its footprint, x runs right, y up, and z = 0 is the front face (the room is at -z).
// Fills ignore the HDRI; their shade depends only on which way each face points (tops lightest).
import * as THREE from './vendor/three/three.module.js';
import { LineSegments2 } from './vendor/three/LineSegments2.js';
import { LineMaterial } from './vendor/three/LineMaterial.js';
import { LineSegmentsGeometry } from './vendor/three/LineSegmentsGeometry.js';

// The look is anatomy's light theme: paper-white fills and thin grey lines.
const TONES = { mid: 0x8a8a8f, lo: 0xb4b4b8 };
const WIDTH = 0.6;
const FAINT = { color: 0xc4c4c6, width: 0.4 };   // the faintest line: marks that should only show when you look closely (cat scratches)
const BACKDROP = 0xf4f4f1;   // what the wall and floor melt into: the plain wall tone, never darker
const CREASE = 30;          // degrees; flatter joins are not drawn
const rad = THREE.MathUtils.degToRad;

// Shade a rolled or rounded edge as one smooth surface: each vertex takes the average normal of the
// faces that share its position and bend less than `maxDeg` from its own, so sharp corners stay sharp.
function smoothNormals(g, maxDeg = 50) {
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, key = (i) => Math.round(p.getX(i) * 20) + ',' + Math.round(p.getY(i) * 20) + ',' + Math.round(p.getZ(i) * 20);
  const at = new Map(), lim = Math.cos(rad(maxDeg));
  for (let i = 0; i < p.count; i++) { const k = key(i); if (!at.has(k)) at.set(k, []); at.get(k).push(i); }
  const out = new Float32Array(n.array.length), a = new THREE.Vector3(), b = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    a.fromBufferAttribute(n, i); s.set(0, 0, 0);
    for (const j of at.get(key(i))) { b.fromBufferAttribute(n, j); if (a.dot(b) >= lim) s.add(b); }
    s.normalize(); out.set([s.x, s.y, s.z], i * 3);
  }
  n.array.set(out); n.needsUpdate = true;
}

export function createKit() {
  const uniforms = { uOpacity: { value: 1 } };
  // View fade: everything (fills, lines, silhouettes) thins into the backdrop colour with distance from a centre, between radii r0 and r1 (set with setViewFade).
  // The default radii are huge, so a scene that never sets them is untouched. The uniform objects are shared by every material, clones included.
  const viewFade = { uVC: { value: new THREE.Vector3() }, uVR: { value: new THREE.Vector2(1e9, 2e9) }, uVH: { value: new THREE.Vector3() } };   // uVH: half-size of a box round uVC that stays clear (zero: a sphere)
  const BACK = [BACKDROP >> 16, (BACKDROP >> 8) & 255, BACKDROP & 255].map((c) => (c / 255).toFixed(4)).join(',');   // the fills' own (display) values, so a faded thing becomes exactly the page's tone, never a darker grey
  const VF_PARS = 'uniform vec3 uVC; uniform vec2 uVR; uniform vec3 uVH;';
  const VF_MIX = (col, w) => `${col} = mix(${col}, vec3(${BACK}), smoothstep(uVR.x, uVR.y, length(max(abs(${w} - uVC) - uVH, 0.0))));`;
  // The fill. `fade` makes a copy for the wall and floor that thins out with distance from a
  // centre (set with setFade), so the far ends of those big planes never show.
  const makeFill = (fade, tint = [1, 1, 1]) => new THREE.ShaderMaterial({
    uniforms: fade ? { uOpacity: uniforms.uOpacity, uTint: { value: new THREE.Vector3(...tint) }, uC: { value: new THREE.Vector3() }, uH: { value: new THREE.Vector3(1e9, 1e9, 1e9) }, uR: { value: new THREE.Vector2(1e9, 2e9) } } : { uOpacity: uniforms.uOpacity, uTint: { value: new THREE.Vector3(...tint) }, ...viewFade },
    transparent: !!fade,
    // no polygon offset: it grows with the slope of a face, so at a distance it pushed fills back far enough for hidden edges to leak through (the seams near the sink)
    vertexShader: `varying vec3 vN; varying vec3 vW;
      void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uOpacity; uniform vec3 uTint; ${fade ? 'uniform vec3 uC; uniform vec3 uH; uniform vec2 uR;' : VF_PARS} varying vec3 vN; varying vec3 vW;
      void main() {
        vec3 n = normalize(vN);
        // top #ffffff, front #f4f4f1, left #ededea, right #e5e5e2, underside #dcdcd9
        vec3 top = vec3(1.0), front = vec3(0.957, 0.957, 0.945), left = vec3(0.929, 0.929, 0.918), right = vec3(0.898, 0.898, 0.886), under = vec3(0.863, 0.863, 0.851);
        vec3 w = vec3(max(n.x, 0.0), max(n.y, 0.0), max(n.z, 0.0)), v = vec3(max(-n.x, 0.0), max(-n.y, 0.0), max(-n.z, 0.0));
        vec3 col = (right * w.x + top * w.y + front * w.z + left * v.x + under * v.y + front * v.z) / (w.x + w.y + w.z + v.x + v.y + v.z);
        col *= uTint;
        ${fade ? 'col = front;' : VF_MIX('col', 'vW')}   // wall and floor are one flat tone, the backdrop's
        float a = uOpacity;
        ${fade ? 'a *= 1.0 - smoothstep(uR.x, uR.y, length(max(abs(vW - uC) - uH, 0.0)));' : ''}
        gl_FragColor = vec4(col, a);
      }`
  });
  const fill = makeFill(false), fadeFill = makeFill(true);
  // The plant is the one coloured thing: soft sage fill (#8fae8b at the light face) with a darker green line.
  const leafFill = makeFill(false, [0.62, 0.74, 0.60]);
  // Lines win ties with fills by a tiny pull toward the camera in clip space (about 0.1 px of depth at the wide view, never more than a fraction of a mm up close), so an edge 2 mm behind a fill stays hidden at every distance.
  const biased = (m) => {
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, viewFade);
      sh.vertexShader = sh.vertexShader.replace('gl_Position = clip;', 'clip.z -= clip.w * 2.0e-6; gl_Position = clip;')
        .replace('void main() {', 'varying vec3 vVW;\nvoid main() { vVW = (modelMatrix * vec4(position.y < 0.5 ? instanceStart : instanceEnd, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', `${VF_PARS}\nvarying vec3 vVW;\nvoid main() {`)
        .replace('gl_FragColor = vec4( diffuseColor.rgb, alpha );', `vec3 lc = diffuseColor.rgb; ${VF_MIX('lc', 'vVW')} gl_FragColor = vec4( lc, alpha );`);
    };
    return m;
  };
  const lineGreen = biased(new LineMaterial({ color: 0x5f7f5b, linewidth: WIDTH, depthTest: true }));
  const lineMid = biased(new LineMaterial({ color: TONES.mid, linewidth: WIDTH, depthTest: true }));
  const lineLo = biased(new LineMaterial({ color: TONES.lo, linewidth: WIDTH, depthTest: true }));
  const lineFaint = biased(new LineMaterial({ color: FAINT.color, linewidth: FAINT.width, depthTest: true }));
  const line = lineMid;
  // Silhouette of a smooth shape: its back faces pushed out one pixel, drawn in the line colour.
  const hullU = { uPx: { value: WIDTH }, uRes: { value: new THREE.Vector2(1, 1) }, uOpacity: uniforms.uOpacity, ...viewFade };
  const makeHull = (tone) => new THREE.ShaderMaterial({
    uniforms: hullU, side: THREE.BackSide,
    vertexShader: `uniform float uPx; uniform vec2 uRes; varying vec3 vW;
      void main() {
        vW = (modelMatrix * vec4(position, 1.0)).xyz;
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec2 d = (projectionMatrix * vec4(normalize(normalMatrix * normal), 0.0)).xy;
        p.xy += normalize(d + 1e-6) * uPx * 2.0 / uRes * p.w;
        gl_Position = p;
      }`,
    fragmentShader: `uniform float uOpacity; ${VF_PARS} varying vec3 vW; void main() { vec3 c = vec3(${new THREE.Color(TONES[tone]).toArray().map(c => c.toFixed(3)).join(',')}); ${VF_MIX('c', 'vW')} gl_FragColor = vec4(c, uOpacity); }`
  });
  const hull = makeHull('mid'), hullLo = makeHull('lo');
  const seamLine = biased(new LineMaterial({ color: 0xffffff, linewidth: WIDTH, vertexColors: true, depthTest: true }));
  let backdropMat = null;
  const backU = { value: 1 };            // the backdrop follows the fade, not the dimming
  const loopMat = new LineMaterial({ color: 0x111111, linewidth: 2, transparent: true, depthTest: false });
  const roots = [];
  const paints = [];
  const fadables = [];
  const depthMeshes = [];
  // Fills and lines sit at offset 0 (lines pulled forward a hair); the twins one step back, so a fill always passes its own twin's depth, whatever rounding the GPU does.
  const depth = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });

  // Small parts (knobs, handles, burners) and thin slabs (door and drawer fronts) are drawn in the
  // light tone, so only the big silhouettes carry the darker one and the oven stays the hero.
  const autoTone = (geometry) => {
    geometry.computeBoundingBox();
    const d = geometry.boundingBox.getSize(new THREE.Vector3()).toArray().sort((a, b) => b - a);
    return d[0] < 200 || d[1] < 40 || (d[2] <= 20 && d[1] >= 150) ? 'lo' : 'mid';
  };
  const kit = {
    THREE, fill, fadeFill, line, hulls: [hull, hullLo], depth,
    // 0..1: how visible the side wall's things (window, its seam and shadow) are; view3d lowers it while the camera is outside that wall.
    sideVis: { value: 1 },
    // Own copies of the fill and line materials, so a group can fade on its own: kit.useFade(group, fa) swaps them in, fa.set(a) fades it.
    fadable() {
      const hc = (h) => { const m = h.clone(); Object.assign(m.uniforms, hullU, { uOpacity: { value: 1 } }); return m; };   // own opacity; resolution and view fade stay shared
      const fa = { hull: hc(hull), hullLo: hc(hullLo), fill: fill.clone(), mid: biased(lineMid.clone()), lo: biased(lineLo.clone()), seam: biased(seamLine.clone()),
        twins: [],
        // The group's depth twins follow it: gone when it is invisible, there while it fades (else hidden parts of the group would show through).
        set(a) { fa.twins.forEach((t) => { t.visible = a > 0.001 && (t.visible || a < 0.999); }); fa.hull.uniforms.uOpacity.value = fa.hullLo.uniforms.uOpacity.value = a; fa.hull.transparent = fa.hullLo.transparent = a < 0.999; fa.fill.uniforms.uOpacity.value = a; fa.mid.opacity = fa.lo.opacity = fa.seam.opacity = a; fa.fill.transparent = fa.mid.transparent = fa.lo.transparent = fa.seam.transparent = a < 0.999; } };
      Object.assign(fa.fill.uniforms, viewFade);   // clone() copied the values; share the view fade again
      fadables.push(fa);
      return fa;
    },
    useFade(group, fa) {
      group.traverse((o) => {
        if (o.isMesh && o.material === fill) { o.material = fa.fill; o.children.forEach((c) => { if (c.material === depth) fa.twins.push(c); }); }
        else if (o.isMesh && (o.material === hull || o.material === hullLo)) o.material = o.material === hull ? fa.hull : fa.hullLo;
        else if (o.isLineSegments2) o.material = o.material === lineMid ? fa.mid : o.material === lineLo ? fa.lo : o.material === seamLine ? fa.seam : o.material;
      });
    },
    // Everything thins into the backdrop colour between radii r0 and r1 (world units) round `centre`; a scene calls it each frame to keep a soft-edged cutout round the orbit target.
    setViewFade(centre, r0, r1, half = null) { viewFade.uVC.value.copy(centre); viewFade.uVR.value.set(r0, r1); viewFade.uVH.value.copy(half || new THREE.Vector3()); },
    // Wall and floor thin out between r0 and r1 (world units) beyond the box that is `half` wide around `centre`.
    setFade(centre, half, r0, r1) { fadeFill.uniforms.uC.value.copy(centre); fadeFill.uniforms.uH.value.copy(half); fadeFill.uniforms.uR.value.set(r0, r1); },
    // The window size in CSS pixels; call it on every resize so lines stay 1 px.
    setResolution(w, h) { lineFaint.resolution.set(w, h); lineMid.resolution.set(w, h); lineLo.resolution.set(w, h); seamLine.resolution.set(w, h); fadables.forEach((fa) => { fa.mid.resolution.set(w, h); fa.lo.resolution.set(w, h); fa.seam.resolution.set(w, h); }); lineGreen.resolution.set(w, h); loopMat.resolution.set(w, h); hullU.uRes.value.set(w, h); },
    // 0..1, fills and lines together. Only a fade is transparent; at 1 everything is opaque,
    // so three.js does not sort the meshes every frame.
    // `dim` (0..1) lowers the kitchen alone, e.g. to 0.4 while the oven is highlighted; the backdrop stays full.
    setOpacity(o, dim = 1) {
      const f = o * dim, t = f < 0.999;
      uniforms.uOpacity.value = f; backU.value = o; lineMid.opacity = lineLo.opacity = lineFaint.opacity = seamLine.opacity = lineGreen.opacity = f;
      paints.forEach(m => { m.transparent = t; });
      leafFill.transparent = lineGreen.transparent = fill.transparent = hull.transparent = hullLo.transparent = lineMid.transparent = lineLo.transparent = lineFaint.transparent = seamLine.transparent = t;
      fadeFill.transparent = true;
      if (backdropMat) backdropMat.transparent = o < 0.999;
      depthMeshes.forEach(m => { m.visible = t; });
      roots.forEach(g => { g.visible = o > 0.001; });
    },
    // Register a finished room for the fade. Every fill also gets a depth-only twin that is drawn
    // first, so lines of hidden parts stay hidden while the fills are see-through.
    track(group) {
      roots.push(group);
      const twins = [];
      group.traverse((o) => { if (o.isMesh && (o.material === fill || o.material === leafFill || paints.includes(o.material))) twins.push(o); });
      twins.forEach((o) => { const t = new THREE.Mesh(o.geometry, depth); t.renderOrder = -10; o.add(t); depthMeshes.push(t); });
      return group;
    },

    // Add outlines to any mesh: edges where faces meet at more than the crease angle
    // (so real edges show and gentle curves do not). `smooth: true` adds the silhouette too.
    outline(mesh, opts = {}) {
      if (opts.smoothShade) smoothNormals(mesh.geometry);
      if (!opts.tone) opts = { ...opts, tone: autoTone(mesh.geometry) };
      const edges = new THREE.EdgesGeometry(mesh.geometry, opts.crease ?? CREASE);
      if (edges.attributes.position.count) {
        const l = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(edges), opts.tone === 'lo' ? lineLo : lineMid);
        l.userData.kitLine = true;
        mesh.add(l);
      }
      edges.dispose();
      if (opts.smooth) {
        const h = new THREE.Mesh(mesh.geometry, opts.tone === 'lo' ? hullLo : hull);
        h.userData.kitLine = true;
        mesh.add(h);
      }
      return mesh;
    },
    // Fill a geometry and outline it, at (x, y, z) — the position of the geometry's own origin.
    solid(geometry, x = 0, y = 0, z = 0, opts = {}) {
      const m = new THREE.Mesh(geometry, fill);
      m.position.set(x, y, z);
      return kit.outline(m, opts);
    },
    // A box by its left-bottom-front corner and size; it reaches back (-z) by d.
    box(x, y, z, w, h, d, opts) {
      return kit.solid(new THREE.BoxGeometry(w, h, d), x + w / 2, y + h / 2, z - d / 2, opts);
    },
    // A rounded-corner box (corner radius r in the front view) by its left-bottom-front corner.
    rbox(x, y, z, w, h, d, r, opts = {}) {
      const s = new THREE.Shape();
      r = Math.min(r, w / 2, h / 2);
      s.moveTo(r, 0); s.lineTo(w - r, 0); s.absarc(w - r, r, r, -Math.PI / 2, 0);
      s.lineTo(w, h - r); s.absarc(w - r, h - r, r, 0, Math.PI / 2);
      s.lineTo(r, h); s.absarc(r, h - r, r, Math.PI / 2, Math.PI);
      s.lineTo(0, r); s.absarc(r, r, r, Math.PI, Math.PI * 1.5);
      const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 });
      return kit.solid(g, x, y, z - d, { smooth: true, ...opts });
    },
    // A cylinder standing on (x, y, z), axis up; `axis: 'z'` lays it front-to-back, 'x' left-to-right
    // (then (x, y, z) is the centre of its first end).
    cyl(x, y, z, r, h, opts = {}) {
      const g = new THREE.CylinderGeometry(opts.rTop ?? r, r, h, opts.seg ?? 32);
      const m = kit.solid(g, x, y + h / 2, z, { smooth: true, ...opts });
      if (opts.axis === 'z') { m.rotation.x = Math.PI / 2; m.position.set(x, y, z - h / 2); }
      if (opts.axis === 'x') { m.rotation.z = Math.PI / 2; m.position.set(x + h / 2, y, z); }
      return m;
    },
    // The fill shading times a painted canvas: for the things that carry a faint colour (a fruit, a butterfly wing). `uv` shapes map 0..1 across the canvas.
    // It follows the kitchen's fade like the plain fill; `double` shows both sides of a flat shape.
    paint(canvas, double = false) {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.ShaderMaterial({
        uniforms: { uOpacity: uniforms.uOpacity, uMap: { value: tex }, ...viewFade },
        side: double ? THREE.DoubleSide : THREE.FrontSide,
        vertexShader: `varying vec3 vN; varying vec2 vUv; varying vec3 vW;
          void main() { vN = normalize(mat3(modelMatrix) * normal); vUv = uv; vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uOpacity; uniform sampler2D uMap; ${VF_PARS} varying vec3 vN; varying vec2 vUv; varying vec3 vW;
          void main() {
            vec3 n = normalize(vN);
            vec3 top = vec3(1.0), front = vec3(0.957, 0.957, 0.945), left = vec3(0.929, 0.929, 0.918), right = vec3(0.898, 0.898, 0.886), under = vec3(0.863, 0.863, 0.851);
            vec3 w = vec3(max(n.x, 0.0), max(n.y, 0.0), max(n.z, 0.0)), v = vec3(max(-n.x, 0.0), max(-n.y, 0.0), max(-n.z, 0.0));
            vec3 col = (right * w.x + top * w.y + front * w.z + left * v.x + under * v.y + front * v.z) / (w.x + w.y + w.z + v.x + v.y + v.z);
            col *= texture2D(uMap, vUv).rgb; ${VF_MIX('col', 'vW')}
            gl_FragColor = vec4(col, uOpacity);
          }`
      });
      paints.push(m);
      return m;
    },
    // A plant leaf: filled in sage, outlined in dark green. Not merged (it has its own materials), so add it to the room directly.
    leaf(geometry, x, y, z) {
      const m = new THREE.Mesh(geometry, leafFill);
      m.position.set(x, y, z);
      const edges = new THREE.EdgesGeometry(geometry, CREASE);
      const l = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(edges), lineGreen);
      l.userData.kitLine = true; edges.dispose();
      m.add(l);
      return m;
    },
    // A plant blade that bends: the caller rewrites the positions of `geometry` each frame and the outline lines in `mesh.userData.lines` (see props.js).
    // The mesh is filled in sage like a leaf; `segments` is how many line segments the outline has (it is rewritten in place, never regrown).
    leafBlade(geometry, segments) {
      const m = new THREE.Mesh(geometry, leafFill);
      m.frustumCulled = false;
      const lg = new LineSegmentsGeometry();
      lg.setPositions(new Float32Array(segments * 6));
      const l = new LineSegments2(lg, lineGreen);
      l.userData.kitLine = true; l.frustumCulled = false;
      m.add(l); m.userData.lines = l;
      return m;
    },
    // A flat line drawn on its own (a seam, a groove): points are [x, y, z] triples, in pairs.
    // Small details are the light 'lo' tone; pass 'mid' for a line that should read as an edge.
    lines(points, tone = 'lo') {
      const g = new LineSegmentsGeometry();
      if (points.length) g.setPositions(points.flat());
      const l = new LineSegments2(g, tone === 'mid' ? lineMid : tone === 'faint' ? lineFaint : lineLo);
      l.userData.kitLine = true;
      return l;
    },
    // A rounded-rectangle loop (centred on the origin, flat in x/y, sizes in world units) drawn 2 px wide
    // on top of everything; `loopMat.opacity` is for the caller's pulse.
    loop(w, h, r, z) {
      const pts = [], n = 10, cx = [w / 2 - r, -(w / 2 - r), -(w / 2 - r), w / 2 - r], cy = [h / 2 - r, h / 2 - r, -(h / 2 - r), -(h / 2 - r)];
      for (let c = 0; c < 4; c++) for (let k = 0; k <= n; k++) { const a = Math.PI / 2 * (c + k / n); pts.push([cx[c] + Math.cos(a) * r, cy[c] + Math.sin(a) * r, z]); }
      pts.push(pts[0]);
      const seg = []; for (let i = 0; i < pts.length - 1; i++) seg.push(...pts[i], ...pts[i + 1]);
      const g = new LineSegmentsGeometry(); g.setPositions(seg);
      const l = new LineSegments2(g, loopMat);
      l.renderOrder = 50; l.frustumCulled = false;
      return l;
    },
    loopMat,
    // A long line that melts into the backdrop: `tone(point)` is 0 (full line colour) .. 1 (backdrop).
    meltingLine(a, b, tone, parts = 240, toneName = 'mid') {
      const pos = [], col = [], c0 = new THREE.Color(TONES[toneName]), c1 = new THREE.Color(BACKDROP), c = new THREE.Color();
      const at = (i) => a.map((v, k) => v + (b[k] - v) * i / parts);
      for (let i = 0; i < parts; i++) {
        const p = at(i), q = at(i + 1);
        pos.push(...p, ...q);
        c.copy(c0).lerp(c1, tone(p)); col.push(c.r, c.g, c.b);
        c.copy(c0).lerp(c1, tone(q)); col.push(c.r, c.g, c.b);
      }
      const g = new LineSegmentsGeometry();
      g.setPositions(pos); g.setColors(col);
      const l = new LineSegments2(g, seamLine);
      l.userData.kitLine = true;
      return l;
    },
    // The whole view behind the kitchen in the plain wall tone, so the wall and floor fade into it
    // and the page's own grey patches never show through. It sits at the far depth: it paints
    // only where nothing else has.
    backdrop() {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms: { uOpacity: backU },
        vertexShader: 'void main() { gl_Position = vec4(position.xy, 1.0, 1.0); }',
        fragmentShader: `uniform float uOpacity; void main() { gl_FragColor = vec4(${new THREE.Color(BACKDROP).toArray().map(c => c.toFixed(4)).join(',')}, uOpacity); }`,
        depthWrite: false
      }));
      m.frustumCulled = false; m.renderOrder = -100;
      backdropMat = m.material;
      return m;
    },
    group() { return new THREE.Group(); },

    // Bake an element into three meshes (fills, lines, silhouettes) so it costs three draw calls,
    // not hundreds. Call it last, on the element's group; the group keeps its own position.
    merge(group) {
      if (kit.keepParts) return group;   // the scene checks need every part on its own (?check in the page address)
      group.updateMatrixWorld(true);
      const inv = group.matrixWorld.clone().invert();
      const fills = [], hulls = [], hullsLo = [], segs = { mid: [], lo: [] };
      const bake = (geo, m, list) => {
        let g = geo.index ? geo.toNonIndexed() : geo.clone();
        g.applyMatrix4(m);
        list.push({ p: g.attributes.position.array, n: g.attributes.normal.array });
      };
      const cat = (list, key) => { const len = list.reduce((a, b) => a + b[key].length, 0), out = new Float32Array(len); let o = 0; list.forEach(b => { out.set(b[key], o); o += b[key].length; }); return out; };
      group.traverse((o) => {
        if (o === group) return;
        const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
        if (o.isLineSegments2) {
          const a = o.geometry.attributes.instanceStart, b = o.geometry.attributes.instanceEnd, v = new THREE.Vector3();
          for (let i = 0; i < a.count; i++) {
            const out = o.material === lineMid ? segs.mid : segs.lo;
            v.fromBufferAttribute(a, i).applyMatrix4(m); out.push(v.x, v.y, v.z);
            v.fromBufferAttribute(b, i).applyMatrix4(m); out.push(v.x, v.y, v.z);
          }
        } else if (o.isMesh && o.material === fill) bake(o.geometry, m, fills);
        else if (o.isMesh && o.material === hull) bake(o.geometry, m, hulls);
        else if (o.isMesh && o.material === hullLo) bake(o.geometry, m, hullsLo);
      });
      const kids = [...group.children];
      kids.forEach(c => group.remove(c));
      const mesh = (list, mat) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(cat(list, 'p'), 3));
        g.setAttribute('normal', new THREE.BufferAttribute(cat(list, 'n'), 3));
        return new THREE.Mesh(g, mat);
      };
      if (fills.length) group.add(mesh(fills, fill));
      if (hulls.length) group.add(mesh(hulls, hull));
      if (hullsLo.length) group.add(mesh(hullsLo, hullLo));
      ['mid', 'lo'].forEach((t) => { if (segs[t].length) { const l = kit.lines([], t); l.geometry.setPositions(segs[t]); group.add(l); } });
      return group;
    }
  };
  return kit;
}

// @js:kitchen3d-preview — one element alone on a floor, for screenshots while it is built.
// `build(kit)` returns a group; `view` is 'front', 'right' (30° from the right, 15° above)
// or 'left' (30° from the left, 15° above). Used from a scratch page, never from the app.
export function preview(canvas, build, view = 'right') {
  const w = canvas.clientWidth || 900, h = canvas.clientHeight || 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x8f9399);
  const kit = createKit();
  kit.setResolution(w, h);
  const scene = new THREE.Scene();
  const out = build(kit);
  const group = out.group || out;
  scene.add(group);
  const box = new THREE.Box3().setFromObject(group);
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(size.x * 2 + 1500, size.z * 2 + 1500), kit.fill);
  floor.rotation.x = -Math.PI / 2; floor.position.set(c.x, -1, c.z);
  scene.add(floor);
  const cam = new THREE.PerspectiveCamera(30, w / h, 10, 100000);
  const dist = Math.max(size.x, size.y * (w / h)) / (2 * Math.tan(rad(15))) * 1.25 + size.z;
  const az = view === 'front' ? 0 : view === 'right' ? 30 : -30, el = view === 'front' ? 0 : 15;
  cam.position.set(c.x + dist * Math.sin(rad(az)) * Math.cos(rad(el)), c.y + dist * Math.sin(rad(el)), c.z + dist * Math.cos(rad(az)) * Math.cos(rad(el)));
  cam.lookAt(c);
  renderer.render(scene, cam);
  return { renderer, scene, cam, kit, group };
}

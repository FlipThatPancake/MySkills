// @js:library-books — standing books as separate volumes, for shelves and ledges. Units mm.
// bookRow(kit, { x, y, z, len, dep, hmax, R, lean }): books side by side from x along +x on a shelf at height y, each its own rounded block with its own height, thickness, depth and tone, spine bands drawn on its front; the last one may lean on its neighbour. Returns { group, end } (end: the x where the row finishes). R is a 0-1 random function.
const bandAt = (h, R) => { const b = []; b.push(h - 18 - R() * 14); b.push(h - 26 - R() * 12); if (R() < 0.7) b.push(14 + R() * 12); return b; };
export function bookRow(kit, { x, y, z = 0, len, dep, hmax = 300, R, lean = true, hmin = 150 }) {
  const g = kit.group(); let cx = x; const lines = [], stop = x + len - 40;
  let prevH = 0;
  while (cx < stop) {
    const bw = 16 + R() * R() * 34 + (R() < 0.15 ? 14 : 0), bh = Math.min(hmax, hmin + R() * (hmax - hmin)), bd = dep * (0.8 + R() * 0.17), front = z + dep / 2 - R() * 10 - (dep - bd) * R() * 0.5, tone = R() < 0.4 ? 'lo' : R() < 0.5 ? 'mid' : undefined;
    g.add(kit.box(cx, y, front, bw, bh, bd, tone ? { tone } : {}));
    for (const yy of bandAt(bh, R)) lines.push([cx + 1, y + yy, front + 0.6], [cx + bw - 1, y + yy, front + 0.6]);
    if (R() < 0.3 && bw > 26) { const ly = y + bh * (0.45 + R() * 0.2); lines.push([cx + 4, ly, front + 0.6], [cx + bw - 4, ly, front + 0.6], [cx + 4, ly + 22, front + 0.6], [cx + bw - 4, ly + 22, front + 0.6], [cx + 4, ly, front + 0.6], [cx + 4, ly + 22, front + 0.6], [cx + bw - 4, ly, front + 0.6], [cx + bw - 4, ly + 22, front + 0.6]); }   // a title label
    cx += bw + 1 + (R() < 0.12 ? 3 : 0); prevH = bh;
  }
  let end = cx;
  if (lean && prevH) {   // the last book leans against the one before it, resting on its bottom corner
    const bw = 24 + R() * 14, bh = Math.min(hmax, hmin + 40 + R() * (hmax - hmin - 40)), bd = dep * 0.85, a = 0.2 + R() * 0.12, p = kit.group();
    p.add(kit.box(0, 0, bd / 2, bw, bh, bd, {}));
    p.add(kit.lines([[1, bh - 20, bd / 2 + 0.6], [bw - 1, bh - 20, bd / 2 + 0.6], [1, bh - 30, bd / 2 + 0.6], [bw - 1, bh - 30, bd / 2 + 0.6]], 'lo'));
    p.rotation.z = a; p.position.set(cx + bh * Math.sin(a), y, z);   // its top corner touches the row's last book
    g.add(p); end = cx + bh * Math.sin(a) + bw * Math.cos(a) + 4;
  }
  if (lines.length) g.add(kit.lines(lines, 'lo'));
  return { group: g, end };
}

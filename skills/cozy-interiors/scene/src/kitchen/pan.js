// @js:kitchen-pan — a frying pan: wide flat dish, handle along +z. Origin: the middle of its base. scene.json sets it on a burner.
export function pan(kit) {
  const lo = { tone: 'lo' };
  const pan = kit.group();
  pan.add(kit.cyl(0, 0, 0, 105, 38, { rTop: 125, seg: 40, ...lo }));
  const rim = [];
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, b = (i + 1) / 40 * Math.PI * 2, r = 112; rim.push([Math.cos(a) * r, 38.5, Math.sin(a) * r], [Math.cos(b) * r, 38.5, Math.sin(b) * r]); }
  pan.add(kit.lines(rim));
  pan.add(kit.box(-12, 22, 305, 24, 10, 190, lo));    // handle, z 115..305 from the pan's centre
  pan.add(kit.cyl(0, 27, 118, 10, 8, lo));
  return kit.merge(pan);
}

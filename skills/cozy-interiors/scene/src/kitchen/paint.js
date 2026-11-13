// @js:kitchen-paint — a small painted-canvas maker for the few things in the kitchen that carry a faint colour (fruit, butterfly wings):
// a pale paper base, a soft wash, blurred blotches, short brush strokes and a little grain, all low in saturation so the oven stays the hero.
// `wash` is a list of colour stops [r, g, b] from top to bottom (or the wing's base to its tip); the result is deterministic for one `seed`.
export function paintCanvas({ size = 128, wash, seed = 1, strokes = 26, blotches = 9, strength = 0.55 }) {
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const q = c.getContext('2d');
  q.fillStyle = '#f6f3ea';
  q.fillRect(0, 0, size, size);
  const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`;
  const grad = q.createLinearGradient(0, 0, 0, size);
  wash.forEach((col, i) => grad.addColorStop(wash.length > 1 ? i / (wash.length - 1) : 0, rgba(col, strength)));
  q.fillStyle = grad;
  q.fillRect(0, 0, size, size);
  q.filter = `blur(${Math.round(size / 14)}px)`;
  for (let i = 0; i < blotches; i++) {
    const col = wash[Math.floor(rnd() * wash.length)];
    q.fillStyle = rgba(col, 0.18 + rnd() * 0.18);
    q.beginPath(); q.ellipse(rnd() * size, rnd() * size, size * (0.1 + rnd() * 0.18), size * (0.08 + rnd() * 0.14), rnd() * 3, 0, Math.PI * 2); q.fill();
  }
  q.filter = 'none';
  q.lineCap = 'round';
  for (let i = 0; i < strokes; i++) {
    const col = wash[Math.floor(rnd() * wash.length)], a = rnd() * 0.9 + 0.3;
    q.strokeStyle = rgba(col, 0.1 + rnd() * 0.1);
    q.lineWidth = size / 28 + rnd() * size / 22;
    const x = rnd() * size, y = rnd() * size, len = size * (0.12 + rnd() * 0.2);
    q.beginPath(); q.moveTo(x, y); q.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); q.stroke();
  }
  const img = q.getImageData(0, 0, size, size), d = img.data;   // grain
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  q.putImageData(img, 0, 0);
  return c;
}

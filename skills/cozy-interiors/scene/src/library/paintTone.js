// @js:library-painttone — how a classic painting is toned to sit in the scene, and how that is measured. No imports: selftest.mjs runs this very file in a browser page to measure every painting x colour mode at home-view size.
// Each mode first stretches the painting's own tones (the 2nd to 98th percentile of its brightness) to fill the range, so a dark painting still reads, then: keep = a little muted, soft = mostly faded toward the paper, ink = grey.
export const PAPER = [244, 243, 238];
export function adapt(q, x, y, w, h, mode) {
  const d = q.getImageData(x, y, w, h), a = d.data, lum = (i) => 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2], hist = new Uint32Array(256);
  for (let i = 0; i < a.length; i += 4) hist[Math.min(255, Math.round(lum(i)))]++;
  const n = a.length / 4, pct = (f) => { let s = 0; for (let v = 0; v < 256; v++) { s += hist[v]; if (s >= n * f) return v; } return 255; }, lo = pct(0.02), hi = Math.max(lo + 40, pct(0.98));
  const k = { keep: 0.14, soft: 0.4, ink: 0.18 }[mode] ?? 0.14, m = mode === 'soft' ? 0.45 : 0.85;
  for (let i = 0; i < a.length; i += 4) {
    const l0 = lum(i), l1 = 255 * Math.pow(Math.min(1, Math.max(0, (l0 - lo) / (hi - lo))), 0.8), s = l0 > 1 ? l1 / l0 : 1;   // the stretched brightness, and the factor that carries it to each channel
    let r = a[i] * s, g = a[i + 1] * s, b = a[i + 2] * s; const l = 0.3 * r + 0.59 * g + 0.11 * b;
    if (mode === 'ink') r = g = b = l; else { r = l + (r - l) * m; g = l + (g - l) * m; b = l + (b - l) * m; }   // desaturate: soft by more
    a[i] = Math.min(255, r + (PAPER[0] - r) * k); a[i + 1] = Math.min(255, g + (PAPER[1] - g) * k); a[i + 2] = Math.min(255, b + (PAPER[2] - b) * k);
  }
  q.putImageData(d, x, y);
}
// brightness of the toned image: mean, and the 5th and 95th percentile, from ImageData
export function toneStats(img) { const a = img.data, hist = new Uint32Array(256); let sum = 0; const n = a.length / 4; for (let i = 0; i < a.length; i += 4) { const l = Math.round(0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2]); hist[l]++; sum += l; } const pct = (f) => { let s = 0; for (let v = 0; v < 256; v++) { s += hist[v]; if (s >= n * f) return v; } return 255; }; return { mean: sum / n, p5: pct(0.05), p95: pct(0.95) }; }

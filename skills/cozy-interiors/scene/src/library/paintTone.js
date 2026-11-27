// @js:library-painttone — how a classic painting is toned to sit in the scene, and how that is measured. No imports: selftest.mjs runs this very file in a browser page to measure every painting x colour mode at home-view size.
// Each mode first stretches the painting's own tones (the 2nd to 98th percentile of its brightness) to fill the range, so a dark painting still reads, then: pastel = very soft colour (the default: hue kept, muted and lifted toward the paper, like the fridge photo and the window view), keep = a little muted, soft = mostly faded toward the paper, ink = grey, sepia = warm brown (a print that looks like an old photograph).
export const PAPER = [244, 243, 238];
export function adapt(q, x, y, w, h, mode) {
  const d = q.getImageData(x, y, w, h), a = d.data, lum = (i) => 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2], hist = new Uint32Array(256);
  for (let i = 0; i < a.length; i += 4) hist[Math.min(255, Math.round(lum(i)))]++;
  const n = a.length / 4, pct = (f) => { let s = 0; for (let v = 0; v < 256; v++) { s += hist[v]; if (s >= n * f) return v; } return 255; }, lo = pct(0.02), hi = Math.max(lo + 40, pct(0.98));
  const k = { keep: 0.14, pastel: 0.26, soft: 0.4, ink: 0.18, sepia: 0.12 }[mode] ?? 0.14, m = { soft: 0.45, pastel: 0.62 }[mode] ?? 0.85;
  for (let i = 0; i < a.length; i += 4) {
    const l0 = lum(i), l1 = 255 * Math.pow(Math.min(1, Math.max(0, (l0 - lo) / (hi - lo))), 0.8), s = l0 > 1 ? l1 / l0 : 1;   // the stretched brightness, and the factor that carries it to each channel
    let r = a[i] * s, g = a[i + 1] * s, b = a[i + 2] * s; const l = 0.3 * r + 0.59 * g + 0.11 * b;
    if (mode === 'ink') r = g = b = l; else if (mode === 'sepia') { r = l * 1.0; g = l * 0.87; b = l * 0.7; } else { r = l + (r - l) * m; g = l + (g - l) * m; b = l + (b - l) * m; }   // desaturate: soft by more
    a[i] = Math.min(255, r + (PAPER[0] - r) * k); a[i + 1] = Math.min(255, g + (PAPER[1] - g) * k); a[i + 2] = Math.min(255, b + (PAPER[2] - b) * k);
  }
  q.putImageData(d, x, y);
}
// brightness of the toned image: mean, the 5th and 95th percentile, and chroma (the mean spread between a pixel's strongest and weakest channel: 0 is grey), from ImageData
export function toneStats(img) { const a = img.data, hist = new Uint32Array(256); let sum = 0, ch = 0; const n = a.length / 4; for (let i = 0; i < a.length; i += 4) { ch += Math.max(a[i], a[i + 1], a[i + 2]) - Math.min(a[i], a[i + 1], a[i + 2]); const l = Math.round(0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2]); hist[l]++; sum += l; } const pct = (f) => { let s = 0; for (let v = 0; v < 256; v++) { s += hist[v]; if (s >= n * f) return v; } return 255; }; return { mean: sum / n, p5: pct(0.05), p95: pct(0.95), chroma: ch / n }; }

// structure of the toned image at the size a painting really has in a home view (about 70 px wide): the share of pixels on an edge (a brightness step of 14 or more to the right or below), and the number of 16-level tonal bins that hold 3% of the pixels or more
export function structStats(img) { const a = img.data, W = img.width, H = img.height, L = (i) => 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2], bins = new Uint32Array(16); let e = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, l = L(i); bins[Math.min(15, l >> 4)]++; if ((x < W - 1 && Math.abs(l - L(i + 4)) >= 14) || (y < H - 1 && Math.abs(l - L(i + W * 4)) >= 14)) e++; } const n = W * H; return { edges: e / n, steps: bins.filter((c) => c >= n * 0.03).length }; }

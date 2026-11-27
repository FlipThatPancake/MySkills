// import { cameras } from './cameras.mjs' (or the path to it) in a spec: const C = cameras('home.cameras.json'); a.shot('sofa', ...C('living', 'sofa'), 'sofa', C.core('living', 'sofa')).
// fitshots.mjs writes the file next to the scene json (area -> shot name -> [from, look, fov], in the area's own frame, the frame a.shot takes). C(area, name, fallback) returns the fitted camera, or `fallback` ([from, look, fov]) when the file is missing or fitshots found none, so the spec runs before the first fit.
// C.core(area, name): when the whole group was too wide for any camera, fitshots framed its core; this is the list of pieces it framed (the shot's last argument, so check-home measures the same pieces), else undefined.
import fs from 'node:fs';
export function cameras(file) {
  let data = {}; try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* first run: the fallbacks are used */ }
  const C = (area, name, fallback = [[0, 1200, 3000], [0, 700, 0], 34]) => data[area]?.[name] || fallback;
  C.core = (area, name) => data._core?.[area]?.[name] || undefined;
  return C;
}

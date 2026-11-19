import { Home } from './compose.mjs'; import fs from 'fs';
const ph = process.argv[2];
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('t', 'T', { rect: [0, 0, 8000, 5000] }), back = a.back(8000, []); a.left(5000); a.right(5000); a.view({ target: [4000, 700, 2500], az: 0, el: 18 });
const r = a.group(ph, { slot: 'floor:middle', hero: true }); H.write('/tmp/_t.json', fs); console.log(r.ids.join(' '), r.left);
for (const id of r.ids.slice(0,5)) { try { const q = a.dims(id); console.log(id, q.asset, q.at.map(Math.round).join(',')) } catch {} }

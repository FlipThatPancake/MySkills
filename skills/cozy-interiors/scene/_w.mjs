import { Home } from './compose.mjs'; import fs from 'fs';
const ph = process.argv[2], fl = process.argv[3] === 'float';
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('t', 'T', { rect: [0, 0, 6000, 4200] }), back = a.back(6000, []); a.left(4200); a.right(4200); a.view({ target: [3000, 700, 2000], az: 20, el: 15 });
const r = a.group(ph, fl ? { slot: 'floor:middle', hero: true } : { wall: back, xc: 3000, hero: true }); H.write('/tmp/_t.json', fs); console.log(r.ids.join(' '), JSON.stringify(r.left));

#!/usr/bin/env node
// Talkback live helper: serves a page's folder on this computer so the page and an agent can talk. No dependencies.
//   node live.mjs serve [--open] [--port=N] page.html   run in the background; prints the link to open (reuses a running helper)
//   node live.mjs wait [--timeout=600] [--dir=folder]   returns new messages as JSON, or {"timeout":true}
//   node live.mjs reply <n> "text" [--done] [--dir=folder]   answers conversation n; --done says the work is finished
//   node live.mjs status [--dir=folder]                 shows whether a helper runs and who is listening
// Conversations are kept in <page>.talkback.json beside each page; the address and secret token in .talkback-live.json.
import http from 'node:http';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, createReadStream, unlinkSync } from 'node:fs';
import { resolve, dirname, join, extname, relative, sep } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';

export const VERSION = 1;
const PORTS = 10, BASE_PORT = 47820;
const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (n) => (argv.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3);
const rest = argv.slice(1).filter((a) => !a.startsWith('--'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.txt': 'text/plain' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- agent side: talks to a running helper ----------
const runtimeFile = (dir) => join(dir, '.talkback-live.json');
const readRuntime = (dir) => { try { return JSON.parse(readFileSync(runtimeFile(dir), 'utf8')); } catch (e) { return null; } };
async function call(dir, path, body, ms) {
  const rt = readRuntime(dir);
  if (!rt) throw new Error('No helper found in ' + dir + '. Start it: node live.mjs serve page.html');
  const r = await fetch('http://127.0.0.1:' + rt.port + '/_agent/' + path, { method: 'POST', headers: { 'x-talkback-token': rt.token }, body: JSON.stringify(body || {}), signal: ms ? AbortSignal.timeout(ms) : undefined });
  if (!r.ok) throw new Error('Helper answered ' + r.status);
  return r.json();
}
const out = (o) => console.log(JSON.stringify(o, null, 2));

if (cmd === 'wait' || cmd === 'reply' || cmd === 'status') {
  const dir = resolve(flag('dir') || '.');
  try {
    if (cmd === 'wait') {
      const t = +flag('timeout') || 600;
      try { out(await call(dir, 'wait', { timeout: t }, (t + 15) * 1000)); } catch (e) { if (e.name === 'TimeoutError' || e.name === 'AbortError') out({ timeout: true, messages: [] }); else throw e; }
    } else if (cmd === 'reply') {
      if (!rest[0] || !rest[1]) throw new Error('Usage: reply <n> "text" [--done]');
      out(await call(dir, 'reply', { n: +rest[0], text: rest.slice(1).join(' '), done: argv.includes('--done') }));
    } else out(await call(dir, 'status'));
  } catch (e) { console.error(String(e.message || e)); process.exit(1); }
} else if (cmd === 'serve') serve();
else if (cmd) { console.error('Commands: serve, wait, reply, status'); process.exit(1); }

// ---------- helper side ----------
function serve() {
  const pageArg = rest[0];
  if (!pageArg || !existsSync(pageArg)) { console.error('Usage: node live.mjs serve [--open] page.html'); process.exit(1); }
  const page = resolve(pageArg), dir = dirname(page), name = relative(dir, page).split(sep).join('/');
  const link = (rt) => 'http://127.0.0.1:' + rt.port + '/' + encodeURI(name) + '?tb=' + rt.token;
  const launch = (rt) => { console.log(link(rt)); if (argv.includes('--open')) spawn(process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open', process.platform === 'win32' ? ['/c', 'start', '', link(rt)] : [link(rt)], { stdio: 'ignore', detached: true }).unref(); };

  const existing = readRuntime(dir);
  if (existing) {
    fetch('http://127.0.0.1:' + existing.port + '/_agent/status', { method: 'POST', headers: { 'x-talkback-token': existing.token }, signal: AbortSignal.timeout(1500) })
      .then((r) => { if (r.ok) { console.error('Helper already running.'); launch(existing); process.exit(0); } else start(); }, start);
  } else start();

  function start() {
    const token = randomBytes(16).toString('hex');
    const stores = new Map(); // page path -> { file, threads, next }
    const storeFile = (p) => join(dir, p + '.talkback.json');
    const load = (p) => {
      if (!stores.has(p)) { let d = null; try { d = JSON.parse(readFileSync(storeFile(p), 'utf8')); } catch (e) {} stores.set(p, { threads: (d && d.threads) || [], next: (d && d.next) || 1, hello: (d && d.hello) || null }); }
      return stores.get(p);
    };
    const saveStore = (p) => { const s = stores.get(p); writeFileSync(storeFile(p), JSON.stringify({ version: VERSION, next: s.next, hello: s.hello, threads: s.threads }, null, 1)); };
    try { for (const f of readdirSync(dir)) if (f.endsWith('.talkback.json')) load(f.slice(0, -14)); } catch (e) {}

    let waiters = [], lastWaitEnd = 0, hello = null;
    const listening = () => waiters.length > 0 || Date.now() - lastWaitEnd < 5000;
    const stOf = (t) => { if (t.resolved) return 'resolved'; const l = t.msgs[t.msgs.length - 1]; if (!l) return 'draft'; return l.who === 'user' ? (l.picked ? 'picked' : 'ready') : l.done ? 'done' : 'asks'; };
    const view = (t) => ({ id: t.id, n: t.n, st: stOf(t), resolved: !!t.resolved, msgs: t.msgs, target: t.target, selector: t.selector, section: t.section, context: t.context, quote: t.quote, start: t.start, end: t.end, fx: t.fx, fy: t.fy });
    const unread = () => { const r = []; for (const [p, s] of stores) for (const t of s.threads) { const fresh = t.msgs.filter((m) => m.who === 'user' && !m.picked); if (fresh.length) r.push({ p, t, fresh }); } return r; };
    const pageTime = (p) => { try { return statSync(join(dir, p)).mtimeMs; } catch (e) { return 0; } };
    const pack = ({ p, t, fresh }) => {
      const earlier = t.msgs.filter((m) => !fresh.includes(m)).map((m) => ({ who: m.who, text: m.text }));
      return { n: t.n, page: p, section: t.section || '', target: t.target, selector: t.selector, ...(t.quote ? { quote: t.quote } : {}), ...(t.fx !== undefined ? { positionInTarget: { x: Math.round(t.fx * 100) + '%', y: Math.round(t.fy * 100) + '%' } } : {}), ...(t.context ? { context: t.context } : {}), messages: fresh.map((m) => m.text), earlier };
    };
    const flushWaiters = () => {
      const u = unread();
      if (!u.length || !waiters.length) return;
      const w = waiters; waiters = []; lastWaitEnd = Date.now();
      const now = new Date().toISOString();
      for (const x of u) { for (const m of x.fresh) { m.picked = now; } saveStore(x.p); }
      const body = { messages: u.map(pack) };
      for (const f of w) f(body);
    };

    const json = (res, code, o) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(o)); };
    const readBody = (req) => new Promise((ok) => { let b = ''; req.on('data', (c) => { b += c; if (b.length > 2e6) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { ok({}); } }); });
    const pagePath = (p) => (typeof p === 'string' && p && !p.includes('..') && !p.startsWith('/') && !p.split('/').some((x) => x.startsWith('.')) ? p : name);

    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, 'http://x'), port = server.address().port;
      const hostOk = req.headers.host === '127.0.0.1:' + port || req.headers.host === 'localhost:' + port;
      if (!hostOk) return json(res, 403, { error: 'bad host' });
      const path = decodeURIComponent(url.pathname);
      const tok = req.headers['x-talkback-token'] || url.searchParams.get('tb');
      if (path.startsWith('/_agent/')) {
        if (req.headers.origin || tok !== token) return json(res, 403, { error: 'forbidden' });
        const b = await readBody(req);
        if (path === '/_agent/status') return json(res, 200, { version: VERSION, listening: listening(), unread: unread().length, pages: [...stores.keys()], threads: [...stores.values()].reduce((a, s) => a + s.threads.length, 0) });
        if (path === '/_agent/wait') {
          if (!hello) hello = new Date().toISOString(); // the first wait is the agent saying it listens
          const had = unread().length;
          const wake = (o) => json(res, 200, o);
          waiters.push(wake);
          const timer = setTimeout(() => { waiters = waiters.filter((x) => x !== wake); lastWaitEnd = Date.now(); json(res, 200, { timeout: true, messages: [] }); }, Math.max(1, Math.min(b.timeout || 600, 3600)) * 1000);
          res.on('close', () => { waiters = waiters.filter((x) => x !== wake); clearTimeout(timer); });
          if (had) flushWaiters();
          return;
        }
        if (path === '/_agent/reply') {
          for (const [p, s] of stores) {
            const t = s.threads.find((x) => x.n === b.n);
            if (!t) continue;
            const now = new Date().toISOString();
            for (const m of t.msgs) if (m.who === 'user' && !m.picked) m.picked = now;
            t.msgs.push({ who: 'agent', text: String(b.text || ''), at: now, ...(b.done ? { done: true } : {}) });
            saveStore(p);
            return json(res, 200, { ok: true, n: t.n, state: stOf(t) });
          }
          return json(res, 404, { error: 'no conversation ' + b.n });
        }
        return json(res, 404, { error: 'unknown' });
      }
      if (path.startsWith('/_tb/')) {
        if (tok !== token) return json(res, 401, { error: 'bad token' });
        if (req.headers.origin && req.headers.origin !== 'http://127.0.0.1:' + port && req.headers.origin !== 'http://localhost:' + port) return json(res, 403, { error: 'bad origin' });
        const b = req.method === 'POST' ? await readBody(req) : {};
        const p = pagePath(b.page || url.searchParams.get('page')), s = load(p);
        if (path === '/_tb/send') {
          const th = b.thread || {};
          if (!th.id || !b.text) return json(res, 400, { error: 'missing' });
          let t = s.threads.find((x) => x.id === th.id);
          if (!t) { t = { id: th.id, n: s.next++, msgs: [] }; s.threads.push(t); }
          Object.assign(t, { target: th.target, selector: th.selector, section: th.section, context: th.context, ...(th.quote ? { quote: th.quote, start: th.start, end: th.end } : {}), ...(th.fx !== undefined ? { fx: th.fx, fy: th.fy } : {}) });
          if (!t.msgs.some((m) => m.mid === b.mid)) { t.msgs.push({ who: 'user', text: String(b.text), at: b.at || new Date().toISOString(), mid: b.mid }); t.resolved = false; }
          saveStore(p);
          flushWaiters();
        }
        if (path === '/_tb/resolve') { const t = s.threads.find((x) => x.id === b.id); if (t) { t.resolved = !!b.resolved; saveStore(p); } }
        if (path === '/_tb/delete') { s.threads = s.threads.filter((x) => x.id !== b.id); saveStore(p); }
        return json(res, 200, { version: VERSION, listening: listening(), hello, pageTime: pageTime(p), threads: s.threads.map(view) });
      }
      // The page's folder: no dotfiles, no stored conversations.
      const file = resolve(dir, path === '/' ? name : '.' + path);
      if (!file.startsWith(dir + sep) || relative(dir, file).split(sep).some((x) => x.startsWith('.')) || file.endsWith('.talkback.json')) return json(res, 404, { error: 'not found' });
      try { if (!statSync(file).isFile()) throw 0; } catch (e) { return json(res, 404, { error: 'not found' }); }
      res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      createReadStream(file).pipe(res);
    });

    let tries = 0;
    const listen = (port) => server.listen(port, '127.0.0.1');
    server.on('error', (e) => { if (e.code === 'EADDRINUSE' && ++tries < PORTS) listen(BASE_PORT + tries); else { console.error('No free port: ' + e.message); process.exit(1); } });
    server.on('listening', () => {
      const rt = { port: server.address().port, token, pid: process.pid, version: VERSION };
      writeFileSync(runtimeFile(dir), JSON.stringify(rt), { mode: 0o600 });
      const bye = () => { try { if (readRuntime(dir).pid === process.pid) unlinkSync(runtimeFile(dir)); } catch (e) {} process.exit(0); };
      process.on('SIGINT', bye); process.on('SIGTERM', bye);
      console.error('Talkback helper running (Ctrl+C stops it). Open this link in the browser:');
      launch(rt);
    });
    listen(BASE_PORT);
  }
}

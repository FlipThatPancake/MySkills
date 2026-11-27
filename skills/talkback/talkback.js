/* talkback: Figma-style comments for any HTML page. Press C or use the toggle; Esc exits.
   Select text or click anything to comment; Enter saves. Copy JSON or Download exports every comment.
   With Talkback off, only the toggle stays, plus the download button while comments are unsaved. */
(() => {
  if (window.__commentMode) return;
  window.__commentMode = true;
  const KEY = 'talkback:' + location.pathname;
  const SPOTS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  const spot = SPOTS.includes((window.talkbackOptions || {}).toolbar) ? window.talkbackOptions.toolbar : 'bottom-center';
  const col = (window.talkbackOptions || {}).layout === 'column'; // actions stack above or below the toggle instead of beside it
  const COLORS = ['#0d99ff', '#f69b13', '#af63f2', '#f35151', '#1fbf5a', '#10b8c4', '#e5469a'];
  let items = [], dirty = false, on = false, box = null, picked = false, armed = 0; // box: { c, isNew, el }
  const pinEls = new Map(), markEls = new Map();
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    items = Array.isArray(d) ? d : (d && d.items) || [];
    dirty = Array.isArray(d) ? items.length > 0 : !!(d && d.dirty);
  } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ items, dirty })); } catch (e) {} };
  // Live link to an agent: only on a page opened from the helper's link (live.mjs), which carries a secret token.
  const LIVE_V = 1, uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  let token = null;
  try {
    token = new URLSearchParams(location.search).get('tb') || sessionStorage.getItem('talkback:tb');
    if (token && /^https?:/.test(location.protocol)) { sessionStorage.setItem('talkback:tb', token); history.replaceState(null, '', location.pathname + location.hash); } else token = null;
  } catch (e) { token = null; }
  const live = { on: !!token, ok: false, auth: true, ver: null, listening: false, hello: null, time: 0, stale: false };
  const pagePath = decodeURIComponent(location.pathname.slice(1));
  items.forEach((c) => { c.id = c.id || uid(); });
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const cut = (s, n = 120) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const colorOf = (c) => COLORS[(c.n - 1) % COLORS.length];
  const isText = (c) => c.quote !== undefined; // a text selection; other comments hang from a point

  // Where a comment lives: a CSS path to the element, plus a position inside it or the selected characters.
  const selectorOf = (el) => {
    const parts = [];
    for (; el && el !== document.documentElement; el = el.parentElement) {
      if (el.id) { parts.unshift('#' + CSS.escape(el.id)); break; }
      let i = 1;
      for (let s = el.previousElementSibling; s; s = s.previousElementSibling) if (s.localName === el.localName) i++;
      parts.unshift(el.localName + ':nth-of-type(' + i + ')');
    }
    return parts.join(' > ');
  };
  const sectionOf = (el) => {
    const s = el.closest('section,article,[data-slide],[role=tabpanel],main');
    const h = s && s.querySelector('h1,h2,h3');
    return h ? cut(clean(h.textContent), 80) : '';
  };
  const findEl = (c) => { try { return document.querySelector(c.selector); } catch (e) { return null; } };
  // The selected characters as a live Range; the quote is searched again if the text moved.
  function rangeOf(c, el) {
    const all = el.textContent;
    let s = c.start, e = c.end;
    if (all.slice(s, e) !== c.quote) { s = all.indexOf(c.quote); e = s + c.quote.length; }
    if (s < 0) return null;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), r = document.createRange();
    let pos = 0, n, started = false;
    while ((n = w.nextNode())) {
      const end = pos + n.nodeValue.length;
      if (!started && s < end) { r.setStart(n, s - pos); started = true; }
      if (started && e <= end) { r.setEnd(n, e - pos); return r; }
      pos = end;
    }
    return null;
  }
  // Screen geometry of a comment, or null while it is hidden: rects (text), pin (where its number sits), at (where its box hangs).
  function geoOf(c) {
    const el = findEl(c);
    if (!el || (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true }))) return null;
    if (!isText(c)) {
      const r = el.getBoundingClientRect(), p = [r.left + c.fx * r.width, r.top + c.fy * r.height];
      return { pin: p, at: p };
    }
    const rg = rangeOf(c, el);
    const all = rg ? [...rg.getClientRects()].filter((q) => q.width && q.height) : [];
    const rects = all.filter((a, i) => !all.some((b, j) => j !== i && b.left <= a.left && b.right >= a.right && b.top <= a.top && b.bottom >= a.bottom && (j < i || b.width > a.width || b.height > a.height)));
    if (!rects.length) return null;
    const last = rects[rects.length - 1];
    return { rects, pin: [last.right + 2, last.top], at: [Math.min(...rects.map((q) => q.left)), last.bottom] };
  }

  // What the pointer is over: a named element, an object, one line of text, a text block, or empty space.
  const OBJECTS = 'img,canvas,video,iframe,button,input,select,textarea,a,.katex,.MathJax,math';
  const BLOCKS = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,figcaption,td,th,dt,dd,label,summary,caption,pre,legend';
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const describe = (el) => clean(el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title') || el.textContent);
  const union = (rs) => {
    const r = { left: Math.min(...rs.map((q) => q.left)), top: Math.min(...rs.map((q) => q.top)), right: Math.max(...rs.map((q) => q.right)), bottom: Math.max(...rs.map((q) => q.bottom)) };
    return Object.assign(r, { width: r.right - r.left, height: r.bottom - r.top });
  };
  function lineAt(block, x, y) {
    const caret = document.caretRangeFromPoint && document.caretRangeFromPoint(x, y);
    if (!caret || caret.startContainer.nodeType !== 3 || !block.contains(caret.startContainer)) return null;
    const all = document.createRange();
    all.selectNodeContents(block);
    const rs = [...all.getClientRects()].filter((q) => q.width && y >= q.top && y <= q.bottom);
    if (!rs.length) return null;
    const r = union(rs);
    if (x < r.left || x > r.right) return null;
    const mid = (r.top + r.bottom) / 2, a = document.caretRangeFromPoint(r.left + 1, mid), b = document.caretRangeFromPoint(r.right - 0.5, mid);
    let text = '';
    if (a && b) { const t = document.createRange(); t.setStart(a.startContainer, a.startOffset); t.setEnd(b.startContainer, b.startOffset); text = clean(t.toString()); }
    return { el: block, rect: r, type: 'text line', text: text || describe(block), txt: true };
  }
  function targetAt(x, y) {
    let el = document.elementFromPoint(x, y);
    if (el === document.documentElement) el = document.body; // below a short page
    if (!el || el === host) return null;
    const named = el.closest('[data-comment]');
    if (named) return { el: named, type: named.localName, name: named.dataset.comment, text: cut(describe(named)), txt: !!el.closest('text') || (!(el instanceof SVGElement) && !el.closest(OBJECTS) && !!(el.closest(BLOCKS) || ownText(el))) }; // text inside a named element can still be selected
    if (el instanceof SVGElement) return { el, type: el.localName === 'svg' ? 'svg' : 'svg ' + el.localName, text: cut(describe(el)), txt: !!el.closest('text') };
    const obj = el.closest(OBJECTS);
    if (obj) return { el: obj, type: obj.localName === 'a' ? 'link' : obj.matches('.katex,.MathJax,math') ? 'math' : obj.localName, text: cut(describe(obj)) };
    const block = el.closest(BLOCKS) || (ownText(el) ? el : null);
    if (block) return lineAt(block, x, y) || { el: block, type: block.localName, text: cut(describe(block)), txt: true };
    return { el, type: 'empty space', text: '', space: true };
  }
  // The comment a click on already highlighted text belongs to.
  const markAt = (x, y) => items.find((c) => {
    const g = isText(c) && geoOf(c);
    return g && g.rects.some((q) => x >= q.left && x <= q.right && y >= q.top && y <= q.bottom);
  });
  // The comment that selected text would make: attached to the block that holds it, with exact character offsets.
  function fromSelection() {
    const sel = getSelection(), r = sel.rangeCount && sel.getRangeAt(0), quote = r ? r.toString() : '';
    if (!quote.trim()) return null;
    let el = r.commonAncestorContainer;
    if (el.nodeType !== 1) el = el.parentElement || document.body;
    el = el.closest(BLOCKS) || el;
    const pre = document.createRange();
    pre.selectNodeContents(el);
    pre.setEnd(r.startContainer, r.startOffset);
    sel.removeAllRanges();
    const start = pre.toString().length;
    return make(el, { target: { type: 'text selection', text: clean(quote) }, quote, start, end: start + quote.length });
  }
  function make(el, extra) {
    let context = null;
    try { context = typeof window.commentContext === 'function' ? window.commentContext() : null; } catch (err) {}
    return { n: items.length + 1, id: uid(), text: '', selector: selectorOf(el), section: sectionOf(el), at: new Date().toISOString(), context, ...extra };
  }

  // UI lives in a shadow root so page styles cannot touch it.
  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'open' });
  const [vert, horiz] = spot.split('-');
  const SEND = '<svg viewBox="0 0 12 13"><path d="M5.4.2.25 5.1c-.27.27-.37.86-.07 1.18.3.32.88.32 1.19 0l3.77-3.57v9.48a.81.81 0 0 0 1.62 0V2.7l3.77 3.57c.3.32.9.34 1.18 0 .26-.31.27-.9-.07-1.18L6.51.22C6.3 0 5.76-.15 5.4.22Z" fill="currentColor"/></svg>';
  const TRASH = '<svg viewBox="0 0 9 11"><path d="M6.13.57 6 .1A.14.14 0 0 0 5.87 0H2.57a.14.14 0 0 0-.14.1l-.13.47a.14.14 0 0 1-.13.1H.14A.14.14 0 0 0 0 .81v.4c0 .07.06.13.14.13h8.16c.08 0 .14-.06.14-.14V.8a.14.14 0 0 0-.14-.14H6.26a.14.14 0 0 1-.13-.1ZM.25 1.94v7.2c0 .69.55 1.23 1.23 1.23h5.47c.68 0 1.23-.55 1.23-1.23v-7.2H.25Zm1.54 7.01a.23.23 0 0 1-.23.23h-.05a.23.23 0 0 1-.23-.23V3.34c0-.12.1-.22.23-.22h.05c.13 0 .23.1.23.22v5.61Zm2.68 0a.23.23 0 0 1-.23.23h-.05a.23.23 0 0 1-.23-.23V3.34c0-.12.1-.22.23-.22h.05c.13 0 .23.1.23.22v5.61Zm2.68 0a.23.23 0 0 1-.23.23h-.05a.23.23 0 0 1-.23-.23V3.34c0-.12.1-.22.23-.22h.05c.13 0 .23.1.23.22v5.61Z" fill="currentColor"/></svg>';
  const PIN = {
    spark: '<svg viewBox="0 0 16 16"><path d="M8 2.2c.9 3.3 2.5 4.9 5.8 5.8-3.3.9-4.9 2.5-5.8 5.8-.9-3.3-2.5-4.9-5.8-5.8 3.3-.9 4.9-2.5 5.8-5.8Z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    person: '<svg viewBox="0 0 16 16"><circle cx="8" cy="5.6" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.2 13.4c.6-2.7 2.4-4 4.8-4s4.2 1.3 4.8 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    add: '<svg viewBox="0 0 16 16"><path d="M13.5 8.5a5 5 0 0 1-5 5H4l-1.5 1.5V8.5a5 5 0 0 1 5-5H8.5a5 5 0 0 1 5 5ZM8 6v4M6 8h4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    tick: '<svg viewBox="0 0 16 16"><path d="m3.5 8.4 2.8 2.8 6.2-6.4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    back: '<svg viewBox="0 0 16 16"><path d="M6.5 3.5 3 7l3.5 3.5M3.5 7H10a3 3 0 0 1 0 6H8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    image: '<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="m3 11.5 3.2-3.2 2.3 2.3 1.6-1.6 2.9 2.9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    text: '<svg viewBox="0 0 16 16"><path d="M2.5 4h11M2.5 8h11M2.5 12h6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    button: '<svg viewBox="0 0 16 16"><rect x="2" y="4.5" width="12" height="7" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6 8h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    spot: '<svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2.4 2"/></svg>',
  };
  // Popup choices: where the pin sits and how your turns line up.
  const pinInside = () => (window.talkbackOptions || {}).pin === 'inside';
  const turnsLeft = () => (window.talkbackOptions || {}).userTurns === 'left';
  const INK = { err: '#a71414', '': '#585854', queued: '#0a7bd4', ready: '#0a7bd4', picked: '#0a7bd4', asks: '#b86e00', done: '#16883f', resolved: '#5f5f5f' };
  const DOT = { err: '#e5484d', queued: '#8b8b8b', ready: '#0d99ff', picked: '#0d99ff', asks: '#f69b13', done: '#1fbf5a', resolved: '#8b8b8b' };
  const chipOf = (c) => {
    const ty = (c.target && c.target.type) || '', txt = isText(c) || /^(text|p|h\d|li|blockquote|label|td|th)/.test(ty) ? 'text' : /^(img|svg|canvas|video|picture)/.test(ty) ? 'image' : /^(button|a|link|input|select|textarea)/.test(ty) ? 'button' : 'spot';
    const name = c.target.name || (isText(c) ? cut(c.quote, 40) : c.target.text ? cut(c.target.text, 40) : ty);
    return [PIN[txt], name];
  };
  const ICON = {
    tg: '<svg viewBox="0 0 16 16"><path d="M2.95 0h9.18a2.95 2.95 0 0 1 2.94 2.95v6.1A2.95 2.95 0 0 1 12.13 12H3.6L0 15.06V2.95A2.95 2.95 0 0 1 2.95 0Z" fill="currentColor"/></svg>',
    dl: '<svg viewBox="0 0 16 17"><path d="M14.48 9.59 9.33 14.57c-.46.46-.76.72-1.05.93h5.03v1.25H2v-1.25h5.02c-.29-.21-.67-.47-1.13-.93L.74 9.5c-.84-.92-.25-1.13.38-1.13h2.51V1.68C3.63.5 4.47 0 5.3 0h4.6c1.35 0 1.69.88 1.69 1.68v6.7h2.47c1.05 0 1.26.33.42 1.21Z" fill="currentColor"/></svg>',
    cp: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="5" width="10" height="10" rx="2"/><path d="M11 2.8A1.8 1.8 0 0 0 9.2 1H2.8A1.8 1.8 0 0 0 1 2.8v6.4A1.8 1.8 0 0 0 2.8 11"/></svg>',
    st: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="currentColor"/></svg>',
    rl: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13.5 8A5.5 5.5 0 1 1 11.9 4.1M13.5 1.5v3h-3"/></svg>',
    cl: TRASH.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"'),
  };
  // Every toolbar button is an icon plus a label; a theme decides when the label shows.
  const tool = (a, label, title) => `<button class="p ${a}" data-a="${a}" title="${title}"><i class="ic">${ICON[a]}</i><span class="lw"><span class="lb">${label}</span></span></button>`;
  root.innerHTML = `<style>
    :host{position:fixed;inset:0;pointer-events:none;z-index:2147483647;font:13px/1.4 system-ui,sans-serif;--blue:#0d99ff;--edge:16px}
    @media print{:host{display:none}}
    [hidden]{display:none!important}
    button{font:inherit;cursor:pointer;border:0;padding:0;color:inherit;background:none}
    .bar{position:fixed;${vert}:var(--edge);${horiz === 'center' ? 'left:50%;transform:translateX(-50%)' : horiz + ':var(--edge)'};pointer-events:auto}
    .x{position:absolute;display:flex;align-items:center;gap:var(--xgap,6px);width:max-content}
    .x{${col ? `${vert}:calc(100% + var(--xgap,6px));flex-direction:${vert === 'bottom' ? 'column' : 'column-reverse'};align-items:${horiz === 'right' ? 'flex-end' : horiz === 'center' ? 'center' : 'flex-start'};${horiz === 'center' ? 'left:50%;transform:translateX(-50%)' : horiz + ':0'}` : `${vert}:0;flex-direction:${horiz === 'right' ? 'row' : 'row-reverse'};flex-wrap:wrap;max-width:${horiz === 'center' ? 'calc(50vw - 90px)' : 'calc(100vw - 190px)'};${horiz === 'right' ? 'right' : 'left'}:calc(100% + 6px)`}}
    .p{position:relative;display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:99px;font-weight:500;white-space:nowrap;
      background:#161616ee;color:#e8e6e1;border:1px solid #ffffff26;box-shadow:0 2px 10px #0004;backdrop-filter:blur(8px)}
    .p:hover{border-color:#ffffff77}
    .ic{display:flex;width:12px;height:12px}.ic svg{width:100%;height:100%}
    .lw{display:contents}.dl:is(:hover,:not(.dirty)) .nw,.dl.dirty:not(:hover) .hw{display:none}
    .on .tg{background:#dbdbd6;color:#292929;border-color:#dbdbd6}
    .bar:not(.on) .dl{height:22px;padding:0 9px;font-size:11px;box-shadow:none}
    .dl.dirty{color:#ffb454;border-color:#ffb45477}
    .cl.arm{background:#e5484d;border-color:#e5484d;color:#fff}
    .tip{position:absolute;${vert}:calc(100% + 12px);${horiz === 'center' ? 'left:50%;transform:translateX(-50%)' : horiz + ':0'};width:300px;padding:16px 18px;
      background:#000000e0;color:#dfdeda;border:1px solid #dfdeda24;border-radius:20px;backdrop-filter:blur(14px);cursor:pointer}
    .tip p{margin:0;font-size:15px;line-height:1.4}
    .tip div{display:flex;align-items:center;justify-content:space-between;margin-top:14px;font-size:11px;letter-spacing:.05em;text-transform:uppercase}
    .tip span{opacity:.55}.tip button{padding:6px 12px;border:1px solid #dfdeda55;border-radius:99px;letter-spacing:inherit}
    .st .ic svg{color:#8b8b8b}.bar[data-live=ok] .st .ic svg{color:#1fbf5a}.bar[data-live=wait] .st .ic svg{color:#f69b13}
    .panel{position:absolute;${vert}:calc(100% + 12px);${horiz === 'center' ? 'left:50%;transform:translateX(-50%)' : horiz + ':0'};width:min(calc(100vw - 32px),340px);box-sizing:border-box;padding:16px 18px;
      background:#000000e0;color:#dfdeda;border:1px solid #dfdeda24;border-radius:20px;backdrop-filter:blur(14px)}
    .panel h4{margin:0 0 8px;font-size:14px;font-weight:600}.panel p{margin:6px 0;font-size:13px}
    .panel ul{margin:0;padding:0;list-style:none}.panel li{margin:5px 0;font-size:12.5px;padding-left:18px;position:relative}
    .panel li:before{content:'';position:absolute;left:0;top:5px;width:9px;height:9px;border-radius:50%;background:#8b8b8b}
    .panel li.ok:before{background:#1fbf5a}.panel li.bad:before{background:#e5484d}.panel li.wait:before{background:#f69b13}
    .panel li small{display:block;opacity:.65}.panel .row{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
    .panel button{padding:6px 12px;border:1px solid #dfdeda55;border-radius:99px;font-size:12px}
    /* the comment popup: one card holding the thread and the line you type in, with a round pin level with that line */
    .box{position:fixed;left:0;top:0;display:flex;align-items:flex-end;pointer-events:auto;--surf:#fff;--ring:#7a7a76;--hair:#d0cfca;--chip:#ecebe8;--ink:#1f1f1f;--soft:#585854;--sub:#62625d}
    .card{box-sizing:border-box;width:360px;max-width:calc(100vw - 46px);padding:14px;background:var(--surf);border:1px solid var(--ring);border-radius:26px;color:var(--ink);font-size:15px;line-height:1.4;text-wrap:pretty;
      box-shadow:0 10px 30px #00000024;animation:pop .22s ease;margin:0 0 -12px -4px}
    .box.flip{flex-direction:row-reverse}.box.flip .card{margin:0 -4px -12px 0}
    .box.inside .card{margin:0 0 -15px -7px;border-bottom-left-radius:4px;max-width:calc(100vw - 16px)}
    .box.inside.flip .card{margin:0 -7px -15px 0;border-radius:26px 26px 4px 26px}
    .bub{flex:none;position:relative;z-index:2;display:grid;place-items:center;width:34px;height:34px;border-radius:17px 17px 17px 3px;background:var(--surf);
      box-shadow:inset 0 0 0 1px var(--ring),0 2px 8px #0003;color:var(--pc,var(--soft))}
    .bub svg{width:17px;height:17px}
    .box.flip .bub{border-radius:17px 17px 3px 17px}
    .box.inside .bub{width:28px;height:28px;margin:0 0 0 -8px;align-self:flex-end;border-radius:14px 14px 14px 3px;box-shadow:inset 0 0 0 1px var(--ring)}
    .box.inside.flip .bub{margin:0 -8px 0 8px;border-radius:14px 14px 3px 14px;order:1}
    .box.inside .bub svg{width:15px;height:15px}
    .box.inside .hd .bub{align-self:center}
    .hd{display:flex;align-items:center;gap:8px;min-height:28px;margin:0 0 10px;font-size:12px}
    .stl{flex:none;color:var(--soft);white-space:nowrap}
    .stl::before{content:'';display:inline-block;width:8px;height:8px;margin-right:7px;border-radius:50%;background:var(--sc,#8b8b8b);vertical-align:-0.5px;box-sizing:border-box}
    .box[data-st=queued] .stl::before{background:none;border:2px dashed #8b8b8b}
    .chip{display:inline-flex;align-items:center;gap:5px;min-width:0;height:22px;padding:0 9px 0 6px;border-radius:99px;background:var(--chip);color:#3f3f3b;font-size:12.5px;white-space:nowrap}
    .chip svg{width:13px;height:13px;flex:none}.chip span{min-width:0;overflow:hidden;text-overflow:ellipsis}
    .rs{margin-left:auto;flex:none;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;box-shadow:inset 0 0 0 1px var(--ring);color:#3f3f3b;transition:background .2s}
    .rs:hover{background:var(--chip)}.rs svg{width:15px;height:15px}
    .box.res .hd{margin:0}.box.res .hd .first{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--soft)}.box.res :is(.ml,.cmp){display:none}
    .ml{max-height:300px;overflow:auto;display:flex;flex-direction:column;gap:4px;margin:0 -8px;padding:0 8px;scroll-snap-type:y proximity}
    .ml.scr{-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 24px);mask-image:linear-gradient(to bottom,transparent 0,#000 24px)}
    .m{display:flex;gap:10px;padding:5px 0;scroll-snap-align:start}
    .m.u{margin-left:30px}.box.left .m.u{margin-left:0}
    .mk{flex:none;display:grid;place-items:center;width:1.35em;height:1.35em;margin-block:calc((1lh - 1.35em) / 2);border-radius:50%;background:var(--surf);box-shadow:inset 0 0 0 1px var(--ring)}
    .mk svg{width:.85em;height:.85em}
    .tx{white-space:pre-wrap;overflow-wrap:anywhere}
    .tx small,.sm{display:block;margin:2px 0 0;font-size:12px;line-height:1.35;color:var(--soft)}
    .sm{margin-left:30px}
    .tx button{margin-left:8px;padding:2px 8px;border-radius:99px;box-shadow:inset 0 0 0 1px var(--ring);font-size:12px}
    .vh{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
    .cmp{display:flex;gap:10px;align-items:flex-start;min-height:28px}
    .conv:not([hidden])~.cmp{margin:8px -8px 0;padding:10px 8px 0;border-top:1px solid var(--hair)}
    .conv:not([hidden])~.cmp textarea{padding-left:30px}.box:not(.left) .conv:not([hidden])~.cmp textarea{padding-left:60px}
    .box.inside.left .conv:not([hidden])~.cmp textarea{padding-left:0}.box.inside:not(.left) .conv:not([hidden])~.cmp textarea{padding-left:30px}
    textarea{box-sizing:border-box;flex:1;min-width:0;max-height:160px;resize:none;border:0;outline:0;padding:3.5px 0;background:none;font:inherit;color:inherit}
    textarea::placeholder{color:var(--sub)}
    .cb{flex:none;align-self:flex-end;display:grid;place-items:center;width:26px;height:26px;margin-block:1px;border-radius:50%;background:none;color:var(--sub);box-shadow:inset 0 0 0 1px var(--ring)}
    .cb svg{width:13px;height:13px}.cb.go:not(:disabled){background:var(--ink);color:var(--surf);box-shadow:none}.cb.del:hover{color:#a71414}.cb:disabled{cursor:not-allowed}
    @keyframes pop{from{opacity:0;transform:translateY(4px) scale(.97)}}
    .pin:not([data-st=""])::after{content:'';position:absolute;right:-6px;top:-6px;width:10px;height:10px;box-sizing:border-box;border-radius:50%;border:2px solid #8b8b8b;background:#fff}
    .pin[data-st=picked]::after{background:#0d99ff;border-color:#fff}.pin[data-st=asks]::after{background:#f69b13;border-color:#fff}.pin[data-st=done]::after{background:#1fbf5a;border-color:#fff}
    .pin[data-st=queued]::after{border-style:dashed}.pin[data-st=resolved]{opacity:.5}.pin[data-st=resolved]::after{background:#8b8b8b;border-color:#fff}
    .hl{position:fixed;border:2px solid var(--blue);background:#0d99ff14;border-radius:3px;box-sizing:border-box}
    .tag{position:fixed;max-width:280px;padding:2px 6px;background:var(--blue);color:#fff;border-radius:4px;font-size:11px;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mk i{position:fixed;box-sizing:border-box;border-bottom:2px solid var(--c);border-radius:2px;
      background:color-mix(in srgb,var(--c) 28%,transparent)}
    .pin{position:fixed;left:0;top:0;width:26px;height:26px;margin:-26px 0 0;border-radius:13px 13px 13px 0;
      background:var(--c);color:#fff;font-weight:600;text-align:center;line-height:22px;border:2px solid #fff;
      box-sizing:border-box;box-shadow:0 2px 6px #0005;pointer-events:auto}
    .pin.text{width:20px;height:20px;margin:-10px 0 0;border-radius:10px;line-height:16px;font-size:11px}
  </style><div id="marks"></div><div class="hl" hidden></div><div class="tag" hidden></div><div id="pins"></div>
  <div class="bar${col ? ' col' : ''}">${tool('tg', 'Comment', 'Talkback (C)')}
  <div class="x">${tool('rl', 'Updated, reload', 'The page changed: reload it')}${tool('st', 'Live', 'Live link status')}${tool('cl', '', 'Clear all comments')}${tool('cp', 'Copy JSON', 'Copy every comment as JSON')}${tool('dl', '<span class="nw"><span class="n"></span></span><span class="hw"><span class="h">Download comments</span></span>', 'Download every comment as JSON')}</div>
  <div class="panel" hidden></div><div class="tip" hidden><p>Select text, or click anything on the page, to pin a comment there.</p><div><span>Esc exits · C toggles</span><button>Got it</button></div></div></div>`;
  if (window.talkbackOptions && window.talkbackOptions.css) root.appendChild(document.createElement('style')).textContent = window.talkbackOptions.css;
  const $ = (s) => root.querySelector(s);
  const pins = $('#pins'), marks = $('#marks'), hl = $('.hl'), tag = $('.tag'), bar = $('.bar');

  const css = document.createElement('style');
  // @font-face only works in the page's own stylesheet, so a theme's font rules are copied there.
  // The empty area of an SVG laid over text lets clicks and selections through; its drawn shapes still catch them.
  css.textContent = 'html.cm-on,html.cm-on *{cursor:crosshair!important;-webkit-user-select:text!important;user-select:text!important}:where(html.cm-on svg){pointer-events:none}:where(html.cm-on svg *){pointer-events:visiblePainted}' +(((window.talkbackOptions || {}).css || '').match(/@font-face\{[^}]*\}/g) || []).join('');
  // A theme can style light pages differently: the host gets .light when the page background is light.
  const lightPage = () => {
    for (const el of [document.body, document.documentElement]) {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (m && (m[3] === undefined || +m[3] > 0.5)) return 0.3 * m[0] + 0.59 * m[1] + 0.11 * m[2] > 140;
    }
    return true;
  };
  const mount = () => { document.head.appendChild(css); document.body.appendChild(host); host.classList.toggle('light', lightPage()); };
  document.body ? mount() : document.addEventListener('DOMContentLoaded', mount);

  const label = (t) => (t.name ? t.name : t.type) + (t.text && !t.name ? ': ' + t.text : '');
  function highlight(t) {
    hl.hidden = tag.hidden = !t || t.space;
    if (hl.hidden) return;
    const r = t.rect || t.el.getBoundingClientRect();
    if (r.width * r.height > 0.35 * innerWidth * innerHeight) { hl.hidden = tag.hidden = true; return; } // a page-sized object is not worth outlining
    Object.assign(hl.style, { left: r.left - 3 + 'px', top: r.top - 3 + 'px', width: r.width + 6 + 'px', height: r.height + 6 + 'px' });
    tag.textContent = label(t);
    tag.style.left = Math.max(4, Math.min(r.left - 3, innerWidth - tag.offsetWidth - 4)) + 'px';
    tag.style.top = (r.top - 26 > 0 ? r.top - 26 : r.bottom + 6) + 'px';
  }

  // Toolbar: with Talkback off only the toggle shows, plus the download button while comments are unsaved.
  const TIP = 'talkback:tip-seen';
  let tipSeen = false;
  try { tipSeen = !!localStorage.getItem(TIP); } catch (e) {}
  const hideTip = () => { tipSeen = true; try { localStorage.setItem(TIP, '1'); } catch (e) {} syncBar(); };
  $('.tip').onclick = hideTip;
  const say = (b, t) => (b.querySelector('.lb').textContent = t);
  function syncBar() {
    const n = items.length, dl = $('.dl'), cl = $('.cl');
    bar.classList.toggle('on', on);
    $('.tg').setAttribute('aria-pressed', on);
    pins.hidden = marks.hidden = !on;
    $('.cp').hidden = cl.hidden = !on || !n;
    dl.hidden = !n || (!on && !dirty);
    $('.tip').hidden = !on || tipSeen;
    dl.querySelector('.n').textContent = n + ' unsaved'; // shown while dirty; hover shows Download comments
    dl.title = n + (n === 1 ? ' comment' : ' comments') + (dirty ? ', not downloaded or copied yet' : ', saved') + ' · click to download';
    dl.classList.toggle('dirty', dirty);
    say(cl, armed ? 'Click again to clear' : 'Clear comments');
    cl.classList.toggle('arm', !!armed);
    $('.st').hidden = !live.on;
    $('.rl').hidden = !live.stale;
    bar.dataset.live = !live.on ? '' : !live.ok ? 'off' : live.listening ? 'ok' : 'wait';
    say($('.st'), !live.ok ? 'Offline' : live.listening ? 'Live' : 'Nobody listening');
    for (const [c, b] of pinEls) b.dataset.st = stOf(c);
    $('.tip p').textContent = 'Select text, or click anything on the page, to pin a comment there.' + (live.on || cc ? '' : ' To talk with your agent here, tell it: “Go live with Talkback on this page”.');
    paintLive();
  }
  const setMode = (v) => {
    on = v;
    document.documentElement.classList.toggle('cm-on', on);
    if (!on) { closeBox(true); highlight(null); }
    syncBar();
  };

  function render() {
    items.forEach((c, i) => (c.n = i + 1));
    pins.textContent = marks.textContent = '';
    pinEls.clear();
    markEls.clear();
    for (const c of items.concat(box && box.isNew ? [box.c] : [])) {
      const b = document.createElement('button');
      b.className = 'pin' + (isText(c) ? ' text' : '');
      b.style.setProperty('--c', colorOf(c));
      b.textContent = c.n;
      b.title = c.text || 'New comment';
      b.dataset.st = stOf(c);
      b.onclick = (e) => { e.stopPropagation(); if (!box || box.c !== c) { closeBox(true); openBox(c, false); } };
      pinEls.set(c, b);
      pins.appendChild(b);
      if (isText(c)) {
        const m = document.createElement('div');
        m.className = 'mk';
        m.style.setProperty('--c', colorOf(c));
        markEls.set(c, m);
        marks.appendChild(m);
      }
    }
    syncBar();
  }

  function openBox(c, isNew) {
    highlight(null);
    if (!tipSeen) hideTip();
    const el = document.createElement('div');
    el.className = 'box' + (pinInside() ? ' inside' : '') + (turnsLeft() ? ' left' : '');
    el.style.setProperty('--c', colorOf(c));
    const pin = '<div class="bub"></div>';
    el.innerHTML = (pinInside() ? '' : pin) + '<div class="card"><div class="conv" hidden></div><div class="cmp">' + (pinInside() ? pin : '') + '<textarea rows="1" aria-label="Comment" placeholder="Add a comment"></textarea><button class="cb del" title="Delete" aria-label="Delete">' + TRASH + '</button><button class="cb go" title="' + (live.on || cc ? 'Send to agent (Enter)' : 'Save (Enter)') + '" aria-label="Send">' + SEND + '</button></div></div>';
    const ta = el.querySelector('textarea'), go = el.querySelector('.go'), del = el.querySelector('.del');
    const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; go.disabled = !ta.value.trim(); };
    const talking = chat() && (c.msgs || []).length; // a conversation: the field is for the next message
    ta.value = talking ? '' : c.text || '';
    if (talking) ta.placeholder = 'Reply';
    del.hidden = isNew;
    del.onclick = () => { items = items.filter((x) => x !== c); dirty = true; if (live.on) api('delete', { id: c.id }).catch(() => {}); closeBox(false); };
    go.onclick = () => (chat() ? sendMsg() : closeBox(true));
    ta.oninput = fit;
    ta.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); chat() ? sendMsg() : closeBox(true); }
      if (e.key === 'Escape') closeBox(false);
    };
    box = { c, isNew, el, fit };
    root.appendChild(el);
    render();
    paintConv();
    fit();
    ta.focus();
  }
  // commit=true keeps the text; an empty comment is dropped.
  function closeBox(commit) {
    if (!box) return;
    const { c, isNew, el } = box;
    const text = el.querySelector('textarea').value.trim();
    box = null;
    el.remove();
    if (chat() && (c.msgs || []).length) {
      // a conversation: a half-typed reply is dropped
    } else if (commit && text && text !== c.text) {
      c.text = text;
      if (isNew) items.push(c);
      dirty = true;
    } else if (commit && !text && !isNew) {
      items = items.filter((x) => x !== c);
      dirty = true;
    }
    save();
    render();
  }

  // Keep pins, highlights and the open box attached to their content through scrolling, resizing and animation.
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  (function tick() {
    if (on) {
      for (const c of items.concat(box && box.isNew ? [box.c] : [])) {
        const g = geoOf(c), pin = pinEls.get(c), mk = markEls.get(c);
        if (!pin) continue;
        pin.hidden = !g || (box && box.c === c); // the open box stands in for its pin
        if (mk) mk.hidden = !g;
        if (!g) continue;
        pin.style.transform = `translate(${g.pin[0]}px,${g.pin[1]}px)`;
        if (!mk) continue;
        while (mk.children.length < g.rects.length) mk.appendChild(document.createElement('i'));
        while (mk.children.length > g.rects.length) mk.lastChild.remove();
        g.rects.forEach((q, i) => Object.assign(mk.children[i].style, { left: q.left + 'px', top: q.top + 'px', width: q.width + 'px', height: q.height + 'px' }));
      }
      const g = box && (geoOf(box.c) || (box.c.detached ? { at: [innerWidth / 2 - 140, innerHeight / 2] } : null));
      if (g) {
        const w = box.el.offsetWidth, h = box.el.offsetHeight, [px, py] = g.at;
        // A point comment hangs from the bubble's tip, its bottom corner, flipping left near the right edge; a text comment sits under its text.
        const flip = isText(box.c) ? px + 8 + w > innerWidth - 8 : px + w > innerWidth - 8;
        box.el.classList.toggle('flip', flip);
        // A long thread scrolls inside the room the page leaves, so the pin can stay on its spot.
        const ml = box.el.querySelector('.ml');
        if (ml && ml.offsetParent) {
          const chrome = box.el.querySelector('.card').offsetHeight - ml.offsetHeight, over = pinInside() ? 15 : 12;
          const room = isText(box.c) ? innerHeight - 20 - (py + 10) + over - chrome : py + over - 8 - chrome;
          const cap = Math.round(clamp(room, 90, 300));
          if (ml.style.maxHeight !== cap + 'px') { const end = ml.scrollTop + ml.clientHeight >= ml.scrollHeight - 2; ml.style.maxHeight = cap + 'px'; if (end) ml.scrollTop = ml.scrollHeight; }
        }
        const x = isText(box.c) ? clamp(px + 8, 8, innerWidth - w - 8) : clamp(flip ? px - w : px, 8, innerWidth - w - 8);
        box.el.style.transform = `translate(${x}px,${clamp(isText(box.c) ? py + 10 : py - h, 8, innerHeight - h - 20)}px)`;
      }
    }
    requestAnimationFrame(tick);
  })();

  // While commenting, the page must not react to clicks. Text keeps its default so it can be selected.
  const inUi = (e) => e.composedPath().includes(host);
  for (const t of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'dblclick'])
    document.addEventListener(t, (e) => {
      if (!on || inUi(e)) return;
      e.stopPropagation();
      const t = e.type === 'mouseup' ? null : targetAt(e.clientX, e.clientY);
      if (!t || !t.txt) e.preventDefault();
    }, true);
  document.addEventListener('mouseup', (e) => {
    if (!on || inUi(e) || (box && (!box.isNew || box.el.querySelector('textarea').value))) return;
    const c = fromSelection();
    if (!c) return;
    closeBox(false); // an empty box left by the first click of a double-click
    picked = true;
    setTimeout(() => (picked = false));
    openBox(c, true);
  }, true);
  document.addEventListener('pointermove', (e) => { if (on && !box) highlight(inUi(e) || e.buttons ? null : targetAt(e.clientX, e.clientY)); }, true);
  document.addEventListener('scroll', () => highlight(null), true);
  document.addEventListener('click', (e) => {
    if (!on || inUi(e)) return;
    e.preventDefault();
    e.stopPropagation();
    if (picked) return;
    if (box) return closeBox(true);
    const hit = markAt(e.clientX, e.clientY);
    if (hit) return openBox(hit, false);
    const t = targetAt(e.clientX, e.clientY);
    if (!t) return;
    const r = t.el.getBoundingClientRect();
    const c = make(t.el, {
      target: { type: t.type, ...(t.name ? { name: t.name } : {}), ...(t.text ? { text: t.text } : {}) },
      fx: r.width ? (e.clientX - r.left) / r.width : 0.5, fy: r.height ? (e.clientY - r.top) / r.height : 0.5,
    });
    openBox(c, true);
  }, true);

  document.addEventListener('keydown', (e) => {
    const t = e.composedPath()[0];
    if (e.key === 'Escape') return panelOpen ? ((panelOpen = false), paintLive()) : box ? closeBox(false) : setMode(false);
    if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey && !/^(input|textarea|select)$/i.test(t.localName) && !t.isContentEditable) setMode(!on);
  });

  const exportData = () => {
    let extras = null;
    try { extras = typeof window.commentExtras === 'function' ? window.commentExtras() : null; } catch (err) {}
    return {
      page: document.title,
      exportedAt: new Date().toISOString(),
      comments: items.map((c) => ({
        n: c.n, comment: c.text, section: c.section, target: c.target, selector: c.selector,
        ...(isText(c) ? {} : { positionInTarget: { x: +(c.fx * 100).toFixed(1) + '%', y: +(c.fy * 100).toFixed(1) + '%' } }),
        ...(c.context ? { context: c.context } : {}),
        ...((c.msgs || []).length ? { conversation: c.msgs.map((m) => ({ from: m.who, text: m.text })) } : {}),
      })),
      ...(extras ? { extras } : {}),
    };
  };
  const delivered = () => { dirty = false; save(); syncBar(); };
  bar.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const a = b.dataset.a, json = JSON.stringify(exportData(), null, 2);
    if (a === 'tg') setMode(!on);
    if (a === 'st') { panelOpen = !panelOpen; guide = false; paintLive(); }
    if (a === 'rl') reload();
    if (a === 'cp') {
      const fallback = () => { const ta = document.createElement('textarea'); ta.value = json; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); };
      (navigator.clipboard ? navigator.clipboard.writeText(json) : Promise.reject()).catch(fallback).then(() => {
        say(b, 'Copied ✓');
        setTimeout(() => say(b, 'Copy JSON'), 1500);
        delivered();
      });
    }
    if (a === 'dl') {
      const l = document.createElement('a');
      l.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      l.download = (clean(document.title).replace(/\W+/g, '-').toLowerCase() || 'page') + '-comments.json';
      l.click();
      URL.revokeObjectURL(l.href);
      delivered();
    }
    if (a === 'cl') {
      if (!armed) { armed = setTimeout(() => { armed = 0; syncBar(); }, 4000); return syncBar(); }
      clearTimeout(armed);
      armed = 0;
      closeBox(false);
      if (live.on) items.forEach((c) => api('delete', { id: c.id }).catch(() => {}));
      items = [];
      dirty = false;
      save();
      render();
    }
  };

  // ---- live: conversation, status, sync ----
  const h = (tag, cls, text, par) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; if (par) par.appendChild(e); return e; };
  const STL = { queued: 'Queued, waiting for the helper', ready: 'Ready for agent', picked: 'Picked up', asks: 'Agent asks you', done: 'Done, check it', resolved: 'Resolved' };
  const hm = (iso) => new Date(iso).toTimeString().slice(0, 5);
  function stOf(c) { return c.resolved ? 'resolved' : !(c.msgs || []).length ? '' : c.msgs.some((m) => !m.sent) ? 'queued' : c.st || 'ready'; }
  const wire = (c) => ({ id: c.id, target: c.target, selector: c.selector, section: c.section, context: c.context, quote: c.quote, start: c.start, end: c.end, fx: c.fx, fy: c.fy });
  async function api(path, body) {
    const r = await fetch('/_tb/' + path + '?tb=' + token + '&page=' + encodeURIComponent(pagePath), body ? { method: 'POST', body: JSON.stringify({ ...body, page: pagePath }) } : {});
    live.auth = r.status !== 401;
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }
  // The pin carries the state: your initial-free person while your message waits, the agent's spark when it spoke last, a tick when resolved.
  function paintPin() {
    const b = box.el.querySelector('.bub'), c = box.c, ms = c.msgs || [], err = cc && ms.some((m) => m.err), s = err ? 'err' : chat() && ms.length ? stOf(c) : '';
    b.innerHTML = !chat() || !ms.length ? PIN.add : c.resolved ? PIN.tick : ms[ms.length - 1].who === 'user' ? PIN.person : PIN.spark;
    b.style.setProperty('--pc', INK[s] || INK['']);
    box.el.dataset.st = s;
    box.el.style.setProperty('--sc', DOT[s] || '#8b8b8b');
  }
  function paintConv() {
    if (!box) return;
    const c = box.c, conv = box.el.querySelector('.conv'), ms = c.msgs || [], cmp = box.el.querySelector('.cmp'), bub = box.el.querySelector('.bub');
    conv.hidden = !chat() || !ms.length;
    box.el.classList.toggle('res', !conv.hidden && !!c.resolved);
    paintPin();
    if (conv.hidden) { if (pinInside() && bub.parentNode !== cmp) cmp.prepend(bub); return; }
    const sig = JSON.stringify([stOf(c), c.resolved, ms.map((m) => [m.text, m.sent, m.picked, m.done, m.err])]);
    if (box.sig === sig) return;
    box.sig = sig;
    if (pinInside()) cmp.prepend(bub); // keep the pin out of the thread while it is rebuilt
    conv.textContent = '';
    const hd = h('div', 'hd', undefined, conv);
    if (pinInside() && c.resolved) hd.prepend(bub);
    h('span', 'stl', cc ? (c.resolved ? 'Resolved' : ms.some((m) => m.err) ? 'Not sent' : ms.some((m) => !m.sent) ? 'Sending…' : 'Sent to Claude') : STL[stOf(c)] + (stOf(c) === 'picked' ? ' ' + hm(ms.filter((m) => m.picked).pop().picked) : ''), hd);
    if (c.resolved) h('span', 'first', '· ' + cut(c.text || ms[0].text, 60), hd);
    else { const [icon, name] = chipOf(c), chip = h('span', 'chip', undefined, hd); chip.innerHTML = icon; h('span', '', name, chip); }
    const rs = h('button', 'rs', undefined, hd);
    rs.innerHTML = c.resolved ? PIN.back : PIN.tick;
    rs.title = c.resolved ? 'Reopen' : 'Resolve'; rs.setAttribute('aria-label', rs.title);
    rs.onclick = () => {
      c.resolved = !c.resolved;
      if (cc) { if (c.srvId) cc.resolve(c.srvId, c.resolved).catch(() => {}); box.sig = ''; save(); syncBar(); paintConv(); return; }
      c.rsDirty = 1; save(); syncBar(); sync(); box.sig = ''; paintConv();
    };
    const list = h('div', 'ml', undefined, conv);
    for (const m of ms) {
      const d = h('div', 'm ' + (m.who === 'user' ? 'u' : 'a'), undefined, list), mk = h('i', 'mk', undefined, d);
      mk.innerHTML = '<span class="vh">' + (m.who === 'user' ? 'You: ' : 'Agent: ') + '</span>' + (m.who === 'user' ? PIN.person : PIN.spark);
      const tx = h('div', 'tx', m.text, d);
      if (cc && m.err) { h('small', '', 'Not sent (' + m.err + ')', tx); h('button', '', 'Retry', tx).onclick = () => { m.err = ''; box.sig = ''; deliverAll(); }; }
    }
    if (cc) h('small', 'sm', 'Claude’s replies appear in claude.ai’s comment panel.', list);
    const f = () => list.classList.toggle('scr', list.scrollTop > 2);
    list.onscroll = f;
    list.scrollTop = list.scrollHeight;
    f();
    if (pinInside() && c.resolved) return;
    box.el.querySelector('textarea').placeholder = 'Reply';
  }
  function sendMsg() {
    if (!box) return;
    const { c, el } = box, ta = el.querySelector('textarea'), text = ta.value.trim();
    if (!text) return;
    if (box.isNew) { items.push(c); box.isNew = false; el.classList.add('review'); }
    if (!(c.msgs || []).length) c.text = text;
    (c.msgs = c.msgs || []).push({ who: 'user', text, at: new Date().toISOString(), mid: uid(), sent: 0 });
    c.resolved = false;
    c.rsDirty = 0;
    ta.value = '';
    box.fit();
    save();
    render();
    paintConv();
    if (cc) deliverAll(); else sync();
  }
  function merge(s) {
    live.ver = s.version; live.listening = s.listening; live.hello = s.hello;
    if (!live.time) live.time = s.pageTime; else if (s.pageTime > live.time + 1) live.stale = true;
    for (const t of s.threads) {
      let c = items.find((x) => x.id === t.id);
      if (!c) {
        if (!t.msgs.length) continue;
        c = { n: 0, id: t.id, text: t.msgs[0].text, at: t.msgs[0].at, section: t.section, target: t.target, selector: t.selector, context: t.context, quote: t.quote, start: t.start, end: t.end, fx: t.fx, fy: t.fy };
        items.push(c);
      }
      const local = (c.msgs || []).filter((m) => !m.sent && !t.msgs.some((x) => x.mid === m.mid));
      c.msgs = t.msgs.map((m) => ({ ...m, sent: 1 })).concat(local);
      c.st = t.st;
      if (!c.rsDirty) c.resolved = t.resolved;
    }
  }
  let syncing = false;
  async function sync() {
    if (!live.on || syncing) return;
    syncing = true;
    try {
      for (const c of items.slice()) {
        for (const m of c.msgs || []) if (!m.sent) { await api('send', { thread: wire(c), text: m.text, mid: m.mid, at: m.at }); m.sent = 1; }
        if (c.rsDirty) { await api('resolve', { id: c.id, resolved: !!c.resolved }); c.rsDirty = 0; }
      }
      const n = items.length;
      merge(await api('state'));
      live.ok = true;
      save();
      if (items.length !== n) render();
    } catch (e) { live.ok = false; }
    syncing = false;
    syncBar();
  }
  // Pins re-attach by data-comment name, then by their text; failing both, a conversation moves to the Detached list.
  function reattach(c) {
    const el0 = findEl(c);
    if (el0 && (!isText(c) || rangeOf(c, el0))) return true;
    const text = isText(c) ? c.quote : c.target && c.target.text;
    const el = (c.target && c.target.name && [...document.querySelectorAll('[data-comment]')].find((e) => e.dataset.comment === c.target.name))
      || (text && [...document.querySelectorAll(BLOCKS + ',' + OBJECTS)].find((e) => e.textContent.includes(text)));
    if (!el) return false;
    c.selector = selectorOf(el);
    if (isText(c)) { c.start = el.textContent.indexOf(c.quote); c.end = c.start + c.quote.length; }
    return true;
  }
  const RS = 'talkback:restore', GUIDE = 'talkback:live-guide';
  let panelOpen = false, guide = false, guideSeen = false;
  try { guideSeen = !!localStorage.getItem(GUIDE); } catch (e) {}
  function reload() {
    try {
      const f = (fn) => { try { return typeof fn === 'function' ? fn() : null; } catch (e) { return null; } };
      sessionStorage.setItem(RS, JSON.stringify({ scroll: [scrollX, scrollY], context: f(window.commentContext), extras: f(window.commentExtras), open: box && { id: box.c.id, text: box.el.querySelector('textarea').value } }));
    } catch (e) {}
    location.reload();
  }
  function paintLive() {
    if (!live.on) return;
    if (!guideSeen && live.ok && !panelOpen) panelOpen = guide = true;
    const pn = $('.panel');
    pn.hidden = !panelOpen;
    paintConv();
    if (!panelOpen) return;
    const sig = JSON.stringify([guide, live, items.filter((c) => c.detached).map((c) => c.id)]);
    if (pn.sig === sig) return;
    pn.sig = sig;
    pn.textContent = '';
    if (guide) {
      h('h4', '', 'Talking with your agent', pn);
      h('p', '', 'Point at anything and write. Send goes to your agent, and the dots show where each message stands. Only you resolve a conversation.', pn);
      const row = h('div', 'row', undefined, pn);
      h('button', '', 'Got it', row).onclick = () => { guideSeen = true; try { localStorage.setItem(GUIDE, '1'); } catch (e) {} panelOpen = guide = false; paintLive(); };
      return;
    }
    h('h4', '', 'Talkback live', pn);
    const ul = h('ul', '', undefined, pn);
    const line = (cls, text, note) => { const li = h('li', cls, text, ul); if (note) h('small', '', note, li); };
    line('ok', 'Opened from the helper’s link');
    line(live.ok ? (live.ver === LIVE_V ? 'ok' : 'bad') : 'bad', live.ok ? 'Helper found, version ' + live.ver : 'Helper not answering',
      !live.ok ? 'It may have stopped (computer asleep, session ended). Messages wait here and go out when it is back. Ask your agent: “Go live with Talkback on this page”.' : live.ver !== LIVE_V ? 'Update Talkback in this page (page ' + LIVE_V + ', helper ' + live.ver + ').' : '');
    line(live.auth ? (live.ok ? 'ok' : '') : 'bad', live.auth ? 'Secret token accepted' : 'Token not accepted', live.auth ? '' : 'Open the link your agent gave you.');
    line(live.listening ? 'ok' : live.ok ? 'wait' : '', live.listening ? 'Agent listening' : 'Nobody is listening', live.listening || !live.ok ? '' : 'Messages wait. Copy prompt and paste it in your agent’s chat.');
    line(live.hello ? 'ok' : '', live.hello ? 'Agent answered at ' + hm(live.hello) : 'Waiting for the agent’s “I’m listening”');
    const lost = items.filter((c) => c.detached);
    if (lost.length) {
      h('p', '', 'Detached: the thing they point at is gone', pn);
      for (const c of lost) { const b = h('button', '', '#' + c.n + ' ' + cut(c.text, 30), pn); b.onclick = () => { panelOpen = false; if (!on) setMode(true); closeBox(true); openBox(c, false); }; }
    }
    const row = h('div', 'row', undefined, pn);
    h('button', '', 'Copy prompt', row).onclick = (e) => { const t = 'Listen for my Talkback messages on ' + (document.title || pagePath) + ': run the Talkback helper’s wait, answer every message with reply, and keep listening.'; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => {}); e.target.textContent = 'Copied ✓'; };
    h('button', '', 'Show guide', row).onclick = () => { guide = true; paintLive(); };
  }
  function restoreState() {
    try {
      const r = JSON.parse(sessionStorage.getItem(RS));
      if (!r) return;
      sessionStorage.removeItem(RS);
      setTimeout(() => {
        scrollTo(...r.scroll);
        if (typeof window.commentRestore === 'function') window.commentRestore({ context: r.context, extras: r.extras });
        const c = r.open && items.find((x) => x.id === r.open.id);
        if (c) { setMode(true); openBox(c, false); const ta = box.el.querySelector('textarea'); ta.value = r.open.text; ta.dispatchEvent(new Event('input')); }
      }, 500);
    } catch (e) {}
  }

  // ---- on claude.ai: Talkback's own comment mode; messages go through claude.ai's comment capability ----
  // Send to Claude wakes the session that published the page. Replies show in claude.ai's comment panel: a page cannot read them.
  let cc = null;
  const chat = () => live.on || !!cc;
  const targetNote = (c) => '— Talkback target: ' + (isText(c) ? 'text "' + cut(c.quote, 160) + '"' : c.target.name || c.target.type + (c.target.text ? ': ' + cut(c.target.text, 80) : '')) + (c.section ? ' · section ' + c.section : '') + (c.context ? ' · ' + JSON.stringify(c.context).slice(0, 300) : '');
  let delivering = false;
  async function deliverAll() {
    if (!cc || delivering) return;
    delivering = true;
    for (const c of items) {
      for (const m of c.msgs || []) {
        if (m.sent || m.err) continue;
        try {
          const can = await cc.canSendToClaude().catch(() => 'off');
          const text = c.srvId ? m.text : m.text + '\n\n' + targetNote(c);
          let r;
          if (c.srvId) r = can === 'available' ? await cc.sendToClaude({ threadId: c.srvId, text }) : await cc.reply(c.srvId, text);
          else {
            const el = findEl(c), anchor = await cc.anchorFor(el);
            r = can === 'available' ? await cc.sendToClaude({ anchor, text }) : await cc.create({ anchor, text });
          }
          c.srvId = r.threadId;
          m.sent = 1;
        } catch (e) { m.err = (e && e.code) || 'failed'; }
        save();
        if (box) { box.sig = ''; paintConv(); }
        syncBar();
      }
    }
    delivering = false;
  }
  (async () => {
    if (live.on || !window.claude || !window.claude.use) return;
    try {
      const comments = await window.claude.use('comments');
      if (!comments || !comments.sendToClaude || !comments.anchorFor) return;
      cc = comments;
    } catch (e) { return; }
    syncBar();
    setInterval(() => { try { const f = (fn) => (typeof fn === 'function' ? fn() : null); sessionStorage.setItem(RS, JSON.stringify({ scroll: [scrollX, scrollY], context: f(window.commentContext), extras: f(window.commentExtras) })); } catch (e) {} }, 2000);
    restoreState();
  })();
  render();
  if (live.on) {
    sync();
    setInterval(sync, 1500);
    setTimeout(() => { items.forEach((c) => (c.detached = !reattach(c))); save(); syncBar(); }, 1500);
    restoreState();
  }
})();

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
  const BUBBLE = '<svg class="bub" viewBox="9 3 21 22"><path d="M25.32 4.58c2.04 0 3.68 1.65 3.68 3.69v7.63c0 2.03-1.65 3.68-3.68 3.68H14.66l-4.5 3.84V8.27c0-2.04 1.65-3.69 3.68-3.69h11.48Z" fill="currentColor"/></svg>';
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
    .stack{display:flex;flex-direction:column;gap:8px}
    .conv{width:280px;max-height:230px;overflow:auto;display:flex;flex-direction:column;gap:6px;padding:10px;box-sizing:border-box;background:#161616f2;color:#e8e6e1;border-radius:14px;font-size:13px}
    .conv .hd{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:11px;letter-spacing:.04em;text-transform:uppercase;opacity:.8}
    .conv .hd button{padding:3px 9px;border:1px solid #ffffff55;border-radius:99px;font-size:11px;text-transform:none;letter-spacing:0}
    .conv .m{display:flex;flex-direction:column;gap:2px;max-width:90%;padding:6px 10px;border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere}
    .conv .u{align-self:flex-end;background:#fff;color:#292929}.conv .a{align-self:flex-start;background:#2c2c2c}
    .conv small{font-size:10.5px;opacity:.6}
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
    .box{position:fixed;left:0;top:0;display:flex;align-items:flex-end;gap:6px;pointer-events:auto}
    .box.flip{flex-direction:row-reverse}.box.flip .bub{transform:scaleX(-1)}
    .bub{flex:none;width:21px;height:22px;color:var(--c)}
    .field{display:flex;align-items:flex-end;gap:8px;width:280px;padding:9px 7px 9px 14px;background:#fff;border:1px solid var(--c);
      border-radius:13px;box-shadow:0 1px 2px #0001,2px 3px 4px #0000001a,4px 7px 5px #0000000d}
    textarea{flex:1;min-width:0;max-height:160px;resize:none;border:0;outline:0;padding:0;background:none;font:500 15px/1.3 system-ui,sans-serif;
      color:#292929;letter-spacing:.01em}
    textarea::placeholder{color:#29292955}
    .cb{flex:none;width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#2929290f;color:#292929}
    .cb svg{width:52%;height:52%}
    .cb.go{background:var(--c);color:#fff}.cb:disabled{background:#2929290f;color:#929292;cursor:not-allowed}
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
    $('.tip p').textContent = 'Select text, or click anything on the page, to pin a comment there.' + (live.on ? '' : ' To talk with your agent here, tell it: “Go live with Talkback on this page”.');
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
    el.className = 'box' + (isNew ? '' : ' review');
    el.style.setProperty('--c', colorOf(c));
    el.innerHTML = BUBBLE + '<div class="stack"><div class="conv" hidden></div><div class="field"><textarea rows="1" placeholder="Add a comment"></textarea><button class="cb del" title="Delete">' + TRASH + '</button><button class="cb go" title="' + (live.on ? 'Send to agent (Enter)' : 'Save (Enter)') + '">' + SEND + '</button></div></div>';
    const ta = el.querySelector('textarea'), go = el.querySelector('.go'), del = el.querySelector('.del');
    const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; go.disabled = !ta.value.trim(); };
    const talking = live.on && (c.msgs || []).length; // a conversation: the field is for the next message
    ta.value = talking ? '' : c.text || '';
    if (talking) ta.placeholder = 'Reply';
    del.hidden = isNew;
    del.onclick = () => { items = items.filter((x) => x !== c); dirty = true; if (live.on) api('delete', { id: c.id }).catch(() => {}); closeBox(false); };
    go.onclick = () => (live.on ? sendMsg() : closeBox(true));
    ta.oninput = fit;
    ta.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); live.on ? sendMsg() : closeBox(true); }
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
    if (live.on && (c.msgs || []).length) {
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
        const x = isText(box.c) ? clamp(px + 8, 8, innerWidth - w - 8) : clamp(flip ? px - w : px, 8, innerWidth - w - 8);
        box.el.style.transform = `translate(${x}px,${clamp(isText(box.c) ? py + 10 : py - h, 8, innerHeight - h - 8)}px)`;
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
    if (ca) return compose(c, e);
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
    if (ca) return compose(c, e);
    openBox(c, true);
  }, true);

  document.addEventListener('keydown', (e) => {
    const t = e.composedPath()[0];
    if (e.key === 'Escape' && ca) return ca.exitMode();
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
  function paintConv() {
    if (!box) return;
    const c = box.c, conv = box.el.querySelector('.conv'), ms = c.msgs || [];
    conv.hidden = !live.on || !ms.length;
    if (conv.hidden) return;
    const sig = JSON.stringify([stOf(c), ms.map((m) => [m.text, m.sent, m.picked, m.done])]);
    if (box.sig === sig) return;
    box.sig = sig;
    conv.textContent = '';
    const hd = h('div', 'hd', undefined, conv);
    h('span', 'stl', STL[stOf(c)] + (stOf(c) === 'picked' ? ' ' + hm(ms.filter((m) => m.picked).pop().picked) : ''), hd);
    const rs = h('button', 'rs', c.resolved ? 'Reopen' : 'Resolve', hd);
    rs.title = 'Only you resolve a conversation';
    rs.onclick = () => { c.resolved = !c.resolved; c.rsDirty = 1; save(); syncBar(); sync(); };
    for (const m of ms) {
      const d = h('div', 'm ' + (m.who === 'user' ? 'u' : 'a'), undefined, conv);
      h('span', '', m.text, d);
      const note = m.who === 'user' ? (!m.sent ? 'Queued' : m.picked ? 'Picked up ' + hm(m.picked) : 'Not picked up yet') : m.done ? 'Done, check it' : '';
      if (note) h('small', '', note, d);
    }
    conv.scrollTop = conv.scrollHeight;
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
    sync();
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

  // ---- on claude.ai: Talkback points, claude.ai's own comment panel holds the conversation ----
  // Send to Claude there wakes the session that published the page. The target travels as the thread's label and detail.
  let ca = null, threadList = [];
  const CAK = 'talkback:anchors:' + location.pathname;
  let known = {};
  try { known = JSON.parse(localStorage.getItem(CAK)) || {}; } catch (e) {}
  function compose(c, ev) {
    const el = findEl(c);
    if (!el) return;
    try {
      const [anchor, at] = ca.domAnchor(el, ev);
      const label = isText(c) ? 'Text: ' + cut(c.quote, 80) : cut(label_(c.target), 100);
      const detail = JSON.stringify({ selector: c.selector, section: c.section, target: c.target, ...(isText(c) ? { quote: c.quote } : {}), ...(c.context ? { context: c.context } : {}) }).slice(0, 1000);
      known[anchor] = { selector: c.selector, ...(isText(c) ? { quote: c.quote, start: c.start, end: c.end } : { fx: c.fx, fy: c.fy }) };
      try { localStorage.setItem(CAK, JSON.stringify(known)); } catch (e) {}
      ca.compose(anchor, at, { label, detail }).catch(() => {});
    } catch (e) {}
  }
  const label_ = (t) => (t.name ? t.name : t.type) + (t.text && !t.name ? ': ' + t.text : '');
  const pinSpot = (k) => {
    const el = k && (() => { try { return document.querySelector(k.selector); } catch (e) { return null; } })();
    if (!el) return null;
    const g = k.quote !== undefined ? geoOf({ selector: k.selector, quote: k.quote, start: k.start, end: k.end }) : geoOf({ selector: k.selector, fx: k.fx, fy: k.fy });
    return g && { x: g.pin[0] + scrollX, y: g.pin[1] + scrollY };
  };
  function report() {
    if (!ca) return;
    const map = {};
    for (const t of threadList) { const p = pinSpot(known[t.anchor]); if (p) map[t.id] = p; }
    ca.placed(map);
  }
  (async () => {
    if (live.on || !window.claude || !window.claude.use) return;
    try {
      const comments = await window.claude.use('comments');
      if (!comments || !comments.customAnchors) return;
      ca = await comments.customAnchors({
        mode: (v) => setMode(!!v),
        threads: (list) => { threadList = list; report(); },
        reveal: (id) => {
          const t = threadList.find((x) => x.id === id), k = t && known[t.anchor], el = k && findEl(k);
          if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
        },
      });
    } catch (e) { ca = null; return; }
    bar.hidden = true; // claude.ai has its own comment button
    setInterval(report, 1000);
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

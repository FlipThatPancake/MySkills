/* Learning-visuals kit. Paste this whole file into one <script> at the end of <body>.
   It provides the 16:9 stage, slide and beat navigation, a breadcrumb, tooltips,
   checks with "I don't know", answer export, and small motion helpers.
   See SKILL.md and references/kit-api.md for the markup it expects. */
(function () {
  'use strict';
  var W = 1600, H = 900;
  var doc = document, root = doc.documentElement;
  var stage = doc.querySelector('.lv-stage');
  if (!stage) { console.error('lv: no .lv-stage element'); return; }
  var slides = Array.prototype.slice.call(stage.querySelectorAll('.lv-slide'));
  var topic = stage.getAttribute('data-topic') || doc.title || '';
  var cur = -1, beat = 0, hooks = {}, loops = [], scale = 1, extras = [];
  var answers = {};

  // ---------- helpers ----------
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  var ease = {
    linear: function (u) { return u; },
    out: function (u) { return 1 - Math.pow(1 - u, 3); },
    in: function (u) { return u * u * u; },
    inOut: function (u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; },
    // manim's "smooth": a sigmoid with a soft start and end
    smooth: function (u) {
      var s = function (x) { return 1 / (1 + Math.exp(-x)); };
      var k = 10, a = s(-k / 2), b = s(k / 2);
      return clamp((s(k * (u - 0.5)) - a) / (b - a), 0, 1);
    }
  };
  function el(tag, attrs, parent) {
    var svg = /^(svg|g|path|line|circle|rect|ellipse|polygon|polyline|text|tspan|defs|marker|use|clipPath|linearGradient|stop)$/.test(tag);
    var n = svg ? doc.createElementNS('http://www.w3.org/2000/svg', tag) : doc.createElement(tag);
    for (var k in (attrs || {})) {
      if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }
  // tween(ms, fn(u), easeFn) -> Promise. fn receives eased progress 0..1.
  function tween(ms, fn, ez) {
    ez = ez || ease.inOut;
    return new Promise(function (res) {
      var t0 = performance.now();
      function step(now) {
        var u = clamp((now - t0) / ms, 0, 1);
        fn(ez(u));
        if (u < 1) requestAnimationFrame(step); else res();
      }
      requestAnimationFrame(step);
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  // count a number element up or down; fmt(v) returns the text
  function count(node, from, to, ms, fmt) {
    fmt = fmt || function (v) { return Math.round(v).toLocaleString('en-US'); };
    return tween(ms || 700, function (u) { node.textContent = fmt(lerp(from, to, u)); }, ease.out);
  }
  // draw an SVG stroke on from start to end
  function draw(path, ms) {
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1';
    path.style.strokeDashoffset = '1';
    return tween(ms || 800, function (u) { path.style.strokeDashoffset = String(1 - u); }, ease.inOut);
  }
  // Morph one formula into another. Children with the same data-k glide to their new place;
  // others fade. Both elements share a parent; the "to" element starts hidden.
  function morph(fromEl, toEl, ms) {
    ms = ms || 900;
    var map = {};
    fromEl.querySelectorAll('[data-k]').forEach(function (n) { map[n.getAttribute('data-k')] = n.getBoundingClientRect(); });
    toEl.style.visibility = 'visible'; toEl.style.opacity = '1';
    var moves = [];
    toEl.querySelectorAll('[data-k]').forEach(function (n) {
      var r0 = map[n.getAttribute('data-k')], r1 = n.getBoundingClientRect();
      if (r0) moves.push({ n: n, dx: (r0.left - r1.left) / scale, dy: (r0.top - r1.top) / scale });
      else { n.style.opacity = '0'; moves.push({ n: n, fade: true }); }
    });
    fromEl.style.opacity = '0';
    return tween(ms, function (u) {
      moves.forEach(function (m) {
        if (m.fade) m.n.style.opacity = String(clamp((u - 0.4) / 0.6, 0, 1));
        else m.n.style.transform = 'translate(' + (m.dx * (1 - u)) + 'px,' + (m.dy * (1 - u)) + 'px)';
      });
    }, ease.smooth).then(function () { fromEl.style.visibility = 'hidden'; });
  }
  // project a 3D point for a simple Canvas 2D orbit view. cam = {yaw, pitch, dist, f, cx, cy}
  function project(p, cam) {
    var cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    var x = p[0] * cy - p[1] * sy, y = p[0] * sy + p[1] * cy, z = p[2];
    var y2 = y * cp - z * sp, z2 = y * sp + z * cp;
    var d = cam.dist + y2, k = cam.f / d;
    return [cam.cx + x * k, cam.cy - z2 * k, d];
  }
  // drag to rotate, wheel to zoom, double-click to reset. Calls onChange(cam).
  function orbit(node, cam, onChange) {
    var start = { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist }, drag = null;
    node.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch }; node.setPointerCapture(e.pointerId); e.stopPropagation(); });
    node.addEventListener('pointermove', function (e) {
      if (!drag) return;
      cam.yaw = drag.yaw + (e.clientX - drag.x) * 0.008;
      cam.pitch = clamp(drag.pitch + (e.clientY - drag.y) * 0.006, -1.45, 1.45);
      onChange(cam);
    });
    node.addEventListener('pointerup', function () { drag = null; });
    node.addEventListener('wheel', function (e) { e.preventDefault(); cam.dist = clamp(cam.dist * (1 + e.deltaY * 0.001), start.dist * 0.4, start.dist * 3); onChange(cam); }, { passive: false });
    node.addEventListener('dblclick', function (e) { e.stopPropagation(); cam.yaw = start.yaw; cam.pitch = start.pitch; cam.dist = start.dist; onChange(cam); });
    node.classList.add('lv-interactive');
  }

  // ---------- stage scaling ----------
  function fit() {
    scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = 'translate(-50%,-50%) scale(' + scale + ')';
    doc.documentElement.style.setProperty('--lv-s', scale);
  }
  window.addEventListener('resize', fit);
  fit();

  // ---------- chrome: breadcrumb, edge arrows, export ----------
  var crumb = el('div', { class: 'lv-crumb' }, stage);
  var crumbTopic = el('span', { class: 'lv-crumb-topic', text: topic }, crumb);
  var dots = el('span', { class: 'lv-dots' }, crumb);
  slides.forEach(function (s, i) {
    var d = el('button', { class: 'lv-dot', 'aria-label': 'Slide ' + (i + 1) }, dots);
    d.addEventListener('click', function (e) { e.stopPropagation(); go(i); });
  });
  var crumbN = el('span', { class: 'lv-crumb-n' }, crumb);
  // The side notches belong to the window edge, not the stage: when the window is wider than 16:9,
  // the stage leaves black bars at the sides, and a notch on the stage would float inside the window.
  var edgeL = el('div', { class: 'lv-notch lv-notch-l', 'aria-hidden': 'true' }, doc.body);
  var edgeR = el('div', { class: 'lv-notch lv-notch-r', 'aria-hidden': 'true' }, doc.body);
  // The water-drop notch: an edge line at x = 0 and a circle that moves out from behind it. Drawn for the
  // left edge; the right notch is mirrored and the bottom one rotated. The arrow points toward the edge or away.
  var goo = el('div', { 'aria-hidden': 'true' }, doc.body);
  goo.innerHTML = '<svg width="0" height="0" style="position:absolute"><filter id="lv-goo" filterUnits="userSpaceOnUse" x="-60" y="-40" width="280" height="280" color-interpolation-filters="sRGB">' +
    '<feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/><feColorMatrix in="b" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 30 -14" result="g"/>' +
    '<feMorphology in="g" operator="erode" radius="3" result="i"/><feComposite in="g" in2="i" operator="out"/></filter></svg>';
  function drop(away) {
    return '<svg class="lv-drop" viewBox="0 0 140 200"><g filter="url(#lv-goo)">' +
      '<rect class="lv-drop-shape" x="-20" y="55" width="25" height="90" rx="10"/>' +
      '<circle class="lv-drop-shape lv-drop-ball" cx="76" cy="100" r="46"/></g>' +
      '<path class="lv-drop-arrow" d="' + (away ? 'M70 84L86 100L70 116' : 'M84 84L68 100L84 116') + '"/></svg>';
  }
  edgeL.innerHTML = drop(false);
  edgeR.innerHTML = drop(false);
  // "more" panes: a .lv-more element inside a slide slides up from below on demand
  slides.forEach(function (s) {
    var m = s.querySelector('.lv-more');
    if (!m) return;
    var tab = el('button', { class: 'lv-more-tab', 'aria-label': 'More about this slide' }, s);
    tab.innerHTML = drop(true);
    tab.addEventListener('click', function (e) { e.stopPropagation(); toggleMore(s); });
  });
  function toggleMore(s, force) {
    s = s || slides[cur];
    if (!s || !s.querySelector('.lv-more')) return;
    var open = force === undefined ? !s.classList.contains('lv-more-open') : force;
    s.classList.toggle('lv-more-open', open);
  }
  var exportBtn = el('button', { class: 'lv-export', text: 'Export answers' }, doc.body);

  // ---------- slides and beats ----------
  function beatsOf(s) {
    var n = 0;
    s.querySelectorAll('[data-beat]').forEach(function (b) { n = Math.max(n, +b.getAttribute('data-beat')); });
    return n;
  }
  function showBeats(s, upTo, animate) {
    s.querySelectorAll('[data-beat]').forEach(function (b) {
      var k = +b.getAttribute('data-beat');
      var on = k <= upTo;
      if (on && animate && k === upTo) {
        b.classList.remove('lv-off'); b.classList.add('lv-enter');
        requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.remove('lv-enter'); }); });
      } else b.classList.toggle('lv-off', !on);
    });
  }
  function call(s, name, arg) {
    var h = hooks[s.id]; if (h && h[name]) h[name](s, arg);
  }
  function go(i, atEnd) {
    i = clamp(i, 0, slides.length - 1);
    if (i === cur) return;
    if (cur >= 0) { slides[cur].classList.remove('lv-active'); toggleMore(slides[cur], false); call(slides[cur], 'leave'); }
    cur = i;
    var s = slides[cur];
    beat = atEnd ? beatsOf(s) : 0;
    showBeats(s, beat, false);
    s.classList.add('lv-active');
    stage.querySelectorAll('.lv-dot').forEach(function (d, k) {
      d.classList.toggle('lv-dot-on', k === cur);
      if (k === cur) d.classList.add('lv-dot-seen');
    });
    crumbN.textContent = (cur + 1) + ' / ' + slides.length;
    doc.body.classList.toggle('lv-first', cur === 0);
    doc.body.classList.toggle('lv-last', cur === slides.length - 1);
    hideTip(true);
    call(s, 'enter');
    if (beat) for (var b = 1; b <= beat; b++) call(s, 'beat', b);
    try { history.replaceState(null, '', '#' + (cur + 1)); } catch (e) {}
  }
  function next() {
    var s = slides[cur];
    if (beat < beatsOf(s)) { beat++; showBeats(s, beat, true); call(s, 'beat', beat); }
    else go(cur + 1);
  }
  function prev() {
    var s = slides[cur];
    if (beat > 0) { beat--; showBeats(s, beat, false); call(s, 'unbeat', beat); }
    else go(cur - 1, true);
  }
  var interactive = 'button,input,select,textarea,a,label,[data-tip],.lv-check,.lv-interactive,.lv-tip,.lv-more';
  // Edge zones are measured on the window, so the black bars beside a letterboxed stage count as edges.
  // Only the lesson page counts: the stage, or the bare page around it, not overlays added by other tools.
  function onPage(t) { return t === doc.body || t === doc.documentElement || stage.contains(t); }
  function zone(e) {
    var r = stage.getBoundingClientRect(), edge = 0.15 * r.width;
    var free = onPage(e.target) && !(e.target.closest && e.target.closest(interactive));
    return {
      free: free,
      l: free && e.clientX < r.left + edge,
      r: free && e.clientX > r.right - edge,
      b: e.clientY > r.top + 0.86 * r.height
    };
  }
  var interactive = 'button,input,select,textarea,a,label,[data-tip],.lv-check,.lv-interactive,.lv-tip,.lv-more';
  // pointer near an edge: swell that edge's notch into a circle with an arrow
  doc.addEventListener('pointermove', function (e) {
    var z = zone(e), body = doc.body.classList;
    body.toggle('lv-near-l', z.l);
    body.toggle('lv-near-r', z.r);
    body.toggle('lv-near-b', z.b && onPage(e.target));
    // hovering anywhere in the middle of an edge zone counts as hovering its notch
    var band = Math.abs(e.clientY - window.innerHeight / 2) <= window.innerHeight * 0.3;
    edgeL.classList.toggle('lv-over', z.l && band);
    edgeR.classList.toggle('lv-over', z.r && band);
  });
  doc.documentElement.addEventListener('pointerleave', function () {
    doc.body.classList.remove('lv-near-l', 'lv-near-r', 'lv-near-b');
    edgeL.classList.remove('lv-over'); edgeR.classList.remove('lv-over');
  });
  doc.addEventListener('click', function (e) {
    var z = zone(e);
    if (z.r) next(); else if (z.l) prev();
  });
  doc.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); toggleMore(null, true); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); toggleMore(null, false); }
    else if (e.key === 'Escape') { hideTip(true); toggleMore(null, false); }
  });

  // ---------- loops that run only while their slide is shown ----------
  function loop(slideId, fn) { loops.push({ id: slideId, fn: fn, t: 0 }); }
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var id = slides[cur] && slides[cur].id;
    loops.forEach(function (l) { if (l.id === id) { l.t += dt; l.fn(dt, l.t); } });
    if (tipNode && tip.classList.contains('lv-tip-on')) {
      var txt = tipNode.getAttribute('data-tip');
      if (txt !== tipText) { tipText = txt; tip.innerHTML = txt; }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- tooltips: hover shows, click pins ----------
  var tip = el('div', { class: 'lv-tip', role: 'tooltip' }, doc.body), pinned = null, tipNode = null, tipText = '';
  function placeTip(x, y) {
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = x + 18, top = y + 18;
    if (left + w > window.innerWidth - 12) left = x - w - 18;
    if (top + h > window.innerHeight - 12) top = y - h - 18;
    tip.style.left = Math.max(12, left) + 'px'; tip.style.top = Math.max(12, top) + 'px';
  }
  function showTip(node, x, y) {
    tipNode = node; tipText = node.getAttribute('data-tip');
    tip.innerHTML = tipText;
    tip.classList.add('lv-tip-on');
    placeTip(x, y);
  }
  function hideTip(force) {
    if (pinned && !force) return;
    if (force && pinned) { pinned.classList.remove('lv-pinned'); pinned = null; }
    tip.classList.remove('lv-tip-on', 'lv-tip-pinned');
  }
  doc.addEventListener('pointerover', function (e) {
    var n = e.target.closest && e.target.closest('[data-tip]');
    if (n && !pinned) showTip(n, e.clientX, e.clientY);
  });
  doc.addEventListener('pointermove', function (e) {
    if (!pinned && tip.classList.contains('lv-tip-on') && e.target.closest && e.target.closest('[data-tip]')) placeTip(e.clientX, e.clientY);
  });
  doc.addEventListener('pointerout', function (e) {
    var n = e.target.closest && e.target.closest('[data-tip]');
    if (n && !n.contains(e.relatedTarget)) hideTip(false);
  });
  doc.addEventListener('click', function (e) {
    var n = e.target.closest && e.target.closest('[data-tip]');
    if (n) {
      if (pinned === n) { hideTip(true); return; }
      hideTip(true); pinned = n; n.classList.add('lv-pinned');
      showTip(n, e.clientX, e.clientY); tip.classList.add('lv-tip-pinned');
    } else if (pinned && !(e.target.closest && e.target.closest('.lv-tip'))) hideTip(true);
  });

  // ---------- checks ----------
  // <div class="lv-check" id="q1" data-answer="b"> <p class="lv-q">…</p>
  //   <button data-choice="a">…</button> … <p class="lv-why">…</p> <p class="lv-hint">…</p> </div>
  // Optional data-followup="q1b": the id of a similar check shown after a wrong pick.
  function setupCheck(c) {
    if (!c.querySelector('[data-choice="idk"]')) {
      var b = el('button', { 'data-choice': 'idk', class: 'lv-idk', text: "I don't know" });
      var why = c.querySelector('.lv-why');
      var last = c.querySelectorAll('[data-choice]');
      var after = last[last.length - 1];
      if (after) after.insertAdjacentElement('afterend', b); else c.insertBefore(b, why);
    }
    c.querySelectorAll('[data-choice]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (c.classList.contains('lv-done')) return;
        var pick = btn.getAttribute('data-choice'), right = c.getAttribute('data-answer');
        var ok = pick === right;
        c.classList.add('lv-done', ok ? 'lv-right' : 'lv-wrong');
        btn.classList.add('lv-picked');
        var rb = c.querySelector('[data-choice="' + right + '"]'); if (rb) rb.classList.add('lv-correct');
        var q = c.querySelector('.lv-q');
        answers[c.id || ('check' + Object.keys(answers).length)] = {
          slide: cur + 1, question: q ? q.textContent.trim() : '',
          answer: pick === 'idk' ? "I don't know" : btn.textContent.trim(),
          correct: ok, at: new Date().toISOString()
        };
        c.dispatchEvent(new CustomEvent('lv:answer', { bubbles: true, detail: { choice: pick, correct: ok } }));
        if (!ok) {
          var f = c.getAttribute('data-followup');
          var fu = f && doc.getElementById(f);
          // shrink the answered check to its question and reason, so that the follow-up fits on the stage
          if (fu) { fu.classList.remove('lv-hidden'); c.classList.add('lv-compact'); }
        }
      });
    });
  }
  doc.querySelectorAll('.lv-check').forEach(setupCheck);

  // ---------- export ----------
  function exportData() {
    var out = { lesson: topic, exportedAt: new Date().toISOString(), slide: cur + 1, answers: answers };
    extras.forEach(function (fn) { try { var x = fn(); for (var k in x) out[k] = x[k]; } catch (e) { console.error(e); } });
    return out;
  }
  function exportJSON() { return JSON.stringify(exportData(), null, 2); }
  // Page tools such as a comment layer can read the slide and the answers through these hooks.
  // When such a tool sets window.__commentMode, it exports for the page, so the kit's own button hides.
  if (!window.commentContext) window.commentContext = function () { return { slide: cur + 1, beat: beat }; };
  if (!window.commentExtras) window.commentExtras = exportData;
  window.addEventListener('load', function () { if (window.__commentMode) exportBtn.classList.add('lv-hidden'); });
  var box = el('div', { class: 'lv-modal lv-hidden' }, doc.body);
  var ta = el('textarea', { readonly: 'readonly', 'aria-label': 'Exported JSON' }, box);
  var close = el('button', { text: 'Close' }, box);
  close.addEventListener('click', function () { box.classList.add('lv-hidden'); });
  exportBtn.addEventListener('click', function () {
    var txt = exportJSON();
    ta.value = txt; box.classList.remove('lv-hidden'); ta.select();
    try { navigator.clipboard.writeText(txt).then(function () { close.textContent = 'Copied. Close'; }, function () {}); } catch (e) {}
  });

  // ---------- public API ----------
  window.LV = {
    W: W, H: H, ease: ease, clamp: clamp, lerp: lerp, el: el, tween: tween, wait: wait,
    count: count, draw: draw, morph: morph, project: project, orbit: orbit, loop: loop,
    go: go, next: next, prev: prev, more: toggleMore,
    on: function (slideId, h) { hooks[slideId] = h; if (slides[cur] && slides[cur].id === slideId && h.enter) h.enter(slides[cur]); },
    addExport: function (fn) { extras.push(fn); },
    answers: answers, exportJSON: exportJSON,
    get scale() { return scale; }, get slide() { return cur; }
  };

  var start = parseInt((location.hash || '').slice(1), 10);
  go(isNaN(start) ? 0 : start - 1);
})();

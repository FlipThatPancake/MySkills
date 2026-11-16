// @js:settings-panel — a click pins the panel open until a click lands
// outside both the button and the panel. `.is-open` on the button tracks the
// panel's visibility, so the button reads "enabled" while over the panel.
(function () {
  const btn = document.querySelector('.tool-button[data-tool="settings"]');
  const panel = document.getElementById('settings-panel');
  const body = document.getElementById('settings-panel-body');
  const shapeSvg = panel ? panel.querySelector('.settings-panel-shape') : null;
  const shapePath = shapeSvg ? shapeSvg.querySelector('path') : null;
  if (!btn || !panel || !body || !shapeSvg || !shapePath) return;
  let pinned = false;
  // Never getBoundingClientRect(): it reads the panel mid-flight through its
  // open `translate` transition. offsetTop is a layout metric, untouched by
  // `transform`/`translate`, so it is stable while the slide animates.
  const syncPanelHeight = () => {
    const parent = panel.offsetParent;
    const parentTop = parent ? parent.getBoundingClientRect().top : 0;
    const avail = window.innerHeight - (parentTop + panel.offsetTop) - 20;
    panel.style.setProperty('--panel-avail-h', Math.max(0, avail) + 'px');
  };
  // Redraw tab + body as ONE closed contour from two live parameters; every
  // literal is panel-shape.svg's own coordinate (see the settings-panel CSS).
  //   x() — the group left of the fixed x=248/280 anchor moves by one `shift`,
  //     so the flare's beziers translate, never distort.
  //   y() — h, h-32 and h-14.327 are the only bottom-anchored values; the rest
  //     is top-anchored, so height is a redraw, not a stretch.
  // x=280.001 is normalised to 280 and the V110.285→110.359 micro-kink dropped:
  // erode+blur turns a 0.001 step into a hairline on the right edge.
  const H_MIN = 88.3223;        // the tab alone — .settings-panel's own min-height
  const NECK_MIN_X = 40;        // keeps the shoulder line from inverting under an extreme width
  const WALL_X0 = 130.081;      // the neck wall at shift 0 — the tab's own widest left edge
  // `r()` — the right-anchored group (top/bottom-right corners), moved by the
  // panel's width over the asset's 280; the left corners stay at x=0..32.
  const ASSET_W = 280;
  const buildPanelPath = (shift, h, w) => {
    const x = (v) => (v + shift).toFixed(3);
    const y = (v) => v.toFixed(3);
    const r = (v) => (v + w - ASSET_W).toFixed(3);
    return `M${r(248)} 0C${r(265.673)} 0 ${r(280)} 14.3269 ${r(280)} 32` +
      `L${r(280)} ${y(h - 32)}C${r(280)} ${y(h - 14.327)} ${r(265.673)} ${y(h)} ${r(248)} ${y(h)}` +
      `L32 ${y(h)}C14.3271 ${y(h)} 0 ${y(h - 14.327)} 0 ${y(h - 32)}` +
      `L0 88.3223C0 70.6493 14.3271 56.3225 32 56.3223` +
      `L${x(130.081)} 56.3223L${x(130.081)} 56.3184L${x(114.608)} 56.3184` +
      `C${x(116.736)} 56.3151 ${x(119.72)} 56.1642 ${x(125.017)} 50.8574` +
      `C${x(128.216)} 47.6516 ${x(129.535)} 43.7291 ${x(130.081)} 41.4795` +
      `L${x(130.081)} 32C${x(130.081)} 14.3269 ${x(144.408)} 0 ${x(162.081)} 0Z`;
  };
  // The panel's rendered width stands in for `var(--u)` in px (a custom
  // property does not resolve through getComputedStyle). The SVG is
  // position:absolute, so writing it never feeds back into this height.
  const syncShape = () => {
    const btnRect = btn.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    if (!btnRect.width || !panelRect.width) return;
    const w = parseFloat(getComputedStyle(panel).getPropertyValue('--panel-w')) || ASSET_W;
    const uPx = panelRect.width / w;
    const h = Math.max(H_MIN, panelRect.height / uPx);
    // Both button edges, in panel units. The tab's right side stays pinned (it IS
    // the top-right corner), so the right margin is the gap the button leaves to
    // x=280; mirroring it on the left centres the tab on its button. Sizing from
    // width alone put all slack left, over hide-hud.
    const btnL = (btnRect.left - panelRect.left) / uPx;
    const btnR = (btnRect.right - panelRect.left) / uPx;
    const pad = w - btnR;
    // The 32u corner radius exceeds the 12u button gap, so the corner cuts the
    // button box's top-left corner — inherent; clearing it would need ~19u more
    // width, landing on hide-hud. The gear icon stays clear.
    let shift = btnL - pad - WALL_X0;
    shift = Math.min(shift, WALL_X0 - NECK_MIN_X + w - ASSET_W);  // never invert the shoulder
    shift = Math.max(shift, -WALL_X0);              // never push the wall off the panel
    shapeSvg.setAttribute('viewBox', `0 0 ${w} ${h.toFixed(3)}`);
    shapePath.setAttribute('d', buildPanelPath(shift, h, w));
  };
  const show = () => { panel.classList.add('is-visible'); panel.setAttribute('aria-hidden', 'false'); btn.classList.add('is-open'); syncPanelHeight(); syncShape(); };
  const hide = () => { panel.classList.remove('is-visible'); panel.setAttribute('aria-hidden', 'true'); btn.classList.remove('is-open'); };
  const syncScroll = () => body.classList.toggle('has-scroll', body.scrollHeight > body.clientHeight + 1);
  btn.addEventListener('click', () => {
    pinned = !pinned;
    btn.classList.toggle('is-pinned', pinned);
    btn.setAttribute('aria-expanded', String(pinned));
    pinned ? show() : hide();
  });
  // Comment mode closes the settings panel on entry; exposed so the comment-mode
  // IIFE reaches in without touching `pinned`.
  window.__ovenSettingsIsOpen = () => pinned;
  window.__ovenSettingsForceClose = () => {
    if (!pinned) return;
    pinned = false;
    btn.classList.remove('is-pinned');
    btn.setAttribute('aria-expanded', 'false');
    hide();
  };
  document.addEventListener('pointerdown', (e) => {
    if (!pinned || btn.contains(e.target) || panel.contains(e.target)) return;
    pinned = false;
    btn.classList.remove('is-pinned');
    btn.setAttribute('aria-expanded', 'false');
    hide();
  });
  window.addEventListener('resize', () => {
    syncShape();
    if (panel.classList.contains('is-visible')) syncPanelHeight();
  }, { passive: true });
  // One observer per input: the button's width changes with its label
  // (language) or is-open/hover tweens; the panel's height with its rows or the
  // viewport-bottom clamp. Either redraws the shape, open or not.
  new ResizeObserver(syncShape).observe(btn);
  new ResizeObserver(syncShape).observe(panel);
  new ResizeObserver(syncScroll).observe(body);
  syncShape();
  syncScroll();
})();

// @js:hide-hud — a click pins/unpins the hidden state. No hover preview.
(function () {
  const btn = document.querySelector('.tool-button[data-tool="hide-hud"]');
  const screen = document.getElementById('oven-gen3-screen');
  if (!btn || !screen) return;
  let pinned = false;
  const sync = () => {
    screen.classList.toggle('hud-hidden', pinned);
    screen.classList.toggle('oven-shifted', pinned);
  };
  btn.addEventListener('click', () => {
    pinned = !pinned;
    btn.classList.toggle('is-open', pinned);
    btn.setAttribute('aria-pressed', String(pinned));
    sync();
    // Hide HUD covers the PAGE hud only — title, readout, version, logo, hint,
    // Download and the unsaved line; comment-mode furniture stays. `.oven-shifted`
    // moves the oven, so pins and the dim's cutout re-measure once it lands.
    if (window.__ovenCommentResync) {
      window.__ovenCommentResync();
      setTimeout(window.__ovenCommentResync, 260);
    }
  });
})();

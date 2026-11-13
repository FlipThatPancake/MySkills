// @js:pill-text-width — status-pill/info-button hover text. Both labels are
// always laid out (shrink-wrapped in the rolling track), so each width is
// measured in px into `--w-rest`/`--w-hover`, which the CSS `width`
// transition animates between (`width: auto` is not transitionable).
// Re-measures after the webfont settles (a fallback-font width is wrong) and
// on every language switch (the i18n block re-runs it).
(function () {
  const PAIRS = [
    ['.status-pill', '.status-text-wrap', '.status-text--default', '.status-text--hover'],
    ['.info-button', '.info-text-wrap', '.info-text--default', '.info-text--hover'],
  ];
  function measure() {
    PAIRS.forEach(([hostSel, wrapSel, restSel, hoverSel]) => {
      const host = document.querySelector(hostSel);
      const wrap = host && host.querySelector(wrapSel);
      const rest = host && host.querySelector(restSel);
      const hover = host && host.querySelector(hoverSel);
      if (!wrap || !rest || !hover) return;
      wrap.style.setProperty('--w-rest', rest.getBoundingClientRect().width + 'px');
      wrap.style.setProperty('--w-hover', hover.getBoundingClientRect().width + 'px');
    });
  }
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.__ovenPillMeasure = measure;
})();

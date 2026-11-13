// @js:settings-demo — one dummy setting of each kind, so the panel's look can be seen and reused.
// Each control only paints its own state; nothing in the scene listens yet.
(function () {
  const panel = document.getElementById('settings-panel');
  // Switches flip on click.
  panel.querySelectorAll('.toggle-switch').forEach((b) => b.addEventListener('click', () => b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true'))));
  // Segmented choices: the clicked option is the checked one.
  panel.querySelectorAll('.seg-toggle').forEach((g) => g.querySelectorAll('.seg-toggle-option').forEach((o) => o.addEventListener('click', () => {
    g.querySelectorAll('.seg-toggle-option').forEach((x) => x.setAttribute('aria-checked', String(x === o)));
  })));
  // A cycle link steps through its comma-separated options.
  panel.querySelectorAll('[data-options]').forEach((b) => b.addEventListener('click', () => {
    const opts = b.dataset.options.split(','), i = opts.indexOf(b.textContent);
    b.textContent = opts[(i + 1) % opts.length];
  }));
  // Sliders show their value and fill up to the thumb.
  panel.querySelectorAll('.setting-slider').forEach((s) => {
    const out = document.getElementById(s.id + '-value');
    const paint = () => { out.textContent = s.value + '°'; s.style.setProperty('--fill', (s.value - s.min) / (s.max - s.min) * 100 + '%'); };
    s.addEventListener('input', paint); paint();
  });
  // Steppers move 10 % per click, from 50 % to 150 %.
  panel.querySelectorAll('.setting-stepper').forEach((st) => {
    const out = st.querySelector('.setting-stepper-value');
    st.querySelectorAll('.setting-stepper-btn').forEach((b) => b.addEventListener('click', () => {
      const v = Math.min(150, Math.max(50, parseInt(out.textContent, 10) + 10 * Number(b.dataset.dir)));
      out.textContent = v + '%';
    }));
  });
  // A row with data-depends-on="<switch id>" greys out while that switch is off (as in the prototype).
  const sync = () => panel.querySelectorAll('[data-depends-on]').forEach((row) => {
    const parent = document.getElementById(row.dataset.dependsOn), off = !!parent && parent.getAttribute('aria-checked') !== 'true';
    row.classList.toggle('setting-row--disabled', off);
    row.setAttribute('aria-disabled', String(off));
    row.querySelectorAll('button, input').forEach((c) => { c.disabled = off; });
  });
  panel.addEventListener('click', sync); sync();
})();

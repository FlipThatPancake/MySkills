# Kit markup and API

The kit is two files to copy into every lesson unchanged: `kit.css` goes in a `<style>` in `<head>`, and `kit.js` goes in a `<script>` at the end of `<body>`. Put the lesson's own script after the kit script.

## Page skeleton

```html
<main class="lv-stage" data-topic="Gradient descent">
  <section class="lv-slide" id="s-hill" aria-label="One sentence saying what the slide shows">
    <h1 class="lv-title">What the slide explains, in plain words</h1>
    <svg viewBox="0 0 1600 900" width="1600" height="900" style="position:absolute;inset:0">…</svg>
    <div class="lv-text"><p>Two to four connected sentences that explain the picture, with a <span data-tip="More detail">tricky word</span>.</p></div>
  </section>
  …
</main>
```

- Everything on a slide is placed in stage units (1600 × 900). An SVG covering the slide, as above, is the simplest base. Position HTML elements absolutely in the same units.
- The kit adds the breadcrumb (topic, slide dots, n / N), the edge-click zones with their sliding notches, the bottom notch for `lv-more` panes, and the "Export answers" button. Do not build your own.
- Give every slide an `id` and an `aria-label` that states its claim.

## Classes

| Class | Use |
|---|---|
| `lv-title` | The yellow title at the top: what the slide explains |
| `lv-sub` | One muted line under the title, such as the lesson goal on slide 1 |
| `lv-more` | A pane of extra context inside a slide. The kit adds a notch at the bottom edge; clicking it or pressing ↑ slides the pane up, and ↓ or Escape closes it |
| `lv-text` | The explanation below the picture (starts at y = 600; keep the picture above y = 570). A control row fits at about y = 500–560, inside the picture's space, so plan the picture around it |
| `lv-caption` | A single centred line at the bottom, for slides that need only one sentence |
| `lv-label`, `lv-small`, `lv-big` | Diagram label, small muted label, key number |
| `lv-math` | Formula text in the maths serif |
| `lv-pill`, `lv-panel` | A pill badge (`style="color:var(--red)"` sets the dot), a dark panel |
| `lv-control` | A row holding a label, a range input, and its value |
| `lv-btn` | A button in the kit's style |
| `lv-dimmed` | Fades finished parts to about a third |
| `lv-hidden` | Hides an element |

## Beats

Add `data-beat="1"`, `data-beat="2"`, … to elements that should appear in order. Next reveals the next beat before moving on to the next slide. Going back into a slide shows it complete.

## Tooltips

Add `data-tip="text or simple HTML"` to any element, including SVG shapes and `<span>`s in captions. Hovering shows the tooltip, and a click pins it until the next click or Escape. To keep a tooltip live, update its `data-tip` attribute from the slide's draw function; the kit refreshes an open tooltip every frame.

Give each key visual and each plot group a short name with `data-comment="Ball"`, such as a curve, an arrow, a marker, a formula or a whole plot, so that feedback the learner leaves on it names the right thing.

## Checks

```html
<div class="lv-check" id="q-sign" data-answer="b" data-followup="q-sign-2">
  <p class="lv-q">The slope is negative. Which way does the next step go?</p>
  <button data-choice="a">Left</button>
  <button data-choice="b">Right</button>
  <p class="lv-why">The one-line reason, shown after any answer.</p>
  <p class="lv-hint">The hint, shown after a wrong answer or "I don't know".</p>
</div>
<div class="lv-check lv-hidden" id="q-sign-2" data-answer="a">…a similar check…</div>
```

The kit adds the "I don't know" button and records each answer for the export. Give every check a stable `id`. After an answer, the check element fires a bubbling `lv:answer` event with `detail = {choice, correct}`; use it to change the picture, for example to show the follow-up situation.

## Script API (`window.LV`)

| Call | What it does |
|---|---|
| `LV.on(slideId, { enter(slide), leave(slide), beat(slide, n), unbeat(slide, n) })` | Hooks for one slide. `enter` runs each time the slide is shown. |
| `LV.loop(slideId, fn(dt, t))` | Runs `fn` every frame, but only while that slide is shown. |
| `LV.tween(ms, fn(u), ease)` | Animates `u` from 0 to 1 and returns a Promise. |
| `LV.ease.inOut / out / in / smooth / linear` | Easing curves. `smooth` is the soft sigmoid used for morphs. |
| `LV.morph(fromEl, toEl, ms)` | Formula morph. Children with the same `data-k` glide, the others fade. Start `toEl` with `visibility:hidden` in the same place. |
| `LV.draw(path, ms)` | Draws an SVG stroke on from start to end. |
| `LV.count(node, from, to, ms, fmt)` | Counts a number up or down. |
| `LV.el(tag, attrs, parent)` | Creates an HTML or SVG element. |
| `LV.project([x,y,z], cam)` and `LV.orbit(node, cam, onChange)` | A small Canvas 2D 3D view. `cam = {yaw, pitch, dist, f, cx, cy}`. Drag rotates, wheel zooms, double-click resets. |
| `LV.go(i)`, `LV.next()`, `LV.prev()`, `LV.slide` | Navigation. |
| `LV.more(slide, open)` | Opens or closes a slide's `lv-more` pane. |
| `LV.addExport(fn)` | `fn()` returns an object whose keys are added to the exported JSON, for example `{comments: [...]}`. |
| `window.commentContext`, `window.commentExtras` | Set by the kit, for page tools such as a comment layer: the current slide and beat, and the export data. When a tool sets `window.__commentMode`, the kit hides its own export button. |
| `LV.clamp`, `LV.lerp`, `LV.wait` | Small helpers. |

## State rule

Keep one state object per interactive slide. Draw the picture and every readout from that state in one `draw` function, and call it on every input event. This keeps the numbers and the picture in agreement.

# Pitfalls (optional review)

Consult this list when the maths is complex, when a smaller model built the lesson, or when the learner reports a problem. It is not a required step.

## Not done while…

- a number on screen disagrees with the picture, or rounded values do not add up as shown;
- a control changes nothing visible, or changes it only after a delay;
- a label sits on top of the line it names, or on another label;
- the answer to a check is already visible on the slide;
- a caption or tooltip states something the maths does not support;
- the console shows an error on load or while using a control.
- a tooltip or caption describes a different state from the one on screen (for example "positive" while the slope shown is negative);
- the main picture sits visibly off the stage centre.

## Known bugs from similar projects

- A slider with step rounding stalls an animation. Keep the animation state in its own variable, not in the slider's value.
- A missing library leaves the stage blank. Test for the library and draw a fallback.
- `localStorage` can throw. Wrap any use in try/catch, and never rely on it.
- A page without `<!doctype html>` renders in quirks mode.
- More than about 500 animated SVG elements lag. Use Canvas 2D for swarms.
- Mouse-only events fail on touch screens and pens. Use pointer events.
- A 3D camera that starts too close hides the shape. Frame the whole object first.
- Text measured before the fonts load gets the wrong width. Lay out after `document.fonts.ready` when widths matter.
- Dragging inside a 3D view or a custom control must not change slides. Add the class `lv-interactive`.

## Extra maths check

For complex maths, recompute every number shown on screen from the formulas, outside the page, and compare. Check each caption against the diagram it describes.

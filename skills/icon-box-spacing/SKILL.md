---
name: icon-box-spacing
description: Use when building any box, card, toast, alert, button, chip, list item or badge that holds an icon beside text, or any content placed in a box's corner or near its edge.
---

# Icon-box spacing

Goal: equal visible space between a box's edge, its icon and its text, at any font size and line count. `align-items: center` drifts off the first line once text wraps, so anchor the icon to the first line.

## Icon beside text

```css
.box {
  --py: .75em;
  --px: calc(var(--py) + (1lh - 1cap) / 2);
  display: flex; align-items: start;
  gap: var(--px); padding: var(--py) var(--px);
}
.icon {
  --size: 1.25em;
  width: var(--size); height: var(--size); flex: none;
  margin-block: calc((1lh - var(--size)) / 2);   /* centred on first line */
  margin-inline: calc((1cap - var(--size)) / 2); /* left inset = top inset */
}
```

`lh` and `cap` make the offsets follow the font, so one set of numbers holds at every size. Result: icon top inset = left inset = gap to text. Trailing content (close button) takes the same two margins with its own size: top inset = right inset.

Draw icons flush to their viewBox, so the box edge is the ink edge. Buttons need `font: inherit`, or `em` sizes stop following the font. A border adds to the inset: subtract its width from the padding.

## Other corner content

- Equal inset on both edges that meet at the corner, measured to the visible ink.
- Rounded corner: inner radius = max(0, outer radius − inset). Square content needs inset ≥ 0.3 × outer radius.
- Interactive content: hit area ≥ 24px (44px for touch). Grow it with padding and cancel with equal negative margin, so the visible inset holds.
- Without `lh`/`cap` (Figma, native, old browsers): use the same numbers by hand, px = py + (line height − cap height) / 2.

## Check

Does top inset = left inset = gap, and does the icon's centre sit on the first line's centre, at two font sizes? `node scripts/check.mjs <page> --box <css> --icon <css> [--sizes 14,22]` (icon first, its text next to it) measures this in Chromium (needs Playwright; set NODE_PATH if it isn't found) and exits 1 on a mismatch over 1px. Without a browser, compare the icon's and box's rects by hand.

# Style

The look draws on the frame style of The Synthetic Mind and on 3Blue1Brown's motion and teaching habits. These are a direction, not something to copy: never reproduce a channel's specific diagrams, branding, or text. The values below are estimated from screenshots, so treat them as a starting palette.

## Stage

- The page is pure black `#000000`. The stage is a fixed 16:9 area, 1600 × 900 units, scaled to fit the window. Keep about 80 units of margin.
- Panels, when needed, use a very dark blue-grey fill (`--panel`), a thin 1.5-unit border (`--line`), and large rounded corners. A panel holds one sub-picture, for example "what happens" beside "what it means". Do not tile the stage with cards.
- Use no drop shadows on text and no large gradients. A soft glow on the active object is fine.

## Colour roles

| Role | Token | Used for |
|---|---|---|
| Look here, title, active | `--yellow` `#FFD400` | Slide title, the selected item, the key number, arrows that show a rule |
| Main subject | `--blue` `#4A90E2` | Particles, bars, the main curve, the primary quantity |
| Evidence, error | `--red` `#E8453C` | Sensor readings, hits, "observed", "wrong" |
| Second quantity | `--orange` `#F5A623` | A second distribution, a prediction, steps |
| Rate of change | `--teal` `#2EC4B6` | Slope, gradient, velocity: how fast the main quantity changes |
| Structure | `--text` `#E6E8EC`, `--muted` `#9AA0A8` | Walls, axes, outlines, dimension lines |
| Inactive | `--dim` `#3A3F47` | Off segments, empty slots |
| Correct | `--green` `#4CD08A` | Confirmation, used sparingly |
| Physical material | brown `#5A3F2A`, cream `#EFE3C8` | Shelves, wooden bases, paper; only when the metaphor is physical |

Assign the roles in the lesson plan, and add an accent to a slide only when that quantity is on it. Colour-code the maths to the picture: a term written in orange is drawn in orange. Keep body text at 4.5:1 contrast or better.

## Type

- Titles and labels use a clean sans (`--sans`). Pills and the breadcrumb are uppercase with wide letter-spacing. Labels keep their case, so that variables such as η and w stay readable. Titles are sentence case and say plainly what the slide explains.
- Numbers are bold, with tabular figures. Round shown numbers so the displayed arithmetic adds up.
- Maths uses a TeX-like serif (`--math`). Variables are italic, while digits, units, and function names are upright. Use a true minus sign (−).

| Element | Size in stage units |
|---|---|
| Title | 44–52 |
| Explanation text | 30–32 |
| Diagram label | 24–30 |
| Small label, tick | 20–22 minimum |
| Key number | 70–110 |
| Main formula | 50–70 |

## Shapes and lines

- Lines are thin and crisp: 1.5–3 units for structure, and 3–5 for the highlighted thing.
- Pills are fully rounded, with a thin outline and a leading dot in the role colour ("LASER SCAN", "PARTICLE FILTER").
- A technical-drawing feel works well: dimension lines with end ticks ("3 m"), rulers with a few labelled ticks, and zoom callouts that join a small square to an enlarged copy.
- Objects are simple but real-looking: a battery, a bulb, a robot, a stopwatch. Draw them as inline SVG with flat colour, a few soft gradients, and a highlight. When a drawing would take long and you can download files, a Google Noto emoji (Apache 2.0, `https://api.iconify.design/noto/<name>.svg`) may replace it; paste its SVG into the page so the lesson works offline.
- Arrows have thin, clean heads. A curved yellow arrow means "this value goes there". Label arrows with a verb when they carry meaning.
- Emphasis tools: a faint ghost of the previous state under the new one, strike-through and replace, a `???` placeholder for an unknown, a brace with a label, and a title that transforms in place.

## Example layouts from the references

Use these as ideas, not as a required template.

- **Hero stage:** a title, one pill naming the view, and one wide diagram such as a floor plan with a robot.
- **Split view:** a small "what the machine senses" card beside a large "where it is" picture.
- **Two-panel comparison:** a 1-D belief curve next to the 2-D scene it describes, to show why one model fails.
- **Equation under a live picture:** a formula panel at the bottom, with each term colour-matched to the picture and a plain-word caption under each term.
- **Number line with stems:** a ruler, lollipop bars for weights, and a small fraction showing one intermediate result.
- **Count grid:** two groups of ten small squares, with hits filled red, to show a probability as a count.
- **Distribution overlay:** two coloured curves over one axis, each labelled at its end.
- **Scale ladder:** 1-D, 2-D, and 3-D objects in a row with counts growing under them, to show an exploding number.
- **Zoom chain:** grid → finer grid → dial, linked by magnifier lines, ending in "500 × 500 × 360 = 90,000,000".
- **Three application cards:** the same idea used in three settings, each with a two-dot caption ("what we estimate / what we observe").
- **Scene with live readouts:** a bookcase as a hash table, a curved arrow from `hash(name) = 4` into shelf 4, and "STEPS 1" beside it.
- **Pipeline strip:** name → letter values → sum → shelf, left to right.
- **Dense network with focus:** many faint links, one item's links in yellow, and the first collision in red.
- **Slider as a physical control:** a fader with a yellow track and the current value pinned to the thumb.
- **Physical apparatus:** a bead on a wire from A to B, with dimension lines and a stopwatch reading.

## Motion values

- Appear and fade: 300–500 ms. Move across the stage: 600–1200 ms. Zoom or camera: 800–1400 ms. Nothing longer than 2 s without a reason.
- Pause about 300–600 ms after each stage of a build.
- Stagger a group by 20–60 ms per item only when the count is the point.
- Particle swarms: 100–1,500 simple glyphs on Canvas 2D.

## Avoid

- Pages that look like documents, slide decks, or dashboards: paragraphs, bullet lists, card grids, rows of stats apart from the picture, footnotes.
- Small text scattered over the picture.
- White or pastel backgrounds, rainbow palettes, glassmorphism, and glow everywhere.
- Animation for its own sake: sliding titles, bouncing, typewriter text, constant background motion.
- A control that changes nothing visible, or changes it late.
- Legends far from the data, and axes or numbers without labels or units. Put the x-axis label at the right end of the axis and the y-axis label above the axis.
- Starting with a definition.

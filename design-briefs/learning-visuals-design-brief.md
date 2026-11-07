# Design brief: HTML learning visuals

> Superseded for text and titles by `skills/visual-lesson/SKILL.md`: titles say plainly what a slide explains, and each slide has a short, connected explanation instead of a 12-word caption.

Purpose: describe the target look, motion, interaction, and technical limits for an AI skill that makes `.html` learning visuals. The skill will run in ChatGPT and Claude. It will pair each visual with minimal text.

This brief replaces the moodboard screenshots. It is written so that nobody needs the images again. The screenshots were removed from the repository in the same change that added this file.

The brief has these parts:

1. Goal and the one-line test
2. What the reference channels do
3. Visual style specification (page, colour, type, shapes)
4. Layout patterns, with the slides they came from
5. Motion rules
6. Interaction rules
7. Three-dimensional visuals
8. Mapping to the user's teaching rules
9. Technical rules for ChatGPT and Claude
10. Libraries and when to use them
11. Anti-patterns
12. Pre-delivery checklist
13. Open questions for the skill author
14. Sources and confidence

---

## 1. Goal and the one-line test

Make the learner understand one idea by watching it and touching it. Use a clean dark stage, one idea per slide, and almost no prose.

The test: **if the slide were a frame in a YouTube explainer, would a viewer understand it in about five seconds with the sound off?** If it needs a paragraph, redesign the picture.

Typical output: a single HTML file that holds a short slide sequence (usually 3 to 8 slides for one concept). Each slide shows one picture, one title, and a few labels. Some slides are animated. Some have controls such as sliders, toggles, and draggable points.

## 2. What the reference channels do

### The Synthetic Mind (main style reference)

The channel describes itself as explaining science, mathematics, and AI with visually detailed explanations. The moodboard came from four of its videos:

- "Why Particle Filters Are Everywhere" (about 21 minutes). 16 of the 23 screenshots.
- "How Hash Tables Achieve O(1) Speed" (about 8.5 minutes). 3 screenshots.
- "Could Diffusion Language Models Replace LLMs?" (about 22 minutes). 2 screenshots.
- "Why the Shortest Path Isn't the Fastest" (calculus of variations, about 23 minutes). 2 screenshots.

What these frames share:

- A true-black frame with a single yellow, wide-spaced, uppercase **topic title** at the top. It stays fixed for a whole chapter, so it works as a "you are here" label. A thin short grey rule sits under it.
- Below the title: one large **stage** (a map, a diagram, a number line, a table, a physical apparatus). It fills most of the frame.
- Small **pill badges** name what the viewer is looking at ("BELIEF", "KALMAN FILTER", "LASER SCAN", "STATE", "PARTICLE FILTER", "SENSOR  DOOR", "ODOMETRY 1.0 M").
- A **segmented stage tracker** shows the step in a process (PREDICT / WEIGHT / RESAMPLE, or PREDICT / UPDATE). The active segment is highlighted.
- **Big numbers** with tiny tracked uppercase captions ("SHELVES 1,000,000", "STEPS 1", "CHANCE 50.7%"). The key number is boxed in yellow.
- **Math** in a serif TeX look, colour-coded so each coloured term matches a coloured object in the picture. Math sits in a rounded dark panel at the bottom, or alone in white.
- Everything is **concrete first**: a robot in a corridor, a username form, bookshelves, a pendulum-like rail with a stopwatch, a cannon, a profit curve. The abstract idea comes after the example.

### 3Blue1Brown (strong reference for animation)

Features to copy:

- **Every movement has a purpose.** The channel's own guidance says to avoid pointless animations: each movement must communicate the same point as the narration, and must not compete with it.
- **Concrete before abstract**: show examples first, general framework after.
- **Never start with definitions.** A definition is an end point, not a starting point.
- **Be visual**: always ask what picture could explain it.
- **Smoothness and cleanliness are the default.** Objects move continuously from one state to the next, so the viewer can track identity ("this dot became that dot"). They do not pop in and out.
- **Transformations are shown, not described.** A grid is stretched; a curve is morphed; a point is dragged and the dependent quantity updates live.
- Typical Manim palette on a dark background (third-party summary of the defaults): near-black background, bright blue `#58C4DD`, green `#83C167`, yellow `#FFFF00`, red `#FC6255`. Colour carries meaning and stays the same for the whole lesson.

### How the two combine

Use the Synthetic Mind **frame** (black stage, yellow tracked title, pill badges, big-number readouts) with the 3Blue1Brown **motion and teaching discipline** (purposeful, smooth, concrete-first, colour means one thing).

## 3. Visual style specification

### 3.1 Page and stage

- Page background: pure black `#000000`. The page outside the stage is always black.
- Stage: a fixed **16:9** area (design at 1600×900 units) that scales to fit the window. Keep a safe margin of about 4% on each side.
- Panels (cards inside the stage) use a very dark blue-grey fill, about `#0A0C10` to `#10131A`, with a thin 1–2 px border in a slightly lighter grey (`#2A2E36`), and rounded corners (radius about 2% of stage width). Panels hold one sub-picture and are used to separate "what happens" from "what it means".
- Soft inner shadow or faint glow is allowed on interactive objects. No drop shadows on text. No gradients on large areas, except dark vignette-like fades behind a map or a shelf.
- Space is generous. Roughly 30–40% of the stage is empty black. Do not fill it.

### 3.2 Colour roles

Colour has a **meaning per lesson**. Pick the meanings once and never reuse a colour for something else. Approximate values measured from the screenshots:

| Role | Colour | Approx. hex | Used for |
|---|---|---|---|
| Title / highlight / "active" | Yellow | `#FFD400` to `#F5C800` | Slide title, selected item, boxed key number, the "thing to look at now", arrows that show a rule |
| Main subject / belief / data | Blue | `#4A90E2` to `#3D8BFD` | Particles, bars, the main curve, the primary quantity |
| Measurement / evidence / error | Red-orange | `#E8453C` | Sensor readings, hits, collisions, "wrong" or "observed" |
| Prediction / second quantity | Orange | `#F5A623` | A second distribution or model term, so it contrasts with blue |
| Structure / neutral | Light grey / white | `#E6E8EC`, `#9AA0A8` | Walls, axes, outlines, dimension lines, inactive labels |
| Dimmed / inactive | Dark grey | `#3A3F47` | Off segments, empty slots, unused cells |
| Warm material | Brown + cream | `#5A3F2A`, `#EFE3C8` | Physical shelves, wooden base, price tag, stopwatch face. Use only when the metaphor is physical |
| Positive confirmation | Green | `#4CD08A` | "Available", "correct" (used sparingly, for example a check-mark message) |

Rules:

- Use at most **3 accent colours per slide** (yellow plus two of blue, red, orange).
- Yellow means "look here" or "title". Do not use yellow for body data when a title is also yellow, unless that data is the focus.
- Colour-code math to the picture: the term written in orange in the formula is drawn in orange in the diagram.
- Do not use colour alone. Add a shape, position, label, or line style, so colour-blind users can still read the slide (see section 12).
- Contrast: body labels at least 4.5:1 on their background; large numbers at least 3:1.

### 3.3 Typography

Three families, no more:

1. **Title and badges**: geometric or neo-grotesque sans, uppercase, **wide letter-spacing** (about 0.12–0.2 em). Titles are regular or light weight; badges and section labels are bold. Examples: Montserrat, Inter, Roboto, system sans.
2. **Numbers and labels**: the same sans family in bold, tabular numerals. Big numbers are 4–6% of stage width. Captions above or below them are small caps / uppercase, tracked, medium grey.
3. **Math**: a TeX-style serif (Computer Modern look, KaTeX or STIX/Cambria Math). Math is **white**, with colour only on terms that match the picture. Variables are italic.

Size guide in stage units (stage 1600 wide):

| Element | Size |
|---|---|
| Slide title | 44–52 px, uppercase, tracked |
| Pill badge text | 22–26 px bold uppercase tracked |
| Ordinary diagram label | 24–30 px |
| Axis tick / small label | 20 px minimum |
| Key number | 70–110 px bold |
| Formula (main) | 50–70 px |

Never go below 20 stage-units for any text. If a label would be smaller, delete it or move it into a hover/tap tooltip.

Text budget per slide: title plus **at most about 15 words** of labels in total (numbers, units, and formula excluded). No paragraph. No bullet lists. Any explanation the learner needs goes in the chat reply or in one short caption line (maximum one sentence, 12 words).

### 3.4 Shapes and line

- Lines are thin and crisp: 1.5–3 px for structure, 3–5 px for the thing being highlighted.
- Rounded rectangles for panels, tiles, and pills. Pills are fully rounded with a 1.5 px outline and a leading **status dot** in the role colour (for example a blue dot for "PARTICLE FILTER", a red dot for "LASER SCAN").
- Technical-drawing feel: dimension lines with end ticks ("50 M", "10 CM", "3 m", "1 m"), rulers with tick marks and a few labelled values ("0, 4.5, 10.5, 22.5, 30 m"), magnifier lines that connect a small square to an enlarged copy (zoom callout).
- Objects are simple but real-looking when they help: a quadcopter from above, a small robot with a lens, a stopwatch, a cannon, a seesaw balance. Flat vector with subtle metallic shading is fine. No cartoon faces, no clip art, no emoji.
- Arrows: clean thin arrowheads. Curved yellow arrows show "this value goes to that place" (for example a hash result pointing to a shelf).

## 4. Layout patterns seen in the references

Each pattern lists what was on screen. Use them as templates.

**P1. Hero stage with a title (most common).** Yellow title; one wide diagram (floor plan, map). A pill badge above the diagram says what is shown. Example: a top-down floor plan of a corridor loop, thick light-grey walls, dark navy floor, tiny door arcs, faint furniture outlines, a hatched rectangle for a pillar, a small rounded-rectangle robot. Sensor positions drawn as blue dots with soft halos. Later frames overlay blue arrow-shaped particles (1,000 or so, scattered everywhere), then clusters of particles in three corridor places.

**P2. Split view: "sensor view" + "world view".** Left: a small rounded card with a red status pill ("LASER SCAN") showing the robot from above with red dotted laser lines and labels "1.2 m", "DOOR · 3 M". Right: the large floor plan. The pair shows what the machine senses next to where it is.

**P3. Two-panel comparison.** Left card: a 1-D belief curve (blue peaks over a position axis, with a flatter yellow bell curve crossing them and a hatched box for the average μ). Right: the plan with nested yellow ellipses. The comparison shows why a single bell curve cannot represent several possible places. Pill label "KALMAN FILTER" above; "BELIEF" and "POSITION" inside the card.

**P4. Equation panel under a live picture.** Picture on top. A rounded dark panel at the bottom holds the equation with colour-coded terms and a small plain-word caption under each term ("predicted belief at pose x_t", "motion model u_t = odometry", "belief before the move"). Blue term ↔ blue dots; orange term ↔ orange arrows. Fan of thin orange lines from many blue dots to one white square, thicker where the contribution is larger.

**P5. Number-line + stems + table of numbers.** A 0–30 m corridor strip on top (with the robot and door arcs), a ruler with a few labelled ticks, below it a row of blue "stems" (lollipop bars) whose heights are weights (0.1 and 0.24 labels), then a rounded panel with a fraction (0.6 / 2.5 = 0.24). A tracker pill row at the top shows PREDICT / **WEIGHT** / RESAMPLE with WEIGHT highlighted, plus a pill with "Σw 1.00" (a running check that weights sum to one).

**P6. Count grid.** Two groups of ten small rounded squares; red tiles are "hits" (6 / 10 versus 1 / 10) with small outlined count pills under each. Shows a probability as a visible count. The sensor icon (a red translucent cone) points at the wall above each robot position.

**P7. Distribution overlay.** Two curves in two colours over a labelled axis (blue "updated" belief, orange "predicted" belief), faint histogram bars behind them, a row of blue arrow particles below, a red likelihood curve with blue stems below that, and a formula panel at the bottom with matching colours. Curve labels sit directly beside the curve ends, not in a legend box.

**P8. Scale ladder.** Four objects in a row with growing complexity (1-D line, 2-D grid, 3-D cube, then "…" and a huge power of ten), each with a bold label ("1 dimension", "2 dimensions", "3 dimensions", "10 dimensions") and a blue count under it (10, 100, 1,000, 10,000,000,000). The idea: the same cells make an exploding count. Particle dots fill each object more densely.

**P9. Zoom chain.** A large square grid (labelled "50 M" on both sides), a magnifier line to a blue enlarged grid (labelled "10 CM"), another line to a dial with tick marks and a robot icon ("1°"). Below it the formula "500 × 500 × 360 = 90,000,000", with x, y, θ placed above their numbers. The chain shows where a big number comes from.

**P10. Dense table of rows with ticks.** Twelve rows labelled x, y, z, φ, θ, ψ, ẋ, ẏ, ż, ω_x, ω_y, ω_z, each a ruler with 100 ticks, a bracket labelled "100" above, a drone next to it, and "100^12 = 10^24" below. The picture makes "too many states" visible without words.

**P11. Three-up application cards.** Three equal rounded cards in a row with a small caption under each. Each caption has two coloured dots with two words (blue = what we estimate, red = what we observe): ship position / bearing; object box / image pixels; volatility / prices. Inside: a ship with two red bearing cones and a cloud of blue particles; a car with stacked blue boxes in a film strip; a price line with a volatility band. Pill row on top repeats the process steps.

**P12. Single scene plus live readouts.** A hash table drawn as a bookcase: ten shelves with coloured book spines, one shelf boxed in yellow, a curved yellow arrow from "hash(maya_chen7) = 4" down into the shelf. Under it two stats: NAMES ON FILE 900,000,000 and STEPS 1. On the left a realistic sign-up form card (dark, rounded, blue button, green "is available" message). The familiar interface hooks the learner before the mechanism.

**P13. Pipeline strip.** A rounded panel with a left-to-right flow: NAME (dashed input) → LETTER POSITIONS (O M A R as tiles with numbers 15 + 13 + 1 + 18) → SUM (a digit tile, one greyed and one yellow) → SHELF (7). Under it a long shelf with a thin vertical yellow bar at position 7 and a label "7". At the bottom four stats: SHELVES, NAMES STORED, CALCULATIONS, LOOKS. A label "HASH FUNCTION" sits on the panel's bottom border.

**P14. Dense network with highlight.** A 12-row by about 30-column calendar wall (JAN to DEC), small cream tiles placed at random cells, many faint grey lines connecting all pairs, yellow lines highlighting one tile's pairs, a red square on the first collision. Under it a progress bar "WALL FILLED 0% to 100%" with a red marker "FIRST COLLISION" and a dashed marker "YOUR GUESS" (a prediction the learner made). Four readouts: SHELVES 365, NAMES 23, PAIRS, CHANCE 50.7% (boxed yellow). The source frame showed PAIRS as 73, but 23 names make 23 × 22 / 2 = 253 pairs, so readouts in a new visual must be computed from the inputs, not copied. A readout must always agree with the other numbers on the slide.

**P15. Interactive-looking controls.** A row of ten word tiles ("The cat sat on the warm mat and fell asleep") in a dark panel; below it a panel "MASKED 15%" with a slider whose thumb looks like a brushed-metal fader, a yellow filled track, a tick scale 0–50–100%, and a floating pill "BERT 15%" pinned to the thumb. Later: tiles empty, a seesaw with stacks of blue 3-D blocks, formula "weighted score = score / t" with t in yellow, "t = 0.1" on one side and "t = 1" on the other, "10 SCORED BLANKS" boxed in yellow. The slider and the balance show a rule by letting the learner move it.

**P16. Physical apparatus with a measurement.** Two metal posts on a wooden base with a bead on a curved wire from A (start) to B (finish); horizontal "3 m" and vertical "1 m" dimension lines, a gravity arrow "g", and a large stopwatch showing "1.11 s". Chapter title "CALCULUS OF VARIATIONS". Another slide pairs two cards: a profit-versus-price curve with a draggable blue point and a "$5" price-tag callout, and a cannon firing at 25° with dashed arcs and a flag at 30 m. The pair introduces "optimise a number" and "optimise a whole path".

**P17. Coordinates callout.** A zoomed floor plan with a robot, white measure lines with circled labels x, y, θ, a white arrow showing heading, and a rounded "STATE" card with (x, y, θ) and (10.8 m, 4.5 m, 0°).

**P18. Grid of cells with live markers.** The full floor plan covered with a dot grid: red dots where the robot cannot be (walls, impossible), grey/white dots where it could be, blue soft squares where probability is high. Reads as a heat map without a legend.

Common ingredients across patterns: the same title; one or two pills; one central picture; one formula or one big number; consistent colours.

## 5. Motion rules

Motion is for understanding, not decoration. Every movement must answer "what changed, and why?"

1. **Identity-preserving transitions.** A dot that is selected moves to its new place; it does not vanish and reappear. A curve morphs into the next curve. A number counts up or down when its input changes.
2. **One motion at a time** as the default. Sequence: highlight → move → result appears. A short pause (300–600 ms) after each stage lets the eye rest.
3. **Reveal in the order of the explanation.** Build a slide in 3 to 6 beats: scene appears; the question object appears; the rule or arrow appears; the result number appears; the formula appears. Each beat is triggered by the learner (Next button, arrow key, click) or plays automatically only once with a Replay button.
4. **Easing.** Use ease-in-out (cubic) for moves; ease-out for appear; no bounce, no elastic, no overshoot, no spin-in, no typewriter text.
5. **Durations.** Appear / fade: 300–500 ms. Move across the stage: 600–1200 ms. Camera or zoom: 800–1400 ms. Never longer than 2 s without a purpose.
6. **Stagger** groups slightly (20–60 ms per item) only when the group's count is the point (for example ten tiles lighting up).
7. **Dim rather than delete.** Fade the finished part to about 30–40% opacity, so context stays while attention moves.
8. **Loops are allowed only for the thing that is the phenomenon** (particles drifting, a pendulum). Always provide Pause / Play and a Reset.
9. **Particle swarms**: 100–1,500 simple glyphs (small arrowheads or dots) on Canvas 2D. Motion shows the algorithm (predict = shift with noise, weight = size or opacity grows, resample = copies jump to heavy ones).
10. **Respect `prefers-reduced-motion`**: skip travel animations; cross-fade states instead and keep controls working.
11. **Frame rate budget.** Keep to 60 fps on a mid laptop. Cap particles on mobile. Use `requestAnimationFrame` and delta time, not `setInterval`.

## 6. Interaction rules

Interaction exists to let the learner **change an input and see the effect** (the user's own rule). Add it only where it helps understanding.

Pick controls by what the learner should discover:

| Learning goal | Control | Example from the references |
|---|---|---|
| "What happens as this number grows or shrinks?" | Slider with a live readout | Masking rate 0–100%; weight t; number of names in a room |
| "Where does this point go?" | Draggable point | Move the price on the profit curve; drag the robot |
| "What is the difference between A and B?" | Toggle or segmented control | PREDICT / UPDATE; Kalman vs particle filter |
| "What happens next?" | Next-step button and arrow keys | Predict → weight → resample |
| "Guess before you see" | Prediction marker | "YOUR GUESS" dashed marker against the real value |
| "Try with my own data" | Small text/number field | Type a name, see the hash |
| "See all cases" | Replay / randomise button | New random room, new random particles |

Rules:

- **At most 1–3 controls per slide.** Controls sit under the stage or inside a card, in the style of the pills (dark, rounded, tracked uppercase, yellow active state). Sliders use a visible yellow filled track and a clear thumb, big enough to grab (at least 44 px touch target).
- **Every control has an immediate visible effect** (under 100 ms) on the picture and on the big number or formula. The relationship learner-changes-X → Y-changes must be visible without text.
- **Show the number that matters** beside the control, large, with its unit.
- **Provide a sane default state** that already shows the main idea before the learner touches anything.
- **Keyboard**: left/right = previous/next slide; space = play/pause; arrow keys nudge the focused slider; Esc = reset. Show a small, dim control hint only once.
- **Reset button** on every interactive slide.
- **Check-for-understanding** slides (from the teaching rules) can be built with the same controls: predict by dragging a marker, choose among three pictures plus an "I don't know" option, or spot the wrong step in a sequence. Do not reveal the answer before the learner commits.

## 7. Three-dimensional visuals

Use 3D only when the idea is truly 3D or higher dimensional. Examples: gradient descent on a loss surface, saddle points, multivariable functions, vector fields, rotations, high-dimensional point clouds projected to 3D. Use 2D for everything else.

Style:

- Same black stage. A **thin wireframe grid** or a faint floor grid gives depth cues. Axes are light grey with small tick labels and a one-letter name (x, y, z, or the meaning such as "weight 1", "weight 2", "loss").
- Surface: semi-transparent mesh with thin lines, coloured by height using a **single-hue ramp** (dark blue to bright blue, optionally to yellow at the minimum or at the highlighted value). No rainbow maps.
- The moving thing (ball, optimiser, particle) is a bright **yellow or orange** dot with a short fading trail. The path so far is a solid line; the next step is a short arrow showing the gradient direction.
- Contours: project contour lines on the floor to link 3D and 2D views; a small 2D inset card (top view) can sit beside the 3D view, with the same dot moving in both.
- Camera: a gentle default angle that shows the shape; the learner can **drag to rotate**, scroll or pinch to zoom, double-click to reset. A slow auto-rotate is allowed for the first 3–4 seconds only, then it stops.
- Controls: learning rate slider, start-point picker (click the surface), step button, run button, reset.
- Lighting is simple (ambient plus one directional). No reflections or heavy shading. No fog.
- Keep a **fallback 2D view** (contour map) in case WebGL is not available.
- If a plain Canvas 2D projection is enough (rotate a wireframe with a simple 3D-to-2D projection), prefer it. It has no dependencies and works in every sandbox. Use WebGL (three.js) only when you need many triangles, shading, or smooth interactive rotation.

## 8. Mapping to the user's teaching rules

The user's standing teaching instructions are the context for every visual. Translate them like this:

| Teaching rule | Visual consequence |
|---|---|
| Show compact visual progress in every lesson reply | A small progress strip (dots or a thin bar with 3–7 steps) at the bottom edge of the stage. Filled = concepts demonstrated. Keep it in the reply format flexible. |
| One new concept or manageable step per turn | One slide set = one idea. Do not pack two concepts into one picture. |
| Connect it to a concrete use | Start with a real object (form, corridor, shelves, projectile) before the abstraction. |
| Prefer visual explanations, especially interactive presentations where I change inputs | Sliders / drag points / step buttons as in section 6. Default state already explains. |
| Supporting text brief; ASD-STE100 language | Labels use short, common words; one idea per sentence; consistent terms. New term: show the plain-word label under or beside the term once ("predicted belief at pose x_t"), then use the term only. |
| Explain new notation and intermediate steps | Formulas build term by term; each new symbol gets a colour and a plain-word caption; the colour matches the object in the picture. Show intermediate numbers (0.6 / 2.5 = 0.24). |
| Guided practice: let me try one step, then wait | A slide can end with an empty slot or a movable marker; do not show the solution until requested. Keep worked examples on separate slides. |
| Checks: vary choosing, predicting, explaining, finding errors, new examples; include "I don't know" | Build check slides from different interaction types. Always include an "I don't know" choice. Avoid arithmetic checks unless arithmetic is the topic. |
| Feedback and gaps | If a check is wrong, the next slide targets the gap with another picture, one hint, and a similar check. |
| Ending: brief recap + one combining task | Last slide: three or four small thumbnails of the earlier pictures in order, then a single task. |

## 9. Technical rules for ChatGPT and Claude

The skill must produce a file that runs in both products.

**Default: one self-contained `.html` file with no network requests.**

- Put CSS and JavaScript inline.
- Use **vanilla JavaScript**, **inline SVG**, and **Canvas 2D**. This works in every sandbox.
- Use **system font stacks** (for example `Inter, "Segoe UI", system-ui, sans-serif` for text; `"Cambria Math", "STIX Two Math", "Latin Modern Math", Georgia, serif` for formulas) because remote font files may be blocked.
- Draw simple math as SVG text, with italic serif variables and SVG lines for fractions. Use a library only when the formula is too complex.
- Do not use `localStorage` for anything the lesson needs; some previews block it.
- Do not use forms that submit, `window.open`, alerts, or any navigation.
- Size: keep under 1 MB. No embedded images unless drawn as inline SVG.
- No analytics, no external images, no iframes.

**Why no external libraries by default:**

- Claude (artifacts): external scripts load only from `cdnjs.cloudflare.com`. Other CDNs fail. (Source: community write-up; consistent with the platform's design guidance.)
- ChatGPT (HTML preview of a code block, and file upload of `.html`): a community report says references to external scripts and styles are blocked by the preview's content security policy. This was not re-tested for this brief, and it may have changed.
- Hence the rule: **the file must work with zero external requests**. Libraries from cdnjs are an optional extra for Claude only. When a library is used, the skill must pick an **exact pinned version** and keep a fallback (for example a simpler 2D view) if the script fails to load.

**Responsive stage:**

- A single `<svg viewBox="0 0 1600 900">` or a `div` with `aspect-ratio: 16/9` scaled by CSS. Text uses stage units, so everything scales together.
- On narrow screens (phones), allow the stage to stay 16:9 and letterbox on black; give controls a row below the stage with large touch targets. Do not reflow the diagram into a long page.

**Slide mechanics:**

- Slide state is an array of steps; **Next / Previous buttons**, arrow keys, and swipe change the step. Show "n / N" or progress dots.
- Each slide is a function that builds its scene and a list of **beats** (see motion rules).
- Use a small shared helper layer in the file: `tween(from, to, ms, ease)`, `el(tag, attrs)`, `lerp`, `clamp`, and a play/pause clock.

**Accessibility baseline:**

- `<title>` and `lang`. Visible focus rings (yellow). All controls are real `<button>` / `<input type=range>` elements with labels.
- Text alternatives: a one-line `aria-label` or visually hidden caption per slide.
- `prefers-reduced-motion` honoured.
- Do not use colour alone (add shape, pattern, or label). Check red/blue/orange pairs; add a different shape (dot vs arrow vs square) or a dashed vs solid line.

## 10. Libraries and when to use them

Order of preference: **nothing → tiny helper → library**.

| Need | First choice (no dependency) | Optional library (cdnjs, pinned) | Notes |
|---|---|---|---|
| Diagrams, curves, number lines, floor plans | Inline SVG | none | Best for crisp lines; animate with `requestAnimationFrame` or CSS transitions on transform / opacity |
| Particle swarms, heat maps, many moving dots | Canvas 2D | none | Use for 200+ moving objects; draw in one pass; avoid per-frame DOM changes |
| Easing and sequencing | Own small tween helper (about 30 lines) | GSAP (core only) | GSAP is helpful for timelines; the helper is enough for most slides |
| Math typesetting | SVG text with italic serif, own fraction layout | KaTeX | KaTeX is fast and looks like TeX; needs CSS and fonts, so keep a plain-text fallback |
| Charts with data and axes | SVG plus a few helper functions | D3 (for scales and shapes only) | Use D3 for scales, axes, and path generators; do not rely on it for layout |
| 3D surfaces and scenes | Canvas 2D with perspective projection | three.js | For gradient descent: build the surface mesh yourself; write simple orbit controls; cdnjs does not always carry the examples folder, so do not depend on `OrbitControls` from a CDN |
| Plots with built-in 3D and hover | – | Plotly | Heavy (several MB). Use only if ChatGPT and Claude both allow it. Default styling does not match this brief; override colours and fonts |
| Physics (pendulum, projectile, balance) | Closed-form formulas or a simple Euler/RK4 step in a few lines | none | Prefer exact formulas when available |

Python-side alternative (when a video or GIF is wanted instead of a live HTML file): Manim is the engine behind 3Blue1Brown. It is not part of this skill, because the output must be `.html`.

## 11. Anti-patterns

Reject the slide or page if it shows any of these:

- A page that looks like a normal slide deck or a web article: paragraphs, bullet lists, many small captions, footnotes.
- Many small texts all over the picture (explicitly unwanted).
- White or pastel backgrounds, rainbow palettes, gradient-heavy "AI-generated" cards, glassmorphism, neon glow everywhere.
- Emoji, icon sets, stock clip art, cartoon mascots.
- Animation for its own sake: sliding titles, bouncing items, typewriter text, spinning loaders, constant background motion.
- Two things moving at once without a reason.
- A control that changes nothing visible, or changes it after a delay.
- More than 3 controls on one slide.
- Legends with colour swatches far away from the data (label the objects directly).
- 3D used for a 2D idea; 3D with no way to rotate or reset.
- Unlabeled axes, units missing from numbers, numbers without a caption.
- The answer to a check already visible on the slide.
- Hidden dependencies: remote fonts, remote scripts, remote images with no fallback.
- Definitions as the first slide.

## 12. Pre-delivery checklist

The skill should run this checklist (mentally or in code) before returning the file:

1. **One idea?** The slide title names one thing. The slide set explains one concept.
2. **Five-second test?** A viewer can say what the slide shows without reading more than the title and the labels.
3. **Text budget?** Title plus at most about 15 words of labels; no paragraph; no text under 20 stage units.
4. **Colour meaning?** Each colour has one meaning; at most 3 accents per slide; math colours match the picture; not colour-only.
5. **Concrete first?** The first slide shows a familiar object or situation.
6. **Motion purpose?** Each animation shows a change; all identity-preserving; durations in range; reduced-motion handled; Play / Pause / Reset exist.
7. **Interaction effect?** Every control changes the picture and a big readout instantly. The default state already shows the main idea.
8. **Checks included?** At least one prediction or check per set, with "I don't know", no answer shown early.
9. **Runs offline?** No external requests (or a pinned cdnjs script with a fallback). Opens from a single file.
10. **Scales?** Looks right at 1280×720, 1920×1080, and a phone width; no scrollbars inside the stage; touch targets at least 44 px.
11. **Console clean?** No errors on load or when every control is used.
12. **Progress shown?** A small progress strip is present, matching the teaching rule.

## 13. Open questions for the skill author

These could not be answered from the images or online research. Use the grill step to settle them.

1. **Dark only, or also a light variant?** Every reference is on black. A light variant matters only for printing or bright rooms.
2. **How many slides per file by default?** The brief suggests 3 to 8. Should longer lessons be split into several files?
3. **Where does narration live?** The references are videos with a voice-over. Here the "voice" is the chat reply. Should every slide have an optional one-line caption, or none?
4. **Should the title style (yellow, uppercase, tracked) always be the chapter name, or the slide's own claim?** The references use the topic name; a claim ("Weights must add up to 1") is often clearer.
5. **Is a footer progress strip wanted inside each file, or only in the chat reply?** The teaching rule says "in every lesson reply".
6. **Which libraries may be assumed in each product?** Test KaTeX, three.js, and D3 from cdnjs in current Claude artifacts and in current ChatGPT previews before the skill relies on them.
7. **Math-heavy topics**: should the skill require KaTeX when available, or always use the plain SVG fallback?
8. **Check slides**: should they be separate files (so the answer is never in the source), or the same file with answers hidden in code? A learner can read the source of a file they were given.
9. **Sound**: none, presumably. Confirm.
10. **Languages**: English only? Polish labels?
11. **Subject areas**: math and machine learning first (gradient descent, probability), then electrical engineering (the repository already has a teaching skill for that)?

## 14. Sources and confidence

What this brief is based on:

- **Screenshots (primary).** 23 frames from four Synthetic Mind videos. The visual style, colours, patterns, and text sizes in sections 3 and 4 come from them. Hex values are estimates read from the images, not exact samples. Treat them as a starting palette.
- **The Synthetic Mind channel page.** Confirms the channel's focus (science, mathematics, and AI explained visually) and that its production uses modern computational and AI tools.
- **3Blue1Brown site (About page and FAQ).** Source for the teaching principles in section 2: concrete before abstract; never start with definitions; be visual; avoid pointless animations; every movement has a purpose and reinforces the narration; Manim is the animation engine and favours smoothness and cleanliness by default.
- **Manim palette values.** A third-party skill description lists the classic defaults (background `#1C1C1C`, blue `#58C4DD`, green `#83C167`, yellow `#FFFF00`). Treat as a convenience, not as an official statement.
- **Platform limits.** Claude artifacts: external scripts only from `cdnjs.cloudflare.com` (community write-up). ChatGPT HTML preview: external scripts reported as blocked by CSP (community forum post). Both **need re-testing** before the skill depends on them. This is why the default is a zero-dependency single file.
- **Not verified.** The Synthetic Mind video list and transcripts could not be read (YouTube page text was unavailable to the scraper), so style conclusions rest on the screenshots only. Nothing in this brief claims to describe videos that were not in the moodboard.
- **Not copied.** The brief describes a style. The skill must not reproduce a channel's specific diagrams, branding, or text. Use the style as a direction only.

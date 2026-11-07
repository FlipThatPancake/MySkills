# Patterns

## Narrative arcs

Pick one per lesson.

- **Puzzle → explore → name → check:** a concrete question, a picture to play with, then the term or formula, then a check. This is the default arc.
- **Specific → general:** solve one concrete case, notice the pattern, then state the general rule.
- **Wrong → less wrong → right:** show the obvious approach, show where it fails, then refine it.
- **Build up → payoff:** simple pieces combine into something surprising.
- **Two views → one idea:** show the idea algebraically and geometrically, then reveal that they are the same.

Use one analogy per lesson, and keep it.

## Visual metaphors

| Idea | Picture |
|---|---|
| Vector | An arrow; addition is tip to tail, and scaling stretches it |
| Function | A machine: input in, output out; or a curve with a point you drag |
| Matrix | A grid being stretched; watch where the two basis arrows land |
| Derivative | A tangent line; zoom in until the curve looks straight |
| Integral | Rectangles under a curve that get thinner and fill the area |
| Probability | A count of filled squares out of ten or a hundred |
| Distribution | A cloud of dots, then the curve that outlines it |
| Optimisation | A ball rolling to the bottom of a valley or surface |
| Hash or lookup | A shelf, and an arrow from the computed number to one slot |
| Growth in dimensions | A line, then a square, then a cube, with counts under each |

## Building a slide

- Design the finished frame first; the animation only decides the order in which things appear.
- Keep to about 3–5 main elements on a slide.
- For diagrams, reveal the nodes, then the edges, then the labels.
- Focus plus context: the active part is bright, and everything else dims to about a third.
- Have one loud thing at a time. Never run two counters at once.
- Hold the final state; do not loop a build.

## Networks, trees, and groups

Draw a network only when the idea is about connections, such as graph search, Markov chains, neural-network wiring, attention links, or dependencies.

- Label at most about 12 nodes, and place them by hand. A backdrop of many faint unlabelled dots is fine when "many" is the point.
- **Density, then focus:** show everything faint, then light one node and its links in yellow and dim the rest.
- Clicking a node lights its links and updates one readout. Never add a sidebar, a legend list, or a search box.
- Encode size as importance, thickness as strength, and a dashed line as uncertainty. Put a verb on every labelled link.
- Show a group with a faint shaded hull behind its members, labelled directly.
- For a hierarchy, grow the tree one level per beat out of its parent, and show counts on folded nodes ("+95").
- Use a force layout (d3-force) only when the clustering itself is the lesson. Let it settle before the first frame.
- For a recap, a hand-made map of the lesson's 4–7 ideas, with verbs on the links, works well. It also makes a good check: the learner picks the missing verb, with "I don't know" as an option.

## Common mistakes

| Mistake | Fix |
|---|---|
| The first slide is a definition or a formula | Start with a familiar object or situation |
| Two unrelated diagrams in one lesson run | Keep one held picture and transform it, or split the lesson |
| A slide only adds text | Merge it, or make the picture change |
| A slider with no cue | Add "watch what happens to…" |
| A readout computed separately from the picture | Draw both from one state |
| Labels in a legend box | Put each label next to its object |

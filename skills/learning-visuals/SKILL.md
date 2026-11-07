---
name: learning-visuals
description: Use when the user asks for a lesson, explainer, or visual explanation as an HTML page, or when a lesson would teach better as an animated, interactive visual. Produces one self-contained HTML lesson for self-study: clear pictures in the style of a maths and science explainer video, with short, plain explanations.
---

# Learning visuals

Make one HTML file that teaches one topic with the look of a good maths explainer video: a dark stage, one picture per slide, motion that shows what changes, and controls the learner can move. The learner opens the file in a desktop browser and studies it alone, with no narrator and no chat beside it. Later the learner brings questions and exported answers back to the chat.

## The look

The main failure to avoid is a page that looks like a dashboard or a document: cards, tiles, stat rows, legends, bullet lists, and small text everywhere. The picture carries the idea, and the text explains the picture.

- **One picture per slide, centred.** A large drawing fills most of the stage, centred on the stage's middle (x = 800). If a readout or panel sits beside it, centre the whole group, or better, put the readout next to the control or object it belongs to instead of pushing the picture aside. Roughly a third of the stage stays empty black.
- **The title names what the slide explains**, in plain words: a question the slide answers ("What happens when the steps get bigger?") or a plain description ("Writing one step as a formula"). Never a slogan, a teaser, or a metaphor that the learner has not seen explained yet. The topic and progress sit in a small breadcrumb centred above the title; the kit draws it and centres the title.
- **Say what is being learned.** The first slide states the lesson's goal and why it matters in one muted line (`lv-sub`). Extra context that does not deserve its own slide goes in a pull-up pane (`lv-more`); the learner reveals it from a notch at the bottom edge. The pane follows the same rules as a slide, so it can hold a small picture or an equation, not only text.
- **Text is large and sits below the picture**, never scattered over it. No text below 20 stage units (1600 × 900 stage). Tooltips hold details that only some learners need.
- **Label things where they are.** Labels, numbers, and readouts sit next to the object they describe. A readout is part of the picture, not a separate row of figures. No legends.
- **Show the numbers in maths topics.** Write the function on the picture, and show live exact values beside the objects: the slope at a point, the position, key points such as a minimum or vertex.
- **Colour means one thing per lesson.** Pick the meanings first (for example blue is the quantity, red is evidence, yellow is "look here") and keep them in the formula, the picture, and the labels. Do not rely on colour alone; also vary shape, line style, or label. Once a formula introduces a symbol, label the matching part of the picture with that symbol too (η on the step, dE/dw on the slope line), so that the learner can match each term to what it stands for.
- **Icons and emoji are welcome when they help understanding.** Use one consistent set per lesson, and let each icon always mean the same thing.
- **Concrete before abstract.** Start with a familiar object or situation. The formula is earned a few slides in, never on slide 1, and a definition is never the opening.

Read [style.md](references/style.md) for the palette, type sizes, shapes, and example layouts from the reference videos.

## Write like a tutor

There is no narrator, so the text on each slide does the narrator's job. Write it the way a patient tutor would explain the picture to someone sitting beside them.

- Each slide has an explanation of two to four full sentences (`lv-text`, about 30–60 words; more does not fit below the picture). It says what the picture shows, what changed since the last slide, and why it matters. Start from what the learner can see: "The blue line shows how steep the curve is under the ball."
- Connect the sentences. Use words such as "because", "so", "which means", "when", and "this is why", so that each sentence follows from the one before. Connect each slide to the previous one and to the goal.
- Explain an idea in ordinary words before giving its name: "this steepness is called the slope." A term that the lesson builds on, such as "setting" or "parameter", gets its own explanation and picture before the lesson uses it; a name mentioned in passing is not enough.
- Refer only to things that are on screen or have been explained. Do not use a metaphor or a name ("the walking rule") that the text has not set up.
- Avoid hook lines, slogans, and dramatic fragments such as "The same walk, written as one rule." Plain, complete sentences teach better than catchy ones.
- An interactive slide also tells the learner what to try and what to watch: "Drag the slider and watch the step count. Try a value above 1."
- Keep each slide to one idea, so that the explanation stays short without being cryptic. When an idea needs more than about 60 words, split it across slides or move the extra into the `lv-more` pane.

## Plan the lesson

Before writing code, write a short plan in your reply:

1. **The aha** in one sentence: what the learner should see by the end.
2. **One line per slide:** the title, the picture, what changes from the previous slide, and the control or check if any.

A complete lesson opens with an introduction of one or two slides: what the learner will be able to do by the end, why it is worth learning, and where they will meet it. It then starts from what the learner already knows, and shows why the new idea is needed before introducing it, for example by trying the obvious approach first and seeing it fail or get too slow. The example lesson is a short excerpt, so do not copy its length or its opening.

Slide count depends on the topic: how many concepts it has, and how much practice and synthesis it needs. A good default arc is: puzzle (a concrete question) → explore (move something and watch) → name (the term or formula appears, morphing from the picture) → check → combine. Keep **one held picture** across a run of slides and transform it, rather than switching to a new unrelated diagram. Every slide must visibly change something; a slide that only adds words is not a slide. A formula never stands alone: show it next to the picture it describes, with each term coloured like the part of the picture it stands for, and show the words version and the symbol version on the same slide (morph one into the other). Never write a formula only as a sentence ("square each miss, add them up, and divide by 6"); write the equation, and let the sentence explain it.

[patterns.md](references/patterns.md) lists narrative arcs, visual metaphors, and network or tree patterns.

## Motion

Motion shows what changed and why. Always animate; do not read or follow the browser's reduced-motion setting.

- Reveal a slide in beats, in the order of the explanation (scene, question object, rule, result, formula). The learner advances beats with the same Next action that changes slides.
- Objects move or morph from one state to the next so the eye can track them; they do not pop in and out. Formulas morph term by term (`LV.morph`), and strokes draw on (`LV.draw`).
- Ease in and out, with no bounce or overshoot. One main movement at a time. Slow down at the key insight.
- Dim finished parts (`.lv-dimmed`) instead of deleting them.
- Loop only the phenomenon itself, such as particles drifting or a ball rolling, and only while its slide is shown (`LV.loop`).

## Interaction

Interactive exploration is the default. Let the learner change an input and watch the effect.

- The slide's text says what to try and what to watch. Keep to a few controls per slide.
- Every control changes the picture and its readout immediately, both computed from one shared state.
- The default state already shows the main idea before anything is touched.
- Hovering over a part of the picture, or over a tricky word in the caption, shows a tooltip (`data-tip`). A click pins it open. A tooltip must match what is on screen now: when the state changes, update its text with the current values. Put important tooltips on something that does not move, such as a caption word, as well as on moving objects.
- Clicking near the right edge of the window goes forward, and near the left edge goes back; a notch with an arrow slides in when the pointer gets close. Arrow keys work too. The kit ignores clicks on controls, tooltips, and checks.

## Checks

Put checks in the page. Vary the kind: choose, predict, find the error, explain, apply to a new example. Test understanding, not arithmetic, unless arithmetic is the topic.

- Every check shows a picture of the situation it asks about, and the picture changes to match a follow-up check (listen for the `lv:answer` event).
- The kit adds an "I don't know" choice to every check.
- After an answer, the page reveals the right one with a one-line reason. A wrong pick or "I don't know" also shows a hint and opens a similar follow-up check (`data-followup`).
- Answers are recorded. "Export answers" copies them as JSON for the learner to paste into the chat. When the learner pastes them, review the answers and reasoning, and address specific gaps.
- End the lesson with a short recap of the earlier pictures and one task that combines the ideas.

## Build

- Output one complete `.html` document with CSS and JavaScript inline. Use English.
- Copy [kit.css](references/kit.css) and [kit.js](references/kit.js) into the page unchanged, and follow the markup in [kit-api.md](references/kit-api.md). [example-lesson.html](assets/example-lesson.html) shows a working four-slide lesson.
- Prefer plain SVG, Canvas 2D, and the kit. Pinned libraries from cdnjs or jsDelivr are allowed when they clearly help, such as KaTeX for heavy maths, three.js for real 3D, or D3 for scales. Pin an exact version, and fall back to a simpler view if the load fails.
- Use 3D only when the idea is 3D or higher-dimensional, such as a loss surface. Read [three-notes.md](references/three-notes.md) before using three.js.
- Design for a desktop browser window. Phones are out of scope.
- Do not use sound.
- After building, re-read the page against [pitfalls.md](references/pitfalls.md) if the maths is complex or a smaller model built it. If the learner reports a broken page and a browser is available, open it, use every control, and fix what fails.

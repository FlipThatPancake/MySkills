---
name: comment-mode
description: "Use when an HTML page the user will read, such as a lesson or prototype, should let them leave Figma-style pinned comments and export them as JSON to paste into the chat."
---

# Comment mode

## Toolbar placement

The toolbar must not cover the page's own controls. If the project already has pages with comment mode, reuse their `toolbar` value from the install block. Otherwise, before the first install, ask the user where it goes: one question with the six spots (`top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`), what each would cover on this page, and your recommendation.

## Install

Run `node <skill folder>/add.mjs --toolbar=<spot> page.html`. It inlines [comment-mode.js](comment-mode.js) before the closing body tag and replaces an earlier copy, so the page stays a single file. Where Node is unavailable, paste the file's contents into a script tag at the end of the body between `<!-- comment-mode:start -->` and `<!-- comment-mode:end -->`, after `window.commentModeOptions = { toolbar: '<spot>' };`. Never rewrite the script; if it needs a change, change the kit.

Hovering highlights what a comment attaches to: one line of text, a text block, an image, a control, an SVG shape, a formula, or empty space. Give key visuals a name with `data-comment="Force arrow"` so the export names them instead of describing their shape.

Optional page hooks, defined before the install block:
- `window.commentContext = () => ({ ... })` for state that changes what a comment means, such as the current slide or a slider value. It is stored with each comment.
- `window.commentExtras = () => ({ ... })` for other data the user should send along, such as quiz answers. It is added to the export once, as `extras`.

## Reading the export

The user presses C to comment, clicks to pin, and uses Copy JSON to paste every comment into the chat.
- `target` says what they pointed at: its `type`, its `name` from `data-comment`, and its `text`, which for a text line is that exact line. `selector` and `section` locate it. Edit that, not a guess.
- `positionInTarget` is a percentage inside the target's element.
- `context` and `extras` hold what the page hooks returned.

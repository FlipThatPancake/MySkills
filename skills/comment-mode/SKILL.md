---
name: comment-mode
description: "Use when an HTML page the user will read, such as a lesson or prototype, should let them leave Figma-style pinned comments and export them as JSON to paste into the chat."
---

# Comment mode

## Toolbar placement

The toolbar must not cover the page's content or distract from it. If the project already has pages with comment mode, reuse their install options. Otherwise run `node <skill folder>/check.mjs [--theme=agent-default] [--css=<file>] page.html` before the first install. It tries each spot (`top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`) with the buttons in a row and stacked (`--layout=column`), lists what each would cover, and prints a recommendation. When several spots cover nothing, it picks a corner, then the first in that list. Install with that and tell the user where the toolbar went. Ask only when every option covers content. Without Playwright, judge from the page and say so.

## Install

Run `node <skill folder>/add.mjs --toolbar=<spot> [--layout=column] [--theme=agent-default] [--css=<file>] page.html`. It inlines [comment-mode.js](comment-mode.js) before the closing body tag and replaces an earlier copy, so the page stays a single file. Where Node is unavailable, paste the file's contents into a script tag at the end of the body between `<!-- comment-mode:start -->` and `<!-- comment-mode:end -->`, after `window.commentModeOptions = { toolbar: '<spot>' };` (add `layout: 'column'` for stacked buttons). Never rewrite the script; if it needs a change, change the kit.

After installing, run `node <skill folder>/test.mjs page.html` and fix every failure before handing the page over. It clicks past a first-visit dialog by itself; for another kind of first-visit screen, add `--setup='<JS that dismisses it>'`.

Select text to comment on exact words, or click anything the hover outline shows: a line of text, a text block, an image, a control, an SVG shape, a formula, or empty space. With comment mode off, only the toggle stays, plus a download button showing how many comments are unsaved. The look is the `author` theme ([themes/author.css](themes/author.css)) unless `--theme=agent-default` is given. `agent-default` keeps the plain look built into comment-mode.js: use it when the agent should choose the look, and fit the toolbar to the page with CSS passed as `--css=<file>`, aimed at the classes in that script's style block. Give key visuals a name with `data-comment="Force arrow"` so the export names them instead of describing their shape.

Optional page hooks, defined before the install block:
- `window.commentContext = () => ({ ... })` for state that changes what a comment means, such as the current slide or a slider value. It is stored with each comment.
- `window.commentExtras = () => ({ ... })` for other data the user should send along, such as quiz answers. It is added to the export once, as `extras`.

## Reading the export

The user presses C to comment and uses Copy JSON to paste every comment into the chat. Download saves the same JSON as a file.
- `target` says what they pointed at: its `type`, its `name` from `data-comment`, and its `text`, which for selected text or a text line is those exact words. `selector` and `section` locate it. Edit that, not a guess.
- `positionInTarget` is a percentage inside the target's element. A text selection has none.
- `context` and `extras` hold what the page hooks returned.

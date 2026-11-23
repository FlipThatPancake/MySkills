---
name: talkback
description: "Use when any HTML page or web app the user will look at, such as a website, prototype or tool, should let them leave Figma-style pinned comments (Talkback) and export them as JSON to paste into the chat."
---

# Talkback

## Toolbar placement

The toolbar must not cover the page's content or distract from it. If the project already has pages with Talkback, reuse their install options. Otherwise run `node <skill folder>/check.mjs [--theme=agent-default] [--css=<file>] page.html` before the first install. It tries each spot (`top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`) with the buttons in a row and stacked (`--layout=column`), lists what each would cover, and prints a recommendation. When several spots cover nothing, it picks a corner, then the first in that list. Install with that and tell the user where the toolbar went. Ask only when every option covers content. Without Playwright, judge from the page and say so.

## Install

Run `node <skill folder>/add.mjs --toolbar=<spot> [--layout=column] [--theme=agent-default] [--css=<file>] page.html`. It inlines [talkback.js](talkback.js) before the closing body tag and replaces an earlier copy, including one from the old comment-mode name, so the page stays a single file. Where Node is unavailable, paste the file's contents into a script tag at the end of the body between `<!-- talkback:start -->` and `<!-- talkback:end -->`, after `window.talkbackOptions = { toolbar: '<spot>' };` (add `layout: 'column'` for stacked buttons). Never rewrite the script; if it needs a change, change the kit.

After installing, run `node <skill folder>/test.mjs page.html` and fix every failure before handing the page over. It clicks past a first-visit dialog by itself; for another kind of first-visit screen, add `--setup='<JS that dismisses it>'`.

Select text to comment on exact words, or click anything the hover outline shows: a line of text, a text block, an image, a control, an SVG shape, a formula, or empty space. With Talkback off, only the toggle stays, plus a download button showing how many comments are unsaved. The look is the `author` theme ([themes/author.css](themes/author.css)) unless `--theme=agent-default` is given. `agent-default` keeps the plain look built into talkback.js: use it when the agent should choose the look, and fit the toolbar to the page with CSS passed as `--css=<file>`, aimed at the classes in that script's style block. Give key visuals a name with `data-comment="Force arrow"` so the export names them instead of describing their shape.

Optional page hooks, defined before the install block:
- `window.commentContext = () => ({ ... })` for state that changes what a comment means, such as the open tab or a slider value. It is stored with each comment.
- `window.commentExtras = () => ({ ... })` for other data the user should send along, such as quiz answers. It is added to the export once, as `extras`.

## Live

Pick the route your setup allows and tell the user which one it is. Download and Copy JSON work everywhere. On the user's computer, go live:
1. Run `node <skill folder>/live.mjs serve --open page.html` in the background. It serves the page's folder on 127.0.0.1 and prints the link with a secret token; open that link, never the file.
2. Run `node <skill folder>/live.mjs wait` in the background. It returns new messages as JSON (`n`, `target`, `selector`, `quote`, `context`, `messages`, `earlier`) or `{"timeout":true}`; start it again each time it returns.
3. Answer every message with `node <skill folder>/live.mjs reply <n> "text" [--done]`. Ask with concrete options when a message is vague. Use `--done` when the work is finished and the user should check it.
4. When the page changes, the user sees "Updated, reload". `window.commentRestore = ({ context, extras }) => {...}` restores page state (open tab, form values) after that reload.

The user's states, as in blender-talkback: Ready for agent, Agent asks you, Done check it, Resolved. Only the user resolves. The newest message wins. Where Node or a local session is missing, use Download.

## Reading the export

The user presses C to comment and uses Copy JSON to paste every comment into the chat. Download saves the same JSON as a file.
- `target` says what they pointed at: its `type`, its `name` from `data-comment`, and its `text`, which for selected text or a text line is those exact words. `selector` and `section` locate it. Edit that, not a guess.
- `positionInTarget` is a percentage inside the target's element. A text selection has none.
- `context` and `extras` hold what the page hooks returned.
- `conversation` holds the messages exchanged live on that comment.

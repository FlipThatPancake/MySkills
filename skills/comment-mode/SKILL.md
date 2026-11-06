---
name: comment-mode
description: "Use when an HTML page the user will read, such as a lesson or prototype, should let them leave Figma-style pinned comments and export them as JSON to paste into the chat."
---

# Comment mode

Install the kit with `node <skill folder>/add.mjs page.html`. It inlines [comment-mode.js](comment-mode.js) before the closing body tag and replaces an earlier copy, so the page stays a single file. Where Node is unavailable, paste the file's contents into a script tag at the end of the body between `<!-- comment-mode:start -->` and `<!-- comment-mode:end -->`. Never rewrite the script; if it needs a change, change the kit.

The user presses C to comment, clicks to pin, and uses Copy JSON in the toolbar to paste every comment into the chat. When they paste it:
- `section`, `element`, and `selector` tell you what they pointed at. Edit that, not a guess.
- `positionInElement` is a percentage inside that element.
- `context` holds whatever the page reports through `window.commentContext`.

If the page has state that changes what a comment means, such as the current slide or a slider value, define `window.commentContext = () => ({ ... })` before the install block. Its return value is stored with each comment.

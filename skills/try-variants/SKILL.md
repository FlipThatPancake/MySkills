---
name: try-variants
description: Use when the user asks for prototypes, variants, or "a few ideas" of a screen, or wants to try how some logic feels before building it. Builds throwaway versions to compare; any worth comparing again become a setting in the real product.
---

# Try variants

A prototype is throwaway code that answers one question. Pick the kind from the question:

- **"What should this look like?"** Build 3 very different UI variants on one page. Switch between them with a URL parameter (`?variant=1`) and a small floating bar at the bottom of the page. If the target is not a web page, use the nearest equivalent switch (a flag, a menu, a keyboard shortcut).
- **"Does this logic feel right?"** Build one self-contained HTML file with buttons that drive the logic (for example, a delayed start plus a lock), showing the full state after every press.

## Rules

- Make the variants very different from each other: different layout, flow, or idea, not three shades of one design.
- Skip polish: no tests, no error handling, no shared abstractions. State lives in memory.
- Name every prototype file `prototype-<topic>` and put it next to the page it is for, so it is easy to find and delete.
- Do not change the real page or its behaviour while prototyping. Keep any fixed constraints of the real product (for example physical controls that cannot move) and vary only what is free to change.
- When done, tell the user the file and how to open it. If the project needs a build step to view pages, run it first. Mention the `?variant=1` address change for switching.

## When the user picks

- **One variant is the answer:** build it into the real page, delete every prototype file, and record the question and the verdict where the project keeps decisions (for example the commit message).
- **Several are worth comparing again:** build each into the real page as a setting, with today's behaviour as the default, so the user can switch between them later. Delete the prototype files.
- **None:** delete every prototype file and say what the user learned.
